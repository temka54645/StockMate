import { prisma } from "@/lib/db";

interface ScanResult {
  created: number;
  warehouses: number;
}

/** Бүх агуулахын batch болон үлдэгдлийг скан хийж мэдэгдэл үүсгэнэ */
export async function scanAll(): Promise<ScanResult> {
  const today = new Date();
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const todayStr = todayMidnight.toISOString().slice(0, 10);

  const warehouses = await prisma.warehouse.findMany({
    include: {
      notificationSetting: true,
      products: {
        include: {
          batches: { where: { qtyIn: { gt: 0 } } },
        },
      },
    },
  });

  let totalCreated = 0;

  for (const wh of warehouses) {
    const settings = wh.notificationSetting;
    const thresholds = settings?.expiryThresholds ?? [60, 30, 14, 7];
    thresholds.sort((a, b) => b - a); // Буурах дарааллаар

    const notificationsToCreate: Parameters<typeof prisma.notification.create>[0]["data"][] = [];

    for (const product of wh.products) {
      // Үлдэгдэлтэй batch-уудыг шалгана
      for (const batch of product.batches) {
        const stock = batch.qtyIn - batch.qtyOut;
        if (stock <= 0) continue;

        if (batch.expiryDate && product.isPerishable) {
          const daysLeft = Math.ceil(
            (batch.expiryDate.getTime() - todayMidnight.getTime()) / 86400000
          );

          let type: string | null = null;
          let severity: string | null = null;
          let title: string | null = null;
          let body: string | null = null;
          let threshold: number | null = null;

          if (daysLeft < 0) {
            type = "EXPIRED";
            severity = "CRITICAL";
            threshold = 0;
            title = `❌ Дууссан: ${product.name}`;
            body = `Лот ${batch.batchNo} — ${Math.abs(daysLeft)} өдрийн өмнө дуусч, үлдэгдэл: ${stock} ${product.unit}`;
          } else {
            // Хамгийн бага тохирох босгыг олно
            for (const t of thresholds) {
              if (daysLeft <= t) {
                threshold = t;
                break;
              }
            }

            if (threshold !== null) {
              const minThreshold = Math.min(...thresholds);
              if (daysLeft <= minThreshold) {
                severity = "CRITICAL";
              } else if (daysLeft <= 14) {
                severity = "WARNING";
              } else if (daysLeft <= 30) {
                severity = "WARNING";
              } else {
                severity = "NOTICE";
              }
              type = "EXPIRY";
              title = `⚠️ ${daysLeft} хоногт дуусна: ${product.name}`;
              body = `Лот ${batch.batchNo} — ${batch.expiryDate.toISOString().slice(0, 10)}-нд дуусна, үлдэгдэл: ${stock} ${product.unit}`;
            }
          }

          if (type && severity && title && body) {
            const dedupeKey = `${wh.id}:${type}:${batch.id}:${threshold ?? "exp"}:${todayStr}`;
            notificationsToCreate.push({
              warehouseId: wh.id,
              type,
              severity,
              title,
              body,
              productId: product.id,
              batchId: batch.id,
              dedupeKey,
            });
          }
        }
      }

      // Low-stock шалгана
      if (settings?.lowStockEnabled !== false && product.reorderLevel > 0) {
        const totalStock = product.batches.reduce((s, b) => s + b.qtyIn - b.qtyOut, 0);
        if (totalStock <= product.reorderLevel) {
          const dedupeKey = `${wh.id}:LOW_STOCK:${product.id}:${todayStr}`;
          notificationsToCreate.push({
            warehouseId: wh.id,
            type: "LOW_STOCK",
            severity: totalStock <= 0 ? "CRITICAL" : "WARNING",
            title: `📦 Дахин захиалах: ${product.name}`,
            body: `Үлдэгдэл: ${totalStock} ${product.unit} (доод хязгаар: ${product.reorderLevel} ${product.unit})`,
            productId: product.id,
            batchId: null,
            dedupeKey,
          });
        }
      }
    }

    // Idempotent upsert — давхардлаас сэргийлнэ
    for (const notif of notificationsToCreate) {
      try {
        const created = await prisma.notification.upsert({
          where: { dedupeKey: notif.dedupeKey as string },
          update: {},
          create: notif as Parameters<typeof prisma.notification.create>[0]["data"],
        });

        // Delivery-уудыг үүсгэнэ
        const channels = ["IN_APP"];
        if (settings?.emailEnabled) channels.push("EMAIL");
        if (settings?.pushEnabled) channels.push("PUSH");

        const existingDeliveries = await prisma.notificationDelivery.findMany({
          where: { notificationId: created.id },
          select: { channel: true },
        });
        const existingChannels = new Set(existingDeliveries.map((d) => d.channel));

        const newDeliveries = channels
          .filter((c) => !existingChannels.has(c))
          .map((channel) => ({
            notificationId: created.id,
            channel,
            status: "PENDING",
          }));

        if (newDeliveries.length > 0) {
          await prisma.notificationDelivery.createMany({ data: newDeliveries });
          totalCreated++;
        }
      } catch {
        // dedupeKey давхардал — алгасна
      }
    }
  }

  return { created: totalCreated, warehouses: warehouses.length };
}

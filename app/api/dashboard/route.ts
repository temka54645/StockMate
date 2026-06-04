import { prisma } from "@/lib/db";
import { requireWarehouseId, UnauthorizedError } from "@/lib/auth-helpers";

export async function GET() {
  try {
    const { warehouseId } = await requireWarehouseId();
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);

    // Сарын эхлэл
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const [
      products,
      monthlyIns,
      monthlyOuts,
      recentNotifications,
      monthlySeries,
    ] = await Promise.all([
      // Бүх бараа + batch-тай
      prisma.product.findMany({
        where: { warehouseId },
        include: {
          batches: { select: { qtyIn: true, qtyOut: true, expiryDate: true } },
        },
      }),
      // Сарын орлого
      prisma.stockIn.aggregate({
        where: { warehouseId, date: { gte: monthStart } },
        _sum: { qty: true },
      }),
      // Сарын зарлага
      prisma.stockOut.aggregate({
        where: { warehouseId, date: { gte: monthStart } },
        _sum: { qty: true },
      }),
      // Сүүлийн 5 мэдэгдэл
      prisma.notification.findMany({
        where: { warehouseId },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      // 6 сарын хөдөлгөөн
      getMonthlySeries(warehouseId),
    ]);

    const today0 = new Date(todayStr);
    let totalStock = 0, stockValue = 0, lowStockCount = 0, nearExpiryCount = 0, expiredCount = 0;

    for (const p of products) {
      const stock = p.batches.reduce((s, b) => s + b.qtyIn - b.qtyOut, 0);
      totalStock += stock;
      stockValue += stock * p.unitPrice;
      if (stock <= p.reorderLevel && p.reorderLevel > 0) lowStockCount++;

      for (const b of p.batches) {
        if (!b.expiryDate || b.qtyIn - b.qtyOut <= 0) continue;
        const days = Math.ceil((b.expiryDate.getTime() - today0.getTime()) / 86400000);
        if (days < 0) expiredCount++;
        else if (days <= 30) nearExpiryCount++;
      }
    }

    const unreadCount = await prisma.notification.count({
      where: { warehouseId, readAt: null },
    });

    return Response.json({
      totalProducts: products.length,
      totalStock,
      stockValue,
      lowStockCount,
      nearExpiryCount,
      expiredCount,
      monthlyIn: monthlyIns._sum.qty ?? 0,
      monthlyOut: monthlyOuts._sum.qty ?? 0,
      unreadNotifications: unreadCount,
      recentNotifications,
      monthlySeries,
    });
  } catch (err) {
    if (err instanceof UnauthorizedError) return Response.json({ error: "Нэвтрэх шаардлагатай" }, { status: 401 });
    return Response.json({ error: "Серверийн алдаа" }, { status: 500 });
  }
}

async function getMonthlySeries(warehouseId: string) {
  const months: { month: string; in: number; out: number }[] = [];
  const now = new Date();

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
    const label = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}`;

    const [ins, outs] = await Promise.all([
      prisma.stockIn.aggregate({
        where: { warehouseId, date: { gte: d, lte: end } },
        _sum: { qty: true },
      }),
      prisma.stockOut.aggregate({
        where: { warehouseId, date: { gte: d, lte: end } },
        _sum: { qty: true },
      }),
    ]);

    months.push({
      month: label,
      in: ins._sum.qty ?? 0,
      out: outs._sum.qty ?? 0,
    });
  }
  return months;
}

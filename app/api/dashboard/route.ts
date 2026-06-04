import { prisma } from "@/lib/db";
import { requireWarehouseId, UnauthorizedError } from "@/lib/auth-helpers";

export async function GET() {
  try {
    const { warehouseId } = await requireWarehouseId();
    const now = new Date();
    const monthStart   = new Date(now.getFullYear(), now.getMonth(), 1);
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const [
      products,
      warehouse,
      monthlyIns,
      monthlyOuts,
      unreadCount,
      recentNotifications,
      inSeries,
      outSeries,
    ] = await Promise.all([
      // 1. Бараа + batch
      prisma.product.findMany({
        where: { warehouseId },
        select: {
          category: true,
          unitPrice: true,
          reorderLevel: true,
          batches: { select: { qtyIn: true, qtyOut: true, expiryDate: true } },
        },
      }),

      // 2. Агуулахын мэдээлэл (capacity)
      prisma.warehouse.findUnique({
        where: { id: warehouseId },
        select: { name: true, capacity: true, capacityUnit: true },
      }),

      // 3. Сарын орлого
      prisma.stockIn.aggregate({
        where: { warehouseId, date: { gte: monthStart } },
        _sum: { qty: true },
      }),

      // 4. Сарын зарлага
      prisma.stockOut.aggregate({
        where: { warehouseId, date: { gte: monthStart } },
        _sum: { qty: true },
      }),

      // 5. Уншаагүй мэдэгдэл
      prisma.notification.count({ where: { warehouseId, readAt: null } }),

      // 6. Сүүлийн 5 мэдэгдэл
      prisma.notification.findMany({
        where: { warehouseId },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, title: true, body: true, severity: true, createdAt: true },
      }),

      // 7. 6 сарын орлого — нэг raw query
      prisma.$queryRaw<Array<{ month: Date; total: number }>>`
        SELECT date_trunc('month', date) AS month,
               COALESCE(SUM(qty), 0)    AS total
        FROM   "StockIn"
        WHERE  "warehouseId" = ${warehouseId}
          AND  date >= ${sixMonthsAgo}
        GROUP  BY 1 ORDER BY 1
      `,

      // 8. 6 сарын зарлага — нэг raw query
      prisma.$queryRaw<Array<{ month: Date; total: number }>>`
        SELECT date_trunc('month', date) AS month,
               COALESCE(SUM(qty), 0)    AS total
        FROM   "StockOut"
        WHERE  "warehouseId" = ${warehouseId}
          AND  date >= ${sixMonthsAgo}
        GROUP  BY 1 ORDER BY 1
      `,
    ]);

    // ── Бараа статистик ──────────────────────────────────────────────
    const today0 = new Date(now.toISOString().slice(0, 10));
    let totalProducts = 0, totalStock = 0, stockValue = 0;
    let lowStockCount = 0, nearExpiryCount = 0, expiredCount = 0;

    // Ангилал тус бүрийн нийт үлдэгдэл (fill breakdown-д хэрэглэнэ)
    const categoryMap = new Map<string, number>();

    for (const p of products) {
      totalProducts++;
      const stock = p.batches.reduce((s, b) => s + b.qtyIn - b.qtyOut, 0);
      totalStock += stock;
      stockValue += stock * p.unitPrice;
      if (p.reorderLevel > 0 && stock <= p.reorderLevel) lowStockCount++;

      const cat = p.category || "Бусад";
      categoryMap.set(cat, (categoryMap.get(cat) ?? 0) + stock);

      for (const b of p.batches) {
        if (!b.expiryDate || b.qtyIn - b.qtyOut <= 0) continue;
        const days = Math.ceil((b.expiryDate.getTime() - today0.getTime()) / 86_400_000);
        if (days < 0) expiredCount++;
        else if (days <= 30) nearExpiryCount++;
      }
    }

    // Ангилал жагсаалт — их эзлэхүүнээс нь эрэмблэнэ
    const categoryBreakdown = Array.from(categoryMap.entries())
      .map(([name, qty]) => ({ name, qty }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 8); // дээд тал 8

    // Дүүргэлт
    const capacity     = warehouse?.capacity ?? null;
    const capacityUnit = warehouse?.capacityUnit ?? "нэгж";
    const fillPercent  = capacity && capacity > 0
      ? Math.min(100, Math.round((totalStock / capacity) * 100))
      : null;

    // ── 6 сарын цуваа ────────────────────────────────────────────────
    const monthlySeries = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const label = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}`;
      const matchMonth = (row: { month: Date }) => {
        const m = new Date(row.month);
        return m.getFullYear() === d.getFullYear() && m.getMonth() === d.getMonth();
      };
      return {
        month: label,
        in:  Number(inSeries.find(matchMonth)?.total  ?? 0),
        out: Number(outSeries.find(matchMonth)?.total ?? 0),
      };
    });

    return Response.json({
      totalProducts,
      totalStock,
      stockValue,
      lowStockCount,
      nearExpiryCount,
      expiredCount,
      monthlyIn:  monthlyIns._sum.qty  ?? 0,
      monthlyOut: monthlyOuts._sum.qty ?? 0,
      unreadNotifications: unreadCount,
      recentNotifications,
      monthlySeries,
      // Дүүргэлт
      capacity,
      capacityUnit,
      fillPercent,
      categoryBreakdown,
    });
  } catch (err) {
    if (err instanceof UnauthorizedError)
      return Response.json({ error: "Нэвтрэх шаардлагатай" }, { status: 401 });
    console.error("[dashboard]", err);
    return Response.json({ error: "Серверийн алдаа" }, { status: 500 });
  }
}

import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireWarehouseId, UnauthorizedError } from "@/lib/auth-helpers";

export async function GET(req: NextRequest) {
  try {
    const { warehouseId } = await requireWarehouseId();
    const { searchParams } = req.nextUrl;
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const category = searchParams.get("category");

    const products = await prisma.product.findMany({
      where: {
        warehouseId,
        ...(category ? { category } : {}),
      },
      include: {
        batches: {
          include: {
            stockIns: {
              where: {
                ...(from || to ? {
                  date: {
                    ...(from ? { gte: new Date(from) } : {}),
                    ...(to ? { lte: new Date(to + "T23:59:59") } : {}),
                  },
                } : {}),
              },
            },
            stockOuts: {
              where: {
                ...(from || to ? {
                  date: {
                    ...(from ? { gte: new Date(from) } : {}),
                    ...(to ? { lte: new Date(to + "T23:59:59") } : {}),
                  },
                } : {}),
              },
            },
          },
        },
      },
      orderBy: { name: "asc" },
    });

    const today = new Date();

    const rows = products.map((p) => {
      const totalQtyIn = p.batches.reduce(
        (s, b) => s + b.stockIns.reduce((ss, si) => ss + si.qty, 0),
        0
      );
      const totalQtyOut = p.batches.reduce(
        (s, b) => s + b.stockOuts.reduce((ss, so) => ss + so.qty, 0),
        0
      );
      const totalStock = p.batches.reduce((s, b) => s + b.qtyIn - b.qtyOut, 0);
      const stockValue = totalStock * p.unitPrice;
      const totalInValue = p.batches.reduce(
        (s, b) => s + b.stockIns.reduce((ss, si) => ss + si.qty * si.unitPrice, 0),
        0
      );

      // Хамгийн ойрын дуусах хугацаа
      const activeBatches = p.batches
        .filter((b) => b.qtyIn - b.qtyOut > 0 && b.expiryDate)
        .sort((a, b) => (a.expiryDate!.getTime() - b.expiryDate!.getTime()));

      const nearestExpiry = activeBatches[0]?.expiryDate ?? null;
      const daysToExpiry = nearestExpiry
        ? Math.ceil((nearestExpiry.getTime() - today.getTime()) / 86400000)
        : null;

      let expiryStatus: "normal" | "notice" | "warning" | "critical" | "expired" = "normal";
      if (daysToExpiry !== null) {
        if (daysToExpiry < 0) expiryStatus = "expired";
        else if (daysToExpiry <= 7) expiryStatus = "critical";
        else if (daysToExpiry <= 14) expiryStatus = "warning";
        else if (daysToExpiry <= 30) expiryStatus = "notice";
        else if (daysToExpiry <= 60) expiryStatus = "notice";
      }

      const stockStatus = totalStock <= 0 ? "empty" : totalStock <= p.reorderLevel ? "low" : "ok";

      return {
        productId: p.id,
        code: p.code,
        name: p.name,
        unit: p.unit,
        category: p.category,
        unitPrice: p.unitPrice,
        reorderLevel: p.reorderLevel,
        isPerishable: p.isPerishable,
        totalQtyIn,
        totalQtyOut,
        totalStock,
        stockValue,
        totalInValue,
        nearestExpiry: nearestExpiry?.toISOString() ?? null,
        daysToExpiry,
        expiryStatus,
        stockStatus,
        activeBatchCount: activeBatches.length,
        batches: p.batches.map((b) => ({
          id: b.id,
          batchNo: b.batchNo,
          expiryDate: b.expiryDate?.toISOString() ?? null,
          stock: b.qtyIn - b.qtyOut,
          qtyIn: b.qtyIn,
          qtyOut: b.qtyOut,
        })),
      };
    });

    return Response.json(rows);
  } catch (err) {
    if (err instanceof UnauthorizedError) return Response.json({ error: "Нэвтрэх шаардлагатай" }, { status: 401 });
    return Response.json({ error: "Серверийн алдаа" }, { status: 500 });
  }
}

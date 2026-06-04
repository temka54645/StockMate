import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireWarehouseId, UnauthorizedError } from "@/lib/auth-helpers";
import { getFefoBatches, allocateFifo } from "@/lib/fefo";
import { z } from "zod";

const stockOutSchema = z.object({
  productId: z.string().min(1),
  date: z.string(),
  qty: z.number().positive("Тоо хэмжээ 0-ээс их байх ёстой"),
  recipient: z.string().max(200).optional(),
  docNo: z.string().max(100).optional(),
  // FEFO-гоор нэг batch-аас гаргах үед batchId өгч болно
  batchId: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const { warehouseId } = await requireWarehouseId();
    const { searchParams } = req.nextUrl;
    const productId = searchParams.get("productId");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const stockOuts = await prisma.stockOut.findMany({
      where: {
        warehouseId,
        ...(productId ? { productId } : {}),
        ...(from || to ? {
          date: {
            ...(from ? { gte: new Date(from) } : {}),
            ...(to ? { lte: new Date(to + "T23:59:59") } : {}),
          },
        } : {}),
      },
      include: {
        product: { select: { code: true, name: true, unit: true } },
        batch: { select: { batchNo: true, expiryDate: true } },
      },
      orderBy: { date: "desc" },
      take: 200,
    });
    return Response.json(stockOuts);
  } catch (err) {
    if (err instanceof UnauthorizedError) return Response.json({ error: "Нэвтрэх шаардлагатай" }, { status: 401 });
    return Response.json({ error: "Серверийн алдаа" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { warehouseId, userId } = await requireWarehouseId();
    const body = await req.json();
    const data = stockOutSchema.parse(body);

    const product = await prisma.product.findFirst({
      where: { id: data.productId, warehouseId },
    });
    if (!product) return Response.json({ error: "Бараа олдсонгүй" }, { status: 404 });

    // Үлдэгдэл хангалттай эсэх шалгана
    const batches = await getFefoBatches(data.productId);
    const totalAvailable = batches.reduce((s, b) => s + b.qtyIn - b.qtyOut, 0);
    if (data.qty > totalAvailable) {
      return Response.json({
        error: `Үлдэгдэл хүрэлцэхгүй байна. Боломжтой: ${totalAvailable} ${product.unit}`,
      }, { status: 409 });
    }

    // FEFO хуваарилалт
    const allocations = data.batchId
      ? [{ batchId: data.batchId, qty: data.qty }]
      : allocateFifo(batches, data.qty);

    const stockOuts = await prisma.$transaction(
      allocations.map((alloc) =>
        prisma.stockOut.create({
          data: {
            warehouseId,
            productId: data.productId,
            batchId: alloc.batchId,
            date: new Date(data.date),
            qty: alloc.qty,
            recipient: data.recipient,
            docNo: data.docNo,
            createdBy: userId,
          },
        })
      )
    );

    // Batch qtyOut шинэчлэх
    await prisma.$transaction(
      allocations.map((alloc) =>
        prisma.batch.update({
          where: { id: alloc.batchId },
          data: { qtyOut: { increment: alloc.qty } },
        })
      )
    );

    return Response.json(stockOuts, { status: 201 });
  } catch (err) {
    if (err instanceof UnauthorizedError) return Response.json({ error: "Нэвтрэх шаардлагатай" }, { status: 401 });
    if (err instanceof z.ZodError) return Response.json({ error: err.issues[0].message }, { status: 400 });
    return Response.json({ error: "Серверийн алдаа" }, { status: 500 });
  }
}

/** FEFO санал — тухайн барааны хамгийн хуучин batch-ийг буцаана */
export async function GET_FEFO(req: NextRequest) {
  try {
    const { warehouseId } = await requireWarehouseId();
    const productId = req.nextUrl.searchParams.get("productId");
    if (!productId) return Response.json({ error: "productId шаардлагатай" }, { status: 400 });

    const product = await prisma.product.findFirst({ where: { id: productId, warehouseId } });
    if (!product) return Response.json({ error: "Олдсонгүй" }, { status: 404 });

    const batches = await getFefoBatches(productId);
    return Response.json(batches);
  } catch (err) {
    if (err instanceof UnauthorizedError) return Response.json({ error: "Нэвтрэх шаардлагатай" }, { status: 401 });
    return Response.json({ error: "Серверийн алдаа" }, { status: 500 });
  }
}

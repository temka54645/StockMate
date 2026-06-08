import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireWarehouseId, UnauthorizedError } from "@/lib/auth-helpers";
import { writeLog } from "@/lib/log";
import { z } from "zod";

const stockInSchema = z.object({
  productId: z.string().min(1),
  batchNo: z.string().min(1, "Лотын дугаар шаардлагатай"),
  expiryDate: z.string().nullable().optional(),
  date: z.string(),
  qty: z.number().positive("Тоо хэмжээ 0-ээс их байх ёстой"),
  unitPrice: z.number().min(0).default(0),
  supplier: z.string().max(200).optional(),
  docNo: z.string().max(100).optional(),
});

export async function GET(req: NextRequest) {
  try {
    const { warehouseId } = await requireWarehouseId();
    const { searchParams } = req.nextUrl;
    const productId = searchParams.get("productId");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const stockIns = await prisma.stockIn.findMany({
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
    return Response.json(stockIns);
  } catch (err) {
    if (err instanceof UnauthorizedError) return Response.json({ error: "Нэвтрэх шаардлагатай" }, { status: 401 });
    return Response.json({ error: "Серверийн алдаа" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { warehouseId, userId, userName } = await requireWarehouseId();
    const body = await req.json();
    const data = stockInSchema.parse(body);

    // Барааг энэ агуулахад хамааралтай эсэх шалгана
    const product = await prisma.product.findFirst({
      where: { id: data.productId, warehouseId },
    });
    if (!product) return Response.json({ error: "Бараа олдсонгүй" }, { status: 404 });

    const expiryDate = data.expiryDate ? new Date(data.expiryDate) : null;

    // Batch олох эсвэл үүсгэх
    let batch = await prisma.batch.findFirst({
      where: {
        productId: data.productId,
        batchNo: data.batchNo,
        expiryDate: expiryDate,
      },
    });

    const stockIn = await prisma.$transaction(async (tx) => {
      if (!batch) {
        batch = await tx.batch.create({
          data: {
            productId: data.productId,
            batchNo: data.batchNo,
            expiryDate,
            qtyIn: data.qty,
            qtyOut: 0,
          },
        });
      } else {
        await tx.batch.update({
          where: { id: batch.id },
          data: { qtyIn: { increment: data.qty } },
        });
      }

      return tx.stockIn.create({
        data: {
          warehouseId,
          productId: data.productId,
          batchId: batch!.id,
          date: new Date(data.date),
          qty: data.qty,
          unitPrice: data.unitPrice,
          supplier: data.supplier,
          docNo: data.docNo,
          createdBy: userId,
        },
        include: {
          product: { select: { code: true, name: true, unit: true } },
          batch: { select: { batchNo: true, expiryDate: true } },
        },
      });
    });

    writeLog({
      warehouseId,
      userId,
      userName,
      action: "STOCK_IN",
      entityName: product.name,
      qty: data.qty,
      details: JSON.stringify({ supplier: data.supplier, docNo: data.docNo, batchNo: data.batchNo }),
    });

    return Response.json(stockIn, { status: 201 });
  } catch (err) {
    if (err instanceof UnauthorizedError) return Response.json({ error: "Нэвтрэх шаардлагатай" }, { status: 401 });
    if (err instanceof z.ZodError) return Response.json({ error: err.issues[0].message }, { status: 400 });
    return Response.json({ error: "Серверийн алдаа" }, { status: 500 });
  }
}

import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireWarehouseId, UnauthorizedError } from "@/lib/auth-helpers";
import { writeLog } from "@/lib/log";
import { z } from "zod";

const productSchema = z.object({
  code: z.string().min(1, "Код шаардлагатай").max(50),
  name: z.string().min(1, "Нэр шаардлагатай").max(200),
  unit: z.string().min(1).max(30).default("ш"),
  category: z.string().max(100).default("Ерөнхий"),
  unitPrice: z.number().min(0).default(0),
  reorderLevel: z.number().min(0).default(0),
  isPerishable: z.boolean().default(false),
  imageUrl: z.string().nullable().optional(),
  barcode: z.string().max(100).nullable().optional(),
  location: z.string().max(100).nullable().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const { warehouseId } = await requireWarehouseId();
    const { searchParams } = req.nextUrl;
    const category = searchParams.get("category");
    const search = searchParams.get("q");

    const products = await prisma.product.findMany({
      where: {
        warehouseId,
        ...(category ? { category } : {}),
        ...(search ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { code: { contains: search, mode: "insensitive" } },
            { barcode: { contains: search, mode: "insensitive" } },
          ],
        } : {}),
      },
      include: {
        batches: { select: { qtyIn: true, qtyOut: true, expiryDate: true } },
      },
      orderBy: { name: "asc" },
    });

    const withStock = products.map((p) => ({
      ...p,
      totalStock: p.batches.reduce((s, b) => s + b.qtyIn - b.qtyOut, 0),
    }));

    return Response.json(withStock);
  } catch (err) {
    if (err instanceof UnauthorizedError) return Response.json({ error: "Нэвтрэх шаардлагатай" }, { status: 401 });
    return Response.json({ error: "Серверийн алдаа" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { warehouseId, userId, userName } = await requireWarehouseId();
    const body = await req.json();
    const data = productSchema.parse(body);

    const existing = await prisma.product.findUnique({
      where: { warehouseId_code: { warehouseId, code: data.code } },
    });
    if (existing) {
      return Response.json({ error: "Энэ код аль хэдийн бүртгэлтэй байна" }, { status: 409 });
    }

    const product = await prisma.product.create({
      data: { ...data, warehouseId },
    });

    writeLog({ warehouseId, userId, userName, action: "PRODUCT_CREATE", entityName: product.name });

    return Response.json(product, { status: 201 });
  } catch (err) {
    if (err instanceof UnauthorizedError) return Response.json({ error: "Нэвтрэх шаардлагатай" }, { status: 401 });
    if (err instanceof z.ZodError) return Response.json({ error: err.issues[0].message }, { status: 400 });
    return Response.json({ error: "Серверийн алдаа" }, { status: 500 });
  }
}

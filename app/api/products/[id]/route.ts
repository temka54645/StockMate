import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireWarehouseId, UnauthorizedError } from "@/lib/auth-helpers";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  unit: z.string().min(1).max(30).optional(),
  category: z.string().max(100).optional(),
  unitPrice: z.number().min(0).optional(),
  reorderLevel: z.number().min(0).optional(),
  isPerishable: z.boolean().optional(),
  imageUrl: z.string().nullable().optional(),
  barcode: z.string().max(100).nullable().optional(),
  location: z.string().max(100).nullable().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { warehouseId } = await requireWarehouseId();
    const { id } = await params;
    const body = await req.json();
    const data = updateSchema.parse(body);

    const product = await prisma.product.findFirst({
      where: { id, warehouseId },
    });
    if (!product) return Response.json({ error: "Олдсонгүй" }, { status: 404 });

    const updated = await prisma.product.update({
      where: { id },
      data,
    });
    return Response.json(updated);
  } catch (err) {
    if (err instanceof UnauthorizedError) return Response.json({ error: "Нэвтрэх шаардлагатай" }, { status: 401 });
    if (err instanceof z.ZodError) return Response.json({ error: err.issues[0].message }, { status: 400 });
    return Response.json({ error: "Серверийн алдаа" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { warehouseId } = await requireWarehouseId();
    const { id } = await params;

    const product = await prisma.product.findFirst({
      where: { id, warehouseId },
    });
    if (!product) return Response.json({ error: "Олдсонгүй" }, { status: 404 });

    // Орлого/зарлагатай бараа устгахгүй
    const hasTransactions = await prisma.stockIn.findFirst({ where: { productId: id } });
    if (hasTransactions) {
      return Response.json({ error: "Гүйлгээтэй бараа устгах боломжгүй" }, { status: 409 });
    }

    await prisma.product.delete({ where: { id } });
    return Response.json({ ok: true });
  } catch (err) {
    if (err instanceof UnauthorizedError) return Response.json({ error: "Нэвтрэх шаардлагатай" }, { status: 401 });
    return Response.json({ error: "Серверийн алдаа" }, { status: 500 });
  }
}

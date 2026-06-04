import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireUserId, requireWarehouseId, UnauthorizedError } from "@/lib/auth-helpers";
import { z } from "zod";

/* ── GET: хэрэглэгчийн бүх агуулах ── */
export async function GET() {
  try {
    const userId = await requireUserId();
    const warehouses = await prisma.warehouse.findMany({
      where: { ownerId: userId },
      orderBy: { createdAt: "asc" },
      include: { _count: { select: { products: true } } },
    });
    return Response.json(
      warehouses.map((w) => ({
        id: w.id,
        name: w.name,
        productCount: w._count.products,
        capacity: w.capacity,
        capacityUnit: w.capacityUnit,
      }))
    );
  } catch (err) {
    if (err instanceof UnauthorizedError)
      return Response.json({ error: "Нэвтрэх шаардлагатай" }, { status: 401 });
    return Response.json({ error: "Серверийн алдаа" }, { status: 500 });
  }
}

/* ── POST: шинэ агуулах үүсгэх ── */
export async function POST(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const { name } = await req.json();
    if (!name?.trim())
      return Response.json({ error: "Нэр шаардлагатай" }, { status: 400 });

    const wh = await prisma.warehouse.create({
      data: { name: name.trim(), ownerId: userId },
    });
    await prisma.notificationSetting.create({ data: { warehouseId: wh.id } });
    return Response.json(
      { id: wh.id, name: wh.name, productCount: 0, capacity: null, capacityUnit: "нэгж" },
      { status: 201 }
    );
  } catch (err) {
    if (err instanceof UnauthorizedError)
      return Response.json({ error: "Нэвтрэх шаардлагатай" }, { status: 401 });
    return Response.json({ error: "Серверийн алдаа" }, { status: 500 });
  }
}

/* ── PATCH: идэвхтэй агуулахын нэр / багтаамж шинэчлэх ── */
const patchSchema = z.object({
  name:         z.string().min(1).max(100).optional(),
  capacity:     z.number().positive().nullable().optional(),
  capacityUnit: z.string().min(1).max(30).optional(),
});

export async function PATCH(req: NextRequest) {
  try {
    const { warehouseId, userId: ownerId } = await requireWarehouseId();
    const body = await req.json();
    const data = patchSchema.parse(body);

    // ownership нь requireWarehouseId-аар баталгаажсан
    const updated = await prisma.warehouse.update({
      where: { id: warehouseId },
      data,
    });
    return Response.json({
      id: updated.id,
      name: updated.name,
      capacity: updated.capacity,
      capacityUnit: updated.capacityUnit,
    });
  } catch (err) {
    if (err instanceof UnauthorizedError)
      return Response.json({ error: "Нэвтрэх шаардлагатай" }, { status: 401 });
    if (err instanceof z.ZodError)
      return Response.json({ error: err.issues[0].message }, { status: 400 });
    return Response.json({ error: "Серверийн алдаа" }, { status: 500 });
  }
}

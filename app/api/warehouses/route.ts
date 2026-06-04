import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireUserId, UnauthorizedError } from "@/lib/auth-helpers";

export async function GET() {
  try {
    const userId = await requireUserId();
    const warehouses = await prisma.warehouse.findMany({
      where: { ownerId: userId },
      orderBy: { createdAt: "asc" },
      include: { _count: { select: { products: true } } },
    });
    return Response.json(
      warehouses.map((w) => ({ id: w.id, name: w.name, productCount: w._count.products }))
    );
  } catch (err) {
    if (err instanceof UnauthorizedError) return Response.json({ error: "Нэвтрэх шаардлагатай" }, { status: 401 });
    return Response.json({ error: "Серверийн алдаа" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const { name } = await req.json();
    if (!name?.trim()) return Response.json({ error: "Нэр шаардлагатай" }, { status: 400 });

    const wh = await prisma.warehouse.create({ data: { name: name.trim(), ownerId: userId } });
    await prisma.notificationSetting.create({ data: { warehouseId: wh.id } });
    return Response.json({ id: wh.id, name: wh.name, productCount: 0 }, { status: 201 });
  } catch (err) {
    if (err instanceof UnauthorizedError) return Response.json({ error: "Нэвтрэх шаардлагатай" }, { status: 401 });
    return Response.json({ error: "Серверийн алдаа" }, { status: 500 });
  }
}

import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireWarehouseId, UnauthorizedError } from "@/lib/auth-helpers";

export async function POST(req: NextRequest) {
  try {
    const { warehouseId } = await requireWarehouseId();
    const body = await req.json();
    const { endpoint, keys } = body;

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return Response.json({ error: "Push subscription мэдээлэл дутуу" }, { status: 400 });
    }

    await prisma.pushSubscription.upsert({
      where: { endpoint },
      update: { p256dh: keys.p256dh, auth: keys.auth, warehouseId },
      create: { warehouseId, endpoint, p256dh: keys.p256dh, auth: keys.auth },
    });

    return Response.json({ ok: true });
  } catch (err) {
    if (err instanceof UnauthorizedError) return Response.json({ error: "Нэвтрэх шаардлагатай" }, { status: 401 });
    return Response.json({ error: "Серверийн алдаа" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { warehouseId } = await requireWarehouseId();
    const { endpoint } = await req.json();

    await prisma.pushSubscription.deleteMany({
      where: { warehouseId, endpoint },
    });

    return Response.json({ ok: true });
  } catch (err) {
    if (err instanceof UnauthorizedError) return Response.json({ error: "Нэвтрэх шаардлагатай" }, { status: 401 });
    return Response.json({ error: "Серверийн алдаа" }, { status: 500 });
  }
}

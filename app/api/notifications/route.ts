import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireWarehouseId, UnauthorizedError } from "@/lib/auth-helpers";

export async function GET(req: NextRequest) {
  try {
    const { warehouseId } = await requireWarehouseId();
    const { searchParams } = req.nextUrl;
    const unreadOnly = searchParams.get("unread") === "1";

    const notifications = await prisma.notification.findMany({
      where: {
        warehouseId,
        ...(unreadOnly ? { readAt: null } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const unreadCount = await prisma.notification.count({
      where: { warehouseId, readAt: null },
    });

    return Response.json({ notifications, unreadCount });
  } catch (err) {
    if (err instanceof UnauthorizedError) return Response.json({ error: "Нэвтрэх шаардлагатай" }, { status: 401 });
    return Response.json({ error: "Серверийн алдаа" }, { status: 500 });
  }
}

/** Бүгдийг уншсан болгох */
export async function PATCH(req: NextRequest) {
  try {
    const { warehouseId } = await requireWarehouseId();
    const body = await req.json().catch(() => ({}));
    const notificationId: string | undefined = body.id;

    if (notificationId) {
      await prisma.notification.update({
        where: { id: notificationId, warehouseId },
        data: { readAt: new Date() },
      });
    } else {
      await prisma.notification.updateMany({
        where: { warehouseId, readAt: null },
        data: { readAt: new Date() },
      });
    }

    return Response.json({ ok: true });
  } catch (err) {
    if (err instanceof UnauthorizedError) return Response.json({ error: "Нэвтрэх шаардлагатай" }, { status: 401 });
    return Response.json({ error: "Серверийн алдаа" }, { status: 500 });
  }
}

import { requireWarehouseId, UnauthorizedError } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { warehouseId } = await requireWarehouseId();

    const encoder = new TextEncoder();
    let closed = false;

    const stream = new ReadableStream({
      async start(controller) {
        const send = (data: unknown) => {
          if (closed) return;
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        };

        // Эхний мэдэгдэл — одоогийн уншаагүй тоо
        const unreadCount = await prisma.notification.count({
          where: { warehouseId, readAt: null },
        });
        send({ type: "init", unreadCount });

        // 30 секунд тутам polling (SSE тасарвал reconnect болно)
        let lastChecked = new Date();
        const interval = setInterval(async () => {
          if (closed) {
            clearInterval(interval);
            return;
          }
          try {
            const newNotifs = await prisma.notification.findMany({
              where: { warehouseId, createdAt: { gt: lastChecked } },
              orderBy: { createdAt: "desc" },
              take: 10,
            });
            if (newNotifs.length > 0) {
              const count = await prisma.notification.count({
                where: { warehouseId, readAt: null },
              });
              send({ type: "notifications", notifications: newNotifs, unreadCount: count });
            }
            lastChecked = new Date();
          } catch {
            // DB алдаа — тасалдлагүй үргэлжлүүлнэ
          }
        }, 30000);

        // Heartbeat
        const heartbeat = setInterval(() => {
          if (closed) { clearInterval(heartbeat); return; }
          controller.enqueue(encoder.encode(": ping\n\n"));
        }, 15000);
      },
      cancel() {
        closed = true;
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return new Response("data: {\"error\":\"unauthorized\"}\n\n", {
        status: 401,
        headers: { "Content-Type": "text/event-stream" },
      });
    }
    return new Response("data: {\"error\":\"server\"}\n\n", {
      status: 500,
      headers: { "Content-Type": "text/event-stream" },
    });
  }
}

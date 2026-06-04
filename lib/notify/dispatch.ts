import { prisma } from "@/lib/db";
import { Resend } from "resend";
import webpush from "web-push";

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY тохируулаагүй байна");
  return new Resend(key);
}

function ensureVapid() {
  if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
      `mailto:${process.env.EMAIL_FROM ?? "noreply@example.com"}`,
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );
  }
}

interface DispatchResult {
  sent: number;
  failed: number;
}

export async function dispatchPending(): Promise<DispatchResult> {
  const now = new Date();
  let sent = 0, failed = 0;

  const deliveries = await prisma.notificationDelivery.findMany({
    where: {
      OR: [
        { status: "PENDING" },
        {
          status: "FAILED",
          attempts: { lt: 5 },
          nextRetryAt: { lte: now },
        },
      ],
    },
    include: {
      notification: {
        include: {
          warehouse: {
            include: {
              owner: { select: { email: true, name: true } },
              pushSubscriptions: true,
            },
          },
        },
      },
    },
    take: 100,
  });

  for (const delivery of deliveries) {
    const { notification } = delivery;
    let success = false;
    let lastError: string | undefined;

    try {
      if (delivery.channel === "IN_APP") {
        // IN_APP нь DB-д хадгалагдсан тул "sent" болгоно
        success = true;
      } else if (delivery.channel === "EMAIL") {
        const email = notification.warehouse.owner.email;
        if (!email) throw new Error("Имэйл хаяг байхгүй");

        await getResend().emails.send({
          from: process.env.EMAIL_FROM ?? "noreply@example.com",
          to: email,
          subject: notification.title,
          html: buildEmailHtml(notification),
        });
        success = true;
      } else if (delivery.channel === "PUSH") {
        const subs = notification.warehouse.pushSubscriptions;
        if (subs.length === 0) {
          success = true; // Push subscription байхгүй бол алгасна
        } else {
          ensureVapid();
          for (const sub of subs) {
            await webpush.sendNotification(
              { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
              JSON.stringify({
                title: notification.title,
                body: notification.body,
                severity: notification.severity,
              })
            );
          }
          success = true;
        }
      }
    } catch (err) {
      lastError = String(err);
      success = false;
    }

    if (success) {
      await prisma.notificationDelivery.update({
        where: { id: delivery.id },
        data: { status: "SENT", sentAt: new Date(), attempts: { increment: 1 } },
      });
      sent++;
    } else {
      const attempts = delivery.attempts + 1;
      // Exponential backoff: 2^attempts минут
      const retryMinutes = Math.pow(2, attempts);
      const nextRetryAt = new Date(now.getTime() + retryMinutes * 60 * 1000);

      await prisma.notificationDelivery.update({
        where: { id: delivery.id },
        data: {
          status: "FAILED",
          attempts,
          lastError,
          nextRetryAt,
        },
      });
      failed++;
    }
  }

  return { sent, failed };
}

function buildEmailHtml(notification: {
  title: string;
  body: string;
  severity: string;
  createdAt: Date;
}): string {
  const color = notification.severity === "CRITICAL" ? "#dc2626" :
    notification.severity === "WARNING" ? "#d97706" : "#2563eb";

  return `
<!DOCTYPE html>
<html lang="mn">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:Arial,sans-serif;background:#f5f5f5;margin:0;padding:20px">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1)">
    <div style="background:${color};padding:20px;color:#fff">
      <h1 style="margin:0;font-size:20px">${notification.title}</h1>
    </div>
    <div style="padding:24px">
      <p style="color:#374151;font-size:16px;margin:0 0 16px">${notification.body}</p>
      <p style="color:#9ca3af;font-size:13px;margin:0">
        ${notification.createdAt.toLocaleDateString("mn-MN")} ${notification.createdAt.toLocaleTimeString("mn-MN")}
      </p>
      <div style="margin-top:20px;padding-top:20px;border-top:1px solid #e5e7eb">
        <a href="${process.env.AUTH_URL ?? "https://localhost:3000"}/notifications"
           style="display:inline-block;background:#1e293b;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-size:14px">
          Мэдэгдлүүдийг харах
        </a>
      </div>
    </div>
  </div>
</body>
</html>`;
}

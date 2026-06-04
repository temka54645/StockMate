import { dispatchPending } from "@/lib/notify/dispatch";

function verifyCronSecret(req: Request): boolean {
  const auth = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return auth === `Bearer ${secret}`;
}

export async function GET(req: Request) {
  if (!verifyCronSecret(req)) {
    return Response.json({ error: "Зөвшөөрөлгүй" }, { status: 401 });
  }

  try {
    const result = await dispatchPending();
    return Response.json({ ok: true, ...result, timestamp: new Date().toISOString() });
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 });
  }
}

import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireWarehouseId, UnauthorizedError } from "@/lib/auth-helpers";

export async function GET(req: NextRequest) {
  try {
    const { warehouseId } = await requireWarehouseId();
    const { searchParams } = req.nextUrl;

    const page    = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit   = Math.min(100, Math.max(10, parseInt(searchParams.get("limit") ?? "50")));
    const actionRaw = searchParams.get("action");
    // Таслалаар тусгаарласан олон action (ж: PRODUCT_CREATE,PRODUCT_UPDATE,PRODUCT_DELETE)
    const actions = actionRaw ? actionRaw.split(",").filter(Boolean) : [];
    const from    = searchParams.get("from");
    const to      = searchParams.get("to");

    const where = {
      warehouseId,
      ...(actions.length === 1 ? { action: actions[0] } : actions.length > 1 ? { action: { in: actions } } : {}),
      ...((from || to) ? {
        createdAt: {
          ...(from ? { gte: new Date(from) } : {}),
          ...(to   ? { lte: new Date(to + "T23:59:59.999Z") } : {}),
        },
      } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.warehouseLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.warehouseLog.count({ where }),
    ]);

    return Response.json({ items, total, page, limit, pages: Math.ceil(total / limit) });
  } catch (err) {
    if (err instanceof UnauthorizedError)
      return Response.json({ error: "Нэвтрэх шаардлагатай" }, { status: 401 });
    console.error("[logs]", err);
    return Response.json({ error: "Серверийн алдаа" }, { status: 500 });
  }
}

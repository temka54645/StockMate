import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireWarehouseId, UnauthorizedError } from "@/lib/auth-helpers";
import { z } from "zod";

const settingsSchema = z.object({
  expiryThresholds: z.array(z.number().int().positive()).min(1).max(10).optional(),
  lowStockEnabled: z.boolean().optional(),
  emailEnabled: z.boolean().optional(),
  pushEnabled: z.boolean().optional(),
  dailyScanHour: z.number().int().min(0).max(23).optional(),
});

export async function GET() {
  try {
    const { warehouseId } = await requireWarehouseId();
    const settings = await prisma.notificationSetting.findUnique({
      where: { warehouseId },
    });
    return Response.json(settings);
  } catch (err) {
    if (err instanceof UnauthorizedError) return Response.json({ error: "Нэвтрэх шаардлагатай" }, { status: 401 });
    return Response.json({ error: "Серверийн алдаа" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { warehouseId } = await requireWarehouseId();
    const body = await req.json();
    const data = settingsSchema.parse(body);

    const settings = await prisma.notificationSetting.upsert({
      where: { warehouseId },
      update: data,
      create: { warehouseId, ...data },
    });
    return Response.json(settings);
  } catch (err) {
    if (err instanceof UnauthorizedError) return Response.json({ error: "Нэвтрэх шаардлагатай" }, { status: 401 });
    if (err instanceof z.ZodError) return Response.json({ error: err.issues[0].message }, { status: 400 });
    return Response.json({ error: "Серверийн алдаа" }, { status: 500 });
  }
}

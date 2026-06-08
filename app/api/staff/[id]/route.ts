import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireWarehouseId, UnauthorizedError } from "@/lib/auth-helpers";
import { writeLog } from "@/lib/log";
import { z } from "zod";

const patchSchema = z.object({
  name:     z.string().min(1).max(100).optional(),
  role:     z.enum(["manager", "staff", "viewer"]).optional(),
  phone:    z.string().max(30).nullable().optional(),
  email:    z.string().email().max(100).nullable().optional(),
  notes:    z.string().max(500).nullable().optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { warehouseId, userId, userName } = await requireWarehouseId();
    const { id } = await params;
    const body = await req.json();
    const data = patchSchema.parse(body);

    const existing = await prisma.staffMember.findFirst({ where: { id, warehouseId } });
    if (!existing) return Response.json({ error: "Олдсонгүй" }, { status: 404 });

    const updated = await prisma.staffMember.update({ where: { id }, data });
    return Response.json(updated);
  } catch (err) {
    if (err instanceof UnauthorizedError)
      return Response.json({ error: "Нэвтрэх шаардлагатай" }, { status: 401 });
    if (err instanceof z.ZodError)
      return Response.json({ error: err.issues[0].message }, { status: 400 });
    return Response.json({ error: "Серверийн алдаа" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { warehouseId, userId, userName } = await requireWarehouseId();
    const { id } = await params;

    const existing = await prisma.staffMember.findFirst({ where: { id, warehouseId } });
    if (!existing) return Response.json({ error: "Олдсонгүй" }, { status: 404 });

    await prisma.staffMember.delete({ where: { id } });

    writeLog({ warehouseId, userId, userName, action: "STAFF_REMOVE", entityName: existing.name });

    return Response.json({ ok: true });
  } catch (err) {
    if (err instanceof UnauthorizedError)
      return Response.json({ error: "Нэвтрэх шаардлагатай" }, { status: 401 });
    return Response.json({ error: "Серверийн алдаа" }, { status: 500 });
  }
}

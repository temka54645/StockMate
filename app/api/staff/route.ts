import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireWarehouseId, UnauthorizedError } from "@/lib/auth-helpers";
import { writeLog } from "@/lib/log";
import { z } from "zod";

const staffSchema = z.object({
  name:  z.string().min(1, "Нэр шаардлагатай").max(100),
  role:  z.enum(["manager", "staff", "viewer"]).default("staff"),
  phone: z.string().max(30).nullable().optional(),
  email: z.string().email("Имэйл буруу формат").max(100).nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
});

export async function GET() {
  try {
    const { warehouseId } = await requireWarehouseId();
    const staff = await prisma.staffMember.findMany({
      where: { warehouseId },
      orderBy: [{ isActive: "desc" }, { createdAt: "asc" }],
    });
    return Response.json(staff);
  } catch (err) {
    if (err instanceof UnauthorizedError)
      return Response.json({ error: "Нэвтрэх шаардлагатай" }, { status: 401 });
    return Response.json({ error: "Серверийн алдаа" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { warehouseId, userId, userName } = await requireWarehouseId();
    const body = await req.json();
    const data = staffSchema.parse(body);

    const member = await prisma.staffMember.create({
      data: { ...data, warehouseId },
    });

    writeLog({ warehouseId, userId, userName, action: "STAFF_ADD", entityName: member.name });

    return Response.json(member, { status: 201 });
  } catch (err) {
    if (err instanceof UnauthorizedError)
      return Response.json({ error: "Нэвтрэх шаардлагатай" }, { status: 401 });
    if (err instanceof z.ZodError)
      return Response.json({ error: err.issues[0].message }, { status: 400 });
    return Response.json({ error: "Серверийн алдаа" }, { status: 500 });
  }
}

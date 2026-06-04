import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export class UnauthorizedError extends Error {
  status = 401;
  constructor() { super("Нэвтрэх шаардлагатай"); }
}

export async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new UnauthorizedError();
  return session.user.id;
}

/** Cookie дотрх active-wh-г уншиж, эзэмшил баталгаажуулж warehouseId буцаана */
async function resolveWarehouseId(userId: string): Promise<string> {
  const jar = await cookies();
  const activeWh = jar.get("active-wh")?.value;

  let warehouse = null;

  if (activeWh) {
    warehouse = await prisma.warehouse.findFirst({
      where: { id: activeWh, ownerId: userId },
    });
  }

  if (!warehouse) {
    warehouse = await prisma.warehouse.findFirst({
      where: { ownerId: userId },
      orderBy: { createdAt: "asc" },
    });
  }

  if (!warehouse) {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
    warehouse = await prisma.warehouse.create({
      data: { name: `${user?.name ?? "Миний"} агуулах`, ownerId: userId },
    });
    await prisma.notificationSetting.create({ data: { warehouseId: warehouse.id } });
  }

  return warehouse.id;
}

/** API route-д хэрэглэнэ */
export async function requireWarehouseId(): Promise<{ userId: string; warehouseId: string }> {
  const userId = await requireUserId();
  const warehouseId = await resolveWarehouseId(userId);
  return { userId, warehouseId };
}

/** Page/layout-д хэрэглэнэ — нэвтрээгүй бол /login руу */
export async function requireUserPage(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  return session.user.id;
}

/** Login/signup хуудсыг нэвтэрсэн хэрэглэгчээс хамгаална */
export async function redirectIfAuthenticated(): Promise<void> {
  const session = await auth();
  if (session?.user?.id) redirect("/");
}

/** Layout-аас дуудах — cookie-д тулгуурлан warehouseId + warehouses list буцаана */
export async function getOrCreateWarehouse(userId: string): Promise<string> {
  return resolveWarehouseId(userId);
}

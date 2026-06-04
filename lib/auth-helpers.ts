import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";

export class UnauthorizedError extends Error {
  status = 401;
  constructor() { super("Нэвтрэх шаардлагатай"); }
}

export async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new UnauthorizedError();
  return session.user.id;
}

/** API route-д хэрэглэгчийн анхны агуулахын ID-г буцаана. Агуулах байхгүй бол автоматаар үүсгэнэ. */
export async function requireWarehouseId(): Promise<{ userId: string; warehouseId: string }> {
  const userId = await requireUserId();

  let warehouse = await prisma.warehouse.findFirst({
    where: { ownerId: userId },
    orderBy: { createdAt: "asc" },
  });

  if (!warehouse) {
    warehouse = await prisma.warehouse.create({
      data: { name: "Миний агуулах", ownerId: userId },
    });
    await prisma.notificationSetting.create({
      data: { warehouseId: warehouse.id },
    });
  }

  return { userId, warehouseId: warehouse.id };
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

/** Хэрэглэгчийн агуулахыг баталгаажуулна — page-аас дуудаж warehouseId авна */
export async function getOrCreateWarehouse(userId: string): Promise<string> {
  let warehouse = await prisma.warehouse.findFirst({
    where: { ownerId: userId },
    orderBy: { createdAt: "asc" },
  });

  if (!warehouse) {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
    warehouse = await prisma.warehouse.create({
      data: { name: `${user?.name ?? "Миний"} агуулах`, ownerId: userId },
    });
    await prisma.notificationSetting.create({
      data: { warehouseId: warehouse.id },
    });
  }

  return warehouse.id;
}

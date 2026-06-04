"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/auth-helpers";

/** Идэвхтэй агуулахыг солих */
export async function switchWarehouseAction(warehouseId: string) {
  const userId = await requireUserId();
  const wh = await prisma.warehouse.findFirst({ where: { id: warehouseId, ownerId: userId } });
  if (!wh) throw new Error("Агуулах олдсонгүй");
  const jar = await cookies();
  jar.set("active-wh", warehouseId, { path: "/", maxAge: 60 * 60 * 24 * 365, httpOnly: false });
  revalidatePath("/", "layout");
}

/** Шинэ агуулах үүсгэж идэвхжүүлэх */
export async function createWarehouseAction(name: string): Promise<string> {
  const userId = await requireUserId();
  const wh = await prisma.warehouse.create({ data: { name, ownerId: userId } });
  await prisma.notificationSetting.create({ data: { warehouseId: wh.id } });
  const jar = await cookies();
  jar.set("active-wh", wh.id, { path: "/", maxAge: 60 * 60 * 24 * 365, httpOnly: false });
  revalidatePath("/", "layout");
  return wh.id;
}

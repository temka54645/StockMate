"use server";

import { signIn, signOut } from "@/auth";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { redirect } from "next/navigation";
import { AuthError } from "next-auth";

const signupSchema = z.object({
  name: z.string().min(2, "Нэр хамгийн багадаа 2 тэмдэгт"),
  email: z.string().email("Имэйл хаяг буруу"),
  password: z.string().min(8, "Нууц үг хамгийн багадаа 8 тэмдэгт"),
});

export async function signupAction(formData: FormData) {
  const raw = {
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  };

  const parsed = signupSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });
  if (existing) {
    return { error: "Энэ имэйл хаяг бүртгэлтэй байна" };
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      name,
      email: email.toLowerCase(),
      hashedPassword,
      emailVerified: new Date(),
    },
  });

  // Шинэ хэрэглэгчид автоматаар агуулах + тохиргоо үүсгэнэ
  const warehouse = await prisma.warehouse.create({
    data: { name: `${name}-ийн агуулах`, ownerId: user.id },
  });
  await prisma.notificationSetting.create({
    data: { warehouseId: warehouse.id },
  });

  await signIn("credentials", {
    email: email.toLowerCase(),
    password,
    redirect: false,
  });

  redirect("/");
}

export async function loginAction(formData: FormData) {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/",
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return { error: "Имэйл эсвэл нууц үг буруу байна" };
    }
    throw err;
  }
}

export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}

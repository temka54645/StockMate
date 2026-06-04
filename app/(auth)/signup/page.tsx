"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { signupAction } from "../actions";
import { Eye, EyeOff, Warehouse, Loader2 } from "lucide-react";

export default function SignupPage() {
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await signupAction(fd);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div className="w-full max-w-md animate-fade-in-up">
      <div className="bg-card rounded-2xl shadow-xl border border-border p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-2">
            <Warehouse className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Бүртгүүлэх</h1>
          <p className="text-sm text-muted-foreground">Агуулахын систем дэх шинэ бүртгэл</p>
        </div>

        {error && (
          <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive animate-pop-in">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground" htmlFor="name">
              Нэр
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              autoComplete="name"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring transition"
              placeholder="Таны нэр"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground" htmlFor="email">
              Имэйл
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring transition"
              placeholder="example@email.com"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground" htmlFor="password">
              Нууц үг
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPass ? "text" : "password"}
                required
                minLength={8}
                autoComplete="new-password"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 pr-10 text-sm outline-none focus:ring-2 focus:ring-ring transition"
                placeholder="Хамгийн багадаа 8 тэмдэгт"
              />
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
                aria-label={showPass ? "Нуух" : "Харуулах"}
              >
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-lg bg-primary text-primary-foreground font-semibold py-2.5 text-sm hover:opacity-90 transition disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            Бүртгүүлэх
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Бүртгэлтэй юу?{" "}
          <Link href="/login" className="text-primary font-medium hover:underline">
            Нэвтрэх
          </Link>
        </p>
      </div>
    </div>
  );
}

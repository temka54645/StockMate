"use client";

import { useEffect, useState } from "react";
import {
  Package, TrendingUp, TrendingDown, AlertTriangle,
  Clock, XCircle, Banknote, Bell, Settings,
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  Tooltip, CartesianGrid, Legend,
} from "recharts";
import Link from "next/link";

interface DashboardData {
  totalProducts: number;
  totalStock: number;
  stockValue: number;
  lowStockCount: number;
  nearExpiryCount: number;
  expiredCount: number;
  monthlyIn: number;
  monthlyOut: number;
  unreadNotifications: number;
  recentNotifications: Array<{
    id: string; title: string; body: string;
    severity: string; createdAt: string;
  }>;
  monthlySeries: Array<{ month: string; in: number; out: number }>;
  // Дүүргэлт
  capacity: number | null;
  capacityUnit: string;
  fillPercent: number | null;
  categoryBreakdown: Array<{ name: string; qty: number }>;
}

/* ─── Severity styles ─── */
const severityBg: Record<string, string> = {
  CRITICAL: "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800",
  WARNING:  "bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-800",
  NOTICE:   "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800",
};
const severityDot: Record<string, string> = {
  CRITICAL: "bg-rose-500",
  WARNING:  "bg-orange-500",
  NOTICE:   "bg-blue-500",
};

/* ─── Skeleton ─── */
function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-muted/60 ${className ?? ""}`} />;
}
function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-fade-in-up">
      <div className="space-y-1.5">
        <Skeleton className="w-52 h-7" />
        <Skeleton className="w-36 h-4" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-sm space-y-3">
            <Skeleton className="w-9 h-9 rounded-xl" />
            <Skeleton className="w-20 h-7" />
            <Skeleton className="w-28 h-3.5" />
            <Skeleton className="w-20 h-3" />
          </div>
        ))}
      </div>
      <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-sm space-y-4">
        <Skeleton className="w-64 h-5" />
        <Skeleton className="w-full h-36" />
      </div>
      <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-sm space-y-4">
        <Skeleton className="w-48 h-5" />
        <Skeleton className="w-full h-[280px]" />
      </div>
    </div>
  );
}

/* ─── Fill gauge bar ─── */
function FillBar({ percent }: { percent: number }) {
  const color =
    percent >= 90 ? "from-rose-500 to-rose-600" :
    percent >= 75 ? "from-orange-400 to-orange-500" :
    percent >= 50 ? "from-yellow-400 to-amber-500" :
                    "from-emerald-400 to-emerald-500";

  return (
    <div className="w-full h-4 rounded-full bg-muted/50 overflow-hidden">
      <div
        className={`h-full rounded-full bg-gradient-to-r ${color} transition-all duration-700`}
        style={{ width: `${Math.max(2, percent)}%` }}
      />
    </div>
  );
}

/* ─── Category bar chart row ─── */
const CAT_COLORS = [
  "#6366f1","#10b981","#f59e0b","#ef4444","#8b5cf6",
  "#06b6d4","#f97316","#ec4899",
];

function CategoryRow({ name, qty, max, colorIdx }: {
  name: string; qty: number; max: number; colorIdx: number;
}) {
  const pct = max > 0 ? (qty / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-muted-foreground w-24 truncate flex-shrink-0">{name}</span>
      <div className="flex-1 h-2.5 rounded-full bg-muted/50 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${Math.max(2, pct)}%`, background: CAT_COLORS[colorIdx % CAT_COLORS.length] }}
        />
      </div>
      <span className="text-xs text-muted-foreground w-16 text-right flex-shrink-0">
        {qty.toLocaleString("mn-MN")}
      </span>
    </div>
  );
}

/* ═══════════════════════ Main ═══════════════════════ */
export default function DashboardClient() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  function loadData() {
    setLoading(true); setError(false);
    fetch("/api/dashboard")
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }

  useEffect(() => { loadData(); }, []);

  if (loading) return <DashboardSkeleton />;

  if (error || !data) return (
    <div className="flex flex-col items-center justify-center h-64 text-muted-foreground gap-3">
      <AlertTriangle className="w-8 h-8 opacity-40" />
      <p className="text-sm">Мэдээлэл татахад алдаа гарлаа</p>
      <button onClick={loadData} className="text-xs text-primary underline underline-offset-2">
        Дахин оролдох
      </button>
    </div>
  );

  const stats = [
    {
      label: "Нийт нэр төрөл", icon: Package,
      value: data.totalProducts.toLocaleString("mn-MN"),
      sub: "Бүртгэлтэй бараа",
      color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/40",
      ring: "ring-blue-100 dark:ring-blue-900/50",
    },
    {
      label: "Нийт үлдэгдэл", icon: Banknote,
      value: data.stockValue >= 1_000_000
        ? `${(data.stockValue / 1_000_000).toLocaleString("mn-MN", { minimumFractionDigits: 1 })}М ₮`
        : `${data.stockValue.toLocaleString("mn-MN")} ₮`,
      sub: `${data.totalStock.toLocaleString("mn-MN")} нэгж`,
      color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/40",
      ring: "ring-emerald-100 dark:ring-emerald-900/50",
    },
    {
      label: "Сарын орлого", icon: TrendingUp,
      value: data.monthlyIn.toLocaleString("mn-MN"),
      sub: "Энэ сарын нийт",
      color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/40",
      ring: "ring-emerald-100 dark:ring-emerald-900/50",
    },
    {
      label: "Сарын зарлага", icon: TrendingDown,
      value: data.monthlyOut.toLocaleString("mn-MN"),
      sub: "Энэ сарын нийт",
      color: "text-rose-600", bg: "bg-rose-50 dark:bg-rose-950/40",
      ring: "ring-rose-100 dark:ring-rose-900/50",
    },
    {
      label: "Дахин захиалах", icon: AlertTriangle,
      value: data.lowStockCount.toLocaleString("mn-MN"),
      sub: "Доод хязгаараас доош",
      color: "text-orange-600", bg: "bg-orange-50 dark:bg-orange-950/40",
      ring: "ring-orange-100 dark:ring-orange-900/50",
    },
    {
      label: "Дуусах дөхсөн", icon: Clock,
      value: data.nearExpiryCount.toLocaleString("mn-MN"),
      sub: "30 хоногт дуусна",
      color: "text-yellow-600", bg: "bg-yellow-50 dark:bg-yellow-950/40",
      ring: "ring-yellow-100 dark:ring-yellow-900/50",
    },
    {
      label: "Дууссан лот", icon: XCircle,
      value: data.expiredCount.toLocaleString("mn-MN"),
      sub: "Яаралтай шийдвэрлэх",
      color: "text-rose-600", bg: "bg-rose-50 dark:bg-rose-950/40",
      ring: "ring-rose-100 dark:ring-rose-900/50",
    },
    {
      label: "Уншаагүй мэдэгдэл", icon: Bell,
      value: data.unreadNotifications.toLocaleString("mn-MN"),
      sub: "Шинэ мэдэгдэл",
      color: "text-primary", bg: "bg-primary/10",
      ring: "ring-primary/20",
    },
  ];

  const fillColor =
    (data.fillPercent ?? 0) >= 90 ? "text-rose-600" :
    (data.fillPercent ?? 0) >= 75 ? "text-orange-500" :
    (data.fillPercent ?? 0) >= 50 ? "text-yellow-500" : "text-emerald-600";

  const fillLabel =
    (data.fillPercent ?? 0) >= 90 ? "Дүүрэх дөхсөн" :
    (data.fillPercent ?? 0) >= 75 ? "Ихэнх дүүрсэн" :
    (data.fillPercent ?? 0) >= 50 ? "Хагас дүүрсэн" : "Сайн байдалтай";

  const maxCatQty = data.categoryBreakdown[0]?.qty ?? 1;

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Хяналтын самбар</h1>
        <p className="text-sm text-muted-foreground mt-1">Агуулахын нийт байдал</p>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className={`rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow ring-2 ${s.ring}`}
          >
            <div className="mb-3">
              <div className={`inline-flex rounded-xl p-2 ${s.bg}`}>
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
            </div>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-sm font-medium text-foreground mt-0.5">{s.label}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Агуулахын дүүргэлт ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Fill gauge card */}
        <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-foreground">Агуулахын дүүргэлт</h2>
            <Link
              href="/settings"
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition"
            >
              <Settings className="w-3.5 h-3.5" />
              Багтаамж тохируулах
            </Link>
          </div>

          {data.fillPercent !== null ? (
            <div className="space-y-4">
              {/* Big percent number */}
              <div className="flex items-end gap-3">
                <span className={`text-5xl font-extrabold tabular-nums ${fillColor}`}>
                  {data.fillPercent}%
                </span>
                <div className="pb-1.5">
                  <p className={`text-sm font-semibold ${fillColor}`}>{fillLabel}</p>
                  <p className="text-xs text-muted-foreground">
                    {data.totalStock.toLocaleString("mn-MN")} / {data.capacity!.toLocaleString("mn-MN")} {data.capacityUnit}
                  </p>
                </div>
              </div>

              {/* Bar */}
              <FillBar percent={data.fillPercent} />

              {/* Zone labels */}
              <div className="flex justify-between text-[10px] text-muted-foreground px-0.5">
                <span>0%</span>
                <span className="text-yellow-500">50%</span>
                <span className="text-orange-500">75%</span>
                <span className="text-rose-500">90%+</span>
                <span>100%</span>
              </div>

              {/* Status chips */}
              <div className="grid grid-cols-3 gap-2 pt-1">
                {[
                  { label: "Ашигласан", value: data.totalStock.toLocaleString("mn-MN"), unit: data.capacityUnit },
                  { label: "Чөлөөтэй", value: Math.max(0, data.capacity! - data.totalStock).toLocaleString("mn-MN"), unit: data.capacityUnit },
                  { label: "Нийт", value: data.capacity!.toLocaleString("mn-MN"), unit: data.capacityUnit },
                ].map((c) => (
                  <div key={c.label} className="rounded-xl bg-muted/40 p-3 text-center">
                    <p className="text-xs text-muted-foreground">{c.label}</p>
                    <p className="font-semibold text-sm text-foreground mt-0.5">{c.value}</p>
                    <p className="text-[10px] text-muted-foreground">{c.unit}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* No capacity set */
            <div className="flex flex-col items-center justify-center py-8 text-center gap-3">
              <div className="w-16 h-16 rounded-2xl bg-muted/40 flex items-center justify-center">
                <Package className="w-7 h-7 text-muted-foreground/50" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Багтаамж тохируулаагүй байна</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Тохиргоо хуудаснаас агуулахын нийт багтаамжийг оруулна уу
                </p>
              </div>
              <Link
                href="/settings"
                className="text-xs bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:opacity-90 transition font-medium"
              >
                Тохиргоо руу очих
              </Link>
            </div>
          )}
        </div>

        {/* Category breakdown */}
        <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-sm">
          <h2 className="font-semibold text-foreground mb-5">Ангилал тус бүрийн үлдэгдэл</h2>

          {data.categoryBreakdown.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
              Бараа бүртгэлгүй байна
            </div>
          ) : (
            <div className="space-y-3.5">
              {data.categoryBreakdown.map((cat, i) => (
                <CategoryRow
                  key={cat.name}
                  name={cat.name}
                  qty={cat.qty}
                  max={maxCatQty}
                  colorIdx={i}
                />
              ))}

              {/* Legend total */}
              <div className="pt-2 border-t border-border flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Нийт үлдэгдэл</span>
                <span className="font-semibold text-foreground">
                  {data.totalStock.toLocaleString("mn-MN")} нэгж
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Сарын хөдөлгөөн ── */}
      <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-sm">
        <h2 className="font-semibold text-foreground mb-4">
          Орлого / Зарлагын хөдөлгөөн (сараар)
        </h2>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data.monthlySeries} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
            <YAxis tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
            <Tooltip
              contentStyle={{
                background: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: "12px",
                fontSize: 13,
              }}
            />
            <Legend />
            <Bar dataKey="in"  name="Орлого"  fill="#10b981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="out" name="Зарлага" fill="#f43f5e" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── Сүүлийн мэдэгдлүүд ── */}
      {data.recentNotifications.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-sm">
          <h2 className="font-semibold text-foreground mb-4">Сүүлийн мэдэгдлүүд</h2>
          <div className="space-y-2">
            {data.recentNotifications.map((n) => (
              <div
                key={n.id}
                className={`flex items-start gap-3 rounded-xl p-3 border ${
                  severityBg[n.severity] ?? "bg-muted/50 border-border"
                }`}
              >
                <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${severityDot[n.severity] ?? "bg-muted-foreground"}`} />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{n.title}</p>
                  <p className="text-xs text-muted-foreground">{n.body}</p>
                </div>
                <span className="text-xs text-muted-foreground flex-shrink-0 ml-auto">
                  {new Date(n.createdAt).toLocaleDateString("mn-MN")}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

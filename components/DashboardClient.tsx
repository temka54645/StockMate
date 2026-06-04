"use client";

import { useEffect, useState } from "react";
import {
  Package, TrendingUp, TrendingDown, AlertTriangle,
  Clock, XCircle, Banknote, Bell,
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  Tooltip, CartesianGrid, Legend,
} from "recharts";

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

/* ─── Skeleton helpers ─── */
function Skeleton({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-lg bg-muted/60 ${className ?? ""}`} />
  );
}

function StatCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-sm space-y-3">
      <Skeleton className="w-9 h-9 rounded-xl" />
      <Skeleton className="w-20 h-7" />
      <Skeleton className="w-28 h-3.5" />
      <Skeleton className="w-20 h-3" />
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-fade-in-up">
      <div className="space-y-1.5">
        <Skeleton className="w-52 h-7" />
        <Skeleton className="w-36 h-4" />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => <StatCardSkeleton key={i} />)}
      </div>

      {/* Chart */}
      <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-sm space-y-4">
        <Skeleton className="w-64 h-5" />
        <Skeleton className="w-full h-[280px]" />
      </div>
    </div>
  );
}

/* ═══════════════════════ Main ═══════════════════════ */
export default function DashboardClient() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }, []);

  if (loading) return <DashboardSkeleton />;

  if (error || !data) return (
    <div className="flex flex-col items-center justify-center h-64 text-muted-foreground gap-3">
      <AlertTriangle className="w-8 h-8 opacity-40" />
      <p className="text-sm">Мэдээлэл татахад алдаа гарлаа</p>
      <button
        onClick={() => { setError(false); setLoading(true); fetch("/api/dashboard").then(r => r.json()).then(d => { setData(d); setLoading(false); }).catch(() => { setError(true); setLoading(false); }); }}
        className="text-xs text-primary underline underline-offset-2"
      >
        Дахин оролдох
      </button>
    </div>
  );

  const stats = [
    {
      label: "Нийт нэр төрөл",
      value: data.totalProducts.toLocaleString("mn-MN"),
      sub: "Бүртгэлтэй бараа",
      icon: Package,
      color: "text-blue-600",
      bg: "bg-blue-50 dark:bg-blue-950/40",
      ring: "ring-blue-100 dark:ring-blue-900/50",
    },
    {
      label: "Нийт үлдэгдэл",
      value: data.stockValue >= 1_000_000
        ? `${(data.stockValue / 1_000_000).toLocaleString("mn-MN", { minimumFractionDigits: 1 })}М ₮`
        : `${data.stockValue.toLocaleString("mn-MN")} ₮`,
      sub: `${data.totalStock.toLocaleString("mn-MN")} нэгж`,
      icon: Banknote,
      color: "text-emerald-600",
      bg: "bg-emerald-50 dark:bg-emerald-950/40",
      ring: "ring-emerald-100 dark:ring-emerald-900/50",
    },
    {
      label: "Сарын орлого",
      value: data.monthlyIn.toLocaleString("mn-MN"),
      sub: "Энэ сарын нийт",
      icon: TrendingUp,
      color: "text-emerald-600",
      bg: "bg-emerald-50 dark:bg-emerald-950/40",
      ring: "ring-emerald-100 dark:ring-emerald-900/50",
    },
    {
      label: "Сарын зарлага",
      value: data.monthlyOut.toLocaleString("mn-MN"),
      sub: "Энэ сарын нийт",
      icon: TrendingDown,
      color: "text-rose-600",
      bg: "bg-rose-50 dark:bg-rose-950/40",
      ring: "ring-rose-100 dark:ring-rose-900/50",
    },
    {
      label: "Дахин захиалах",
      value: data.lowStockCount.toLocaleString("mn-MN"),
      sub: "Доод хязгаараас доош",
      icon: AlertTriangle,
      color: "text-orange-600",
      bg: "bg-orange-50 dark:bg-orange-950/40",
      ring: "ring-orange-100 dark:ring-orange-900/50",
    },
    {
      label: "Дуусах дөхсөн",
      value: data.nearExpiryCount.toLocaleString("mn-MN"),
      sub: "30 хоногт дуусна",
      icon: Clock,
      color: "text-yellow-600",
      bg: "bg-yellow-50 dark:bg-yellow-950/40",
      ring: "ring-yellow-100 dark:ring-yellow-900/50",
    },
    {
      label: "Дууссан лот",
      value: data.expiredCount.toLocaleString("mn-MN"),
      sub: "Яаралтай шийдвэрлэх",
      icon: XCircle,
      color: "text-rose-600",
      bg: "bg-rose-50 dark:bg-rose-950/40",
      ring: "ring-rose-100 dark:ring-rose-900/50",
    },
    {
      label: "Уншаагүй мэдэгдэл",
      value: data.unreadNotifications.toLocaleString("mn-MN"),
      sub: "Шинэ мэдэгдэл",
      icon: Bell,
      color: "text-primary",
      bg: "bg-primary/10",
      ring: "ring-primary/20",
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in-up">
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
            <div className="flex items-start justify-between mb-3">
              <div className={`rounded-xl p-2 ${s.bg}`}>
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
            </div>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-sm font-medium text-foreground mt-0.5">{s.label}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Chart ── */}
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

      {/* ── Recent notifications ── */}
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
                <span
                  className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                    severityDot[n.severity] ?? "bg-muted-foreground"
                  }`}
                />
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

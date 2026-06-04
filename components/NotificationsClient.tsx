"use client";

import { useEffect, useState } from "react";
import { Bell, CheckCheck, Loader2, AlertTriangle, Clock, Info, XCircle } from "lucide-react";

interface Notification {
  id: string;
  type: string;
  severity: string;
  title: string;
  body: string;
  createdAt: string;
  readAt: string | null;
}

const severityConfig = {
  CRITICAL: { bg: "bg-rose-50", border: "border-rose-200", dot: "bg-rose-500", icon: XCircle, label: "Яаралтай", textColor: "text-rose-700" },
  WARNING: { bg: "bg-orange-50", border: "border-orange-200", dot: "bg-orange-500", icon: AlertTriangle, label: "Анхааруулга", textColor: "text-orange-700" },
  NOTICE: { bg: "bg-blue-50", border: "border-blue-200", dot: "bg-blue-500", icon: Clock, label: "Мэдэгдэл", textColor: "text-blue-700" },
};

const typeLabel: Record<string, string> = {
  EXPIRY: "Хугацаа дуусах",
  EXPIRED: "Хугацаа дууссан",
  LOW_STOCK: "Доод хязгаар",
};

export default function NotificationsClient() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const load = () => {
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((d) => { setNotifications(d.notifications); setUnreadCount(d.unreadCount); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  async function markAll() {
    await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: "{}" });
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, readAt: new Date().toISOString() })));
  }

  async function markOne(id: string) {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, readAt: new Date().toISOString() } : n));
    setUnreadCount((c) => Math.max(0, c - 1));
  }

  const filtered = filter === "unread" ? notifications.filter((n) => !n.readAt) : notifications;

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Мэдэгдлүүд</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-muted-foreground mt-0.5">
              <span className="text-primary font-semibold">{unreadCount}</span> уншаагүй мэдэгдэл
            </p>
          )}
        </div>
        {unreadCount > 0 && (
          <button onClick={markAll}
            className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold hover:bg-accent transition">
            <CheckCheck className="w-4 h-4" /> Бүгдийг уншсан болгох
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {(["all", "unread"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
              filter === f ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground hover:bg-accent"
            }`}>
            {f === "all" ? "Бүгд" : "Уншаагүй"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground rounded-2xl border border-border bg-card">
          <Bell className="w-10 h-10 mb-3 opacity-40" />
          <p className="text-sm">{filter === "unread" ? "Уншаагүй мэдэгдэл байхгүй" : "Мэдэгдэл байхгүй"}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((n) => {
            const cfg = severityConfig[n.severity as keyof typeof severityConfig] ?? severityConfig.NOTICE;
            const Icon = cfg.icon;
            return (
              <div
                key={n.id}
                className={`rounded-2xl border ${cfg.border} ${cfg.bg} p-4 flex items-start gap-4 transition-opacity ${n.readAt ? "opacity-70" : ""}`}
              >
                <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${n.readAt ? "bg-muted-foreground/30" : cfg.dot}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-foreground text-sm">{n.title}</p>
                    <span className={`flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.textColor} border ${cfg.border}`}>
                      {cfg.label}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">{n.body}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-muted-foreground">
                      {new Date(n.createdAt).toLocaleDateString("mn-MN")} {new Date(n.createdAt).toLocaleTimeString("mn-MN", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    <span className="text-xs text-muted-foreground">·</span>
                    <span className="text-xs text-muted-foreground">{typeLabel[n.type] ?? n.type}</span>
                    {!n.readAt && (
                      <button onClick={() => markOne(n.id)} className="text-xs text-primary hover:underline ml-auto">
                        Уншсан болгох
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

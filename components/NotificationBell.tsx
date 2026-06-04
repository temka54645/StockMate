"use client";

import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import Link from "next/link";

interface Notification {
  id: string;
  title: string;
  body: string;
  severity: string;
  createdAt: string;
  readAt: string | null;
}

const severityColor = {
  CRITICAL: "bg-rose-100 border-rose-200 text-rose-800",
  WARNING: "bg-orange-100 border-orange-200 text-orange-800",
  NOTICE: "bg-blue-100 border-blue-200 text-blue-800",
};

export default function NotificationBell({ initialUnread = 0 }: { initialUnread?: number }) {
  const [unread, setUnread] = useState(initialUnread);
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [pop, setPop] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // SSE холболт
  useEffect(() => {
    let es: EventSource;
    let retryTimeout: ReturnType<typeof setTimeout>;

    function connect() {
      es = new EventSource("/api/notifications/stream");
      es.onmessage = (e) => {
        const data = JSON.parse(e.data);
        if (data.type === "init") {
          setUnread(data.unreadCount);
        } else if (data.type === "notifications") {
          setUnread(data.unreadCount);
          if (data.notifications?.length > 0) {
            setNotifications((prev) => [...data.notifications, ...prev].slice(0, 10));
            setPop(true);
            setTimeout(() => setPop(false), 3000);
          }
        }
      };
      es.onerror = () => {
        es.close();
        retryTimeout = setTimeout(connect, 5000);
      };
    }

    connect();
    return () => {
      es?.close();
      clearTimeout(retryTimeout);
    };
  }, []);

  // Нээхэд мэдэгдлүүдийг ачаалах
  useEffect(() => {
    if (!open) return;
    fetch("/api/notifications?unread=0")
      .then((r) => r.json())
      .then((d) => {
        if (d.notifications) setNotifications(d.notifications);
        if (d.unreadCount !== undefined) setUnread(d.unreadCount);
      });
  }, [open]);

  // Гадна дарахад хаах
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  async function markAllRead() {
    await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: "{}" });
    setUnread(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, readAt: new Date().toISOString() })));
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`relative p-2 rounded-xl transition-all ${pop ? "animate-pop-in" : ""} hover:bg-accent`}
        aria-label="Мэдэгдэл"
      >
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center px-1 animate-pop-in">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-card border border-border rounded-2xl shadow-xl z-50 animate-pop-in overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <span className="font-semibold text-sm">Мэдэгдэл</span>
            {unread > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-primary hover:underline"
              >
                Бүгдийг уншсан болгох
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto divide-y divide-border">
            {notifications.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">Мэдэгдэл байхгүй</p>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`px-4 py-3 ${!n.readAt ? "bg-primary/5" : ""}`}
                >
                  <p className="text-sm font-medium text-foreground">{n.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{n.body}</p>
                  <span
                    className={`inline-block mt-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                      severityColor[n.severity as keyof typeof severityColor] ?? "bg-muted"
                    }`}
                  >
                    {n.severity === "CRITICAL" ? "Яаралтай" : n.severity === "WARNING" ? "Анхааруулга" : "Мэдэгдэл"}
                  </span>
                </div>
              ))
            )}
          </div>
          <div className="px-4 py-3 border-t border-border">
            <Link
              href="/notifications"
              onClick={() => setOpen(false)}
              className="block text-center text-sm text-primary hover:underline"
            >
              Бүгдийг харах
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

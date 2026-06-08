"use client";

import { useEffect, useState, useCallback } from "react";
import {
  PackagePlus, PackageMinus, Plus, Pencil, Trash2,
  UserPlus, UserMinus, Settings, Building2,
  Loader2, ScrollText, Filter, ChevronLeft, ChevronRight,
} from "lucide-react";

interface LogEntry {
  id: string;
  userId: string;
  userName: string;
  action: string;
  entityName: string | null;
  qty: number | null;
  details: string | null;
  createdAt: string;
}

interface LogResponse {
  items: LogEntry[];
  total: number;
  page: number;
  pages: number;
  limit: number;
}

// ── Үйлдлийн мета ────────────────────────────────────────────────────
const ACTION_META: Record<string, {
  label: string;
  icon: React.ElementType;
  dot: string;
  chip: string;
}> = {
  STOCK_IN:         { label: "Орлого бүртгэв",    icon: PackagePlus,  dot: "bg-emerald-500", chip: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300" },
  STOCK_OUT:        { label: "Зарлага бүртгэв",   icon: PackageMinus, dot: "bg-rose-500",    chip: "bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300" },
  PRODUCT_CREATE:   { label: "Бараа нэмэв",       icon: Plus,         dot: "bg-blue-500",    chip: "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300" },
  PRODUCT_UPDATE:   { label: "Бараа шинэчлэв",    icon: Pencil,       dot: "bg-amber-500",   chip: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300" },
  PRODUCT_DELETE:   { label: "Бараа устгав",      icon: Trash2,       dot: "bg-red-500",     chip: "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300" },
  STAFF_ADD:        { label: "Ажилтан нэмэв",     icon: UserPlus,     dot: "bg-violet-500",  chip: "bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300" },
  STAFF_REMOVE:     { label: "Ажилтан хасав",     icon: UserMinus,    dot: "bg-orange-500",  chip: "bg-orange-100 text-orange-700 dark:bg-orange-950/50 dark:text-orange-300" },
  SETTINGS_UPDATE:  { label: "Тохиргоо шинэчлэв", icon: Settings,     dot: "bg-slate-500",   chip: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300" },
  WAREHOUSE_UPDATE: { label: "Агуулах шинэчлэв",  icon: Building2,    dot: "bg-purple-500",  chip: "bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300" },
};

const FILTER_GROUPS = [
  { label: "Бүгд",     value: "" },
  { label: "Орлого",   value: "STOCK_IN" },
  { label: "Зарлага",  value: "STOCK_OUT" },
  { label: "Бараа",    value: "PRODUCT_CREATE,PRODUCT_UPDATE,PRODUCT_DELETE" },
  { label: "Ажилтан",  value: "STAFF_ADD,STAFF_REMOVE" },
  { label: "Тохиргоо", value: "SETTINGS_UPDATE,WAREHOUSE_UPDATE" },
];

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "Дөнгөж сая";
  if (m < 60) return `${m} минутын өмнө`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} цагийн өмнө`;
  const d = Math.floor(h / 24);
  if (d < 7)  return `${d} өдрийн өмнө`;
  return new Date(iso).toLocaleDateString("mn-MN", { month: "short", day: "numeric" });
}

function formatDateFull(iso: string): string {
  return new Date(iso).toLocaleString("mn-MN", {
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function LogsClient() {
  const [data, setData]         = useState<LogResponse | null>(null);
  const [loading, setLoading]   = useState(true);
  const [page, setPage]         = useState(1);
  const [actionFilter, setActionFilter] = useState("");
  const [from, setFrom]         = useState("");
  const [to, setTo]             = useState("");
  const [showFilter, setShowFilter] = useState(false);

  const fetchLogs = useCallback(async (p: number, action: string, f: string, t: string) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p), limit: "50" });
    if (action) params.set("action", action); // таслалаар тусгаарласан олон action дэмжинэ
    if (f) params.set("from", f);
    if (t) params.set("to", t);
    const res = await fetch(`/api/logs?${params}`);
    if (res.ok) setData(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchLogs(page, actionFilter, from, to);
  }, [page, actionFilter, from, to, fetchLogs]);

  function applyFilter(action: string) {
    setActionFilter(action);
    setPage(1);
  }

  const filteredItems = data?.items ?? [];

  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Үйл ажиллагааны лог</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Агуулахын бүх үйлдлийн нарийвчилсан бүртгэл
        </p>
      </div>

      {/* Filter bar */}
      <div className="rounded-2xl border border-border bg-card shadow-sm p-4 space-y-3">
        {/* Action type buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {FILTER_GROUPS.map((g) => (
            <button
              key={g.value}
              onClick={() => applyFilter(g.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                actionFilter === g.value
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-accent/60 text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              {g.label}
            </button>
          ))}
          <button
            onClick={() => setShowFilter((v) => !v)}
            className={`ml-auto flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              showFilter || from || to ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent"
            }`}
          >
            <Filter className="w-3 h-3" />
            Огноо
          </button>
        </div>

        {/* Date range */}
        {showFilter && (
          <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-border">
            <div className="flex items-center gap-2">
              <label className="text-xs text-muted-foreground">Эхлэл:</label>
              <input
                type="date"
                value={from}
                onChange={(e) => { setFrom(e.target.value); setPage(1); }}
                className="rounded-lg border border-input bg-background px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-muted-foreground">Төгсгөл:</label>
              <input
                type="date"
                value={to}
                onChange={(e) => { setTo(e.target.value); setPage(1); }}
                className="rounded-lg border border-input bg-background px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            {(from || to) && (
              <button
                onClick={() => { setFrom(""); setTo(""); setPage(1); }}
                className="text-xs text-muted-foreground hover:text-destructive transition"
              >
                Цэвэрлэх
              </button>
            )}
          </div>
        )}
      </div>

      {/* Timeline */}
      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <ScrollText className="w-10 h-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">Лог олдсонгүй</p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Үйлдэл хийх үед энд харагдана
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredItems.map((entry, idx) => {
              const meta = ACTION_META[entry.action] ?? {
                label: entry.action, icon: ScrollText,
                dot: "bg-slate-500", chip: "bg-slate-100 text-slate-600",
              };
              const Icon = meta.icon;
              let det: Record<string, string> = {};
              try { det = entry.details ? JSON.parse(entry.details) : {}; } catch {}

              return (
                <div
                  key={entry.id}
                  className="flex items-start gap-4 px-5 py-4 hover:bg-accent/20 transition"
                >
                  {/* Timeline line */}
                  <div className="relative flex flex-col items-center mt-1">
                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${meta.dot}`} />
                    {idx < filteredItems.length - 1 && (
                      <div className="w-px flex-1 bg-border mt-1.5 min-h-[1.5rem]" />
                    )}
                  </div>

                  {/* Icon */}
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${meta.chip}`}>
                    <Icon className="w-4 h-4" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div>
                        <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full mb-1 ${meta.chip}`}>
                          {meta.label}
                        </span>
                        {entry.entityName && (
                          <p className="text-sm font-medium text-foreground">
                            {entry.entityName}
                            {entry.qty != null && (
                              <span className="ml-1.5 text-muted-foreground font-normal">
                                — <span className="font-semibold">{entry.qty.toLocaleString("mn-MN")}</span> нэгж
                              </span>
                            )}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className="text-xs text-muted-foreground font-medium">{entry.userName}</span>
                          {det.supplier && (
                            <span className="text-xs text-muted-foreground">· Нийлүүлэгч: {det.supplier}</span>
                          )}
                          {det.recipient && (
                            <span className="text-xs text-muted-foreground">· Хүлээн авагч: {det.recipient}</span>
                          )}
                          {det.docNo && (
                            <span className="text-xs text-muted-foreground">· Баримт: {det.docNo}</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs font-medium text-muted-foreground">{timeAgo(entry.createdAt)}</p>
                        <p className="text-[11px] text-muted-foreground/50 mt-0.5">{formatDateFull(entry.createdAt)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {data && data.pages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-border bg-accent/10">
            <p className="text-xs text-muted-foreground">
              Нийт <span className="font-semibold">{data.total}</span> бүртгэлийн{" "}
              {(page - 1) * data.limit + 1}–{Math.min(page * data.limit, data.total)}-г харуулж байна
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1.5 rounded-lg hover:bg-accent disabled:opacity-40 transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-medium px-2">{page} / {data.pages}</span>
              <button
                onClick={() => setPage((p) => Math.min(data.pages, p + 1))}
                disabled={page >= data.pages}
                className="p-1.5 rounded-lg hover:bg-accent disabled:opacity-40 transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

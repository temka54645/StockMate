"use client";

import { useEffect, useState } from "react";
import { BarChart3, Download, Filter, Loader2, AlertTriangle, Clock, XCircle, CheckCircle } from "lucide-react";

interface ReportRow {
  productId: string;
  code: string;
  name: string;
  unit: string;
  category: string;
  unitPrice: number;
  reorderLevel: number;
  isPerishable: boolean;
  totalQtyIn: number;
  totalQtyOut: number;
  totalStock: number;
  stockValue: number;
  totalInValue: number;
  nearestExpiry: string | null;
  daysToExpiry: number | null;
  expiryStatus: "normal" | "notice" | "warning" | "critical" | "expired";
  stockStatus: "ok" | "low" | "empty";
  batches: Array<{ id: string; batchNo: string; expiryDate: string | null; stock: number; }>;
}

const statusColors = {
  expired: { bg: "bg-rose-100", text: "text-rose-700", border: "border-rose-200", label: "Дууссан", icon: XCircle },
  critical: { bg: "bg-rose-50", text: "text-rose-600", border: "border-rose-200", label: "Яаралтай", icon: AlertTriangle },
  warning: { bg: "bg-orange-50", text: "text-orange-600", border: "border-orange-200", label: "Анхааруулга", icon: AlertTriangle },
  notice: { bg: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-200", label: "Сэрэмжлүүлэг", icon: Clock },
  normal: { bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-200", label: "Хэвийн", icon: CheckCircle },
};

const stockStatusColor = {
  empty: "bg-rose-100 text-rose-700",
  low: "bg-orange-100 text-orange-700",
  ok: "bg-emerald-100 text-emerald-700",
};

export default function ReportClient() {
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  const load = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (categoryFilter) params.set("category", categoryFilter);
    fetch(`/api/reports?${params}`)
      .then((r) => r.json())
      .then((d) => { setRows(d); setLoading(false); });
  };

  useEffect(() => { load(); }, [from, to, categoryFilter]);

  const categories = [...new Set(rows.map((r) => r.category))].sort();

  const totals = rows.reduce(
    (acc, r) => ({
      in: acc.in + r.totalQtyIn,
      out: acc.out + r.totalQtyOut,
      stock: acc.stock + r.totalStock,
      value: acc.value + r.stockValue,
    }),
    { in: 0, out: 0, stock: 0, value: 0 }
  );

  async function exportCSV() {
    const headers = ["Код", "Нэр", "Ангилал", "Нэгж", "Орлого", "Зарлага", "Үлдэгдэл", "Нэгж үнэ", "Нийт өртөг", "Дуусах хугацаа", "Төлөв"];
    const csvRows = rows.map((r) => [
      r.code, r.name, r.category, r.unit,
      r.totalQtyIn, r.totalQtyOut, r.totalStock,
      r.unitPrice, r.stockValue.toFixed(0),
      r.nearestExpiry ? new Date(r.nearestExpiry).toLocaleDateString("mn-MN") : "",
      statusColors[r.expiryStatus].label,
    ]);
    const csv = [headers, ...csvRows].map((row) => row.map((v) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Үлдэгдлийн тайлан</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{rows.length} барааны задаргаа</p>
        </div>
        <button onClick={exportCSV}
          className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold hover:bg-accent transition">
          <Download className="w-4 h-4" /> CSV татах
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-4">
        <Filter className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
        <span className="text-muted-foreground text-sm">—</span>
        <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring">
          <option value="">Бүх ангилал</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Нийт орлого", value: totals.in.toLocaleString("mn-MN"), color: "text-emerald-600" },
          { label: "Нийт зарлага", value: totals.out.toLocaleString("mn-MN"), color: "text-rose-600" },
          { label: "Нийт үлдэгдэл", value: totals.stock.toLocaleString("mn-MN"), color: "text-blue-600" },
          { label: "Нийт өртөг", value: `${totals.value.toLocaleString("mn-MN")} ₮`, color: "text-primary" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <BarChart3 className="w-10 h-10 mb-3 opacity-40" />
            <p className="text-sm">Тайлан байхгүй байна</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Бараа</th>
                  <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Орлого</th>
                  <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Зарлага</th>
                  <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Үлдэгдэл</th>
                  <th className="text-right px-4 py-3 font-semibold text-muted-foreground hidden md:table-cell">Өртөг</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden lg:table-cell">Хугацаа</th>
                  <th className="text-center px-4 py-3 font-semibold text-muted-foreground">Төлөв</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const es = statusColors[r.expiryStatus];
                  const StatusIcon = es.icon;
                  return (
                    <tr key={r.productId} className="border-b border-border hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-foreground">{r.name}</p>
                        <p className="text-xs text-muted-foreground">{r.code} · {r.category}</p>
                      </td>
                      <td className="px-4 py-3 text-right text-emerald-600 font-medium">
                        +{r.totalQtyIn.toLocaleString("mn-MN")} {r.unit}
                      </td>
                      <td className="px-4 py-3 text-right text-rose-600 font-medium">
                        -{r.totalQtyOut.toLocaleString("mn-MN")} {r.unit}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`inline-block px-2 py-0.5 rounded-lg text-xs font-semibold ${stockStatusColor[r.stockStatus]}`}>
                          {r.totalStock.toLocaleString("mn-MN")} {r.unit}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right hidden md:table-cell text-muted-foreground">
                        {r.stockValue.toLocaleString("mn-MN")} ₮
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground text-xs">
                        {r.nearestExpiry ? (
                          <>
                            {new Date(r.nearestExpiry).toLocaleDateString("mn-MN")}
                            {r.daysToExpiry !== null && (
                              <span className={`ml-1 ${r.daysToExpiry < 0 ? "text-rose-600" : "text-muted-foreground"}`}>
                                ({r.daysToExpiry < 0 ? `${Math.abs(r.daysToExpiry)}өдрийн өмнө` : `${r.daysToExpiry}өдөр`})
                              </span>
                            )}
                          </>
                        ) : "—"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${es.bg} ${es.text} ${es.border}`}>
                          <StatusIcon className="w-3 h-3" />
                          {es.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

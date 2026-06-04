"use client";

import { useEffect, useState } from "react";
import { Plus, PackageMinus, X, Loader2, Search, AlertTriangle } from "lucide-react";

interface StockOutRow {
  id: string;
  date: string;
  qty: number;
  recipient?: string;
  docNo?: string;
  product: { code: string; name: string; unit: string };
  batch: { batchNo: string; expiryDate?: string };
}

interface Product { id: string; code: string; name: string; unit: string; totalStock: number; }

const today = new Date().toISOString().slice(0, 10);
const emptyForm = { productId: "", date: today, qty: "", recipient: "", docNo: "" };

export default function StockOutClient() {
  const [rows, setRows] = useState<StockOutRow[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const load = () => {
    setLoading(true);
    Promise.all([
      fetch("/api/stock-out").then((r) => r.json()),
      fetch("/api/products").then((r) => r.json()),
    ]).then(([s, p]) => { setRows(s); setProducts(p); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  const selectedProduct = products.find((p) => p.id === form.productId);

  async function save() {
    setSaving(true);
    setError("");
    const res = await fetch("/api/stock-out", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, qty: Number(form.qty) }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? "Алдаа гарлаа"); setSaving(false); return; }
    setModal(false);
    setSaving(false);
    setForm(emptyForm);
    load();
  }

  const filtered = rows.filter((r) =>
    !search || r.product.name.includes(search) || r.product.code.includes(search)
  );

  const qtyNum = Number(form.qty);
  const stockOk = selectedProduct && qtyNum > 0 && qtyNum <= selectedProduct.totalStock;

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Зарлага</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Нийт {rows.length} бүртгэл</p>
        </div>
        <button onClick={() => { setForm(emptyForm); setError(""); setModal(true); }}
          className="flex items-center gap-2 rounded-xl bg-rose-600 text-white px-4 py-2.5 text-sm font-semibold hover:bg-rose-700 transition">
          <Plus className="w-4 h-4" /> Зарлага бүртгэх
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Бараа хайх..."
          className="w-full rounded-xl border border-input bg-card pl-9 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring transition" />
      </div>

      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <PackageMinus className="w-10 h-10 mb-3 opacity-40" />
            <p className="text-sm">Зарлагын бүртгэл байхгүй</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Огноо</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Бараа</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden md:table-cell">Лот</th>
                  <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Тоо</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden sm:table-cell">Хүлээн авагч</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className="border-b border-border hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 text-muted-foreground">{new Date(r.date).toLocaleDateString("mn-MN")}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{r.product.name}</p>
                      <p className="text-xs text-muted-foreground">{r.product.code}</p>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-muted-foreground font-mono text-xs">{r.batch.batchNo}</td>
                    <td className="px-4 py-3 text-right font-semibold text-rose-600">
                      -{r.qty.toLocaleString("mn-MN")} {r.product.unit}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell text-muted-foreground">{r.recipient ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-card rounded-2xl shadow-2xl border border-border animate-pop-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="font-bold text-foreground">Зарлага бүртгэх</h2>
              <button onClick={() => setModal(false)} className="p-1.5 rounded-lg hover:bg-accent transition"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-6 space-y-4">
              {error && <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>}
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Бараа *</label>
                <select value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value })}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring">
                  <option value="">— сонгоно уу —</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id} disabled={p.totalStock <= 0}>
                      {p.code} — {p.name} (үлдэгдэл: {p.totalStock})
                    </option>
                  ))}
                </select>
              </div>
              {selectedProduct && (
                <div className="rounded-xl bg-blue-50 border border-blue-200 px-4 py-2.5 flex items-center gap-2">
                  <span className="text-sm text-blue-800">Боломжтой үлдэгдэл:</span>
                  <span className="font-bold text-blue-900">{selectedProduct.totalStock.toLocaleString("mn-MN")} {selectedProduct.unit}</span>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Огноо *</label>
                  <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Тоо хэмжээ *</label>
                  <input type="number" min={0} step="0.01" value={form.qty} onChange={(e) => setForm({ ...form, qty: e.target.value })}
                    className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring ${
                      form.qty && !stockOk ? "border-destructive bg-destructive/5" : "border-input bg-background"
                    }`} />
                </div>
              </div>
              {form.qty && !stockOk && selectedProduct && Number(form.qty) > selectedProduct.totalStock && (
                <div className="flex items-center gap-2 rounded-xl bg-orange-50 border border-orange-200 px-4 py-2.5">
                  <AlertTriangle className="w-4 h-4 text-orange-600 flex-shrink-0" />
                  <p className="text-sm text-orange-700">Үлдэгдэл хүрэлцэхгүй байна. FEFO-оор хамгийн хуучин лотоос гаргана.</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Хүлээн авагч</label>
                  <input value={form.recipient} onChange={(e) => setForm({ ...form, recipient: e.target.value })}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Баримтын дугаар</label>
                  <input value={form.docNo} onChange={(e) => setForm({ ...form, docNo: e.target.value })}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 pb-6">
              <button onClick={() => setModal(false)} className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-accent transition">Болих</button>
              <button onClick={save} disabled={saving || !form.productId || !form.qty}
                className="px-4 py-2 rounded-lg bg-rose-600 text-white text-sm font-semibold hover:bg-rose-700 transition disabled:opacity-60 flex items-center gap-2">
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Бүртгэх
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

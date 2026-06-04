"use client";

import { useEffect, useState } from "react";
import { Plus, PackagePlus, X, Loader2, Search } from "lucide-react";

interface StockInRow {
  id: string;
  date: string;
  qty: number;
  unitPrice: number;
  supplier?: string;
  docNo?: string;
  product: { code: string; name: string; unit: string };
  batch: { batchNo: string; expiryDate?: string };
}

interface Product { id: string; code: string; name: string; unit: string; isPerishable: boolean; }

const today = new Date().toISOString().slice(0, 10);

const emptyForm = {
  productId: "", batchNo: `LOT-${today.replace(/-/g, "")}`,
  expiryDate: "", date: today, qty: "", unitPrice: "", supplier: "", docNo: "",
};

export default function StockInClient() {
  const [rows, setRows] = useState<StockInRow[]>([]);
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
      fetch("/api/stock-in").then((r) => r.json()),
      fetch("/api/products").then((r) => r.json()),
    ]).then(([s, p]) => {
      setRows(s);
      setProducts(p);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, []);

  const selectedProduct = products.find((p) => p.id === form.productId);

  async function save() {
    setSaving(true);
    setError("");
    const res = await fetch("/api/stock-in", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        qty: Number(form.qty),
        unitPrice: Number(form.unitPrice),
        expiryDate: form.expiryDate || null,
      }),
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

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Орлого</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Нийт {rows.length} бүртгэл</p>
        </div>
        <button onClick={() => { setForm(emptyForm); setError(""); setModal(true); }}
          className="flex items-center gap-2 rounded-xl bg-emerald-600 text-white px-4 py-2.5 text-sm font-semibold hover:bg-emerald-700 transition">
          <Plus className="w-4 h-4" /> Орлого бүртгэх
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Бараа хайх..." className="w-full rounded-xl border border-input bg-card pl-9 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring transition" />
      </div>

      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <PackagePlus className="w-10 h-10 mb-3 opacity-40" />
            <p className="text-sm">Орлогын бүртгэл байхгүй</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Огноо</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Бараа</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden md:table-cell">Лот</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden lg:table-cell">Дуусах</th>
                  <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Тоо</th>
                  <th className="text-right px-4 py-3 font-semibold text-muted-foreground hidden sm:table-cell">Дүн</th>
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
                    <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground text-xs">
                      {r.batch.expiryDate ? new Date(r.batch.expiryDate).toLocaleDateString("mn-MN") : "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-emerald-600">
                      +{r.qty.toLocaleString("mn-MN")} {r.product.unit}
                    </td>
                    <td className="px-4 py-3 text-right hidden sm:table-cell text-muted-foreground">
                      {(r.qty * r.unitPrice).toLocaleString("mn-MN")} ₮
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-card rounded-2xl shadow-2xl border border-border animate-pop-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-card">
              <h2 className="font-bold text-foreground">Орлого бүртгэх</h2>
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
                    <option key={p.id} value={p.id}>{p.code} — {p.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Лотын дугаар *</label>
                  <input value={form.batchNo} onChange={(e) => setForm({ ...form, batchNo: e.target.value })}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
                </div>
                {selectedProduct?.isPerishable && (
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1">Дуусах хугацаа</label>
                    <input type="date" value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Огноо *</label>
                  <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Тоо хэмжээ *</label>
                  <input type="number" min={0} step="0.01" value={form.qty} onChange={(e) => setForm({ ...form, qty: e.target.value })}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Нэгж үнэ (₮)</label>
                  <input type="number" min={0} value={form.unitPrice} onChange={(e) => setForm({ ...form, unitPrice: e.target.value })}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Нийлүүлэгч</label>
                  <input value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Баримтын дугаар</label>
                <input value={form.docNo} onChange={(e) => setForm({ ...form, docNo: e.target.value })}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
              </div>
              {form.productId && form.qty && form.unitPrice && (
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3">
                  <p className="text-sm text-emerald-800 font-medium">
                    Нийт дүн: {(Number(form.qty) * Number(form.unitPrice)).toLocaleString("mn-MN")} ₮
                  </p>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 px-6 pb-6">
              <button onClick={() => setModal(false)} className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-accent transition">Болих</button>
              <button onClick={save} disabled={saving || !form.productId || !form.qty || !form.batchNo}
                className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition disabled:opacity-60 flex items-center gap-2">
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Бүртгэх
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

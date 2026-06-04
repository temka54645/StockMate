"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Search, Package, AlertTriangle, X, Loader2 } from "lucide-react";

interface Product {
  id: string;
  code: string;
  name: string;
  unit: string;
  category: string;
  unitPrice: number;
  reorderLevel: number;
  isPerishable: boolean;
  totalStock: number;
}

const empty: Omit<Product, "id" | "totalStock"> = {
  code: "", name: "", unit: "ш", category: "Ерөнхий",
  unitPrice: 0, reorderLevel: 0, isPerishable: false,
};

export default function ProductsClient() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<null | "add" | "edit">(null);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    fetch(`/api/products${search ? `?q=${encodeURIComponent(search)}` : ""}`)
      .then((r) => r.json())
      .then((d) => { setProducts(d); setLoading(false); });
  };

  useEffect(() => { load(); }, [search]);

  function openAdd() {
    setForm(empty);
    setError("");
    setModal("add");
  }

  function openEdit(p: Product) {
    setEditing(p);
    setForm({ code: p.code, name: p.name, unit: p.unit, category: p.category, unitPrice: p.unitPrice, reorderLevel: p.reorderLevel, isPerishable: p.isPerishable });
    setError("");
    setModal("edit");
  }

  async function save() {
    setSaving(true);
    setError("");
    const url = modal === "edit" ? `/api/products/${editing!.id}` : "/api/products";
    const method = modal === "edit" ? "PATCH" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, unitPrice: Number(form.unitPrice), reorderLevel: Number(form.reorderLevel) }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? "Алдаа гарлаа"); setSaving(false); return; }
    setModal(null);
    setSaving(false);
    load();
  }

  async function remove(id: string, name: string) {
    if (!confirm(`"${name}" барааг устгах уу?`)) return;
    const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) { alert(data.error ?? "Устгах боломжгүй"); return; }
    load();
  }

  const stockColor = (p: Product) => {
    if (p.totalStock <= 0) return "text-rose-600 bg-rose-50";
    if (p.reorderLevel > 0 && p.totalStock <= p.reorderLevel) return "text-orange-600 bg-orange-50";
    return "text-emerald-600 bg-emerald-50";
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Бараа</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Нийт {products.length} бараа</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-4 py-2.5 text-sm font-semibold hover:opacity-90 transition"
        >
          <Plus className="w-4 h-4" />
          Нэмэх
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Нэр, код хайх..."
          className="w-full rounded-xl border border-input bg-card pl-9 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring transition"
        />
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Package className="w-10 h-10 mb-3 opacity-40" />
            <p className="text-sm">Бараа бүртгэлгүй байна</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Код</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Нэр</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden sm:table-cell">Ангилал</th>
                  <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Үлдэгдэл</th>
                  <th className="text-right px-4 py-3 font-semibold text-muted-foreground hidden md:table-cell">Нэгж үнэ</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className="border-b border-border hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{p.code}</td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-foreground">{p.name}</span>
                      {p.isPerishable && (
                        <span className="ml-2 text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full">хугацаатай</span>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell text-muted-foreground">{p.category}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold ${stockColor(p)}`}>
                        {p.reorderLevel > 0 && p.totalStock <= p.reorderLevel && <AlertTriangle className="w-3 h-3" />}
                        {p.totalStock.toLocaleString("mn-MN")} {p.unit}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right hidden md:table-cell text-muted-foreground">
                      {p.unitPrice.toLocaleString("mn-MN")} ₮
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-accent transition" aria-label="Засах">
                          <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                        </button>
                        <button onClick={() => remove(p.id, p.name)} className="p-1.5 rounded-lg hover:bg-destructive/10 transition" aria-label="Устгах">
                          <Trash2 className="w-3.5 h-3.5 text-destructive/70" />
                        </button>
                      </div>
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
          <div className="w-full max-w-lg bg-card rounded-2xl shadow-2xl border border-border animate-pop-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="font-bold text-foreground">{modal === "add" ? "Бараа нэмэх" : "Бараа засах"}</h2>
              <button onClick={() => setModal(null)} className="p-1.5 rounded-lg hover:bg-accent transition">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {error && <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Код *</label>
                  <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })}
                    disabled={modal === "edit"}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring disabled:opacity-60" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Нэгж</label>
                  <input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Нэр *</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Ангилал</label>
                  <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Нэгж үнэ (₮)</label>
                  <input type="number" min={0} value={form.unitPrice} onChange={(e) => setForm({ ...form, unitPrice: Number(e.target.value) })}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Доод хязгаар</label>
                <input type="number" min={0} value={form.reorderLevel} onChange={(e) => setForm({ ...form, reorderLevel: Number(e.target.value) })}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isPerishable} onChange={(e) => setForm({ ...form, isPerishable: e.target.checked })}
                  className="rounded" />
                <span className="text-sm text-foreground">Дуусах хугацаатай бараа</span>
              </label>
            </div>
            <div className="flex justify-end gap-3 px-6 pb-6">
              <button onClick={() => setModal(null)} className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-accent transition">Болих</button>
              <button onClick={save} disabled={saving}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition disabled:opacity-60 flex items-center gap-2">
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Хадгалах
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

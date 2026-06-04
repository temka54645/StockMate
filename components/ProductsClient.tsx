"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Plus, Pencil, Trash2, Search, Package, AlertTriangle,
  X, Loader2, Barcode, MapPin, ImagePlus, ChevronDown, Check,
} from "lucide-react";

/* ─────────────────────────── Types ─────────────────────────── */
interface Product {
  id: string;
  code: string;
  name: string;
  unit: string;
  category: string;
  unitPrice: number;
  reorderLevel: number;
  isPerishable: boolean;
  imageUrl: string | null;
  barcode: string | null;
  location: string | null;
  totalStock: number;
}

const empty: Omit<Product, "id" | "totalStock"> = {
  code: "", name: "", unit: "ш", category: "Ерөнхий",
  unitPrice: 0, reorderLevel: 0, isPerishable: false,
  imageUrl: null, barcode: null, location: null,
};

/* ─────────────────────── Нэгжийн жагсаалт ──────────────────── */
const UNIT_OPTIONS = [
  { value: "ш",       label: "ш — ширхэг" },
  { value: "кг",      label: "кг — килограмм" },
  { value: "г",       label: "г — грамм" },
  { value: "т",       label: "т — тонн" },
  { value: "л",       label: "л — литр" },
  { value: "мл",      label: "мл — миллилитр" },
  { value: "м",       label: "м — метр" },
  { value: "м²",      label: "м² — дөрвөлжин метр" },
  { value: "м³",      label: "м³ — шоо метр" },
  { value: "хайрцаг", label: "хайрцаг" },
  { value: "боодол",  label: "боодол" },
  { value: "уут",     label: "уут" },
  { value: "савлагаа",label: "савлагаа" },
  { value: "рол",     label: "рол" },
  { value: "иш",      label: "иш" },
];

/* ─────────────────── Нэгж сонгох Combobox ─────────────────── */
function UnitCombobox({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function h(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const filtered = UNIT_OPTIONS.filter(
    (u) => u.label.toLowerCase().includes(search.toLowerCase())
  );
  const isCustom = value && !UNIT_OPTIONS.find((u) => u.value === value);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => { setOpen((v) => !v); setSearch(""); }}
        className="w-full flex items-center justify-between rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring text-left"
      >
        <span className={value ? "text-foreground font-medium" : "text-muted-foreground"}>
          {value || "Сонгох..."}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && createPortal(
        <div
          className="fixed z-[300]"
          style={{
            top: (ref.current?.getBoundingClientRect().bottom ?? 0) + 4,
            left: ref.current?.getBoundingClientRect().left ?? 0,
            width: ref.current?.offsetWidth ?? 200,
          }}
        >
          <div className="bg-popover border border-border rounded-xl shadow-xl overflow-hidden animate-pop-in">
            <div className="p-2 border-b border-border">
              <input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && search.trim()) {
                    onChange(search.trim()); setOpen(false);
                  }
                }}
                placeholder="Хайх эсвэл шинэ нэгж..."
                className="w-full text-sm px-2 py-1.5 rounded-lg bg-background border border-input outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <div className="max-h-48 overflow-y-auto py-1">
              {isCustom && (
                <button
                  onClick={() => { onChange(value); setOpen(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-accent text-left text-sm"
                >
                  <Check className="w-3.5 h-3.5 text-primary" />
                  <span className="font-medium">{value}</span>
                  <span className="text-xs text-muted-foreground ml-auto">одоогийн</span>
                </button>
              )}
              {filtered.map((u) => (
                <button
                  key={u.value}
                  onClick={() => { onChange(u.value); setOpen(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-accent text-left text-sm"
                >
                  <div className="w-3.5 h-3.5 flex-shrink-0">
                    {u.value === value && <Check className="w-3.5 h-3.5 text-primary" />}
                  </div>
                  <span className="font-medium w-10 flex-shrink-0">{u.value}</span>
                  <span className="text-muted-foreground text-xs">{u.label.split("—")[1]?.trim()}</span>
                </button>
              ))}
              {filtered.length === 0 && search && (
                <button
                  onClick={() => { onChange(search.trim()); setOpen(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-accent text-left text-sm text-primary"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>"{search.trim()}" нэмэх</span>
                </button>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

/* ──────────────────── Зураг upload хэсэг ──────────────────── */
function ImageUploader({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (v: string | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  function resizeToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const MAX = 320;
        const ratio = Math.min(MAX / img.width, MAX / img.height, 1);
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * ratio);
        canvas.height = Math.round(img.height * ratio);
        canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(); };
      img.src = url;
    });
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert("Зургийн хэмжээ 5MB-аас хэтрэхгүй байх ёстой"); return; }
    try {
      const dataUrl = await resizeToDataUrl(file);
      onChange(dataUrl);
    } catch {
      alert("Зураг уншихад алдаа гарлаа");
    }
  }

  return (
    <div className="flex gap-4 items-start">
      {/* Preview / Upload zone */}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="relative w-24 h-24 flex-shrink-0 rounded-xl border-2 border-dashed border-border hover:border-primary/60 bg-muted/30 hover:bg-muted/50 transition-colors overflow-hidden group"
      >
        {value ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt="preview" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <ImagePlus className="w-5 h-5 text-white" />
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-1">
            <ImagePlus className="w-6 h-6 text-muted-foreground/60" />
            <span className="text-[10px] text-muted-foreground/60 leading-tight text-center px-1">
              Зураг нэмэх
            </span>
          </div>
        )}
      </button>

      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onFile} />

      <div className="flex-1 space-y-2">
        <p className="text-xs text-muted-foreground">
          JPG, PNG, WebP · Дээд тал 5MB · <br />Автоматаар 320px болгон жижигрүүлнэ
        </p>
        {value && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="text-xs text-destructive hover:underline"
          >
            Зураг устгах
          </button>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════ Main Component ═══════════════════════ */
export default function ProductsClient() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<null | "add" | "edit">(null);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  /* Scroll lock */
  useEffect(() => {
    document.body.style.overflow = modal ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [modal]);

  const load = () => {
    setLoading(true);
    fetch(`/api/products${search ? `?q=${encodeURIComponent(search)}` : ""}`)
      .then((r) => r.json())
      .then((d) => { setProducts(Array.isArray(d) ? d : []); setLoading(false); });
  };

  useEffect(() => { load(); }, [search]);

  function openAdd() { setForm(empty); setError(""); setModal("add"); }

  function openEdit(p: Product) {
    setEditing(p);
    setForm({
      code: p.code, name: p.name, unit: p.unit, category: p.category,
      unitPrice: p.unitPrice, reorderLevel: p.reorderLevel, isPerishable: p.isPerishable,
      imageUrl: p.imageUrl, barcode: p.barcode, location: p.location,
    });
    setError(""); setModal("edit");
  }

  function closeModal() { setModal(null); setEditing(null); setError(""); }

  async function save() {
    setSaving(true); setError("");
    const url = modal === "edit" ? `/api/products/${editing!.id}` : "/api/products";
    const method = modal === "edit" ? "PATCH" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        unitPrice: Number(form.unitPrice),
        reorderLevel: Number(form.reorderLevel),
        barcode: form.barcode?.trim() || null,
        location: form.location?.trim() || null,
      }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? "Алдаа гарлаа"); setSaving(false); return; }
    closeModal(); setSaving(false); load();
  }

  async function remove(id: string, name: string) {
    if (!confirm(`"${name}" барааг устгах уу?`)) return;
    const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) { alert(data.error ?? "Устгах боломжгүй"); return; }
    load();
  }

  const stockColor = (p: Product) => {
    if (p.totalStock <= 0) return "text-rose-600 bg-rose-50 dark:bg-rose-950/40";
    if (p.reorderLevel > 0 && p.totalStock <= p.reorderLevel) return "text-orange-500 bg-orange-50 dark:bg-orange-950/40";
    return "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40";
  };

  /* ────────────────────────── Render ─────────────────────────── */
  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Бараа</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Нийт {products.length} бараа</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-4 py-2.5 text-sm font-semibold hover:opacity-90 transition"
        >
          <Plus className="w-4 h-4" />Нэмэх
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Нэр, код, баркод хайх..."
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
            <button onClick={openAdd} className="mt-3 text-xs text-primary underline underline-offset-2">Эхний бараа нэмэх</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground w-12" />
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
                  <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                    {/* Thumbnail */}
                    <td className="px-3 py-2.5">
                      {p.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.imageUrl} alt={p.name} className="w-9 h-9 rounded-lg object-cover border border-border flex-shrink-0" />
                      ) : (
                        <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                          <Package className="w-4 h-4 text-muted-foreground/40" />
                        </div>
                      )}
                    </td>

                    {/* Код */}
                    <td className="px-4 py-2.5">
                      <span className="font-mono text-xs text-muted-foreground">{p.code}</span>
                    </td>

                    {/* Нэр + тэмдэглэгэд */}
                    <td className="px-4 py-2.5">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-medium text-foreground">{p.name}</span>
                        {p.isPerishable && (
                          <span className="text-[10px] bg-orange-100 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400 px-1.5 py-0.5 rounded-full font-medium">
                            хугацаатай
                          </span>
                        )}
                        {p.barcode && (
                          <span title={`Баркод: ${p.barcode}`} className="inline-flex items-center gap-0.5 text-[10px] bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded-full font-medium">
                            <Barcode className="w-2.5 h-2.5" />
                            {p.barcode}
                          </span>
                        )}
                        {p.location && (
                          <span title={`Байршил: ${p.location}`} className="inline-flex items-center gap-0.5 text-[10px] bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 px-1.5 py-0.5 rounded-full font-medium">
                            <MapPin className="w-2.5 h-2.5" />
                            {p.location}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Ангилал */}
                    <td className="px-4 py-2.5 hidden sm:table-cell text-muted-foreground">{p.category}</td>

                    {/* Үлдэгдэл */}
                    <td className="px-4 py-2.5 text-right">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold ${stockColor(p)}`}>
                        {p.reorderLevel > 0 && p.totalStock <= p.reorderLevel && <AlertTriangle className="w-3 h-3" />}
                        {p.totalStock.toLocaleString("mn-MN")} {p.unit}
                      </span>
                    </td>

                    {/* Нэгж үнэ */}
                    <td className="px-4 py-2.5 text-right hidden md:table-cell text-muted-foreground">
                      {p.unitPrice.toLocaleString("mn-MN")} ₮
                    </td>

                    {/* Үйлдлүүд */}
                    <td className="px-4 py-2.5 text-right">
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

      {/* ═══════════════════════ Modal ═══════════════════════ */}
      {modal && createPortal(
        <div
          className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div className="w-full max-w-xl bg-card rounded-2xl shadow-2xl border border-border animate-pop-in flex flex-col max-h-[90vh]">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
              <h2 className="font-bold text-foreground">{modal === "add" ? "Бараа нэмэх" : "Бараа засах"}</h2>
              <button onClick={closeModal} className="p-1.5 rounded-lg hover:bg-accent transition">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal body — scroll */}
            <div className="p-6 space-y-5 overflow-y-auto">
              {error && <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>}

              {/* ── Зураг ── */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-2">Барааны зураг</label>
                <ImageUploader value={form.imageUrl ?? null} onChange={(v) => setForm({ ...form, imageUrl: v })} />
              </div>

              <div className="border-t border-border" />

              {/* ── Код + нэгж ── */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Код *</label>
                  <input
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                    disabled={modal === "edit"}
                    placeholder="ж: PROD-001"
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring disabled:opacity-60 font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Нэгж *</label>
                  <UnitCombobox value={form.unit} onChange={(v) => setForm({ ...form, unit: v })} />
                </div>
              </div>

              {/* ── Нэр ── */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Нэр *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Барааны бүтэн нэр"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              {/* ── Ангилал + нэгж үнэ ── */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Ангилал</label>
                  <input
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    placeholder="Ерөнхий"
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Нэгж үнэ (₮)</label>
                  <input
                    type="number" min={0}
                    value={form.unitPrice}
                    onChange={(e) => setForm({ ...form, unitPrice: Number(e.target.value) })}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>

              {/* ── Баркод + байршил ── */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">
                    <span className="inline-flex items-center gap-1">
                      <Barcode className="w-3 h-3" /> Баркод / SKU
                    </span>
                  </label>
                  <input
                    value={form.barcode ?? ""}
                    onChange={(e) => setForm({ ...form, barcode: e.target.value || null })}
                    placeholder="ж: 8690555167178"
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> Агуулах байршил
                    </span>
                  </label>
                  <input
                    value={form.location ?? ""}
                    onChange={(e) => setForm({ ...form, location: e.target.value || null })}
                    placeholder="ж: А-1, Rack-3, Shelf B"
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>

              {/* ── Доод хязгаар ── */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Доод хязгаар — дахин захиалах тоо хэмжээ
                </label>
                <input
                  type="number" min={0}
                  value={form.reorderLevel}
                  onChange={(e) => setForm({ ...form, reorderLevel: Number(e.target.value) })}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              {/* ── Checkbox-ууд ── */}
              <div className="flex flex-col gap-2.5 pt-1">
                <label className="flex items-center gap-2.5 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={form.isPerishable}
                    onChange={(e) => setForm({ ...form, isPerishable: e.target.checked })}
                    className="w-4 h-4 rounded border-input accent-primary"
                  />
                  <div>
                    <span className="text-sm font-medium text-foreground">Дуусах хугацаатай бараа</span>
                    <p className="text-xs text-muted-foreground">Лот бүрт expiry date бүртгэнэ</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Modal footer */}
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-border flex-shrink-0">
              <button onClick={closeModal} className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-accent transition">
                Болих
              </button>
              <button
                onClick={save} disabled={saving}
                className="px-5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition disabled:opacity-60 flex items-center gap-2"
              >
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Хадгалах
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

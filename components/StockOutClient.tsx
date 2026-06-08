"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  Plus, PackageMinus, X, Loader2, Search,
  Trash2, Package, AlertTriangle, FileText,
} from "lucide-react";

/* ─── Types ─── */
interface Product {
  id: string; code: string; name: string; unit: string;
  unitPrice: number; totalStock: number;
}
interface DocItem {
  productId: string; code: string; name: string;
  unit: string; qty: number; unitPrice: number;
}
interface StockOutRow {
  id: string; date: string; qty: number; recipient?: string; docNo?: string;
  product: { code: string; name: string; unit: string };
  batch: { batchNo: string };
}

const today = new Date().toISOString().slice(0, 10);

function genDocNo() {
  const d = new Date();
  const rand = Math.floor(Math.random() * 900) + 100;
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}-${rand}`;
}

/* ═══════════════════ НХМаягт БМ-3 Preview ═══════════════════ */
function BM3Preview({
  docNo, date, orgName, recipient, items,
}: {
  docNo: string; date: string; orgName: string; recipient: string; items: DocItem[];
}) {
  const d = new Date(date + "T00:00:00");
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const total = items.reduce((s, i) => s + i.qty * i.unitPrice, 0);
  const trows = Array.from({ length: 20 }, (_, i) => items[i] ?? null);

  const ln = "1px solid #111";
  const ff = "Arial, 'Helvetica Neue', Helvetica, sans-serif";

  /* shared cell style helpers */
  const th = (extra?: React.CSSProperties): React.CSSProperties => ({
    border: ln, textAlign: "center", fontSize: "8.5px",
    padding: "2px 2px", fontWeight: "bold", lineHeight: 1.25, ...extra,
  });
  const td = (extra?: React.CSSProperties): React.CSSProperties => ({
    border: ln, fontSize: "9px", padding: "0 2px", ...extra,
  });

  return (
    <div style={{
      fontFamily: ff,
      background: "#fff",
      color: "#111",
      aspectRatio: "148 / 210",
      display: "flex",
      flexDirection: "column",
      padding: "9px 12px 7px",
      boxSizing: "border-box",
    }}>

      {/* ── 1. Document header ── */}
      <div style={{
        display: "flex", justifyContent: "space-between",
        alignItems: "flex-start", marginBottom: "3px",
      }}>
        <span style={{ fontSize: "10px", fontWeight: "bold", letterSpacing: "0.02em" }}>
          НХМаягт БМ-3
        </span>
        <span style={{
          fontSize: "7px", textAlign: "right", lineHeight: 1.45,
          color: "#333", maxWidth: "58%",
        }}>
          Сангийн сайдын 2017 оны 12 дугаар сарын<br />
          5-ны өдрийн 347 тоот тушаалын хавсрал
        </span>
      </div>

      {/* ── 2. Title ── */}
      <div style={{
        textAlign: "center", fontWeight: "bold",
        fontSize: "12px", textTransform: "uppercase",
        letterSpacing: "0.06em", marginBottom: "5px",
        lineHeight: 1.2,
      }}>
        Зарлагын баримт №{docNo || "____"}
      </div>

      {/* ── 3. Org / Recipient names side by side ── */}
      <div style={{ display: "flex", gap: "14px", marginBottom: "1px" }}>
        <div style={{
          flex: 1, borderBottom: ln,
          fontSize: "9.5px", minHeight: "15px",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          paddingBottom: "1px",
        }}>
          {orgName || " "}
        </div>
        <div style={{
          flex: 1, borderBottom: ln,
          fontSize: "9.5px", minHeight: "15px",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          paddingBottom: "1px",
        }}>
          {recipient || " "}
        </div>
      </div>

      {/* ── 4. Labels ── */}
      <div style={{ display: "flex", gap: "14px", marginBottom: "5px" }}>
        <div style={{ flex: 1, fontSize: "7px", color: "#555", textAlign: "center" }}>
          (байгуулагын нэр)
        </div>
        <div style={{ flex: 1, fontSize: "7px", color: "#555", textAlign: "center" }}>
          (худалдан авагчийн нэр)
        </div>
      </div>

      {/* ── 5. Registration numbers ── */}
      <div style={{ display: "flex", gap: "14px", alignItems: "center", marginBottom: "5px" }}>
        {[0, 1].map((side) => (
          <div key={side} style={{ flex: 1, display: "flex", alignItems: "center", gap: "5px" }}>
            <span style={{ fontSize: "9px", whiteSpace: "nowrap" }}>Регистрийн №</span>
            <div style={{ display: "flex" }}>
              {[...Array(7)].map((_, i) => (
                <div key={i} style={{
                  border: ln, width: "13px", height: "13px",
                  marginLeft: i === 0 ? 0 : "-1px",
                }} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* ── 6. Date / Carrier ── */}
      <div style={{ display: "flex", gap: "14px", marginBottom: "6px", alignItems: "baseline" }}>
        <div style={{ flex: 1, fontSize: "9px" }}>
          20{String(year).slice(2)} оны&nbsp;
          <span style={{ borderBottom: ln, padding: "0 4px", fontSize: "9px" }}>{month}</span>
          &nbsp;сарын&nbsp;
          <span style={{ borderBottom: ln, padding: "0 4px", fontSize: "9px" }}>{day}</span>
          &nbsp;өдөр
        </div>
        <div style={{ flex: 1, fontSize: "7px", color: "#555", textAlign: "center" }}>
          (тээвэрлэгчийн хаяг, албан тушаал, нэр)
        </div>
      </div>

      {/* ── 7. Table ── */}
      <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <table style={{
          width: "100%", height: "100%",
          borderCollapse: "collapse",
          tableLayout: "fixed",
        }}>
          <colgroup>
            <col style={{ width: "18px" }} />
            <col />
            <col style={{ width: "28px" }} />
            <col style={{ width: "24px" }} />
            <col style={{ width: "30px" }} />
            <col style={{ width: "52px" }} />
            <col style={{ width: "54px" }} />
          </colgroup>
          <thead>
            <tr>
              <th rowSpan={2} style={th({ borderTop: ln })}>№</th>
              <th rowSpan={2} style={th({ borderTop: ln })}>
                Материалын үнэт зүйлийн<br />нэр, зэрэг, дугаар
              </th>
              <th rowSpan={2} style={th({ borderTop: ln })}>Код</th>
              <th rowSpan={2} style={th({ borderTop: ln, fontSize: "7.5px" })}>
                Хэм-<br />жих<br />нэгж
              </th>
              <th colSpan={3} style={th({ borderTop: ln })}>Худалдах</th>
            </tr>
            <tr>
              <th style={th()}>Тоо</th>
              <th style={th()}>Нэгжийн үнэ</th>
              <th style={th()}>Нийт дүн</th>
            </tr>
          </thead>
          <tbody>
            {trows.map((item, idx) => (
              <tr key={idx}>
                <td style={td({ textAlign: "center" })}>{idx + 1}</td>
                <td style={td({ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" })}>
                  {item?.name ?? ""}
                </td>
                <td style={td({ textAlign: "center" })}>{item?.code ?? ""}</td>
                <td style={td({ textAlign: "center" })}>{item?.unit ?? ""}</td>
                <td style={td({ textAlign: "right" })}>
                  {item ? item.qty.toLocaleString("mn-MN") : ""}
                </td>
                <td style={td({ textAlign: "right" })}>
                  {item?.unitPrice ? item.unitPrice.toLocaleString("mn-MN") : ""}
                </td>
                <td style={td({ textAlign: "right" })}>
                  {item ? (item.qty * item.unitPrice).toLocaleString("mn-MN") : ""}
                </td>
              </tr>
            ))}
            <tr>
              <td colSpan={4} style={td({ textAlign: "center", fontWeight: "bold", fontSize: "8.5px", padding: "2px" })}>
                Дүн
              </td>
              <td style={td()} />
              <td style={td()} />
              <td style={td({ textAlign: "right", fontWeight: "bold" })}>
                {total > 0 ? total.toLocaleString("mn-MN") : ""}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ── 8. Signatures ── */}
      <div style={{ paddingTop: "7px", paddingBottom: "5px", fontSize: "8.5px", display: "flex", gap: "6px" }}>
        <div style={{ flexShrink: 0, paddingTop: "1px", fontWeight: "bold" }}>Тэмдэг</div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "5px" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
            <span style={{ flexShrink: 0 }}>Хүлээлгэн өгсөн эд хариуцагч:</span>
            <span style={{ flex: 1, borderBottom: "1px dotted #111" }} />
            <span style={{ paddingLeft: "2px" }}>/</span>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
            <span style={{ flexShrink: 0 }}>Хүлээн авагч</span>
            <span style={{ flex: 1, borderBottom: "1px dotted #111" }} />
            <span style={{ paddingLeft: "2px" }}>/</span>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
            <span style={{ flexShrink: 0 }}>Шалгасан нягтлан бодогч</span>
            <span style={{ flex: 1, borderBottom: "1px dotted #111" }} />
            <span style={{ paddingLeft: "2px" }}>/</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════ Product Picker Modal ═══════════════════ */
function ProductPicker({
  products, added, onPick, onClose,
}: {
  products: Product[];
  added: string[];
  onPick: (p: Product) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");
  const filtered = products.filter(
    (p) =>
      p.totalStock > 0 &&
      (p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.code.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div
      className="fixed inset-0 bg-black/50 z-[300] flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-md bg-card rounded-2xl shadow-2xl border border-border flex flex-col max-h-[70vh] animate-pop-in">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
          <h3 className="font-semibold text-sm">Агуулахаас сонгох</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-accent transition">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-3 border-b border-border flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Нэр эсвэл код хайх..."
              className="w-full rounded-lg border border-input bg-background pl-8 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>
        <div className="overflow-y-auto flex-1 py-1">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Package className="w-8 h-8 mb-2 opacity-40" />
              <p className="text-sm">Бараа олдсонгүй</p>
            </div>
          ) : (
            filtered.map((p) => {
              const isAdded = added.includes(p.id);
              return (
                <button
                  key={p.id}
                  onClick={() => !isAdded && onPick(p)}
                  disabled={isAdded}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-accent transition ${isAdded ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                    <Package className="w-4 h-4 text-muted-foreground/60" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.code} · үлдэгдэл: {p.totalStock.toLocaleString("mn-MN")} {p.unit}
                    </p>
                  </div>
                  {isAdded && (
                    <span className="text-xs text-muted-foreground flex-shrink-0">Нэмэгдсэн</span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════ Main Component ═══════════════════════ */
export default function StockOutClient() {
  const [rows, setRows] = useState<StockOutRow[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [mounted, setMounted] = useState(false);

  const [panel, setPanel] = useState(false);
  const [orgName, setOrgName] = useState("");
  const [docNo, setDocNo] = useState(genDocNo());
  const [date, setDate] = useState(today);
  const [recipient, setRecipient] = useState("");
  const [items, setItems] = useState<DocItem[]>([]);
  const [picker, setPicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    document.body.style.overflow = panel ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [panel]);

  const load = () => {
    setLoading(true);
    Promise.all([
      fetch("/api/stock-out").then((r) => r.json()),
      fetch("/api/products").then((r) => r.json()),
      fetch("/api/warehouses").then((r) => r.json()),
    ]).then(([s, p, w]) => {
      setRows(Array.isArray(s) ? s : []);
      setProducts(Array.isArray(p) ? p : []);
      if (Array.isArray(w) && w.length > 0) setOrgName(w[0].name);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, []);

  function openPanel() {
    setDocNo(genDocNo());
    setDate(today);
    setRecipient("");
    setItems([]);
    setError("");
    setPanel(true);
  }

  function closePanel() { setPanel(false); setError(""); }

  function addProduct(p: Product) {
    setItems((prev) => [
      ...prev,
      { productId: p.id, code: p.code, name: p.name, unit: p.unit, qty: 1, unitPrice: p.unitPrice },
    ]);
    setPicker(false);
  }

  function updateQty(idx: number, qty: number) {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, qty } : it)));
  }

  function updatePrice(idx: number, unitPrice: number) {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, unitPrice } : it)));
  }

  function removeItem(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }

  const total = items.reduce((s, i) => s + i.qty * i.unitPrice, 0);
  const addedIds = items.map((i) => i.productId);

  async function save() {
    if (items.length === 0) { setError("Хамгийн багадаа 1 бараа нэмэх хэрэгтэй"); return; }
    setSaving(true);
    setError("");

    const results = await Promise.all(
      items.map((item) =>
        fetch("/api/stock-out", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productId: item.productId,
            date,
            qty: item.qty,
            recipient: recipient.trim() || undefined,
            docNo: docNo.trim() || undefined,
          }),
        }).then((r) => r.json().then((data) => ({ ok: r.ok, data })))
      )
    );

    const failed = results.find((r) => !r.ok);
    if (failed) { setError(failed.data.error ?? "Алдаа гарлаа"); setSaving(false); return; }
    setSaving(false);
    closePanel();
    load();
  }

  const filtered = rows.filter(
    (r) =>
      !search ||
      r.product.name.toLowerCase().includes(search.toLowerCase()) ||
      r.product.code.toLowerCase().includes(search.toLowerCase())
  );

  /* ─── Full-screen panel ─── */
  const panelContent = (
    <div className="fixed inset-0 z-[200] bg-background flex flex-col">
      {/* Panel header */}
      <div className="flex items-center justify-between px-6 py-3.5 border-b border-border bg-card flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-950/50 flex items-center justify-center">
            <PackageMinus className="w-4 h-4 text-rose-600" />
          </div>
          <div>
            <h2 className="font-bold text-foreground text-sm">Зарлагын баримт бүртгэх</h2>
            <p className="text-xs text-muted-foreground">НХМаягт БМ-3</p>
          </div>
        </div>
        <button onClick={closePanel} className="p-1.5 rounded-lg hover:bg-accent transition">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Split body */}
      <div className="flex-1 flex overflow-hidden">

        {/* ── LEFT: Form ── */}
        <div className="w-[420px] flex-shrink-0 border-r border-border flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {error && (
              <div className="flex items-center gap-2 rounded-xl bg-destructive/10 border border-destructive/20 px-3 py-2">
                <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {/* Doc info */}
            <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-3">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                Баримтын мэдээлэл
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Баримтын №</label>
                  <input
                    value={docNo}
                    onChange={(e) => setDocNo(e.target.value)}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Огноо</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Байгуулагын нэр</label>
                <input
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  Хүлээн авагч (байгуулага / хүн)
                </label>
                <input
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder="Худалдан авагчийн нэр..."
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>

            {/* Items */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Бараа</p>
                <button
                  onClick={() => setPicker(true)}
                  className="flex items-center gap-1.5 rounded-lg bg-primary/10 text-primary px-3 py-1.5 text-xs font-semibold hover:bg-primary/20 transition"
                >
                  <Package className="w-3.5 h-3.5" />
                  Агуулахаас нэмэх
                </button>
              </div>

              {items.length === 0 ? (
                <div className="rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <Package className="w-8 h-8 mb-2 opacity-30" />
                  <p className="text-sm">Бараа нэмэгдээгүй байна</p>
                  <button
                    onClick={() => setPicker(true)}
                    className="mt-2 text-xs text-primary underline underline-offset-2"
                  >
                    Агуулахаас нэмэх
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {items.map((item, idx) => {
                    const product = products.find((p) => p.id === item.productId);
                    const maxQty = product?.totalStock ?? Infinity;
                    const qtyOk = item.qty > 0 && item.qty <= maxQty;
                    return (
                      <div key={idx} className="rounded-xl border border-border bg-card p-3 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{item.name}</p>
                            <p className="text-xs text-muted-foreground">{item.code} · {item.unit}</p>
                          </div>
                          <button
                            onClick={() => removeItem(idx)}
                            className="p-1 rounded-lg hover:bg-destructive/10 transition flex-shrink-0"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-destructive/60" />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-xs text-muted-foreground block mb-1">
                              Тоо ({item.unit})
                              {product && (
                                <span className="text-muted-foreground/60">
                                  {" "}/ max {product.totalStock.toLocaleString("mn-MN")}
                                </span>
                              )}
                            </label>
                            <input
                              type="number" min={0.01} step="0.01"
                              value={item.qty}
                              onChange={(e) => updateQty(idx, Number(e.target.value))}
                              className={`w-full rounded-lg border px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring ${
                                !qtyOk ? "border-destructive bg-destructive/5" : "border-input bg-background"
                              }`}
                            />
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground block mb-1">Нэгж үнэ (₮)</label>
                            <input
                              type="number" min={0}
                              value={item.unitPrice}
                              onChange={(e) => updatePrice(idx, Number(e.target.value))}
                              className="w-full rounded-lg border border-input bg-background px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                            />
                          </div>
                        </div>
                        {!qtyOk && item.qty > 0 && (
                          <p className="text-xs text-destructive flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            Үлдэгдэл хүрэлцэхгүй
                          </p>
                        )}
                      </div>
                    );
                  })}

                  {/* Total */}
                  <div className="rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 px-4 py-2.5 flex justify-between items-center">
                    <span className="text-sm font-medium text-rose-800 dark:text-rose-300">Нийт дүн</span>
                    <span className="text-sm font-bold text-rose-700 dark:text-rose-300">
                      {total.toLocaleString("mn-MN")} ₮
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 px-5 py-4 border-t border-border flex-shrink-0">
            <button
              onClick={closePanel}
              className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-accent transition"
            >
              Болих
            </button>
            <button
              onClick={save}
              disabled={saving || items.length === 0}
              className="px-5 py-2 rounded-lg bg-rose-600 text-white text-sm font-semibold hover:bg-rose-700 transition disabled:opacity-60 flex items-center gap-2"
            >
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Зарлага бүртгэх
            </button>
          </div>
        </div>

        {/* ── RIGHT: БМ-3 Preview ── */}
        <div className="flex-1 bg-slate-100 dark:bg-slate-900/40 overflow-y-auto flex flex-col items-center justify-center">
          <div className="px-6 py-2.5 w-full border-b border-border bg-card/60 flex items-center gap-2 flex-shrink-0">
            <FileText className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
              Бодит хэвлэгдэх хувилбар (А5)
            </span>
          </div>
          <div className="flex-1 flex items-start justify-center p-8 w-full">
            <div style={{
              width: "100%",
              maxWidth: "460px",
              boxShadow: "0 4px 24px rgba(0,0,0,0.18)",
              border: "1px solid #ccc",
              background: "#fff",
            }}>
              <BM3Preview
                docNo={docNo}
                date={date}
                orgName={orgName}
                recipient={recipient}
                items={items}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  /* ─── Page render ─── */
  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Зарлага</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Нийт {rows.length} бүртгэл</p>
        </div>
        <button
          onClick={openPanel}
          className="flex items-center gap-2 rounded-xl bg-rose-600 text-white px-4 py-2.5 text-sm font-semibold hover:bg-rose-700 transition"
        >
          <Plus className="w-4 h-4" /> Зарлага бүртгэх
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Бараа хайх..."
          className="w-full rounded-xl border border-input bg-card pl-9 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring transition"
        />
      </div>

      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
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
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden md:table-cell">Баримт №</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {new Date(r.date).toLocaleDateString("mn-MN")}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{r.product.name}</p>
                      <p className="text-xs text-muted-foreground">{r.product.code}</p>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-muted-foreground font-mono text-xs">
                      {r.batch.batchNo}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-semibold text-rose-600">
                        -{r.qty.toLocaleString("mn-MN")} {r.product.unit}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell text-muted-foreground">{r.recipient ?? "—"}</td>
                    <td className="px-4 py-3 hidden md:table-cell text-muted-foreground font-mono text-xs">
                      {r.docNo ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {mounted && panel && createPortal(panelContent, document.body)}
      {mounted && picker && createPortal(
        <ProductPicker
          products={products}
          added={addedIds}
          onPick={addProduct}
          onClose={() => setPicker(false)}
        />,
        document.body
      )}
    </div>
  );
}

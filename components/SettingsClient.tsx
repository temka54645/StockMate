"use client";

import { useEffect, useState } from "react";
import { Settings, Save, Loader2, Bell, Mail, Smartphone, Warehouse } from "lucide-react";
import StaffSection from "@/components/StaffSection";

interface NotifSettings {
  expiryThresholds: number[];
  lowStockEnabled: boolean;
  emailEnabled: boolean;
  pushEnabled: boolean;
  dailyScanHour: number;
}

interface WarehouseInfo {
  capacity: number | null;
  capacityUnit: string;
}

const defaultSettings: NotifSettings = {
  expiryThresholds: [60, 30, 14, 7],
  lowStockEnabled: true,
  emailEnabled: true,
  pushEnabled: false,
  dailyScanHour: 8,
};

const UNIT_PRESETS = ["нэгж", "ш", "кг", "т", "м³", "паллет", "хайрцаг", "рол"];

export default function SettingsClient() {
  const [settings, setSettings]       = useState<NotifSettings>(defaultSettings);
  const [wh, setWh]                   = useState<WarehouseInfo>({ capacity: null, capacityUnit: "нэгж" });
  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState(false);
  const [savingWh, setSavingWh]       = useState(false);
  const [saved, setSaved]             = useState(false);
  const [savedWh, setSavedWh]         = useState(false);
  const [thresholdInput, setThresholdInput] = useState("60,30,14,7");
  const [capacityInput, setCapacityInput]   = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/settings").then((r) => r.json()),
      fetch("/api/warehouses").then((r) => r.json()),
    ]).then(([s, ws]) => {
      if (s) {
        setSettings(s);
        setThresholdInput(s.expiryThresholds?.join(",") ?? "60,30,14,7");
      }
      // ws нь array — эхний (одоогийн) агуулахыг аваарай
      // Идэвхтэй агуулахын capacity-г тохируулна
      // Бид /api/warehouses PATCH ашиглах учраас active-wh cookie-тэй req илгээнэ
      // Гэхдээ ws[0] буюу одоогийн агуулахыг cookie-гаар серверт тодорхойлдог
      // Тиймээс dashboard-аас capacity авах нь хамгийн найдвартай
      fetch("/api/dashboard").then((r) => r.json()).then((d) => {
        setWh({ capacity: d.capacity ?? null, capacityUnit: d.capacityUnit ?? "нэгж" });
        setCapacityInput(d.capacity?.toString() ?? "");
        setLoading(false);
      });
    });
  }, []);

  /* ── Мэдэгдлийн тохиргоо хадгалах ── */
  async function saveNotif() {
    setSaving(true);
    const thresholds = thresholdInput
      .split(",")
      .map((s) => parseInt(s.trim()))
      .filter((n) => !isNaN(n) && n > 0);
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...settings, expiryThresholds: thresholds }),
    });
    setSaving(false);
    if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 2500); }
  }

  /* ── Агуулахын тохиргоо хадгалах ── */
  async function saveWarehouse() {
    setSavingWh(true);
    const capNum = parseFloat(capacityInput);
    const res = await fetch("/api/warehouses", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        capacity: capacityInput.trim() === "" ? null : isNaN(capNum) ? null : capNum,
        capacityUnit: wh.capacityUnit,
      }),
    });
    const data = await res.json();
    setSavingWh(false);
    if (res.ok) {
      setWh({ capacity: data.capacity, capacityUnit: data.capacityUnit });
      setSavedWh(true);
      setTimeout(() => setSavedWh(false), 2500);
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in-up max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Тохиргоо</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Агуулах, ажилчид болон мэдэгдлийн тохиргоо</p>
      </div>

      {/* ── Ажилчдын бүртгэл ── */}
      <StaffSection />

      {/* ── Агуулахын тохиргоо ── */}
      <div className="rounded-2xl border border-border bg-card shadow-sm p-6 space-y-5">
        <div className="flex items-center gap-3 pb-4 border-b border-border">
          <div className="w-9 h-9 rounded-xl bg-violet-500/10 flex items-center justify-center">
            <Warehouse className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <p className="font-semibold text-foreground">Агуулахын тохиргоо</p>
            <p className="text-xs text-muted-foreground">Нийт багтаамж болон хэмжих нэгж</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-foreground block mb-1">
              Нийт багтаамж
            </label>
            <p className="text-xs text-muted-foreground mb-2">
              Агуулахын дээд хязгаар. Dashboard-д дүүргэлтийн хувь тооцоход ашиглана.
              Хоосон орхивол дүүргэлт тооцохгүй.
            </p>
            <div className="flex gap-2">
              <input
                type="number"
                min={0}
                step="any"
                value={capacityInput}
                onChange={(e) => setCapacityInput(e.target.value)}
                placeholder="ж: 10000"
                className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
              <select
                value={wh.capacityUnit}
                onChange={(e) => setWh({ ...wh, capacityUnit: e.target.value })}
                className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              >
                {UNIT_PRESETS.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Preset быстр товчлол */}
          <div className="flex flex-wrap gap-2">
            {[100, 500, 1000, 5000, 10000, 50000].map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setCapacityInput(String(v))}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                  capacityInput === String(v)
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border hover:bg-accent"
                }`}
              >
                {v.toLocaleString("mn-MN")}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setCapacityInput("")}
              className="px-3 py-1.5 rounded-lg text-xs font-medium border border-border hover:bg-accent transition text-muted-foreground"
            >
              Тохируулаагүй
            </button>
          </div>

          {/* Одоогийн байдал */}
          {wh.capacity !== null && (
            <div className="rounded-xl bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800 px-4 py-3">
              <p className="text-sm text-violet-800 dark:text-violet-300">
                Одоогийн тохиргоо: <span className="font-bold">{wh.capacity.toLocaleString("mn-MN")} {wh.capacityUnit}</span>
              </p>
            </div>
          )}
        </div>

        <button
          onClick={saveWarehouse}
          disabled={savingWh}
          className="flex items-center gap-2 rounded-xl bg-violet-600 text-white px-5 py-2.5 text-sm font-semibold hover:bg-violet-700 transition disabled:opacity-60"
        >
          {savingWh ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {savedWh ? "Хадгалагдлаа ✓" : "Багтаамж хадгалах"}
        </button>
      </div>

      {/* ── Мэдэгдлийн тохиргоо ── */}
      <div className="rounded-2xl border border-border bg-card shadow-sm p-6 space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-border">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <Bell className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-foreground">Мэдэгдлийн тохиргоо</p>
            <p className="text-xs text-muted-foreground">Хугацаа болон үлдэгдлийн сэрэмжлүүлэг</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-foreground block mb-1">
              Хугацааны босго өдрүүд
            </label>
            <p className="text-xs text-muted-foreground mb-2">
              Таслалаар тусгаарласан өдрийн тоо. Ж: 60,30,14,7 — эдгээр өдрийн дотор дуусах batch-уудад мэдэгдэл илгээнэ.
            </p>
            <input
              value={thresholdInput}
              onChange={(e) => setThresholdInput(e.target.value)}
              placeholder="60,30,14,7"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-foreground block mb-1">
              Өдрийн скан хийх цаг
            </label>
            <select
              value={settings.dailyScanHour}
              onChange={(e) => setSettings({ ...settings, dailyScanHour: Number(e.target.value) })}
              className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            >
              {Array.from({ length: 24 }, (_, i) => (
                <option key={i} value={i}>{String(i).padStart(2, "0")}:00</option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-3 pt-4 border-t border-border">
          {[
            { key: "lowStockEnabled" as const, icon: Settings, label: "Доод үлдэгдлийн мэдэгдэл", desc: "Үлдэгдэл доод хязгаараас доош орвол мэдэгдэнэ" },
            { key: "emailEnabled"    as const, icon: Mail,     label: "Имэйл мэдэгдэл",           desc: "Resend-ээр бүртгэлтэй имэйл рүү илгээнэ" },
            { key: "pushEnabled"     as const, icon: Smartphone, label: "Push мэдэгдэл",          desc: "Browser Push Notification (браузер зөвшөөрсөн бол)" },
          ].map(({ key, icon: Icon, label, desc }) => (
            <label
              key={key}
              className="flex items-center justify-between gap-4 p-4 rounded-xl border border-border hover:bg-accent/50 cursor-pointer transition"
            >
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-foreground">{label}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
              </div>
              <div
                onClick={() => setSettings({ ...settings, [key]: !settings[key] })}
                className={`relative w-10 h-6 rounded-full transition-colors cursor-pointer flex-shrink-0 ${settings[key] ? "bg-primary" : "bg-muted"}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${settings[key] ? "translate-x-4" : ""}`} />
              </div>
            </label>
          ))}
        </div>

        <button
          onClick={saveNotif}
          disabled={saving}
          className="flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-6 py-2.5 text-sm font-semibold hover:opacity-90 transition disabled:opacity-60"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saved ? "Хадгалагдлаа ✓" : "Мэдэгдэл хадгалах"}
        </button>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Settings, Save, Loader2, Bell, Mail, Smartphone } from "lucide-react";

interface NotifSettings {
  expiryThresholds: number[];
  lowStockEnabled: boolean;
  emailEnabled: boolean;
  pushEnabled: boolean;
  dailyScanHour: number;
}

const defaultSettings: NotifSettings = {
  expiryThresholds: [60, 30, 14, 7],
  lowStockEnabled: true,
  emailEnabled: true,
  pushEnabled: false,
  dailyScanHour: 8,
};

export default function SettingsClient() {
  const [settings, setSettings] = useState<NotifSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [thresholdInput, setThresholdInput] = useState("60,30,14,7");

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        if (d) {
          setSettings(d);
          setThresholdInput(d.expiryThresholds?.join(",") ?? "60,30,14,7");
        }
        setLoading(false);
      });
  }, []);

  async function save() {
    setSaving(true);
    const thresholds = thresholdInput.split(",").map((s) => parseInt(s.trim())).filter((n) => !isNaN(n) && n > 0);
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...settings, expiryThresholds: thresholds }),
    });
    setSaving(false);
    if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 2000); }
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
        <p className="text-sm text-muted-foreground mt-0.5">Мэдэгдлийн тохиргоо</p>
      </div>

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
            { key: "emailEnabled" as const, icon: Mail, label: "Имэйл мэдэгдэл", desc: "Resend-ээр бүртгэлтэй имэйл рүү илгээнэ" },
            { key: "pushEnabled" as const, icon: Smartphone, label: "Push мэдэгдэл", desc: "Browser Push Notification (браузер зөвшөөрсөн бол)" },
          ].map(({ key, icon: Icon, label, desc }) => (
            <label key={key} className="flex items-center justify-between gap-4 p-4 rounded-xl border border-border hover:bg-accent/50 cursor-pointer transition">
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-foreground">{label}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
              </div>
              <div
                onClick={() => setSettings({ ...settings, [key]: !settings[key] })}
                className={`relative w-10 h-6 rounded-full transition-colors cursor-pointer ${settings[key] ? "bg-primary" : "bg-muted"}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${settings[key] ? "translate-x-4" : ""}`} />
              </div>
            </label>
          ))}
        </div>
      </div>

      <button onClick={save} disabled={saving}
        className="flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-6 py-2.5 text-sm font-semibold hover:opacity-90 transition disabled:opacity-60">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        {saved ? "Хадгалагдлаа ✓" : "Хадгалах"}
      </button>
    </div>
  );
}

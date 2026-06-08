"use client";

import { useEffect, useState } from "react";
import { Users, Plus, Trash2, Loader2, Phone, Mail, ChevronDown } from "lucide-react";

interface StaffMember {
  id: string;
  name: string;
  role: "manager" | "staff" | "viewer";
  phone: string | null;
  email: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
}

const ROLE_LABELS: Record<string, string> = {
  manager: "Менежер",
  staff: "Ажилтан",
  viewer: "Харагч",
};

const ROLE_COLORS: Record<string, string> = {
  manager: "bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300",
  staff:   "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300",
  viewer:  "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
};

const emptyForm = { name: "", role: "staff" as const, phone: "", email: "", notes: "" };

export default function StaffSection() {
  const [staff, setStaff]         = useState<StaffMember[]>([]);
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [form, setForm]           = useState(emptyForm);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingRole, setEditingRole] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/staff")
      .then((r) => r.json())
      .then((d) => { setStaff(d); setLoading(false); });
  }, []);

  async function addStaff() {
    if (!form.name.trim()) { setError("Нэр шаардлагатай"); return; }
    setSaving(true);
    setError("");
    const res = await fetch("/api/staff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name.trim(),
        role: form.role,
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
        notes: form.notes.trim() || null,
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setError(data.error ?? "Алдаа гарлаа"); return; }
    setStaff((prev) => [...prev, data]);
    setForm(emptyForm);
    setShowForm(false);
  }

  async function deleteStaff(id: string) {
    setDeletingId(id);
    const res = await fetch(`/api/staff/${id}`, { method: "DELETE" });
    setDeletingId(null);
    if (res.ok) setStaff((prev) => prev.filter((s) => s.id !== id));
  }

  async function changeRole(id: string, role: string) {
    setEditingRole(id);
    const res = await fetch(`/api/staff/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    setEditingRole(null);
    if (res.ok) {
      const updated = await res.json();
      setStaff((prev) => prev.map((s) => (s.id === id ? updated : s)));
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center">
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="font-semibold text-foreground">Ажилчдын бүртгэл</p>
            <p className="text-xs text-muted-foreground">Агуулахад ажиллах хүмүүс</p>
          </div>
        </div>
        <button
          onClick={() => { setShowForm((v) => !v); setError(""); }}
          className="flex items-center gap-1.5 rounded-xl bg-blue-600 text-white px-3 py-2 text-xs font-semibold hover:bg-blue-700 transition"
        >
          <Plus className="w-3.5 h-3.5" />
          Нэмэх
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20 p-4 space-y-3">
          <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">Шинэ ажилтан</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-foreground/70 block mb-1">Нэр *</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Б. Болд"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground/70 block mb-1">Үүрэг</label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value as typeof form.role })}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="manager">Менежер</option>
                <option value="staff">Ажилтан</option>
                <option value="viewer">Харагч</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-foreground/70 block mb-1">Утас</label>
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="9911-2233"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground/70 block mb-1">Имэйл</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="test@example.com"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-foreground/70 block mb-1">Тэмдэглэл</label>
            <input
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Нэмэлт мэдээлэл..."
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
          <div className="flex gap-2 pt-1">
            <button
              onClick={addStaff}
              disabled={saving}
              className="flex items-center gap-1.5 rounded-xl bg-blue-600 text-white px-4 py-2 text-sm font-semibold hover:bg-blue-700 disabled:opacity-60 transition"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              Нэмэх
            </button>
            <button
              onClick={() => { setShowForm(false); setError(""); setForm(emptyForm); }}
              className="rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-accent transition"
            >
              Болих
            </button>
          </div>
        </div>
      )}

      {/* Staff list */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : staff.length === 0 ? (
        <div className="text-center py-8">
          <Users className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Ажилтан бүртгэгдээгүй байна</p>
          <p className="text-xs text-muted-foreground/60 mt-0.5">"Нэмэх" товч дарж ажилтан нэмнэ үү</p>
        </div>
      ) : (
        <div className="space-y-2">
          {staff.map((member) => (
            <div
              key={member.id}
              className="flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-accent/30 transition"
            >
              {/* Avatar */}
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-primary">
                  {member.name.charAt(0).toUpperCase()}
                </span>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm text-foreground truncate">{member.name}</span>
                  {/* Role badge — clickable */}
                  <div className="relative">
                    <select
                      value={member.role}
                      onChange={(e) => changeRole(member.id, e.target.value)}
                      disabled={editingRole === member.id}
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full border-0 cursor-pointer outline-none appearance-none pr-5 ${ROLE_COLORS[member.role]}`}
                    >
                      <option value="manager">Менежер</option>
                      <option value="staff">Ажилтан</option>
                      <option value="viewer">Харагч</option>
                    </select>
                    <ChevronDown className="absolute right-1 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none opacity-60" />
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                  {member.phone && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Phone className="w-3 h-3" /> {member.phone}
                    </span>
                  )}
                  {member.email && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Mail className="w-3 h-3" /> {member.email}
                    </span>
                  )}
                  {member.notes && (
                    <span className="text-xs text-muted-foreground/60 italic truncate max-w-[200px]">{member.notes}</span>
                  )}
                </div>
              </div>

              {/* Delete */}
              <button
                onClick={() => deleteStaff(member.id)}
                disabled={deletingId === member.id}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition flex-shrink-0"
                title="Хасах"
              >
                {deletingId === member.id
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <Trash2 className="w-4 h-4" />
                }
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

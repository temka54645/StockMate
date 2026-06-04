"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { ChevronsUpDown, Plus, Check, Loader2, Warehouse } from "lucide-react";
import { switchWarehouseAction, createWarehouseAction } from "@/lib/warehouse-actions";
import { useRouter } from "next/navigation";

interface WarehouseOption {
  id: string;
  name: string;
  productCount: number;
}

/** Агуулахын нэрийн эхний үсгийг аватар болгон харуулна */
function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" }) {
  const letter = name.trim()[0]?.toUpperCase() ?? "А";
  // Нэрнээс тогтмол өнгө үүсгэнэ
  const colors = [
    "bg-violet-500", "bg-blue-500", "bg-emerald-500",
    "bg-orange-500", "bg-rose-500", "bg-cyan-500", "bg-amber-500",
  ];
  const color = colors[name.charCodeAt(0) % colors.length];
  const cls = size === "sm"
    ? "w-5 h-5 rounded-md text-[10px]"
    : "w-7 h-7 rounded-lg text-xs";
  return (
    <span className={`${cls} ${color} text-white font-bold flex items-center justify-center flex-shrink-0`}>
      {letter}
    </span>
  );
}

export default function WarehouseSwitcher({
  warehouses,
  activeWarehouseId,
}: {
  warehouses: WarehouseOption[];
  activeWarehouseId: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [isPending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const active = warehouses.find((w) => w.id === activeWarehouseId);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setCreating(false);
        setNewName("");
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  useEffect(() => {
    if (creating) inputRef.current?.focus();
  }, [creating]);

  function switchWarehouse(id: string) {
    if (id === activeWarehouseId) { setOpen(false); return; }
    setOpen(false);
    startTransition(async () => {
      await switchWarehouseAction(id);
      router.refresh();
    });
  }

  function handleCreate() {
    if (!newName.trim() || isPending) return;
    startTransition(async () => {
      await createWarehouseAction(newName.trim());
      setNewName("");
      setCreating(false);
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <div ref={ref} className="relative px-2 py-2">
      {/* Trigger — sidebar header-ийн нэг хэсэг болгон харагдана */}
      <button
        onClick={() => { setOpen((v) => !v); setCreating(false); }}
        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition-colors group
          ${open ? "bg-accent" : "hover:bg-accent"}`}
      >
        {active ? (
          <Avatar name={active.name} />
        ) : (
          <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
            <Warehouse className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
        )}

        <div className="flex-1 min-w-0 text-left">
          <p className="text-sm font-semibold text-foreground truncate leading-tight">
            {active?.name ?? "Агуулах сонгох"}
          </p>
        </div>

        {isPending ? (
          <Loader2 className="w-3.5 h-3.5 text-muted-foreground animate-spin flex-shrink-0" />
        ) : (
          <ChevronsUpDown className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0 opacity-60 group-hover:opacity-100 transition-opacity" />
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute top-full left-2 right-2 mt-1 bg-popover border border-border rounded-xl shadow-lg z-50 overflow-hidden animate-pop-in">
          {/* Агуулахуудын жагсаалт */}
          <div className="p-1.5">
            <p className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Агуулахууд
            </p>
            {warehouses.map((w) => {
              const isActive = w.id === activeWarehouseId;
              return (
                <button
                  key={w.id}
                  onClick={() => switchWarehouse(w.id)}
                  className={`w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-left transition-colors
                    ${isActive ? "bg-accent" : "hover:bg-accent"}`}
                >
                  <Avatar name={w.name} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{w.name}</p>
                    <p className="text-[10px] text-muted-foreground">{w.productCount} бараа</p>
                  </div>
                  {isActive && <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />}
                </button>
              );
            })}
          </div>

          {/* Шинэ агуулах нэмэх */}
          <div className="border-t border-border p-1.5">
            {creating ? (
              <div className="flex items-center gap-1.5 px-1">
                <input
                  ref={inputRef}
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCreate();
                    if (e.key === "Escape") { setCreating(false); setNewName(""); }
                  }}
                  placeholder="Агуулахын нэр..."
                  className="flex-1 text-sm border border-input rounded-lg px-2.5 py-1.5 outline-none focus:ring-1 focus:ring-ring bg-background min-w-0"
                />
                <button
                  onClick={handleCreate}
                  disabled={!newName.trim() || isPending}
                  className="flex-shrink-0 text-xs px-2.5 py-1.5 rounded-lg bg-primary text-primary-foreground disabled:opacity-50 font-medium transition-opacity"
                >
                  {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Нэмэх"}
                </button>
              </div>
            ) : (
              <button
                onClick={() => setCreating(true)}
                className="w-full flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-accent text-left transition-colors text-muted-foreground hover:text-foreground"
              >
                <div className="w-5 h-5 rounded-md border-2 border-dashed border-border flex items-center justify-center flex-shrink-0">
                  <Plus className="w-3 h-3" />
                </div>
                <span className="text-sm">Шинэ агуулах</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

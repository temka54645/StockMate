"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { ChevronDown, Warehouse, Plus, Check, Loader2 } from "lucide-react";
import { switchWarehouseAction, createWarehouseAction } from "@/lib/warehouse-actions";
import { useRouter } from "next/navigation";

interface WarehouseOption {
  id: string;
  name: string;
  productCount: number;
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

  const active = warehouses.find((w) => w.id === activeWarehouseId);

  // Гадна дарахад хаах
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

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
    <div ref={ref} className="relative px-3 py-2 border-b border-border">
      {/* Trigger */}
      <button
        onClick={() => { setOpen((v) => !v); setCreating(false); }}
        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-accent transition-colors text-left group"
      >
        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Warehouse className="w-3.5 h-3.5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-foreground truncate leading-tight">
            {active?.name ?? "Агуулах сонгох"}
          </p>
          <p className="text-[10px] text-muted-foreground leading-tight">
            {active?.productCount ?? 0} бараа
          </p>
        </div>
        {isPending ? (
          <Loader2 className="w-3.5 h-3.5 text-muted-foreground animate-spin flex-shrink-0" />
        ) : (
          <ChevronDown
            className={`w-3.5 h-3.5 text-muted-foreground flex-shrink-0 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
          />
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full left-3 right-3 mt-1 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden animate-pop-in">
          {/* Агуулахуудын жагсаалт */}
          <div className="max-h-48 overflow-y-auto py-1">
            {warehouses.map((w) => (
              <button
                key={w.id}
                onClick={() => switchWarehouse(w.id)}
                className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-accent text-left transition-colors"
              >
                <div className="w-4 flex-shrink-0 flex items-center justify-center">
                  {w.id === activeWarehouseId && <Check className="w-3.5 h-3.5 text-primary" />}
                </div>
                <span className="flex-1 truncate text-sm font-medium text-foreground">{w.name}</span>
                <span className="text-xs text-muted-foreground tabular-nums">{w.productCount}</span>
              </button>
            ))}
          </div>

          {/* Шинэ агуулах нэмэх */}
          <div className="border-t border-border">
            {creating ? (
              <div className="flex gap-2 p-2">
                <input
                  autoFocus
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCreate();
                    if (e.key === "Escape") { setCreating(false); setNewName(""); }
                  }}
                  placeholder="Агуулахын нэр..."
                  className="flex-1 text-xs border border-input rounded-lg px-2.5 py-1.5 outline-none focus:ring-1 focus:ring-ring bg-background"
                />
                <button
                  onClick={handleCreate}
                  disabled={!newName.trim() || isPending}
                  className="text-xs px-2.5 py-1.5 rounded-lg bg-primary text-primary-foreground disabled:opacity-50 flex items-center gap-1 font-medium"
                >
                  {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "Нэмэх"}
                </button>
              </div>
            ) : (
              <button
                onClick={() => setCreating(true)}
                className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-accent text-left transition-colors"
              >
                <Plus className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Шинэ агуулах нэмэх</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

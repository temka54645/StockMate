"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Package, PackagePlus, PackageMinus,
  BarChart3, Bell, Settings, LogOut, Menu, X
} from "lucide-react";
import { logoutAction } from "@/app/(auth)/actions";
import { useState } from "react";
import WarehouseSwitcher from "./WarehouseSwitcher";

const nav = [
  { href: "/", icon: LayoutDashboard, label: "Хяналтын самбар" },
  { href: "/products", icon: Package, label: "Бараа" },
  { href: "/stock-in", icon: PackagePlus, label: "Орлого" },
  { href: "/stock-out", icon: PackageMinus, label: "Зарлага" },
  { href: "/report", icon: BarChart3, label: "Тайлан" },
  { href: "/notifications", icon: Bell, label: "Мэдэгдэл" },
  { href: "/settings", icon: Settings, label: "Тохиргоо" },
];

interface WarehouseOption {
  id: string;
  name: string;
  productCount: number;
}

export default function Sidebar({
  unreadCount = 0,
  warehouses = [],
  activeWarehouseId = "",
}: {
  unreadCount?: number;
  warehouses?: WarehouseOption[];
  activeWarehouseId?: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="fixed top-3.5 left-3.5 z-50 lg:hidden rounded-xl p-2 bg-card shadow-md border border-border"
        onClick={() => setOpen((v) => !v)}
        aria-label="Цэс"
      >
        {open ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
      </button>

      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 bg-black/30 z-40 lg:hidden" onClick={() => setOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-60 bg-card border-r border-border flex flex-col z-40 transition-transform duration-200
          ${open ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 lg:static lg:z-auto`}
      >
        {/* App brand — жижиг, дискретний */}
        <div className="px-5 pt-5 pb-1">
          <span className="text-xs font-bold tracking-widest text-muted-foreground/60 uppercase">
            StoreMate
          </span>
        </div>

        {/* Warehouse switcher */}
        {warehouses.length > 0 && (
          <WarehouseSwitcher
            warehouses={warehouses}
            activeWarehouseId={activeWarehouseId}
          />
        )}

        {/* Хуваагч */}
        <div className="mx-4 my-1 border-t border-border" />

        {/* Nav */}
        <nav className="flex-1 py-2 px-2 space-y-0.5 overflow-y-auto">
          {nav.map(({ href, icon: Icon, label }) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                  ${active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1">{label}</span>
                {href === "/notifications" && unreadCount > 0 && (
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-xs font-bold">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="px-2 py-3 border-t border-border">
          <form action={logoutAction}>
            <button
              type="submit"
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all"
            >
              <LogOut className="w-4 h-4" />
              Гарах
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}

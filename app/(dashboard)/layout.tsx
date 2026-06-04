import { requireUserPage } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { cookies } from "next/headers";
import Sidebar from "@/components/Sidebar";
import NotificationBell from "@/components/NotificationBell";
import { auth } from "@/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const userId = await requireUserPage();

  // Cookie-аас active warehouse унших
  const jar = await cookies();
  const activeWh = jar.get("active-wh")?.value;

  // Хэрэглэгчийн бүх агуулах
  const warehouses = await prisma.warehouse.findMany({
    where: { ownerId: userId },
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { products: true } } },
  });

  // Идэвхтэй агуулах тодорхойлох
  let activeWarehouse =
    (activeWh ? warehouses.find((w) => w.id === activeWh) : null) ?? warehouses[0];

  // Хэрэв агуулах байхгүй бол автоматаар үүсгэнэ
  if (!activeWarehouse) {
    const session = await auth();
    const created = await prisma.warehouse.create({
      data: {
        name: `${session?.user?.name ?? "Миний"} агуулах`,
        ownerId: userId,
      },
    });
    await prisma.notificationSetting.create({ data: { warehouseId: created.id } });
    const withCount = { ...created, _count: { products: 0 } };
    warehouses.push(withCount);
    activeWarehouse = withCount;
  }

  const warehouseId = activeWarehouse.id;

  const [unreadCount, session] = await Promise.all([
    prisma.notification.count({ where: { warehouseId, readAt: null } }),
    auth(),
  ]);

  const warehouseList = warehouses.map((w) => ({
    id: w.id,
    name: w.name,
    productCount: w._count.products,
  }));

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar
        unreadCount={unreadCount}
        warehouses={warehouseList}
        activeWarehouseId={warehouseId}
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-card flex-shrink-0">
          <div className="lg:hidden w-8" />
          <p className="text-sm text-muted-foreground hidden sm:block">
            Сайн байна уу,{" "}
            <span className="font-semibold text-foreground">
              {session?.user?.name ?? "Хэрэглэгч"}
            </span>
          </p>
          <div className="ml-auto">
            <NotificationBell initialUnread={unreadCount} />
          </div>
        </header>
        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

import { requireUserPage, getOrCreateWarehouse } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import Sidebar from "@/components/Sidebar";
import NotificationBell from "@/components/NotificationBell";
import { auth } from "@/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const userId = await requireUserPage();
  const warehouseId = await getOrCreateWarehouse(userId);

  const [unreadCount, session] = await Promise.all([
    prisma.notification.count({ where: { warehouseId, readAt: null } }),
    auth(),
  ]);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar unreadCount={unreadCount} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-card/80 backdrop-blur-sm flex-shrink-0">
          <div className="lg:hidden w-8" /> {/* Mobile spacer */}
          <p className="text-sm text-muted-foreground hidden sm:block">
            Сайн байна уу, <span className="font-semibold text-foreground">{session?.user?.name ?? "Хэрэглэгч"}</span>
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

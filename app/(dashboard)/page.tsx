import { requireUserPage, getOrCreateWarehouse } from "@/lib/auth-helpers";
import DashboardClient from "@/components/DashboardClient";

export default async function DashboardPage() {
  await requireUserPage();
  return <DashboardClient />;
}

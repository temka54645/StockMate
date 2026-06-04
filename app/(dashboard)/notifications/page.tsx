import { requireUserPage } from "@/lib/auth-helpers";
import NotificationsClient from "@/components/NotificationsClient";

export default async function NotificationsPage() {
  await requireUserPage();
  return <NotificationsClient />;
}

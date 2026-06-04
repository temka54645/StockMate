import { requireUserPage } from "@/lib/auth-helpers";
import SettingsClient from "@/components/SettingsClient";

export default async function SettingsPage() {
  await requireUserPage();
  return <SettingsClient />;
}

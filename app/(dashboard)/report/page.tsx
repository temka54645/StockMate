import { requireUserPage } from "@/lib/auth-helpers";
import ReportClient from "@/components/ReportClient";

export default async function ReportPage() {
  await requireUserPage();
  return <ReportClient />;
}

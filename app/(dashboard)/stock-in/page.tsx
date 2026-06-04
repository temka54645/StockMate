import { requireUserPage } from "@/lib/auth-helpers";
import StockInClient from "@/components/StockInClient";

export default async function StockInPage() {
  await requireUserPage();
  return <StockInClient />;
}

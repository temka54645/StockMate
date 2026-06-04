import { requireUserPage } from "@/lib/auth-helpers";
import StockOutClient from "@/components/StockOutClient";

export default async function StockOutPage() {
  await requireUserPage();
  return <StockOutClient />;
}

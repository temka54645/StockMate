import { requireUserPage } from "@/lib/auth-helpers";
import ProductsClient from "@/components/ProductsClient";

export default async function ProductsPage() {
  await requireUserPage();
  return <ProductsClient />;
}

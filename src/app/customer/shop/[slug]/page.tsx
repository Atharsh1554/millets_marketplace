import { ProductView } from "@/components/shop/product-view";
import { requirePageRole } from "@/server/auth/guard";

export default async function CustomerProductPage({ params }: PageProps<"/customer/shop/[slug]">) {
  await requirePageRole(["CUSTOMER"]);
  return <ProductView slug={(await params).slug} basePath="/customer/shop" />;
}

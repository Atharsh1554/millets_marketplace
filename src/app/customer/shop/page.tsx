import { ShopView } from "@/components/shop/shop-view";
import { requirePageRole } from "@/server/auth/guard";

export default async function CustomerShopPage({ searchParams }: PageProps<"/customer/shop">) {
  await requirePageRole(["CUSTOMER"]);
  return <ShopView sp={await searchParams} basePath="/customer/shop" />;
}

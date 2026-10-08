import { ShopView } from "@/components/shop/shop-view";
import { requirePageRole } from "@/server/auth/guard";

/** Search uses the same marketplace view; the toolbar search box drives `?q=`. */
export default async function CustomerSearchPage({ searchParams }: PageProps<"/customer/search">) {
  await requirePageRole(["CUSTOMER"]);
  return <ShopView sp={await searchParams} basePath="/customer/shop" />;
}

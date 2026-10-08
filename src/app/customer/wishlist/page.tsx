import type { Metadata } from "next";
import { Heart } from "lucide-react";
import { EmptyState, LinkButton, PageHeader } from "@/components/ui";
import { ProductCard } from "@/components/shop/product-card";
import { requirePageRole } from "@/server/auth/guard";
import { searchProducts } from "@/server/services/catalog";
import { wishlistProductIds } from "@/server/services/shop";
import { getT } from "@/i18n/server";

export const metadata: Metadata = { title: "Wishlist" };

export default async function WishlistPage() {
  const user = await requirePageRole(["CUSTOMER"], "/customer/wishlist");
  const ids = await wishlistProductIds(user.id);
  const [all, t] = await Promise.all([searchProducts({ sort: "newest" }), getT()]);
  const products = all.filter((p) => ids.has(p.id));
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title={t("common.navigation.wishlist")} subtitle={t("customer.savedCount", { count: products.length })} />
      {products.length === 0 ? (
        <EmptyState icon={Heart} title={t("customer.nothingSaved")} action={<LinkButton href="/customer/shop">{t("common.actions.browseProducts")}</LinkButton>}>
          {t("customer.nothingSavedText")}
        </EmptyState>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} p={p} signedIn wishlisted basePath="/customer/shop" />
          ))}
        </div>
      )}
    </div>
  );
}

import { Suspense } from "react";
import { PackageSearch } from "lucide-react";
import { EmptyState, LinkButton } from "@/components/ui";
import { ProductCard } from "@/components/shop/product-card";
import { ShopFilters, ShopToolbar } from "@/components/shop/filters";
import { getCurrentUser } from "@/server/auth/guard";
import { searchProducts, type ShopFilters as Filters } from "@/server/services/catalog";
import { wishlistProductIds } from "@/server/services/shop";
import { CATEGORY_LABEL, MILLET_LABEL } from "@/lib/labels";
import { getT } from "@/i18n/server";

const SORTS = ["price_asc", "price_desc", "rating", "popular", "newest"];

/** Marketplace listing — shared by the public /shop page and the customer dashboard. */
export async function ShopView({ sp, basePath = "/shop" }: { sp: Record<string, string | string[] | undefined>; basePath?: string }) {
  const str = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : undefined);
  const num = (k: string) => {
    const n = Number(str(k));
    return Number.isFinite(n) && n > 0 ? n : undefined;
  };
  const filters: Filters = {
    q: str("q")?.slice(0, 80),
    category: str("category"),
    millet: str("millet"),
    minPrice: num("minPrice"),
    maxPrice: num("maxPrice"),
    minRating: num("minRating"),
    inStock: str("inStock") === "1",
    sort: SORTS.includes(str("sort") ?? "") ? (str("sort") as Filters["sort"]) : "popular",
  };
  const [user, t] = await Promise.all([getCurrentUser(), getT()]);
  const [products, wish] = await Promise.all([
    searchProducts(filters),
    user?.role === "CUSTOMER" ? wishlistProductIds(user.id) : Promise.resolve(new Set<string>()),
  ]);

  const heading = filters.millet && filters.millet in MILLET_LABEL ? t(`labels.millet.${filters.millet}`) : filters.category && filters.category in CATEGORY_LABEL ? t(`labels.category.${filters.category}`) : t("shop.title");

  return (
    <div className={basePath === "/shop" ? "mx-auto max-w-7xl px-4 py-8 sm:px-6" : "mx-auto max-w-7xl"}>
      <div className="mb-6">
        <p className="text-xs font-semibold tracking-widest text-millet-600 uppercase">{t("shop.eyebrow")}</p>
        <h1 className="font-display text-3xl font-semibold text-earth-900">{heading}</h1>
      </div>
      <div className="grid gap-8 lg:grid-cols-[230px_1fr]">
        <Suspense>
          <ShopFilters />
        </Suspense>
        <div className="min-w-0">
          <Suspense>
            <ShopToolbar total={products.length} />
          </Suspense>
          <div className="mt-5">
            {products.length === 0 ? (
              <EmptyState icon={PackageSearch} title={t("shop.noMatch")} action={<LinkButton href={basePath} variant="outline">{t("common.actions.clearFilters")}</LinkButton>}>
                {t("shop.noMatchText")}
              </EmptyState>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3">
                {products.map((p) => (
                  <ProductCard key={p.id} p={p} signedIn={user?.role === "CUSTOMER"} wishlisted={wish.has(p.id)} basePath={basePath} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

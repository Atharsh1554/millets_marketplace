import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, MapPin, Truck, User, Warehouse } from "lucide-react";
import { Badge } from "@/components/ui";
import { ProductBuyBox, WishlistButton } from "@/components/shop/buttons";
import { ProductCard, Stars } from "@/components/shop/product-card";
import { QualityVerification, TraceabilityTable } from "@/components/shop/quality";
import { ReviewForm } from "@/components/shop/review-form";
import { getCurrentUser } from "@/server/auth/guard";
import { productBySlug, relatedProducts, unitsAvailable } from "@/server/services/catalog";
import { wishlistProductIds } from "@/server/services/shop";
import { db } from "@/server/db";
import { discountPercent, formatDate, formatINR, formatWeight } from "@/lib/format";
import { getT } from "@/i18n/server";

/** Product detail — shared by the public /shop/[slug] page and the customer dashboard. */
export async function ProductView({ slug, basePath = "/shop" }: { slug: string; basePath?: string }) {
  const [product, t] = await Promise.all([productBySlug(slug), getT()]);
  if (!product) notFound();
  const user = await getCurrentUser();
  const milletName = t(`labels.millet.${product.milletType}`);
  const isCustomer = user?.role === "CUSTOMER";

  const proc = product.inventory.batch.procurement;
  const sub = proc.submission;
  const units = unitsAvailable(product);
  const available = product.status === "AVAILABLE_FOR_SALE" && units > 0;
  const off = discountPercent(product.pricePaise, product.mrpPaise);

  const [related, wish, canReview] = await Promise.all([
    relatedProducts(product.milletType, product.id),
    isCustomer ? wishlistProductIds(user.id) : Promise.resolve(new Set<string>()),
    isCustomer ? db.orderItem.findFirst({ where: { productId: product.id, order: { userId: user.id, status: "DELIVERED" } }, select: { id: true } }) : null,
  ]);
  const myReview = isCustomer ? product.reviews.find((r) => r.userId === user.id) : undefined;

  return (
    <div className={basePath === "/shop" ? "mx-auto max-w-7xl px-4 py-8 sm:px-6" : "mx-auto max-w-7xl"}>
      <nav className="mb-6 flex flex-wrap items-center gap-1 text-sm text-muted" aria-label={t("product.breadcrumb")}>
        <Link href={basePath} className="hover:text-earth-900">{t("common.navigation.shop")}</Link>
        <ChevronRight className="size-4" />
        <Link href={`${basePath}?millet=${product.milletType}`} className="hover:text-earth-900">{milletName}</Link>
        <ChevronRight className="size-4" />
        <span className="text-earth-900">{product.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        {/* Images */}
        <div className="space-y-3">
          <div className="relative overflow-hidden rounded-3xl bg-cream-dark">
            <img src={product.images[0]?.url ?? "/products/mixed-millet.svg"} alt={product.images[0]?.alt ?? product.name} className="aspect-square w-full object-cover" />
            {product.isDemo && <span className="absolute top-4 left-4 rounded-full bg-earth-900/80 px-3 py-1 text-xs font-bold tracking-wider text-millet-200 uppercase">{t("product.demoProduct")}</span>}
            <WishlistButton productId={product.id} signedIn={isCustomer} saved={wish.has(product.id)} className="absolute top-4 right-4 size-11" />
          </div>
          {product.images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {product.images.map((img) => (
                <img key={img.id} src={img.url} alt={img.alt} className="aspect-square rounded-xl object-cover" />
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="space-y-5">
          <div>
            <div className="flex flex-wrap gap-2">
              <Badge tone="success">{milletName}</Badge>
              <Badge tone="neutral">{t(`labels.category.${product.category}`)}</Badge>
            </div>
            <h1 className="mt-3 font-display text-3xl font-semibold text-earth-900 sm:text-4xl">{product.name}</h1>
            <div className="mt-2 flex items-center gap-2 text-sm text-muted">
              <Stars value={product.rating.avg} />
              {product.rating.count > 0 ? t("product.ratingSummary", { avg: product.rating.avg.toFixed(1), count: product.rating.count }) : t("shop.noReviews")}
              <span>· {t("product.soldCount", { count: product.sold })}</span>
            </div>
          </div>

          <div className="flex items-end gap-3">
            <span className="text-3xl font-bold text-earth-900">{formatINR(product.pricePaise)}</span>
            {off > 0 && (
              <>
                <span className="pb-1 text-lg text-muted line-through">{formatINR(product.mrpPaise)}</span>
                <Badge tone="gold">{t("shop.percentOff", { n: off })}</Badge>
              </>
            )}
          </div>
          <p className="-mt-3 text-sm text-muted">
            {t("product.packSize")}: <strong className="text-earth-900">{formatWeight(product.weightGrams)}</strong> · {t("product.inclTaxes")}
          </p>

          <ProductBuyBox productId={product.id} signedIn={isCustomer} maxUnits={available ? units : 0} />
          {user && !isCustomer && <p className="text-xs text-muted">{t("product.staffNote")}</p>}

          <p className="leading-relaxed text-earth-800">{product.description}</p>

          <div className="grid gap-3 sm:grid-cols-3">
            <Info icon={User} title={t("product.sourcedFrom")} text={proc.farmer.user.name} />
            <Info icon={MapPin} title={t("product.origin")} text={`${sub.village}, ${sub.state}`} />
            <Info icon={Warehouse} title={t("product.fulfilledBy")} text={t("product.warehouse")} />
          </div>
          <p className="flex items-center gap-2 text-xs text-muted">
            <Truck className="size-4" /> {t("product.shippingNote")}
          </p>
        </div>
      </div>

      <div className="mt-12 grid gap-6 lg:grid-cols-2">
        <QualityVerification reviewedAt={sub.adminReviews[0]?.createdAt} testedAt={sub.physicalTest?.testDate} procuredAt={proc.receivedDate} />
        <TraceabilityTable
          milletType={product.milletType}
          farmer={proc.farmer.user.name}
          village={sub.village}
          district={sub.district}
          state={sub.state}
          harvestYear={product.inventory.batch.harvestYear}
          batch={product.inventory.batch.batchNumber}
          testCode={sub.physicalTest?.code}
          available={available}
        />
      </div>

      <section id="reviews" className="mt-12 scroll-mt-24">
        <h2 className="font-display text-2xl font-semibold text-earth-900">{t("product.reviews")}</h2>
        <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-3">
            {product.reviews.length === 0 && <p className="text-sm text-muted">{t("shop.noReviews")}</p>}
            {product.reviews.slice(0, 20).map((r) => (
              <article key={r.id} className="card p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-earth-900">{r.user.name}</p>
                  <span className="text-xs text-muted">{formatDate(r.createdAt)}</span>
                </div>
                <Stars value={r.rating} />
                <p className="mt-1 text-sm text-earth-800">{r.comment}</p>
                <p className="mt-1 text-[11px] font-semibold text-leaf-700">{t("product.verifiedPurchase")}</p>
              </article>
            ))}
          </div>
          <div>
            {isCustomer && canReview ? (
              <ReviewForm productId={product.id} initial={myReview ? { rating: myReview.rating, comment: myReview.comment } : undefined} />
            ) : (
              <p className="card p-4 text-sm text-muted">{t("product.reviewRule")}</p>
            )}
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="mt-14">
          <h2 className="mb-4 font-display text-2xl font-semibold text-earth-900">{t("product.more", { millet: milletName })}</h2>
          <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} p={p} signedIn={isCustomer} wishlisted={wish.has(p.id)} basePath={basePath} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Info({ icon: Icon, title, text }: { icon: typeof User; title: string; text: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white p-3 ring-1 ring-earth-100">
      <Icon className="size-5 shrink-0 text-leaf-700" />
      <div className="min-w-0">
        <p className="text-[11px] text-muted">{title}</p>
        <p className="truncate text-sm font-semibold text-earth-900">{text}</p>
      </div>
    </div>
  );
}

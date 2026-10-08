import Link from "next/link";
import { ShieldCheck, Star } from "lucide-react";
import type { ProductCardData } from "@/server/services/catalog";
import { discountPercent, formatINR, formatWeight } from "@/lib/format";
import { MILLET_SHORT } from "@/lib/labels";
import { AddToCartButton, WishlistButton } from "./buttons";
import { T } from "@/i18n/client";

export function Stars({ value, size = "sm" }: { value: number; size?: "sm" | "md" }) {
  const cls = size === "sm" ? "size-3.5" : "size-5";
  return (
    <span className="inline-flex" aria-label={`${value.toFixed(1)} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={`${cls} ${i <= Math.round(value) ? "fill-millet-400 text-millet-400" : "text-earth-200"}`} />
      ))}
    </span>
  );
}

export function ProductCard({ p, signedIn, wishlisted, basePath = "/shop" }: { p: ProductCardData; signedIn: boolean; wishlisted: boolean; basePath?: string }) {
  const off = discountPercent(p.pricePaise, p.mrpPaise);
  const units = Math.floor(p.inventory.quantityAvailableGrams / p.weightGrams);
  const soldOut = p.status !== "AVAILABLE_FOR_SALE" || units < 1;
  return (
    <article className="group card flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]">
      <div className="relative">
        <Link href={`${basePath}/${p.slug}`} className="block aspect-square overflow-hidden bg-cream-dark">
          <img src={p.images[0]?.url ?? "/products/mixed-millet.svg"} alt={p.images[0]?.alt ?? p.name} className="size-full object-cover transition duration-500 group-hover:scale-105" loading="lazy" />
        </Link>
        <div className="absolute top-3 left-3 flex flex-col gap-1">
          {off > 0 && <span className="rounded-full bg-millet-400 px-2 py-0.5 text-xs font-bold text-earth-900"><T k="shop.percentOff" params={{ n: off }} /></span>}
          {p.isDemo && <span className="rounded-full bg-earth-900/80 px-2 py-0.5 text-[10px] font-bold tracking-wider text-millet-200 uppercase"><T k="common.demo.badge" /></span>}
        </div>
        <WishlistButton productId={p.id} signedIn={signedIn} saved={wishlisted} className="absolute top-3 right-3" />
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="font-semibold tracking-wide text-leaf-700 uppercase"><T k={`labels.milletShort.${p.milletType}`} fallback={MILLET_SHORT[p.milletType]} /></span>
          <span className="flex items-center gap-1 text-leaf-700" title="Admin reviewed · Physically tested · Procured">
            <ShieldCheck className="size-3.5" /> <T k="shop.verifiedBatch" />
          </span>
        </div>
        <Link href={`${basePath}/${p.slug}`} className="line-clamp-2 font-semibold text-earth-900 hover:text-leaf-700">
          {p.name}
        </Link>
        <div className="flex items-center gap-1.5 text-xs text-muted">
          <Stars value={p.rating.avg} />
          <span>{p.rating.count > 0 ? `${p.rating.avg.toFixed(1)} (${p.rating.count})` : <T k="shop.noReviews" />}</span>
        </div>
        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          <div>
            <p className="text-lg leading-tight font-bold text-earth-900">{formatINR(p.pricePaise)}</p>
            <p className="text-xs text-muted">
              {off > 0 && <span className="mr-1 line-through">{formatINR(p.mrpPaise)}</span>}/ {formatWeight(p.weightGrams)}
            </p>
          </div>
          <span className={`text-xs font-semibold ${soldOut ? "text-red-600" : units <= 10 ? "text-millet-600" : "text-leaf-700"}`}>
            {soldOut ? <T k="shop.outOfStock" /> : units <= 10 ? <T k="shop.onlyLeft" params={{ count: units }} /> : <T k="shop.inStock" />}
          </span>
        </div>
        <div className="pt-2">
          <AddToCartButton productId={p.id} signedIn={signedIn} disabled={soldOut} compact />
        </div>
      </div>
    </article>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { EmptyState, LinkButton } from "@/components/ui";
import { CartQuantity } from "@/components/shop/buttons";
import { requirePageRole } from "@/server/auth/guard";
import { FREE_DELIVERY_MIN_PAISE, getCart, priceCart } from "@/server/services/shop";
import { formatINR, formatWeight } from "@/lib/format";
import { getT } from "@/i18n/server";
import type { Translator } from "@/i18n/translate";

export const metadata: Metadata = { title: "Your cart" };

export default async function CartPage() {
  const user = await requirePageRole(["CUSTOMER"], "/customer/cart");
  const [items, t] = await Promise.all([getCart(user.id), getT()]);
  const totals = priceCart(items);

  if (items.length === 0)
    return (
      <div className="mx-auto max-w-2xl">
        <EmptyState icon={ShoppingBag} title={t("cart.empty")} action={<LinkButton href="/customer/shop">{t("common.actions.continueShopping")}</LinkButton>}>
          {t("cart.emptyText")}
        </EmptyState>
      </div>
    );

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="mb-6 font-display text-3xl font-semibold text-earth-900">{t("cart.title")}</h1>
      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <ul className="space-y-3">
          {items.map((i) => {
            const units = Math.floor(i.product.inventory.quantityAvailableGrams / i.product.weightGrams);
            return (
              <li key={i.id} className="card flex gap-4 p-4">
                <Link href={`/customer/shop/${i.product.slug}`} className="shrink-0">
                  <img src={i.product.images[0]?.url} alt={i.product.name} className="size-24 rounded-xl object-cover" />
                </Link>
                <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <Link href={`/customer/shop/${i.product.slug}`} className="font-semibold text-earth-900 hover:text-leaf-700">
                      {i.product.name}
                    </Link>
                    <p className="text-sm text-muted">
                      {formatWeight(i.product.weightGrams)} · {t("cart.each", { price: formatINR(i.product.pricePaise) })}
                    </p>
                    {i.product.status !== "AVAILABLE_FOR_SALE" && <p className="text-xs font-semibold text-red-600">{t("cart.unavailable")}</p>}
                  </div>
                  <div className="flex items-center justify-between gap-6 sm:justify-end">
                    <CartQuantity productId={i.productId} quantity={i.quantity} max={units} />
                    <p className="w-24 text-right font-bold text-earth-900">{formatINR(i.product.pricePaise * i.quantity)}</p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
        <aside className="card h-fit space-y-3 p-5 lg:sticky lg:top-24">
          <h2 className="font-semibold text-earth-900">{t("cart.summary")}</h2>
          <SummaryRows totals={totals} t={t} />
          {totals.subtotal - totals.discount < FREE_DELIVERY_MIN_PAISE && (
            <p className="rounded-xl bg-millet-50 px-3 py-2 text-xs text-millet-700">
              {t("cart.freeDeliveryHint", { amount: formatINR(FREE_DELIVERY_MIN_PAISE - (totals.subtotal - totals.discount)) })}
            </p>
          )}
          <LinkButton href="/customer/checkout" size="lg" className="w-full">
            {t("customerNav.checkout")}
          </LinkButton>
          <LinkButton href="/customer/shop" variant="outline" className="w-full">
            {t("common.actions.continueShopping")}
          </LinkButton>
        </aside>
      </div>
    </div>
  );
}

function SummaryRows({ totals, t }: { totals: { subtotal: number; discount: number; delivery: number; total: number }; t: Translator }) {
  return (
    <dl className="space-y-2 text-sm">
      <div className="flex justify-between">
        <dt className="text-muted">{t("cart.subtotal")}</dt>
        <dd>{formatINR(totals.subtotal)}</dd>
      </div>
      <div className="flex justify-between text-leaf-700">
        <dt>{t("cart.discount")}</dt>
        <dd>− {formatINR(totals.discount)}</dd>
      </div>
      <div className="flex justify-between">
        <dt className="text-muted">{t("cart.delivery")}</dt>
        <dd>{totals.delivery === 0 ? t("common.misc.free") : formatINR(totals.delivery)}</dd>
      </div>
      <div className="flex justify-between border-t border-earth-100 pt-2 text-base font-bold text-earth-900">
        <dt>{t("common.misc.total")}</dt>
        <dd>{formatINR(totals.total)}</dd>
      </div>
    </dl>
  );
}

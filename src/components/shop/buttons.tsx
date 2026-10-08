"use client";

import Link from "next/link";
import { useActionState, useEffect, useState, startTransition } from "react";
import { Heart, Loader2, Minus, Plus, ShoppingBag, Zap } from "lucide-react";
import { addToCartAction, setCartQuantityAction, toggleWishlistAction } from "@/app/actions/shop";
import { buttonClass } from "@/components/ui";
import { cn } from "@/lib/format";
import type { FormResult } from "@/components/forms";
import { useRouter } from "next/navigation";
import { useT } from "@/i18n/client";

function fd(entries: Record<string, string | number>) {
  const f = new FormData();
  for (const [k, v] of Object.entries(entries)) f.set(k, String(v));
  return f;
}

export function AddToCartButton({ productId, signedIn, disabled, compact = false }: { productId: string; signedIn: boolean; disabled?: boolean; compact?: boolean }) {
  const [state, dispatch, pending] = useActionState<FormResult, FormData>(addToCartAction, null);
  const t = useT();
  if (!signedIn)
    return (
      <Link href={`/login?next=/shop`} className={buttonClass("primary", compact ? "sm" : "md", "w-full")}>
        <ShoppingBag className="size-4" /> {t("shop.addToCart")}
      </Link>
    );
  return (
    <div className="w-full">
      <button
        disabled={disabled || pending}
        onClick={() => startTransition(() => dispatch(fd({ productId, quantity: 1 })))}
        className={buttonClass("primary", compact ? "sm" : "md", "w-full")}
      >
        {pending ? <Loader2 className="size-4 animate-spin" /> : <ShoppingBag className="size-4" />}
        {disabled ? t("shop.outOfStock") : state?.ok ? t("shop.added") : t("shop.addToCart")}
      </button>
      {state && !state.ok && <p className="mt-1 text-xs text-red-600">{state.error}</p>}
    </div>
  );
}

export function ProductBuyBox({ productId, signedIn, maxUnits }: { productId: string; signedIn: boolean; maxUnits: number }) {
  const [qty, setQty] = useState(1);
  const [state, dispatch, pending] = useActionState<FormResult, FormData>(addToCartAction, null);
  const router = useRouter();
  const t = useT();
  const max = Math.min(maxUnits, 20);
  useEffect(() => {
    if (state?.ok && state.redirectTo) router.push(state.redirectTo);
  }, [state, router]);
  if (maxUnits < 1) return <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{t("shop.currentlyOut")}</p>;
  if (!signedIn)
    return (
      <Link href="/login?next=/shop" className={buttonClass("primary", "lg", "w-full")}>
        {t("shop.signInToBuy")}
      </Link>
    );
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <span className="text-sm font-semibold text-earth-800">{t("shop.quantity")}</span>
        <div className="flex items-center rounded-xl border border-earth-200 bg-white">
          <button className="p-2.5 disabled:opacity-40" onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1} aria-label={t("shop.decrease")}>
            <Minus className="size-4" />
          </button>
          <span className="w-10 text-center font-semibold">{qty}</span>
          <button className="p-2.5 disabled:opacity-40" onClick={() => setQty((q) => Math.min(max, q + 1))} disabled={qty >= max} aria-label={t("shop.increase")}>
            <Plus className="size-4" />
          </button>
        </div>
        <span className="text-xs text-muted">{t("shop.inStockCount", { count: maxUnits })}</span>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <button disabled={pending} onClick={() => startTransition(() => dispatch(fd({ productId, quantity: qty })))} className={buttonClass("primary", "lg", "flex-1")}>
          {pending ? <Loader2 className="size-4 animate-spin" /> : <ShoppingBag className="size-5" />} {state?.ok && !state.redirectTo ? t("shop.addedToCart") : t("shop.addToCart")}
        </button>
        <button disabled={pending} onClick={() => startTransition(() => dispatch(fd({ productId, quantity: qty, buyNow: 1 })))} className={buttonClass("gold", "lg", "flex-1")}>
          <Zap className="size-5" /> {t("shop.buyNow")}
        </button>
      </div>
      {state && !state.ok && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.ok && !state.redirectTo && (
        <Link href="/customer/cart" className="inline-block text-sm font-semibold text-leaf-700 underline">
          {t("shop.viewCart")} →
        </Link>
      )}
    </div>
  );
}

export function WishlistButton({ productId, signedIn, saved, className }: { productId: string; signedIn: boolean; saved: boolean; className?: string }) {
  const [, dispatch, pending] = useActionState<FormResult, FormData>(toggleWishlistAction, null);
  const [on, setOn] = useState(saved);
  const t = useT();
  const cls = cn("grid size-9 place-items-center rounded-full bg-white/90 shadow-sm backdrop-blur transition hover:scale-105", className);
  if (!signedIn)
    return (
      <Link href="/login?next=/customer/wishlist" className={cls} aria-label={t("shop.saveWishlist")}>
        <Heart className="size-4 text-earth-600" />
      </Link>
    );
  return (
    <button
      className={cls}
      aria-pressed={on}
      aria-label={on ? t("shop.removeWishlist") : t("shop.saveWishlist")}
      disabled={pending}
      onClick={() => {
        setOn((v) => !v);
        startTransition(() => dispatch(fd({ productId })));
      }}
    >
      <Heart className={cn("size-4", on ? "fill-red-500 text-red-500" : "text-earth-600")} />
    </button>
  );
}

export function CartQuantity({ productId, quantity, max }: { productId: string; quantity: number; max: number }) {
  const [state, dispatch, pending] = useActionState<FormResult, FormData>(setCartQuantityAction, null);
  const set = (q: number) => startTransition(() => dispatch(fd({ productId, quantity: q })));
  const t = useT();
  return (
    <div>
      <div className="flex items-center gap-2">
        <div className={cn("flex items-center rounded-xl border border-earth-200 bg-white", pending && "opacity-60")}>
          <button className="p-2" onClick={() => set(quantity - 1)} disabled={pending} aria-label={t("shop.decrease")}>
            <Minus className="size-3.5" />
          </button>
          <span className="w-8 text-center text-sm font-semibold">{quantity}</span>
          <button className="p-2 disabled:opacity-40" onClick={() => set(quantity + 1)} disabled={pending || quantity >= Math.min(max, 20)} aria-label={t("shop.increase")}>
            <Plus className="size-3.5" />
          </button>
        </div>
        <button className="text-xs font-semibold text-red-700 hover:underline" onClick={() => set(0)} disabled={pending}>
          {t("common.actions.remove")}
        </button>
      </div>
      {state && !state.ok && <p className="mt-1 text-xs text-red-600">{state.error}</p>}
    </div>
  );
}

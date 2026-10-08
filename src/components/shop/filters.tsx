"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useTransition } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { CATEGORIES, MILLET_TYPES } from "@/lib/labels";
import { useT } from "@/i18n/client";
import { cn } from "@/lib/format";

const SORTS = ["popular", "price_asc", "price_desc", "rating", "newest"] as const;

export function ShopToolbar({ total }: { total: number }) {
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [pending, start] = useTransition();
  const [q, setQ] = useState(sp.get("q") ?? "");
  const t = useT();

  const update = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    start(() => router.push(`${pathname}?${next.toString()}`, { scroll: false }));
  };

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <form
        className="relative flex-1"
        onSubmit={(e) => {
          e.preventDefault();
          update({ q: q.trim() || null });
        }}
      >
        <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-earth-400" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("shop.searchPlaceholder")} className="input pl-10" aria-label={t("shop.searchLabel")} />
      </form>
      <div className="flex items-center gap-3">
        <span className={cn("text-sm text-muted whitespace-nowrap", pending && "opacity-50")}>{t("shop.productCount", { count: total })}</span>
        <select value={sp.get("sort") ?? "popular"} onChange={(e) => update({ sort: e.target.value })} className="input w-auto max-w-[55vw] min-w-0 sm:max-w-none" aria-label={t("shop.sortLabel")}>
          {SORTS.map((v) => (
            <option key={v} value={v}>
              {t(`shop.sort.${v}`)}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export function ShopFilters() {
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [, start] = useTransition();
  const t = useT();

  const update = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    start(() => router.push(`${pathname}?${next.toString()}`, { scroll: false }));
  };
  const active = ["category", "millet", "minPrice", "maxPrice", "minRating", "inStock", "q"].filter((k) => sp.get(k));

  const body = (
    <div className="space-y-6">
      <FilterGroup title={t("shop.category")}>
        <Radio name="category" label={t("shop.allCategories")} checked={!sp.get("category")} onChange={() => update({ category: null })} />
        {CATEGORIES.map((c) => (
          <Radio key={c} name="category" label={t(`labels.category.${c}`)} checked={sp.get("category") === c} onChange={() => update({ category: c })} />
        ))}
      </FilterGroup>
      <FilterGroup title={t("shop.milletType")}>
        <Radio name="millet" label={t("shop.allMillets")} checked={!sp.get("millet")} onChange={() => update({ millet: null })} />
        {MILLET_TYPES.map((m) => (
          <Radio key={m} name="millet" label={t(`labels.millet.${m}`)} checked={sp.get("millet") === m} onChange={() => update({ millet: m })} />
        ))}
      </FilterGroup>
      <FilterGroup title={t("shop.price")}>
        <form
          className="flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            update({ minPrice: (f.get("minPrice") as string) || null, maxPrice: (f.get("maxPrice") as string) || null });
          }}
        >
          <input name="minPrice" type="number" min={0} placeholder={t("shop.min")} defaultValue={sp.get("minPrice") ?? ""} className="input px-2.5 py-2" aria-label={t("shop.minPrice")} />
          <span className="text-earth-300">–</span>
          <input name="maxPrice" type="number" min={0} placeholder={t("shop.max")} defaultValue={sp.get("maxPrice") ?? ""} className="input px-2.5 py-2" aria-label={t("shop.maxPrice")} />
          <button className="rounded-xl bg-leaf-700 px-3 py-2 text-sm font-semibold text-white">{t("shop.go")}</button>
        </form>
      </FilterGroup>
      <FilterGroup title={t("shop.rating")}>
        {[4, 3].map((r) => (
          <Radio key={r} name="rating" label={t("shop.ratingAbove", { n: r })} checked={sp.get("minRating") === String(r)} onChange={() => update({ minRating: String(r) })} />
        ))}
        <Radio name="rating" label={t("shop.anyRating")} checked={!sp.get("minRating")} onChange={() => update({ minRating: null })} />
      </FilterGroup>
      <FilterGroup title={t("shop.availability")}>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-earth-800">
          <input type="checkbox" className="size-4 accent-leaf-700" checked={sp.get("inStock") === "1"} onChange={(e) => update({ inStock: e.target.checked ? "1" : null })} />
          {t("shop.inStockOnly")}
        </label>
      </FilterGroup>
      {active.length > 0 && (
        <button onClick={() => start(() => router.push(pathname))} className="flex items-center gap-1 text-sm font-semibold text-red-700 hover:underline">
          <X className="size-4" /> {t("shop.clearAll")}
        </button>
      )}
    </div>
  );

  return (
    <>
      <button onClick={() => setOpen(true)} className="flex items-center gap-2 rounded-xl border border-earth-200 bg-white px-4 py-2.5 text-sm font-semibold lg:hidden">
        <SlidersHorizontal className="size-4" /> {t("shop.filters")} {active.length > 0 && <span className="rounded-full bg-leaf-700 px-1.5 text-xs text-white">{active.length}</span>}
      </button>
      <aside className="hidden lg:block">{body}</aside>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-earth-900/40" onClick={() => setOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-3xl bg-cream p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold">{t("shop.filters")}</h2>
              <button onClick={() => setOpen(false)} aria-label={t("shop.closeFilters")}>
                <X className="size-5" />
              </button>
            </div>
            {body}
            <button onClick={() => setOpen(false)} className="mt-6 w-full rounded-xl bg-leaf-700 py-3 font-semibold text-white">
              {t("shop.showResults")}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-2 text-xs font-bold tracking-widest text-earth-500 uppercase">{title}</h3>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function Radio({ name, label, checked, onChange }: { name: string; label: string; checked: boolean; onChange: () => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm text-earth-800">
      <input type="radio" name={name} className="size-4 accent-leaf-700" checked={checked} onChange={onChange} />
      {label}
    </label>
  );
}

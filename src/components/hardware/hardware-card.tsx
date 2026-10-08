import Link from "next/link";
import { ArrowRight, MessageSquare, Sparkles } from "lucide-react";
import { buttonClass } from "@/components/ui";
import type { Translator } from "@/i18n/translate";
import { HARDWARE_PLACEHOLDER, type HardwareCardData } from "@/server/services/hardware";

/** Hardware product card (farmer view) — matches the marketplace ProductCard styling. */
export function HardwareCard({ p, t }: { p: HardwareCardData; t: Translator }) {
  const href = `/farmer/hardware/${p.slug}`;
  const img = p.images[0];
  return (
    <article className="group card flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]">
      <Link href={href} className="block aspect-[4/3] overflow-hidden bg-cream-dark">
        <img src={img?.url ?? HARDWARE_PLACEHOLDER[p.category]} alt={img?.alt ?? p.name} className="size-full object-cover transition duration-500 group-hover:scale-105" loading="lazy" />
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="text-xs font-semibold tracking-wide text-leaf-700 uppercase">{t(`labels.hardwareCategory.${p.category}`)}</p>
        <Link href={href} className="text-lg leading-snug font-semibold text-earth-900 hover:text-leaf-700">
          {p.name}
        </Link>
        <p className="line-clamp-3 text-sm text-earth-700">{p.description}</p>
        <p className="flex items-start gap-2 rounded-xl bg-leaf-50 px-3 py-2 text-sm text-leaf-800">
          <Sparkles className="mt-0.5 size-4 shrink-0" />
          <span>
            <span className="font-semibold">{t("hardware.mainBenefit")}: </span>
            {p.mainBenefit}
          </span>
        </p>
        <div className="mt-auto grid gap-2 pt-2 sm:grid-cols-2">
          <Link href={href} className={buttonClass("outline", "md", "w-full")}>
            {t("common.actions.viewDetails")} <ArrowRight className="size-4" />
          </Link>
          <Link href={`${href}#enquire`} className={buttonClass("primary", "md", "w-full")}>
            <MessageSquare className="size-4" /> {t("common.actions.enquireNow")}
          </Link>
        </div>
      </div>
    </article>
  );
}

"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Languages } from "lucide-react";
import { setLocaleAction } from "@/app/actions/locale";
import { LOCALES, LOCALE_FULL_NAMES, LOCALE_NAMES, type Locale } from "@/i18n/config";
import { useLocale, useT } from "@/i18n/client";
import { cn } from "@/lib/format";

/**
 * EN | தமிழ் | മലയാളം | हिन्दी — segmented on wide screens, a compact dropdown below.
 * `variant="segmented"` always shows the buttons (used inside the mobile menu drawer).
 */
export function LanguageSelector({ className, variant = "auto" }: { className?: string; variant?: "auto" | "segmented" }) {
  const locale = useLocale();
  const t = useT();
  const router = useRouter();
  const [pending, start] = useTransition();
  const change = (l: Locale) => {
    if (l === locale) return;
    start(async () => {
      await setLocaleAction(l);
      router.refresh();
    });
  };

  return (
    <div className={cn("flex items-center", pending && "opacity-60", className)}>
      <div role="group" aria-label={t("common.language.label")} className={cn("items-center rounded-xl bg-white/70 p-0.5 ring-1 ring-earth-100", variant === "segmented" ? "flex w-fit" : "hidden xl:flex")}>
        {LOCALES.map((l, i) => (
          <span key={l} className="flex items-center">
            {i > 0 && <span className="px-0.5 text-earth-200" aria-hidden>|</span>}
            <button
              type="button"
              lang={l}
              onClick={() => change(l)}
              aria-pressed={locale === l}
              title={LOCALE_FULL_NAMES[l]}
              className={cn("rounded-lg px-2 py-1 text-xs font-semibold transition", locale === l ? "bg-leaf-700 text-white" : "text-earth-700 hover:bg-cream")}
            >
              {LOCALE_NAMES[l]}
            </button>
          </span>
        ))}
      </div>
      {/* Phones: icon-sized trigger with the native picker laid over it; tablets: icon + current language. */}
      {variant === "auto" && (
        <label className="relative flex size-9 items-center justify-center rounded-xl border border-earth-200 bg-white sm:size-auto sm:border-0 sm:bg-transparent xl:hidden">
          <span className="sr-only">{t("common.language.choose")}</span>
          <Languages className="pointer-events-none size-4 text-earth-600 sm:absolute sm:left-2" />
          <select
            value={locale}
            onChange={(e) => change(e.target.value as Locale)}
            className="absolute inset-0 appearance-none opacity-0 sm:static sm:h-9 sm:rounded-xl sm:border sm:border-earth-200 sm:bg-white sm:py-1 sm:pr-2 sm:pl-7 sm:text-sm sm:font-semibold sm:text-earth-800 sm:opacity-100"
          >
            {LOCALES.map((l) => (
              <option key={l} value={l} lang={l}>
                {LOCALE_NAMES[l]}
              </option>
            ))}
          </select>
        </label>
      )}
    </div>
  );
}

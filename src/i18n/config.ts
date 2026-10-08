// Client-safe i18n configuration. The active language is stored in a cookie so every
// existing route keeps working unchanged (no /ta/... URL prefixes).

export const LOCALES = ["en", "ta", "ml", "hi"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_COOKIE = "mm_locale";

/** Labels shown in the language selector — always in the language's own script. */
export const LOCALE_NAMES: Record<Locale, string> = {
  en: "EN",
  ta: "தமிழ்",
  ml: "മലയാളം",
  hi: "हिन्दी",
};

/** Full language names (for screen readers / dropdown). */
export const LOCALE_FULL_NAMES: Record<Locale, string> = {
  en: "English",
  ta: "தமிழ் (Tamil)",
  ml: "മലയാളം (Malayalam)",
  hi: "हिन्दी (Hindi)",
};

export function isLocale(v: unknown): v is Locale {
  return typeof v === "string" && (LOCALES as readonly string[]).includes(v);
}

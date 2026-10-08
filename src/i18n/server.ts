import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, type Locale } from "./config";
import { makeT, type Translator } from "./translate";
import { en, type Dictionary } from "./dictionaries/en";
import { ta } from "./dictionaries/ta";
import { ml } from "./dictionaries/ml";
import { hi } from "./dictionaries/hi";

const DICTIONARIES: Record<Locale, Dictionary> = { en, ta, ml, hi };

/** The viewer's language, from the `mm_locale` cookie (defaults to English). */
export const getLocale = cache(async (): Promise<Locale> => {
  const v = (await cookies()).get(LOCALE_COOKIE)?.value;
  return isLocale(v) ? v : DEFAULT_LOCALE;
});

export function getDictionary(locale: Locale): Dictionary {
  return DICTIONARIES[locale];
}

/** Server-side `t()` for Server Components, server actions and route handlers. */
export const getT = cache(async (): Promise<Translator> => makeT(getDictionary(await getLocale()), en));

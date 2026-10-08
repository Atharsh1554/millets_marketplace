"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { Locale } from "./config";
import { makeT, translateMessage, type Params, type Translator } from "./translate";
import type { Dictionary } from "./dictionaries/en";

type Ctx = { locale: Locale; t: Translator };
const I18nCtx = createContext<Ctx | null>(null);

export function I18nProvider({ locale, dict, fallback, children }: { locale: Locale; dict: Dictionary; fallback: Dictionary; children: ReactNode }) {
  const value = useMemo(() => ({ locale, t: makeT(dict, fallback) }), [locale, dict, fallback]);
  return <I18nCtx.Provider value={value}>{children}</I18nCtx.Provider>;
}

function useCtx(): Ctx {
  const c = useContext(I18nCtx);
  if (!c) throw new Error("useT must be used inside <I18nProvider>");
  return c;
}

export function useT(): Translator {
  return useCtx().t;
}

export function useLocale(): Locale {
  return useCtx().locale;
}

/** Translated text for use inside Server Components that render shared/client markup. */
export function T({ k, params, fallback }: { k: string; params?: Params; fallback?: string }) {
  const t = useT();
  return <>{t.has(k) ? t(k, params) : (fallback ?? k)}</>;
}

/** Renders an encoded server message (validation, errors, notifications) in the viewer's language. */
export function Msg({ text }: { text: string | null | undefined }) {
  const t = useT();
  return <>{translateMessage(t, text)}</>;
}

// Pure, client-safe translation helpers (no React, no Next imports).

export type Params = Record<string, string | number | null | undefined>;
type Tree = { [k: string]: string | Tree };

/** Dot-path keys of a dictionary, e.g. "common.actions.viewDetails". */
export type DotPaths<T> = T extends string ? never : { [K in keyof T & string]: T[K] extends string ? K : `${K}.${DotPaths<T[K]>}` }[keyof T & string];

function lookup(dict: Tree, key: string): string | undefined {
  let cur: string | Tree | undefined = dict;
  for (const part of key.split(".")) {
    if (cur === undefined || typeof cur === "string") return undefined;
    cur = cur[part];
  }
  return typeof cur === "string" ? cur : undefined;
}

function interpolate(text: string, params?: Params) {
  if (!params) return text;
  return text.replace(/\{(\w+)\}/g, (m, name: string) => (params[name] === undefined || params[name] === null ? m : String(params[name])));
}

// ───────────── Encoded messages ─────────────
// Server code that cannot know the viewer's language (validation, errors, stored notifications)
// emits `msg("errors.notEnoughStock", { name })`. The encoded string is translated when shown.
const PREFIX = "@@";
const SEP = "␟";

export function msg(key: string, params?: Record<string, string | number>): string {
  return params ? `${PREFIX}${key}${SEP}${JSON.stringify(params)}` : `${PREFIX}${key}`;
}

export function isEncoded(s: unknown): s is string {
  return typeof s === "string" && s.startsWith(PREFIX);
}

export type Translator = ((key: string, params?: Params) => string) & { has: (key: string) => boolean };

/** Builds `t(key, params)`; falls back to the English dictionary, then to the key itself. */
export function makeT(dict: Tree, fallback: Tree): Translator {
  const t = ((key: string, params?: Params) => {
    const raw = lookup(dict, key) ?? lookup(fallback, key);
    if (raw === undefined) return key;
    // Params that are themselves encoded messages (e.g. field names) are translated too.
    const resolved: Params | undefined = params
      ? Object.fromEntries(Object.entries(params).map(([k, v]) => [k, isEncoded(v) ? translateMessage(t, v) : v]))
      : undefined;
    return interpolate(raw, resolved);
  }) as Translator;
  t.has = (key) => lookup(dict, key) !== undefined || lookup(fallback, key) !== undefined;
  return t;
}

/** Translates an encoded message; plain text (e.g. typed by an admin) is returned unchanged. */
export function translateMessage(t: Translator, s: string | null | undefined): string {
  if (!s) return "";
  if (!isEncoded(s)) return s;
  const body = s.slice(PREFIX.length);
  const i = body.indexOf(SEP);
  const key = i === -1 ? body : body.slice(0, i);
  let params: Params | undefined;
  if (i !== -1) {
    try {
      params = JSON.parse(body.slice(i + 1));
    } catch {
      params = undefined;
    }
  }
  return t(key, params);
}

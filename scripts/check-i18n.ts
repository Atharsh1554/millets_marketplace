/**
 * i18n consistency check:  npm run i18n:check
 *  1. every static key used in src/ (t("..."), msg("..."), <T k="...">) exists in the English dictionary
 *  2. ta / ml / hi contain exactly the English keys, with the same {placeholders}
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { en } from "../src/i18n/dictionaries/en";
import { ta } from "../src/i18n/dictionaries/ta";
import { ml } from "../src/i18n/dictionaries/ml";
import { hi } from "../src/i18n/dictionaries/hi";

type Tree = { [k: string]: string | Tree };
function flatten(t: Tree, prefix = "", out: Record<string, string> = {}) {
  for (const [k, v] of Object.entries(t)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (typeof v === "string") out[key] = v;
    else flatten(v, key, out);
  }
  return out;
}

const EN = flatten(en as Tree);
let problems = 0;
const report = (m: string) => {
  problems++;
  console.log("✕", m);
};

// 1. keys used in source
const files: string[] = [];
(function walk(dir: string) {
  for (const f of readdirSync(dir)) {
    const p = path.join(dir, f);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.(ts|tsx)$/.test(f) && !p.includes(`${path.sep}dictionaries${path.sep}`)) files.push(p);
  }
})(path.join(__dirname, "..", "src"));

const patterns = [/\bt\(\s*"([a-zA-Z0-9_.]+)"/g, /\bmsg\(\s*"([a-zA-Z0-9_.]+)"/g, /<T\s+k="([a-zA-Z0-9_.]+)"/g, /\bf\("([a-zA-Z0-9_]+)"\)/g];
let used = 0;
for (const file of files) {
  const src = readFileSync(file, "utf8");
  for (const [i, re] of patterns.entries()) {
    for (const m of src.matchAll(re)) {
      const key = i === 3 ? `fields.${m[1]}` : m[1];
      if (!key.includes(".")) continue;
      used++;
      if (!(key in EN)) report(`missing key "${key}" (${path.relative(process.cwd(), file)})`);
    }
  }
  // keys passed to the field helper text(min, max, "key") / positiveNumber("key", n) / date("key")
  if (file.endsWith("validation.ts")) {
    for (const m of src.matchAll(/\b(?:text\([\d_]+, [\d_]+, |positiveNumber\(|date\()"([a-zA-Z0-9]+)"/g)) {
      if (!(`fields.${m[1]}` in EN)) report(`missing key "fields.${m[1]}" (validation.ts)`);
    }
  }
}

// 2. translations complete
const placeholders = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(",");
for (const [name, dict] of Object.entries({ ta, ml, hi })) {
  if ((dict as unknown) === en) {
    report(`${name}: still the English placeholder`);
    continue;
  }
  const D = flatten(dict as Tree);
  for (const k of Object.keys(EN)) {
    if (!(k in D)) report(`${name}: missing "${k}"`);
    else if (placeholders(D[k]) !== placeholders(EN[k])) report(`${name}: placeholder mismatch in "${k}"`);
  }
  for (const k of Object.keys(D)) if (!(k in EN)) report(`${name}: extra key "${k}"`);
}

console.log(`${Object.keys(EN).length} keys, ${used} static usages checked, ${problems} problem(s).`);
process.exit(problems ? 1 : 0);

// Generates simple illustrative product artwork (no stock photos) into public/products/.
// Run: node scripts/generate-product-art.mjs
import { mkdirSync, writeFileSync } from "node:fs";

const items = {
  "finger-millet": { bg: "#f3e7d3", grain: "#8a4b2a", grain2: "#6e3a20", label: "RAGI" },
  "pearl-millet": { bg: "#ece8dc", grain: "#9a9a86", grain2: "#7b7b68", label: "BAJRA" },
  "foxtail-millet": { bg: "#f6eccb", grain: "#d9a637", grain2: "#c28d22", label: "FOXTAIL" },
  "little-millet": { bg: "#f4efdc", grain: "#d8c48e", grain2: "#bfa86d", label: "LITTLE" },
  "kodo-millet": { bg: "#efe4d2", grain: "#a8743f", grain2: "#8c5c2e", label: "KODO" },
  "barnyard-millet": { bg: "#f2eee2", grain: "#e5dcc0", grain2: "#cbbf9b", label: "BARNYARD" },
  "proso-millet": { bg: "#f7eed4", grain: "#e6c56a", grain2: "#cfa94a", label: "PROSO" },
  "browntop-millet": { bg: "#efe6d6", grain: "#b58a52", grain2: "#9a713e", label: "BROWNTOP" },
  sorghum: { bg: "#f3efe6", grain: "#efe5cf", grain2: "#d4c6a6", label: "JOWAR" },
  "mixed-millet": { bg: "#f1ead8", grain: "#c49a52", grain2: "#8a4b2a", label: "MIXED" },
};

function rand(seed) {
  let s = seed;
  return () => ((s = (s * 9301 + 49297) % 233280) / 233280);
}

function bowl({ bg, grain, grain2, label }, seed) {
  const r = rand(seed);
  let grains = "";
  for (let i = 0; i < 230; i++) {
    const a = r() * Math.PI;
    const d = Math.sqrt(r());
    const x = 200 + Math.cos(a) * 125 * d * (r() > 0.5 ? 1 : -1);
    const y = 205 - Math.sin(a) * 42 * d - r() * 10;
    grains += `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="5.2" ry="4.2" fill="${r() > 0.5 ? grain : grain2}" transform="rotate(${Math.floor(r() * 180)} ${x.toFixed(1)} ${y.toFixed(1)})"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" role="img" aria-label="${label} illustration">
  <rect width="400" height="400" fill="${bg}"/>
  <circle cx="330" cy="70" r="90" fill="#fff" opacity=".35"/>
  <g opacity=".5" stroke="#5f7a3a" stroke-width="3" fill="none">
    <path d="M40 360 C60 300 70 250 62 180"/><path d="M62 180 c-14 -8 -20 -24 -18 -40 c14 6 22 22 18 40z" fill="#7d9a4f" stroke="none"/>
    <path d="M62 230 c14 -10 30 -12 42 -6 c-10 12 -28 14 -42 6z" fill="#7d9a4f" stroke="none"/>
  </g>
  <ellipse cx="200" cy="300" rx="150" ry="22" fill="#000" opacity=".08"/>
  <path d="M60 200 Q60 300 200 300 Q340 300 340 200 Z" fill="#7a5233"/>
  <path d="M70 205 Q75 285 200 288 Q325 285 330 205 Z" fill="#8d6240"/>
  <ellipse cx="200" cy="200" rx="140" ry="40" fill="${grain2}"/>
  ${grains}
  <rect x="140" y="320" width="120" height="30" rx="15" fill="#2f5d34"/>
  <text x="200" y="341" font-family="system-ui,sans-serif" font-size="14" font-weight="700" fill="#fff" text-anchor="middle" letter-spacing="2">${label}</text>
</svg>`;
}

function pack({ color, label, sub }, seed) {
  const r = rand(seed);
  let dots = "";
  for (let i = 0; i < 40; i++) dots += `<circle cx="${(60 + r() * 280).toFixed(0)}" cy="${(300 + r() * 50).toFixed(0)}" r="${(2 + r() * 3).toFixed(1)}" fill="${color}" opacity=".35"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" role="img" aria-label="${label} illustration">
  <rect width="400" height="400" fill="#f4ecdb"/>
  ${dots}
  <ellipse cx="200" cy="350" rx="120" ry="14" fill="#000" opacity=".08"/>
  <path d="M110 80 L290 80 L305 340 L95 340 Z" fill="#fffaf0" stroke="#d9c9a8" stroke-width="3"/>
  <path d="M110 80 L290 80 L292 112 L108 112 Z" fill="${color}"/>
  <path d="M120 70 h160 v12 h-160z" fill="#d9c9a8"/>
  <circle cx="200" cy="200" r="52" fill="${color}" opacity=".15"/>
  <path d="M200 160 c-6 20 -6 50 0 80 M200 175 c-14 -4 -22 -14 -24 -26 c14 2 22 12 24 26z M200 175 c14 -4 22 -14 24 -26 c-14 2 -22 12 -24 26z M200 205 c-14 -4 -22 -14 -24 -26 c14 2 22 12 24 26z M200 205 c14 -4 22 -14 24 -26 c-14 2 -22 12 -24 26z" fill="${color}" stroke="${color}" stroke-width="3"/>
  <text x="200" y="285" font-family="system-ui,sans-serif" font-size="20" font-weight="800" fill="#3b2a1a" text-anchor="middle">${label}</text>
  <text x="200" y="310" font-family="system-ui,sans-serif" font-size="12" fill="#6b5640" text-anchor="middle" letter-spacing="2">${sub}</text>
</svg>`;
}

mkdirSync("public/products", { recursive: true });
let seed = 11;
for (const [name, cfg] of Object.entries(items)) writeFileSync(`public/products/${name}.svg`, bowl(cfg, seed++));
writeFileSync("public/products/millet-flour.svg", pack({ color: "#8a4b2a", label: "MILLET FLOUR", sub: "STONE GROUND" }, 3));
writeFileSync("public/products/millet-snacks.svg", pack({ color: "#c98a1c", label: "MILLET SNACKS", sub: "BAKED · ROASTED" }, 5));
writeFileSync("public/products/millet-mix.svg", pack({ color: "#2f5d34", label: "READY MIX", sub: "JUST ADD WATER" }, 9));
console.log("Product art generated in public/products/");

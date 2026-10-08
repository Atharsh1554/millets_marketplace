// Generates simple placeholder illustrations for hardware categories into public/hardware/.
// Used only when an admin has not uploaded a product photo. Run: node scripts/generate-hardware-art.mjs
import { mkdirSync, writeFileSync } from "node:fs";

const FRAME = (bg, body, label) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" role="img" aria-label="${label}">
  <rect width="400" height="300" fill="${bg}"/>
  <circle cx="340" cy="50" r="80" fill="#fff" opacity=".35"/>
  <ellipse cx="200" cy="262" rx="140" ry="12" fill="#000" opacity=".08"/>
  ${body}
</svg>`;

const steel = "#7b8a7a", dark = "#2f5d34", gold = "#d9a637", earth = "#8d6240", cream = "#fffaf0";

const art = {
  processing: FRAME("#eef3e8", `
    <rect x="110" y="110" width="180" height="140" rx="14" fill="${dark}"/>
    <rect x="130" y="130" width="70" height="50" rx="6" fill="${cream}" opacity=".9"/>
    <circle cx="245" cy="155" r="22" fill="${gold}"/><circle cx="245" cy="155" r="8" fill="${dark}"/>
    <path d="M150 110 L170 60 L230 60 L250 110 Z" fill="${steel}"/>
    <rect x="285" y="200" width="60" height="16" rx="4" fill="${steel}"/>
    <g fill="${gold}">${Array.from({ length: 10 }, (_, i) => `<circle cx="${305 + (i % 5) * 8}" cy="${226 + Math.floor(i / 5) * 8}" r="3"/>`).join("")}</g>`, "Millet processing machine"),
  dehulling: FRAME("#f6eccb", `
    <path d="M160 70 L240 70 L220 120 L180 120 Z" fill="${steel}"/>
    <rect x="140" y="120" width="120" height="110" rx="12" fill="${earth}"/>
    <circle cx="200" cy="170" r="32" fill="${cream}"/><circle cx="200" cy="170" r="20" fill="${gold}"/>
    <path d="M200 150 v40 M180 170 h40" stroke="${earth}" stroke-width="5" stroke-linecap="round"/>
    <rect x="255" y="200" width="70" height="14" rx="4" fill="${steel}"/>
    <g fill="${gold}">${Array.from({ length: 8 }, (_, i) => `<ellipse cx="${80 + i * 6}" cy="${232 - (i % 2) * 6}" rx="4" ry="3"/>`).join("")}</g>`, "Dehulling machine"),
  cleaning: FRAME("#eef1ec", `
    <rect x="90" y="120" width="220" height="70" rx="10" fill="${dark}" transform="rotate(-8 200 155)"/>
    <g stroke="${cream}" stroke-width="3" opacity=".8">${Array.from({ length: 9 }, (_, i) => `<line x1="${115 + i * 20}" y1="${140 - i * 3}" x2="${115 + i * 20}" y2="${170 - i * 3}"/>`).join("")}</g>
    <rect x="120" y="195" width="12" height="50" fill="${steel}"/><rect x="268" y="175" width="12" height="70" fill="${steel}"/>
    <g fill="${gold}">${Array.from({ length: 14 }, (_, i) => `<circle cx="${130 + i * 11}" cy="${112 - (i % 3) * 5 - i * 1.5}" r="3.5"/>`).join("")}</g>`, "Grain cleaning machine"),
  drying: FRAME("#fdf3df", `
    <circle cx="90" cy="80" r="34" fill="${gold}"/>
    <g stroke="${gold}" stroke-width="4" stroke-linecap="round">${Array.from({ length: 8 }, (_, i) => { const a = (i * Math.PI) / 4; return `<line x1="${90 + Math.cos(a) * 44}" y1="${80 + Math.sin(a) * 44}" x2="${90 + Math.cos(a) * 54}" y2="${80 + Math.sin(a) * 54}"/>`; }).join("")}</g>
    <path d="M150 140 L290 140 L310 240 L130 240 Z" fill="${earth}"/>
    <g fill="${cream}" opacity=".85">${[0, 1, 2].map((r) => `<rect x="${158 + r * 4}" y="${155 + r * 28}" width="${124 - r * 8 + 24}" height="16" rx="4"/>`).join("")}</g>
    <path d="M220 110 q-10 -12 0 -24 q10 -12 0 -24" stroke="${steel}" stroke-width="4" fill="none"/>`, "Drying equipment"),
  storage: FRAME("#eef3e8", `
    <rect x="130" y="80" width="140" height="160" rx="18" fill="${steel}"/>
    <path d="M130 100 Q200 50 270 100" fill="${dark}"/>
    <g stroke="${cream}" stroke-width="3" opacity=".6"><line x1="130" y1="140" x2="270" y2="140"/><line x1="130" y1="190" x2="270" y2="190"/></g>
    <rect x="185" y="215" width="30" height="25" rx="4" fill="${gold}"/>
    <rect x="60" y="190" width="60" height="50" rx="8" fill="${earth}"/><rect x="290" y="200" width="55" height="40" rx="8" fill="${earth}"/>`, "Storage equipment"),
  weighing: FRAME("#f4efdc", `
    <rect x="110" y="200" width="180" height="40" rx="8" fill="${dark}"/>
    <rect x="150" y="185" width="100" height="18" rx="4" fill="${steel}"/>
    <rect x="160" y="210" width="80" height="22" rx="4" fill="#cfe3c2"/>
    <text x="200" y="227" font-family="monospace" font-size="16" font-weight="700" fill="${dark}" text-anchor="middle">50.0 kg</text>
    <path d="M150 185 L165 110 L235 110 L250 185 Z" fill="${earth}"/>
    <path d="M165 110 Q200 90 235 110" fill="${gold}"/>`, "Weighing equipment"),
  other: FRAME("#eef1ec", `
    <rect x="100" y="150" width="200" height="70" rx="12" fill="${dark}"/>
    <circle cx="140" cy="230" r="22" fill="${steel}"/><circle cx="260" cy="230" r="22" fill="${steel}"/>
    <circle cx="140" cy="230" r="8" fill="${cream}"/><circle cx="260" cy="230" r="8" fill="${cream}"/>
    <rect x="200" y="100" width="70" height="55" rx="8" fill="${earth}"/>
    <path d="M230 100 v-30 h25" stroke="${steel}" stroke-width="6" fill="none" stroke-linecap="round"/>
    <circle cx="80" cy="120" r="18" fill="${gold}"/>`, "Agricultural hardware"),
};

mkdirSync("public/hardware", { recursive: true });
for (const [name, svg] of Object.entries(art)) writeFileSync(`public/hardware/${name}.svg`, svg);
console.log("Hardware art generated in public/hardware/");

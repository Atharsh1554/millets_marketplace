import Link from "next/link";
import { cn } from "@/lib/format";
import { T } from "@/i18n/client";

export function Logo({ className, light = false }: { className?: string; light?: boolean }) {
  return (
    <Link href="/" className={cn("flex items-center gap-2", className)} aria-label="Millet Market">
      <svg viewBox="0 0 40 40" className="size-9" aria-hidden>
        <rect width="40" height="40" rx="12" fill="#2f5d34" />
        <path d="M20 31V12" stroke="#ecc752" strokeWidth="2.4" strokeLinecap="round" />
        {[14, 19, 24].map((y) => (
          <g key={y} fill="#ecc752">
            <ellipse cx="15.6" cy={y} rx="3.6" ry="2.2" transform={`rotate(-30 15.6 ${y})`} />
            <ellipse cx="24.4" cy={y} rx="3.6" ry="2.2" transform={`rotate(30 24.4 ${y})`} />
          </g>
        ))}
        <ellipse cx="20" cy="9.5" rx="2.2" ry="3.2" fill="#ecc752" />
      </svg>
      <span className={cn("font-display text-xl leading-none font-semibold", light ? "text-white" : "text-earth-900")}>
        Millet<span className="text-millet-500">Market</span>
      </span>
    </Link>
  );
}

export function DemoBanner() {
  if (process.env.NEXT_PUBLIC_DEMO_MODE !== "true") return null;
  return (
    <div className="bg-earth-900 px-4 py-1.5 text-center text-xs text-millet-100">
      <span className="font-semibold text-millet-300">
        <T k="common.demo.bannerTitle" />
      </span>{" "}
      <T k="common.demo.bannerText" />
    </div>
  );
}

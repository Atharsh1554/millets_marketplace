import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/format";
import { LABEL_NS, type Tone } from "@/lib/labels";
import { T } from "@/i18n/client";

const BTN_BASE =
  "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition active:scale-[.98] disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap";
const BTN_VARIANTS = {
  primary: "bg-leaf-700 text-white hover:bg-leaf-800 shadow-sm",
  gold: "bg-millet-400 text-earth-900 hover:bg-millet-300 shadow-sm",
  outline: "border border-earth-200 bg-white text-earth-800 hover:bg-cream",
  ghost: "text-earth-700 hover:bg-earth-50",
  danger: "bg-red-600 text-white hover:bg-red-700",
  dangerOutline: "border border-red-200 bg-white text-red-700 hover:bg-red-50",
};
const BTN_SIZES = { sm: "px-3 py-1.5 text-sm", md: "px-4 py-2.5 text-sm", lg: "px-6 py-3.5 text-base" };

export type ButtonVariant = keyof typeof BTN_VARIANTS;

export function buttonClass(variant: ButtonVariant = "primary", size: keyof typeof BTN_SIZES = "md", extra?: string) {
  return cn(BTN_BASE, BTN_VARIANTS[variant], BTN_SIZES[size], extra);
}

export function Button({ variant = "primary", size = "md", className, ...rest }: ComponentProps<"button"> & { variant?: ButtonVariant; size?: keyof typeof BTN_SIZES }) {
  return <button className={buttonClass(variant, size, className)} {...rest} />;
}

export function LinkButton({ variant = "primary", size = "md", className, ...rest }: ComponentProps<typeof Link> & { variant?: ButtonVariant; size?: keyof typeof BTN_SIZES }) {
  return <Link className={buttonClass(variant, size, className)} {...rest} />;
}

export function Card({ className, ...rest }: ComponentProps<"div">) {
  return <div className={cn("card", className)} {...rest} />;
}

export function CardHeader({ title, subtitle, action, icon: Icon }: { title: ReactNode; subtitle?: ReactNode; action?: ReactNode; icon?: LucideIcon }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-earth-100 px-5 py-4">
      <div className="flex items-start gap-3">
        {Icon && (
          <span className="mt-0.5 grid size-9 place-items-center rounded-xl bg-leaf-50 text-leaf-700">
            <Icon className="size-5" />
          </span>
        )}
        <div>
          <h2 className="font-semibold text-earth-900">{title}</h2>
          {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

const TONES: Record<Tone, string> = {
  neutral: "bg-earth-50 text-earth-700 ring-earth-200",
  info: "bg-sky-50 text-sky-800 ring-sky-200",
  warning: "bg-amber-50 text-amber-800 ring-amber-200",
  success: "bg-leaf-50 text-leaf-800 ring-leaf-200",
  danger: "bg-red-50 text-red-700 ring-red-200",
  gold: "bg-millet-50 text-millet-700 ring-millet-200",
};

export function Badge({ tone = "neutral", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ring-1 ring-inset", TONES[tone], className)}>
      {children}
    </span>
  );
}

/** Badge from one of the label maps in lib/labels — translated via labels.<ns>.<value>. */
export function StatusBadge({ map, value, className }: { map: Record<string, { label: string; tone: Tone }>; value: string | null | undefined; className?: string }) {
  if (!value) return <span className="text-earth-300">—</span>;
  const s = map[value] ?? { label: value, tone: "neutral" as Tone };
  const ns = LABEL_NS.get(map);
  return (
    <Badge tone={s.tone} className={className}>
      {ns ? <T k={`labels.${ns}.${value}`} fallback={s.label} /> : s.label}
    </Badge>
  );
}

export function DemoBadge() {
  return (
    <Badge tone="gold" className="uppercase tracking-wider">
      <T k="common.demo.badge" />
    </Badge>
  );
}

export function StatCard({ label, value, icon: Icon, hint, tone = "leaf" }: { label: string; value: ReactNode; icon?: LucideIcon; hint?: ReactNode; tone?: "leaf" | "gold" | "earth" | "red" | "sky" }) {
  const tones = {
    leaf: "bg-leaf-50 text-leaf-700",
    gold: "bg-millet-50 text-millet-600",
    earth: "bg-earth-50 text-earth-600",
    red: "bg-red-50 text-red-600",
    sky: "bg-sky-50 text-sky-700",
  };
  return (
    <div className="card flex items-start gap-3 p-4">
      {Icon && (
        <span className={cn("grid size-10 shrink-0 place-items-center rounded-xl", tones[tone])}>
          <Icon className="size-5" />
        </span>
      )}
      <div className="min-w-0">
        <p className="text-xs font-medium text-muted">{label}</p>
        <p className="mt-0.5 truncate text-xl font-bold text-earth-900">{value}</p>
        {hint && <p className="mt-0.5 text-xs text-muted">{hint}</p>}
      </div>
    </div>
  );
}

export function PageHeader({ title, subtitle, action, eyebrow }: { title: ReactNode; subtitle?: ReactNode; action?: ReactNode; eyebrow?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && <p className="mb-1 text-xs font-semibold tracking-widest text-millet-600 uppercase">{eyebrow}</p>}
        <h1 className="font-display text-2xl font-semibold text-earth-900 sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 max-w-2xl text-sm text-muted">{subtitle}</p>}
      </div>
      {action && <div className="flex flex-wrap gap-2">{action}</div>}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, children, action }: { icon?: LucideIcon; title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="card grain-bg flex flex-col items-center px-6 py-14 text-center">
      {Icon && (
        <span className="mb-3 grid size-12 place-items-center rounded-2xl bg-white text-leaf-700 shadow-sm">
          <Icon className="size-6" />
        </span>
      )}
      <h3 className="font-semibold text-earth-900">{title}</h3>
      {children && <p className="mt-1 max-w-md text-sm text-muted">{children}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function DetailList({ items, cols = 2 }: { items: Array<[ReactNode, ReactNode]>; cols?: 1 | 2 | 3 }) {
  return (
    <dl className={cn("grid gap-x-6 gap-y-3 text-sm", cols === 2 && "sm:grid-cols-2", cols === 3 && "sm:grid-cols-3")}>
      {items.map(([k, v], i) => (
        <div key={i} className="min-w-0">
          <dt className="text-xs font-medium tracking-wide text-muted uppercase">{k}</dt>
          <dd className="mt-0.5 break-words text-earth-900">{v ?? "—"}</dd>
        </div>
      ))}
    </dl>
  );
}

export function Notice({ tone = "info", title, children, icon: Icon }: { tone?: Tone; title?: ReactNode; children?: ReactNode; icon?: LucideIcon }) {
  return (
    <div className={cn("flex gap-3 rounded-2xl p-4 text-sm ring-1 ring-inset", TONES[tone])}>
      {Icon && <Icon className="mt-0.5 size-5 shrink-0" />}
      <div>
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={cn(!!title && "mt-0.5", "opacity-90")}>{children}</div>}
      </div>
    </div>
  );
}

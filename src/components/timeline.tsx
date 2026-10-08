import { Check, Circle, X } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/format";

export type StepState = "done" | "current" | "upcoming" | "failed";
export type TimelineStep = { label: string; state: StepState; detail?: ReactNode };

/** Vertical progress timeline used for harvests, orders and the quality verification. */
export function Timeline({ steps, compact = false }: { steps: TimelineStep[]; compact?: boolean }) {
  return (
    <ol className="relative">
      {steps.map((s, i) => (
        <li key={i} className={cn("relative flex gap-3", !compact && "pb-5", compact && "pb-3", i === steps.length - 1 && "pb-0")}>
          {i < steps.length - 1 && (
            <span aria-hidden className={cn("absolute top-7 left-[13px] h-[calc(100%-24px)] w-0.5", s.state === "done" ? "bg-leaf-400" : "bg-earth-100")} />
          )}
          <span
            className={cn(
              "relative z-10 grid size-7 shrink-0 place-items-center rounded-full ring-4 ring-white",
              s.state === "done" && "bg-leaf-600 text-white",
              s.state === "current" && "bg-millet-400 text-earth-900",
              s.state === "upcoming" && "border-2 border-earth-200 bg-white text-earth-200",
              s.state === "failed" && "bg-red-600 text-white",
            )}
          >
            {s.state === "done" && <Check className="size-4" strokeWidth={3} />}
            {s.state === "current" && <span className="size-2.5 animate-pulse rounded-full bg-earth-900" />}
            {s.state === "upcoming" && <Circle className="size-2.5 fill-current" />}
            {s.state === "failed" && <X className="size-4" strokeWidth={3} />}
          </span>
          <div className="min-w-0 pt-0.5">
            <p
              className={cn(
                "text-sm font-semibold",
                s.state === "upcoming" ? "text-earth-300" : s.state === "failed" ? "text-red-700" : "text-earth-900",
              )}
            >
              {s.label}
            </p>
            {s.detail && <div className="mt-0.5 text-xs text-muted">{s.detail}</div>}
          </div>
        </li>
      ))}
    </ol>
  );
}

/** Horizontal step indicator (checkout, compact trackers). */
export function Stepper({ steps, current }: { steps: string[]; current: number }) {
  return (
    <ol className="flex w-full items-center gap-1 overflow-x-auto pb-1">
      {steps.map((label, i) => (
        <li key={label} className="flex flex-1 items-center gap-2">
          <span
            className={cn(
              "grid size-7 shrink-0 place-items-center rounded-full text-xs font-bold",
              i < current && "bg-leaf-600 text-white",
              i === current && "bg-millet-400 text-earth-900",
              i > current && "bg-earth-100 text-earth-400",
            )}
          >
            {i < current ? <Check className="size-4" strokeWidth={3} /> : i + 1}
          </span>
          <span className={cn("text-xs font-semibold whitespace-nowrap sm:text-sm", i > current ? "text-earth-300" : "text-earth-800")}>{label}</span>
          {i < steps.length - 1 && <span className={cn("mx-1 h-0.5 min-w-4 flex-1 rounded", i < current ? "bg-leaf-400" : "bg-earth-100")} />}
        </li>
      ))}
    </ol>
  );
}

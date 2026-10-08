"use client";

import { Bar, BarChart, CartesianGrid, Cell, Legend, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

// Validated categorical palette (scripts/validate_palette.js — all checks pass on light surface).
export const SERIES = { revenue: "#46702c", farmer: "#b07d14", expenses: "#7a5ab8" } as const;
const INK = "#66705f";
const GRID = "#eedfd0";

const inrShort = (paise: number) => {
  const r = paise / 100;
  if (Math.abs(r) >= 100000) return `₹${(r / 100000).toFixed(1)}L`;
  if (Math.abs(r) >= 1000) return `₹${(r / 1000).toFixed(0)}k`;
  return `₹${r.toFixed(0)}`;
};
const inrFull = (paise: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(paise / 100);
const monthLabel = (p: string) => new Date(`${p}-01T00:00:00`).toLocaleDateString("en-IN", { month: "short" });

const axis = { stroke: INK, fontSize: 11, tickLine: false, axisLine: false } as const;
const tooltipStyle = { borderRadius: 12, border: "1px solid #eedfd0", boxShadow: "0 8px 24px rgb(46 31 20 / .10)", fontSize: 12 };

type Monthly = { period: string; revenue: number; farmerPayments: number; expenses: number; profit: number; unitsSold: number; procuredKg: number };

export function RevenueCostChart({ data }: { data: Monthly[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} barGap={2} margin={{ left: 4, right: 8, top: 8 }}>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey="period" tickFormatter={monthLabel} {...axis} />
        <YAxis tickFormatter={inrShort} width={52} {...axis} />
        <Tooltip formatter={(v) => inrFull(Number(v))} labelFormatter={(l) => monthLabel(String(l))} contentStyle={tooltipStyle} cursor={{ fill: "#faf6ec" }} />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, color: INK }} />
        <Bar dataKey="revenue" name="Revenue" fill={SERIES.revenue} radius={[4, 4, 0, 0]} maxBarSize={18} />
        <Bar dataKey="farmerPayments" name="Farmer payments" fill={SERIES.farmer} radius={[4, 4, 0, 0]} maxBarSize={18} />
        <Bar dataKey="expenses" name="Expenses" fill={SERIES.expenses} radius={[4, 4, 0, 0]} maxBarSize={18} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function ProfitChart({ data }: { data: Monthly[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ left: 4, right: 8, top: 8 }}>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey="period" tickFormatter={monthLabel} {...axis} />
        <YAxis tickFormatter={inrShort} width={52} {...axis} />
        <ReferenceLine y={0} stroke="#a87a52" />
        <Tooltip formatter={(v) => [inrFull(Number(v)), "Net profit"]} labelFormatter={(l) => monthLabel(String(l))} contentStyle={tooltipStyle} cursor={{ fill: "#faf6ec" }} />
        <Bar dataKey="profit" name="Net profit" radius={4} maxBarSize={22}>
          {data.map((d) => (
            <Cell key={d.period} fill={d.profit >= 0 ? SERIES.revenue : "#c2410c"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Single-series bar chart (no legend needed — the card title names it). */
export function SimpleBarChart({
  data,
  format = "number",
  horizontal = false,
  color = SERIES.revenue,
  name,
  height = 240,
}: {
  data: Array<{ label: string; value: number }>;
  format?: "number" | "inr" | "kg" | "month";
  horizontal?: boolean;
  color?: string;
  name: string;
  height?: number;
}) {
  const fmt = (v: number) => (format === "inr" ? inrFull(v) : format === "kg" ? `${v.toLocaleString("en-IN", { maximumFractionDigits: 1 })} kg` : v.toLocaleString("en-IN"));
  const tick = (v: number) => (format === "inr" ? inrShort(v) : format === "kg" ? `${Math.round(v)}` : String(v));
  const labelTick = (l: string) => (/^\d{4}-\d{2}$/.test(l) ? monthLabel(l) : l);
  return (
    <ResponsiveContainer width="100%" height={height}>
      {horizontal ? (
        <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
          <CartesianGrid stroke={GRID} horizontal={false} />
          <XAxis type="number" tickFormatter={tick} {...axis} />
          <YAxis type="category" dataKey="label" width={120} {...axis} />
          <Tooltip formatter={(v) => [fmt(Number(v)), name]} contentStyle={tooltipStyle} cursor={{ fill: "#faf6ec" }} />
          <Bar dataKey="value" fill={color} radius={[0, 4, 4, 0]} maxBarSize={18} />
        </BarChart>
      ) : (
        <BarChart data={data} margin={{ left: 4, right: 8, top: 8 }}>
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis dataKey="label" tickFormatter={labelTick} {...axis} />
          <YAxis tickFormatter={tick} width={48} {...axis} />
          <Tooltip formatter={(v) => [fmt(Number(v)), name]} labelFormatter={(l) => labelTick(String(l))} contentStyle={tooltipStyle} cursor={{ fill: "#faf6ec" }} />
          <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} maxBarSize={22} />
        </BarChart>
      )}
    </ResponsiveContainer>
  );
}

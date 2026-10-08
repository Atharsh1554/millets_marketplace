// Client-safe formatting helpers. Money is integer paise, quantity is integer grams.

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
  minimumFractionDigits: 0,
});

export function formatINR(paise: number | null | undefined): string {
  return inr.format((paise ?? 0) / 100);
}

export function rupeesToPaise(rupees: number): number {
  return Math.round(rupees * 100);
}

export function paiseToRupees(paise: number): number {
  return paise / 100;
}

export function kgToGrams(kg: number): number {
  return Math.round(kg * 1000);
}

export function formatKg(grams: number | null | undefined): string {
  const g = grams ?? 0;
  if (Math.abs(g) < 1000 && g !== 0) return `${g} g`;
  const kg = g / 1000;
  return `${kg.toLocaleString("en-IN", { maximumFractionDigits: 3 })} kg`;
}

export function formatWeight(grams: number): string {
  return grams >= 1000 ? `${grams / 1000} kg` : `${grams} g`;
}

/** Farmer amount = quantity (kg) × price per kg. Integer-safe. */
export function farmerAmountPaise(quantityGrams: number, pricePerKgPaise: number): number {
  return Math.round((quantityGrams * pricePerKgPaise) / 1000);
}

export function formatDate(d: Date | string | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function formatDateTime(d: Date | string | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function discountPercent(pricePaise: number, mrpPaise: number): number {
  if (mrpPaise <= 0 || pricePaise >= mrpPaise) return 0;
  return Math.round(((mrpPaise - pricePaise) / mrpPaise) * 100);
}

export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

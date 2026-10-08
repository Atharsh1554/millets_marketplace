import type { Tx } from "@/server/db";

/** Human-readable sequential codes, e.g. HS-2026-0001. Zero-padded so lexical order == numeric order. */
async function next(prefix: string, width: number, latest: (startsWith: string) => Promise<string | null | undefined>) {
  const year = new Date().getFullYear();
  const base = `${prefix}-${year}-`;
  const last = await latest(base);
  const n = last ? parseInt(last.slice(base.length), 10) + 1 : 1;
  return `${base}${String(n).padStart(width, "0")}`;
}

export const codes = {
  harvest: (tx: Tx) =>
    next("HS", 4, async (s) => (await tx.harvestSubmission.findFirst({ where: { code: { startsWith: s } }, orderBy: { code: "desc" }, select: { code: true } }))?.code),
  test: (tx: Tx) =>
    next("PT", 4, async (s) => (await tx.physicalTest.findFirst({ where: { code: { startsWith: s } }, orderBy: { code: "desc" }, select: { code: true } }))?.code),
  procurement: (tx: Tx) =>
    next("PR", 4, async (s) => (await tx.procurement.findFirst({ where: { code: { startsWith: s } }, orderBy: { code: "desc" }, select: { code: true } }))?.code),
  batch: (tx: Tx) =>
    next("MM", 3, async (s) => (await tx.batch.findFirst({ where: { batchNumber: { startsWith: s } }, orderBy: { batchNumber: "desc" }, select: { batchNumber: true } }))?.batchNumber),
  order: (tx: Tx) =>
    next("ORD", 6, async (s) => (await tx.order.findFirst({ where: { code: { startsWith: s } }, orderBy: { code: "desc" }, select: { code: true } }))?.code),
};

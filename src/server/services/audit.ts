import { db } from "@/server/db";

const ENTITY_KEYS = ["submissionId", "testId", "procurementId", "inventoryId", "productId", "orderId", "paymentId", "complaintId", "enquiryId", "farmerId", "id"];
const DETAIL_KEYS = ["decision", "result", "status", "paymentMethod", "category", "amount", "role", "quantity", "rating"];

/** Writes an append-only audit row. Never throws — auditing must not break the action. */
export async function writeAudit(entry: { actorId?: string | null; actorRole?: string | null; action: string; entity?: string; entityId?: string; details?: string }) {
  try {
    await db.auditLog.create({ data: entry });
  } catch (err) {
    console.error("[audit] failed", err);
  }
}

/** Derives entity + safe details (never passwords or free text) from submitted form data. */
export function describeForm(form?: FormData) {
  if (!form) return {};
  const key = ENTITY_KEYS.find((k) => typeof form.get(k) === "string" && form.get(k));
  const details = DETAIL_KEYS.filter((k) => typeof form.get(k) === "string" && form.get(k))
    .map((k) => `${k}=${String(form.get(k)).slice(0, 40)}`)
    .join(", ");
  return { entity: key ? key.replace(/Id$/, "") : undefined, entityId: key ? String(form.get(key)) : undefined, details: details || undefined };
}

export function humanize(fnName: string) {
  const s = fnName.replace(/Action$/, "").replace(/([A-Z])/g, " $1").trim().toLowerCase();
  return s.charAt(0).toUpperCase() + s.slice(1);
}

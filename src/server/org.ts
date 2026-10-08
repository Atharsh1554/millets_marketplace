import "server-only";

/**
 * Organisation contact details, configured via environment variables (never hard-coded):
 *   ORG_CONTACT_PHONE  e.g. "+91 44 1234 5678" — used for the farmer "Call Now" button
 */
export function orgContactPhone(): string | null {
  const v = process.env.ORG_CONTACT_PHONE?.trim();
  return v ? v : null;
}

/** tel: URI (digits and leading + only). */
export function telHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

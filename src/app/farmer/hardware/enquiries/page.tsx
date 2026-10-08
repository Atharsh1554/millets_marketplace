import Link from "next/link";
import { MessageSquare } from "lucide-react";
import { EmptyState, LinkButton, PageHeader, StatusBadge } from "@/components/ui";
import { requirePageRole } from "@/server/auth/guard";
import { HARDWARE_PLACEHOLDER, myEnquiries } from "@/server/services/hardware";
import { getT } from "@/i18n/server";
import { formatDate } from "@/lib/format";
import { ENQUIRY_STATUS } from "@/lib/labels";

/** A farmer's own hardware enquiries (never other farmers'). */
export default async function MyEnquiriesPage() {
  const user = await requirePageRole(["FARMER"]);
  const [t, enquiries] = await Promise.all([getT(), myEnquiries(user.id)]);
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title={t("hardware.myEnquiries")} subtitle={t("hardware.myEnquiriesSubtitle")} />
      {enquiries.length === 0 ? (
        <EmptyState icon={MessageSquare} title={t("hardware.noEnquiries")} action={<LinkButton href="/farmer/hardware">{t("hardware.browse")}</LinkButton>} />
      ) : (
        <ul className="space-y-3">
          {enquiries.map((e) => (
            <li key={e.id} className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-start">
              <img src={e.product.images[0]?.url ?? HARDWARE_PLACEHOLDER[e.product.category]} alt="" className="h-24 w-full rounded-xl object-cover sm:w-32" />
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  {e.product.status === "PUBLISHED" ? (
                    <Link href={`/farmer/hardware/${e.product.slug}`} className="font-semibold text-earth-900 hover:text-leaf-700">{e.product.name}</Link>
                  ) : (
                    <span className="font-semibold text-earth-900">{e.product.name}</span>
                  )}
                  <StatusBadge map={ENQUIRY_STATUS} value={e.status} />
                </div>
                <p className="text-sm text-muted">
                  {formatDate(e.createdAt)} · {t("hardware.quantityShort")}: {e.quantity}
                  {e.requirement ? ` · ${e.requirement}` : ""}
                </p>
                <p className="text-sm text-earth-800">{e.message}</p>
                {e.adminNote && (
                  <p className="rounded-xl bg-leaf-50 px-3 py-2 text-sm text-leaf-800">
                    <span className="font-semibold">{t("hardware.teamNote")}: </span>
                    {e.adminNote}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

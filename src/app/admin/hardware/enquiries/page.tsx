import Link from "next/link";
import { ArrowLeft, MessageSquare } from "lucide-react";
import { EmptyState, PageHeader, StatusBadge } from "@/components/ui";
import { requirePageRole } from "@/server/auth/guard";
import { adminEnquiries } from "@/server/services/hardware";
import { db } from "@/server/db";
import { cn, formatDateTime } from "@/lib/format";
import { ENQUIRY_STATUS } from "@/lib/labels";
import { EnquiryUpdater } from "./enquiry-updater";

const FILTERS: Array<[string, string]> = [
  ["", "All"],
  ["NEW", "New"],
  ["CONTACTED", "Contacted"],
  ["IN_DISCUSSION", "In Discussion"],
  ["COMPLETED", "Completed"],
  ["CANCELLED", "Cancelled"],
];

export default async function HardwareEnquiriesPage({ searchParams }: PageProps<"/admin/hardware/enquiries">) {
  await requirePageRole(["ADMIN"]);
  const s = (await searchParams).status;
  const status = typeof s === "string" ? s : "";
  const [enquiries, counts] = await Promise.all([adminEnquiries(status || undefined), db.hardwareEnquiry.groupBy({ by: ["status"], _count: { _all: true } })]);
  const count = (k: string) => (k ? (counts.find((c) => c.status === k)?._count._all ?? 0) : counts.reduce((a, c) => a + c._count._all, 0));

  return (
    <div className="mx-auto max-w-7xl">
      <Link href="/admin/hardware" className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-earth-600 hover:text-earth-900">
        <ArrowLeft className="size-4" /> Hardware products
      </Link>
      <PageHeader title="Hardware Enquiries" subtitle="Farmer enquiries about hardware products. Farmers are notified whenever the status changes." />
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map(([v, l]) => (
          <Link key={v} href={v ? `/admin/hardware/enquiries?status=${v}` : "/admin/hardware/enquiries"} className={cn("rounded-full px-3 py-1.5 text-sm font-semibold whitespace-nowrap", status === v ? "bg-leaf-700 text-white" : "bg-white text-earth-700 ring-1 ring-earth-100")}>
            {l} ({count(v)})
          </Link>
        ))}
      </div>
      {enquiries.length === 0 ? (
        <EmptyState icon={MessageSquare} title="No enquiries in this view" />
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Farmer</th>
                <th>Contact</th>
                <th>Hardware</th>
                <th>Quantity / requirement</th>
                <th>Message</th>
                <th>Status</th>
                <th>Update</th>
              </tr>
            </thead>
            <tbody>
              {enquiries.map((e) => (
                <tr key={e.id} className="align-top">
                  <td className="text-xs whitespace-nowrap">{formatDateTime(e.createdAt)}</td>
                  <td>
                    <p className="font-semibold">{e.user.name}</p>
                    {e.user.farmer && <p className="text-xs text-muted">{e.user.farmer.village}, {e.user.farmer.district}</p>}
                  </td>
                  <td className="text-xs">
                    <p className="font-semibold">{e.contactName}</p>
                    <a href={`tel:${e.contactPhone.replace(/[^\d+]/g, "")}`} className="text-leaf-700 hover:underline">{e.contactPhone}</a>
                    <p className="text-muted">{e.user.email}</p>
                  </td>
                  <td>
                    <Link href={`/admin/hardware/${e.product.id}`} className="font-semibold text-leaf-700 hover:underline">{e.product.name}</Link>
                  </td>
                  <td className="text-sm">
                    × {e.quantity}
                    {e.requirement && <p className="text-xs text-muted">{e.requirement}</p>}
                  </td>
                  <td className="max-w-xs text-sm">
                    {e.message}
                    {e.adminNote && <p className="mt-1 rounded-lg bg-cream px-2 py-1 text-xs text-earth-700">Note: {e.adminNote}</p>}
                  </td>
                  <td><StatusBadge map={ENQUIRY_STATUS} value={e.status} /></td>
                  <td>
                    <EnquiryUpdater enquiryId={e.id} current={e.status} note={e.adminNote ?? ""} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

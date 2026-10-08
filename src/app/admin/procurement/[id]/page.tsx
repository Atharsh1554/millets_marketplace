import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BadgeIndianRupee, CalendarCheck, PackageCheck, Warehouse, Scale } from "lucide-react";
import { Card, CardHeader, DetailList, Notice, PageHeader, StatusBadge } from "@/components/ui";
import { Timeline } from "@/components/timeline";
import { ActionForm, SubmitButton, TextField } from "@/components/forms";
import {
  confirmReceiptAction,
  moveToInventoryAction,
  procurementCollectedAction,
  procurementTermsAction,
  scheduleProcurementAction,
} from "@/app/actions/operations";
import { requirePageRole } from "@/server/auth/guard";
import { procurementDetail } from "@/server/services/procurement";
import { farmerAmountPaise, formatDate, formatINR, formatKg } from "@/lib/format";
import { FARMER_PAYMENT_STATUS, MILLET_LABEL, PROCUREMENT_STATUS } from "@/lib/labels";

const FLOW = ["PROCUREMENT_PENDING", "COLLECTION_SCHEDULED", "COLLECTED", "RECEIVED", "STORED", "READY_FOR_MARKETPLACE"];
const today = () => new Date().toISOString().slice(0, 10);

export default async function ProcurementDetailPage({ params }: PageProps<"/admin/procurement/[id]">) {
  await requirePageRole(["ADMIN"]);
  const { id } = await params;
  const p = await procurementDetail(id);
  if (!p) notFound();
  const at = FLOW.indexOf(p.status);
  const st = (i: number) => (at > i ? "done" : at === i ? "current" : "upcoming") as "done" | "current" | "upcoming";
  const qty = p.actualQuantityGrams ?? p.approvedQuantityGrams;

  return (
    <div className="mx-auto max-w-6xl">
      <Link href="/admin/procurement" className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-earth-600 hover:text-earth-900">
        <ArrowLeft className="size-4" /> Procurement
      </Link>
      <PageHeader
        eyebrow={`${p.code} · ${p.submission.code}`}
        title={p.submission.title}
        subtitle={`${p.farmer.user.name} · ${MILLET_LABEL[p.milletType]} · Physical test ${p.submission.physicalTest?.code} passed ${formatDate(p.submission.physicalTest?.testDate)}`}
        action={<StatusBadge map={PROCUREMENT_STATUS} value={p.status} className="px-3 py-1 text-sm" />}
      />

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        <div className="space-y-6">
          <Card className="p-5">
            <Timeline
              steps={[
                { label: "Approved for procurement", state: st(0) === "current" ? "current" : "done" },
                { label: "Collection scheduled", state: st(1), detail: p.scheduledDate ? formatDate(p.scheduledDate) : undefined },
                { label: "Collected from farmer", state: st(2), detail: p.collectionDate ? `${formatDate(p.collectionDate)} · ${p.collectedBy}` : undefined },
                { label: "Received at warehouse", state: st(3), detail: p.receivedDate ? formatDate(p.receivedDate) : undefined },
                { label: "Stored in inventory", state: st(4), detail: p.batch?.batchNumber },
                { label: "Ready for marketplace", state: p.status === "READY_FOR_MARKETPLACE" ? "done" : "upcoming" },
              ]}
            />
          </Card>
          <Card>
            <CardHeader title="Farmer payment" icon={BadgeIndianRupee} />
            <div className="space-y-1 p-5 text-sm">
              <p className="text-muted">
                {formatKg(qty)} × {formatINR(p.agreedPricePerKgPaise)}/kg
              </p>
              <p className="text-2xl font-bold text-earth-900">{formatINR(p.farmerPayment?.totalAmountPaise ?? farmerAmountPaise(qty, p.agreedPricePerKgPaise))}</p>
              {p.farmerPayment ? (
                <div className="flex items-center gap-2">
                  <StatusBadge map={FARMER_PAYMENT_STATUS} value={p.farmerPayment.status} />
                  <Link href="/admin/payments" className="text-xs font-semibold text-leaf-700 hover:underline">Record payment →</Link>
                </div>
              ) : (
                <p className="text-xs text-muted">Payment record is created when receipt is confirmed (based on actual quantity).</p>
              )}
            </div>
          </Card>
        </div>

        <div className="min-w-0 space-y-6">
          <Card>
            <CardHeader title="Procurement details" />
            <div className="p-5">
              <DetailList
                cols={3}
                items={[
                  ["Farmer", p.farmer.user.name],
                  ["Phone", p.farmer.user.phone],
                  ["Harvest", p.submission.title],
                  ["Approved quantity", formatKg(p.approvedQuantityGrams)],
                  ["Actual collected", p.actualQuantityGrams ? formatKg(p.actualQuantityGrams) : "—"],
                  ["Agreed farmer price", `${formatINR(p.agreedPricePerKgPaise)}/kg`],
                  ["Collection date", formatDate(p.collectionDate)],
                  ["Collected by", p.collectedBy],
                  ["Storage location", p.storageLocation],
                ]}
              />
            </div>
          </Card>

          {["PROCUREMENT_PENDING", "COLLECTION_SCHEDULED"].includes(p.status) && (
            <Card>
              <CardHeader title="Procurement terms" subtitle={`Farmer offered ${formatKg(p.submission.quantityGrams)} at ${formatINR(p.submission.expectedPricePerKgPaise)}/kg`} icon={Scale} />
              <ActionForm action={procurementTermsAction} className="grid gap-4 p-5 sm:grid-cols-3 sm:items-end">
                <input type="hidden" name="procurementId" value={p.id} />
                <TextField label="Approved quantity (kg)" name="approvedQuantityKg" type="number" step="0.1" required defaultValue={p.approvedQuantityGrams / 1000} />
                <TextField label="Agreed farmer price (₹/kg)" name="agreedPricePerKg" type="number" step="0.5" required defaultValue={p.agreedPricePerKgPaise / 100} />
                <SubmitButton variant="outline">Update terms</SubmitButton>
              </ActionForm>
            </Card>
          )}

          {["PROCUREMENT_PENDING", "COLLECTION_SCHEDULED"].includes(p.status) && (
            <Card>
              <CardHeader title={p.status === "PROCUREMENT_PENDING" ? "Schedule collection" : "Reschedule collection"} icon={CalendarCheck} />
              <ActionForm action={scheduleProcurementAction} className="grid gap-4 p-5 sm:grid-cols-3 sm:items-end">
                <input type="hidden" name="procurementId" value={p.id} />
                <TextField label="Collection date" name="scheduledDate" type="date" required defaultValue={p.scheduledDate?.toISOString().slice(0, 10) ?? today()} />
                <TextField label="Collected by" name="collectedBy" required defaultValue={p.collectedBy ?? "Procurement Team"} />
                <SubmitButton>Schedule Collection</SubmitButton>
              </ActionForm>
            </Card>
          )}

          {p.status === "COLLECTION_SCHEDULED" && (
            <Card>
              <CardHeader title="Mark collected" icon={PackageCheck} />
              <ActionForm action={procurementCollectedAction} className="grid gap-4 p-5 sm:grid-cols-4 sm:items-end">
                <input type="hidden" name="procurementId" value={p.id} />
                <TextField label="Collection date" name="collectionDate" type="date" required defaultValue={today()} />
                <TextField label="Actual quantity (kg)" name="actualQuantityKg" type="number" step="0.1" required defaultValue={p.approvedQuantityGrams / 1000} />
                <TextField label="Collected by" name="collectedBy" required defaultValue={p.collectedBy ?? ""} />
                <SubmitButton>Mark Collected</SubmitButton>
              </ActionForm>
            </Card>
          )}

          {p.status === "COLLECTED" && (
            <Card>
              <CardHeader title="Confirm receipt at warehouse" subtitle="Creates the farmer payment record for the actual quantity." icon={Warehouse} />
              <ActionForm action={confirmReceiptAction} className="grid gap-4 p-5 sm:grid-cols-3 sm:items-end">
                <input type="hidden" name="procurementId" value={p.id} />
                <TextField label="Received date" name="receivedDate" type="date" required defaultValue={today()} />
                <TextField label="Storage location" name="storageLocation" required defaultValue="Warehouse A, Dindigul" />
                <SubmitButton>Confirm Receipt</SubmitButton>
              </ActionForm>
            </Card>
          )}

          {p.status === "RECEIVED" && (
            <Card>
              <CardHeader title="Move to inventory" subtitle="Creates a traceable batch number and inventory lot." icon={Warehouse} />
              <ActionForm action={moveToInventoryAction} className="grid gap-4 p-5 sm:grid-cols-3 sm:items-end">
                <input type="hidden" name="procurementId" value={p.id} />
                <TextField label="Selling price (₹/kg)" name="sellingPricePerKg" type="number" step="0.5" required defaultValue={Math.round((p.agreedPricePerKgPaise / 100) * 1.6)} />
                <TextField label="Low-stock threshold (kg)" name="lowStockThresholdKg" type="number" step="1" required defaultValue={10} />
                <SubmitButton>Move to Inventory</SubmitButton>
              </ActionForm>
            </Card>
          )}

          {p.batch?.inventory && (
            <Notice tone="success" title={`In inventory as batch ${p.batch.batchNumber}`}>
              {formatKg(p.batch.inventory.quantityAvailableGrams)} available.{" "}
              <Link href={`/admin/inventory/${p.batch.inventory.id}`} className="font-semibold underline">
                Manage inventory & listings →
              </Link>
            </Notice>
          )}
        </div>
      </div>
    </div>
  );
}

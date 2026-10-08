import { Download, FileSpreadsheet } from "lucide-react";
import { PageHeader } from "@/components/ui";
import { requirePageRole } from "@/server/auth/guard";

const REPORTS = [
  ["orders", "Customer orders", "All orders with payment status and totals"],
  ["procurement", "Procurement", "Quantities, prices and batches procured from farmers"],
  ["farmer-payments", "Farmer payments", "Amounts owed and paid to farmers with references"],
  ["inventory", "Inventory", "Stock per batch: received, available, sold"],
  ["expenses", "Expenses", "Processing, packaging, transport, fees and other costs"],
  ["profit", "Monthly profit (12 months)", "Revenue − farmer payments − expenses, per month"],
];

export default async function ReportsPage() {
  await requirePageRole(["ADMIN"]);
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title="Reports" subtitle="Download CSV exports generated from live data. Demo rows are flagged." />
      <div className="grid gap-3 sm:grid-cols-2">
        {REPORTS.map(([type, title, desc]) => (
          <a key={type} href={`/api/admin/reports/${type}`} className="card flex items-center gap-4 p-5 transition hover:shadow-[var(--shadow-lift)]">
            <span className="grid size-11 place-items-center rounded-xl bg-leaf-50 text-leaf-700">
              <FileSpreadsheet className="size-5" />
            </span>
            <span className="flex-1">
              <span className="block font-semibold text-earth-900">{title}</span>
              <span className="block text-sm text-muted">{desc}</span>
            </span>
            <Download className="size-5 text-earth-400" />
          </a>
        ))}
      </div>
    </div>
  );
}

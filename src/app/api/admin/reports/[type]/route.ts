import { NextResponse } from "next/server";
import { getCurrentUser } from "@/server/auth/guard";
import { db } from "@/server/db";
import { lastMonths, computeFinancials, periodRange } from "@/server/services/finance";

/** CSV exports for admins. Protected server-side: non-admins get 401/403. */
const csvCell = (v: unknown) => {
  const s = v === null || v === undefined ? "" : v instanceof Date ? v.toISOString() : String(v);
  // Neutralise spreadsheet formula injection and quote everything.
  const safe = /^[=+\-@]/.test(s) ? `'${s}` : s;
  return `"${safe.replaceAll('"', '""')}"`;
};
const toCsv = (header: string[], rows: unknown[][]) => [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\n");
const rupees = (p: number | null | undefined) => ((p ?? 0) / 100).toFixed(2);
const kg = (g: number | null | undefined) => ((g ?? 0) / 1000).toFixed(3);

export async function GET(_req: Request, ctx: RouteContext<"/api/admin/reports/[type]">) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { type } = await ctx.params;

  let csv: string;
  switch (type) {
    case "orders": {
      const rows = await db.order.findMany({ orderBy: { placedAt: "desc" }, include: { user: true, payment: true } });
      csv = toCsv(
        ["Order", "Placed", "Customer", "Status", "Payment method", "Payment status", "Subtotal (MRP)", "Discount", "Delivery", "Total", "Demo"],
        rows.map((o) => [o.code, o.placedAt, o.user.name, o.status, o.paymentMethod, o.payment?.status, rupees(o.subtotalPaise), rupees(o.discountPaise), rupees(o.deliveryPaise), rupees(o.totalPaise), o.isDemo]),
      );
      break;
    }
    case "procurement": {
      const rows = await db.procurement.findMany({ orderBy: { createdAt: "desc" }, include: { farmer: { include: { user: true } }, batch: true } });
      csv = toCsv(
        ["Procurement", "Farmer", "Millet", "Approved kg", "Collected kg", "Price/kg", "Collection date", "Storage", "Batch", "Status"],
        rows.map((p) => [p.code, p.farmer.user.name, p.milletType, kg(p.approvedQuantityGrams), kg(p.actualQuantityGrams), rupees(p.agreedPricePerKgPaise), p.collectionDate, p.storageLocation, p.batch?.batchNumber, p.status]),
      );
      break;
    }
    case "farmer-payments": {
      const rows = await db.farmerPayment.findMany({ orderBy: { createdAt: "desc" }, include: { farmer: { include: { user: true } }, procurement: true } });
      csv = toCsv(
        ["Procurement", "Farmer", "Quantity kg", "Price/kg", "Amount", "Status", "Payment date", "Reference"],
        rows.map((p) => [p.procurement.code, p.farmer.user.name, kg(p.quantityGrams), rupees(p.pricePerKgPaise), rupees(p.totalAmountPaise), p.status, p.paymentDate, p.reference]),
      );
      break;
    }
    case "inventory": {
      const rows = await db.inventory.findMany({ include: { batch: true } });
      csv = toCsv(
        ["Batch", "Millet", "Received kg", "Available kg", "Sold kg", "Storage", "Purchase/kg", "Selling/kg", "Status"],
        rows.map((i) => [i.batch.batchNumber, i.batch.milletType, kg(i.quantityReceivedGrams), kg(i.quantityAvailableGrams), kg(i.quantitySoldGrams), i.storageLocation, rupees(i.purchasePricePerKgPaise), rupees(i.sellingPricePerKgPaise), i.status]),
      );
      break;
    }
    case "expenses": {
      const rows = await db.expense.findMany({ orderBy: { date: "desc" }, include: { batch: true } });
      csv = toCsv(["Date", "Category", "Description", "Batch", "Amount", "Demo"], rows.map((e) => [e.date, e.category, e.description, e.batch?.batchNumber, rupees(e.amountPaise), e.isDemo]));
      break;
    }
    case "profit": {
      const out: unknown[][] = [];
      for (const p of lastMonths(12)) {
        const f = await computeFinancials(periodRange(p));
        out.push([p, rupees(f.grossRevenue), rupees(f.farmerPayments), rupees(f.expenses.PROCESSING), rupees(f.expenses.PACKAGING), rupees(f.expenses.TRANSPORTATION), rupees(f.expenses.PAYMENT_GATEWAY_FEES), rupees(f.expenses.OPERATING), rupees(f.expenses.OTHER), rupees(f.netProfit)]);
      }
      csv = toCsv(["Month", "Revenue", "Farmer payments", "Processing", "Packaging", "Transportation", "Payment fees", "Operating", "Other", "Net profit"], out);
      break;
    }
    default:
      return NextResponse.json({ error: "Unknown report" }, { status: 404 });
  }

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="millet-market-${type}-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}

import type { ExpenseCategory } from "@prisma/client";
import { db } from "@/server/db";
import { AppError } from "@/server/errors";
import { expenseSchema } from "@/server/validation";
import { assertRole, type Actor } from "./types";
import { rupeesToPaise } from "@/lib/format";

/**
 * PROFIT CALCULATION — computed from actual database rows, never hardcoded.
 *
 *   Gross Revenue        = Σ order totals whose customer payment SUCCEEDED (non-cancelled), by order date
 *   − Farmer Payments    = Σ FarmerPayment.totalAmount for harvests procured in the period (cost owed, paid or not)
 *   − Processing / Packaging / Transportation / Payment Gateway Fees / Operating / Other  (Expense rows by date)
 *   = Net Profit
 */
export type Financials = {
  grossRevenue: number;
  farmerPayments: number;
  farmerPaymentsPaid: number;
  farmerPaymentsOutstanding: number;
  expenses: Record<ExpenseCategory, number>;
  totalExpenses: number;
  netProfit: number;
  orders: number;
};

const EMPTY_EXPENSES = (): Record<ExpenseCategory, number> => ({
  PROCESSING: 0,
  PACKAGING: 0,
  TRANSPORTATION: 0,
  PAYMENT_GATEWAY_FEES: 0,
  OPERATING: 0,
  OTHER: 0,
});

export async function computeFinancials(range?: { from?: Date; to?: Date }): Promise<Financials> {
  const dateFilter = range?.from || range?.to ? { gte: range?.from, lt: range?.to } : undefined;

  const [revenue, farmer, farmerPaid, expenses] = await Promise.all([
    db.order.aggregate({
      where: { status: { not: "CANCELLED" }, payment: { status: "SUCCEEDED" }, ...(dateFilter ? { placedAt: dateFilter } : {}) },
      _sum: { totalPaise: true },
      _count: { _all: true },
    }),
    db.farmerPayment.aggregate({ where: dateFilter ? { createdAt: dateFilter } : undefined, _sum: { totalAmountPaise: true } }),
    db.farmerPayment.aggregate({ where: { status: "PAID", ...(dateFilter ? { createdAt: dateFilter } : {}) }, _sum: { totalAmountPaise: true } }),
    db.expense.groupBy({ by: ["category"], where: dateFilter ? { date: dateFilter } : undefined, _sum: { amountPaise: true } }),
  ]);

  const exp = EMPTY_EXPENSES();
  for (const e of expenses) exp[e.category] = e._sum.amountPaise ?? 0;
  const totalExpenses = Object.values(exp).reduce((a, b) => a + b, 0);
  const grossRevenue = revenue._sum.totalPaise ?? 0;
  const farmerPayments = farmer._sum.totalAmountPaise ?? 0;
  const paid = farmerPaid._sum.totalAmountPaise ?? 0;

  return {
    grossRevenue,
    farmerPayments,
    farmerPaymentsPaid: paid,
    farmerPaymentsOutstanding: farmerPayments - paid,
    expenses: exp,
    totalExpenses,
    netProfit: grossRevenue - farmerPayments - totalExpenses,
    orders: revenue._count._all,
  };
}

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthBounds(period: string) {
  const [y, m] = period.split("-").map(Number);
  return { from: new Date(y, m - 1, 1), to: new Date(y, m, 1) };
}

export function lastMonths(n: number) {
  const out: string[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) out.push(monthKey(new Date(now.getFullYear(), now.getMonth() - i, 1)));
  return out;
}

/** Monthly series for the financial dashboard charts. */
export async function monthlySeries(months = 12) {
  const periods = lastMonths(months);
  const from = monthBounds(periods[0]).from;

  const [orders, items, farmerPays, expenses, procurements] = await Promise.all([
    db.order.findMany({ where: { placedAt: { gte: from }, status: { not: "CANCELLED" }, payment: { status: "SUCCEEDED" } }, select: { placedAt: true, totalPaise: true } }),
    db.orderItem.findMany({
      where: { order: { placedAt: { gte: from }, status: { not: "CANCELLED" } } },
      select: { quantity: true, lineTotalPaise: true, order: { select: { placedAt: true } }, product: { select: { category: true, milletType: true } } },
    }),
    db.farmerPayment.findMany({ where: { createdAt: { gte: from } }, select: { createdAt: true, totalAmountPaise: true } }),
    db.expense.findMany({ where: { date: { gte: from } }, select: { date: true, amountPaise: true } }),
    db.procurement.findMany({
      where: { receivedDate: { gte: from } },
      select: { receivedDate: true, actualQuantityGrams: true, milletType: true, farmer: { select: { user: { select: { name: true } } } } },
    }),
  ]);

  const rows = periods.map((p) => ({ period: p, revenue: 0, farmerPayments: 0, expenses: 0, profit: 0, unitsSold: 0, procuredKg: 0 }));
  const idx = new Map(periods.map((p, i) => [p, i]));
  const at = (d: Date | null) => (d ? idx.get(monthKey(d)) : undefined);

  for (const o of orders) { const i = at(o.placedAt); if (i !== undefined) rows[i].revenue += o.totalPaise; }
  for (const f of farmerPays) { const i = at(f.createdAt); if (i !== undefined) rows[i].farmerPayments += f.totalAmountPaise; }
  for (const e of expenses) { const i = at(e.date); if (i !== undefined) rows[i].expenses += e.amountPaise; }
  for (const it of items) { const i = at(it.order.placedAt); if (i !== undefined) rows[i].unitsSold += it.quantity; }
  for (const p of procurements) { const i = at(p.receivedDate); if (i !== undefined) rows[i].procuredKg += (p.actualQuantityGrams ?? 0) / 1000; }
  for (const r of rows) r.profit = r.revenue - r.farmerPayments - r.expenses;

  const category = new Map<string, { revenue: number; units: number }>();
  for (const it of items) {
    const c = category.get(it.product.milletType) ?? { revenue: 0, units: 0 };
    c.revenue += it.lineTotalPaise;
    c.units += it.quantity;
    category.set(it.product.milletType, c);
  }
  const farmers = new Map<string, number>();
  for (const p of procurements) farmers.set(p.farmer.user.name, (farmers.get(p.farmer.user.name) ?? 0) + (p.actualQuantityGrams ?? 0) / 1000);

  return {
    monthly: rows,
    milletPerformance: [...category.entries()].map(([milletType, v]) => ({ milletType, ...v })).sort((a, b) => b.revenue - a.revenue),
    farmerProcurement: [...farmers.entries()].map(([farmer, kg]) => ({ farmer, kg })).sort((a, b) => b.kg - a.kg).slice(0, 8),
  };
}

export async function addExpense(actor: Actor, raw: unknown) {
  assertRole(actor, ["ADMIN"]);
  const input = expenseSchema.parse(raw);
  if (input.batchId) {
    const batch = await db.batch.findUnique({ where: { batchNumber: input.batchId } });
    if (!batch) throw new AppError("No batch with that number.");
    input.batchId = batch.id;
  }
  await db.expense.create({
    data: { category: input.category, amountPaise: rupeesToPaise(input.amount), description: input.description, date: input.date, batchId: input.batchId ?? null, createdById: actor.id },
  });
}

/** Saves (or refreshes) the profit snapshot for a month from live data. */
export async function generateProfitRecord(actor: Actor, period: string) {
  assertRole(actor, ["ADMIN"]);
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(period)) throw new AppError("Period must be YYYY-MM.");
  const f = await computeFinancials(monthBounds(period));
  const data = {
    grossRevenuePaise: f.grossRevenue,
    farmerPaymentsPaise: f.farmerPayments,
    processingPaise: f.expenses.PROCESSING,
    packagingPaise: f.expenses.PACKAGING,
    transportationPaise: f.expenses.TRANSPORTATION,
    paymentFeesPaise: f.expenses.PAYMENT_GATEWAY_FEES,
    operatingPaise: f.expenses.OPERATING,
    otherPaise: f.expenses.OTHER,
    netProfitPaise: f.netProfit,
    generatedAt: new Date(),
  };
  await db.profitRecord.upsert({ where: { period }, create: { period, ...data }, update: data });
}

export function periodRange(period: string) {
  return monthBounds(period);
}

// ───────────── Dashboards ─────────────

export async function adminOverviewStats() {
  const [farmers, byStatus, testsByStatus, procured, inventory, orders, fin] = await Promise.all([
    db.farmer.count(),
    db.harvestSubmission.groupBy({ by: ["status"], _count: { _all: true } }),
    db.physicalTest.groupBy({ by: ["status"], _count: { _all: true } }),
    db.procurement.count({ where: { status: { in: ["RECEIVED", "STORED", "READY_FOR_MARKETPLACE"] } } }),
    db.inventory.aggregate({ _sum: { quantityAvailableGrams: true } }),
    db.order.count({ where: { status: { not: "CANCELLED" } } }),
    computeFinancials(),
  ]);
  const s = Object.fromEntries(byStatus.map((r) => [r.status, r._count._all])) as Record<string, number>;
  const t = Object.fromEntries(testsByStatus.map((r) => [r.status, r._count._all])) as Record<string, number>;
  const approvedReviews = await db.adminReview.count({ where: { decision: "APPROVED" } });
  return {
    farmers,
    pendingSubmissions: s.ADMIN_REVIEW_PENDING ?? 0,
    adminApproved: approvedReviews,
    adminRejected: s.ADMIN_REJECTED ?? 0,
    testsPending: (t.PENDING ?? 0) + (t.COLLECTION_SCHEDULED ?? 0) + (t.SAMPLE_COLLECTED ?? 0) + (t.TESTING ?? 0) + (t.ADDITIONAL_TESTING_REQUIRED ?? 0),
    testsPassed: t.PASSED ?? 0,
    testsFailed: t.FAILED ?? 0,
    procured,
    inventoryGrams: inventory._sum.quantityAvailableGrams ?? 0,
    orders,
    revenue: fin.grossRevenue,
    farmerPayments: fin.farmerPayments,
    netProfit: fin.netProfit,
  };
}

export async function farmerStats(farmerId: string) {
  const [subs, reviews, passed, procurements, payments] = await Promise.all([
    db.harvestSubmission.count({ where: { farmerId, status: { not: "DRAFT" } } }),
    db.adminReview.count({ where: { decision: "APPROVED", submission: { farmerId } } }),
    db.physicalTest.count({ where: { status: "PASSED", submission: { farmerId } } }),
    db.procurement.aggregate({ where: { farmerId, status: { in: ["RECEIVED", "STORED", "READY_FOR_MARKETPLACE"] } }, _count: { _all: true }, _sum: { actualQuantityGrams: true } }),
    db.farmerPayment.groupBy({ by: ["status"], where: { farmerId }, _sum: { totalAmountPaise: true } }),
  ]);
  const pay = Object.fromEntries(payments.map((p) => [p.status, p._sum.totalAmountPaise ?? 0])) as Record<string, number>;
  return {
    submitted: subs,
    adminApproved: reviews,
    testsPassed: passed,
    procured: procurements._count._all,
    procuredGrams: procurements._sum.actualQuantityGrams ?? 0,
    totalEarnings: Object.values(pay).reduce((a, b) => a + b, 0),
    pendingPayments: (pay.PENDING ?? 0) + (pay.PROCESSING ?? 0) + (pay.FAILED ?? 0),
    completedPayments: pay.PAID ?? 0,
  };
}

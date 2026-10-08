# Broker Hub — Payment Details & Settlement: Implementation Report

> Zero TypeScript errors ✅ · Dev server running ✅

---

## What Was Built

Broker Hub is a **zero-commission marketplace** (₹0 platform fee).  
Customer payments flow into **your Razorpay dashboard**.  
Broker payouts are **manual admin settlements** until Razorpay Route is enabled.

---

## Files Changed / Created

| File | Change |
|------|--------|
| [`supabase_broker_payment_details_migration.sql`](file:///c:/Users/jithu/OneDrive/Desktop/Brokerhub/supabase_broker_payment_details_migration.sql) | New table `broker_payment_details` + 4 new columns on `orders` |
| [`src/types/index.ts`](file:///c:/Users/jithu/OneDrive/Desktop/Brokerhub/src/types/index.ts) | Added settlement / commission fields to `Order` interface |
| [`src/lib/api/orders.ts`](file:///c:/Users/jithu/OneDrive/Desktop/Brokerhub/src/lib/api/orders.ts) | `parseOrderRow` now maps all new fields; default `settlement_status` = `"Pending Admin Settlement"` |
| [`src/lib/api/paymentDetails.ts`](file:///c:/Users/jithu/OneDrive/Desktop/Brokerhub/src/lib/api/paymentDetails.ts) | **New** — save/fetch broker UPI or bank details with masking utils |
| [`src/components/broker/BrokerPaymentSetup.tsx`](file:///c:/Users/jithu/OneDrive/Desktop/Brokerhub/src/components/broker/BrokerPaymentSetup.tsx) | **Rebuilt** — UPI / Bank form with confirm-field, masked view, zero-commission notice |
| [`src/pages/broker/BrokerDashboard.tsx`](file:///c:/Users/jithu/OneDrive/Desktop/Brokerhub/src/pages/broker/BrokerDashboard.tsx) | Order detail modal shows settlement breakdown (Payment received / Commission ₹0 / Broker Amount / Status) |
| [`src/pages/broker/OrderTracking.tsx`](file:///c:/Users/jithu/OneDrive/Desktop/Brokerhub/src/pages/broker/OrderTracking.tsx) | Settlement status badge uses `"Pending Admin Settlement"` as fallback |
| [`src/pages/admin/AdminPayments.tsx`](file:///c:/Users/jithu/OneDrive/Desktop/Brokerhub/src/pages/admin/AdminPayments.tsx) | **Rebuilt** — two tabs: *Broker Settlements* (manual payout manager + reveal masked details) and *Razorpay Gateway Logs* |
| [`src/context/AppContext.tsx`](file:///c:/Users/jithu/OneDrive/Desktop/Brokerhub/src/context/AppContext.tsx) | Realtime subscription now shows `💰 Payment received: ₹X — Pending Admin Settlement` toast for brokers |
| [`supabase/functions/create-razorpay-order/index.ts`](file:///c:/Users/jithu/OneDrive/Desktop/Brokerhub/supabase/functions/create-razorpay-order/index.ts) | Hardcoded `platform_commission = 0`, `settlement_status = "Pending Admin Settlement"` |
| [`supabase/functions/verify-razorpay-payment/index.ts`](file:///c:/Users/jithu/OneDrive/Desktop/Brokerhub/supabase/functions/verify-razorpay-payment/index.ts) | Sets `settlement_status = "Pending Admin Settlement"` on payment success |
| [`supabase/functions/razorpay-webhook/index.ts`](file:///c:/Users/jithu/OneDrive/Desktop/Brokerhub/supabase/functions/razorpay-webhook/index.ts) | Sets `settlement_status = "Pending Admin Settlement"` on webhook `payment.captured` |

---

## ⚠️ Required: Run Migration in Supabase

> [!IMPORTANT]
> You **must** run the SQL migration once before the new fields work.

1. Open your **Supabase Dashboard → SQL Editor**
2. Open [`supabase_broker_payment_details_migration.sql`](file:///c:/Users/jithu/OneDrive/Desktop/Brokerhub/supabase_broker_payment_details_migration.sql)
3. Copy the entire content and **Run** it

This creates the `broker_payment_details` table and adds the four columns to `orders`:
- `platform_commission` (numeric, default 0)
- `broker_amount` (numeric)
- `settlement_status` (text, default `'Pending Admin Settlement'`)
- `settlement_date` (timestamptz, nullable)

---

## Full Payment Flow

```
Customer pays → Razorpay (your account)
      ↓
verify-razorpay-payment / razorpay-webhook
      ↓
orders.settlement_status = "Pending Admin Settlement"
orders.platform_commission = 0
orders.broker_amount = full order amount
      ↓
Broker Dashboard: sees "💰 Payment received" toast + settlement breakdown
      ↓
Admin Dashboard → Payments → Broker Settlements tab
      ↓
Admin manually transfers to broker's saved UPI / bank account
      ↓
Admin clicks "Mark as Settled" → settlement_status = "Settled", settlement_date = now()
```

---

## Broker Payment Setup (UPI / Bank)

Brokers open **Dashboard → Payment Details** and can:

| Feature | Detail |
|---------|--------|
| Add UPI ID | Validated + confirmation field |
| Add Bank Account | Account number (confirmed), IFSC, account holder name, bank name |
| View saved method | Masked: `broker***@upi` / `••••1234` |
| Reveal full details | Toggle button (show/hide) |
| Update details | Edit and save at any time |

Data is stored in `broker_payment_details` (separate from profile).

---

## Admin Settlement Tab

**Admin Dashboard → Payments → Broker Settlements**

| Column | What it shows |
|--------|---------------|
| Order ID | Shortened UUID |
| Broker | Name |
| Customer Amount | What customer paid |
| Commission | Always ₹0 |
| Broker Amount | Same as customer amount |
| Payment Method | UPI ID or Account (masked) |
| Status | Pending Admin Settlement / Settled |
| Actions | "Mark as Settled" button |

Sensitive details can be revealed on demand via toggle.

---

## Security Rules Applied

- ✅ Full bank account numbers **never** shown in UI by default — masked
- ✅ Razorpay secret key never touches the frontend
- ✅ No fake automatic transfers
- ✅ Edge functions enforce `platform_commission = 0` server-side

---

## Future: Enabling Razorpay Route Payouts

When you're ready to automate broker payouts:

1. Apply for **Razorpay Route** in your Razorpay dashboard
2. In `create-razorpay-order/index.ts`, add a Transfer leg using the broker's `linked_account_id`
3. In `verify-razorpay-payment/index.ts`, call Razorpay's `/transfers` API after payment capture
4. Update `settlement_status` to `"Auto-Settled"` instead of `"Pending Admin Settlement"`
5. The `broker_payment_details` table already has a `linked_account_id` column reserved for this

No structural changes are needed to the database or UI — it's plug-and-play.

# Millet Market

A farmer-harvest **procurement** marketplace for millet. Farmers submit harvests; our admin team reviews each submission online; our quality team **physically tests** a collected sample in person; approved harvests are **procured** into our inventory; customers buy the resulting products; farmers are paid quantity × agreed price.

```
FARMER → ONLINE ADMIN REVIEW → DIRECT PHYSICAL TESTING → PROCUREMENT → INVENTORY → MARKETPLACE → CUSTOMER
                                                                          └→ FARMER PAYMENT (tracked separately from revenue)
```

There is **no AI / automated verification anywhere**. Farmer photos are reference material for people. Physical checks are visual/hands-on inspections, never described as lab or government certification.

---

## Quick start

Requirements: **Node.js 20+**. PostgreSQL is optional for local development (an embedded PGlite server is included).

```bash
npm install                 # also runs `prisma generate`
cp .env.example .env        # then set AUTH_SECRET

# Terminal 1 — embedded Postgres-compatible dev DB on :5433 (data in ./.pglite)
npm run db:local

# Terminal 2
npm run db:push             # create tables
npm run db:seed             # base configuration only (testing checklist); never deletes data
npm run dev                 # http://localhost:3000

```

**Using a real PostgreSQL instead:** set `DATABASE_URL` to your database (no `pgbouncer=true` needed), then `npm run db:push && npm run db:seed`. For production, switch to migrations: `npx prisma migrate dev --name init` locally and `npx prisma migrate deploy` in CI/CD.

| Script | What it does |
|---|---|
| `npm run dev` / `build` / `start` | Next.js dev server / production build / production server |
| `npm run db:local` | PGlite dev server on 127.0.0.1:5433 (dev only, not for production) |
| `npm run db:push` | Sync the Prisma schema to the database |
| `npm run db:seed` | Ensure the physical-testing checklist exists (no demo data, no deletes) |
| `npm run db:reset` | **Erases all data**, recreates the schema, then runs the base seed |
| `npm run typecheck` / `lint` | TypeScript / ESLint |

### Accounts

Demo/sample data has been removed. Remaining accounts: `admin@milletmarket.demo` (the initial admin — change its password in **Admin → Settings**), plus `farmer@milletmarket.demo` and `customer@milletmarket.demo`, which own records created during manual testing. Create Quality Team and further admin users at **Admin → Quality Team**; customers and farmers sign up at `/register`.

---|---|---|
| Customer | `customer@milletmarket.demo` | Shop → product → *Quality Verification* & *Traceability* → checkout (mock payment) → track order → review |
| Farmer | `farmer@milletmarket.demo` | Dashboard → **Premium Ragi 100 kg @ ₹150/kg** (pending review) → Submit Harvest from your phone |
| Quality Team | `quality@milletmarket.demo` | Physical Testing → schedule collection → mark collected → start testing → checklist → Pass/Fail |
| Admin | `admin@milletmarket.demo` | Harvest Submissions → approve Premium Ragi → Procurement → Inventory → publish listing → Orders → Farmer Payments → Revenue & Profit |

The seed creates harvests at every stage (draft, pending review, info requested, rejected, awaiting collection, in testing, failed test, procurement pending, on sale, sold), 10 complete farmer→shelf chains, 16 products, about 650 orders over 12 months, expenses and reviews. Every demo row has `isDemo = true` or a "(Demo)" / `.demo` marker, and the UI shows a **Demo** badge and a demo banner.

---

## Tech stack

Next.js 16 (App Router, Server Components, Server Actions) · React 19 · TypeScript · Tailwind CSS 4 · Lucide · Framer Motion · Recharts · PostgreSQL + Prisma 6 · Zod 4 · jose (JWT) + bcryptjs.

## Project structure

```
prisma/
  schema.prisma            # full data model (money = integer paise, weight = integer grams)
  seed.ts                  # base configuration (testing checklist)
scripts/
  generate-product-art.mjs # generates the SVG product illustrations in public/products
src/
  app/
    (store)/               # public site: home, shop, product, how-it-works, traceability, sell, login, register
    customer/              # CUSTOMER dashboard: browse/search/product, wishlist, cart, checkout, orders,
                           #   tracking, payments, reviews, notifications, profile, settings
    farmer/                # FARMER dashboard: farm profile, products, add product (submit harvest), inventory,
                           #   batches, harvests, orders, order processing, sales, earnings, notifications…
    quality/               # QUALITY_TEAM dashboard: pending inspections, verification, batch inspection,
                           #   parameters, inspection details, approve/reject/reinspect, reports, history…
    admin/                 # ADMIN dashboard: customers, farmers, quality team, farmer verification, products,
                           #   categories, batches, orders, submissions, quality management, procurement,
                           #   inventory, payments, complaints, reports, analytics, audit logs, settings
    api/admin/reports/[type]/route.ts   # CSV exports (admin only)
    actions/               # server actions ("use server"): thin auth + delegate to services
  server/
    auth/                  # session (signed httpOnly JWT cookie), password hashing, role guards
    services/              # ALL business rules: harvest, testing, procurement, inventory,
                           #   catalog, shop (cart/orders/reviews), finance, notifications, accounts
    storage/               # StorageProvider: local (dev) | cloudinary/s3 stubs + upload validation
    payments/              # PaymentProvider: mock (dev) | razorpay stub
    validation.ts          # Zod schemas for every input
    db.ts, errors.ts, run-action.ts
  components/              # UI kit, timeline/stepper, forms, charts, shop, farmer, dashboard shell
  lib/                     # client-safe formatting, enum labels, harvest timeline builder
```

**Layering:** pages and server actions never contain business rules. They authenticate, then call `src/server/services/*`, which take an explicit `Actor` and enforce roles and state transitions themselves. The demo script and the UI therefore run exactly the same rules.

## Database schema (PostgreSQL + Prisma)

Models: `User`, `Farmer`, `HarvestSubmission`, `HarvestImage`, `HarvestStatusEvent` (timeline audit), `AdminReview`, `TestChecklistItem` (configurable checklist), `PhysicalTest`, `SampleCollection`, `PhysicalTestResult`, `TestAttachment`, `Procurement`, `Batch`, `Inventory`, `Product`, `ProductImage`, `FarmerPayment`, `Expense`, `ProfitRecord`, `Cart`, `CartItem`, `Order`, `OrderItem`, `Payment`, `Review`, `Wishlist`, `WishlistItem`, `Address`, `Notification`.

Chain: `Farmer → HarvestSubmission → AdminReview → PhysicalTest (+SampleCollection, results, attachments) → Procurement → Batch → Inventory → Product → OrderItem`, and `Procurement → FarmerPayment`.

Money is stored as **integer paise** and quantities as **integer grams**, so inventory and payouts never drift (100 kg × ₹150/kg = exactly ₹15,000).

## The workflow in detail

### 1. Farmer harvest submission (`/farmer/submit`)
Mobile-first form with every field from the spec, plus photo slots (harvest, grain, farm, package) and one optional video. Files are validated client-side for type and size, then server-side by size, MIME type **and magic bytes**. Farmers can save a draft. Submitting sets `SUBMITTED → ADMIN_REVIEW_PENDING` and notifies the farmer and the admins.

### 2. Online admin review (`/admin/submissions/[id]`)
This checks the submission's details only and is **not** a quality test. Actions:
- **Accept for Physical Testing:** `ADMIN_APPROVED → PHYSICAL_TESTING_PENDING`, creates a `PhysicalTest`, notifies the quality team.
- **Reject:** `ADMIN_REJECTED`; a reason is required and shown to the farmer.
- **Request More Information:** the farmer can edit and resubmit.

Admin notes stay internal; comments go to the farmer.

### 3. Direct physical testing (`/quality`, `/quality/tests/[id]`)
Schedule collection → mark sample collected (quantity, date, collector) → start testing (received date, location, sample batch number) → checklist (Pass / Fail / Requires Review, plus notes per item) → upload test/sample photos and PDF reports → result:
- **Passed:** `PHYSICAL_TEST_PASSED → PROCUREMENT_PENDING` ("Harvest approved for procurement."). Allowed only if every active checklist item is recorded as Pass.
- **Failed:** `PHYSICAL_TEST_FAILED`; the reason is shown to the farmer.
- **Additional testing required:** loops back to testing.

The checklist is configurable at `/admin/checklist`. A future lab-testing feature should be a separate optional module.

### 4. Procurement (`/admin/procurement/[id]`)
A procurement row exists **only** for passed harvests. Steps: adjust terms (approved kg, agreed ₹/kg) → schedule collection → mark collected (actual kg) → **confirm receipt** (creates the `FarmerPayment` = actual kg × agreed price; harvest becomes `PROCURED`) → **move to inventory** (creates a traceable batch `MM-YYYY-NNN` and an inventory lot).

### 5. Inventory and marketplace
Admins create listings from a lot (pack size, price, MRP, category, image), which start as `MARKETPLACE_APPROVED`. **Publish** re-checks the marketplace gate. The customer-facing gate (`PUBLIC_PRODUCT_WHERE` in `services/inventory.ts`) is applied to *every* storefront query, cart add and checkout: admin review approved **and** physical test passed **and** procurement stored. Pending, rejected, failed and unprocured harvests can never appear.

Each order decrements `quantityAvailableGrams` atomically (`WHERE available >= needed`), so stock never goes negative. Statuses recompute automatically: `IN_STOCK / LOW_STOCK / OUT_OF_STOCK`; products flip to `SOLD_OUT`; the harvest becomes `SOLD_OUT` when its lot empties. Cancellations restore stock.

### 6. Customer journey
Home → Shop (search across name, millet type and category; filters for category, millet, price, rating and availability; sorts by price, rating, popular and newest) → product page (images, price, stock, description, source farmer, **Quality Verification**, **Product Traceability**, verified-purchase reviews) → cart → 5-step checkout (Address, Delivery, Payment, Review, Confirmation) → order tracking (Placed → Confirmed → Packed → Shipped → Out for Delivery → Delivered). Our organization fulfils every order; farmers never ship to customers.

### 7. Farmer payments (`/admin/payments`, `/farmer/payments`)
Statuses `PENDING → PROCESSING → PAID | FAILED` (retry allowed). Marking a payment `PAID` requires a UTR/transaction reference. Farmers see only their own amounts, never business costs or margins.

### 8. Profit calculation (`/admin/finance`)
```
Gross Revenue        Σ order totals with a SUCCEEDED customer payment (COD counts on delivery)
− Farmer Payment     Σ FarmerPayment for harvests received in the period (owed, paid or not)
− Processing − Packaging − Transportation − Payment Gateway Fees − Operating − Other   (Expense rows)
= Net Profit
```
All figures are computed from database rows. Gateway fees are recorded automatically as expenses when a payment succeeds. Per-month snapshots can be saved to `ProfitRecord`. Charts: monthly revenue vs costs, monthly profit, products sold, millet performance, procurement volume, and farmer procurement. CSV exports are under **Reports**.

### 9. Notifications
Every farmer, admin, quality-team and customer message from the spec is created at its workflow step and shown under the bell icon.

## Role-based dashboards

| Role | Dashboard | Can open |
|---|---|---|
| CUSTOMER | `/customer/*` | only `/customer/*` (+ public pages) |
| FARMER | `/farmer/*` | only `/farmer/*` |
| QUALITY_TEAM | `/quality/*` | only `/quality/*` |
| ADMIN | `/admin/*` | only `/admin/*` (quality management lives at `/admin/quality`) |

Authorization is enforced in four layers: **`src/proxy.ts`** (route prefix → role, from the signed session; wrong role → `/unauthorized`, server-action/API calls → 403), **dashboard layouts** (`requirePageRole`, role re-read from the database), **server actions** (`requireActor`), and **services** (`assertRole` + ownership checks). Old URLs (`/cart`, `/checkout`, `/orders`, `/wishlist`, `/notifications`, `/admin/users`) redirect to the new role routes.

Farmer menu items follow the procurement model: *Add Product* submits a harvest; *Products / Inventory / Batches* show what our team made from the farmer's procured harvests; *Orders / Order Processing / Sales* are read-only (fulfilment is done by our team; customer identities, selling prices and margins are never shown to farmers).

Every successful state-changing action is written to `AuditLog` (actor, role, action, entity, safe details — never passwords or free text). Customers can raise complaints on their orders (`Complaint`); admins resolve them. New farmer accounts start as `PENDING` verification (`Farmer.verificationStatus`) and are verified at `/admin/farmer-verification`.

## Authentication and roles

- Passwords are hashed with bcrypt (cost 12). Sessions are HS256 JWTs in an `httpOnly`, `SameSite=Lax` cookie (`Secure` in production) with a 7-day expiry.
- On every request the role is **loaded from the database**, so the cookie's role claim is never trusted on its own.
- Public sign-up only creates `CUSTOMER` or `FARMER` accounts. `QUALITY_TEAM` and `ADMIN` accounts are created by an admin at `/admin/users`.
- Enforcement happens at three layers: route layouts (`requirePageRole`), server actions (`requireActor`), and each service function (`assertRole` plus ownership checks, e.g. customers can only see their own orders and farmers only their own harvests).

| Role | Can |
|---|---|
| CUSTOMER | browse, cart, checkout, view own orders, cancel before confirmation, review delivered products, wishlist |
| FARMER | submit/edit harvests (drafts and info requests), track status, view own procurement and payments |
| QUALITY_TEAM | view approved harvests, schedule and record sample collection, upload test files, record checklist and results |
| ADMIN | everything above, plus reviews, farmers, procurement, inventory, listings, orders, farmer payments, expenses, analytics, staff |

## Security notes

Zod validation on every server action and route; generic error messages to clients (details are logged on the server); Next.js built-in CSRF origin checks for server actions; upload validation by size, MIME type and magic bytes with randomized filenames; same-origin-only `?next=` redirects; prices always recomputed server-side at checkout; CSV formula-injection escaping; security headers set in `next.config.ts`; no secrets in client code (only `NEXT_PUBLIC_DEMO_MODE` is public).

**Before going to production:** add rate limiting on login and registration, email/phone verification, a password reset flow, a real storage driver (local uploads are dev-only), a real payment gateway with signature-verified webhooks, Prisma migrations, and remove the demo accounts.

## Mock and development-only pieces

| Piece | Development implementation | Production integration point |
|---|---|---|
| Payments | `MockPaymentProvider`: approves UPI/card instantly, refs prefixed `MOCK-`, **no card/UPI details collected** | `RazorpayProvider` in `src/server/payments/index.ts` (Orders API → Checkout → webhook signature verification) |
| File storage | `local`: writes to `public/uploads` | `cloudinary` / `s3` drivers in `src/server/storage/index.ts` |
| Database | PGlite dev server (`npm run db:local`) | Any managed PostgreSQL |
| Shipping | Admin advances order status manually | Courier API (Shiprocket, Delhivery) webhooks updating `Order` timestamps |
| Notifications | In-app only | SMS/WhatsApp for farmers (MSG91, Twilio, Gupshup), email for customers |

## Future integration recommendations

1. **Razorpay:** create orders server-side, verify `razorpay_signature`, and mark payments `SUCCEEDED` only from webhooks. Use RazorpayX Payouts (with UTR capture) for farmer payments.
2. **Cloudinary/S3** with signed direct-from-browser uploads and server-side image resizing, which helps farmers on slow mobile networks.
3. **SMS/WhatsApp notifications** in local languages for farmers, plus an Indic-language UI (Tamil, Kannada, Hindi, Telugu, Marathi).
4. **Optional laboratory-testing module:** a separate model linked to `Batch`, with accredited lab reports. Only then show lab-specific claims on product pages.
5. **Field app / PWA** for the quality team with offline capture of checklist results and photos.
6. **Courier integration** for automatic shipping status, plus GST invoicing.
7. **Batch-level cost allocation** (expenses already link to `batchId`) to report gross margin per batch or farmer as well as the cash-basis profit.

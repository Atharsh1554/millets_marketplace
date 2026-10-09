import { z } from "zod";
import { msg } from "@/i18n/translate";

/** Field name as an encoded translation key (fields.<key>), used inside validation messages. */
const f = (key: string) => msg(`fields.${key}`);

const MILLETS = [
  "FINGER_MILLET",
  "PEARL_MILLET",
  "FOXTAIL_MILLET",
  "LITTLE_MILLET",
  "KODO_MILLET",
  "BARNYARD_MILLET",
  "PROSO_MILLET",
  "BROWNTOP_MILLET",
  "SORGHUM",
  "MIXED",
] as const;

const text = (min: number, max: number, field: string) =>
  z.string().trim().min(min, msg("validation.required", { field: f(field) })).max(max, msg("validation.tooLong", { field: f(field), max }));
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, msg("validation.tooLongGeneric", { max }))
    .optional()
    .transform((v) => (v ? v : undefined));

const phone = z
  .string()
  .trim()
  .regex(/^[+]?[0-9 -]{10,15}$/, msg("validation.phone"));

const positiveNumber = (field: string, max: number) =>
  z.coerce
    .number({ error: msg("validation.number", { field: f(field) }) })
    .positive(msg("validation.positive", { field: f(field) }))
    .max(max, msg("validation.tooLarge", { field: f(field) }));

const date = (field: string) => z.coerce.date({ error: msg("validation.date", { field: f(field) }) });

// ───────────── Auth ─────────────

export const registerSchema = z
  .object({
    name: text(2, 80, "name"),
    email: z.string().trim().toLowerCase().pipe(z.email(msg("validation.email"))),
    phone: phone,
    password: z
      .string()
      .min(8, msg("validation.passwordMin"))
      .max(128)
      .regex(/[A-Za-z]/, msg("validation.passwordLetter"))
      .regex(/[0-9]/, msg("validation.passwordNumber")),
    role: z.enum(["CUSTOMER", "FARMER"]), // QUALITY_TEAM / ADMIN accounts are created by an admin only
    village: optionalText(80),
    district: optionalText(80),
    state: optionalText(80),
  })
  .superRefine((v, ctx) => {
    if (v.role === "FARMER") {
      for (const k of ["village", "district", "state"] as const) {
        if (!v[k]) ctx.addIssue({ code: "custom", path: [k], message: msg("validation.requiredForFarmers") });
      }
    }
  });

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email(msg("validation.email"))),
  password: z.string().min(1, msg("validation.passwordRequired")).max(128),
});

// ───────────── Harvest submission ─────────────

export const harvestSchema = z.object({
  title: text(3, 80, "harvestName"),
  contactName: text(2, 80, "farmerName"),
  contactPhone: phone,
  contactEmail: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : undefined))
    .pipe(z.email(msg("validation.email")).optional()),
  village: text(2, 80, "village"),
  district: text(2, 80, "district"),
  state: text(2, 80, "state"),
  farmLocation: optionalText(200),
  milletType: z.enum(MILLETS, { error: msg("validation.milletType") }),
  harvestDate: date("harvestDate").refine((d) => d.getTime() <= Date.now() + 86400000, msg("validation.futureDate")),
  quantityKg: positiveNumber("availableQuantity", 1_000_000),
  expectedPricePerKg: positiveNumber("expectedPrice", 100_000),
  cultivationMethod: text(2, 120, "cultivationMethod"),
  processingMethod: text(2, 120, "processingMethod"),
  storageMethod: text(2, 120, "storageMethod"),
  description: text(10, 2000, "harvestDescription"),
  notes: optionalText(2000),
});
export type HarvestInput = z.infer<typeof harvestSchema>;

export const adminReviewSchema = z
  .object({
    submissionId: z.string().min(1),
    decision: z.enum(["APPROVED", "REJECTED", "MORE_INFO_REQUESTED"]),
    adminNotes: optionalText(2000),
    comments: optionalText(2000),
    requestedChanges: optionalText(2000),
  })
  .superRefine((v, ctx) => {
    if (v.decision === "REJECTED" && !v.comments) {
      ctx.addIssue({ code: "custom", path: ["comments"], message: msg("validation.rejectionReason") });
    }
    if (v.decision === "MORE_INFO_REQUESTED" && !v.requestedChanges) {
      ctx.addIssue({ code: "custom", path: ["requestedChanges"], message: msg("validation.infoNeeded") });
    }
  });

// ───────────── Physical testing ─────────────

export const scheduleCollectionSchema = z.object({
  testId: z.string().min(1),
  scheduledDate: date("scheduledDate"),
  collectionLocation: text(2, 200, "collectionLocation"),
  notes: optionalText(1000),
});

export const sampleCollectedSchema = z.object({
  testId: z.string().min(1),
  collectionDate: date("collectionDate"),
  sampleQuantityKg: positiveNumber("sampleQuantity", 10_000),
  notes: optionalText(1000),
});

export const startTestingSchema = z.object({
  testId: z.string().min(1),
  receivedDate: date("receivedDate"),
  testingLocation: text(2, 200, "testingLocation"),
  batchNumber: text(2, 40, "sampleBatchNumber"),
});

export const checklistSchema = z.object({
  testId: z.string().min(1),
  testingNotes: optionalText(4000),
  results: z
    .array(
      z.object({
        parameter: text(1, 80, "parameter"),
        outcome: z.enum(["PASS", "FAIL", "REQUIRES_REVIEW"]),
        notes: optionalText(1000),
      }),
    )
    .max(50),
});

export const testResultSchema = z
  .object({
    testId: z.string().min(1),
    result: z.enum(["PASSED", "FAILED", "ADDITIONAL_TESTING_REQUIRED"]),
    reason: optionalText(2000),
  })
  .superRefine((v, ctx) => {
    if (v.result !== "PASSED" && !v.reason) {
      ctx.addIssue({ code: "custom", path: ["reason"], message: msg("validation.resultReason") });
    }
  });

export const checklistItemSchema = z.object({
  name: text(2, 80, "name"),
  description: optionalText(300),
  sortOrder: z.coerce.number().int().min(0).max(999).default(0),
});

// ───────────── Procurement ─────────────

export const procurementTermsSchema = z.object({
  procurementId: z.string().min(1),
  approvedQuantityKg: positiveNumber("approvedQuantity", 1_000_000),
  agreedPricePerKg: positiveNumber("agreedFarmerPrice", 100_000),
});

export const procurementScheduleSchema = z.object({
  procurementId: z.string().min(1),
  scheduledDate: date("collectionDate"),
  collectedBy: text(2, 80, "collectedBy"),
});

export const procurementCollectedSchema = z.object({
  procurementId: z.string().min(1),
  collectionDate: date("collectionDate"),
  actualQuantityKg: positiveNumber("actualQuantityCollected", 1_000_000),
  collectedBy: text(2, 80, "collectedBy"),
});

export const procurementReceiptSchema = z.object({
  procurementId: z.string().min(1),
  receivedDate: date("receivedDate"),
  storageLocation: text(2, 120, "storageLocation"),
});

export const moveToInventorySchema = z.object({
  procurementId: z.string().min(1),
  sellingPricePerKg: positiveNumber("sellingPrice", 100_000),
  lowStockThresholdKg: z.coerce.number().min(0).max(100_000).default(10),
});

export const farmerPaymentUpdateSchema = z
  .object({
    paymentId: z.string().min(1),
    status: z.enum(["PENDING", "PROCESSING", "PAID", "FAILED"]),
    reference: optionalText(80),
    paymentDate: z
      .string()
      .optional()
      .transform((v) => (v ? new Date(v) : undefined)),
    notes: optionalText(500),
  })
  .superRefine((v, ctx) => {
    if (v.status === "PAID" && !v.reference) {
      ctx.addIssue({ code: "custom", path: ["reference"], message: msg("validation.paymentReference") });
    }
  });

// ───────────── Products & inventory ─────────────

export const productSchema = z
  .object({
    inventoryId: z.string().min(1),
    name: text(3, 100, "productName"),
    category: z.enum(["WHOLE_GRAIN", "FLOUR", "SNACKS", "READY_MIX", "OTHER"]),
    weightGrams: z.coerce.number().int().min(50, msg("validation.minPack")).max(50_000),
    price: positiveNumber("price", 100_000),
    mrp: positiveNumber("mrp", 100_000),
    description: text(10, 3000, "description"),
    featured: z
      .union([z.literal("on"), z.literal("true"), z.literal("")])
      .optional()
      .transform((v) => v === "on" || v === "true"),
  })
  .refine((v) => v.mrp >= v.price, { path: ["mrp"], message: msg("validation.mrpPrice") });

export const productUpdateSchema = z
  .object({
    productId: z.string().min(1),
    name: text(3, 100, "productName"),
    price: positiveNumber("price", 100_000),
    mrp: positiveNumber("mrp", 100_000),
    description: text(10, 3000, "description"),
    featured: z
      .union([z.literal("on"), z.literal("true"), z.literal("")])
      .optional()
      .transform((v) => v === "on" || v === "true"),
  })
  .refine((v) => v.mrp >= v.price, { path: ["mrp"], message: msg("validation.mrpPrice") });

export const inventoryUpdateSchema = z.object({
  inventoryId: z.string().min(1),
  sellingPricePerKg: positiveNumber("sellingPrice", 100_000),
  lowStockThresholdKg: z.coerce.number().min(0).max(100_000),
  storageLocation: text(2, 120, "storageLocation"),
});

// ───────────── Shopping ─────────────

export const addressSchema = z.object({
  fullName: text(2, 80, "fullName"),
  phone: phone,
  line1: text(3, 160, "addressLine1"),
  line2: optionalText(160),
  city: text(2, 80, "city"),
  district: text(2, 80, "district"),
  state: text(2, 80, "state"),
  pincode: z.string().trim().regex(/^[1-9][0-9]{5}$/, msg("validation.pincode")),
});

export const checkoutSchema = z.object({
  addressId: z.string().min(1, msg("validation.address")),
  deliveryMethod: z.enum(["STANDARD", "EXPRESS"]),
  paymentMethod: z.enum(["UPI", "CARD", "COD"]),
});

export const reviewSchema = z.object({
  productId: z.string().min(1),
  rating: z.coerce.number().int().min(1).max(5),
  comment: text(3, 1000, "review"),
});

export const expenseSchema = z.object({
  category: z.enum(["PROCESSING", "PACKAGING", "TRANSPORTATION", "PAYMENT_GATEWAY_FEES", "OPERATING", "OTHER"]),
  amount: positiveNumber("amount", 100_000_000),
  description: text(2, 300, "description"),
  date: date("date"),
  batchId: optionalText(40),
});

export const staffUserSchema = z.object({
  name: text(2, 80, "name"),
  email: z.string().trim().toLowerCase().pipe(z.email(msg("validation.email"))),
  phone: phone,
  password: z.string().min(8, msg("validation.passwordMin")).max(128),
  role: z.enum(["QUALITY_TEAM", "ADMIN"]),
});

/** Convert FormData into a plain object (single values only). */
export function formToObject(form: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of form.entries()) {
    if (typeof v === "string" && !(k in out)) out[k] = v;
  }
  return out;
}

// ───────────── Account, complaints, verification ─────────────

export const profileSchema = z.object({
  name: text(2, 80, "name"),
  phone: phone,
});

export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, msg("validation.currentPassword")).max(128),
    newPassword: z
      .string()
      .min(8, msg("validation.passwordMin"))
      .max(128)
      .regex(/[A-Za-z]/, msg("validation.passwordLetter"))
      .regex(/[0-9]/, msg("validation.passwordNumber")),
    confirmPassword: z.string(),
  })
  .refine((v) => v.newPassword === v.confirmPassword, { path: ["confirmPassword"], message: msg("validation.passwordMatch") });

export const farmProfileSchema = z.object({
  village: text(2, 80, "village"),
  district: text(2, 80, "district"),
  state: text(2, 80, "state"),
  farmLocation: optionalText(200),
  upiId: z
    .string()
    .trim()
    .max(80)
    .optional()
    .transform((v) => (v ? v : undefined))
    .pipe(z.string().regex(/^[\w.-]{2,}@[a-zA-Z]{2,}$/, msg("validation.upi")).optional()),
});

export const complaintSchema = z.object({
  orderId: z.string().min(1),
  subject: text(3, 120, "subject"),
  message: text(10, 2000, "message"),
});

export const complaintUpdateSchema = z
  .object({
    complaintId: z.string().min(1),
    status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"]),
    resolution: optionalText(2000),
  })
  .superRefine((v, ctx) => {
    if ((v.status === "RESOLVED" || v.status === "CLOSED") && !v.resolution) {
      ctx.addIssue({ code: "custom", path: ["resolution"], message: msg("validation.resolution") });
    }
  });

export const farmerVerificationSchema = z
  .object({
    farmerId: z.string().min(1),
    status: z.enum(["VERIFIED", "REJECTED", "PENDING"]),
    note: optionalText(500),
  })
  .superRefine((v, ctx) => {
    if (v.status === "REJECTED" && !v.note) ctx.addIssue({ code: "custom", path: ["note"], message: msg("validation.farmerReason") });
  });

// ───────────── Featured hardware ─────────────

const HARDWARE_CATEGORIES = ["PROCESSING", "DEHULLING", "CLEANING", "DRYING", "STORAGE", "WEIGHING", "CROP_PROTECTION", "OTHER"] as const;
const checkbox = z
  .union([z.literal("on"), z.literal("true"), z.literal("")])
  .optional()
  .transform((v) => v === "on" || v === "true");

/** List fields (features, benefits, specifications, suitable users, how it works) are one item per line. */
export const hardwareSchema = z.object({
  name: text(3, 120, "hardwareName"),
  category: z.enum(HARDWARE_CATEGORIES),
  description: text(10, 300, "shortDescription"),
  mainBenefit: text(5, 200, "mainBenefit"),
  overview: text(20, 4000, "overview"),
  features: text(3, 4000, "features"),
  benefits: text(3, 4000, "benefits"),
  specifications: text(3, 4000, "specifications"),
  suitableFor: text(3, 2000, "suitableFor"),
  howItWorks: text(10, 6000, "howItWorks"),
  featured: checkbox,
});

export const hardwareStatusSchema = z.object({
  productId: z.string().min(1),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
});

export const hardwareEnquirySchema = z.object({
  productId: z.string().min(1),
  quantity: z.coerce
    .number({ error: msg("validation.number", { field: f("quantity") }) })
    .int(msg("validation.integer", { field: f("quantity") }))
    .min(1, msg("validation.positive", { field: f("quantity") }))
    .max(10_000, msg("validation.tooLarge", { field: f("quantity") })),
  requirement: optionalText(300),
  message: text(5, 2000, "message"),
  contactName: text(2, 80, "contactName"),
  contactPhone: phone,
});

export const hardwareEnquiryUpdateSchema = z.object({
  enquiryId: z.string().min(1),
  status: z.enum(["NEW", "CONTACTED", "IN_DISCUSSION", "COMPLETED", "CANCELLED"]),
  adminNote: optionalText(1000),
});

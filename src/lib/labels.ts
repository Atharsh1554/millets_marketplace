// Client-safe enum labels and badge tones. Keys mirror the Prisma enums (string literals).

export type Tone = "neutral" | "info" | "warning" | "success" | "danger" | "gold";

export const MILLET_TYPES = [
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

export const MILLET_LABEL: Record<string, string> = {
  FINGER_MILLET: "Finger Millet (Ragi)",
  PEARL_MILLET: "Pearl Millet (Bajra)",
  FOXTAIL_MILLET: "Foxtail Millet",
  LITTLE_MILLET: "Little Millet",
  KODO_MILLET: "Kodo Millet",
  BARNYARD_MILLET: "Barnyard Millet",
  PROSO_MILLET: "Proso Millet",
  BROWNTOP_MILLET: "Browntop Millet",
  SORGHUM: "Sorghum (Jowar)",
  MIXED: "Mixed Millets",
};

export const MILLET_SHORT: Record<string, string> = {
  FINGER_MILLET: "Ragi",
  PEARL_MILLET: "Bajra",
  FOXTAIL_MILLET: "Foxtail",
  LITTLE_MILLET: "Little",
  KODO_MILLET: "Kodo",
  BARNYARD_MILLET: "Barnyard",
  PROSO_MILLET: "Proso",
  BROWNTOP_MILLET: "Browntop",
  SORGHUM: "Jowar",
  MIXED: "Mixed",
};

export const CATEGORIES = ["WHOLE_GRAIN", "FLOUR", "SNACKS", "READY_MIX", "OTHER"] as const;

export const CATEGORY_LABEL: Record<string, string> = {
  WHOLE_GRAIN: "Whole Grain",
  FLOUR: "Millet Flour",
  SNACKS: "Millet Snacks",
  READY_MIX: "Ready Mixes",
  OTHER: "Other Products",
};

export const HARVEST_STATUS: Record<string, { label: string; tone: Tone }> = {
  DRAFT: { label: "Draft", tone: "neutral" },
  SUBMITTED: { label: "Submitted", tone: "info" },
  ADMIN_REVIEW_PENDING: { label: "Pending Admin Review", tone: "warning" },
  ADMIN_APPROVED: { label: "Admin Approved — Physical Testing Required", tone: "info" },
  ADMIN_REJECTED: { label: "Submission Rejected", tone: "danger" },
  PHYSICAL_TESTING_PENDING: { label: "Physical Testing Pending", tone: "warning" },
  SAMPLE_COLLECTION_SCHEDULED: { label: "Sample Collection Scheduled", tone: "info" },
  SAMPLE_COLLECTED: { label: "Sample Collected", tone: "info" },
  PHYSICAL_TESTING: { label: "Physical Testing In Progress", tone: "warning" },
  PHYSICAL_TEST_PASSED: { label: "Physical Test Passed", tone: "success" },
  PHYSICAL_TEST_FAILED: { label: "Physical Test Failed", tone: "danger" },
  PROCUREMENT_PENDING: { label: "Approved for Procurement", tone: "gold" },
  PROCURED: { label: "Procured", tone: "success" },
  MARKETPLACE_APPROVED: { label: "Marketplace Approved", tone: "success" },
  AVAILABLE_FOR_SALE: { label: "Available for Sale", tone: "success" },
  SOLD_OUT: { label: "Sold Out", tone: "neutral" },
};

export const TEST_STATUS: Record<string, { label: string; tone: Tone }> = {
  PENDING: { label: "Awaiting Collection", tone: "warning" },
  COLLECTION_SCHEDULED: { label: "Collection Scheduled", tone: "info" },
  SAMPLE_COLLECTED: { label: "Sample Collected", tone: "info" },
  TESTING: { label: "Testing", tone: "warning" },
  ADDITIONAL_TESTING_REQUIRED: { label: "Additional Testing Required", tone: "gold" },
  PASSED: { label: "Passed", tone: "success" },
  FAILED: { label: "Failed", tone: "danger" },
};

export const COLLECTION_STATUS: Record<string, { label: string; tone: Tone }> = {
  SCHEDULED: { label: "Scheduled", tone: "info" },
  COLLECTED: { label: "Collected", tone: "success" },
  RECEIVED: { label: "Received at lab", tone: "success" },
  CANCELLED: { label: "Cancelled", tone: "danger" },
};

export const CHECK_OUTCOME: Record<string, { label: string; tone: Tone }> = {
  PASS: { label: "Pass", tone: "success" },
  FAIL: { label: "Fail", tone: "danger" },
  REQUIRES_REVIEW: { label: "Requires Review", tone: "gold" },
};

export const PROCUREMENT_STATUS: Record<string, { label: string; tone: Tone }> = {
  PROCUREMENT_PENDING: { label: "Procurement Pending", tone: "warning" },
  COLLECTION_SCHEDULED: { label: "Collection Scheduled", tone: "info" },
  COLLECTED: { label: "Collected", tone: "info" },
  RECEIVED: { label: "Received", tone: "info" },
  STORED: { label: "Stored", tone: "success" },
  READY_FOR_MARKETPLACE: { label: "Ready for Marketplace", tone: "success" },
};

export const INVENTORY_STATUS: Record<string, { label: string; tone: Tone }> = {
  IN_STOCK: { label: "In Stock", tone: "success" },
  LOW_STOCK: { label: "Low Stock", tone: "gold" },
  OUT_OF_STOCK: { label: "Out of Stock", tone: "danger" },
};

export const PRODUCT_STATUS: Record<string, { label: string; tone: Tone }> = {
  DRAFT: { label: "Draft", tone: "neutral" },
  MARKETPLACE_APPROVED: { label: "Marketplace Approved (unpublished)", tone: "info" },
  AVAILABLE_FOR_SALE: { label: "Available for Sale", tone: "success" },
  SOLD_OUT: { label: "Sold Out", tone: "danger" },
  ARCHIVED: { label: "Archived", tone: "neutral" },
};

export const FARMER_PAYMENT_STATUS: Record<string, { label: string; tone: Tone }> = {
  PENDING: { label: "Pending", tone: "warning" },
  PROCESSING: { label: "Processing", tone: "info" },
  PAID: { label: "Paid", tone: "success" },
  FAILED: { label: "Failed", tone: "danger" },
};

export const ORDER_STATUS: Record<string, { label: string; tone: Tone }> = {
  PLACED: { label: "Order Placed", tone: "info" },
  CONFIRMED: { label: "Confirmed", tone: "info" },
  PACKED: { label: "Packed", tone: "gold" },
  SHIPPED: { label: "Shipped", tone: "gold" },
  OUT_FOR_DELIVERY: { label: "Out for Delivery", tone: "warning" },
  DELIVERED: { label: "Delivered", tone: "success" },
  CANCELLED: { label: "Cancelled", tone: "danger" },
};

export const HARDWARE_CATEGORIES = ["PROCESSING", "DEHULLING", "CLEANING", "DRYING", "STORAGE", "WEIGHING", "OTHER"] as const;

export const HARDWARE_STATUS: Record<string, { label: string; tone: Tone }> = {
  DRAFT: { label: "Draft", tone: "neutral" },
  PUBLISHED: { label: "Published", tone: "success" },
  ARCHIVED: { label: "Archived", tone: "danger" },
};

export const ENQUIRY_STATUS: Record<string, { label: string; tone: Tone }> = {
  NEW: { label: "New", tone: "warning" },
  CONTACTED: { label: "Contacted", tone: "info" },
  IN_DISCUSSION: { label: "In Discussion", tone: "gold" },
  COMPLETED: { label: "Completed", tone: "success" },
  CANCELLED: { label: "Cancelled", tone: "neutral" },
};

export const ORDER_FLOW = ["PLACED", "CONFIRMED", "PACKED", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"] as const;

export const PAYMENT_STATUS: Record<string, { label: string; tone: Tone }> = {
  PENDING: { label: "Pending", tone: "warning" },
  SUCCEEDED: { label: "Paid", tone: "success" },
  FAILED: { label: "Failed", tone: "danger" },
  REFUNDED: { label: "Refunded", tone: "neutral" },
};

export const PAYMENT_METHOD_LABEL: Record<string, string> = {
  UPI: "UPI",
  CARD: "Card",
  COD: "Cash on Delivery",
};

export const EXPENSE_CATEGORIES = [
  "PROCESSING",
  "PACKAGING",
  "TRANSPORTATION",
  "PAYMENT_GATEWAY_FEES",
  "OPERATING",
  "OTHER",
] as const;

export const EXPENSE_LABEL: Record<string, string> = {
  PROCESSING: "Processing",
  PACKAGING: "Packaging",
  TRANSPORTATION: "Transportation",
  PAYMENT_GATEWAY_FEES: "Payment Gateway Fees",
  OPERATING: "Operating Expenses",
  OTHER: "Other Expenses",
};

export const ROLE_LABEL: Record<string, string> = {
  CUSTOMER: "Customer",
  FARMER: "Farmer",
  QUALITY_TEAM: "Quality Team",
  ADMIN: "Admin",
};

export const MEDIA_KIND_LABEL: Record<string, string> = {
  HARVEST: "Harvest photo",
  GRAIN: "Grain close-up",
  FARM: "Farm photo",
  PACKAGE: "Package photo",
  VIDEO: "Harvest video",
};

export const ATTACHMENT_KIND_LABEL: Record<string, string> = {
  TEST_PHOTO: "Test photo",
  SAMPLE_PHOTO: "Sample photo",
  DOCUMENT: "Document",
  TEST_REPORT: "Test report",
};

/** Dictionary namespace (labels.<ns>.<value>) for each label map — used to translate badges. */
export const LABEL_NS = new Map<object, string>([
  [HARVEST_STATUS, "harvestStatus"],
  [TEST_STATUS, "testStatus"],
  [COLLECTION_STATUS, "collectionStatus"],
  [CHECK_OUTCOME, "checkOutcome"],
  [PROCUREMENT_STATUS, "procurementStatus"],
  [INVENTORY_STATUS, "inventoryStatus"],
  [PRODUCT_STATUS, "productStatus"],
  [FARMER_PAYMENT_STATUS, "farmerPaymentStatus"],
  [ORDER_STATUS, "orderStatus"],
  [PAYMENT_STATUS, "paymentStatus"],
  [HARDWARE_STATUS, "hardwareStatus"],
  [ENQUIRY_STATUS, "enquiryStatus"],
]);

import { db } from "@/server/db";
import { msg } from "@/i18n/translate";
import { AppError, ForbiddenError, NotFoundError } from "@/server/errors";
import { hashPassword, verifyPassword } from "@/server/auth/password";
import { complaintSchema, complaintUpdateSchema, farmProfileSchema, farmerVerificationSchema, passwordChangeSchema, profileSchema } from "@/server/validation";
import { notifyRole, notifyUser } from "./notifications";
import { assertRole, type Actor } from "./types";

// ───────────── Profile & settings (every role, own account only) ─────────────

export async function updateProfile(actor: Actor, raw: unknown) {
  const input = profileSchema.parse(raw);
  await db.user.update({ where: { id: actor.id }, data: { name: input.name, phone: input.phone } });
}

export async function changePassword(actor: Actor, raw: unknown) {
  const input = passwordChangeSchema.parse(raw);
  const user = await db.user.findUniqueOrThrow({ where: { id: actor.id } });
  if (!(await verifyPassword(input.currentPassword, user.passwordHash))) throw new AppError(msg("errors.wrongCurrentPassword"));
  await db.user.update({ where: { id: actor.id }, data: { passwordHash: await hashPassword(input.newPassword) } });
}

export async function updateFarmProfile(actor: Actor, raw: unknown) {
  assertRole(actor, ["FARMER"]);
  if (!actor.farmerId) throw new NotFoundError("Farm profile");
  const input = farmProfileSchema.parse(raw);
  await db.farmer.update({
    where: { id: actor.farmerId },
    data: { village: input.village, district: input.district, state: input.state, farmLocation: input.farmLocation ?? null, upiId: input.upiId ?? null },
  });
}

export async function deleteAddress(actor: Actor, addressId: string) {
  assertRole(actor, ["CUSTOMER"]);
  const a = await db.address.findUnique({ where: { id: addressId } });
  if (!a || a.userId !== actor.id) throw new NotFoundError("Address");
  await db.address.delete({ where: { id: a.id } });
}

export async function setDefaultAddress(actor: Actor, addressId: string) {
  assertRole(actor, ["CUSTOMER"]);
  const a = await db.address.findUnique({ where: { id: addressId } });
  if (!a || a.userId !== actor.id) throw new NotFoundError("Address");
  await db.$transaction([
    db.address.updateMany({ where: { userId: actor.id }, data: { isDefault: false } }),
    db.address.update({ where: { id: a.id }, data: { isDefault: true } }),
  ]);
}

// ───────────── Complaints ─────────────

/** A customer raises a complaint about one of their own orders. */
export async function createComplaint(actor: Actor, raw: unknown) {
  assertRole(actor, ["CUSTOMER"]);
  const input = complaintSchema.parse(raw);
  const order = await db.order.findUnique({ where: { id: input.orderId } });
  if (!order || order.userId !== actor.id) throw new ForbiddenError();
  await db.$transaction(async (tx) => {
    const c = await tx.complaint.create({ data: { userId: actor.id, orderId: order.id, subject: input.subject, message: input.message } });
    await notifyRole(tx, ["ADMIN"], "New customer complaint", `${order.code}: ${input.subject}`, `/admin/complaints?open=${c.id}`);
  });
}

export async function updateComplaint(actor: Actor, raw: unknown) {
  assertRole(actor, ["ADMIN"]);
  const input = complaintUpdateSchema.parse(raw);
  const c = await db.complaint.findUnique({ where: { id: input.complaintId } });
  if (!c) throw new NotFoundError("Complaint");
  await db.$transaction(async (tx) => {
    await tx.complaint.update({ where: { id: c.id }, data: { status: input.status, resolution: input.resolution ?? c.resolution } });
    await notifyUser(
      tx,
      c.userId,
      msg("notif.complaint.title"),
      msg(input.resolution ? "notif.complaint.bodyWithNote" : "notif.complaint.body", { subject: c.subject, status: msg(`labels.complaintStatus.${input.status}`), note: input.resolution ?? "" }),
      c.orderId ? `/customer/orders/${c.orderId}` : "/customer",
    );
  });
}

// ───────────── Farmer verification (admin) ─────────────

export async function setFarmerVerification(actor: Actor, raw: unknown) {
  assertRole(actor, ["ADMIN"]);
  const input = farmerVerificationSchema.parse(raw);
  const farmer = await db.farmer.findUnique({ where: { id: input.farmerId } });
  if (!farmer) throw new NotFoundError("Farmer");
  await db.$transaction(async (tx) => {
    await tx.farmer.update({
      where: { id: farmer.id },
      data: { verificationStatus: input.status, verificationNote: input.note ?? null, verifiedAt: input.status === "VERIFIED" ? new Date() : null },
    });
    const body =
      input.status === "VERIFIED"
        ? msg("notif.verification.verified")
        : input.status === "REJECTED"
          ? msg("notif.verification.rejected", { note: input.note ?? "" })
          : msg("notif.verification.pending");
    await notifyUser(tx, farmer.userId, msg("notif.verification.title"), body, "/farmer/farm");
  });
}

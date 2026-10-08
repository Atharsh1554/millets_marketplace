import { db } from "@/server/db";
import { msg } from "@/i18n/translate";
import { AppError } from "@/server/errors";
import { hashPassword, verifyPassword } from "@/server/auth/password";
import { loginSchema, registerSchema, staffUserSchema } from "@/server/validation";
import { assertRole, type Actor } from "./types";

// Compare against a dummy hash for unknown emails so login timing doesn't reveal which emails exist.
let dummyHash: Promise<string> | null = null;
const getDummyHash = () => (dummyHash ??= hashPassword("not-a-real-password"));

/** Public sign-up: only CUSTOMER or FARMER. Staff accounts are created by an admin. */
export async function register(raw: unknown) {
  const input = registerSchema.parse(raw);
  const exists = await db.user.findUnique({ where: { email: input.email } });
  if (exists) throw new AppError(msg("errors.emailExists"), "CONFLICT");
  const passwordHash = await hashPassword(input.password);
  return db.user.create({
    data: {
      email: input.email,
      name: input.name,
      phone: input.phone,
      passwordHash,
      role: input.role,
      ...(input.role === "FARMER" ? { farmer: { create: { village: input.village!, district: input.district!, state: input.state! } } } : {}),
    },
  });
}

export async function authenticate(raw: unknown) {
  const input = loginSchema.parse(raw);
  const user = await db.user.findUnique({ where: { email: input.email } });
  const ok = await verifyPassword(input.password, user?.passwordHash ?? (await getDummyHash()));
  if (!user || !ok) throw new AppError(msg("errors.incorrectLogin"), "UNAUTHORIZED");
  return user;
}

export async function createStaffUser(actor: Actor, raw: unknown) {
  assertRole(actor, ["ADMIN"]);
  const input = staffUserSchema.parse(raw);
  const exists = await db.user.findUnique({ where: { email: input.email } });
  if (exists) throw new AppError(msg("errors.emailExists"), "CONFLICT");
  await db.user.create({ data: { email: input.email, name: input.name, phone: input.phone, role: input.role, passwordHash: await hashPassword(input.password) } });
}

export async function listFarmers() {
  return db.farmer.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { name: true, email: true, phone: true, isDemo: true } },
      submissions: { select: { status: true } },
      procurements: { select: { actualQuantityGrams: true } },
      payments: { select: { totalAmountPaise: true, status: true } },
    },
  });
}

export async function listStaff() {
  return db.user.findMany({ where: { role: { in: ["ADMIN", "QUALITY_TEAM"] } }, orderBy: { createdAt: "asc" }, select: { id: true, name: true, email: true, role: true, isDemo: true } });
}

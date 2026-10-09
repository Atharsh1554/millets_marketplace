// Creates a staff account (Admin or Quality Team) — /register only creates farmers and customers.
// If the email already exists, its role, name and password are updated (use it to reset a lost admin password).
// Run against the database in DATABASE_URL:
//   npx tsx scripts/create-user.ts <email> "<name>" <password> [ADMIN|QUALITY_TEAM]
import { PrismaClient, type Role } from "@prisma/client";
import { hashPassword } from "../src/server/auth/password";

const STAFF_ROLES: Role[] = ["ADMIN", "QUALITY_TEAM"];

async function main() {
  const [emailArg, name, password, roleArg = "ADMIN"] = process.argv.slice(2);
  const email = emailArg?.trim().toLowerCase();
  const role = roleArg.toUpperCase() as Role;

  if (!email || !name || !password) {
    throw new Error('Usage: npx tsx scripts/create-user.ts <email> "<name>" <password> [ADMIN|QUALITY_TEAM]');
  }
  if (!STAFF_ROLES.includes(role)) throw new Error(`Role must be one of: ${STAFF_ROLES.join(", ")}`);
  if (password.length < 8) throw new Error("Password must be at least 8 characters.");

  const db = new PrismaClient();
  try {
    const passwordHash = await hashPassword(password);
    const existing = await db.user.findUnique({ where: { email }, select: { id: true } });
    await db.user.upsert({
      where: { email },
      create: { email, name, role, passwordHash },
      update: { name, role, passwordHash },
    });
    console.log(`${existing ? "Updated" : "Created"} ${role} account: ${email}`);
  } finally {
    await db.$disconnect();
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});

import "server-only";
import { msg } from "@/i18n/translate";
import { cache } from "react";
import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";
import { db } from "@/server/db";
import { readSession } from "./session";
import { ForbiddenError, AppError } from "@/server/errors";
import type { Actor } from "@/server/services/types";
import { ROLE_HOME } from "@/lib/roles";

/**
 * Loads the signed-in user from the database on every request.
 * The role is always taken from the DB (never trusted from the cookie alone).
 */
export const getCurrentUser = cache(async () => {
  const session = await readSession();
  if (!session) return null;
  const user = await db.user.findUnique({
    where: { id: session.sub },
    select: { id: true, name: true, email: true, role: true, phone: true, isDemo: true, farmer: { select: { id: true } } },
  });
  return user;
});

export type CurrentUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

export function toActor(u: CurrentUser): Actor {
  return { id: u.id, role: u.role, name: u.name, farmerId: u.farmer?.id ?? null };
}

/** For pages: redirect to login if signed out, or home if role not allowed. */
export async function requirePageRole(roles: Role[], nextPath?: string): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/login${nextPath ? `?next=${encodeURIComponent(nextPath)}` : ""}`);
  if (!roles.includes(user.role)) redirect(`/unauthorized?home=${ROLE_HOME[user.role]}`);
  return user;
}

/** For server actions / route handlers: throw instead of redirecting. */
export async function requireActor(roles?: Role[]): Promise<Actor> {
  const user = await getCurrentUser();
  if (!user) throw new AppError(msg("errors.signInRequired"), "UNAUTHORIZED");
  if (roles && !roles.includes(user.role)) throw new ForbiddenError();
  return toActor(user);
}

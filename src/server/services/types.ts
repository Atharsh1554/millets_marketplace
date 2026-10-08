import type { Role } from "@prisma/client";
import { ForbiddenError } from "@/server/errors";

/** The authenticated user performing a service call. Services never read cookies themselves. */
export type Actor = { id: string; role: Role; name: string; farmerId: string | null };

export function assertRole(actor: Actor, roles: Role[]) {
  if (!roles.includes(actor.role)) throw new ForbiddenError();
}

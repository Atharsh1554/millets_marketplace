"use server";

import { redirect } from "next/navigation";
import type { FormResult } from "@/components/forms";
import { clearSessionCookie, createSessionCookie } from "@/server/auth/session";
import { authenticate, register } from "@/server/services/accounts";
import { formToObject } from "@/server/validation";
import { toActionError } from "@/server/errors";
import { writeAudit } from "@/server/services/audit";
import { ROLE_HOME } from "@/lib/roles";
import { getT } from "@/i18n/server";

/** Only allow same-site relative redirects (prevents open-redirects via ?next=). */
function safeNext(next: string | undefined) {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : undefined;
}

export async function loginAction(_: FormResult, form: FormData): Promise<FormResult> {
  let target: string;
  try {
    const data = formToObject(form);
    const user = await authenticate(data);
    await createSessionCookie({ sub: user.id, role: user.role });
    await writeAudit({ actorId: user.id, actorRole: user.role, action: "Signed in", entity: "user", entityId: user.id });
    // Only follow ?next= into the user's own dashboard (or public pages).
    const next = safeNext(data.next);
    const foreign = next && ["/customer", "/farmer", "/quality", "/admin"].some((p) => next.startsWith(p)) && !next.startsWith(ROLE_HOME[user.role]);
    target = next && !foreign ? next : ROLE_HOME[user.role];
  } catch (err) {
    return toActionError(err, await getT());
  }
  redirect(target);
}

export async function registerAction(_: FormResult, form: FormData): Promise<FormResult> {
  let target: string;
  try {
    const user = await register(formToObject(form));
    await createSessionCookie({ sub: user.id, role: user.role });
    await writeAudit({ actorId: user.id, actorRole: user.role, action: "Registered account", entity: "user", entityId: user.id });
    target = user.role === "FARMER" ? "/farmer?welcome=1" : "/customer";
  } catch (err) {
    return toActionError(err, await getT());
  }
  redirect(target);
}

export async function logoutAction() {
  await clearSessionCookie();
  redirect("/");
}

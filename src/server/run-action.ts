import "server-only";
import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import type { FormResult } from "@/components/forms";
import { toActionError } from "@/server/errors";
import { getCurrentUser } from "@/server/auth/guard";
import { describeForm, humanize, writeAudit } from "@/server/services/audit";
import { getT } from "@/i18n/server";
import { translateMessage } from "@/i18n/translate";

type Out = void | { redirectTo?: string; message?: string; data?: unknown };

/**
 * Runs a mutation for a server action: converts thrown errors into safe messages
 * (never leaking internals), rethrows Next.js control-flow (redirect/notFound), and
 * refreshes rendered data. Messages are returned in the viewer's language.
 */
export async function runAction(fn: () => Promise<Out>, successMessage?: string): Promise<FormResult> {
  const t = await getT();
  try {
    const out = (await fn()) || {};
    revalidatePath("/", "layout");
    const message = out.message ?? successMessage;
    return { ok: true, message: message ? translateMessage(t, message) : undefined, redirectTo: out.redirectTo, data: out.data };
  } catch (err) {
    unstable_rethrow(err);
    return toActionError(err, t);
  }
}

/** Same as runAction, plus an audit-log entry when the action succeeds. */
export async function withAudit(name: string, form: FormData | undefined, fn: () => Promise<Out>, successMessage?: string): Promise<FormResult> {
  const result = await runAction(fn, successMessage);
  if (result?.ok) {
    const user = await getCurrentUser();
    await writeAudit({ actorId: user?.id, actorRole: user?.role, action: humanize(name), ...describeForm(form) });
  }
  return result;
}

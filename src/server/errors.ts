import { ZodError } from "zod";
import { msg, translateMessage, type Translator } from "@/i18n/translate";

/** An error whose message is safe to show to the user. */
export class AppError extends Error {
  constructor(message: string, public code: "BAD_REQUEST" | "FORBIDDEN" | "NOT_FOUND" | "CONFLICT" | "UNAUTHORIZED" = "BAD_REQUEST") {
    super(message);
    this.name = "AppError";
  }
}

export class ForbiddenError extends AppError {
  constructor(message = msg("errors.forbidden")) {
    super(message, "FORBIDDEN");
  }
}

export class NotFoundError extends AppError {
  constructor(what = "Record") {
    super(msg("errors.notFound", { what }), "NOT_FOUND");
  }
}

export type ActionResult<T = undefined> =
  | { ok: true; data?: T; message?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string[] | undefined> };

/**
 * Convert any thrown error into a safe ActionResult (never leaks internals).
 * Messages may be encoded translation keys (see i18n/translate `msg`); pass the viewer's
 * translator to return them in the viewer's language.
 */
export function toActionError(err: unknown, t?: Translator): { ok: false; error: string; fieldErrors?: Record<string, string[] | undefined> } {
  const tr = (s: string) => (t ? translateMessage(t, s) : s);
  if (err instanceof ZodError) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of err.issues) {
      const key = issue.path.join(".") || "_";
      (fieldErrors[key] ??= []).push(tr(issue.message));
    }
    return { ok: false, error: tr(msg("errors.correctFields")), fieldErrors };
  }
  if (err instanceof AppError) return { ok: false, error: tr(err.message) };
  // Re-throw Next.js control-flow errors (redirect/notFound) are handled by callers.
  console.error("[action error]", err);
  return { ok: false, error: tr(msg("errors.generic")) };
}

import { ZodError } from "zod";
import { msg, translateMessage, type Translator } from "@/i18n/translate";

/** An error whose message is safe to show to the user. */
export class AppError extends Error {
  readonly isAppError = true;
  constructor(message: string, public code: "BAD_REQUEST" | "FORBIDDEN" | "NOT_FOUND" | "CONFLICT" | "UNAUTHORIZED" = "BAD_REQUEST") {
    super(message);
    this.name = "AppError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = msg("errors.forbidden")) {
    super(message, "FORBIDDEN");
    this.name = "ForbiddenError";
  }
}

export class NotFoundError extends AppError {
  constructor(what = "Record") {
    super(msg("errors.notFound", { what }), "NOT_FOUND");
    this.name = "NotFoundError";
  }
}

export function isAppError(err: unknown): err is AppError {
  return (
    err instanceof AppError ||
    (typeof err === "object" &&
      err !== null &&
      ("isAppError" in err ||
        (err as Error).name === "AppError" ||
        (err as Error).name === "ForbiddenError" ||
        (err as Error).name === "NotFoundError"))
  );
}

export type ActionResult<T = undefined> =
  | { ok: true; data?: T; message?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string[] | undefined> };

/**
 * Convert any thrown error into a safe ActionResult (never leaks internals in production).
 * Messages may be encoded translation keys (see i18n/translate `msg`); pass the viewer's
 * translator to return them in the viewer's language.
 */
export function toActionError(err: unknown, t?: Translator): { ok: false; error: string; fieldErrors?: Record<string, string[] | undefined> } {
  const tr = (s: string) => (t ? translateMessage(t, s) : s);
  if (err instanceof ZodError || (typeof err === "object" && err !== null && (err as { name?: string }).name === "ZodError")) {
    const issues = (err as ZodError).issues || [];
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of issues) {
      const key = issue.path?.join(".") || "_";
      (fieldErrors[key] ??= []).push(tr(issue.message));
    }
    return { ok: false, error: tr(msg("errors.correctFields")), fieldErrors };
  }
  if (isAppError(err)) return { ok: false, error: tr(err.message) };
  // Re-throw Next.js control-flow errors (redirect/notFound) are handled by callers.
  console.error("[action error]", err);
  const isDevOrDemo = process.env.NODE_ENV === "development" || process.env.NEXT_PUBLIC_DEMO_MODE === "true";
  const generic = tr(msg("errors.generic"));
  const detail = err instanceof Error ? err.message : String(err);
  return { ok: false, error: isDevOrDemo && detail ? `${generic} (${detail})` : generic };
}

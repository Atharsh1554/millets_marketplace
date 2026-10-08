"use client";

import { createContext, useActionState, useContext, useEffect, useRef, startTransition, type ComponentProps, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/format";
import { buttonClass, type ButtonVariant } from "./ui";

export type FormResult =
  | { ok: true; message?: string; data?: unknown; redirectTo?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string[] | undefined> }
  | null;

type FormAction = (prev: FormResult, form: FormData) => Promise<FormResult>;

export const FormCtx = createContext<{ state: FormResult; pending: boolean }>({ state: null, pending: false });
export const useFormCtx = () => useContext(FormCtx);

/**
 * Wraps a server action. Submits via a transition (so React does not reset the inputs on a
 * validation error), shows field + form errors, and optionally redirects on success.
 */
export function ActionForm({
  action,
  children,
  className,
  resetOnSuccess = false,
  confirm,
  onSuccess,
  showSuccess = true,
}: {
  action: FormAction;
  children: ReactNode;
  className?: string;
  resetOnSuccess?: boolean;
  confirm?: string;
  onSuccess?: () => void;
  showSuccess?: boolean;
}) {
  const [state, dispatch, pending] = useActionState(action, null);
  const ref = useRef<HTMLFormElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (state?.ok) {
      if (resetOnSuccess) ref.current?.reset();
      if (state.redirectTo) router.push(state.redirectTo);
      onSuccess?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <FormCtx.Provider value={{ state, pending }}>
      <form
        ref={ref}
        className={className}
        onSubmit={(e) => {
          e.preventDefault();
          if (confirm && !window.confirm(confirm)) return;
          const fd = new FormData(e.currentTarget);
          const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
          if (submitter?.name) fd.set(submitter.name, submitter.value);
          startTransition(() => dispatch(fd));
        }}
      >
        {children}
        <FormMessage showSuccess={showSuccess} />
      </form>
    </FormCtx.Provider>
  );
}

export function FormMessage({ showSuccess = true }: { showSuccess?: boolean }) {
  const { state } = useFormCtx();
  if (!state) return null;
  if (!state.ok)
    return (
      <p role="alert" className="mt-3 flex items-start gap-2 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
        <AlertCircle className="mt-0.5 size-4 shrink-0" /> {state.error}
      </p>
    );
  if (showSuccess && state.message)
    return (
      <p role="status" className="mt-3 flex items-start gap-2 rounded-xl bg-leaf-50 px-3 py-2 text-sm text-leaf-800">
        <CheckCircle2 className="mt-0.5 size-4 shrink-0" /> {state.message}
      </p>
    );
  return null;
}

export function SubmitButton({
  children,
  variant = "primary",
  size = "md",
  className,
  name,
  value,
  ...rest
}: { children: ReactNode; variant?: ButtonVariant; size?: "sm" | "md" | "lg"; className?: string } & ComponentProps<"button">) {
  const { pending } = useFormCtx();
  return (
    <button type="submit" name={name} value={value} disabled={pending || rest.disabled} className={buttonClass(variant, size, className)} {...rest}>
      {pending && <Loader2 className="size-4 animate-spin" />}
      {children}
    </button>
  );
}

export function FieldError({ name }: { name: string }) {
  const { state } = useFormCtx();
  const errs = state && !state.ok ? state.fieldErrors?.[name] : undefined;
  if (!errs?.length) return null;
  return <p className="mt-1 text-xs font-medium text-red-600">{errs[0]}</p>;
}

type FieldProps = {
  label: ReactNode;
  name: string;
  hint?: ReactNode;
  className?: string;
  required?: boolean;
};

export function Field({ label, name, hint, className, required, children }: FieldProps & { children: ReactNode }) {
  return (
    <div className={className}>
      <label htmlFor={name} className="label">
        {label}
        {required && <span className="ml-0.5 text-red-600">*</span>}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
      <FieldError name={name} />
    </div>
  );
}

export function TextField({ label, name, hint, className, required, ...input }: FieldProps & Omit<ComponentProps<"input">, "name">) {
  const { state } = useFormCtx();
  const invalid = !!(state && !state.ok && state.fieldErrors?.[name]);
  return (
    <Field label={label} name={name} hint={hint} className={className} required={required}>
      <input id={name} name={name} required={required} aria-invalid={invalid} className={cn("input", invalid && "border-red-400")} {...input} />
    </Field>
  );
}

export function TextArea({ label, name, hint, className, required, ...input }: FieldProps & Omit<ComponentProps<"textarea">, "name">) {
  return (
    <Field label={label} name={name} hint={hint} className={className} required={required}>
      <textarea id={name} name={name} required={required} rows={4} className="input" {...input} />
    </Field>
  );
}

export function SelectField({
  label,
  name,
  hint,
  className,
  required,
  options,
  placeholder,
  ...select
}: FieldProps & Omit<ComponentProps<"select">, "name"> & { options: Array<[string, string]>; placeholder?: string }) {
  return (
    <Field label={label} name={name} hint={hint} className={className} required={required}>
      <select id={name} name={name} required={required} className="input" {...select}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </Field>
  );
}

/** A one-click server action button (e.g. "Publish", "Mark collected"). */
export function ActionButton({
  action,
  fields,
  children,
  variant = "primary",
  size = "sm",
  confirm,
  className,
}: {
  action: FormAction;
  fields: Record<string, string>;
  children: ReactNode;
  variant?: ButtonVariant;
  size?: "sm" | "md" | "lg";
  confirm?: string;
  className?: string;
}) {
  return (
    <ActionForm action={action} confirm={confirm} className={cn("inline-block", className)} showSuccess={false}>
      {Object.entries(fields).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <SubmitButton variant={variant} size={size}>
        {children}
      </SubmitButton>
    </ActionForm>
  );
}

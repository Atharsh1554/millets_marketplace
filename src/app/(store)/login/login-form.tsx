"use client";

import { loginAction } from "@/app/actions/auth";
import { ActionForm, SubmitButton, TextField } from "@/components/forms";
import { useT } from "@/i18n/client";

export function LoginForm({ next }: { next?: string }) {
  const t = useT();
  return (
    <ActionForm action={loginAction} className="mt-6 space-y-4">
      {next && <input type="hidden" name="next" value={next} />}
      <TextField label={t("fields.email")} name="email" type="email" autoComplete="email" required placeholder="you@example.com" />
      <TextField label={t("fields.password")} name="password" type="password" autoComplete="current-password" required />
      <SubmitButton size="lg" className="w-full">
        {t("common.navigation.signIn")}
      </SubmitButton>
    </ActionForm>
  );
}

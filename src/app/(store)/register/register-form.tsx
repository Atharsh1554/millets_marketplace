"use client";

import { useState } from "react";
import { ShoppingBag, Tractor } from "lucide-react";
import { registerAction } from "@/app/actions/auth";
import { ActionForm, SubmitButton, TextField } from "@/components/forms";
import { useT } from "@/i18n/client";
import { cn } from "@/lib/format";

export function RegisterForm({ defaultRole }: { defaultRole: "CUSTOMER" | "FARMER" }) {
  const [role, setRole] = useState(defaultRole);
  const t = useT();
  return (
    <ActionForm action={registerAction} className="mt-6 space-y-4">
      <input type="hidden" name="role" value={role} />
      <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label={t("account.accountType")}>
        {(
          [
            ["CUSTOMER", t("auth.wantToBuy"), ShoppingBag],
            ["FARMER", t("auth.imFarmer"), Tractor],
          ] as const
        ).map(([value, label, Icon]) => (
          <button
            type="button"
            key={value}
            role="radio"
            aria-checked={role === value}
            onClick={() => setRole(value)}
            className={cn(
              "flex flex-col items-center gap-2 rounded-2xl border-2 p-4 text-sm font-semibold transition",
              role === value ? "border-leaf-600 bg-leaf-50 text-leaf-800" : "border-earth-100 bg-white text-earth-700 hover:border-earth-200",
            )}
          >
            <Icon className="size-6" />
            {label}
          </button>
        ))}
      </div>
      <TextField label={t("fields.fullName")} name="name" required autoComplete="name" />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label={t("fields.email")} name="email" type="email" required autoComplete="email" />
        <TextField label={t("fields.phone")} name="phone" type="tel" required autoComplete="tel" placeholder="+91 98765 43210" />
      </div>
      {role === "FARMER" && (
        <div className="grid gap-4 rounded-2xl bg-cream p-4 sm:grid-cols-3">
          <TextField label={t("fields.village")} name="village" required />
          <TextField label={t("fields.district")} name="district" required />
          <TextField label={t("fields.state")} name="state" required />
        </div>
      )}
      <TextField label={t("fields.password")} name="password" type="password" required autoComplete="new-password" hint={t("auth.passwordHint")} />
      <SubmitButton size="lg" className="w-full">
        {role === "FARMER" ? t("sell.registerFarmer") : t("auth.createAccount")}
      </SubmitButton>
    </ActionForm>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/guard";
import { getT } from "@/i18n/server";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = { title: "Create an account" };

export default async function RegisterPage({ searchParams }: PageProps<"/register">) {
  if (await getCurrentUser()) redirect("/");
  const t = await getT();
  const sp = await searchParams;
  const role = sp.role === "FARMER" ? "FARMER" : "CUSTOMER";
  return (
    <div className="mx-auto max-w-xl px-4 py-12 sm:px-6">
      <div className="card p-6 sm:p-8">
        <h1 className="font-display text-3xl font-semibold text-earth-900">{t("auth.createTitle")}</h1>
        <p className="mt-1 text-sm text-muted">{t("auth.createText")}</p>
        <RegisterForm defaultRole={role} />
        <p className="mt-6 text-sm text-muted">
          {t("auth.haveAccount")}{" "}
          <Link href="/login" className="font-semibold text-leaf-700 hover:underline">
            {t("common.navigation.signIn")}
          </Link>
        </p>
      </div>
    </div>
  );
}

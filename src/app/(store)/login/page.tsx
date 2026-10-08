import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/guard";
import { getT } from "@/i18n/server";
import type { Translator } from "@/i18n/translate";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const [user, t] = await Promise.all([getCurrentUser(), getT()]);
  const sp = await searchParams;
  const next = typeof sp.next === "string" ? sp.next : undefined;
  if (user) redirect(next && next.startsWith("/") && !next.startsWith("//") ? next : "/");
  return (
    <div className="mx-auto grid max-w-5xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-2">
      <div className="card p-6 sm:p-8">
        <h1 className="font-display text-3xl font-semibold text-earth-900">{t("auth.welcomeBack")}</h1>
        <p className="mt-1 text-sm text-muted">{t("auth.signInText")}</p>
        <LoginForm next={next} />
        <p className="mt-6 text-sm text-muted">
          {t("auth.newHere")}{" "}
          <Link href="/register" className="font-semibold text-leaf-700 hover:underline">
            {t("common.navigation.createAccount")}
          </Link>{" "}
          ·{" "}
          <Link href="/register?role=FARMER" className="font-semibold text-leaf-700 hover:underline">
            {t("sell.registerFarmer")}
          </Link>
        </p>
      </div>
      <DemoAccounts t={t} />
    </div>
  );
}

function DemoAccounts({ t }: { t: Translator }) {
  const accounts = [
    ["CUSTOMER", "customer@milletmarket.demo", "auth.demoCustomer"],
    ["FARMER", "farmer@milletmarket.demo", "auth.demoFarmer"],
    ["QUALITY_TEAM", "quality@milletmarket.demo", "auth.demoQuality"],
    ["ADMIN", "admin@milletmarket.demo", "auth.demoAdmin"],
  ];
  return (
    <div className="rounded-2xl bg-earth-900 p-6 text-earth-100 sm:p-8">
      <p className="text-xs font-bold tracking-widest text-millet-300 uppercase">{t("auth.demoTitle")}</p>
      <p className="mt-1 text-sm">
        {t("auth.demoPassword")} <code className="rounded bg-white/10 px-1.5 py-0.5 font-semibold text-white">Demo@1234</code>
      </p>
      <ul className="mt-5 space-y-3">
        {accounts.map(([role, email, desc]) => (
          <li key={email} className="rounded-xl bg-white/5 p-3 ring-1 ring-white/10">
            <p className="text-sm font-semibold text-white">{t(`roles.${role}`)}</p>
            <p className="font-mono text-xs text-millet-200">{email}</p>
            <p className="mt-0.5 text-xs text-earth-300">{t(desc)}</p>
          </li>
        ))}
      </ul>
      <p className="mt-5 text-xs text-earth-300">{t("auth.demoNote")}</p>
    </div>
  );
}

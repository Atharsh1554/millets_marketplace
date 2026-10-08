import Link from "next/link";
import { getT } from "@/i18n/server";

export default async function NotFound() {
  const t = await getT();
  return (
    <main className="grid min-h-[70vh] place-items-center px-4 text-center">
      <div>
        <p className="font-display text-6xl font-semibold text-millet-500">404</p>
        <h1 className="mt-2 text-xl font-semibold text-earth-900">{t("pages.notFoundTitle")}</h1>
        <p className="mt-1 text-sm text-muted">{t("pages.notFoundText")}</p>
        <Link href="/" className="mt-6 inline-block rounded-xl bg-leaf-700 px-5 py-2.5 text-sm font-semibold text-white">{t("common.actions.goHome")}</Link>
      </div>
    </main>
  );
}

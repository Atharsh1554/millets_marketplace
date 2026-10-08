"use client";

import { useT } from "@/i18n/client";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useT();
  // Never render error details to users; they are logged on the server.
  return (
    <main className="grid min-h-[70vh] place-items-center px-4 text-center">
      <div>
        <h1 className="text-xl font-semibold text-earth-900">{t("pages.errorTitle")}</h1>
        <p className="mt-1 text-sm text-muted">{t("pages.errorText")}</p>
        <button onClick={reset} className="mt-6 rounded-xl bg-leaf-700 px-5 py-2.5 text-sm font-semibold text-white">{t("common.actions.tryAgain")}</button>
      </div>
    </main>
  );
}

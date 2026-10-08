import { ShieldAlert } from "lucide-react";
import { EmptyState, LinkButton } from "@/components/ui";
import { getT } from "@/i18n/server";

export default async function UnauthorizedPage({ searchParams }: PageProps<"/unauthorized">) {
  const t = await getT();
  const home = (await searchParams).home;
  const dashboard = typeof home === "string" && ["/customer", "/farmer", "/quality", "/admin"].includes(home) ? home : "/";
  return (
    <div className="mx-auto max-w-xl px-4 py-16">
      <EmptyState
        icon={ShieldAlert}
        title={t("pages.unauthorizedTitle")}
        action={<LinkButton href={dashboard}>{dashboard === "/" ? t("common.actions.goHome") : t("common.actions.goToDashboard")}</LinkButton>}
      >
        {t("pages.unauthorizedText")}
      </EmptyState>
    </div>
  );
}

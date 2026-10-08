"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCheck } from "lucide-react";
import { markNotificationsReadAction } from "@/app/actions/shop";
import { buttonClass } from "@/components/ui";
import { useT } from "@/i18n/client";

export function MarkReadButton() {
  const [pending, start] = useTransition();
  const router = useRouter();
  const t = useT();
  return (
    <button
      className={buttonClass("outline", "sm")}
      disabled={pending}
      onClick={() =>
        start(async () => {
          await markNotificationsReadAction();
          router.refresh();
        })
      }
    >
      <CheckCheck className="size-4" /> {t("common.actions.markAllRead")}
    </button>
  );
}

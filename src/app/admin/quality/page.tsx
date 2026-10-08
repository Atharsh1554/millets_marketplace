import Link from "next/link";
import { TestsListView } from "@/components/quality/tests-list-view";
import { requirePageRole } from "@/server/auth/guard";

export default async function AdminQualityPage({ searchParams }: PageProps<"/admin/quality">) {
  await requirePageRole(["ADMIN"]);
  const status = (await searchParams).status;
  return (
    <>
      <TestsListView
        status={typeof status === "string" ? status : undefined}
        basePath="/admin/quality"
        eyebrow="Quality management"
        title="Physical Testing"
        subtitle="Monitor every direct physical inspection. Admins can act on any stage; the checklist is configured under Testing Checklist."
      />
      <p className="mx-auto mt-4 max-w-7xl text-sm text-muted">
        Configure checklist items in <Link href="/admin/checklist" className="font-semibold text-leaf-700 hover:underline">Testing Checklist</Link>.
      </p>
    </>
  );
}

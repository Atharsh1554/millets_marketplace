import { TestWorkspace } from "@/components/quality/test-workspace";
import { requirePageRole } from "@/server/auth/guard";

export default async function AdminInspectionPage({ params, searchParams }: PageProps<"/admin/quality/tests/[id]">) {
  await requirePageRole(["ADMIN"]);
  const d = (await searchParams).decision;
  return <TestWorkspace id={(await params).id} basePath="/admin/quality" decision={typeof d === "string" ? d : undefined} />;
}

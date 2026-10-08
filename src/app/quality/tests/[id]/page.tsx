import { TestWorkspace } from "@/components/quality/test-workspace";
import { requirePageRole } from "@/server/auth/guard";

export default async function InspectionDetailsPage({ params, searchParams }: PageProps<"/quality/tests/[id]">) {
  await requirePageRole(["QUALITY_TEAM"]);
  const d = (await searchParams).decision;
  return <TestWorkspace id={(await params).id} basePath="/quality" decision={typeof d === "string" ? d : undefined} />;
}

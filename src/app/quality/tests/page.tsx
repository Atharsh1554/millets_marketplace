import { TestsListView } from "@/components/quality/tests-list-view";
import { requirePageRole } from "@/server/auth/guard";

export default async function InspectionsPage({ searchParams }: PageProps<"/quality/tests">) {
  await requirePageRole(["QUALITY_TEAM"]);
  const status = (await searchParams).status;
  return (
    <TestsListView
      status={typeof status === "string" ? status : undefined}
      basePath="/quality"
      title="Inspection Details"
      subtitle="Every physical inspection. Open one to schedule collection, record the sample, run the checklist and submit the result."
    />
  );
}

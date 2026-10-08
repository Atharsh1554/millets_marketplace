import { FilteredTests } from "@/components/quality/tests-list-view";
import { requirePageRole } from "@/server/auth/guard";

export default async function Page() {
  await requirePageRole(["QUALITY_TEAM"]);
  return <FilteredTests statuses={["PENDING", "COLLECTION_SCHEDULED", "SAMPLE_COLLECTED"]} basePath="/quality" title="Pending Inspections" subtitle="Admin-approved harvests waiting for sample collection or for testing to start." empty="No inspections pending" />;
}

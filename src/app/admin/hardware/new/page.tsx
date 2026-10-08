import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card, PageHeader } from "@/components/ui";
import { requirePageRole } from "@/server/auth/guard";
import { HardwareForm } from "../hardware-form";

export default async function NewHardwarePage() {
  await requirePageRole(["ADMIN"]);
  return (
    <div className="mx-auto max-w-4xl">
      <Link href="/admin/hardware" className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-earth-600 hover:text-earth-900">
        <ArrowLeft className="size-4" /> Hardware products
      </Link>
      <PageHeader title="Add hardware product" subtitle="New products are saved as drafts. Publish when ready to show them to farmers." />
      <Card className="p-5">
        <HardwareForm />
      </Card>
    </div>
  );
}

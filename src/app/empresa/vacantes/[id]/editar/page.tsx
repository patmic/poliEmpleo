import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getJob } from "@/lib/data";
import { JobForm } from "@/components/JobForm";
import { PageHeader } from "@/components/ui";

export const metadata = { title: "Editar vacante" };

export default function EditJob({ params }: { params: { id: string } }) {
  const u = requireUser("company");
  const job = getJob(Number(params.id));
  if (!job || job.company_id !== u.id) notFound();
  return (<><PageHeader title="Editar vacante" description={job.title} /><JobForm job={job} /></>);
}

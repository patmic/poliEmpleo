import { requireUser } from "@/lib/auth";
import { JobForm } from "@/components/JobForm";
import { PageHeader } from "@/components/ui";

export const metadata = { title: "Publicar vacante" };

export default function NewJob() {
  requireUser("company");
  return (<><PageHeader title="Publicar vacante" description="Completa los datos del puesto o pasantía." /><JobForm /></>);
}

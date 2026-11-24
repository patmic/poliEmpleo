import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getCompany, listJobs, jobApplicants } from "@/lib/data";
import { setJobStatusAction } from "@/app/actions";
import { Alert, Badge, Card, Empty, LinkButton, PageHeader, Stat, fmtDate } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { JOB_STATUS_LABEL } from "@/lib/catalog";

export const metadata = { title: "Panel de empresa" };

export default function CompanyHome() {
  const u = requireUser("company");
  const c = getCompany(u.id)!;
  const jobs = listJobs({ companyId: u.id, status: "all" });
  const apps = jobs.flatMap((j) => jobApplicants(j.id));
  const pending = apps.filter((a) => a.status === "En revisión").length;
  return (
    <>
      <PageHeader title={c.name} description={`${c.sector || "Completa tu sector"} · ${c.city}`} action={<LinkButton href="/empresa/vacantes/nueva">+ Publicar vacante</LinkButton>} />
      {!c.verified ? <div className="mb-6"><Alert variant="theme" title="Verificación pendiente">La coordinación revisará tu RUC. Mientras tanto puedes publicar vacantes; se mostrarán sin el sello de verificación.</Alert></div> : null}
      <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Vacantes activas" value={jobs.filter((j) => j.status === "active").length} hint={`${jobs.length} en total`} />
        <Stat label="Postulantes" value={apps.length} />
        <Stat label="Por revisar" value={pending} />
        <Stat label="Seleccionados" value={apps.filter((a) => a.status === "Seleccionado").length} />
      </div>
      <h2 className="mb-3 text-lg font-semibold">Mis vacantes</h2>
      {jobs.length === 0 ? <Empty title="Aún no publicas vacantes" action={<LinkButton href="/empresa/vacantes/nueva">Publicar la primera</LinkButton>}>Publica una oferta con sus etiquetas y empieza a recibir postulantes ordenados por afinidad.</Empty> : (
        <Card className="overflow-x-auto">
          <table className="w-full text-[15px]">
            <thead><tr className="border-b text-left text-sm text-muted-foreground"><th className="px-5 py-3 font-medium">Vacante</th><th className="px-3 font-medium">Estado</th><th className="px-3 font-medium">Postulantes</th><th className="px-3 font-medium">Publicada</th><th className="px-5 text-right font-medium">Acciones</th></tr></thead>
            <tbody>
              {jobs.map((j) => {
                const ap = jobApplicants(j.id);
                return (
                  <tr key={j.id} className="border-b last:border-0 hover:bg-muted/50">
                    <td className="px-5 py-3"><Link href={`/empresa/vacantes/${j.id}`} className="font-medium hover:text-theme">{j.title}</Link><div className="text-xs text-muted-foreground">{j.modality} · {j.job_type}</div></td>
                    <td className="px-3"><Badge variant={j.status === "active" ? "success" : j.status === "paused" ? "warning" : "secondary"}>{JOB_STATUS_LABEL[j.status]}</Badge></td>
                    <td className="px-3 tabular-nums">{ap.length} <span className="text-xs text-muted-foreground">({ap.filter((a) => a.status === "En revisión").length} nuevos)</span></td>
                    <td className="px-3 text-sm text-muted-foreground">{fmtDate(j.created_at)}</td>
                    <td className="px-5">
                      <div className="flex justify-end gap-1.5">
                        <LinkButton href={`/empresa/vacantes/${j.id}`} size="sm" variant="cancel">Postulantes</LinkButton>
                        <form action={setJobStatusAction}>
                          <input type="hidden" name="id" value={j.id} /><input type="hidden" name="back" value="/empresa" />
                          <input type="hidden" name="status" value={j.status === "active" ? "paused" : "active"} />
                          <SubmitButton size="sm" variant="ghost">{j.status === "active" ? "Pausar" : "Activar"}</SubmitButton>
                        </form>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
    </>
  );
}

import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { listJobs } from "@/lib/data";
import { setJobStatusAction } from "@/app/actions";
import { JOB_STATUS_LABEL } from "@/lib/catalog";
import { Badge, Card, PageHeader, fmtDate } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";

export const metadata = { title: "Moderación de vacantes" };

export default function AdminJobs({ searchParams }: { searchParams: { estado?: string } }) {
  requireUser("admin");
  const estado = ["active", "paused", "closed"].includes(searchParams.estado ?? "") ? searchParams.estado! : "all";
  const jobs = listJobs({ status: estado });
  const here = `/admin/vacantes${estado !== "all" ? `?estado=${estado}` : ""}`;
  return (
    <>
      <PageHeader title="Moderación de vacantes" description="Pausa o cierra ofertas que no cumplan las políticas. La empresa recibe una notificación." />
      <div className="mb-4 flex gap-2 text-sm">
        {[["all", "Todas"], ["active", "Activas"], ["paused", "Pausadas"], ["closed", "Cerradas"]].map(([v, l]) => (
          <Link key={v} href={v === "all" ? "?" : `?estado=${v}`} className={`rounded-full border px-3 py-1 ${estado === v ? "border-theme bg-theme text-white" : "hover:bg-muted"}`}>{l}</Link>
        ))}
      </div>
      <Card className="overflow-x-auto">
        <table className="w-full text-[15px]">
          <thead><tr className="border-b text-left text-sm text-muted-foreground"><th className="px-5 py-3 font-medium">Vacante</th><th className="px-3 font-medium">Empresa</th><th className="px-3 font-medium">Estado</th><th className="px-3 font-medium">Postulantes</th><th className="px-3 font-medium">Publicada</th><th className="px-5 text-right font-medium">Acciones</th></tr></thead>
          <tbody>
            {jobs.map((j) => (
              <tr key={j.id} className="border-b last:border-0">
                <td className="px-5 py-3"><Link href={`/empresa/vacantes/${j.id}`} className="font-medium hover:text-theme">{j.title}</Link><div className="text-xs text-muted-foreground">{j.modality} · {j.job_type}</div></td>
                <td className="px-3 text-sm">{j.company_name} {j.company_verified ? <span className="text-theme">✓</span> : null}</td>
                <td className="px-3"><Badge variant={j.status === "active" ? "success" : j.status === "paused" ? "warning" : "secondary"}>{JOB_STATUS_LABEL[j.status]}</Badge></td>
                <td className="px-3 tabular-nums">{j.applicant_count}</td>
                <td className="px-3 text-sm text-muted-foreground">{fmtDate(j.created_at)}</td>
                <td className="px-5"><div className="flex justify-end gap-1.5">
                  {(["active", "paused", "closed"] as const).filter((s) => s !== j.status).map((s) => (
                    <form key={s} action={setJobStatusAction}>
                      <input type="hidden" name="id" value={j.id} /><input type="hidden" name="status" value={s} /><input type="hidden" name="back" value={here} />
                      <SubmitButton size="sm" variant="ghost">{s === "active" ? "Activar" : s === "paused" ? "Pausar" : "Cerrar"}</SubmitButton>
                    </form>
                  ))}
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}

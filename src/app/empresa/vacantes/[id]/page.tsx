import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getJob, jobApplicants } from "@/lib/data";
import { deleteJobAction, setJobStatusAction, updateApplicationAction } from "@/app/actions";
import { APP_STATUSES, JOB_STATUS_LABEL } from "@/lib/catalog";
import { Avatar, Badge, Card, Empty, LinkButton, PageHeader, ScoreBadge, Stars, TagList, fmtDate } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";

export const metadata = { title: "Postulantes" };

const NEXT: Record<string, string[]> = {
  "En revisión": ["Entrevista", "Rechazado"],
  "Entrevista": ["Seleccionado", "Rechazado"],
  "Seleccionado": ["Entrevista"],
  "Rechazado": ["En revisión"],
};

export default function Applicants({ params, searchParams }: { params: { id: string }; searchParams: { origen?: string } }) {
  const u = requireUser("company", "admin");
  const job = getJob(Number(params.id));
  if (!job || (u.role === "company" && job.company_id !== u.id)) notFound();
  const all = jobApplicants(job.id);
  const origin = searchParams.origen;
  const apps = origin ? all.filter((a) => a.student_origin === origin) : all;
  const here = `/empresa/vacantes/${job.id}${origin ? `?origen=${origin}` : ""}`;

  return (
    <>
      <PageHeader title={job.title}
        description={<>{job.modality} · {job.job_type} · publicada {fmtDate(job.created_at)} · <Badge variant={job.status === "active" ? "success" : "warning"}>{JOB_STATUS_LABEL[job.status]}</Badge></>}
        action={u.role === "company" ? (
          <div className="flex flex-wrap gap-2">
            <LinkButton href={`/empleos/${job.id}`} variant="ghost">Ver publicación</LinkButton>
            <LinkButton href={`/empresa/vacantes/${job.id}/editar`} variant="cancel">Editar</LinkButton>
            {(["active", "paused", "closed"] as const).filter((s) => s !== job.status).map((s) => (
              <form key={s} action={setJobStatusAction}>
                <input type="hidden" name="id" value={job.id} /><input type="hidden" name="status" value={s} /><input type="hidden" name="back" value={here} />
                <SubmitButton variant="secondary">{s === "active" ? "Activar" : s === "paused" ? "Pausar" : "Cerrar"}</SubmitButton>
              </form>
            ))}
            <form action={deleteJobAction}><input type="hidden" name="id" value={job.id} />
              <SubmitButton variant="destructive" confirm="¿Eliminar la vacante y todas sus postulaciones? Esta acción no se puede deshacer.">Eliminar</SubmitButton></form>
          </div>
        ) : null} />

      <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
        <span className="text-muted-foreground">Origen:</span>
        {[["", "Todos"], ["EPN", "Postulantes EPN"], ["EXTERNO", "Postulantes externos"]].map(([v, l]) => (
          <Link key={v} href={v ? `?origen=${v}` : "?"} className={`rounded-full border px-3 py-1 ${(origin ?? "") === v ? "border-theme bg-theme text-white" : "hover:bg-muted"}`}>
            {l} ({v ? all.filter((a) => a.student_origin === v).length : all.length})
          </Link>
        ))}
        <span className="ml-auto text-xs text-muted-foreground">Ordenados por afinidad · etiquetas en verde = coinciden con la vacante</span>
      </div>

      {all.length === 0 ? <Empty title="Aún no hay postulantes">Comparte la vacante; los postulantes aparecerán aquí ordenados por afinidad.</Empty> : (
        <div className="grid gap-4 lg:grid-cols-4">
          {APP_STATUSES.map((st) => {
            const col = apps.filter((a) => a.status === st);
            return (
              <div key={st} className="flex flex-col gap-3 rounded-xl bg-slate-100/80 p-3">
                <div className="flex items-center justify-between px-1 text-sm font-medium">{st}<span className="rounded-full bg-white px-2 text-xs tabular-nums">{col.length}</span></div>
                {col.map((a) => (
                  <Card key={a.id} className="flex flex-col gap-2.5 p-3.5">
                    <div className="flex items-start gap-2.5">
                      <Avatar name={a.student_name} size="sm" />
                      <div className="min-w-0 flex-1">
                        <Link href={`/candidatos/${a.student_id}?app=${a.id}`} className="block truncate font-medium hover:text-theme">{a.student_name}</Link>
                        <div className="truncate text-xs text-muted-foreground">{a.student_career || a.student_headline}</div>
                      </div>
                      <ScoreBadge score={a.match_score} />
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={a.student_origin === "EPN" ? "theme" : "secondary"}>{a.student_origin === "EPN" ? "EPN" : "Externo"}</Badge>
                      <Stars value={a.rating} />
                    </div>
                    <TagList tags={a.student_tags} highlight={job.tags} max={4} />
                    <div className="flex flex-wrap gap-1.5 border-t pt-2.5">
                      {NEXT[st].map((to) => (
                        <form key={to} action={updateApplicationAction}>
                          <input type="hidden" name="application_id" value={a.id} /><input type="hidden" name="status" value={to} /><input type="hidden" name="back" value={here} />
                          <SubmitButton size="xs" variant={to === "Rechazado" ? "ghost" : "cancel"} className={to === "Rechazado" ? "text-red-600" : ""}>{to === "Rechazado" ? "Rechazar" : `→ ${to}`}</SubmitButton>
                        </form>
                      ))}
                      <LinkButton href={`/candidatos/${a.student_id}?app=${a.id}`} size="xs" variant="ghost">Ver CV</LinkButton>
                    </div>
                  </Card>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

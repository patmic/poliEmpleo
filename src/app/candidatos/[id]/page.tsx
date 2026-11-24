import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getApplication, getStudent, companyCanSeeStudent, getJob } from "@/lib/data";
import { computeMatch } from "@/lib/match";
import { cvToText } from "@/lib/cv";
import { updateApplicationAction } from "@/app/actions";
import { APP_STATUSES } from "@/lib/catalog";
import { Avatar, Badge, Card, CardBody, CardHeader, Field, LinkButton, ScoreBadge, Select, Stepper, TagList, Textarea, fmtDate } from "@/components/ui";
import { HarvardSheet } from "@/components/HarvardSheet";
import { SubmitButton } from "@/components/SubmitButton";

export const metadata = { title: "Candidato" };

/** Expediente del candidato: perfil + CV Harvard + gestión de la postulación (empresa / administración). */
export default function CandidatePage({ params, searchParams }: { params: { id: string }; searchParams: { app?: string } }) {
  const u = requireUser("company", "admin");
  const s = getStudent(Number(params.id));
  if (!s) notFound();
  // Las empresas pueden ver perfiles en el buscador; el CV completo solo si el estudiante se postuló a una de sus vacantes.
  const fullAccess = u.role === "admin" || companyCanSeeStudent(u.id, s.id);
  const app = searchParams.app ? getApplication(Number(searchParams.app)) : null;
  const validApp = app && app.student_id === s.id && (u.role === "admin" || app.company_id === u.id) ? app : null;
  const job = validApp ? getJob(validApp.job_id) : null;
  const match = job ? computeMatch(s.tags, s.career, job.tags, job.careers, cvToText(s.cv)) : null;

  return (
    <div className="flex flex-col gap-6">
      {validApp ? <Link href={`/empresa/vacantes/${validApp.job_id}`} className="text-sm text-muted-foreground hover:underline">← Postulantes de {validApp.job_title}</Link> : null}
      <Card className="flex flex-col gap-4 p-6 md:flex-row md:items-start">
        <Avatar name={s.name} size="lg" />
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold">{s.name}</h1>
            <Badge variant={s.origin === "EPN" ? "theme" : "secondary"}>{s.condicion || "Postulante"}</Badge>
          </div>
          <div className="mt-1 text-sm text-muted-foreground">{[s.headline, s.career, s.semester, s.institution].filter(Boolean).join(" · ")}</div>
          {s.bio ? <p className="mt-3 max-w-3xl text-[15px] text-slate-700">{s.bio}</p> : null}
          <div className="mt-3"><TagList tags={s.tags} highlight={job?.tags} /></div>
          {fullAccess ? (
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span>{s.email}</span>{s.phone ? <span>{s.phone}</span> : null}<span>Modalidad: {s.modality_pref}</span>{s.gpa ? <span>Promedio: {s.gpa}</span> : null}
            </div>
          ) : null}
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div>
          {fullAccess ? (
            <>
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-semibold">CV · formato Harvard</h2>
                <div className="flex gap-2">
                  {s.cv_file ? <LinkButton href={`/api/files/${s.cv_file}`} variant="cancel" size="sm">PDF original</LinkButton> : null}
                  <LinkButton href={`/api/cv/docx?student=${s.id}`} variant="cancel" size="sm">Descargar Word</LinkButton>
                </div>
              </div>
              <HarvardSheet cv={s.cv} />
              <p className="mt-2 text-xs text-muted-foreground">CV actualizado {fmtDate(s.cv_updated_at)}</p>
            </>
          ) : (
            <Card className="p-6 text-sm text-muted-foreground">El CV completo y los datos de contacto se muestran cuando el candidato se postula a una de tus vacantes.</Card>
          )}
        </div>

        {validApp ? (
          <div className="flex flex-col gap-4">
            <Card>
              <CardHeader title="Postulación" description={`${validApp.job_title} · ${fmtDate(validApp.created_at)}`} action={<ScoreBadge score={validApp.match_score} size="full" />} />
              <CardBody className="flex flex-col gap-4">
                <Stepper status={validApp.status} />
                {match ? <div className="text-xs text-muted-foreground">Coinciden {match.matched.length} de {job!.tags.length} etiquetas{match.missing.length ? ` · faltan: ${match.missing.join(", ")}` : ""}.</div> : null}
                {validApp.message ? <blockquote className="border-l-2 border-theme pl-3 text-sm italic text-slate-600">“{validApp.message}”</blockquote> : null}
                <form action={updateApplicationAction} className="flex flex-col gap-3">
                  <input type="hidden" name="application_id" value={validApp.id} />
                  <input type="hidden" name="back" value={`/candidatos/${s.id}?app=${validApp.id}`} />
                  <Field label="Estado"><Select name="status" defaultValue={validApp.status}>{APP_STATUSES.map((x) => <option key={x}>{x}</option>)}</Select></Field>
                  <Field label="Mensaje al candidato" hint="Se envía en la notificación si cambias el estado."><Textarea name="message" rows={2} placeholder="Ej. Te esperamos el martes 10:00 en nuestras oficinas." /></Field>
                  <Field label="Valoración interna">
                    <Select name="rating" defaultValue={validApp.rating ?? ""}>
                      <option value="">Sin valorar</option>
                      {["Deficiente", "Regular", "Bueno", "Muy bueno", "Excelente"].map((l, i) => <option key={l} value={i + 1}>{"★".repeat(i + 1)} {l}</option>)}
                    </Select>
                  </Field>
                  <Field label="Nota interna" hint="Solo la ve tu empresa."><Textarea name="note" rows={3} defaultValue={validApp.note} /></Field>
                  <SubmitButton>Guardar</SubmitButton>
                </form>
              </CardBody>
            </Card>
            <Card>
              <CardHeader title="Historial" />
              <CardBody>
                <ol className="flex flex-col gap-2 border-l pl-4 text-sm">
                  {validApp.events.map((e, i) => <li key={i}><span className="font-medium">{e.status}</span> <span className="text-muted-foreground">· {fmtDate(e.created_at)}{e.note ? ` — ${e.note}` : ""}</span></li>)}
                </ol>
              </CardBody>
            </Card>
          </div>
        ) : null}
      </div>
    </div>
  );
}

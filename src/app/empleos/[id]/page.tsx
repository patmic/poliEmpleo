import Link from "next/link";
import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getJob, getStudent, studentApplications } from "@/lib/data";
import { applyAction } from "@/app/actions";
import { Alert, Badge, Card, LinkButton, ScoreBadge, Stepper, TagList, Textarea, fmtDate } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { ApplicationCard } from "@/components/ApplicationCard";
import { JobRow } from "@/components/explore/JobRow";

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-sm font-medium text-slate-800">{children}</div>
    </div>
  );
}

export default function JobDetail({ params }: { params: { id: string } }) {
  const user = getSession();
  const studentId = user?.role === "student" ? user.id : undefined;
  const job = getJob(Number(params.id), studentId);
  if (!job) notFound();
  const isOwner = user?.role === "company" && user.id === job.company_id;
  if (job.status !== "active" && !isOwner && user?.role !== "admin" && !job.my_status) notFound();
  const st = studentId ? getStudent(studentId) : null;
  const myApp = studentId ? studentApplications(studentId).find((a) => a.job_id === job.id) : undefined;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="flex flex-col gap-4">
        <Link href="/empleos" className="inline-flex w-fit items-center gap-1 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
          ← Volver
        </Link>
        <div className="flex flex-col gap-6">
            <JobRow r={{ job, hits: job.match?.matched ?? [], coverage: 0 }} selectedCount={0} />

            <section className="flex flex-col gap-5 text-[15px] leading-relaxed">
              <div>
                <h2 className="mb-1 text-lg font-semibold">Descripción</h2>
                <p className="whitespace-pre-line text-slate-700">{job.description}</p>
              </div>
              {job.responsibilities ? (
                <div>
                  <h2 className="mb-1 text-lg font-semibold">Responsabilidades</h2>
                  <p className="whitespace-pre-line text-slate-700">{job.responsibilities}</p>
                </div>
              ) : null}
              {job.requirements ? (
                <div>
                  <h2 className="mb-1 text-lg font-semibold">Requisitos</h2>
                  <p className="whitespace-pre-line text-slate-700">{job.requirements}</p>
                </div>
              ) : null}
              {job.careers.length ? (
                <div>
                  <h2 className="mb-2 text-lg font-semibold">Carreras afines</h2>
                  <TagList tags={job.careers} />
                </div>
              ) : null}
            </section>

            <section className="grid gap-x-8 gap-y-4 rounded-xl border border-slate-200 p-4 sm:grid-cols-3">
              <Campo label="Remuneración">{job.salary}</Campo>
              <Campo label="Fecha límite">{job.deadline ? fmtDate(job.deadline) : "Sin fecha límite"}</Campo>
              <Campo label="Postulantes">{job.applicant_count}</Campo>
              <Campo label="Vacantes">{job.vacancies}</Campo>
              <Campo label="Publicada">{fmtDate(job.created_at)}</Campo>
              <Campo label="Ciudad">{job.city}</Campo>
              <Campo label="Empresa">
                <Link href={`/empresas/${job.company_id}`} className="hover:underline">{job.company_name}</Link>
                {job.company_verified ? <span className="ml-2"><Badge variant="theme">✓ Verificada</Badge></span> : null}
              </Campo>
              {job.status !== "active" ? (
                <Campo label="Estado">
                  <Badge variant="warning">{job.status === "paused" ? "Pausada" : "Cerrada"}</Badge>
                </Campo>
              ) : null}
            </section>
        </div>
      </div>

      <aside className="flex flex-col gap-4">
        {studentId ? (
          myApp ? (
            <ApplicationCard a={myApp} />
          ) : job.status === "active" ? (
            <Card className="p-5">
              <div className="font-medium">Postularme</div>
              {!st?.cv_updated_at ? <div className="mt-3"><Alert title="Aún no tienes CV" variant="theme">La empresa verá tu perfil. <Link className="font-medium text-theme underline" href="/estudiante/cv">Crea tu CV</Link> para mejorar tu afinidad.</Alert></div> : null}
              <form action={applyAction} className="mt-3 flex flex-col gap-3">
                <input type="hidden" name="job_id" value={job.id} />
                <Textarea name="message" placeholder="Mensaje breve para la empresa (opcional)" maxLength={1000} />
                <SubmitButton>Enviar postulación</SubmitButton>
              </form>
              <p className="mt-2 text-xs text-muted-foreground">Se enviará tu perfil y tu CV en formato Harvard.</p>
            </Card>
          ) : null
        ) : null}

        {studentId && job.match ? (
          <Card className="p-5">
            <div className="flex items-center justify-between"><span className="font-medium">Tu afinidad</span><ScoreBadge score={job.match.score} size="full" /></div>
            {job.match.matched.length ? <><div className="mt-3 text-xs text-muted-foreground">Coinciden</div><TagList tags={job.match.matched} highlight={job.match.matched} /></> : null}
            {job.match.missing.length ? <><div className="mt-3 text-xs text-muted-foreground">Te faltan (agrégalas a tu perfil si las dominas)</div><TagList tags={job.match.missing} /></> : null}
          </Card>
        ) : null}

        {!user ? (
          <Card className="p-5"><div className="font-medium">¿Te interesa?</div><p className="mt-1 text-sm text-muted-foreground">Ingresa como estudiante para ver tu afinidad y postularte.</p>
            <LinkButton href={`/login?next=/empleos/${job.id}`} className="mt-3 w-full">Ingresar para postular</LinkButton></Card>
        ) : isOwner ? (
          <Card className="p-5"><LinkButton href={`/empresa/vacantes/${job.id}`} className="w-full">Gestionar postulantes</LinkButton></Card>
        ) : null}
      </aside>
    </div>
  );
}

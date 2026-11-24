import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getStudent, listJobs, studentApplications } from "@/lib/data";
import { APP_STATUSES } from "@/lib/catalog";
import { JobCard } from "@/components/JobCard";
import { HorizontalCarousel } from "@/components/explore/HorizontalCarousel";
import { ApplicationCard } from "@/components/ApplicationCard";
import { Alert, Empty, LinkButton, PageHeader, Stat, daysSince, fmtDate } from "@/components/ui";

export const metadata = { title: "Inicio estudiante" };

/** Inicio del estudiante: resumen, sus postulaciones con filtro por estado y las vacantes recomendadas. */
export default function StudentHome({ searchParams }: { searchParams: { estado?: string } }) {
  const u = requireUser("student");
  const st = getStudent(u.id)!;
  const all = studentApplications(u.id);
  const estado = searchParams.estado;
  const apps = estado ? all.filter((a) => a.status === estado) : all;
  const jobs = listJobs({}, u.id).filter((j) => !j.my_status).sort((a, b) => (b.match?.score ?? 0) - (a.match?.score ?? 0));
  const cvAge = daysSince(st.cv_updated_at);
  const count = (s: string) => all.filter((a) => a.status === s).length;
  const completeness = [st.career, st.headline, st.bio, st.phone, st.tags.length >= 3, st.cv_updated_at].filter(Boolean).length;

  return (
    <>
      <PageHeader title={`Hola, ${st.name.split(" ")[0]}`} description={`${st.career || "Completa tu carrera"} · ${st.origin === "EPN" ? "Escuela Politécnica Nacional" : st.institution}`}
        action={<LinkButton href="/empleos">Explorar vacantes</LinkButton>} />

      {cvAge > 30 ? (
        <div className="mb-6">
          <Alert variant="theme" title={st.cv_updated_at ? "Recordatorio mensual: actualiza tu CV" : "Aún no tienes CV"}
            action={<LinkButton href="/estudiante/cv" size="sm">{st.cv_updated_at ? "Actualizar CV" : "Crear CV"}</LinkButton>}>
            {st.cv_updated_at ? `Última actualización hace ${cvAge} días (${fmtDate(st.cv_updated_at)}). Un CV reciente mejora tu afinidad con las vacantes.`
              : "Crea tu CV en formato Harvard o sube tu PDF para que detectemos tus habilidades."}
          </Alert>
        </div>
      ) : null}

      <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Postulaciones" value={all.length} />
        <Stat label="En revisión" value={count("En revisión")} />
        <Stat label="Entrevistas" value={count("Entrevista")} />
        <Stat label="Perfil completo" value={`${Math.round((completeness / 6) * 100)}%`} hint={completeness < 6 ? "Completa tu perfil y CV" : "¡Excelente!"} />
      </div>

      <section className="mb-10">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-lg font-semibold">Mis postulaciones</h2>
          <div className="flex flex-wrap gap-1.5 text-sm">
            {["", ...APP_STATUSES].map((s) => (
              <Link key={s || "todas"} href={s ? `/estudiante?estado=${encodeURIComponent(s)}` : "/estudiante"}
                className={`rounded-full border px-3 py-1 ${(estado ?? "") === s ? "border-theme bg-theme text-white" : "hover:bg-muted"}`}>
                {s || "Todas"} ({s ? count(s) : all.length})
              </Link>
            ))}
          </div>
        </div>

        {apps.length === 0 ? <Empty title="Sin postulaciones" action={<LinkButton href="/empleos">Buscar vacantes</LinkButton>}>Cuando te postules a una vacante aparecerá aquí con su estado.</Empty> : (
          <div className="flex flex-col gap-4">
            {apps.map((a) => (
              <ApplicationCard key={a.id} a={a} />
            ))}
          </div>
        )}
      </section>

      <section className="min-w-0 rounded-2xl bg-white p-5 ring-1 ring-slate-200">
        <div className="mb-4 flex items-end justify-between">
          <h2 className="text-lg font-semibold">Recomendadas para ti</h2>
          <span className="text-xs text-muted-foreground">{jobs.length} vacante{jobs.length === 1 ? "" : "s"} · desliza para ver más</span>
        </div>
        {jobs.length ? (
          <HorizontalCarousel>
            {jobs.map((j) => <JobCard key={j.id} job={j} showMatch />)}
          </HorizontalCarousel>
        ) : <Empty title="No hay nuevas vacantes">Ya te postulaste a todas las vacantes activas. Vuelve pronto.</Empty>}
      </section>
    </>
  );
}

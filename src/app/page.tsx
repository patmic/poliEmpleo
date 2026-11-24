import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession, homeFor } from "@/lib/auth";
import { listJobs, adminStats } from "@/lib/data";
import { JobCard } from "@/components/JobCard";
import { LinkButton, Stat } from "@/components/ui";
import { DialHero } from "@/components/landing/DialHero";
import { Categorias } from "@/components/landing/Categorias";

export default function Home() {
  const user = getSession();
  if (user) redirect(homeFor(user.role));
  const jobs = listJobs().slice(0, 6);
  const { kpis } = adminStats();
  return (
    <div className="flex flex-col gap-12">
      <section className="relative left-1/2 -mt-8 flex min-h-[calc(100svh-4rem)] w-screen -translate-x-1/2 flex-col items-center justify-center gap-10 bg-white px-6 py-12 text-center text-slate-900">
        <h1 className="sr-only">Conecta tu talento con las empresas que te buscan</h1>
        <DialHero />
        <div className="flex flex-col items-center gap-5">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/registro"
              className="inline-flex items-center gap-3 rounded-full bg-slate-900 px-6 py-3 text-[15px] text-white transition-colors hover:bg-theme"
            >
              Crear cuenta gratis
              <span className="text-[11px] uppercase tracking-[0.12em] opacity-60">Estudiantes y empresas</span>
            </Link>
            <Link
              href="/empleos"
              className="inline-flex items-center rounded-full border border-slate-300 px-6 py-3 text-[15px] transition-colors hover:border-slate-900"
            >
              Ver vacantes
            </Link>
          </div>
          <a href="#que-encuentras" className="text-xs uppercase tracking-[0.25em] text-slate-500 hover:text-slate-900">
            Desplázate para ver
          </a>
        </div>
      </section>

      <section id="conecta" className="scroll-mt-24 rounded-2xl bg-white p-8 ring-1 ring-slate-200 md:p-12">
        <h2 className="mt-3 text-3xl font-semibold leading-tight text-slate-900 md:text-[40px]">Conecta tu talento con las empresas que te buscan</h2>
        <p className="mt-4 max-w-3xl text-base text-slate-600">
          Estudiantes, alumni y empresas encuentran en poliEmpleo las ventajas de la plataforma: prácticas preprofesionales,
          pasantías y vinculación social con su porcentaje de afinidad, y un CV en formato Harvard para los estudiantes y
          alumni, además de publicación de vacantes y filtros por etiquetas para las empresas. Crea tu perfil, publica vacantes
          y gestiona tu proceso de selección en un solo lugar.
        </p>
      </section>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Vacantes activas" value={kpis.activeJobs} />
        <Stat label="Empresas" value={kpis.companies} />
        <Stat label="Postulantes" value={kpis.students} hint={`${kpis.epn} EPN · ${kpis.external} externos`} />
        <Stat label="Contrataciones" value={kpis.selected} hint="candidatos seleccionados" />
      </section>

      <section id="que-encuentras" className="scroll-mt-24">
        <h2 className="mb-4 text-2xl font-semibold text-slate-900">¿Qué encuentras aquí?</h2>
        <Categorias />
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between">
          <h2 className="text-xl font-semibold">Vacantes recientes</h2>
          <LinkButton href="/empleos" variant="link">Ver todas →</LinkButton>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {jobs.map((j) => <JobCard key={j.id} job={j} />)}
        </div>
      </section>
    </div>
  );
}

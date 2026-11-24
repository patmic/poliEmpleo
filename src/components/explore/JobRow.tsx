import Link from "next/link";
import type { Plazo } from "@/lib/data";
import type { RankedJob } from "@/lib/explore";

const PLAZO_BARRA: Record<Plazo["unidad"], string> = {
  H: "bg-rose-500",
  S: "bg-amber-400",
  M: "bg-blue-600",
  A: "bg-blue-600",
  C: "bg-slate-300",
};

function plazoTexto(p: Plazo) {
  if (p.unidad === "A") return "Sin fecha límite";
  if (p.unidad === "C") return "Convocatoria cerrada";
  const n = parseInt(p.etiqueta, 10);
  const unidad = p.unidad === "H" ? "Hr" : p.unidad === "S" ? "Sem" : "Mes";
  return `Cierra en ${n} ${unidad}`;
}

export function JobRow({ r, selectedCount }: { r: RankedJob; selectedCount: number }) {
  const { job } = r;
  const pct = selectedCount ? Math.round(r.coverage * 100) : (job.match?.score ?? null);
  const tone = pct === null ? "" : pct >= 70 ? "bg-emerald-100 text-emerald-700" : pct >= 40 ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700";
  // La barra lateral sigue el color del chip de afinidad; sin afinidad usa el color del plazo.
  const barra = pct === null ? PLAZO_BARRA[job.plazo.unidad] : pct >= 70 ? "bg-emerald-500" : pct >= 40 ? "bg-amber-500" : "bg-rose-500";
  const calificada = job.company_rating > 0;
  return (
    <Link
      href={`/empleos/${job.id}`}
      data-applied-job={job.my_status ? job.id : undefined}
      className={`group block overflow-hidden rounded-xl bg-white shadow-sm transition-colors hover:ring-theme/60 ${
        job.my_status ? "ring-2 ring-theme/50" : "ring-1 ring-slate-200"
      }`}
    >
      <div className="flex items-stretch">
        <div className="flex w-20 shrink-0 flex-col items-center justify-center gap-1 py-2 pl-3 pr-1">
          <div className="relative">
            {/* Logo de la empresa: si no tiene, se muestra un edificio por defecto */}
            <span className={`grid size-14 place-items-center overflow-hidden text-slate-400 ${job.company_logo ? "" : "rounded-full bg-slate-100 ring-2 ring-white shadow-sm"}`}>
              {job.company_logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={job.company_logo} alt={`Logo de ${job.company_name}`} className="size-full object-contain" />
              ) : (
                <svg viewBox="0 0 24 24" className="size-7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M4 21V5a1 1 0 0 1 1-1h8v17M13 9h6a1 1 0 0 1 1 1v11M3 21h18M7.5 8h2M7.5 12h2M7.5 16h2M16 13h1M16 17h1" />
              </svg>
              )}
            </span>
            <span
              title={calificada ? `Empresa calificada: ${job.company_rating.toFixed(1)}` : "Empresa sin calificación"}
              className="absolute -right-1 -top-1 grid size-6 place-items-center rounded-full bg-white shadow ring-1 ring-slate-200"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" strokeWidth="2" strokeLinejoin="round" aria-hidden
                stroke={calificada ? "#f59e0b" : "#94a3b8"} fill={calificada ? "#f59e0b" : "none"}>
                <path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" />
              </svg>
            </span>
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5 py-2 pl-2 pr-4">
          <p className="text-[10px] font-semibold uppercase leading-tight tracking-tight text-slate-900 group-hover:text-theme">{job.title}</p>
          <p className="truncate text-[10px] text-slate-500">{job.company_name} · {job.city}</p>
          <div className="mt-1 flex flex-wrap gap-1 text-[9px]">
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-700">{job.job_type}</span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-700">{job.modality}</span>
            {job.my_status ? <span className="rounded-full bg-theme px-2 py-0.5 text-white">Postulado · {job.my_status}</span> : null}
            {r.hits.map((h) => <span key={h} className="rounded-full bg-teal-50 px-2 py-0.5 text-theme">✓ {h}</span>)}
          </div>
        </div>

        <span aria-hidden title={`Plazo: ${job.plazo.etiqueta}`} className={`w-[3px] shrink-0 ${barra}`} />

        <aside className="flex w-36 shrink-0 flex-col justify-center gap-1 py-2 pl-2 pr-3 text-[11px] font-medium text-slate-700">
          {pct !== null ? <span className={`self-start rounded-full px-2 py-0.5 text-[10px] font-semibold ${tone}`}>{pct}%</span> : null}
          <Dato icono={<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>} texto={plazoTexto(job.plazo)} />
          <Dato icono={<><circle cx="9" cy="8" r="3" /><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M16 11a3 3 0 1 0 0-6M18 14c2 .6 3 2.6 3 6" /></>} texto={`${job.vacancies} ${job.vacancies === 1 ? "vacante" : "vacantes"}`} />
        </aside>
      </div>
    </Link>
  );
}

function Dato({ icono, texto }: { icono: React.ReactNode; texto: string }) {
  return (
    <div className="flex items-center gap-2 text-slate-700">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="shrink-0">{icono}</svg>
      <span>{texto}</span>
    </div>
  );
}

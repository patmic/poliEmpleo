"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { Job, Plazo } from "@/lib/data";
import { QUICK_OPTIONS, kindOf, rankJobs, type RankedJob } from "@/lib/explore";
import { FilterModal } from "./FilterModal";
import { JobRow } from "./JobRow";
import { FotoPerfil } from "./FotoPerfil";
import { VerticalCarousel } from "./VerticalCarousel";

interface Viewer { name: string; role: string }
interface Perfil { foto: string; headline: string; bio: string }
interface Props { jobs: Job[]; viewer: Viewer | null; cvPercent: number; cvMissing: string[]; perfil?: Perfil | null }
const BTN_ICONO = "grid size-8 place-items-center text-[#1f2a5c] transition-colors hover:text-theme";
const BTN_NAVY = "grid size-8 place-items-center rounded-full bg-[#1f2a5c] text-white shadow-md ring-2 ring-white transition-colors hover:bg-[#2c3b7d]";
interface Line { id: string; d: string; on: boolean }

const QUICK = QUICK_OPTIONS.map((o) => o.label);
const KIND_DOT: Record<string, string> = { Tipo: "bg-theme", Modalidad: "bg-sky-500", Carrera: "bg-violet-500", Habilidad: "bg-amber-500" };
// Términos de la nube: los disponibles son más grandes y los seleccionados más pequeños.
const CHIP_OFF = "max-w-[9rem] px-2.5 py-1 text-xs";
const CHIP_ON = "max-w-[8rem] px-2 py-px text-[10px]";

// Desplazamiento fijo por término para que la nube se vea orgánica (no en columna).
const curve = (x1: number, y1: number, x2: number, y2: number) => {
  const mx = (x1 + x2) / 2;
  return `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`;
};

export function ExploreStage({ jobs, viewer, cvPercent, cvMissing, perfil = null }: Props) {
  const router = useRouter();
  const fotoInput = useRef<HTMLInputElement>(null);
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [errorFoto, setErrorFoto] = useState("");

  // Solo cambia la foto: el lápiz de la foto abre el selector y sube el archivo.
  async function subirFoto(archivo: File) {
    setErrorFoto("");
    setSubiendoFoto(true);
    try {
      const body = new FormData();
      body.append("foto", archivo);
      const r = await fetch("/api/foto", { method: "POST", body });
      const datos = await r.json().catch(() => ({}));
      if (!r.ok) { setErrorFoto(datos.error ?? "No se pudo subir la foto."); return; }
      router.refresh();
    } catch {
      setErrorFoto("Sin conexión con el servidor. Intenta de nuevo.");
    } finally {
      setSubiendoFoto(false);
      if (fotoInput.current) fotoInput.current.value = "";
    }
  }
  const esEstudiante = viewer?.role === "student";
  const [nodes, setNodes] = useState<string[]>(QUICK);
  const [selected, setSelected] = useState<string[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [lines, setLines] = useState<Line[]>([]);
  const stageRef = useRef<HTMLDivElement>(null);
  const hubRef = useRef<HTMLDivElement>(null);
  const chipEls = useRef(new Map<string, HTMLElement>());
  const appliedEls = useRef(new Map<number, SVGPathElement>());

  const ranked = useMemo(() => rankJobs(jobs, selected), [jobs, selected]);
  const applied = useMemo(() => jobs.filter((j) => j.my_status), [jobs]);
  const appliedKey = applied.map((j) => j.id).join(",");

  const applyFilters = (sel: string[]) => {
    setNodes((n) => [...n, ...sel.filter((x) => !n.includes(x))]);
    setSelected(sel);
    setModalOpen(false);
  };
  const toggle = (label: string) =>
    setSelected((s) => (s.includes(label) ? s.filter((x) => x !== label) : [...s, label]));
  const removeNode = (label: string) => {
    setNodes((n) => n.filter((x) => x !== label));
    setSelected((s) => s.filter((x) => x !== label));
  };

  // Líneas de la nube de términos hacia el centro (se miden las posiciones reales en pantalla).
  const measure = useCallback(() => {
    const stage = stageRef.current;
    const hub = hubRef.current;
    if (!stage || !hub) return;
    const s = stage.getBoundingClientRect();
    const h = hub.getBoundingClientRect();
    const hx = h.left + h.width / 2 - s.left;
    const hy = h.top + h.height / 2 - s.top;
    const next: Line[] = [];
    chipEls.current.forEach((el, id) => {
      const r = el.getBoundingClientRect();
      const x1 = r.left + r.width / 2 - s.left;
      const y1 = r.top + r.height / 2 - s.top;
      next.push({ id, d: curve(x1, y1, hx, hy), on: selected.includes(id) });
    });
    setLines(next);
  }, [selected]);

  useLayoutEffect(() => {
    measure();
    const ro = new ResizeObserver(() => measure());
    if (stageRef.current) ro.observe(stageRef.current);
    return () => ro.disconnect();
  }, [measure, nodes]);

  // Líneas de las vacantes a las que el usuario ya postuló: siguen la tarjeta mientras la lista se mueve.
  useEffect(() => {
    if (!appliedKey) return;
    let frame = 0;
    const tick = () => {
      const stage = stageRef.current;
      const hub = hubRef.current;
      if (stage && hub) {
        const s = stage.getBoundingClientRect();
        const h = hub.getBoundingClientRect();
        const hx = h.left + h.width / 2 - s.left;
        const hy = h.top + h.height / 2 - s.top;
        const seen = new Set<number>();
        stage.querySelectorAll<HTMLElement>("[data-applied-job]").forEach((card) => {
          if (card.closest('[aria-hidden="true"]')) return; // copia duplicada del carrusel
          const id = Number(card.dataset.appliedJob);
          const path = appliedEls.current.get(id);
          const clip = card.closest<HTMLElement>("[data-carousel]");
          if (!path || !clip) return;
          seen.add(id);
          const c = clip.getBoundingClientRect();
          const r = card.getBoundingClientRect();
          const cy = r.top + r.height / 2;
          const visible = cy > c.top + 8 && cy < c.bottom - 8;
          path.setAttribute("d", curve(hx, hy, r.left - s.left, cy - s.top));
          path.setAttribute("opacity", visible ? "1" : "0");
        });
        appliedEls.current.forEach((path, id) => {
          if (!seen.has(id)) path.setAttribute("opacity", "0");
        });
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [appliedKey]);

  const fotoActual = esEstudiante ? perfil?.foto ?? "" : "";
  const primerNombre = viewer ? viewer.name.split(" ")[0] : "Visitante";
  const sortLabel = selected.length
    ? "coincidencia con tu filtro"
    : viewer?.role === "student" ? "tu afinidad con cada empresa" : "más recientes";

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden py-2 text-slate-900 md:py-4"
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(20,89,98,0.07),transparent_60%)]" />

      <div className="relative mb-6 flex flex-wrap items-center justify-end gap-3">
        {selected.length ? (
          <button onClick={() => setSelected([])} className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200">
            Quitar filtros ({selected.length})
          </button>
        ) : null}
      </div>

      <div ref={stageRef} className="relative grid gap-6 lg:grid-cols-[200px_260px_minmax(0,1fr)]">
        <svg aria-hidden className="pointer-events-none absolute inset-0 hidden h-full w-full lg:block">
          {lines.map((l) => (
            <path
              key={l.id}
              d={l.d}
              fill="none"
              stroke={l.on ? "#145962" : "#cbd5e1"}
              strokeWidth={l.on ? 2 : 1}
              className={l.on ? "flow-line" : undefined}
            />
          ))}
          {applied.map((j) => (
            <path
              key={j.id}
              ref={(el) => { if (el) appliedEls.current.set(j.id, el); else appliedEls.current.delete(j.id); }}
              fill="none"
              stroke="#145962"
              strokeWidth={2}
              strokeLinecap="round"
              pathLength={1}
              className="draw-in"
              opacity={0}
            />
          ))}
        </svg>

        {/* Izquierda: nube de términos (chips) conectados al centro */}
        <div className="relative z-10 flex flex-col items-start gap-3 pl-1">
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-theme px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-theme-hover"
        >
            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
              <path d="M4 6h16M7 12h10M10 18h4" />
            </svg>
            Filtros
        </button>
          <div
            onScroll={measure}
            className="flex max-h-[430px] flex-col items-start justify-center gap-2 overflow-y-auto py-4"
          >
          {nodes.map((label) => {
            const on = selected.includes(label);
            const kind = kindOf(label);
            const custom = !QUICK.includes(label);
            return (
              <span key={label} className="inline-flex items-center gap-1">
                <button
                  ref={(el) => { if (el) chipEls.current.set(label, el); else chipEls.current.delete(label); }}
                  onClick={() => toggle(label)}
                  aria-pressed={on}
                  className={`inline-flex items-center justify-center gap-1.5 rounded-full transition-all ${on ? CHIP_ON : CHIP_OFF} ${
                    on ? "bg-theme font-semibold text-white shadow-md" : "bg-white text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <span className={`size-1.5 shrink-0 rounded-full ${KIND_DOT[kind]}`} />
                  <span className="truncate" title={label}>{label}</span>
                </button>
                {custom ? (
                  <button onClick={() => removeNode(label)} aria-label={`Quitar ${label}`} className="text-xs text-slate-400 hover:text-slate-700">×</button>
                ) : null}
              </span>
            );
          })}
          </div>
        </div>

        {/* Centro: usuario y porcentaje de personalización del CV */}
        <div className="relative z-10 flex flex-col items-center justify-center gap-4 py-4">
          <motion.div
            ref={hubRef}
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 120, damping: 14 }}
            className="relative grid size-56 place-items-center"
          >
            <span aria-hidden className="ring-pulse absolute inset-6 rounded-full border border-theme/40" />
            <span aria-hidden className="ring-pulse absolute inset-6 rounded-full border border-theme/25 [animation-delay:1.2s]" />
            <svg viewBox="0 0 160 160" className="absolute inset-0 -rotate-90" aria-hidden>
              <circle cx="80" cy="80" r="72" fill="none" stroke="#e2e8f0" strokeWidth="8" />
              <motion.circle
                cx="80" cy="80" r="72" fill="none" stroke="#145962" strokeWidth="8" strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: cvPercent / 100 }}
                transition={{ duration: 1.2, ease: "easeOut" }}
              />
            </svg>
            <div className="relative grid size-40 place-items-center rounded-full bg-white shadow-[0_0_50px_rgba(20,89,98,0.18)] ring-1 ring-slate-200">
              <FotoPerfil key={fotoActual} foto={fotoActual} alt={`Foto de ${primerNombre}`} className="size-36 rounded-full object-cover" />
              {esEstudiante ? (
                <>
                  <input
                    ref={fotoInput}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) subirFoto(f); }}
                  />
                  <button
                    type="button"
                    aria-label="Actualizar foto"
                    title="Actualizar foto"
                    disabled={subiendoFoto}
                    onClick={() => fotoInput.current?.click()}
                    className={`${BTN_ICONO} absolute bottom-1 left-1/2 -translate-x-1/2 disabled:opacity-50`}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4" /></svg>
                  </button>
                </>
              ) : null}
            </div>
          </motion.div>

          {esEstudiante && (subiendoFoto || errorFoto) ? (
            <p role="status" className={`text-xs ${errorFoto ? "text-rose-600" : "text-slate-500"}`}>
              {errorFoto || "Subiendo foto..."}
            </p>
          ) : null}

          {!viewer ? (
            <div className="flex flex-col items-center gap-3 text-center">
              <p className="text-sm font-medium text-slate-800">Visitante</p>
              <Link href="/login" className="rounded-full bg-theme px-6 py-2 text-sm font-semibold text-white hover:bg-theme-hover">Ingresar</Link>
            </div>
          ) : esEstudiante ? (
            <div className="flex flex-col items-center gap-0 text-center">
              <p className="text-sm font-semibold text-black">{viewer.name}</p>
              {perfil?.headline ? <p className="max-w-60 text-sm text-slate-500">{perfil.headline}</p> : null}
              <Link href="/estudiante/cv" className="mt-3 inline-flex items-center gap-2 rounded-full bg-theme px-5 py-2 text-sm font-semibold text-white hover:bg-theme-hover">
                CV <span>{cvPercent} %</span>
              </Link>
            </div>
          ) : (
            <div className="text-sm font-medium">{viewer.name}</div>
          )}
        </div>

        {/* Derecha: vacantes en carrusel; las postuladas se unen al centro con una línea */}
        <div className="relative z-10 flex flex-col gap-3">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>{ranked.length} vacante{ranked.length === 1 ? "" : "s"}</span>
            <span>Ordenadas por {sortLabel}</span>
          </div>
          <div className="relative overflow-hidden rounded-2xl [mask-image:linear-gradient(to_bottom,transparent,black_6%,black_94%,transparent)]">
            {ranked.length === 0 ? (
              <div className="grid h-[480px] place-items-center p-6 text-center">
                <div>
                  <p className="font-medium text-slate-800">Sin vacantes con esas opciones</p>
                  <p className="mt-1 text-sm text-slate-500">Quita algún filtro o prueba con otra opción.</p>
                </div>
              </div>
            ) : (
              <VerticalCarousel>
                <JobColumn items={ranked} selectedCount={selected.length} />
              </VerticalCarousel>
            )}
          </div>
        </div>
      </div>

      <FilterModal open={modalOpen} initial={selected} onClose={() => setModalOpen(false)} onApply={applyFilters} />
    </motion.section>
  );
}

function JobColumn({ items, selectedCount }: { items: RankedJob[]; selectedCount: number }) {
  return (
    <div className="flex flex-col gap-3 p-3">
      {items.map((r) => <JobRow key={r.job.id} r={r} selectedCount={selectedCount} />)}
    </div>
  );
}


"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { ALL_TAGS, CAREERS, JOB_TYPES, MODALITIES } from "@/lib/catalog";

interface Props { open: boolean; initial: string[]; onClose: () => void; onApply: (selected: string[]) => void }

const SELECTS: { label: string; options: readonly string[] }[] = [
  { label: "Tipo de empleo", options: JOB_TYPES },
  { label: "Modalidad", options: MODALITIES },
  { label: "Carrera", options: CAREERS },
];

/** Ventana "Filtros y etiquetas": desplegables de tipo, modalidad y carrera, etiquetas y un solo modo de coincidencia (alguna). */
export function FilterModal({ open, initial, onClose, onApply }: Props) {
  const [draft, setDraft] = useState<string[]>(initial);
  const [tagQuery, setTagQuery] = useState("");

  useEffect(() => {
    if (open) { setDraft(initial); setTagQuery(""); }
  }, [open, initial]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const toggle = (o: string) => setDraft((d) => (d.includes(o) ? d.filter((x) => x !== o) : [...d, o]));
  const add = (o: string) => setDraft((d) => (d.includes(o) ? d : [...d, o]));
  const visibleTags = useMemo(
    () => ALL_TAGS.filter((t) => t.toLowerCase().includes(tagQuery.trim().toLowerCase())),
    [tagQuery],
  );

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="filter-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
          className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4"
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Filtros y etiquetas"
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200"
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-slate-900">Filtros y etiquetas</h2>
              <button onClick={onClose} aria-label="Cerrar" className="grid size-8 place-items-center rounded-full text-slate-500 hover:bg-slate-100">×</button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5">
              <div className="grid gap-4 sm:grid-cols-3">
                {SELECTS.map((s) => (
                  <label key={s.label} className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
                    {s.label}
                    <select
                      value=""
                      onChange={(e) => { if (e.target.value) add(e.target.value); }}
                      className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm font-normal text-slate-900 focus:border-theme focus:outline-none focus:ring-2 focus:ring-theme/30"
                    >
                      <option value="">Cualquiera</option>
                      {s.options.map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </label>
                ))}
              </div>

              {draft.length ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {draft.map((o) => (
                    <button key={o} onClick={() => toggle(o)} className="rounded-full bg-theme px-3 py-1 text-xs font-medium text-white hover:bg-theme-hover">
                      {o} ×
                    </button>
                  ))}
                </div>
              ) : null}

              <div className="mt-6">
                <p className="mb-2 text-sm font-medium text-slate-700">Etiquetas</p>
                <input
                  value={tagQuery}
                  onChange={(e) => setTagQuery(e.target.value)}
                  placeholder="Filtrar etiquetas…"
                  className="mb-3 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-theme focus:outline-none focus:ring-2 focus:ring-theme/30"
                />
                <div className="flex flex-wrap gap-2">
                  {visibleTags.map((t) => {
                    const on = draft.includes(t);
                    return (
                      <button
                        key={t}
                        aria-pressed={on}
                        onClick={() => toggle(t)}
                        className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                          on ? "border-theme bg-theme text-white" : "border-slate-300 bg-white text-slate-700 hover:border-theme"
                        }`}
                      >
                        {t}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
              <button onClick={() => setDraft([])} className="text-sm font-medium text-slate-600 hover:text-slate-900">Limpiar</button>
              <button onClick={() => onApply(draft)} className="rounded-lg bg-theme px-5 py-2.5 text-sm font-semibold text-white hover:bg-theme-hover">
                Aplicar y buscar
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

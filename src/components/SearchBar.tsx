"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface Props { tags: string[]; careers: readonly string[]; modalities: readonly string[]; canSeeStudents: boolean }

/** Buscador global de la barra superior + ventana emergente de filtros y etiquetas. */
export function SearchBar({ tags, careers, modalities, canSeeStudents }: Props) {
  const router = useRouter();
  const sp = useSearchParams();
  const [q, setQ] = useState(sp.get("q") ?? "");
  const [open, setOpen] = useState(false);
  const [cat, setCat] = useState(sp.get("cat") ?? "all");
  const [modality, setModality] = useState(sp.get("modality") ?? "");
  const [career, setCareer] = useState(sp.get("career") ?? "");
  const [sel, setSel] = useState<string[]>(sp.getAll("tag"));
  const [mode, setMode] = useState(sp.get("mode") ?? "or");
  const [tagQ, setTagQ] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const go = () => {
    const p = new URLSearchParams();
    if (q.trim()) p.set("q", q.trim());
    if (cat !== "all") p.set("cat", cat);
    if (modality) p.set("modality", modality);
    if (career) p.set("career", career);
    sel.forEach((t) => p.append("tag", t));
    if (sel.length > 1 && mode === "and") p.set("mode", "and");
    setOpen(false);
    router.push(`/buscar?${p.toString()}`);
  };
  const activeFilters = (cat !== "all" ? 1 : 0) + (modality ? 1 : 0) + (career ? 1 : 0) + sel.length;

  return (
    <>
      <form onSubmit={(e) => { e.preventDefault(); go(); }} className="flex w-full max-w-md items-center gap-1.5" role="search">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={canSeeStudents ? "Buscar vacantes, empresas o estudiantes…" : "Buscar vacantes o empresas…"}
          aria-label="Buscar" className="h-8 w-full min-w-0 rounded-md border border-input bg-white px-2.5 text-sm outline-none focus-visible:border-theme" />
        <button type="submit" className="inline-flex h-8 shrink-0 items-center rounded-md bg-theme px-3 text-xs font-semibold text-white hover:bg-theme-hover">Buscar</button>
      </form>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/30 p-4 pt-20 backdrop-blur-[2px]" onClick={() => setOpen(false)}>
          <div role="dialog" aria-modal="true" aria-label="Filtros de búsqueda" onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl rounded-xl border bg-white p-6 text-sm shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Filtros y etiquetas</h2>
              <button onClick={() => setOpen(false)} aria-label="Cerrar" className="text-xl leading-none text-muted-foreground">×</button>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <label className="flex flex-col gap-1.5"><span className="font-medium">Buscar en</span>
                <select value={cat} onChange={(e) => setCat(e.target.value)} className="h-9 rounded-md border border-input bg-white px-2">
                  <option value="all">Todo</option><option value="jobs">Vacantes</option><option value="companies">Empresas</option>
                  {canSeeStudents ? <option value="students">Postulantes</option> : null}
                </select></label>
              <label className="flex flex-col gap-1.5"><span className="font-medium">Modalidad</span>
                <select value={modality} onChange={(e) => setModality(e.target.value)} className="h-9 rounded-md border border-input bg-white px-2">
                  <option value="">Cualquiera</option>{modalities.map((m) => <option key={m}>{m}</option>)}
                </select></label>
              <label className="flex flex-col gap-1.5"><span className="font-medium">Carrera</span>
                <select value={career} onChange={(e) => setCareer(e.target.value)} className="h-9 rounded-md border border-input bg-white px-2">
                  <option value="">Cualquiera</option>{careers.map((m) => <option key={m}>{m}</option>)}
                </select></label>
            </div>
            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-medium">Etiquetas</span>
                <div className="flex overflow-hidden rounded-md border text-xs">
                  <button type="button" onClick={() => setMode("or")} className={`px-2.5 py-1 ${mode === "or" ? "bg-theme text-white" : ""}`}>Alguna (OR)</button>
                  <button type="button" onClick={() => setMode("and")} className={`px-2.5 py-1 ${mode === "and" ? "bg-theme text-white" : ""}`}>Todas (AND)</button>
                </div>
              </div>
              <input value={tagQ} onChange={(e) => setTagQ(e.target.value)} placeholder="Filtrar etiquetas…" className="mb-2 h-8 w-full rounded-md border border-input px-2.5 outline-none focus-visible:border-theme" />
              <div className="flex max-h-48 flex-wrap gap-1.5 overflow-y-auto">
                {tags.filter((t) => t.toLowerCase().includes(tagQ.toLowerCase())).map((t) => {
                  const on = sel.includes(t);
                  return (
                    <button type="button" key={t} onClick={() => setSel((s) => (on ? s.filter((x) => x !== t) : [...s, t]))}
                      className={`h-6 rounded-full border px-2.5 text-xs font-medium ${on ? "border-theme bg-theme text-white" : "border-border hover:bg-muted"}`}>{t}</button>
                  );
                })}
              </div>
            </div>
            <div className="mt-6 flex justify-between gap-2">
              <button type="button" onClick={() => { setCat("all"); setModality(""); setCareer(""); setSel([]); setMode("or"); }} className="h-[34px] rounded-md px-3 text-sm font-medium hover:bg-muted">Limpiar</button>
              <button type="button" onClick={go} className="h-[34px] rounded-md bg-theme px-4 text-sm font-semibold text-white hover:bg-theme-hover">Aplicar y buscar</button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

"use client";
import { useMemo, useState } from "react";

/** Selector de etiquetas: catálogo por categoría, búsqueda y etiquetas personalizadas.
 *  Envía el valor como un input oculto "tags" con las etiquetas separadas por "|".
 *  Con `full`: no muestra la caja de seleccionadas (lo marcado en la lista ya es la selección),
 *  la lista es más alta y las etiquetas personalizadas aparecen en su propia categoría. */
export function TagPicker({ catalog, initial = [], name = "tags", max = 30, full = false }: { catalog: Record<string, string[]>; initial?: string[]; name?: string; max?: number; full?: boolean }) {
  const [selected, setSelected] = useState<string[]>(initial);
  const [q, setQ] = useState("");
  const toggle = (t: string) =>
    setSelected((s) => (s.some((x) => x.toLowerCase() === t.toLowerCase()) ? s.filter((x) => x.toLowerCase() !== t.toLowerCase()) : s.length >= max ? s : [...s, t]));
  const filtered = useMemo(() => {
    const out: [string, string[]][] = [];
    for (const [cat, list] of Object.entries(catalog)) {
      const l = list.filter((t) => t.toLowerCase().includes(q.toLowerCase()));
      if (l.length) out.push([cat, l]);
    }
    if (full) {
      const catalogLower = Object.values(catalog).flat().map((t) => t.toLowerCase());
      const custom = selected.filter((t) => !catalogLower.includes(t.toLowerCase()) && t.toLowerCase().includes(q.toLowerCase()));
      if (custom.length) out.push(["Personalizadas", custom]);
    }
    return out;
  }, [catalog, q, selected, full]);
  const canAdd = q.trim().length > 1 && !Object.values(catalog).flat().concat(selected).some((t) => t.toLowerCase() === q.trim().toLowerCase());
  const isOn = (t: string) => selected.some((x) => x.toLowerCase() === t.toLowerCase());
  return (
    <div className="flex flex-col gap-3">
      <input type="hidden" name={name} value={selected.join("|")} />
      {full ? null : (
        <div className="flex min-h-9 flex-wrap gap-1.5 rounded-md border border-input p-2">
          {selected.length === 0 ? <span className="text-sm text-muted-foreground">Sin etiquetas seleccionadas</span> : null}
          {selected.map((t) => (
            <button type="button" key={t} onClick={() => toggle(t)} className="inline-flex h-6 items-center gap-1 rounded-full bg-theme px-2.5 text-xs font-medium text-white hover:bg-theme-hover" aria-label={`Quitar ${t}`}>
              {t} <span aria-hidden>×</span>
            </button>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar o crear etiqueta…"
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); if (canAdd) { toggle(q.trim()); setQ(""); } } }}
          className="h-8 w-full rounded-md border border-input px-2.5 text-sm outline-none focus-visible:border-theme" />
        {canAdd ? (
          <button type="button" onClick={() => { toggle(q.trim()); setQ(""); }} className="h-8 shrink-0 rounded-md border border-slate-300 px-3 text-xs font-medium hover:bg-slate-50">
            + Crear «{q.trim()}»
          </button>
        ) : null}
      </div>
      <div className={`flex flex-col gap-3 overflow-y-auto pr-1 ${full ? "h-[65vh] min-h-[420px]" : "max-h-56"}`}>
        {filtered.map(([cat, list]) => (
          <div key={cat}>
            <div className="mb-1.5 text-xs font-medium text-muted-foreground">{cat}</div>
            <div className="flex flex-wrap gap-1.5">
              {list.map((t) => (
                <button type="button" key={t} onClick={() => toggle(t)}
                  className={`h-6 rounded-full border px-2.5 text-xs font-medium transition-colors ${isOn(t) ? "border-theme bg-theme/10 text-theme" : "border-border text-foreground hover:bg-muted"}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

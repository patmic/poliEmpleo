import type { CompanyLogo } from "@/lib/data";

export function MarqueeEmpresas({ empresas }: { empresas: CompanyLogo[] }) {
  if (!empresas.length) return null;
  // Se duplica la lista para que la animación se repita sin saltos.
  const pista = [...empresas, ...empresas];
  return (
    <section className="mx-auto mt-10 w-full max-w-4xl overflow-hidden">
      <h2 className="mb-4 text-center text-lg font-semibold">Estas empresas necesitan tu talento</h2>
      <div className="marquee-track flex w-max gap-4 py-1">
        {pista.map((e, i) => (
          <div key={`${e.id}-${i}`} className="flex w-60 shrink-0 items-center gap-3 rounded-xl border bg-white p-3 shadow-sm">
            <span className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-lg bg-slate-50 text-sm font-semibold text-slate-400">
              {e.logo ? <img src={e.logo} alt={`Logo de ${e.name}`} className="size-full object-contain" /> : e.name.charAt(0).toUpperCase()}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">{e.name}</span>
              <span className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="rounded-full bg-theme/10 px-2 py-0.5 font-semibold text-theme">{e.vacantes}</span>
                vacante{e.vacantes === 1 ? "" : "s"} activa{e.vacantes === 1 ? "" : "s"}
              </span>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

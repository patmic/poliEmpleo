import type { PostulanteCard } from "@/lib/data";

export function MarqueePostulantes({ postulantes }: { postulantes: PostulanteCard[] }) {
  if (!postulantes.length) return null;
  // Se duplica la lista para que la animación se repita sin saltos.
  const pista = [...postulantes, ...postulantes];
  return (
    <section className="w-full overflow-hidden">
      <h2 className="mb-4 text-xl font-semibold text-slate-900">Postulantes en poliEmpleo</h2>
      <div className="marquee-track flex w-max gap-4 py-1">
        {pista.map((p, i) => (
          <div key={`${p.id}-${i}`} className="flex w-60 shrink-0 items-center gap-3 rounded-xl border bg-white p-3 shadow-sm">
            <span className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-full bg-slate-100 text-sm font-semibold text-slate-400">
              {p.foto ? <img src={p.foto} alt={`Foto de ${p.name}`} className="size-full object-cover" /> : p.name.charAt(0).toUpperCase()}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">{p.name}</span>
              <span className="block truncate text-xs text-muted-foreground">{p.career || (p.origin === "EXTERNO" ? "Externo" : "Estudiante EPN")}</span>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

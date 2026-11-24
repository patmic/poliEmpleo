import Link from "next/link";
import { getSession } from "@/lib/auth";
import { searchAll } from "@/lib/data";
import { JobCard } from "@/components/JobCard";
import { Avatar, Badge, Card, Empty, PageHeader, TagList } from "@/components/ui";

export const metadata = { title: "Buscar" };

type SP = { q?: string; cat?: string; modality?: string; career?: string; tag?: string | string[]; mode?: string };

export default function SearchPage({ searchParams: sp }: { searchParams: SP }) {
  const user = getSession();
  const tags = sp.tag ? (Array.isArray(sp.tag) ? sp.tag : [sp.tag]) : [];
  const p = { q: sp.q ?? "", cat: sp.cat ?? "all", modality: sp.modality ?? "", career: sp.career ?? "", tags, mode: (sp.mode === "and" ? "and" : "or") as "and" | "or" };
  const r = searchAll(p, user?.role ?? null, user?.role === "student" ? user.id : undefined);
  const total = r.jobs.length + r.companies.length + r.students.length;
  const chips = [p.q && `«${p.q}»`, p.cat !== "all" && { jobs: "Vacantes", companies: "Empresas", students: "Postulantes" }[p.cat], p.modality, p.career,
    ...tags.map((t) => `#${t}`), tags.length > 1 && (p.mode === "and" ? "todas las etiquetas" : "alguna etiqueta")].filter(Boolean) as string[];
  return (
    <>
      <PageHeader title="Resultados de búsqueda" description={`${total} resultado${total === 1 ? "" : "s"}`} />
      {chips.length ? <div className="-mt-3 mb-6 flex flex-wrap gap-1.5">{chips.map((c) => <Badge key={c} variant="outline">{c}</Badge>)}</div> : null}
      {total === 0 ? <Empty title="Sin coincidencias">Prueba con otra palabra o ajusta las etiquetas desde «Filtros» en la página de empleos.</Empty> : null}

      {r.jobs.length ? (
        <section className="mb-8"><h2 className="mb-3 text-lg font-semibold">Vacantes ({r.jobs.length})</h2>
          <div className="grid gap-4 md:grid-cols-2">{r.jobs.map((j) => <JobCard key={j.id} job={j} showMatch={user?.role === "student"} />)}</div></section>
      ) : null}

      {r.companies.length ? (
        <section className="mb-8"><h2 className="mb-3 text-lg font-semibold">Empresas ({r.companies.length})</h2>
          <div className="grid gap-4 md:grid-cols-2">{r.companies.map((c) => (
            <Card key={c.id} className="flex gap-4 p-5">
              <Avatar name={c.name} />
              <div className="min-w-0 flex-1">
                <Link href={`/empresas/${c.id}`} className="font-medium hover:text-theme">{c.name}</Link> {c.verified ? <span className="text-theme">✓</span> : null}
                <div className="text-sm text-muted-foreground">{c.sector} · {c.city}</div>
                <div className="mt-2"><TagList tags={c.tags} highlight={tags} max={6} /></div>
              </div>
            </Card>))}</div></section>
      ) : null}

      {r.students.length ? (
        <section><h2 className="mb-3 text-lg font-semibold">Postulantes ({r.students.length})</h2>
          <div className="grid gap-4 md:grid-cols-2">{r.students.map((s) => (
            <Card key={s.id} className="flex gap-4 p-5">
              <Avatar name={s.name} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2"><Link href={`/candidatos/${s.id}`} className="font-medium hover:text-theme">{s.name}</Link>
                  <Badge variant={s.origin === "EPN" ? "theme" : "secondary"}>{s.origin === "EPN" ? "EPN" : "Externo"}</Badge></div>
                <div className="text-sm text-muted-foreground">{s.headline || s.career} · {s.modality_pref}</div>
                <div className="mt-2"><TagList tags={s.tags} highlight={tags} max={6} /></div>
              </div>
            </Card>))}</div></section>
      ) : null}
    </>
  );
}

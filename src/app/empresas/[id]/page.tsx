import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getCompany, listJobs } from "@/lib/data";
import { JobCard } from "@/components/JobCard";
import { Avatar, Badge, Card, Empty, TagList } from "@/components/ui";

export default function CompanyPage({ params }: { params: { id: string } }) {
  const c = getCompany(Number(params.id));
  if (!c || !c.active) notFound();
  const user = getSession();
  const jobs = listJobs({ companyId: c.id }, user?.role === "student" ? user.id : undefined);
  return (
    <div className="flex flex-col gap-6">
      <Card className="flex flex-col gap-4 p-6 md:flex-row md:items-start">
        <Avatar name={c.name} size="lg" />
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold">{c.name}</h1>
            {c.verified ? <Badge variant="theme">✓ Empresa verificada</Badge> : <Badge variant="warning">Verificación pendiente</Badge>}
          </div>
          <div className="mt-1 text-sm text-muted-foreground">{[c.sector, c.size, c.city].filter(Boolean).join(" · ")}</div>
          {c.description ? <p className="mt-3 max-w-3xl text-[15px] text-slate-700">{c.description}</p> : null}
          <div className="mt-3"><TagList tags={c.tags} /></div>
          {c.website ? <a href={c.website} target="_blank" rel="noreferrer noopener" className="mt-3 inline-block text-sm font-medium text-theme hover:underline">{c.website}</a> : null}
        </div>
      </Card>
      <h2 className="text-lg font-semibold">Vacantes activas ({jobs.length})</h2>
      {jobs.length ? <div className="grid gap-4 md:grid-cols-2">{jobs.map((j) => <JobCard key={j.id} job={j} showMatch={user?.role === "student"} />)}</div>
        : <Empty title="Sin vacantes activas">Esta empresa no tiene ofertas publicadas en este momento.</Empty>}
    </div>
  );
}

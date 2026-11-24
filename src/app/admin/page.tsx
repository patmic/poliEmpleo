import { requireUser } from "@/lib/auth";
import { adminStats } from "@/lib/data";
import { Alert, BarList, Card, CardBody, CardHeader, LinkButton, PageHeader, Stat } from "@/components/ui";

export const metadata = { title: "Analítica" };

export default function AdminHome() {
  requireUser("admin");
  const { kpis, byStatus, byCareer, topTags, byModality } = adminStats();
  const pct = kpis.students ? Math.round((kpis.epn / kpis.students) * 100) : 0;
  return (
    <>
      <PageHeader title="Panel de administración" description="Indicadores de la bolsa de empleo y demanda de habilidades." />
      {kpis.pendingCompanies ? (
        <div className="mb-6"><Alert variant="theme" title={`${kpis.pendingCompanies} empresa${kpis.pendingCompanies > 1 ? "s" : ""} pendiente${kpis.pendingCompanies > 1 ? "s" : ""} de verificación`}
          action={<LinkButton href="/admin/usuarios?rol=company" size="sm">Revisar</LinkButton>}>Verifica el RUC antes de mostrar el sello en sus vacantes.</Alert></div>
      ) : null}
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Vacantes activas" value={kpis.activeJobs} hint={`${kpis.totalJobs} publicadas en total`} />
        <Stat label="Postulaciones" value={kpis.applications} hint={`${kpis.selected} seleccionados`} />
        <Stat label="Postulantes" value={kpis.students} hint={`${kpis.epn} EPN · ${kpis.external} externos`} />
        <Stat label="Empresas" value={kpis.companies} hint={`${kpis.pendingCompanies} por verificar`} />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card><CardHeader title="Postulaciones por estado" /><CardBody><BarList data={byStatus} /></CardBody></Card>
        <Card><CardHeader title="Postulaciones por carrera" /><CardBody><BarList data={byCareer} color="bg-brand" /></CardBody></Card>
        <Card>
          <CardHeader title="Habilidades más demandadas" description="Vacantes activas que la piden vs. estudiantes que la tienen. Una brecha grande indica dónde capacitar." />
          <CardBody>
            <div className="mb-3 flex gap-4 text-xs text-muted-foreground"><span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-theme" />Vacantes</span><span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-chart-2" />Estudiantes</span></div>
            <ul className="flex flex-col gap-2.5">
              {topTags.map((t) => {
                const max = Math.max(1, ...topTags.flatMap((x) => [x.offers, x.students]));
                return (
                  <li key={t.tag} className="grid grid-cols-[8rem_1fr] items-center gap-3 text-sm">
                    <span className="truncate text-muted-foreground">{t.tag}</span>
                    <span className="flex flex-col gap-1">
                      <span className="flex items-center gap-2"><span className="h-2 rounded-full bg-theme" style={{ width: `${(t.offers / max) * 100}%`, minWidth: t.offers ? 4 : 0 }} /><span className="text-xs tabular-nums">{t.offers}</span></span>
                      <span className="flex items-center gap-2"><span className="h-2 rounded-full bg-chart-2" style={{ width: `${(t.students / max) * 100}%`, minWidth: t.students ? 4 : 0 }} /><span className="text-xs tabular-nums">{t.students}</span></span>
                    </span>
                  </li>
                );
              })}
            </ul>
          </CardBody>
        </Card>
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader title="Origen de los postulantes" />
            <CardBody>
              <div className="flex h-3 overflow-hidden rounded-full bg-muted"><span className="bg-theme" style={{ width: `${pct}%` }} /><span className="bg-chart-2" style={{ width: `${100 - pct}%` }} /></div>
              <div className="mt-3 flex justify-between text-sm"><span><b>{pct}%</b> EPN ({kpis.epn})</span><span><b>{100 - pct}%</b> externos ({kpis.external})</span></div>
            </CardBody>
          </Card>
          <Card><CardHeader title="Vacantes activas por modalidad" /><CardBody><BarList data={byModality} color="bg-chart-4" /></CardBody></Card>
        </div>
      </div>
    </>
  );
}

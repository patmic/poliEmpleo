import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { REPORTES } from "@/lib/reportes";
import { aliadosMatriz, consultorioFlujo, kpisObservatorio, pertinenciaPorLinea, vinculacionResumen } from "@/lib/reportes";
import { Card, CardBody, CardHeader, PageHeader, Stat } from "@/components/ui";
import { TD, TH, Tabla } from "../shared";

export const metadata = { title: "Reportes" };

export default function Reportes() {
  requireUser("admin");
  const kpis = kpisObservatorio();
  const pert = pertinenciaPorLinea();
  const flujo = consultorioFlujo();
  const aliados = aliadosMatriz();
  const vinc = vinculacionResumen();
  const destacados = kpis.slice(0, 4);

  return (
    <>
      <PageHeader
        title="Reportes del Observatorio y Consultorio"
        description="Indicadores construidos con los registros de la plataforma. Cada tabla se descarga en CSV (Excel en español)."
      />
      <div className="mb-6 flex flex-wrap gap-2 text-sm">
        {Object.entries(REPORTES).map(([k, r]) => (
          <a key={k} href={`/admin/reportes/exportar?tipo=${k}`} className="rounded-full border px-3 py-1 hover:bg-muted">↓ {r.titulo}</a>
        ))}
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        {destacados.map((k) => <Stat key={k.kpi} label={k.kpi} value={k.valor} hint={`Meta: ${k.meta}`} />)}
      </div>

      <div className="mb-6 grid gap-6">
        <Card>
          <CardHeader title="Indicadores del Observatorio (Anexo 4)" description="Valor actual frente a la meta de 48 horas y 30 días." />
          <CardBody>
            <Tabla>
              <thead><tr><th className={TH}>Dimensión</th><th className={TH}>KPI</th><th className={TH}>Valor</th><th className={TH}>Meta</th></tr></thead>
              <tbody>{kpis.map((k) => (
                <tr key={k.kpi}><td className={TD}>{k.dimension}</td><td className={TD}>{k.kpi}</td><td className={`${TD} font-semibold tabular-nums`}>{k.valor}{k.kpi.includes("%") ? "%" : ""}</td><td className={`${TD} text-muted-foreground`}>{k.meta}</td></tr>
              ))}</tbody>
            </Tabla>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Pertinencia por línea técnica" description="Demanda externa (señales) frente a vacantes, postulaciones, capacidad TIC 2026-A, retos y atenciones." />
          <CardBody>
            <Tabla>
              <thead><tr><th className={TH}>Línea técnica</th><th className={TH}>Señales</th><th className={TH}>Alta prioridad</th><th className={TH}>Vacantes activas</th><th className={TH}>Postulaciones</th><th className={TH}>Retos</th><th className={TH}>Proyectos TIC</th><th className={TH}>Componentes TIC</th><th className={TH}>Estudiantes TIC</th><th className={TH}>Atenciones</th><th className={TH}>Brecha</th></tr></thead>
              <tbody>{pert.map((r) => (
                <tr key={r.linea}>
                  <td className={`${TD} font-medium`}>{r.linea}</td><td className={TD}>{r.senales}</td><td className={TD}>{r.senales_alta}</td><td className={TD}>{r.vacantes_activas}</td>
                  <td className={TD}>{r.postulaciones}</td><td className={TD}>{r.retos}</td><td className={TD}>{r.tic_proyectos}</td><td className={TD}>{r.tic_componentes}</td>
                  <td className={TD}>{r.tic_estudiantes}</td><td className={TD}>{r.atenciones}</td>
                  <td className={`${TD} ${r.brecha > 0 ? "text-amber-700" : ""}`}>{r.brecha}</td>
                </tr>
              ))}</tbody>
            </Tabla>
            <p className="mt-3 text-xs text-muted-foreground">Brecha = señales de demanda − retos formulados. Un valor positivo indica demanda externa que aún no se convierte en reto.</p>
          </CardBody>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader title="Flujo del Consultorio" description="Casos por estado, con estudiantes y horas." />
            <CardBody>
              <Tabla>
                <thead><tr><th className={TH}>Estado</th><th className={TH}>Casos</th><th className={TH}>Estudiantes</th><th className={TH}>Horas</th></tr></thead>
                <tbody>{flujo.porEstado.map((e) => (
                  <tr key={e.estado}><td className={TD}>{e.estado}</td><td className={TD}>{e.casos}</td><td className={TD}>{e.estudiantes}</td><td className={TD}>{e.horas}</td></tr>
                ))}</tbody>
              </Tabla>
              <h3 className="mb-2 mt-5 text-sm font-semibold">Por línea técnica</h3>
              <Tabla>
                <thead><tr><th className={TH}>Línea</th><th className={TH}>Casos</th><th className={TH}>Horas</th><th className={TH}>Escalables</th></tr></thead>
                <tbody>{flujo.porLinea.length ? flujo.porLinea.map((l) => (
                  <tr key={l.linea}><td className={TD}>{l.linea}</td><td className={TD}>{l.casos}</td><td className={TD}>{l.horas}</td><td className={TD}>{l.escalables}</td></tr>
                )) : <tr><td className={TD} colSpan={4}>Sin casos registrados.</td></tr>}</tbody>
              </Tabla>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Vinculación de postulaciones" description="Postulaciones por tipo de vinculación y línea técnica." />
            <CardBody>
              <Tabla>
                <thead><tr><th className={TH}>Tipo</th><th className={TH}>Línea</th><th className={TH}>Postulaciones</th><th className={TH}>Seleccionados</th><th className={TH}>Horas</th></tr></thead>
                <tbody>{vinc.length ? vinc.map((v) => (
                  <tr key={`${v.tipo}-${v.linea}`}><td className={TD}>{v.tipo}</td><td className={TD}>{v.linea}</td><td className={TD}>{v.postulaciones}</td><td className={TD}>{v.seleccionados}</td><td className={TD}>{v.horas}</td></tr>
                )) : <tr><td className={TD} colSpan={5}>Sin postulaciones todavía.</td></tr>}</tbody>
              </Tabla>
            </CardBody>
          </Card>
        </div>

        <Card>
          <CardHeader title="Matriz de aliados y convenios" description="Empresas registradas y aliados prospectados, por tipo de actor." action={<Link href="/admin/aliados" className="text-sm text-theme hover:underline">Gestionar →</Link>} />
          <CardBody>
            <Tabla>
              <thead><tr><th className={TH}>Tipo de actor</th><th className={TH}>Empresas</th><th className={TH}>Aliados prospectados</th><th className={TH}>En proceso</th><th className={TH}>Convenios firmados</th></tr></thead>
              <tbody>{aliados.length ? aliados.map((a) => (
                <tr key={a.tipo}><td className={TD}>{a.tipo}</td><td className={TD}>{a.empresas}</td><td className={TD}>{a.aliados}</td><td className={TD}>{a.en_proceso}</td><td className={TD}>{a.convenios}</td></tr>
              )) : <tr><td className={TD} colSpan={5}>Clasifica empresas o registra aliados para ver la matriz.</td></tr>}</tbody>
            </Tabla>
          </CardBody>
        </Card>
      </div>
    </>
  );
}

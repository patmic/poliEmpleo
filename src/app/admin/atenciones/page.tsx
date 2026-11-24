import { requireUser } from "@/lib/auth";
import { consultorioFlujo, listaRetos } from "@/lib/reportes";
import { createAtencionAction, updateAtencionAction } from "../actions";
import { ATENCION_ESTADOS, LINEAS, TIPOS_ATENCION } from "@/lib/observatorio";
import { Button, Card, CardBody, CardHeader, Field, Input, PageHeader, Select } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { Aviso, Opts, TD, TH, Tabla } from "../shared";

export const metadata = { title: "Consultorio Tecnológico" };

export default function Atenciones({ searchParams }: { searchParams: { ok?: string } }) {
  requireUser("admin");
  const flujo = consultorioFlujo();
  const retos = listaRetos();
  return (
    <>
      <PageHeader title="Consultorio Tecnológico Express" description="Registro de casos atendidos: estado, estudiantes, horas, evidencia y si el caso puede escalar a proyecto, práctica o convenio." />
      <Aviso ok={searchParams.ok} />
      <Card className="mb-6">
        <CardHeader title="Nuevo caso" />
        <CardBody>
          <form action={createAtencionAction} className="grid gap-3 md:grid-cols-4">
            <Field label="Solicitante" className="md:col-span-2"><Input name="solicitante" required placeholder="Empresa, institución o área" /></Field>
            <Field label="Reto relacionado"><Select name="reto_id" defaultValue=""><option value="">Ninguno</option>{retos.map((r) => <option key={r.id} value={r.id}>{r.titulo}</option>)}</Select></Field>
            <Field label="Línea técnica"><Select name="linea_tecnica" defaultValue=""><Opts lista={LINEAS} vacio="Sin definir" /></Select></Field>
            <Field label="Tipo"><Select name="tipo" defaultValue="Diagnóstico"><Opts lista={TIPOS_ATENCION} /></Select></Field>
            <Field label="Estado"><Select name="estado" defaultValue="Recibida"><Opts lista={ATENCION_ESTADOS} /></Select></Field>
            <Field label="Estudiantes"><Input name="estudiantes" type="number" min={0} defaultValue={0} /></Field>
            <Field label="Horas"><Input name="horas" type="number" min={0} defaultValue={0} /></Field>
            <Field label="Resultado"><Input name="resultado" /></Field>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="escalable" /> Caso escalable (proyecto, práctica o convenio)</label>
            <div className="md:col-span-4"><Button type="submit">Registrar caso</Button></div>
          </form>
        </CardBody>
      </Card>

      <Card className="mb-6 overflow-x-auto">
        <CardHeader title="Casos" description={`${flujo.casos.length} casos registrados.`} />
        <Tabla>
          <thead><tr><th className={TH}>Solicitante</th><th className={TH}>Línea y reto</th><th className={TH}>Recepción</th><th className={TH}>Seguimiento</th></tr></thead>
          <tbody>{flujo.casos.length ? flujo.casos.map((c) => (
            <tr key={c.id}>
              <td className={`${TD} font-medium`}>{c.solicitante}<div className="text-xs font-normal text-muted-foreground">{c.tipo}{c.escalable ? " · escalable" : ""}</div></td>
              <td className={TD}>{c.linea || "—"}<div className="text-xs text-muted-foreground">{c.reto || "Sin reto asociado"}</div></td>
              <td className={`${TD} text-xs`}>{c.fecha_recepcion}{c.fecha_cierre ? <div>Cierre {c.fecha_cierre}</div> : null}</td>
              <td className={TD}>
                <form action={updateAtencionAction} className="grid grid-cols-2 gap-2 md:grid-cols-[1.1fr_0.7fr_0.6fr_1.4fr_auto] md:items-center">
                  <input type="hidden" name="id" value={c.id} />
                  <Select name="estado" defaultValue={c.estado} className="h-8 text-xs"><Opts lista={ATENCION_ESTADOS} /></Select>
                  <Input name="estudiantes" type="number" min={0} defaultValue={c.estudiantes} className="h-8 text-xs" aria-label="Estudiantes" />
                  <Input name="horas" type="number" min={0} defaultValue={c.horas} className="h-8 text-xs" aria-label="Horas" />
                  <Input name="evidencia_url" defaultValue={c.evidencia_url} placeholder="Enlace de evidencia" className="h-8 text-xs" />
                  <SubmitButton size="sm" variant="ghost">Guardar</SubmitButton>
                  <Input name="resultado" defaultValue={c.resultado} placeholder="Resultado o recomendación" className="col-span-2 h-8 text-xs md:col-span-4" />
                  <label className="col-span-2 flex items-center gap-1 text-xs"><input type="checkbox" name="escalable" defaultChecked={c.escalable} /> Escalable</label>
                </form>
              </td>
            </tr>
          )) : <tr><td className={TD} colSpan={4}>Aún no hay casos registrados.</td></tr>}</tbody>
        </Tabla>
      </Card>
    </>
  );
}

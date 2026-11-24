import { requireUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { createSenalAction, importSenalesAction, importTicAction } from "../actions";
import { LINEAS, PRIORIDADES } from "@/lib/observatorio";
import { Button, Card, CardBody, CardHeader, Field, Input, PageHeader, Select, Textarea } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { Aviso, Opts } from "../shared";

export const metadata = { title: "Datos del Observatorio" };

const PLANTILLA_SENALES = "fuente;cargo;empresa;ciudad;linea_tecnica;necesidad_inferida;solucion_asociada;prioridad;enlace";
const PLANTILLA_TIC = "periodo;docente;titulo;linea_proyecto;estado;fecha_aprobacion;componente;estudiante;carrera;linea_componente";

export default function Datos({ searchParams }: { searchParams: { ok?: string } }) {
  requireUser("admin");
  const db = getDb();
  const n = (sql: string) => Number((db.prepare(sql).get() as { c: number }).c);
  return (
    <>
      <PageHeader title="Datos del Observatorio y TIC" description="Carga las señales laborales y la capacidad TIC 2026-A desde CSV, o registra señales una a una." />
      <Aviso ok={searchParams.ok} />
      <div className="mb-6 grid grid-cols-3 gap-3 text-sm">
        <Card><CardBody><b className="text-2xl tabular-nums">{n("SELECT COUNT(*) c FROM senales")}</b><div className="text-muted-foreground">Señales</div></CardBody></Card>
        <Card><CardBody><b className="text-2xl tabular-nums">{n("SELECT COUNT(*) c FROM tic_proyectos")}</b><div className="text-muted-foreground">Proyectos TIC</div></CardBody></Card>
        <Card><CardBody><b className="text-2xl tabular-nums">{n("SELECT COUNT(*) c FROM tic_componentes")}</b><div className="text-muted-foreground">Componentes TIC</div></CardBody></Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Importar señales laborales (CSV)" description={`Encabezados: ${PLANTILLA_SENALES}. Si la línea técnica está vacía se clasifica automáticamente por el cargo.`} />
          <CardBody>
            <form action={importSenalesAction} className="flex flex-col gap-3">
              <Textarea name="csv" rows={8} placeholder={`${PLANTILLA_SENALES}\nLinkedIn Jobs;Pasante de Ciberseguridad;PentaSec;Quito;;;;Alta;`} className="font-mono text-xs" required />
              <div><SubmitButton>Importar señales</SubmitButton></div>
            </form>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Importar capacidad TIC 2026-A (CSV)" description={`Una fila por componente. Encabezados: ${PLANTILLA_TIC}. Las filas con el mismo título forman un proyecto.`} />
          <CardBody>
            <form action={importTicAction} className="flex flex-col gap-3">
              <Textarea name="csv" rows={8} placeholder={`${PLANTILLA_TIC}\n2026-A;Paz Arias Henry;Sistema inteligente de precios;;APROBADO;2026-03-05;Sistema multi-agente;Salazar Morocho Bryan;SW;`} className="font-mono text-xs" required />
              <div><SubmitButton>Importar componentes TIC</SubmitButton></div>
            </form>
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="Registrar una señal" description="Para señales encontradas manualmente en portales de empleo o en el medio externo." />
          <CardBody>
            <form action={createSenalAction} className="grid gap-3 md:grid-cols-4">
              <Field label="Fuente"><Input name="fuente" placeholder="LinkedIn Jobs" /></Field>
              <Field label="Cargo o señal" className="md:col-span-2"><Input name="cargo" required /></Field>
              <Field label="Prioridad"><Select name="prioridad" defaultValue="Media"><Opts lista={PRIORIDADES} /></Select></Field>
              <Field label="Empresa"><Input name="empresa" /></Field>
              <Field label="Ciudad"><Input name="ciudad" /></Field>
              <Field label="Línea técnica"><Select name="linea_tecnica" defaultValue=""><Opts lista={LINEAS} vacio="Clasificar automáticamente" /></Select></Field>
              <Field label="Enlace de evidencia"><Input name="enlace" type="url" placeholder="https://…" /></Field>
              <Field label="Necesidad inferida" className="md:col-span-2"><Input name="necesidad_inferida" /></Field>
              <Field label="Solución asociada" className="md:col-span-2"><Input name="solucion_asociada" /></Field>
              <div className="md:col-span-4"><Button type="submit">Guardar señal</Button></div>
            </form>
          </CardBody>
        </Card>
      </div>
    </>
  );
}

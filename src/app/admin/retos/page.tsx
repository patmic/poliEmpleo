import { requireUser } from "@/lib/auth";
import { listaRetos } from "@/lib/reportes";
import { createRetoAction, updateRetoAction } from "../actions";
import { IMPACTOS, LINEAS, NIVELES, PRIORIDADES, RETO_ESTADOS } from "@/lib/observatorio";
import { Button, Card, CardBody, CardHeader, Field, Input, PageHeader, Select } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { Aviso, Opts, TD, TH, Tabla } from "../shared";

export const metadata = { title: "Banco de retos" };

export default function Retos({ searchParams }: { searchParams: { ok?: string } }) {
  requireUser("admin");
  const retos = listaRetos();
  return (
    <>
      <PageHeader title="Banco de retos tecnológicos" description="Necesidades convertidas en retos ejecutables, con prioridad, docente focal y estado del piloto." />
      <Aviso ok={searchParams.ok} />
      <Card className="mb-6">
        <CardHeader title="Nuevo reto" />
        <CardBody>
          <form action={createRetoAction} className="grid gap-3 md:grid-cols-4">
            <Field label="Reto" className="md:col-span-2"><Input name="titulo" required /></Field>
            <Field label="Línea técnica"><Select name="linea_tecnica" defaultValue=""><Opts lista={LINEAS} vacio="Clasificar automáticamente" /></Select></Field>
            <Field label="Estado"><Select name="estado" defaultValue="Idea"><Opts lista={RETO_ESTADOS} /></Select></Field>
            <Field label="Origen (señal o vacante)" className="md:col-span-2"><Input name="origen" /></Field>
            <Field label="Actividad rápida" className="md:col-span-2"><Input name="actividad" /></Field>
            <Field label="Entregable" className="md:col-span-2"><Input name="entregable" /></Field>
            <Field label="Tiempo estimado"><Input name="tiempo_estimado" placeholder="7 a 15 días" /></Field>
            <Field label="Complejidad"><Select name="complejidad" defaultValue="Media"><Opts lista={NIVELES} /></Select></Field>
            <Field label="Impacto"><Select name="impacto" defaultValue="Medio"><Opts lista={IMPACTOS} /></Select></Field>
            <Field label="Prioridad"><Select name="prioridad" defaultValue="Media"><Opts lista={PRIORIDADES} /></Select></Field>
            <Field label="Docente focal"><Input name="docente_focal" /></Field>
            <div className="md:col-span-4"><Button type="submit">Registrar reto</Button></div>
          </form>
        </CardBody>
      </Card>
      <Card className="overflow-x-auto">
        <Tabla>
          <thead><tr><th className={TH}>Reto</th><th className={TH}>Línea</th><th className={TH}>Entregable</th><th className={TH}>Prioridad</th><th className={TH}>Docente focal</th><th className={TH}>Estado</th><th className={TH}></th></tr></thead>
          <tbody>{retos.map((r) => (
            <tr key={r.id}>
              <td className={TD}><b>{r.titulo}</b><div className="text-xs text-muted-foreground">{r.origen}</div></td>
              <td className={TD}>{r.linea}</td>
              <td className={TD}>{r.entregable}<div className="text-xs text-muted-foreground">{r.tiempo} · complejidad {r.complejidad} · impacto {r.impacto}</div></td>
              <td colSpan={4} className={TD}>
                <form action={updateRetoAction} className="grid grid-cols-[1fr_1fr_1.2fr_auto] items-center gap-2">
                  <input type="hidden" name="id" value={r.id} />
                  <Select name="prioridad" defaultValue={r.prioridad} className="h-8 text-xs"><Opts lista={PRIORIDADES} /></Select>
                  <Select name="estado" defaultValue={r.estado} className="h-8 text-xs"><Opts lista={RETO_ESTADOS} /></Select>
                  <Input name="docente_focal" defaultValue={r.docente} className="h-8 text-xs" placeholder="Docente focal" />
                  <SubmitButton size="sm" variant="ghost">Guardar</SubmitButton>
                </form>
              </td>
            </tr>
          ))}</tbody>
        </Tabla>
      </Card>
      <p className="mt-3 text-xs text-muted-foreground">Las descripciones completas de los retos están en el reporte CSV «Banco de retos tecnológicos».</p>
    </>
  );
}

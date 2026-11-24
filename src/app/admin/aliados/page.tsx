import { requireUser } from "@/lib/auth";
import { aliadosMatriz, listaAliados } from "@/lib/reportes";
import { createAliadoAction, updateAliadoAction, updateEmpresaVinculoAction } from "../actions";
import { ALIADO_ESTADOS, CONVENIO_ESTADOS, LINEAS, PRIORIDADES, TIPOS_ACTOR } from "@/lib/observatorio";
import { Button, Card, CardBody, CardHeader, Field, Input, PageHeader, Select } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { Aviso, Opts, TD, TH, Tabla } from "../shared";

export const metadata = { title: "Aliados y convenios" };

export default function Aliados({ searchParams }: { searchParams: { ok?: string } }) {
  requireUser("admin");
  const { prospectos, empresas } = listaAliados();
  const matriz = aliadosMatriz();
  return (
    <>
      <PageHeader title="Matriz de aliados y convenios" description="Actores externos con demanda explícita y empresas registradas: tipo de actor, línea de interés y estado del convenio." />
      <Aviso ok={searchParams.ok} />

      <Card className="mb-6">
        <CardHeader title="Resumen por tipo de actor" />
        <CardBody>
          <Tabla>
            <thead><tr><th className={TH}>Tipo de actor</th><th className={TH}>Empresas</th><th className={TH}>Aliados</th><th className={TH}>En proceso</th><th className={TH}>Convenios</th></tr></thead>
            <tbody>{matriz.length ? matriz.map((m) => (
              <tr key={m.tipo}><td className={TD}>{m.tipo}</td><td className={TD}>{m.empresas}</td><td className={TD}>{m.aliados}</td><td className={TD}>{m.en_proceso}</td><td className={TD}>{m.convenios}</td></tr>
            )) : <tr><td className={TD} colSpan={5}>Sin datos todavía.</td></tr>}</tbody>
          </Tabla>
        </CardBody>
      </Card>

      <Card className="mb-6">
        <CardHeader title="Nuevo aliado potencial" description="Organizaciones identificadas en el Observatorio que aún no tienen cuenta en la plataforma." />
        <CardBody>
          <form action={createAliadoAction} className="grid gap-3 md:grid-cols-4">
            <Field label="Nombre" className="md:col-span-2"><Input name="nombre" required /></Field>
            <Field label="Tipo de actor"><Select name="tipo_actor" defaultValue="Otro"><Opts lista={TIPOS_ACTOR} /></Select></Field>
            <Field label="Línea técnica"><Select name="linea_tecnica" defaultValue=""><Opts lista={LINEAS} vacio="Sin definir" /></Select></Field>
            <Field label="Oportunidad de convenio" className="md:col-span-2"><Input name="oportunidad" /></Field>
            <Field label="Próximo paso" className="md:col-span-2"><Input name="proximo_paso" /></Field>
            <Field label="Prioridad"><Select name="prioridad" defaultValue="Media"><Opts lista={PRIORIDADES} /></Select></Field>
            <Field label="Estado"><Select name="estado" defaultValue="Prospecto"><Opts lista={ALIADO_ESTADOS} /></Select></Field>
            <Field label="Fuente o URL" className="md:col-span-2"><Input name="fuente_url" type="url" placeholder="https://…" /></Field>
            <div className="md:col-span-4"><Button type="submit">Registrar aliado</Button></div>
          </form>
        </CardBody>
      </Card>

      <Card className="mb-6 overflow-x-auto">
        <CardHeader title="Aliados prospectados" />
        <Tabla>
          <thead><tr><th className={TH}>Aliado</th><th className={TH}>Tipo</th><th className={TH}>Línea</th><th className={TH}>Prioridad</th><th className={TH}>Estado y próximo paso</th></tr></thead>
          <tbody>{prospectos.length ? prospectos.map((a) => (
            <tr key={a.id}>
              <td className={TD}><b>{a.nombre}</b>{a.fuente_url ? <div className="text-xs"><a href={a.fuente_url} className="text-theme hover:underline" target="_blank" rel="noreferrer">Fuente</a></div> : null}</td>
              <td className={TD}>{a.tipo_actor}</td>
              <td className={TD}>{a.linea || "—"}</td>
              <td className={TD}>{a.prioridad}</td>
              <td className={TD}>
                <form action={updateAliadoAction} className="grid grid-cols-[1fr_1.4fr_auto] items-center gap-2">
                  <input type="hidden" name="id" value={a.id} />
                  <Select name="estado" defaultValue={a.estado} className="h-8 text-xs"><Opts lista={ALIADO_ESTADOS} /></Select>
                  <Input name="proximo_paso" defaultValue={a.proximo_paso} className="h-8 text-xs" />
                  <Select name="prioridad" defaultValue={a.prioridad} className="h-8 text-xs"><Opts lista={PRIORIDADES} /></Select>
                  <SubmitButton size="sm" variant="ghost">Guardar</SubmitButton>
                </form>
              </td>
            </tr>
          )) : <tr><td className={TD} colSpan={5}>Aún no hay aliados prospectados.</td></tr>}</tbody>
        </Tabla>
      </Card>

      <Card className="overflow-x-auto">
        <CardHeader title="Empresas registradas" description="Clasifica cada empresa por tipo de actor y estado de convenio. Solo el administrador modifica estos campos." />
        <Tabla>
          <thead><tr><th className={TH}>Empresa</th><th className={TH}>Verificación</th><th className={TH}>Registro</th></tr></thead>
          <tbody>{empresas.length ? empresas.map((e) => (
            <tr key={e.id}>
              <td className={`${TD} font-medium`}>{e.nombre}</td>
              <td className={TD}>{e.origen === "Empresa verificada" ? "✓ Verificada" : "Por verificar"}</td>
              <td className={TD}>
                <form action={updateEmpresaVinculoAction} className="grid gap-2 md:grid-cols-[1fr_1fr_auto] md:items-start">
                  <input type="hidden" name="user_id" value={e.id} />
                  <Select name="tipo_actor" defaultValue={e.tipo_actor} className="h-8 text-xs"><Opts lista={TIPOS_ACTOR} vacio="Sin clasificar" /></Select>
                  <Select name="convenio_estado" defaultValue={e.estado} className="h-8 text-xs"><Opts lista={CONVENIO_ESTADOS} /></Select>
                  <Input name="calificacion" type="number" min={0} max={5} step={0.1} defaultValue={e.calificacion} className="h-8 text-xs" aria-label="Calificación 0 a 5" />
                  <SubmitButton size="sm" variant="ghost">Guardar</SubmitButton>
                  <div className="col-span-full flex flex-wrap gap-x-3 gap-y-1 text-xs">
                    {LINEAS.map((l) => (
                      <label key={l} className="flex items-center gap-1">
                        <input type="checkbox" name="lineas" value={l} defaultChecked={e.linea.split("; ").includes(l)} />{l}
                      </label>
                    ))}
                  </div>
                </form>
              </td>
            </tr>
          )) : <tr><td className={TD} colSpan={3}>No hay empresas registradas.</td></tr>}</tbody>
        </Tabla>
      </Card>
    </>
  );
}

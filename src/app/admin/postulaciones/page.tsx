import { requireUser } from "@/lib/auth";
import { listaVinculaciones } from "@/lib/reportes";
import { updateVinculacionAction } from "../actions";
import { LINEAS, ROLES_VINCULACION, TIPOS_VINCULACION } from "@/lib/observatorio";
import { PageHeader, Card, Input, Select, Badge } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { Aviso, Opts, TD, TH, Tabla } from "../shared";

export const metadata = { title: "Postulaciones y vinculación" };

export default function Postulaciones({ searchParams }: { searchParams: { ok?: string } }) {
  requireUser("admin");
  const rows = listaVinculaciones();
  return (
    <>
      <PageHeader title="Registro de postulaciones" description="Cada postulación se clasifica por tipo de vinculación, línea técnica, rol y horas. Alimenta los reportes de vinculación." />
      <Aviso ok={searchParams.ok} />
      <Card className="overflow-x-auto">
        <Tabla>
          <thead><tr><th className={TH}>Postulante</th><th className={TH}>Vacante</th><th className={TH}>Estado</th><th className={TH}>Vinculación</th></tr></thead>
          <tbody>{rows.length ? rows.map((r) => (
            <tr key={r.id}>
              <td className={TD}><b>{r.postulante}</b><div className="text-xs text-muted-foreground">{r.condicion}{r.carrera ? ` · ${r.carrera}` : ""}</div></td>
              <td className={TD}>{r.vacante}<div className="text-xs text-muted-foreground">{r.empresa}</div></td>
              <td className={TD}><Badge variant="secondary">{r.estado}</Badge><div className="text-xs text-muted-foreground">{r.fecha.slice(0, 10)}</div></td>
              <td className={TD}>
                <form action={updateVinculacionAction} className="grid grid-cols-2 gap-2 md:grid-cols-[1.3fr_1fr_0.5fr_1.1fr_auto] md:items-center">
                  <input type="hidden" name="id" value={r.id} />
                  <Select name="tipo_vinculacion" defaultValue={r.tipo} className="h-8 text-xs"><Opts lista={TIPOS_VINCULACION} /></Select>
                  <Select name="rol_asignado" defaultValue={r.rol || ""} className="h-8 text-xs"><Opts lista={ROLES_VINCULACION} vacio="Sin rol" /></Select>
                  <Input name="horas" type="number" min={0} defaultValue={r.horas} className="h-8 text-xs" aria-label="Horas" />
                  <Select name="linea_tecnica" defaultValue={r.linea} className="h-8 text-xs"><Opts lista={LINEAS} vacio="Sin línea" /></Select>
                  <SubmitButton size="sm" variant="ghost">Guardar</SubmitButton>
                </form>
              </td>
            </tr>
          )) : <tr><td className={TD} colSpan={4}>No hay postulaciones todavía.</td></tr>}</tbody>
        </Tabla>
      </Card>
    </>
  );
}

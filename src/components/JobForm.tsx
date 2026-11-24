import type { Job } from "@/lib/data";
import { saveJobAction } from "@/app/actions";
import { CAREERS, JOB_TYPES, MODALITIES, TAG_CATALOG } from "@/lib/catalog";
import { Card, CardBody, CardHeader, Field, Input, Select, Textarea } from "./ui";
import { TagPicker } from "./TagPicker";
import { SubmitButton } from "./SubmitButton";

export function JobForm({ job }: { job?: Job }) {
  return (
    <form action={saveJobAction} className="grid gap-6 lg:grid-cols-[1fr_380px]">
      {job ? <input type="hidden" name="id" value={job.id} /> : null}
      <Card>
        <CardHeader title="Datos del puesto" description="Los campos con * son obligatorios." />
        <CardBody className="grid gap-4 sm:grid-cols-2">
          <Field label="Título del puesto *" className="sm:col-span-2"><Input name="title" defaultValue={job?.title} required maxLength={140} placeholder="Ej. Pasante de Desarrollo Web" /></Field>
          <Field label="Modalidad"><Select name="modality" defaultValue={job?.modality ?? "Híbrido"}>{MODALITIES.map((m) => <option key={m}>{m}</option>)}</Select></Field>
          <Field label="Tipo"><Select name="job_type" defaultValue={job?.job_type ?? "Tiempo completo"}>{JOB_TYPES.map((m) => <option key={m}>{m}</option>)}</Select></Field>
          <Field label="Ciudad"><Input name="city" defaultValue={job?.city ?? "Quito"} /></Field>
          <Field label="Número de vacantes"><Input name="vacancies" type="number" min={1} max={99} defaultValue={job?.vacancies ?? 1} /></Field>
          <Field label="Remuneración"><Input name="salary" defaultValue={job?.salary ?? ""} placeholder="Ej. $460 / mes, A convenir" /></Field>
          <Field label="Fecha límite"><Input name="deadline" type="date" defaultValue={job?.deadline ?? ""} /></Field>
          <label className="flex items-center gap-2 text-sm sm:col-span-2"><input type="checkbox" name="acepta_discapacidad" defaultChecked={job?.acepta_discapacidad} className="size-4 accent-[var(--theme-color)]" /> Acepta personas con discapacidad</label>
          <Field label="Descripción *" className="sm:col-span-2"><Textarea name="description" required rows={4} defaultValue={job?.description} /></Field>
          <Field label="Responsabilidades" className="sm:col-span-2"><Textarea name="responsibilities" rows={3} defaultValue={job?.responsibilities} /></Field>
          <Field label="Requisitos" className="sm:col-span-2"><Textarea name="requirements" rows={3} defaultValue={job?.requirements} /></Field>
        </CardBody>
      </Card>
      <div className="flex flex-col gap-4">
        <Card>
          <CardHeader title="Etiquetas de la vacante" description="Habilidades y áreas requeridas. Se usan para calcular la afinidad de cada postulante." />
          <CardBody><TagPicker catalog={TAG_CATALOG} initial={job?.tags ?? []} /></CardBody>
        </Card>
        <Card>
          <CardHeader title="Carreras afines" description="Déjalo vacío si cualquier carrera puede postular." />
          <CardBody className="grid max-h-64 gap-1.5 overflow-y-auto">
            {CAREERS.map((c) => (
              <label key={c} className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="careers" value={c} defaultChecked={job?.careers.includes(c)} className="size-4 accent-[var(--theme-color)]" /> {c}
              </label>
            ))}
          </CardBody>
        </Card>
        <SubmitButton size="lg">{job ? "Guardar cambios" : "Publicar vacante"}</SubmitButton>
      </div>
    </form>
  );
}

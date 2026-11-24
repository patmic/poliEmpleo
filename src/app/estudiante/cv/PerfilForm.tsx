"use client";

import { useState } from "react";
import type { Student } from "@/lib/data";
import { saveProfileMeta } from "@/app/actions";
import { CONDICIONES, MODALITIES, TAG_CATALOG } from "@/lib/catalog";
import { Card, CardBody, CardHeader, Field, Input, Select } from "@/components/ui";
import { TagPicker } from "@/components/TagPicker";
import { ChoiceChips } from "@/components/ChoiceChips";
import { SubmitButton } from "@/components/SubmitButton";

type Tab = "habilidades" | "datos";

/** Datos del perfil que no aparecen en el CV. Dos pestañas: habilidades (etiquetas) y datos adicionales (una columna). */
export function PerfilForm({ s }: { s: Student }) {
  const [tab, setTab] = useState<Tab>("habilidades");
  const tabs: { id: Tab; label: string }[] = [
    { id: "habilidades", label: "Habilidades" },
    { id: "datos", label: "Datos adicionales" },
  ];

  return (
    <form action={saveProfileMeta}>
      <Card>
        <CardHeader title="Datos del perfil" description="No aparecen en el CV. Sirven para tu afinidad con las vacantes." />
        <CardBody className="flex flex-col gap-4">
          <div role="tablist" className="flex gap-1 rounded-lg bg-slate-100 p-1">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={tab === t.id}
                onClick={() => setTab(t.id)}
                className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition ${
                  tab === t.id ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Ambos paneles siguen montados para que sus campos se envíen con el formulario. */}
          <div hidden={tab !== "habilidades"}>
            <Field label="Habilidades e intereses" hint="Las que coinciden con una vacante suben tu afinidad.">
              <TagPicker catalog={TAG_CATALOG} initial={s.tags} full />
            </Field>
          </div>

          <div hidden={tab !== "datos"} className="flex flex-col gap-4">
            <Field label="Condición"><Select name="condicion" defaultValue={s.condicion || CONDICIONES[0]}>{CONDICIONES.map((c) => <option key={c}>{c}</option>)}</Select></Field>
            <Field label="Semestre / situación"><Input name="semester" defaultValue={s.semester} placeholder="Ej. 7.º semestre, Graduado" /></Field>
            <Field label="Código único"><Input name="student_code" defaultValue={s.student_code} /></Field>
            <Field label="Modalidad preferida"><ChoiceChips name="modality_pref" options={MODALITIES} initial={s.modality_pref} /></Field>
          </div>

          <div className="flex justify-end"><SubmitButton>Guardar datos del perfil</SubmitButton></div>
        </CardBody>
      </Card>
    </form>
  );
}

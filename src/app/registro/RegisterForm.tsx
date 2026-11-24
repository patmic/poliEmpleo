"use client";
import { useState } from "react";
import { registerAction } from "@/app/actions";
import { Field, Input, Select } from "@/components/ui";
import { CONDICIONES } from "@/lib/catalog";
import { SubmitButton } from "@/components/SubmitButton";

export function RegisterForm({ careers }: { careers: readonly string[] }) {
  const [role, setRole] = useState<"student" | "company">("student");
  const [condicion, setCondicion] = useState<string>(CONDICIONES[0]);
  return (
    <form action={registerAction} className="flex flex-col gap-4">
      <input type="hidden" name="role" value={role} />
      <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted p-1 text-sm">
        {(["student", "company"] as const).map((r) => (
          <button type="button" key={r} onClick={() => setRole(r)} className={`rounded-md py-2 font-medium ${role === r ? "bg-white shadow-xs" : "text-muted-foreground"}`}>
            {r === "student" ? "Soy postulante" : "Soy empresa"}
          </button>
        ))}
      </div>
      <Field label={role === "student" ? "Nombre completo" : "Nombre de la empresa"}><Input name="name" required /></Field>
      <Field label="Correo electrónico"><Input name="email" type="email" required /></Field>
      <Field label="Contraseña" hint="Mínimo 6 caracteres."><Input name="password" type="password" minLength={6} required /></Field>
      {role === "student" ? (
        <>
          <Field label="Condición">
            <Select name="condicion" value={condicion} onChange={(e) => setCondicion(e.target.value)}>
              {CONDICIONES.map((c) => <option key={c}>{c}</option>)}
            </Select>
          </Field>
          {condicion.includes("externo") ? <Field label="Institución"><Input name="institution" placeholder="Universidad…" /></Field> : null}
          <Field label="Carrera">
            <Select name="career" defaultValue=""><option value="">Selecciona…</option>{careers.map((c) => <option key={c}>{c}</option>)}</Select>
          </Field>
        </>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="RUC" hint="13 dígitos"><Input name="ruc" inputMode="numeric" maxLength={13} pattern="[0-9]{13}" /></Field>
          <Field label="Sector"><Input name="sector" placeholder="Ej. Desarrollo de software" /></Field>
        </div>
      )}
      <SubmitButton>Crear cuenta</SubmitButton>
    </form>
  );
}

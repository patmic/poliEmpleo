import { requireUser } from "@/lib/auth";
import { getCompany } from "@/lib/data";
import { saveCompanyProfile } from "@/app/actions";
import { COMPANY_SIZES, TAG_CATALOG } from "@/lib/catalog";
import { Badge, Card, CardBody, CardHeader, Field, Input, LinkButton, PageHeader, Select, Textarea } from "@/components/ui";
import { TagPicker } from "@/components/TagPicker";
import { SubmitButton } from "@/components/SubmitButton";
import { getDb } from "@/lib/db";
import { LogoEditor } from "./LogoEditor";

export const metadata = { title: "Perfil de empresa" };

export default function CompanyProfile() {
  const u = requireUser("company");
  const c = getCompany(u.id)!;
  const logo = String((getDb().prepare("SELECT logo FROM company_profiles WHERE user_id = ?").get(u.id) as { logo?: string } | undefined)?.logo ?? "");
  return (
    <>
      <PageHeader title="Perfil de empresa" description={<>Así te ven los estudiantes. {c.verified ? <Badge variant="theme">✓ Verificada</Badge> : <Badge variant="warning">Verificación pendiente</Badge>}</>}
        action={<LinkButton href={`/empresas/${c.id}`} variant="cancel">Ver perfil público</LinkButton>} />
      <div className="mb-6">
        <LogoEditor logo={logo} nombre={c.name} />
      </div>
      <form action={saveCompanyProfile} className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <Card>
          <CardHeader title="Datos corporativos" />
          <CardBody className="grid gap-4 sm:grid-cols-2">
            <Field label="Razón social / nombre comercial" className="sm:col-span-2"><Input name="name" defaultValue={c.name} required /></Field>
            <Field label="RUC" hint="13 dígitos"><Input name="ruc" defaultValue={c.ruc} maxLength={13} pattern="[0-9]{13}" /></Field>
            <Field label="Sector"><Input name="sector" defaultValue={c.sector} /></Field>
            <Field label="Tamaño"><Select name="size" defaultValue={c.size}>{COMPANY_SIZES.map((s) => <option key={s}>{s}</option>)}</Select></Field>
            <Field label="Ciudad"><Input name="city" defaultValue={c.city} /></Field>
            <Field label="Sitio web"><Input name="website" type="url" defaultValue={c.website} placeholder="https://" /></Field>
            <Field label="Teléfono"><Input name="phone" defaultValue={c.phone} /></Field>
            <Field label="Descripción" className="sm:col-span-2"><Textarea name="description" rows={5} defaultValue={c.description} /></Field>
          </CardBody>
        </Card>
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader title="Etiquetas de la empresa" description="Tecnologías, áreas y sector. Ayudan a que te encuentren en el buscador." />
            <CardBody><TagPicker catalog={TAG_CATALOG} initial={c.tags} /></CardBody>
          </Card>
          <SubmitButton size="lg">Guardar perfil</SubmitButton>
        </div>
      </form>
    </>
  );
}

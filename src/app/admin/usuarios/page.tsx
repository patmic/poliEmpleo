import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { toggleActiveAction, toggleVerifyAction } from "@/app/actions";
import { Avatar, Badge, Card, PageHeader, fmtDate } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";

export const metadata = { title: "Usuarios" };

export default function AdminUsers({ searchParams }: { searchParams: { rol?: string; q?: string } }) {
  requireUser("admin");
  const rol = ["student", "company", "admin"].includes(searchParams.rol ?? "") ? searchParams.rol! : "";
  const q = (searchParams.q ?? "").trim();
  const rows = getDb().prepare(`
    SELECT u.id, u.name, u.email, u.role, u.active, u.created_at, u.last_login,
           sp.origin, sp.condicion, sp.career, cp.verified, cp.ruc, cp.sector,
           (SELECT COUNT(*) FROM applications a WHERE a.student_id = u.id) AS apps,
           (SELECT COUNT(*) FROM jobs j WHERE j.company_id = u.id) AS jobs
    FROM users u LEFT JOIN student_profiles sp ON sp.user_id = u.id LEFT JOIN company_profiles cp ON cp.user_id = u.id
    WHERE (? = '' OR u.role = ?) AND (? = '' OR u.name LIKE ? OR u.email LIKE ?)
    ORDER BY u.created_at DESC`).all(rol, rol, q, `%${q}%`, `%${q}%`);
  const label: Record<string, string> = { student: "Postulante", company: "Empresa", admin: "Admin" };
  return (
    <>
      <PageHeader title="Usuarios" description={`${rows.length} cuenta${rows.length === 1 ? "" : "s"}`} />
      <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
        {[["", "Todos"], ["student", "Postulantes"], ["company", "Empresas"], ["admin", "Administración"]].map(([v, l]) => (
          <Link key={v} href={v ? `?rol=${v}` : "?"} className={`rounded-full border px-3 py-1 ${rol === v ? "border-theme bg-theme text-white" : "hover:bg-muted"}`}>{l}</Link>
        ))}
        <form className="ml-auto flex gap-2"><input type="hidden" name="rol" value={rol} />
          <input name="q" defaultValue={q} placeholder="Nombre o correo" className="h-8 rounded-md border border-input px-2.5 text-sm" /></form>
      </div>
      <Card className="overflow-x-auto">
        <table className="w-full text-[15px]">
          <thead><tr className="border-b text-left text-sm text-muted-foreground"><th className="px-5 py-3 font-medium">Usuario</th><th className="px-3 font-medium">Rol</th><th className="px-3 font-medium">Detalle</th><th className="px-3 font-medium">Alta</th><th className="px-5 text-right font-medium">Acciones</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={String(r.id)} className={`border-b last:border-0 ${Number(r.active) ? "" : "opacity-60"}`}>
                <td className="px-5 py-3"><div className="flex items-center gap-2.5"><Avatar name={String(r.name)} size="sm" />
                  <div><div className="font-medium">{r.role === "company" ? <Link className="hover:text-theme" href={`/empresas/${r.id}`}>{String(r.name)}</Link> : r.role === "student" ? <Link className="hover:text-theme" href={`/candidatos/${r.id}`}>{String(r.name)}</Link> : String(r.name)}</div>
                  <div className="text-xs text-muted-foreground">{String(r.email)}</div></div></div></td>
                <td className="px-3"><Badge variant="outline">{label[String(r.role)]}</Badge> {!Number(r.active) ? <Badge variant="destructive">Inactiva</Badge> : null}</td>
                <td className="px-3 text-sm text-muted-foreground">
                  {r.role === "student" ? <>{String(r.condicion || "Postulante")} · {String(r.career || "—")} · {Number(r.apps)} postulaciones</> : null}
                  {r.role === "company" ? <>{Number(r.verified) ? <Badge variant="success">Verificada</Badge> : <Badge variant="warning">Pendiente</Badge>} RUC {String(r.ruc || "—")} · {Number(r.jobs)} vacantes</> : null}
                </td>
                <td className="px-3 text-sm text-muted-foreground">{fmtDate(String(r.created_at))}</td>
                <td className="px-5"><div className="flex justify-end gap-1.5">
                  {r.role === "company" ? (
                    <form action={toggleVerifyAction}><input type="hidden" name="id" value={String(r.id)} />
                      <SubmitButton size="sm" variant={Number(r.verified) ? "ghost" : "default"}>{Number(r.verified) ? "Quitar verificación" : "Verificar"}</SubmitButton></form>
                  ) : null}
                  {r.role !== "admin" ? (
                    <form action={toggleActiveAction}><input type="hidden" name="id" value={String(r.id)} /><input type="hidden" name="rol" value={rol} />
                      <SubmitButton size="sm" variant="ghost" confirm={Number(r.active) ? "¿Desactivar esta cuenta? No podrá ingresar." : undefined}>{Number(r.active) ? "Desactivar" : "Activar"}</SubmitButton></form>
                  ) : null}
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}

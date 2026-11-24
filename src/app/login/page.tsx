import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession, homeFor } from "@/lib/auth";
import { loginAction, demoLoginAction } from "@/app/actions";
import { Card, Field, Input } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";

export const metadata = { title: "Ingresar" };

const DEMO = [
  ["estudiante@demo.com", "Postulante", "Camila · Estudiante EPN"],
  ["empresa@demo.com", "Empresa", "Andes Software Lab"],
  ["admin@demo.com", "Administración", "Coordinación de Vinculación"],
];

export default function LoginPage({ searchParams }: { searchParams: { next?: string } }) {
  const u = getSession();
  if (u) redirect(homeFor(u.role));
  return (
    <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
      <Card className="p-6">
        <h1 className="text-2xl font-semibold">Ingresar</h1>
        <p className="mt-1 text-sm text-muted-foreground">Accede como estudiante, empresa o administración.</p>
        <form action={loginAction} className="mt-6 flex flex-col gap-4">
          <input type="hidden" name="next" value={searchParams.next ?? ""} />
          <Field label="Correo electrónico"><Input name="email" type="email" required autoComplete="email" /></Field>
          <Field label="Contraseña"><Input name="password" type="password" required autoComplete="current-password" /></Field>
          <SubmitButton>Ingresar</SubmitButton>
        </form>
        <p className="mt-4 text-sm text-muted-foreground">¿No tienes cuenta? <Link href="/registro" className="font-medium text-theme hover:underline">Regístrate</Link></p>
      </Card>
      <Card className="p-6">
        <h2 className="text-lg font-semibold">Acceso rápido de demostración</h2>
        <p className="mt-1 text-sm text-muted-foreground">Todas las cuentas de prueba usan la contraseña <code className="font-mono">123456</code>.</p>
        <div className="mt-4 flex flex-col gap-2">
          {DEMO.map(([email, role, who]) => (
            <form key={email} action={demoLoginAction}>
              <input type="hidden" name="email" value={email} />
              <button className="flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left hover:border-theme hover:bg-theme/5">
                <span><span className="block text-sm font-medium">{role}</span><span className="text-xs text-muted-foreground">{who} · {email}</span></span>
                <span className="text-theme">→</span>
              </button>
            </form>
          ))}
        </div>
      </Card>
    </div>
  );
}

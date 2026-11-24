import { LinkButton } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <h1 className="text-[32px] font-semibold leading-tight text-slate-900">No encontramos esta página</h1>
      <p className="mt-2 text-sm text-muted-foreground">Puede que la vacante haya cerrado o que el enlace sea incorrecto.</p>
      <LinkButton href="/empleos" className="mt-6">Ver vacantes</LinkButton>
    </div>
  );
}

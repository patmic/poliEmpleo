import Link from "next/link";
import type { Application } from "@/lib/data";
import { withdrawAction } from "@/app/actions";
import { Card, ScoreBadge, StatusBadge, Stepper, fmtDate } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";

/** Tarjeta de una postulación: estado, progreso, historial y retirar. Se usa en Inicio y en el detalle de la vacante. */
export function ApplicationCard({ a }: { a: Application }) {
  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href={`/empleos/${a.job_id}`} className="text-base font-medium hover:text-theme">{a.job_title}</Link>
          <div className="text-sm text-muted-foreground">{a.company_name} · postulada el {fmtDate(a.created_at)}</div>
        </div>
        <div className="flex items-center gap-2"><ScoreBadge score={a.match_score} /><StatusBadge status={a.status} /></div>
      </div>
      <div className="mt-4"><Stepper status={a.status} /></div>
      <details className="mt-4 text-sm">
        <summary className="cursor-pointer text-muted-foreground">Historial ({a.events.length})</summary>
        <ol className="mt-2 flex flex-col gap-1 border-l pl-4">
          {a.events.map((e, i) => <li key={i}><span className="font-medium">{e.status}</span> · <span className="text-muted-foreground">{fmtDate(e.created_at)}{e.note ? ` — ${e.note}` : ""}</span></li>)}
        </ol>
      </details>
      {a.status === "En revisión" ? (
        <form action={withdrawAction} className="mt-3">
          <input type="hidden" name="application_id" value={a.id} />
          <SubmitButton variant="ghost" size="sm" confirm="¿Retirar esta postulación?">Retirar postulación</SubmitButton>
        </form>
      ) : null}
    </Card>
  );
}

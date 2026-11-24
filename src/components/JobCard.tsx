import Link from "next/link";
import type { Job } from "@/lib/data";
import { Badge, Card, ScoreBadge, StatusBadge, TagList, fmtDate } from "./ui";

export function JobCard({ job, showMatch = false }: { job: Job; showMatch?: boolean }) {
  return (
    <Card className="flex flex-col gap-3 p-5 transition-colors hover:border-theme/50">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link href={`/empleos/${job.id}`} className="text-base font-medium text-slate-900 hover:text-theme">{job.title}</Link>
          <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
            <Link href={`/empresas/${job.company_id}`} className="hover:underline">{job.company_name}</Link>
            {job.company_verified ? <span title="Empresa verificada" className="text-theme">✓</span> : null}
            <span>· {job.city}</span>
          </div>
        </div>
        {showMatch && job.match ? <ScoreBadge score={job.match.score} /> : null}
      </div>
      <p className="line-clamp-2 text-sm text-slate-600">{job.description}</p>
      <div className="flex flex-wrap gap-1.5">
        <Badge variant="theme">{job.modality}</Badge>
        <Badge variant="secondary">{job.job_type}</Badge>
        {job.status !== "active" ? <Badge variant="warning">{job.status === "paused" ? "Pausada" : "Cerrada"}</Badge> : null}
        {job.my_status ? <StatusBadge status={job.my_status} /> : null}
      </div>
      <TagList tags={job.tags} highlight={job.match?.matched} max={6} />
      <div className="mt-auto flex items-center justify-between border-t pt-3 text-xs text-muted-foreground">
        <span>{job.salary}</span>
        <span>Publicada {fmtDate(job.created_at)} · {job.applicant_count} postulante{job.applicant_count === 1 ? "" : "s"}</span>
      </div>
    </Card>
  );
}

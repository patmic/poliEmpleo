import { getSession } from "@/lib/auth";
import { getStudent, listJobs } from "@/lib/data";
import { cvPersonalization } from "@/lib/personalizacion";
import { ExploreStage } from "@/components/explore/ExploreStage";

export const metadata = { title: "Buscar empleo" };

export default function JobsPage() {
  const user = getSession();
  const studentId = user?.role === "student" ? user.id : undefined;
  const jobs = listJobs({}, studentId);
  const st = studentId ? getStudent(studentId) : null;
  const cv = cvPersonalization(st);
  return (
    <ExploreStage
      jobs={jobs}
      viewer={user ? { name: user.name, role: user.role } : null}
      cvPercent={cv.percent}
      cvMissing={cv.missing}
      perfil={st ? { foto: st.foto, headline: st.headline, bio: st.bio } : null}
    />
  );
}

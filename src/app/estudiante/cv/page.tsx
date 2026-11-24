import { requireUser } from "@/lib/auth";
import { getStudent } from "@/lib/data";
import { CAREERS } from "@/lib/catalog";
import { PageHeader } from "@/components/ui";
import { CvEditor } from "./CvEditor";
import { PerfilForm } from "./PerfilForm";
import { emptyEducation } from "@/lib/cv";

export const metadata = { title: "Mi CV" };

export default function CvPage() {
  const u = requireUser("student");
  const s = getStudent(u.id)!;
  const cv = structuredClone(s.cv);
  if (!cv.education.length) cv.education = [emptyEducation()];
  // Nombre, contacto y formación vienen del perfil; la hoja los edita y los guarda en el perfil.
  // El perfil profesional es propio del CV; "Sobre mí" solo sirve como texto inicial.
  cv.personal = { ...cv.personal, full_name: s.name, email: s.email, phone: s.phone, city: s.city, linkedin: s.linkedin, portfolio: s.portfolio, summary: s.cv_updated_at ? cv.personal.summary : s.bio };
  cv.education[0] = { ...cv.education[0], institution: s.institution, degree: s.career, gpa: s.gpa };
  return (
    <>
      <PageHeader title="Mi CV" />
      <div className="flex flex-col gap-6 xl:flex-row xl:items-start">
        <div className="min-w-0 flex-1">
          <CvEditor
            initial={cv}
            headline={s.headline}
            origin={s.origin}
            careers={CAREERS}
            foto={s.foto}
            userTags={s.tags}
            lastSaved={s.cv_updated_at}
            studentId={s.id}
          />
        </div>
        <aside className="w-full xl:w-[380px] xl:shrink-0">
          <PerfilForm s={s} />
        </aside>
      </div>
    </>
  );
}

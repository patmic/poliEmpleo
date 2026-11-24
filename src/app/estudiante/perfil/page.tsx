import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";

export default function StudentProfileRedirect() {
  requireUser("student");
  redirect("/estudiante/cv");
}

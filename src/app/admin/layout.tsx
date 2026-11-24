import type { ReactNode } from "react";
import { requireUser } from "@/lib/auth";

export default function AdminLayout({ children }: { children: ReactNode }) {
  requireUser("admin");
  return <>{children}</>;
}

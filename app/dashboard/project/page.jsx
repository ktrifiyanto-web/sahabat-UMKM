import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUsahaSaya } from "@/lib/usaha-aktif";
import ProjectManager from "@/components/ProjectManager";

export default async function ProjectPage() {
  const supabase = await createClient();
  const { usahaAktif } = await getUsahaSaya();
  const tenant = usahaAktif;
  if (!tenant) redirect("/dashboard");

  const { data: projects } = await supabase
    .from("projects")
    .select("id, nama, status, target_selesai")
    .eq("tenant_id", tenant.id)
    .order("created_at", { ascending: false });

  return (
    <div className="mt-3">
      <h1 className="font-display font-bold text-lg">Prioritas Project 90 Hari</h1>
      <p className="text-[11.5px] text-ink-soft mb-4">Kelola inisiatif prioritas jangka pendekmu.</p>
      <ProjectManager tenantId={tenant.id} projectsAwal={projects || []} />
    </div>
  );
}

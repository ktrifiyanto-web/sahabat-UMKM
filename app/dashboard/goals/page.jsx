import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUsahaSaya } from "@/lib/usaha-aktif";
import GoalManager from "@/components/GoalManager";

export default async function GoalsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { usahaAktif } = await getUsahaSaya();
  const tenant = usahaAktif;

  if (!tenant) {
    redirect("/dashboard");
  }

  const { data: goals } = await supabase
    .from("goals")
    .select("id, judul, jenis, target_nilai, nilai_saat_ini, status, deadline")
    .eq("tenant_id", tenant.id)
    .order("created_at", { ascending: false });

  return <GoalManager tenantId={tenant.id} userId={user.id} goalsAwal={goals || []} />;
}

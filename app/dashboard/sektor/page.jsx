import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import FormSektor from "@/components/FormSektor";

export default async function SektorPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: tenant } = await supabase
    .from("tenants")
    .select("id")
    .eq("owner_id", user.id)
    .limit(1)
    .maybeSingle();
  if (!tenant) redirect("/dashboard");

  const { data: sektor } = await supabase
    .from("sector_reports")
    .select("*")
    .eq("tenant_id", tenant.id)
    .maybeSingle();

  return (
    <div className="mt-3">
      <h1 className="font-display font-bold text-lg">Target &amp; Aktual per Sektor</h1>
      <p className="text-[11.5px] text-ink-soft mb-4">
        Isi capaian aktualmu — angka target ditetapkan bersama mentormu.
      </p>
      <FormSektor tenantId={tenant.id} dataAwal={sektor} mode="tenant" />
    </div>
  );
}

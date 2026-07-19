import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import FormUpsert from "@/components/FormUpsert";

export default async function RoadmapPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: tenant } = await supabase
    .from("tenants").select("id").eq("owner_id", user.id).limit(1).maybeSingle();
  if (!tenant) redirect("/dashboard");

  const { data } = await supabase.from("roadmaps").select("*").eq("tenant_id", tenant.id).maybeSingle();

  return (
    <div className="mt-3">
      <h1 className="font-display font-bold text-lg">Target Jangka Panjang</h1>
      <p className="text-[11.5px] text-ink-soft mb-4">Rencana pertumbuhan multi-tahun usahamu.</p>
      <FormUpsert
        tabel="roadmaps"
        tenantId={tenant.id}
        dataAwal={data}
        fields={[
          { key: "target_2026", label: "🏁 Target Akhir 2026", rows: 2, placeholder: "mis. Omzet Rp150jt/bulan, legalitas lengkap" },
          { key: "target_2027", label: "📅 Target 2027", rows: 2, placeholder: "mis. Buka 3 titik reseller, tim jadi 8 orang" },
          { key: "target_2028", label: "🚀 Target 2028", rows: 2, placeholder: "mis. Ekspansi luar Kebumen" },
        ]}
      />
    </div>
  );
}

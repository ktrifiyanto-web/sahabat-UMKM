import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import FormUpsert from "@/components/FormUpsert";

export default async function StrategiPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: tenant } = await supabase
    .from("tenants").select("id").eq("owner_id", user.id).limit(1).maybeSingle();
  if (!tenant) redirect("/dashboard");

  const { data } = await supabase.from("strategies").select("*").eq("tenant_id", tenant.id).maybeSingle();

  return (
    <div className="mt-3">
      <h1 className="font-display font-bold text-lg">Strategi &amp; Peluang</h1>
      <p className="text-[11.5px] text-ink-soft mb-4">Arah pengembangan bisnismu ke depan.</p>
      <FormUpsert
        tabel="strategies"
        tenantId={tenant.id}
        dataAwal={data}
        fields={[
          { key: "strategi_utama", label: "🎯 Strategi Utama", rows: 3, placeholder: "Strategi besar yang jadi fokus" },
          { key: "prioritas_pengembangan", label: "🚀 Prioritas Pengembangan", rows: 3, placeholder: "Apa yang mau dikembangkan dulu" },
          { key: "bottleneck", label: "⚠️ Business Bottleneck", rows: 2, placeholder: "Hambatan terbesar saat ini" },
          { key: "peluang", label: "✨ Peluang 3 Bulan ke Depan", rows: 2, placeholder: "Momentum atau kesempatan terdekat" },
        ]}
      />
    </div>
  );
}

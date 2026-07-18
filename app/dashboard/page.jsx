import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import PanelTransaksi from "@/components/PanelTransaksi";
import SetupUsaha from "@/components/SetupUsaha";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: tenant } = await supabase
    .from("tenants")
    .select("id, nama_usaha")
    .eq("owner_id", user.id)
    .limit(1)
    .maybeSingle();

  if (!tenant) {
    return (
      <Suspense fallback={null}>
        <SetupUsaha userId={user.id} />
      </Suspense>
    );
  }

  const { data: coaList } = await supabase.from("coa").select("id, nama");

  const { data: transaksi } = await supabase
    .from("transactions")
    .select("id, teks_asli, nominal, tipe, status, ai_confidence, tanggal, coa:coa_id(nama)")
    .eq("tenant_id", tenant.id)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <PanelTransaksi
      tenantId={tenant.id}
      userId={user.id}
      coaList={coaList || []}
      transaksiAwal={transaksi || []}
    />
  );
}

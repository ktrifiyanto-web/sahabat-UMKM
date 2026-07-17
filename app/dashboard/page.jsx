import { createClient } from "@/lib/supabase/server";
import PanelTransaksi from "@/components/PanelTransaksi";

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
      <div className="mt-10 bg-card border border-line rounded-2xl p-6 text-sm text-ink-soft">
        Usaha kamu belum tercatat di sistem. Coba keluar lalu daftar ulang, atau hubungi admin.
      </div>
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

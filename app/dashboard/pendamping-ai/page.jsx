import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUsahaSaya } from "@/lib/usaha-aktif";
import PendampingAI from "@/components/PendampingAI";

export default async function PendampingAIPage() {
  const supabase = await createClient();
  const { usahaAktif } = await getUsahaSaya();
  if (!usahaAktif) redirect("/dashboard");

  if (usahaAktif.peran !== "owner" && usahaAktif.peran !== "admin") {
    return (
      <div className="mt-3">
        <h1 className="font-display font-bold text-lg">Pendamping AI</h1>
        <div className="glass p-6 mt-4 text-center">
          <div className="text-2xl mb-2">🔒</div>
          <p className="text-[12px] text-ink-soft">
            Fitur ini baru bisa dipakai Owner &amp; Admin usaha. Hubungi pemilik usaha kalau kamu butuh akses.
          </p>
        </div>
      </div>
    );
  }

  const { data: riwayat } = await supabase
    .from("ai_chat_messages")
    .select("id, peran, isi, created_at")
    .eq("tenant_id", usahaAktif.id)
    .order("created_at", { ascending: true })
    .limit(50);

  return (
    <div className="mt-3">
      <h1 className="font-display font-bold text-lg">Pendamping AI</h1>
      <p className="text-[11.5px] text-ink-soft mb-4">
        Ngobrol soal strategi, keuangan, pemasaran, atau operasional {usahaAktif.nama_usaha}.
      </p>
      <PendampingAI tenantId={usahaAktif.id} riwayatAwal={riwayat || []} />
    </div>
  );
}

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUsahaSaya } from "@/lib/usaha-aktif";
import ChatBox from "@/components/ChatBox";

export default async function ChatTenantPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { usahaAktif } = await getUsahaSaya();
  if (!usahaAktif) redirect("/dashboard");

  // mentor_id tidak ada di getUsahaSaya() (yang cuma ringkas), ambil di sini
  const { data: tenant } = await supabase
    .from("tenants")
    .select("id, mentor_id")
    .eq("id", usahaAktif.id)
    .maybeSingle();
  if (!tenant) redirect("/dashboard");

  let namaMentor = "Mentor";
  if (tenant.mentor_id) {
    const { data: m } = await supabase.from("profiles").select("nama").eq("id", tenant.mentor_id).maybeSingle();
    if (m?.nama) namaMentor = m.nama;
  }

  return (
    <div className="mt-3">
      <h1 className="font-display font-bold text-lg">Chat Mentor</h1>
      <p className="text-[11.5px] text-ink-soft mb-4">
        {tenant.mentor_id
          ? "Ngobrol atau curhat langsung — mentormu dapat notifikasi tiap kamu kirim pesan."
          : "Kamu belum punya mentor pendamping. Chat tetap tersimpan dan bisa dibaca admin program."}
      </p>
      <ChatBox
        tenantId={tenant.id}
        userId={user.id}
        namaLawan={namaMentor}
        inisialLawan={namaMentor.charAt(0).toUpperCase()}
      />
    </div>
  );
}

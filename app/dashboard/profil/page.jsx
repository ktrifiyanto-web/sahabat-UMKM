import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import FormProfil from "@/components/FormProfil";

export default async function ProfilPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: tenant } = await supabase
    .from("tenants")
    .select("id, nama_usaha, jenis_usaha, angkatan, nomor_stand, tahun_berdiri, alamat, jumlah_tim, kontak, media_sosial, marketplace, produk_utama, foto_owner_url, foto_produk_url, logo_url")
    .eq("owner_id", user.id)
    .limit(1)
    .maybeSingle();
  if (!tenant) redirect("/dashboard");

  const { data: profil } = await supabase
    .from("profiles").select("nama").eq("id", user.id).maybeSingle();

  return (
    <div className="mt-3">
      <h1 className="font-display font-bold text-lg">Profil Usaha</h1>
      <p className="text-[11.5px] text-ink-soft mb-4">
        Identitas peserta &amp; company profile untuk keperluan program inkubasi.
      </p>
      <FormProfil tenant={tenant} namaOwner={profil?.nama || ""} />
    </div>
  );
}

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUsahaSaya } from "@/lib/usaha-aktif";
import DaftarUsahaGrid from "@/components/DaftarUsahaGrid";
import KelolaAnggota from "@/components/KelolaAnggota";
import TambahUsaha from "@/components/TambahUsaha";

export default async function BisnisSayaPage() {
  const { user, daftarUsaha, usahaAktif } = await getUsahaSaya();
  if (!user) redirect("/login");

  const supabase = await createClient();

  let anggota = [];
  if (usahaAktif) {
    const { data } = await supabase
      .from("tenant_members")
      .select("user_id, peran, profiles:user_id (nama)")
      .eq("tenant_id", usahaAktif.id)
      .order("peran");
    anggota = (data || []).map((a) => ({ user_id: a.user_id, peran: a.peran, nama: a.profiles?.nama }));
  }

  return (
    <div className="mt-3">
      <h1 className="font-display font-bold text-lg">Bisnis saya</h1>
      <p className="text-[11.5px] text-ink-soft mb-5">
        Semua usaha yang kamu ikuti, apapun perannya di sana.
      </p>

      {daftarUsaha.length === 0 ? (
        <div className="max-w-sm">
          <TambahUsaha />
        </div>
      ) : (
        <>
          <DaftarUsahaGrid daftarUsaha={daftarUsaha} usahaAktifId={usahaAktif?.id} />

          {usahaAktif && (
            <KelolaAnggota
              tenantId={usahaAktif.id}
              anggota={anggota}
              isOwner={usahaAktif.peran === "owner"}
              userIdSaya={user.id}
            />
          )}
        </>
      )}
    </div>
  );
}

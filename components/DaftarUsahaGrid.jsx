"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { pilihUsahaAktif } from "@/app/dashboard/actions";
import { hapusUsaha } from "@/app/dashboard/bisnis-saya/actions";
import TambahUsaha from "@/components/TambahUsaha";

const BADGE = {
  owner: "bg-violet-soft text-violet",
  admin: "bg-cyan-soft text-cyan",
  member: "bg-green-soft text-green",
};
const LABEL = { owner: "Owner", admin: "Admin", member: "Member" };

export default function DaftarUsahaGrid({ daftarUsaha, usahaAktifId }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [hapusId, setHapusId] = useState(null); // usaha mana yang lagi diproses hapus
  const [ketikan, setKetikan] = useState("");
  const [error, setError] = useState(null);

  function pilih(id) {
    if (id === usahaAktifId) return;
    startTransition(async () => {
      await pilihUsahaAktif(id);
      router.refresh();
    });
  }

  function bukaKonfirmasiHapus(u) {
    setHapusId(u.id);
    setKetikan("");
    setError(null);
  }

  function konfirmasiHapus(u) {
    setError(null);
    startTransition(async () => {
      const hasil = await hapusUsaha(u.id, ketikan);
      if (hasil?.error) {
        setError(hasil.error);
      } else {
        setHapusId(null);
        router.refresh();
      }
    });
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
      {daftarUsaha.map((u) => {
        const aktif = u.id === usahaAktifId;
        const lagiHapus = hapusId === u.id;
        return (
          <div key={u.id} className={`glass p-4 flex flex-col gap-2.5 ${aktif ? "outline outline-2 outline-cyan" : ""}`}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="font-bold text-[14px]">{u.nama_usaha}</div>
                {u.jenis_usaha && <div className="text-[11px] text-ink-soft">{u.jenis_usaha}</div>}
              </div>
              <span className={`text-[10.5px] font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap ${BADGE[u.peran] || ""}`}>
                {LABEL[u.peran] || u.peran}
              </span>
            </div>

            {!lagiHapus && (
              <button
                onClick={() => pilih(u.id)}
                disabled={isPending}
                className={aktif ? "btn-grad text-white text-[12px] font-bold rounded-xl py-2" : "text-[12px] font-bold rounded-xl py-2 border border-line text-ink"}
              >
                {aktif ? "● Sedang dibuka" : "Buka usaha ini"}
              </button>
            )}

            {u.peran === "owner" && !lagiHapus && (
              <button
                onClick={() => bukaKonfirmasiHapus(u)}
                className="text-[10.5px] font-bold text-pink text-left"
              >
                Hapus usaha ini
              </button>
            )}

            {lagiHapus && (
              <div className="border-t border-dashed border-line pt-2.5 mt-1">
                <p className="text-[10.5px] text-ink-soft mb-1.5">
                  Ini akan <b className="text-pink">menghapus permanen</b> semua transaksi &amp; catatan usaha
                  ini. Ketik <b>{u.nama_usaha}</b> buat konfirmasi:
                </p>
                <input
                  value={ketikan}
                  onChange={(e) => setKetikan(e.target.value)}
                  placeholder={u.nama_usaha}
                  className="w-full text-[12px] rounded-lg border border-line px-2.5 py-1.5 bg-white/80 mb-1.5"
                />
                {error && <p className="text-[10.5px] text-pink font-bold mb-1.5">{error}</p>}
                <div className="flex gap-2">
                  <button
                    onClick={() => konfirmasiHapus(u)}
                    disabled={isPending || ketikan.trim().toLowerCase() !== u.nama_usaha.trim().toLowerCase()}
                    className="flex-1 text-[11.5px] font-bold rounded-lg py-2 text-white bg-pink disabled:opacity-40"
                  >
                    {isPending ? "Menghapus…" : "Hapus permanen"}
                  </button>
                  <button
                    onClick={() => setHapusId(null)}
                    className="text-[11.5px] font-bold text-ink-soft px-3"
                  >
                    Batal
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
      <TambahUsaha />
    </div>
  );
}

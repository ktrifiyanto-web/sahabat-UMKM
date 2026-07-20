"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { pilihUsahaAktif } from "@/app/dashboard/actions";
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

  function pilih(id) {
    if (id === usahaAktifId) return;
    startTransition(async () => {
      await pilihUsahaAktif(id);
      router.refresh();
    });
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
      {daftarUsaha.map((u) => {
        const aktif = u.id === usahaAktifId;
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
            <button
              onClick={() => pilih(u.id)}
              disabled={isPending}
              className={aktif ? "btn-grad text-white text-[12px] font-bold rounded-xl py-2" : "text-[12px] font-bold rounded-xl py-2 border border-line text-ink"}
            >
              {aktif ? "● Sedang dibuka" : "Buka usaha ini"}
            </button>
          </div>
        );
      })}
      <TambahUsaha />
    </div>
  );
}

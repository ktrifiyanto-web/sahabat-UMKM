"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { pilihUsahaAktif } from "@/app/dashboard/actions";

const LABEL_PERAN = { owner: "Owner", admin: "Admin", member: "Member" };

export default function PilihUsaha({ daftarUsaha, usahaAktifId }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  if (!daftarUsaha || daftarUsaha.length <= 1) return null;

  function handleChange(e) {
    const id = e.target.value;
    startTransition(async () => {
      await pilihUsahaAktif(id);
      router.refresh();
    });
  }

  return (
    <select
      value={usahaAktifId || ""}
      onChange={handleChange}
      disabled={isPending}
      className="text-[11px] font-bold rounded-lg border border-line bg-white/70 px-2 py-1.5 max-w-[150px] truncate"
    >
      {daftarUsaha.map((u) => (
        <option key={u.id} value={u.id}>
          {u.nama_usaha} · {LABEL_PERAN[u.peran] || u.peran}
        </option>
      ))}
    </select>
  );
}

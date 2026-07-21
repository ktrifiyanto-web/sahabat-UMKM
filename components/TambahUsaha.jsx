"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { buatUsahaBaru } from "@/app/dashboard/actions";

export default function TambahUsaha() {
  const [buka, setBuka] = useState(false);
  const [nama, setNama] = useState("");
  const [jenis, setJenis] = useState("");
  const [error, setError] = useState(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  if (!buka) {
    return (
      <button
        onClick={() => setBuka(true)}
        className="glass add-card flex items-center justify-center border-2 border-dashed border-violet/30 !shadow-none text-violet font-bold text-[13.5px] min-h-[120px]"
      >
        + Tambah usaha baru
      </button>
    );
  }

  function simpan(e) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const hasil = await buatUsahaBaru(nama, jenis);
      if (hasil?.error) {
        setError(hasil.error);
      } else {
        setBuka(false);
        setNama("");
        setJenis("");
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={simpan} className="glass p-4 flex flex-col gap-2">
      <input
        autoFocus
        placeholder="Nama usaha"
        value={nama}
        onChange={(e) => setNama(e.target.value)}
        className="text-[13px] rounded-lg border border-line px-3 py-2 bg-white/80"
      />
      <input
        placeholder="Jenis usaha (mis. Kuliner)"
        value={jenis}
        onChange={(e) => setJenis(e.target.value)}
        className="text-[13px] rounded-lg border border-line px-3 py-2 bg-white/80"
      />
      {error && <p className="text-[11px] text-pink font-bold">{error}</p>}
      <div className="flex gap-2 mt-1">
        <button disabled={isPending} className="btn-grad text-white text-[12px] font-bold rounded-xl px-4 py-2 flex-1">
          {isPending ? "Menyimpan…" : "Simpan"}
        </button>
        <button
          type="button"
          onClick={() => setBuka(false)}
          className="text-[12px] font-bold text-ink-soft px-3"
        >
          Batal
        </button>
      </div>
    </form>
  );
}

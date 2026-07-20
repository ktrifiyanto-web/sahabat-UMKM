"use client";

import { useState, useTransition } from "react";
import { undangAnggota, ubahPeranAnggota, hapusAnggota } from "@/app/dashboard/bisnis-saya/actions";

const BADGE = {
  owner: "bg-violet-soft text-violet",
  admin: "bg-cyan-soft text-cyan",
  member: "bg-green-soft text-green",
};
const LABEL = { owner: "Owner", admin: "Admin", member: "Member" };

export default function KelolaAnggota({ tenantId, anggota, isOwner, userIdSaya }) {
  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState("");
  const [peran, setPeran] = useState("member");
  const [pesan, setPesan] = useState(null);
  const [isPending, startTransition] = useTransition();

  function kirimUndangan(e) {
    e.preventDefault();
    setPesan(null);
    startTransition(async () => {
      const hasil = await undangAnggota(tenantId, email, peran);
      if (hasil?.error) {
        setPesan({ jenis: "error", teks: hasil.error });
      } else {
        setPesan({ jenis: "ok", teks: "Undangan terkirim!" });
        setEmail("");
        setShowForm(false);
      }
    });
  }

  function ubahPeran(userId, peranBaru) {
    startTransition(async () => {
      await ubahPeranAnggota(tenantId, userId, peranBaru);
    });
  }

  function keluarkan(userId, nama) {
    if (!confirm(`Keluarkan ${nama || "anggota ini"} dari usaha?`)) return;
    startTransition(async () => {
      await hapusAnggota(tenantId, userId);
    });
  }

  return (
    <div className="glass p-6">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
        <div>
          <h2 className="font-display font-bold text-[17px]">Anggota</h2>
          <p className="text-[11px] text-ink-soft">Siapa saja yang punya akses ke usaha ini.</p>
        </div>
        {isOwner && (
          <button
            onClick={() => setShowForm((v) => !v)}
            className="btn-grad text-white text-[12px] font-bold rounded-xl px-4 py-2"
          >
            + Undang anggota
          </button>
        )}
      </div>

      <table className="w-full text-[12.5px] mt-4">
        <thead>
          <tr className="text-left text-ink-soft text-[10.5px]">
            <th className="font-bold pb-2">Nama</th>
            <th className="font-bold pb-2">Peran</th>
            {isOwner && <th className="pb-2"></th>}
          </tr>
        </thead>
        <tbody>
          {anggota.map((a) => (
            <tr key={a.user_id} className="border-t border-line/60">
              <td className="py-2.5">
                {a.nama || a.user_id}
                {a.user_id === userIdSaya && <span className="text-ink-dim"> (kamu)</span>}
              </td>
              <td className="py-2.5">
                <span className={`text-[10.5px] font-bold px-2.5 py-0.5 rounded-full ${BADGE[a.peran] || ""}`}>
                  {LABEL[a.peran] || a.peran}
                </span>
              </td>
              {isOwner && (
                <td className="py-2.5 text-right">
                  {a.peran !== "owner" && (
                    <div className="flex gap-1.5 justify-end">
                      <select
                        defaultValue={a.peran}
                        onChange={(e) => ubahPeran(a.user_id, e.target.value)}
                        disabled={isPending}
                        className="text-[10.5px] font-bold rounded-lg border border-line px-1.5 py-1 bg-white/70"
                      >
                        <option value="admin">Admin</option>
                        <option value="member">Member</option>
                      </select>
                      <button
                        onClick={() => keluarkan(a.user_id, a.nama)}
                        disabled={isPending}
                        className="text-[10.5px] font-bold text-pink px-2"
                      >
                        Keluarkan
                      </button>
                    </div>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      {isOwner && showForm && (
        <form onSubmit={kirimUndangan} className="mt-5 pt-4 border-t border-dashed border-line flex flex-wrap gap-2.5 items-center">
          <input
            type="email"
            required
            placeholder="Email anggota yang mau diundang"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 min-w-[200px] text-[12.5px] rounded-lg border border-line px-3 py-2 bg-white/80"
          />
          <select
            value={peran}
            onChange={(e) => setPeran(e.target.value)}
            className="text-[12.5px] rounded-lg border border-line px-2 py-2 bg-white/80"
          >
            <option value="admin">Admin — boleh input & edit transaksi</option>
            <option value="member">Member — input transaksi cabang sendiri</option>
          </select>
          <button
            disabled={isPending}
            className="btn-grad-pink text-white text-[12px] font-bold rounded-xl px-4 py-2"
          >
            {isPending ? "Mengirim…" : "Kirim undangan"}
          </button>
        </form>
      )}

      {pesan && (
        <p className={`text-[11.5px] font-bold mt-3 ${pesan.jenis === "error" ? "text-pink" : "text-green"}`}>
          {pesan.teks}
        </p>
      )}
    </div>
  );
}

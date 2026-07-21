"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { kirimPesanAI } from "@/app/dashboard/pendamping-ai/actions";

export default function PendampingAI({ tenantId, riwayatAwal }) {
  const [pesan, setPesan] = useState(riwayatAwal || []);
  const [input, setInput] = useState("");
  const [isPending, startTransition] = useTransition();
  const bawahRef = useRef(null);

  useEffect(() => {
    bawahRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [pesan, isPending]);

  function kirim(e) {
    e.preventDefault();
    const teks = input.trim();
    if (!teks || isPending) return;

    setPesan((p) => [...p, { peran: "user", isi: teks, id: `tmp-${Date.now()}` }]);
    setInput("");

    startTransition(async () => {
      const hasil = await kirimPesanAI(tenantId, teks);
      if (hasil?.error) {
        setPesan((p) => [...p, { peran: "assistant", isi: `⚠️ ${hasil.error}`, id: `err-${Date.now()}` }]);
      } else {
        setPesan((p) => [...p, { peran: "assistant", isi: hasil.jawaban, id: `ai-${Date.now()}` }]);
      }
    });
  }

  const saran = ["Gimana kondisi keuangan bulan ini?", "Ada saran strategi buat naikin omzet?", "Apa yang perlu aku perbaiki?"];

  return (
    <div className="glass p-0 flex flex-col h-[70vh] max-h-[640px]">
      <div className="flex-1 overflow-y-auto p-5 space-y-3">
        {pesan.length === 0 && (
          <div className="text-center py-8">
            <div className="text-3xl mb-2">🤖</div>
            <div className="font-display font-bold text-[14px]">Halo! Aku Pendamping AI kamu</div>
            <p className="text-[11px] text-ink-soft mt-1 mb-4">
              Aku bisa bantu mikir soal strategi, keuangan, pemasaran, atau operasional usahamu.
            </p>
            <div className="flex flex-wrap gap-1.5 justify-center">
              {saran.map((s) => (
                <button
                  key={s}
                  onClick={() => setInput(s)}
                  className="text-[10.5px] font-bold text-cyan bg-cyan-soft rounded-full px-3 py-1.5"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {pesan.map((m) => (
          <div key={m.id} className={`flex ${m.peran === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={
                m.peran === "user"
                  ? "btn-grad text-white rounded-2xl rounded-br-sm px-4 py-2.5 text-[12.5px] max-w-[80%] whitespace-pre-wrap"
                  : "bg-white/80 border border-line rounded-2xl rounded-bl-sm px-4 py-2.5 text-[12.5px] max-w-[80%] whitespace-pre-wrap"
              }
            >
              {m.isi}
            </div>
          </div>
        ))}

        {isPending && (
          <div className="flex justify-start">
            <div className="bg-white/80 border border-line rounded-2xl rounded-bl-sm px-4 py-2.5 text-[12.5px] text-ink-soft">
              Mengetik…
            </div>
          </div>
        )}
        <div ref={bawahRef} />
      </div>

      <form onSubmit={kirim} className="flex gap-2 p-3.5 border-t border-line">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Tanya apa aja soal usahamu…"
          className="flex-1 text-[13px] rounded-xl border border-line px-3.5 py-2.5 bg-white/80 outline-none focus:border-cyan"
        />
        <button
          type="submit"
          disabled={isPending || !input.trim()}
          className="btn-grad text-white text-[12.5px] font-bold rounded-xl px-4 disabled:opacity-50"
        >
          Kirim
        </button>
      </form>
    </div>
  );
}

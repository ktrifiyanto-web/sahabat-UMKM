"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const JENIS = [
  { v: "arahan", label: "Arahan" },
  { v: "evaluasi", label: "Evaluasi" },
  { v: "tugas", label: "Tugas" },
];

export default function FormArahan({ tenantId, mentorId }) {
  const supabase = createClient();
  const router = useRouter();
  const [jenis, setJenis] = useState("arahan");
  const [isi, setIsi] = useState("");
  const [status, setStatus] = useState("idle");

  const kirim = async () => {
    if (!isi.trim()) return;
    setStatus("saving");
    const { error } = await supabase.from("mentor_notes").insert({
      tenant_id: tenantId,
      mentor_id: mentorId,
      jenis,
      isi: isi.trim(),
    });
    if (error) { console.error(error); setStatus("idle"); return; }
    setIsi("");
    setStatus("ok");
    setTimeout(() => setStatus("idle"), 2000);
    router.refresh();
  };

  return (
    <div className="glass p-4">
      <div className="flex gap-1.5 mb-3">
        {JENIS.map((j) => (
          <button key={j.v} onClick={() => setJenis(j.v)}
            className="flex-1 py-2 rounded-xl text-[10px] font-extrabold"
            style={jenis === j.v
              ? { background: "linear-gradient(90deg,var(--violet),var(--pink))", color: "#fff" }
              : { background: "rgba(15,35,64,0.05)", color: "var(--ink-soft)" }}>
            {j.label}
          </button>
        ))}
      </div>
      <textarea
        rows={5}
        value={isi}
        onChange={(e) => setIsi(e.target.value)}
        placeholder="Tulis arahan, evaluasi, atau tugas untuk tenant ini... (akan muncul di checklist mereka + notifikasi)"
        className="w-full border border-line rounded-xl px-3.5 py-3 text-xs outline-none bg-white/70 focus:border-violet resize-y"
      />
      <button onClick={kirim} disabled={status === "saving"}
        className="btn-grad-pink rounded-xl px-5 py-2.5 text-xs mt-2.5 w-full sm:w-auto disabled:opacity-60">
        {status === "saving" ? "Mengirim..." : status === "ok" ? "✓ Terkirim ke Tenant" : "Kirim ke Tenant"}
      </button>
    </div>
  );
}

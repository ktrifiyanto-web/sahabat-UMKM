"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ChatBox({ tenantId, userId, namaLawan, inisialLawan }) {
  const supabase = createClient();
  const [pesan, setPesan] = useState([]);
  const [teks, setTeks] = useState("");
  const [sending, setSending] = useState(false);
  const bawahRef = useRef(null);

  const muat = async () => {
    const { data } = await supabase
      .from("chat_messages")
      .select("id, sender_id, isi, created_at")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: true })
      .limit(200);
    setPesan(data || []);
    // tandai pesan lawan sebagai dibaca
    await supabase
      .from("chat_messages")
      .update({ dibaca: true })
      .eq("tenant_id", tenantId)
      .neq("sender_id", userId)
      .eq("dibaca", false);
  };

  useEffect(() => {
    muat();
    const interval = setInterval(muat, 8000); // polling ringan tiap 8 detik
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId]);

  useEffect(() => {
    bawahRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [pesan.length]);

  const kirim = async () => {
    const isi = teks.trim();
    if (!isi) return;
    setSending(true);
    setTeks("");
    const { data, error } = await supabase
      .from("chat_messages")
      .insert({ tenant_id: tenantId, sender_id: userId, isi })
      .select("id, sender_id, isi, created_at")
      .single();
    setSending(false);
    if (error) { console.error(error); setTeks(isi); return; }
    setPesan((p) => [...p, data]);
  };

  const jam = (t) =>
    new Date(t).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="glass flex flex-col overflow-hidden" style={{ height: "calc(100vh - 210px)", minHeight: 380 }}>
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-line flex-shrink-0">
        <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-extrabold text-sm"
          style={{ background: "linear-gradient(135deg,var(--pink),var(--violet))" }}>
          {inisialLawan}
        </div>
        <div>
          <div className="font-display font-bold text-[13px]">{namaLawan}</div>
          <div className="text-[9.5px] text-ink-soft">Balasan masuk otomatis tiap beberapa detik</div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-2.5">
        {pesan.length === 0 && (
          <div className="text-xs text-ink-soft text-center py-8">
            Belum ada percakapan. Mulai chat pertamamu di bawah 👇
          </div>
        )}
        {pesan.map((p) => {
          const milikku = p.sender_id === userId;
          return (
            <div key={p.id} className={`flex ${milikku ? "justify-end" : "justify-start"}`}>
              <div
                className="max-w-[75%] px-3.5 py-2.5 text-xs leading-relaxed"
                style={
                  milikku
                    ? { background: "linear-gradient(135deg,var(--cyan),var(--violet))", color: "#fff", borderRadius: "15px 15px 4px 15px" }
                    : { background: "rgba(255,255,255,0.85)", border: "1px solid var(--line)", borderRadius: "15px 15px 15px 4px" }
                }
              >
                {p.isi}
                <div className="text-[8px] opacity-60 mt-1 text-right">{jam(p.created_at)}</div>
              </div>
            </div>
          );
        })}
        <div ref={bawahRef} />
      </div>

      <div className="flex gap-2 px-3.5 py-3 border-t border-line flex-shrink-0">
        <input
          value={teks}
          onChange={(e) => setTeks(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && kirim()}
          placeholder="Tulis pesan..."
          className="flex-1 min-w-0 border border-line rounded-full px-4 py-2.5 text-xs outline-none bg-white/70 focus:border-cyan"
        />
        <button onClick={kirim} disabled={sending}
          className="w-10 h-10 rounded-full text-white text-sm flex-shrink-0 disabled:opacity-60"
          style={{ background: "linear-gradient(135deg,var(--cyan),var(--violet))" }}>
          ➤
        </button>
      </div>
    </div>
  );
}

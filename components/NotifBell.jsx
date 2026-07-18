"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

export default function NotifBell({ userId }) {
  const supabase = createClient();
  const [notifs, setNotifs] = useState([]);
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const boxRef = useRef(null);

  const muat = async () => {
    const { data } = await supabase
      .from("notifications")
      .select("id, judul, isi, jenis, dibaca, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20);
    setNotifs(data || []);
    setLoaded(true);
  };

  useEffect(() => {
    muat();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const bukaDropdown = async () => {
    const next = !open;
    setOpen(next);
    if (next && !loaded) await muat();
  };

  const tandaiDibaca = async (id) => {
    setNotifs((prev) => prev.map((n) => (n.id === id ? { ...n, dibaca: true } : n)));
    await supabase.from("notifications").update({ dibaca: true }).eq("id", id);
  };

  const belumDibaca = notifs.filter((n) => !n.dibaca).length;

  return (
    <div className="relative" ref={boxRef}>
      <button
        onClick={bukaDropdown}
        className="relative w-9 h-9 rounded-full border border-line bg-card flex items-center justify-center text-base"
        aria-label="Notifikasi"
      >
        🔔
        {belumDibaca > 0 && (
          <span className="absolute -top-1 -right-1 bg-pink text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
            {belumDibaca > 9 ? "9+" : belumDibaca}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-72 bg-card border border-line rounded-2xl shadow-lg overflow-hidden z-30">
          <div className="px-4 py-3 border-b border-line font-bold text-sm">Notifikasi</div>
          <div className="max-h-72 overflow-y-auto">
            {notifs.length === 0 && (
              <div className="px-4 py-6 text-center text-xs text-ink-soft">Belum ada notifikasi.</div>
            )}
            {notifs.map((n) => (
              <button
                key={n.id}
                onClick={() => tandaiDibaca(n.id)}
                className="w-full text-left px-4 py-3 border-b border-line last:border-0 hover:bg-background transition-colors"
                style={{ background: n.dibaca ? "transparent" : "var(--violet-soft)" }}
              >
                <div className="text-xs font-bold">{n.judul}</div>
                {n.isi && <div className="text-xs text-ink-soft mt-0.5 line-clamp-2">{n.isi}</div>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { rupiah } from "@/lib/format";

const JENIS = [
  { v: "omzet", label: "Omzet" },
  { v: "laba", label: "Laba" },
  { v: "pelanggan", label: "Pelanggan" },
  { v: "produksi", label: "Produksi" },
  { v: "lainnya", label: "Lainnya" },
];

export default function GoalManager({ tenantId, userId, goalsAwal }) {
  const supabase = createClient();
  const [goals, setGoals] = useState(goalsAwal);
  const [showForm, setShowForm] = useState(false);
  const [judul, setJudul] = useState("");
  const [jenis, setJenis] = useState("omzet");
  const [target, setTarget] = useState("");
  const [deadline, setDeadline] = useState("");
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editNilai, setEditNilai] = useState("");

  const tambahGoal = async (e) => {
    e.preventDefault();
    if (!judul.trim() || !target) return;
    setSaving(true);
    const { data, error } = await supabase
      .from("goals")
      .insert({
        tenant_id: tenantId,
        judul: judul.trim(),
        jenis,
        target_nilai: Number(target),
        deadline: deadline || null,
        dibuat_oleh: userId,
      })
      .select("id, judul, jenis, target_nilai, nilai_saat_ini, status, deadline")
      .single();
    setSaving(false);
    if (error) {
      console.error("Gagal menambah goal:", error);
      return;
    }
    setGoals((g) => [data, ...g]);
    setJudul("");
    setTarget("");
    setDeadline("");
    setShowForm(false);
  };

  const simpanProgress = async (id) => {
    const nilai = Number(editNilai);
    if (Number.isNaN(nilai)) return;
    const goal = goals.find((g) => g.id === id);
    const status = nilai >= goal.target_nilai ? "tercapai" : "aktif";

    const { error } = await supabase
      .from("goals")
      .update({ nilai_saat_ini: nilai, status })
      .eq("id", id);

    if (!error) {
      setGoals((prev) => prev.map((g) => (g.id === id ? { ...g, nilai_saat_ini: nilai, status } : g)));
    }
    setEditId(null);
    setEditNilai("");
  };

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-extrabold">Target & KPI</h1>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="bg-violet text-white rounded-full px-4 py-2 text-xs font-bold"
        >
          {showForm ? "Batal" : "+ Target Baru"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={tambahGoal} className="tx-enter bg-card border border-line rounded-2xl p-4 mb-5 space-y-3">
          <input
            value={judul}
            onChange={(e) => setJudul(e.target.value)}
            placeholder='Judul target, mis. "Omzet Juli 10 juta"'
            className="w-full border border-line rounded-xl px-4 py-2.5 text-sm outline-none bg-background"
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <select
              value={jenis}
              onChange={(e) => setJenis(e.target.value)}
              className="border border-line rounded-xl px-3 py-2.5 text-sm outline-none bg-background"
            >
              {JENIS.map((j) => (
                <option key={j.v} value={j.v}>
                  {j.label}
                </option>
              ))}
            </select>
            <input
              type="number"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="Target angka (Rp / jumlah)"
              className="border border-line rounded-xl px-3 py-2.5 text-sm outline-none bg-background"
              required
            />
          </div>
          <input
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="w-full border border-line rounded-xl px-4 py-2.5 text-sm outline-none bg-background"
          />
          <button
            type="submit"
            disabled={saving}
            className="w-full bg-violet text-white rounded-xl py-2.5 font-bold text-sm disabled:opacity-60"
          >
            {saving ? "Menyimpan..." : "Simpan Target"}
          </button>
        </form>
      )}

      {goals.length === 0 && !showForm && (
        <div className="text-sm text-ink-soft bg-card border border-line rounded-2xl p-6 text-center">
          Belum ada target. Buat target pertamamu supaya progress bisnismu lebih terarah.
        </div>
      )}

      <div className="space-y-3">
        {goals.map((g) => {
          const persen = Math.min(100, Math.round(((g.nilai_saat_ini || 0) / g.target_nilai) * 100));
          return (
            <div key={g.id} className="bg-card border border-line rounded-2xl p-4">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <div className="font-bold text-sm">{g.judul}</div>
                  <div className="text-xs text-ink-soft mt-0.5">
                    {rupiah(g.nilai_saat_ini || 0)} / {rupiah(g.target_nilai)}
                    {g.status === "tercapai" && <span className="text-green font-bold"> · Tercapai 🎉</span>}
                  </div>
                </div>
                {editId === g.id ? (
                  <div className="flex gap-2">
                    <input
                      autoFocus
                      type="number"
                      value={editNilai}
                      onChange={(e) => setEditNilai(e.target.value)}
                      className="w-28 border border-line rounded-lg px-2 py-1 text-sm outline-none bg-background"
                      placeholder="Progress"
                    />
                    <button
                      onClick={() => simpanProgress(g.id)}
                      className="bg-violet text-white rounded-lg px-3 py-1 text-xs font-bold"
                    >
                      Simpan
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setEditId(g.id);
                      setEditNilai(String(g.nilai_saat_ini || 0));
                    }}
                    className="border border-line rounded-full px-3 py-1.5 text-xs font-semibold text-violet"
                  >
                    Update →
                  </button>
                )}
              </div>
              <div className="h-2 bg-background rounded-full overflow-hidden mt-3">
                <div
                  className={`h-full ${g.status === "tercapai" ? "bg-green" : "bg-amber"}`}
                  style={{ width: `${persen}%` }}
                />
              </div>
              <div className="text-xs text-ink-soft mt-1">{persen}% tercapai</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

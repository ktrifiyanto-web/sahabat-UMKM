"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { rupiah, tanggalIndo } from "@/lib/format";
import { parseSantai } from "@/lib/kategorisasi-lokal";

export default function PanelTransaksi({ tenantId, userId, coaList, transaksiAwal }) {
  const supabase = createClient();
  const coaMap = useMemo(() => {
    const m = {};
    coaList.forEach((c) => (m[c.nama] = c.id));
    return m;
  }, [coaList]);

  const [txs, setTxs] = useState(
    transaksiAwal.map((t) => ({
      id: t.id,
      teks: t.teks_asli,
      nominal: t.nominal,
      tipe: t.tipe,
      akun: t.coa?.nama || "Belum Terkategori",
      status: t.status,
      tgl: tanggalIndo(t.tanggal),
    }))
  );
  const [draft, setDraft] = useState("");
  const [preview, setPreview] = useState(null);
  const [aiEnhancing, setAiEnhancing] = useState(false);
  const [ocrStatus, setOcrStatus] = useState("idle"); // idle | reading | error
  const [simpanLoading, setSimpanLoading] = useState(false);
  const debounceRef = useRef(null);
  const fileRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (draft.trim().length > 3) {
      const lokal = parseSantai(draft);
      setPreview(lokal);
      if (lokal.confidence < 0.6) {
        debounceRef.current = setTimeout(async () => {
          setAiEnhancing(true);
          try {
            const res = await fetch("/api/kategorisasi", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ teks: draft }),
            });
            const hasil = await res.json();
            if (!hasil.error) {
              setPreview((prev) => ({ ...hasil, nominal: hasil.nominal ?? prev?.nominal ?? null }));
            }
          } catch (e) {
            console.error("Kategorisasi error:", e);
          }
          setAiEnhancing(false);
        }, 700);
      }
    } else {
      setPreview(null);
    }
    return () => clearTimeout(debounceRef.current);
  }, [draft]);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = 0;
  }, [txs]);

  const simpanTransaksi = async ({ teks, nominal, tipe, akun, confidence }) => {
    setSimpanLoading(true);
    const coa_id = coaMap[akun] || coaMap["Belum Terkategori"] || null;
    const status = confidence < 0.6 ? "perlu_review" : "terverifikasi";

    const { data, error } = await supabase
      .from("transactions")
      .insert({
        tenant_id: tenantId,
        teks_asli: teks,
        nominal,
        tipe,
        coa_id,
        ai_confidence: confidence,
        status,
        dibuat_oleh: userId,
      })
      .select("id, tanggal")
      .single();

    setSimpanLoading(false);
    if (error) {
      console.error("Gagal menyimpan transaksi:", error);
      return false;
    }

    setTxs((prev) => [
      { id: data.id, teks, nominal, tipe, akun, status, tgl: tanggalIndo(data.tanggal) },
      ...prev,
    ]);
    return true;
  };

  const catat = async () => {
    if (!draft.trim() || !preview || preview.nominal == null) return;
    const ok = await simpanTransaksi({
      teks: draft.trim(),
      nominal: preview.nominal,
      tipe: preview.tipe,
      akun: preview.akun,
      confidence: preview.confidence,
    });
    if (ok) {
      setDraft("");
      setPreview(null);
    }
  };

  const bacaStruk = async (file) => {
    if (!file) return;
    setOcrStatus("reading");
    try {
      const base64 = await new Promise((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(r.result.split(",")[1]);
        r.onerror = () => rej(new Error("Gagal membaca file"));
        r.readAsDataURL(file);
      });
      const res = await fetch("/api/ocr-struk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ base64, mediaType: file.type || "image/jpeg" }),
      });
      const hasil = await res.json();
      if (hasil.error) throw new Error(hasil.error);

      await simpanTransaksi({
        teks: "📷 " + hasil.deskripsi,
        nominal: hasil.nominal,
        tipe: hasil.tipe,
        akun: hasil.akun,
        confidence: hasil.confidence,
      });
      setOcrStatus("idle");
    } catch (e) {
      console.error("OCR error:", e);
      setOcrStatus("error");
      setTimeout(() => setOcrStatus("idle"), 4000);
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  const ringkas = useMemo(() => {
    const masuk = txs.filter((t) => t.tipe === "masuk").reduce((a, b) => a + (b.nominal || 0), 0);
    const keluar = txs.filter((t) => t.tipe === "keluar").reduce((a, b) => a + (b.nominal || 0), 0);
    const review = txs.filter((t) => t.status === "perlu_review").length;
    return { masuk, keluar, laba: masuk - keluar, review };
  }, [txs]);

  return (
    <div className="mt-4">
      {/* Ringkasan */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        <Kartu label="Uang masuk bulan ini" nilai={rupiah(ringkas.masuk)} warna="text-green" bg="bg-green-soft" />
        <Kartu label="Uang keluar" nilai={rupiah(ringkas.keluar)} warna="text-pink" bg="bg-pink-soft" />
        <Kartu
          label="Untung sementara"
          nilai={rupiah(ringkas.laba)}
          warna={ringkas.laba >= 0 ? "text-green" : "text-pink"}
          bg="bg-card"
          tebal
        />
      </section>

      {ringkas.review > 0 && (
        <div className="bg-amber-soft border border-amber/30 rounded-2xl px-4 py-2.5 text-sm mb-5" style={{ color: "#8A6A05" }}>
          ✋ {ringkas.review} catatan masih kurang yakin kategorinya — cek sebentar di daftar bawah ya.
        </div>
      )}

      {/* Daftar transaksi */}
      <section className="bg-card border border-line rounded-2xl overflow-hidden mb-4">
        <div className="px-5 py-3.5 border-b border-line flex justify-between items-center">
          <span className="font-bold text-sm">Catatan harianmu</span>
          <Link
            href="/dashboard/laporan"
            className="border border-line bg-white text-violet rounded-full px-3.5 py-1.5 text-xs font-semibold"
          >
            Lihat Laba Rugi 📄
          </Link>
        </div>
        <div ref={listRef} className="max-h-80 overflow-y-auto px-3 py-2">
          {txs.length === 0 && (
            <div className="text-center py-10">
              <svg width="88" height="72" viewBox="0 0 120 100" fill="none" className="mx-auto mb-3">
                <circle cx="60" cy="45" r="34" fill="var(--violet-soft)" />
                <circle cx="30" cy="20" r="8" fill="var(--amber-soft)" />
                <circle cx="94" cy="66" r="11" fill="var(--green-soft)" />
                <path d="M46 48 Q60 60 74 48" stroke="var(--violet)" strokeWidth="4" fill="none" strokeLinecap="round" />
                <circle cx="50" cy="38" r="4" fill="var(--violet)" />
                <circle cx="70" cy="38" r="4" fill="var(--violet)" />
              </svg>
              <div className="text-sm text-ink-soft">
                Belum ada catatan. Coba tulis transaksi pertamamu di bawah ini.
              </div>
            </div>
          )}
          {txs.map((t) => (
            <div key={t.id} className="tx-enter flex gap-3 py-2.5 px-2 border-b border-dashed border-line items-center">
              <span
                className="text-[9px] font-extrabold px-2 py-1 rounded-full whitespace-nowrap"
                style={
                  t.status === "perlu_review"
                    ? { background: "var(--amber-soft)", color: "#8A6A05" }
                    : t.tipe === "masuk"
                    ? { background: "var(--green-soft)", color: "#0F8F45" }
                    : { background: "var(--pink-soft)", color: "#C22368" }
                }
              >
                {t.status === "perlu_review" ? "CEK LAGI" : t.tipe === "masuk" ? "MASUK" : "KELUAR"}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold">{t.teks}</div>
                <div className="text-xs text-ink-soft mt-0.5">
                  {t.tgl} · {t.akun}
                </div>
              </div>
              <div className={`font-bold text-sm whitespace-nowrap ${t.tipe === "masuk" ? "text-green" : ""}`}>
                {t.tipe === "masuk" ? "+" : "−"}
                {rupiah(t.nominal)}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Input santai */}
      <section
        className="bg-card rounded-2xl p-4 transition-colors"
        style={{ border: `2px solid ${preview ? "var(--violet)" : "var(--line)"}` }}
      >
        <div className="text-xs text-ink-soft mb-2">
          Tulis santai saja, contoh: <em>"jual keripik 3 bungkus 45rb"</em> — atau tekan 📷 untuk foto struk
        </div>
        <div className="flex gap-2.5">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && catat()}
            placeholder="Hari ini ada transaksi apa?"
            className="flex-1 min-w-0 border border-line rounded-xl px-4 py-3 text-sm outline-none bg-background"
          />
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(e) => bacaStruk(e.target.files?.[0])}
            className="hidden"
            id="foto-struk"
          />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={ocrStatus === "reading"}
            title="Foto struk / nota"
            className="border rounded-xl px-4 text-lg"
            style={{ borderColor: ocrStatus === "reading" ? "var(--amber)" : "var(--line)" }}
          >
            {ocrStatus === "reading" ? "⏳" : "📷"}
          </button>
          <button
            onClick={catat}
            disabled={!preview || preview.nominal == null || simpanLoading}
            className="text-white rounded-xl px-6 font-bold text-sm disabled:opacity-50"
            style={{ background: preview && preview.nominal != null ? "var(--violet)" : "var(--line)" }}
          >
            {simpanLoading ? "..." : "Catat"}
          </button>
        </div>

        {ocrStatus === "reading" && (
          <div className="tx-enter mt-3 bg-amber-soft rounded-xl px-4 py-2.5 text-sm" style={{ color: "#8A6A05" }}>
            📷 Sedang membaca struk... Gemini menarik tanggal, item, dan totalnya untukmu.
          </div>
        )}
        {ocrStatus === "error" && (
          <div className="tx-enter mt-3 bg-pink-soft text-pink rounded-xl px-4 py-2.5 text-sm">
            Struk belum terbaca jelas — coba foto ulang lebih dekat & terang, atau ketik manual saja.
          </div>
        )}

        {preview && (
          <div
            className="tx-enter mt-3 rounded-xl px-4 py-2.5 text-sm"
            style={{ background: preview.confidence < 0.6 ? "var(--amber-soft)" : "var(--green-soft)" }}
          >
            <div className="font-bold mb-1">
              {preview.confidence < 0.6
                ? "🤔 Aku kurang yakin, tolong cek lagi ya:"
                : preview.aiEnhanced
                ? "✨ Gemini bantu pastikan:"
                : "✨ Aku pahami begini:"}
            </div>
            <div className="text-ink-soft">
              {preview.nominal != null ? rupiah(preview.nominal) : "(nominal belum terbaca)"} · {preview.akun}
              <span className="block mt-1 text-xs">Jurnal otomatis: {preview.jurnal.join(" ↔ ")}</span>
            </div>
          </div>
        )}
        {aiEnhancing && (
          <div className="tx-enter mt-2 text-xs text-ink-soft">⏳ Aku kurang yakin, lagi tanya Gemini biar lebih pas...</div>
        )}
      </section>
    </div>
  );
}

function Kartu({ label, nilai, warna, bg, tebal }) {
  return (
    <div className={`${bg} border border-line rounded-2xl px-4 py-4`}>
      <div className="text-xs text-ink-soft font-semibold">{label}</div>
      <div className={`font-display ${tebal ? "text-2xl" : "text-xl"} font-extrabold ${warna} mt-1`}>{nilai}</div>
    </div>
  );
}

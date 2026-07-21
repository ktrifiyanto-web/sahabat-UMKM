"use server";

import { createClient } from "@/lib/supabase/server";

const AKUN_LABEL = {
  masuk: "Pemasukan",
  keluar: "Pengeluaran",
};

// Kumpulkan data usaha buat dikasih ke AI sebagai konteks -- supaya
// jawabannya nyambung ke kondisi usaha yang sebenarnya, bukan ngarang.
async function kumpulkanKonteks(supabase, tenantId) {
  const tigaPuluhHari = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);

  const [{ data: tenant }, { data: transaksi }, { data: goals }, { data: sektor }] = await Promise.all([
    supabase.from("tenants").select("nama_usaha, jenis_usaha").eq("id", tenantId).maybeSingle(),
    supabase
      .from("transactions")
      .select("teks_asli, nominal, tipe, tanggal")
      .eq("tenant_id", tenantId)
      .gte("tanggal", tigaPuluhHari)
      .order("tanggal", { ascending: false })
      .limit(60),
    supabase
      .from("goals")
      .select("judul, jenis, target_nilai, nilai_saat_ini, status")
      .eq("tenant_id", tenantId)
      .eq("status", "aktif"),
    supabase.from("sector_reports").select("*").eq("tenant_id", tenantId).maybeSingle(),
  ]);

  const rows = transaksi || [];
  const masuk = rows.filter((t) => t.tipe === "masuk").reduce((a, b) => a + (b.nominal || 0), 0);
  const keluar = rows.filter((t) => t.tipe === "keluar").reduce((a, b) => a + (b.nominal || 0), 0);

  const daftarTransaksi = rows
    .map((t) => `- ${t.tanggal} | ${AKUN_LABEL[t.tipe]} | Rp${(t.nominal || 0).toLocaleString("id-ID")} | "${t.teks_asli}"`)
    .join("\n");

  const daftarGoal = (goals || [])
    .map((g) => `- ${g.judul} (${g.jenis}): capaian ${g.nilai_saat_ini}/${g.target_nilai}`)
    .join("\n") || "(belum ada goal aktif)";

  const sektorTeks = sektor
    ? `Pelanggan: ${sektor.pelanggan_aktual}/${sektor.pelanggan_target} target. Tim: ${sektor.tim_aktual}/${sektor.tim_target}. Mitra: ${sektor.mitra_aktual}/${sektor.mitra_target}. Legalitas: ${sektor.legalitas_status}.`
    : "(belum ada data sektor)";

  return `
Nama usaha: ${tenant?.nama_usaha || "-"} (${tenant?.jenis_usaha || "-"})

RINGKASAN 30 HARI TERAKHIR:
Total pemasukan: Rp${masuk.toLocaleString("id-ID")}
Total pengeluaran: Rp${keluar.toLocaleString("id-ID")}
Laba kasar: Rp${(masuk - keluar).toLocaleString("id-ID")}

DAFTAR TRANSAKSI (terbaru dulu):
${daftarTransaksi || "(belum ada transaksi)"}

GOAL AKTIF:
${daftarGoal}

DATA SEKTOR:
${sektorTeks}
`.trim();
}

export async function kirimPesanAI(tenantId, pesan) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Belum login" };
  if (!pesan || !pesan.trim()) return { error: "Pesan kosong" };

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return { error: "Kunci Gemini belum diatur di server" };

  // Simpan pesan user dulu (RLS otomatis nolak kalau bukan owner/admin usaha ini)
  const { error: errUser } = await supabase
    .from("ai_chat_messages")
    .insert({ tenant_id: tenantId, sender_id: user.id, peran: "user", isi: pesan.trim() });
  if (errUser) return { error: errUser.message };

  // Ambil riwayat percakapan (10 terakhir) buat konteks lanjutan obrolan
  const { data: riwayat } = await supabase
    .from("ai_chat_messages")
    .select("peran, isi")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(10);

  const konteksUsaha = await kumpulkanKonteks(supabase, tenantId);

  const systemPrompt = `Kamu adalah "Pendamping AI" di aplikasi SobatUMKM, teman ngobrol buat pemilik usaha kecil di Indonesia soal Strategi Bisnis, Keuangan, Pemasaran, dan Operasional.
Gaya bahasa: santai, hangat, seperti mentor bisnis yang suportif -- bukan formal kaku.
Jawab berdasarkan data usaha di bawah ini kalau relevan. Kalau datanya belum cukup buat jawab pasti, bilang jujur, jangan mengarang angka.
ATURAN PENTING: kamu HANYA memberi saran/insight. Kamu TIDAK PERNAH mengubah data, tidak bisa mencatat transaksi, tidak bisa menghapus apapun -- kalau user minta itu, arahkan mereka pakai fitur catat transaksi biasa.

DATA USAHA SAAT INI:
${konteksUsaha}`;

  const riwayatUrut = (riwayat || []).slice().reverse();
  const contents = [
    { role: "user", parts: [{ text: systemPrompt }] },
    { role: "model", parts: [{ text: "Baik, aku paham konteksnya. Siap bantu!" }] },
    ...riwayatUrut.map((m) => ({
      role: m.peran === "assistant" ? "model" : "user",
      parts: [{ text: m.isi }],
    })),
  ];

  let jawabanAI = "Maaf, aku lagi gangguan jawab pertanyaan ini. Coba lagi sebentar ya.";
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents }),
      }
    );
    const data = await res.json();
    const teks = (data?.candidates?.[0]?.content?.parts || []).map((p) => p.text || "").join("");
    if (teks) jawabanAI = teks.trim();
  } catch (e) {
    console.error("Gagal panggil Gemini (Pendamping AI):", e);
  }

  const { error: errAI } = await supabase
    .from("ai_chat_messages")
    .insert({ tenant_id: tenantId, sender_id: null, peran: "assistant", isi: jawabanAI });
  if (errAI) console.error("Gagal simpan balasan AI:", errAI);

  return { ok: true, jawaban: jawabanAI };
}

import { NextResponse } from "next/server";
import { JURNAL_MAP } from "@/lib/kategorisasi-lokal";

const AKUN_VALID = [
  "Pendapatan Penjualan",
  "Beban Bahan Baku",
  "Beban Utilitas",
  "Beban Sewa",
  "Beban Transportasi",
  "Beban Kemasan",
  "Beban Pemasaran",
  "Beban Gaji",
  "Beban Operasional Lainnya",
  "Belum Terkategori",
];

export async function POST(request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Kunci Gemini belum diatur di server" }, { status: 500 });
  }

  const { teks } = await request.json();
  if (!teks || typeof teks !== "string") {
    return NextResponse.json({ error: "Teks transaksi kosong" }, { status: 400 });
  }

  try {
    const prompt = `Ini transaksi UMKM Indonesia ditulis santai: "${teks}". Balas HANYA JSON valid tanpa markdown, format: {"nominal": angka rupiah tanpa titik atau null, "tipe": "masuk" atau "keluar", "akun": pilih salah satu dari [${AKUN_VALID.join(", ")}], "yakin": angka 0-1}`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      }
    );
    const data = await res.json();
    const teksBalasan = (data?.candidates?.[0]?.content?.parts || []).map((p) => p.text || "").join("");
    const hasil = JSON.parse(teksBalasan.replace(/```json|```/g, "").trim());

    const akun = AKUN_VALID.includes(hasil.akun) ? hasil.akun : "Belum Terkategori";

    return NextResponse.json({
      nominal: Number(hasil.nominal) || null,
      tipe: hasil.tipe === "masuk" ? "masuk" : "keluar",
      akun,
      jurnal: JURNAL_MAP[akun] || ["— perlu kamu cek ulang —"],
      confidence: Number(hasil.yakin) || 0.6,
      aiEnhanced: true,
    });
  } catch (e) {
    console.error("Kategorisasi Gemini error:", e);
    return NextResponse.json({ error: "Gagal memproses dengan AI" }, { status: 502 });
  }
}

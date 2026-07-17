import { NextResponse } from "next/server";

const JURNAL_MAP = {
  "Pendapatan Penjualan": ["Kas (D)", "Pendapatan Penjualan (K)"],
  "Beban Bahan Baku": ["Persediaan Bahan Baku (D)", "Kas (K)"],
  "Beban Utilitas": ["Beban Utilitas (D)", "Kas (K)"],
  "Beban Sewa": ["Beban Sewa (D)", "Kas (K)"],
  "Beban Transportasi": ["Beban Transportasi (D)", "Kas (K)"],
  "Beban Kemasan": ["Beban Kemasan (D)", "Kas (K)"],
  "Beban Pemasaran": ["Beban Pemasaran (D)", "Kas (K)"],
  "Beban Gaji": ["Beban Gaji (D)", "Kas (K)"],
  "Beban Operasional Lainnya": ["Beban Operasional Lainnya (D)", "Kas (K)"],
};

export async function POST(request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Kunci Gemini belum diatur di server" }, { status: 500 });
  }

  const { base64, mediaType } = await request.json();
  if (!base64) {
    return NextResponse.json({ error: "Gambar tidak ditemukan" }, { status: 400 });
  }

  const prompt =
    'Ini foto struk/nota belanja UMKM Indonesia. Baca dan ekstrak transaksinya. Balas HANYA JSON valid tanpa markdown, format: {"deskripsi": "ringkasan singkat bahasa santai", "nominal": angka total dalam rupiah tanpa titik, "tipe": "masuk" atau "keluar", "akun": pilih salah satu dari [Pendapatan Penjualan, Beban Bahan Baku, Beban Utilitas, Beban Sewa, Beban Transportasi, Beban Kemasan, Beban Pemasaran, Beban Gaji, Beban Operasional Lainnya], "yakin": angka 0-1}. Jika gambar bukan struk atau tidak terbaca, balas {"error": "alasan singkat"}.';

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { inline_data: { mime_type: mediaType || "image/jpeg", data: base64 } },
                { text: prompt },
              ],
            },
          ],
        }),
      }
    );
    const data = await response.json();
    const teks = (data?.candidates?.[0]?.content?.parts || []).map((p) => p.text || "").join("");
    const hasil = JSON.parse(teks.replace(/```json|```/g, "").trim());

    if (hasil.error) {
      return NextResponse.json({ error: hasil.error }, { status: 422 });
    }

    return NextResponse.json({
      deskripsi: hasil.deskripsi || "Transaksi dari struk",
      nominal: Number(hasil.nominal) || null,
      tipe: hasil.tipe === "masuk" ? "masuk" : "keluar",
      akun: hasil.akun || "Belum Terkategori",
      jurnal: JURNAL_MAP[hasil.akun] || [`${hasil.akun} (D)`, "Kas (K)"],
      confidence: Number(hasil.yakin) || 0.5,
    });
  } catch (e) {
    console.error("OCR Gemini error:", e);
    return NextResponse.json({ error: "Struk tidak terbaca, coba foto ulang" }, { status: 502 });
  }
}

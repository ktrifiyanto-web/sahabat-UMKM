// Kategorisasi instan berbasis kata kunci — gratis, jalan duluan sebelum
// Gemini dipanggil. Hanya kasus ambigu yang lanjut ke AI (lihat api/kategorisasi).

const RULES = [
  { kw: ["jual", "laku", "terjual", "pesanan", "order"], akun: "Pendapatan Penjualan", tipe: "masuk" },
  { kw: ["dp", "uang muka"], akun: "Uang Muka Pelanggan", tipe: "masuk" },
  { kw: ["beli bahan", "tepung", "gula", "kain", "benang", "bahan"], akun: "Beban Bahan Baku", tipe: "keluar" },
  { kw: ["gaji", "upah", "honor"], akun: "Beban Gaji", tipe: "keluar" },
  { kw: ["listrik", "air", "wifi", "internet", "pulsa"], akun: "Beban Utilitas", tipe: "keluar" },
  { kw: ["sewa", "kontrak", "kios"], akun: "Beban Sewa", tipe: "keluar" },
  { kw: ["ongkir", "kirim", "bensin", "transport"], akun: "Beban Transportasi", tipe: "keluar" },
  { kw: ["kemasan", "plastik", "dus", "label", "stiker"], akun: "Beban Kemasan", tipe: "keluar" },
  { kw: ["iklan", "promo", "endorse", "ads"], akun: "Beban Pemasaran", tipe: "keluar" },
  { kw: ["beli"], akun: "Beban Operasional Lainnya", tipe: "keluar" },
  { kw: ["bayar"], akun: "Beban Operasional Lainnya", tipe: "keluar" },
];

export const JURNAL_MAP = {
  "Pendapatan Penjualan": ["Kas (D)", "Pendapatan Penjualan (K)"],
  "Uang Muka Pelanggan": ["Kas (D)", "Uang Muka Pelanggan (K)"],
  "Beban Bahan Baku": ["Persediaan Bahan Baku (D)", "Kas (K)"],
  "Beban Gaji": ["Beban Gaji (D)", "Kas (K)"],
  "Beban Utilitas": ["Beban Utilitas (D)", "Kas (K)"],
  "Beban Sewa": ["Beban Sewa (D)", "Kas (K)"],
  "Beban Transportasi": ["Beban Transportasi (D)", "Kas (K)"],
  "Beban Kemasan": ["Beban Kemasan (D)", "Kas (K)"],
  "Beban Pemasaran": ["Beban Pemasaran (D)", "Kas (K)"],
  "Beban Operasional Lainnya": ["Beban Operasional (D)", "Kas (K)"],
};

export function parseNominal(text) {
  const m = text.replace(/\./g, "").match(/(\d+(?:[.,]\d+)?)\s*(jt|juta|rb|ribu|k)?/i);
  if (!m) return null;
  let n = parseFloat(m[1].replace(",", "."));
  const unit = (m[2] || "").toLowerCase();
  if (unit === "jt" || unit === "juta") n *= 1_000_000;
  else if (unit === "rb" || unit === "ribu" || unit === "k") n *= 1_000;
  return Math.round(n);
}

export function parseSantai(text) {
  const lower = text.toLowerCase();
  const nominal = parseNominal(lower);
  let match = null;
  let confidence = 0;
  for (const r of RULES) {
    const hit = r.kw.find((k) => lower.includes(k));
    if (hit) {
      match = r;
      confidence = hit.length > 4 ? 0.93 : 0.78;
      break;
    }
  }
  if (!match) {
    match = { akun: "Belum Terkategori", tipe: lower.includes("jual") ? "masuk" : "keluar" };
    confidence = 0.4;
  }
  return {
    nominal,
    akun: match.akun,
    tipe: match.tipe,
    jurnal: JURNAL_MAP[match.akun] || ["— perlu kamu cek ulang —"],
    confidence,
  };
}

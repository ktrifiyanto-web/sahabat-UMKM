// Skor kesehatan 0-100 dari data yang benar-benar ada (Fase 1):
// 40% profitabilitas, 30% kedisiplinan mencatat, 30% penyelesaian tugas.
export function hitungSkor({ masuk, keluar, hariAktif30, tugasTotal, tugasSelesai }) {
  const laba = masuk - keluar;
  const skorProfit =
    masuk <= 0 ? 10 : laba <= 0 ? 15 : Math.min(40, 15 + Math.round((laba / masuk) * 50));
  const skorDisiplin = Math.min(30, Math.round((hariAktif30 / 20) * 30));
  const skorTugas =
    tugasTotal === 0 ? 20 : Math.round((tugasSelesai / tugasTotal) * 30);
  return Math.max(5, Math.min(100, skorProfit + skorDisiplin + skorTugas));
}

export function labelSkor(skor) {
  if (skor >= 70) return { label: "Baik", warna: "var(--green)" };
  if (skor >= 45) return { label: "Perlu Perhatian", warna: "var(--amber)" };
  return { label: "Kritis", warna: "var(--pink)" };
}

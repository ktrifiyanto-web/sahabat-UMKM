const TABEL = [
  { t: "transactions", l: "💰 Transaksi", d: "Semua catatan keuangan seluruh tenant" },
  { t: "tenants", l: "🏪 Tenant/Usaha", d: "Data usaha + profil lengkap" },
  { t: "profiles", l: "👥 Pengguna", d: "Semua akun & perannya" },
  { t: "mentor_notes", l: "📝 Arahan Mentor", d: "Semua tugas/evaluasi/arahan" },
  { t: "chat_messages", l: "💬 Chat", d: "Semua percakapan tenant-mentor" },
  { t: "sector_reports", l: "🎯 Target Sektor", d: "Target & aktual per sektor" },
  { t: "projects", l: "🗂️ Project 90 Hari", d: "Semua project tenant" },
  { t: "roadmaps", l: "🛣️ Roadmap", d: "Target jangka panjang tenant" },
  { t: "strategies", l: "🧭 Strategi", d: "Strategi & peluang tenant" },
  { t: "goals", l: "🏁 Goals", d: "Target keuangan lama" },
];

export default function ExportPage() {
  return (
    <div className="mt-4">
      <h1 className="font-display font-bold text-lg mb-1">Export Data</h1>
      <p className="text-[11.5px] text-ink-soft mb-4">
        Unduh semua data platform sebagai CSV — bisa dibuka di Excel/Google Sheets.
      </p>
      <div className="grid sm:grid-cols-2 gap-3">
        {TABEL.map((x) => (
          <a key={x.t} href={`/api/admin/export?tabel=${x.t}`}
            className="glass p-4 flex items-center justify-between hover:-translate-y-0.5 transition-transform">
            <div>
              <div className="font-bold text-xs">{x.l}</div>
              <div className="text-[9.5px] text-ink-soft mt-0.5">{x.d}</div>
            </div>
            <span className="text-[10px] font-extrabold text-cyan whitespace-nowrap">Unduh ⬇</span>
          </a>
        ))}
      </div>
    </div>
  );
}

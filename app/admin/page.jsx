import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { rupiah } from "@/lib/format";

export default async function AdminDashboard() {
  const supabase = await createClient();

  const [{ data: tenants }, { data: profiles }, { data: tx }] = await Promise.all([
    supabase.from("tenants").select("id, nama_usaha, jenis_usaha, mentor_id, owner_id, angkatan"),
    supabase.from("profiles").select("id, nama, role"),
    supabase.from("transactions").select("nominal, tipe"),
  ]);

  const daftarTenant = tenants || [];
  const daftarProfil = profiles || [];
  const mentorMap = {};
  daftarProfil.forEach((p) => (mentorMap[p.id] = p.nama));

  const rows = tx || [];
  const totalMasuk = rows.filter((r) => r.tipe === "masuk").reduce((a, b) => a + (b.nominal || 0), 0);
  const totalKeluar = rows.filter((r) => r.tipe === "keluar").reduce((a, b) => a + (b.nominal || 0), 0);

  const jumlahMentor = daftarProfil.filter((p) => p.role === "mentor").length;
  const belumAdaMentor = daftarTenant.filter((t) => !t.mentor_id).length;

  return (
    <div className="mt-4">
      <h1 className="font-display font-bold text-lg mb-4">Ringkasan Platform</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mb-5">
        <Kpi label="Total Tenant/UMKM" v={daftarTenant.length} />
        <Kpi label="Total Mentor" v={jumlahMentor} />
        <Kpi label="Belum Ada Mentor" v={belumAdaMentor} warna={belumAdaMentor > 0 ? "var(--amber)" : undefined} />
        <Kpi label="Total Laba Platform" v={rupiah(totalMasuk - totalKeluar)} />
      </div>

      <h2 className="font-display font-bold text-sm mb-2">Semua Tenant</h2>
      <div className="glass overflow-hidden">
        <div className="grid grid-cols-[1.5fr_1fr_auto] gap-2 px-4 py-2.5 border-b border-line text-[9.5px] font-extrabold text-ink-dim uppercase">
          <span>Usaha</span><span>Mentor</span><span>Aksi</span>
        </div>
        {daftarTenant.length === 0 && (
          <div className="text-xs text-ink-soft text-center py-6">Belum ada tenant. Buat lewat menu Kelola Akun.</div>
        )}
        {daftarTenant.map((t) => (
          <div key={t.id} className="grid grid-cols-[1.5fr_1fr_auto] gap-2 px-4 py-3 border-b border-dashed border-line last:border-0 items-center">
            <div>
              <div className="font-bold text-xs">{t.nama_usaha}</div>
              <div className="text-[9.5px] text-ink-soft">{t.jenis_usaha || "—"}{t.angkatan ? ` · Angkatan ${t.angkatan}` : ""}</div>
            </div>
            <div className="text-[10.5px]">
              {t.mentor_id
                ? <span className="font-bold text-green">{mentorMap[t.mentor_id] || "✓"}</span>
                : <span className="text-amber font-bold">Belum ada</span>}
            </div>
            <Link href={`/mentor/${t.id}`} className="text-[10px] font-bold text-cyan whitespace-nowrap">
              Buka sebagai Mentor →
            </Link>
          </div>
        ))}
      </div>

      <p className="text-[10px] text-ink-dim mt-3">
        💡 Sebagai super admin kamu bisa membuka dashboard mentor mana pun (tautan di atas), dan
        dashboard tenant bisa dilihat lewat halaman detail yang sama.
      </p>
    </div>
  );
}

function Kpi({ label, v, warna }) {
  return (
    <div className="glass p-3.5">
      <div className="text-[9.5px] text-ink-soft font-bold">{label}</div>
      <div className="font-display font-bold text-lg mt-0.5" style={warna ? { color: warna } : undefined}>{v}</div>
    </div>
  );
}

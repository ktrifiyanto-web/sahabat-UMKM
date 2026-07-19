"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const KOLOM = [
  { key: "nama_usaha", label: "Nama Usaha" },
  { key: "jenis_usaha", label: "Bidang Usaha" },
  { key: "tahun_berdiri", label: "Tahun Berdiri" },
  { key: "jumlah_tim", label: "Jumlah Tim / Karyawan" },
  { key: "kontak", label: "Kontak (No. HP/WA)" },
  { key: "media_sosial", label: "Media Sosial" },
  { key: "marketplace", label: "Marketplace" },
];

const FOTO = [
  { key: "logo_url", label: "Logo Usaha", ikon: "🏷️" },
  { key: "foto_owner_url", label: "Foto Owner", ikon: "🧑" },
  { key: "foto_produk_url", label: "Foto Produk Unggulan", ikon: "📦" },
];

export default function FormProfil({ tenant, namaOwner }) {
  const supabase = createClient();
  const [form, setForm] = useState({
    nama_usaha: tenant.nama_usaha || "",
    jenis_usaha: tenant.jenis_usaha || "",
    angkatan: tenant.angkatan || "",
    nomor_stand: tenant.nomor_stand || "",
    tahun_berdiri: tenant.tahun_berdiri || "",
    alamat: tenant.alamat || "",
    jumlah_tim: tenant.jumlah_tim || "",
    kontak: tenant.kontak || "",
    media_sosial: tenant.media_sosial || "",
    marketplace: tenant.marketplace || "",
    produk_utama: tenant.produk_utama || "",
  });
  const [foto, setFoto] = useState({
    logo_url: tenant.logo_url,
    foto_owner_url: tenant.foto_owner_url,
    foto_produk_url: tenant.foto_produk_url,
  });
  const [status, setStatus] = useState("idle");
  const [uploadKey, setUploadKey] = useState(null);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const upload = (key) => async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadKey(key);
    const path = `${tenant.id}/${key}-${Date.now()}.${file.name.split(".").pop()}`;
    const { error } = await supabase.storage.from("foto-usaha").upload(path, file, { upsert: true });
    if (error) {
      console.error("Upload gagal:", error);
      alert("Upload gagal. Pastikan bucket 'foto-usaha' sudah dibuat di Supabase Storage (public).");
      setUploadKey(null);
      return;
    }
    const { data } = supabase.storage.from("foto-usaha").getPublicUrl(path);
    const url = data.publicUrl;
    setFoto((f) => ({ ...f, [key]: url }));
    await supabase.from("tenants").update({ [key]: url }).eq("id", tenant.id);
    setUploadKey(null);
  };

  const simpan = async () => {
    setStatus("saving");
    const { error } = await supabase.from("tenants").update(form).eq("id", tenant.id);
    if (error) { console.error(error); setStatus("idle"); return; }
    setStatus("ok");
    setTimeout(() => setStatus("idle"), 2000);
  };

  return (
    <>
      <div className="glass p-5 mb-4">
        <div className="font-display font-bold text-[13px] text-pink mb-3">Identitas Peserta</div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] font-bold text-ink-soft block mb-1">Angkatan</label>
            <select value={form.angkatan} onChange={set("angkatan")}
              className="w-full border border-line rounded-xl px-3.5 py-2.5 text-xs outline-none bg-white/70">
              <option value="">Pilih angkatan</option>
              <option value="2024">2024</option>
              <option value="2025">2025</option>
              <option value="2026">2026</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold text-ink-soft block mb-1">Nomor Stand</label>
            <input value={form.nomor_stand} onChange={set("nomor_stand")} placeholder="mis. A-12"
              className="w-full border border-line rounded-xl px-3.5 py-2.5 text-xs outline-none bg-white/70 focus:border-cyan" />
          </div>
        </div>
      </div>

      <div className="glass p-5">
        <div className="font-display font-bold text-[13px] text-cyan mb-3">A. Company Profile</div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] font-bold text-ink-soft block mb-1">Nama Pemilik/Owner</label>
            <input value={namaOwner} disabled
              className="w-full border border-line rounded-xl px-3.5 py-2.5 text-xs outline-none bg-white/40 opacity-70" />
          </div>
          {KOLOM.map((k) => (
            <div key={k.key}>
              <label className="text-[10px] font-bold text-ink-soft block mb-1">{k.label}</label>
              <input value={form[k.key]} onChange={set(k.key)}
                className="w-full border border-line rounded-xl px-3.5 py-2.5 text-xs outline-none bg-white/70 focus:border-cyan" />
            </div>
          ))}
          <div className="sm:col-span-2">
            <label className="text-[10px] font-bold text-ink-soft block mb-1">Alamat / Lokasi Usaha</label>
            <input value={form.alamat} onChange={set("alamat")}
              className="w-full border border-line rounded-xl px-3.5 py-2.5 text-xs outline-none bg-white/70 focus:border-cyan" />
          </div>
          <div className="sm:col-span-2">
            <label className="text-[10px] font-bold text-ink-soft block mb-1">Produk Utama</label>
            <input value={form.produk_utama} onChange={set("produk_utama")}
              className="w-full border border-line rounded-xl px-3.5 py-2.5 text-xs outline-none bg-white/70 focus:border-cyan" />
          </div>
        </div>

        <div className="mt-4 rounded-2xl border-2 border-dashed p-4"
          style={{ borderColor: "rgba(245,158,11,0.35)", background: "rgba(245,158,11,0.06)" }}>
          <div className="text-[11px] font-extrabold text-amber mb-2.5">📎 Lampiran</div>
          <div className="flex flex-wrap gap-3">
            {FOTO.map((f) => (
              <label key={f.key} className="cursor-pointer">
                <input type="file" accept="image/*" className="hidden" onChange={upload(f.key)} />
                <div className="w-[104px] h-[88px] rounded-xl bg-white/60 border-2 border-dashed border-line flex flex-col items-center justify-center gap-1 overflow-hidden">
                  {foto[f.key] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={foto[f.key]} alt={f.label} className="w-full h-full object-cover" />
                  ) : uploadKey === f.key ? (
                    <span className="text-[9px] text-ink-soft">Mengunggah...</span>
                  ) : (
                    <>
                      <span className="text-base">{f.ikon}</span>
                      <span className="text-[8px] font-bold text-ink-soft text-center px-1">{f.label}</span>
                    </>
                  )}
                </div>
              </label>
            ))}
          </div>
        </div>

        <button onClick={simpan} disabled={status === "saving"} className="btn-grad rounded-xl px-5 py-2.5 text-xs mt-4 disabled:opacity-60">
          {status === "saving" ? "Menyimpan..." : status === "ok" ? "✓ Tersimpan" : "Simpan Profil"}
        </button>
      </div>
    </>
  );
}

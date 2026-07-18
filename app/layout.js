import "./globals.css";

export const metadata = {
  title: "SobatUMKM — Pembukuan Santai UMKM",
  description: "Catat transaksi pakai bahasa sehari-hari, laporan tetap rapi basis akuntansi profesional.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

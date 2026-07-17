export function rupiah(n) {
  if (n == null) return "—";
  return "Rp" + Number(n).toLocaleString("id-ID");
}

export function tanggalIndo(d) {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}

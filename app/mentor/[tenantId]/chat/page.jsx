import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ChatBox from "@/components/ChatBox";

export default async function ChatMentorPage({ params }) {
  const { tenantId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  const { data: tenant } = await supabase
    .from("tenants").select("id, nama_usaha, mentor_id").eq("id", tenantId).maybeSingle();
  if (!tenant || (tenant.mentor_id !== user.id && profile?.role !== "super_admin")) redirect("/mentor");

  return (
    <div className="mt-3">
      <Link href={`/mentor/${tenantId}`} className="text-xs text-cyan font-bold">← Kembali ke {tenant.nama_usaha}</Link>
      <h1 className="font-display font-bold text-lg mt-2 mb-4">Chat · {tenant.nama_usaha}</h1>
      <ChatBox
        tenantId={tenantId}
        userId={user.id}
        namaLawan={tenant.nama_usaha}
        inisialLawan={tenant.nama_usaha.charAt(0).toUpperCase()}
      />
    </div>
  );
}

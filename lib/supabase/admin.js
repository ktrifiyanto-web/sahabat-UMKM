import { createClient as createSbClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";

// Client dengan service role — HANYA untuk API route server-side.
// Membutuhkan env SUPABASE_SERVICE_ROLE_KEY di Vercel.
export function createAdminClient() {
  return createSbClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// Verifikasi pemanggil adalah super_admin; return user atau null
export async function verifySuperAdmin() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).maybeSingle();
  return profile?.role === "super_admin" ? user : null;
}

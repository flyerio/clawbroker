import { NextResponse } from "next/server";
import { verifyAdminAccess } from "@/lib/admin-auth";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const { authorized } = await verifyAdminAccess();
  if (!authorized) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: tenants, error } = await supabase
    .from("tenant_registry")
    .select("*, bot_pool(bot_username, fly_machine_id), user_identity_map(email)")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Fetch balances for all tenants
  const userIds = tenants.map((t: { user_id: string }) => t.user_id);
  const { data: balances } = await supabase
    .from("v_user_usd_balance")
    .select("*")
    .in("user_id", userIds);

  const balanceMap = new Map(
    (balances || []).map((b: { user_id: string }) => [b.user_id, b])
  );

  const enriched = tenants.map((t: { user_id: string }) => ({
    ...t,
    balance: balanceMap.get(t.user_id) || null,
  }));

  return NextResponse.json(enriched);
}

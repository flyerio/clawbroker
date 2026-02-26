import { NextResponse } from "next/server";
import { verifyAdminAccess } from "@/lib/admin-auth";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const { authorized } = await verifyAdminAccess();
  if (!authorized) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: agents, error } = await supabase
    .from("openclaw_agents")
    .select("*, user_identity_map:user_id(email)")
    .not("user_id", "is", null)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Fetch balances for all tenants
  const userIds = agents.map((a: { user_id: string }) => a.user_id);
  const { data: balances } = await supabase
    .from("v_user_usd_balance")
    .select("*")
    .in("user_id", userIds);

  const balanceMap = new Map(
    (balances || []).map((b: { user_id: string }) => [b.user_id, b])
  );

  const enriched = agents.map((a: { user_id: string }) => ({
    ...a,
    balance: balanceMap.get(a.user_id) || null,
  }));

  return NextResponse.json(enriched);
}

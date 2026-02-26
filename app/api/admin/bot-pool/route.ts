import { NextResponse } from "next/server";
import { verifyAdminAccess } from "@/lib/admin-auth";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const { authorized } = await verifyAdminAccess();
  if (!authorized) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Show all agents (pool view — unassigned agents are "available")
  const { data, error } = await supabase
    .from("openclaw_agents")
    .select("*, user_identity_map:user_id(email)")
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

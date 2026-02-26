import { NextResponse } from "next/server";
import { verifyAdminAccess } from "@/lib/admin-auth";
import { supabase } from "@/lib/supabase";
import { stopMachine } from "@/lib/fly";

export async function POST(req: Request) {
  const { authorized } = await verifyAdminAccess();
  if (!authorized) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { tenantId } = await req.json();
  if (!tenantId) {
    return NextResponse.json(
      { error: "tenantId is required" },
      { status: 400 }
    );
  }

  // Get agent info
  const { data: agent } = await supabase
    .from("openclaw_agents")
    .select("id, fly_app_name, fly_machine_id")
    .eq("id", tenantId)
    .single();

  if (!agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  // Stop the VM if machine ID is known
  if (agent.fly_app_name && agent.fly_machine_id) {
    await stopMachine(agent.fly_app_name, agent.fly_machine_id);
  }

  const { error } = await supabase
    .from("openclaw_agents")
    .update({ status: "suspended", updated_at: new Date().toISOString() })
    .eq("id", tenantId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

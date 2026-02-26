import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Resolve clerk_user_id → app_user_id
  const { data: identity } = await supabase
    .from("user_identity_map")
    .select("app_user_id")
    .eq("clerk_user_id", userId)
    .single();

  if (!identity) {
    return NextResponse.json(
      { error: "Account not found. Complete the account step first." },
      { status: 400 }
    );
  }

  const appUserId = identity.app_user_id;

  // Check if user already has an agent
  const { data: existingAgent } = await supabase
    .from("openclaw_agents")
    .select("id, status, fly_app_name, bot_username, fly_machine_id")
    .eq("user_id", appUserId)
    .single();

  if (existingAgent) {
    return NextResponse.json({
      botUsername: existingAgent.bot_username,
      flyAppName: existingAgent.fly_app_name,
      flyMachineId: existingAgent.fly_machine_id,
      tenantStatus: existingAgent.status,
    });
  }

  // Assign next available agent
  const { data: agent, error: agentErr } = await supabase
    .from("openclaw_agents")
    .select("*")
    .eq("status", "available")
    .not("bot_token", "is", null)
    .order("created_at", { ascending: true })
    .limit(1)
    .single();

  if (agentErr || !agent) {
    return NextResponse.json(
      { error: "No bots available right now. Please try again later." },
      { status: 503 }
    );
  }

  // Optimistic lock: assign agent
  const { error: updateErr } = await supabase
    .from("openclaw_agents")
    .update({
      user_id: appUserId,
      status: "pending",
      provisioned_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", agent.id)
    .eq("status", "available");

  if (updateErr) {
    console.error("openclaw_agents update error:", updateErr);
    return NextResponse.json(
      { error: "Failed to assign bot. Please try again." },
      { status: 500 }
    );
  }

  // Create balances
  await supabase.from("usd_balance").insert({
    user_id: appUserId,
    total_budget_usd: 50.0,
  });

  await supabase.from("user_credits").insert({
    user_id: appUserId,
    total_credits: 10000,
    available_credits: 10000,
  });

  return NextResponse.json({
    botUsername: agent.bot_username,
    flyAppName: agent.fly_app_name,
    flyMachineId: agent.fly_machine_id,
    tenantStatus: "pending",
  });
}

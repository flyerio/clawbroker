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

  // Check if user already has a tenant
  const { data: existingTenant } = await supabase
    .from("tenant_registry")
    .select("id, status, fly_app_name, bot_id, bot_pool(bot_username, bot_token, fly_app_name, fly_machine_id)")
    .eq("user_id", appUserId)
    .single();

  if (existingTenant) {
    const bot = existingTenant.bot_pool as unknown as {
      bot_username: string;
      fly_app_name: string;
      fly_machine_id: string;
    };
    return NextResponse.json({
      botUsername: bot.bot_username,
      flyAppName: existingTenant.fly_app_name,
      flyMachineId: bot.fly_machine_id,
      tenantStatus: existingTenant.status,
    });
  }

  // Assign next available bot
  const { data: bot, error: botErr } = await supabase
    .from("bot_pool")
    .select("*")
    .eq("status", "available")
    .order("created_at", { ascending: true })
    .limit(1)
    .single();

  if (botErr || !bot) {
    return NextResponse.json(
      { error: "No bots available right now. Please try again later." },
      { status: 503 }
    );
  }

  // Optimistic lock: assign bot
  const { error: botUpdateErr } = await supabase
    .from("bot_pool")
    .update({
      status: "assigned",
      assigned_to: appUserId,
      assigned_at: new Date().toISOString(),
    })
    .eq("id", bot.id)
    .eq("status", "available");

  if (botUpdateErr) {
    console.error("bot_pool update error:", botUpdateErr);
    return NextResponse.json(
      { error: "Failed to assign bot. Please try again." },
      { status: 500 }
    );
  }

  // Create tenant
  const { error: tenantErr } = await supabase.from("tenant_registry").insert({
    user_id: appUserId,
    bot_id: bot.id,
    fly_app_name: bot.fly_app_name,
    status: "pending",
    provisioned_at: new Date().toISOString(),
  });

  if (tenantErr) {
    // Rollback bot assignment
    await supabase
      .from("bot_pool")
      .update({ status: "available", assigned_to: null, assigned_at: null })
      .eq("id", bot.id);
    console.error("tenant_registry insert error:", tenantErr);
    return NextResponse.json(
      { error: "Failed to create tenant" },
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
    botUsername: bot.bot_username,
    flyAppName: bot.fly_app_name,
    flyMachineId: bot.fly_machine_id,
    tenantStatus: "pending",
  });
}

import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { notifyAdmin } from "@/lib/telegram";
import crypto from "crypto";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 401 });
  }

  const { telegramUsername } = await req.json();
  if (!telegramUsername || typeof telegramUsername !== "string") {
    return NextResponse.json(
      { error: "Telegram username is required" },
      { status: 400 }
    );
  }

  const email = user.emailAddresses[0]?.emailAddress;
  if (!email) {
    return NextResponse.json({ error: "No email on account" }, { status: 400 });
  }

  // 1. Create/find user_identity_map row
  const appUserId = crypto.randomUUID();
  const { data: existingUser } = await supabase
    .from("user_identity_map")
    .select("app_user_id")
    .eq("clerk_user_id", userId)
    .single();

  let finalUserId = existingUser?.app_user_id || appUserId;

  if (!existingUser) {
    const { error: insertErr } = await supabase
      .from("user_identity_map")
      .insert({
        app_user_id: finalUserId,
        clerk_user_id: userId,
        email,
        user_type: "standard",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    if (insertErr) {
      if (insertErr.code === "23505") {
        // Row exists with different app_user_id — re-fetch the real one
        const { data: refetched } = await supabase
          .from("user_identity_map")
          .select("app_user_id")
          .eq("clerk_user_id", userId)
          .single();
        if (refetched) {
          finalUserId = refetched.app_user_id;
        } else {
          console.error("user_identity_map 23505 but re-fetch failed");
          return NextResponse.json(
            { error: "Failed to create user record" },
            { status: 500 }
          );
        }
      } else {
        console.error("user_identity_map insert error:", insertErr);
        return NextResponse.json(
          { error: "Failed to create user record" },
          { status: 500 }
        );
      }
    }
  }

  // Check if user already has a tenant
  const { data: existingTenant } = await supabase
    .from("tenant_registry")
    .select("id, status, fly_app_name")
    .eq("user_id", finalUserId)
    .single();

  if (existingTenant) {
    return NextResponse.json(
      { error: "You already have an agent. Check your dashboard." },
      { status: 409 }
    );
  }

  // 2. Assign next available bot
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

  // 3. Transaction: assign bot + create tenant + create balances
  const { error: botUpdateErr } = await supabase
    .from("bot_pool")
    .update({
      status: "assigned",
      assigned_to: finalUserId,
      assigned_at: new Date().toISOString(),
    })
    .eq("id", bot.id)
    .eq("status", "available"); // optimistic lock

  if (botUpdateErr) {
    console.error("bot_pool update error:", botUpdateErr);
    return NextResponse.json(
      { error: "Failed to assign bot. Please try again." },
      { status: 500 }
    );
  }

  const { error: tenantErr } = await supabase.from("tenant_registry").insert({
    user_id: finalUserId,
    bot_id: bot.id,
    fly_app_name: bot.fly_app_name,
    telegram_username: telegramUsername.replace(/^@/, ""),
    status: "pending",
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

  // Create USD balance
  await supabase.from("usd_balance").insert({
    user_id: finalUserId,
    total_budget_usd: 10.0,
  });

  // Create CoBroker credits
  await supabase.from("user_credits").insert({
    user_id: finalUserId,
    total_credits: 2000,
    available_credits: 2000,
  });

  // 4. Notify admin
  await notifyAdmin(
    `🆕 New signup!\nEmail: ${email}\nTelegram: @${telegramUsername}\nAssigned bot: @${bot.bot_username}\nFly app: ${bot.fly_app_name}\n\nRun:\n\`deploy-tenant.sh configure-user --app ${bot.fly_app_name} --telegram-user-id <GET_FROM_USER>\``
  );

  return NextResponse.json({
    botUsername: bot.bot_username,
    flyAppName: bot.fly_app_name,
    status: "pending",
  });
}

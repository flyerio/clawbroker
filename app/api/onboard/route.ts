import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { notifyAdmin, setWebhook } from "@/lib/telegram";
import crypto from "crypto";

export async function POST() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 401 });
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
    // Check if email already exists (e.g. from CoBroker parent app)
    const { data: byEmail } = await supabase
      .from("user_identity_map")
      .select("app_user_id")
      .eq("email", email)
      .single();

    if (byEmail) {
      // Email exists with a different clerk_user_id — reuse the app_user_id
      finalUserId = byEmail.app_user_id;
      await supabase
        .from("user_identity_map")
        .update({ clerk_user_id: userId, updated_at: new Date().toISOString() })
        .eq("app_user_id", byEmail.app_user_id);
    } else {
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
    .select("id, status, fly_app_name, bot_id, bot_pool(bot_username, bot_token)")
    .eq("user_id", finalUserId)
    .single();

  // If tenant exists and is already pairing, regenerate token and re-set webhook
  if (existingTenant && existingTenant.status === "pairing") {
    const pairingToken = crypto.randomUUID();
    const pairingExpiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    await supabase
      .from("tenant_registry")
      .update({ pairing_token: pairingToken, pairing_expires_at: pairingExpiresAt })
      .eq("id", existingTenant.id);

    const bot = existingTenant.bot_pool as unknown as { bot_username: string; bot_token: string };
    const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://clawbroker.ai";

    if (bot.bot_token && webhookSecret) {
      await setWebhook(bot.bot_token, `${appUrl}/api/webhooks/telegram`, webhookSecret);
    }

    return NextResponse.json({
      botUsername: bot.bot_username,
      pairingToken,
      status: "pairing",
    });
  }

  // If tenant exists with any other status, don't allow re-onboard
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

  const pairingToken = crypto.randomUUID();
  const pairingExpiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

  const { error: tenantErr } = await supabase.from("tenant_registry").insert({
    user_id: finalUserId,
    bot_id: bot.id,
    fly_app_name: bot.fly_app_name,
    status: "pairing",
    pairing_token: pairingToken,
    pairing_expires_at: pairingExpiresAt,
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

  // 4. Set webhook on the assigned bot
  const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://clawbroker.ai";

  if (bot.bot_token && webhookSecret) {
    const webhookSet = await setWebhook(
      bot.bot_token,
      `${appUrl}/api/webhooks/telegram`,
      webhookSecret
    );
    if (!webhookSet) {
      console.error("Failed to set webhook for bot:", bot.bot_username);
    }
  }

  // 5. Notify admin
  await notifyAdmin(
    `🔗 New signup (pairing)\nEmail: ${email}\nBot: @${bot.bot_username}\nFly app: ${bot.fly_app_name}`
  );

  return NextResponse.json({
    botUsername: bot.bot_username,
    pairingToken,
    status: "pairing",
  });
}

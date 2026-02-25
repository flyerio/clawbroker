import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { stopMachine } from "@/lib/fly";
import { createPaymentLink } from "@/lib/stripe";
import { sendSuspensionEmail } from "@/lib/email";
import { sendTelegramMessage, notifyAdmin } from "@/lib/telegram";

export async function GET(req: Request) {
  // Verify Vercel Cron secret
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // --- LOW BALANCE WARNING ($5 threshold) ---
  let warnedCount = 0;
  const { data: lowBalance } = await supabase
    .from("v_user_usd_balance")
    .select("*")
    .gt("remaining_usd", 0)
    .lte("remaining_usd", 5);

  if (lowBalance && lowBalance.length > 0) {
    const lowUserIds = lowBalance.map((d) => d.user_id);
    const { data: warnTenants } = await supabase
      .from("tenant_registry")
      .select("*, bot_pool(bot_token, bot_username), user_identity_map(email)")
      .in("user_id", lowUserIds)
      .eq("status", "active")
      .is("low_balance_warned_at", null);

    for (const tenant of warnTenants ?? []) {
      const bal = lowBalance.find((d) => d.user_id === tenant.user_id);
      const email = tenant.user_identity_map?.email;
      const botToken = tenant.bot_pool?.bot_token;

      let paymentUrl = "https://clawbroker.ai/dashboard";
      if (email) {
        try {
          paymentUrl = await createPaymentLink(tenant.user_id, email);
        } catch {}
      }

      if (botToken && tenant.telegram_user_id) {
        await sendTelegramMessage(
          botToken,
          tenant.telegram_user_id,
          `⚠️ Low balance alert — you have $${Number(bal?.remaining_usd ?? 0).toFixed(2)} remaining.\n\nAdd more credits to keep your agent running: ${paymentUrl}`
        );
      }

      await supabase
        .from("tenant_registry")
        .update({ low_balance_warned_at: new Date().toISOString() })
        .eq("id", tenant.id);

      warnedCount++;
    }
  }

  // --- SUSPENSION: Depleted balances ---
  const { data: depleted, error } = await supabase
    .from("v_user_usd_balance")
    .select("*")
    .lte("remaining_usd", 0);

  if (error || !depleted || depleted.length === 0) {
    return NextResponse.json({ suspended: 0, warned: warnedCount });
  }

  // Get active tenants for these users
  const userIds = depleted.map((d) => d.user_id);
  const { data: activeTenants } = await supabase
    .from("tenant_registry")
    .select("*, bot_pool(bot_token, bot_username, fly_machine_id), user_identity_map(email)")
    .in("user_id", userIds)
    .eq("status", "active");

  if (!activeTenants || activeTenants.length === 0) {
    return NextResponse.json({ suspended: 0, warned: warnedCount });
  }

  let suspendedCount = 0;

  for (const tenant of activeTenants) {
    const email = tenant.user_identity_map?.email;
    const botToken = tenant.bot_pool?.bot_token;
    const botUsername = tenant.bot_pool?.bot_username || "unknown";
    const machineId = tenant.bot_pool?.fly_machine_id;
    const balance = depleted.find((d) => d.user_id === tenant.user_id);

    // Create Stripe payment link
    let paymentUrl = "https://clawbroker.ai/dashboard";
    if (email) {
      try {
        paymentUrl = await createPaymentLink(tenant.user_id, email);
      } catch (err) {
        console.error("Stripe link creation failed:", err);
      }
    }

    // NOTIFICATION 1: Telegram DM to user (before stopping VM)
    let messageSent = false;
    if (botToken && tenant.telegram_user_id) {
      messageSent = await sendTelegramMessage(
        botToken,
        tenant.telegram_user_id,
        `Your ClawBroker agent has been paused because your credits have been fully used.\n\nAdd more credits here: ${paymentUrl}\n\nOnce payment is received, I'll be back online automatically!`
      );
    }

    // Stop the Fly.io machine (regardless of message result — log it)
    if (tenant.fly_app_name && machineId) {
      if (!messageSent) {
        console.warn(`[check-balances] TG message failed for ${tenant.telegram_user_id}, stopping VM anyway`);
      }
      await stopMachine(tenant.fly_app_name, machineId);
    }

    // Update tenant status
    await supabase
      .from("tenant_registry")
      .update({ status: "suspended" })
      .eq("id", tenant.id);

    // Also update openclaw_agents for admin dashboard visibility
    if (tenant.fly_app_name) {
      await supabase
        .from("openclaw_agents")
        .update({ status: "suspended", updated_at: new Date().toISOString() })
        .eq("fly_app_name", tenant.fly_app_name);
    }

    // NOTIFICATION 2: Email to user
    if (email) {
      await sendSuspensionEmail({
        to: email,
        firstName: email.split("@")[0],
        botUsername,
        totalBudget: (balance?.total_budget_usd ?? 10).toFixed(2),
        stripePaymentLink: paymentUrl,
      });
    }

    // NOTIFICATION 3: Telegram to admin
    await notifyAdmin(
      `⚠️ Credit exhaustion: ${email} (TG ID: ${tenant.telegram_user_id || "unknown"}) ran out of credits on @${botUsername}. VM suspended.${messageSent ? "" : " (TG notification failed)"} Stripe link sent.`
    );

    suspendedCount++;
  }

  return NextResponse.json({ suspended: suspendedCount, warned: warnedCount });
}

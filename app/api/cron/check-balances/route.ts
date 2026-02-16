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

  // Find active tenants with depleted balances
  const { data: depleted, error } = await supabase
    .from("v_user_usd_balance")
    .select("*")
    .lte("remaining_usd", 0);

  if (error || !depleted || depleted.length === 0) {
    return NextResponse.json({ suspended: 0 });
  }

  // Get active tenants for these users
  const userIds = depleted.map((d) => d.user_id);
  const { data: activeTenants } = await supabase
    .from("tenant_registry")
    .select("*, bot_pool(bot_token, bot_username, fly_machine_id), user_identity_map(email)")
    .in("user_id", userIds)
    .eq("status", "active");

  if (!activeTenants || activeTenants.length === 0) {
    return NextResponse.json({ suspended: 0 });
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
    if (botToken && tenant.telegram_user_id) {
      await sendTelegramMessage(
        botToken,
        tenant.telegram_user_id,
        `Your ClawBroker agent has been paused because your credits have been fully used.\n\nAdd more credits here: ${paymentUrl}\n\nOnce payment is received, I'll be back online automatically!`
      );
    }

    // Stop the Fly.io machine
    if (tenant.fly_app_name && machineId) {
      await stopMachine(tenant.fly_app_name, machineId);
    }

    // Update tenant status
    await supabase
      .from("tenant_registry")
      .update({ status: "suspended" })
      .eq("id", tenant.id);

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
      `⚠️ Credit exhaustion: ${email} (TG ID: ${tenant.telegram_user_id || "unknown"}) ran out of credits on @${botUsername}. VM suspended. Stripe link sent.`
    );

    suspendedCount++;
  }

  return NextResponse.json({ suspended: suspendedCount });
}

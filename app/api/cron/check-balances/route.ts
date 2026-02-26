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
    const { data: warnAgents } = await supabase
      .from("openclaw_agents")
      .select("*, user_identity_map:user_id(email)")
      .in("user_id", lowUserIds)
      .eq("status", "active")
      .is("low_balance_warned_at", null);

    for (const agent of warnAgents ?? []) {
      const bal = lowBalance.find((d) => d.user_id === agent.user_id);
      const email = (agent.user_identity_map as unknown as { email: string })?.email;

      let paymentUrl = "https://clawbroker.ai/dashboard";
      if (email) {
        try {
          paymentUrl = await createPaymentLink(agent.user_id, email);
        } catch {}
      }

      if (agent.bot_token && agent.telegram_user_id) {
        await sendTelegramMessage(
          agent.bot_token,
          String(agent.telegram_user_id),
          `Low balance alert — you have $${Number(bal?.remaining_usd ?? 0).toFixed(2)} remaining.\n\nAdd more credits to keep your agent running: ${paymentUrl}`
        );
      }

      await supabase
        .from("openclaw_agents")
        .update({ low_balance_warned_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq("id", agent.id);

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

  // Get active agents for these users
  const userIds = depleted.map((d) => d.user_id);
  const { data: activeAgents } = await supabase
    .from("openclaw_agents")
    .select("*, user_identity_map:user_id(email)")
    .in("user_id", userIds)
    .eq("status", "active");

  if (!activeAgents || activeAgents.length === 0) {
    return NextResponse.json({ suspended: 0, warned: warnedCount });
  }

  let suspendedCount = 0;

  for (const agent of activeAgents) {
    const email = (agent.user_identity_map as unknown as { email: string })?.email;
    const botUsername = agent.bot_username || "unknown";
    const machineId = agent.fly_machine_id;
    const balance = depleted.find((d) => d.user_id === agent.user_id);

    // Create Stripe payment link
    let paymentUrl = "https://clawbroker.ai/dashboard";
    if (email) {
      try {
        paymentUrl = await createPaymentLink(agent.user_id, email);
      } catch (err) {
        console.error("Stripe link creation failed:", err);
      }
    }

    // NOTIFICATION 1: Telegram DM to user (before stopping VM)
    let messageSent = false;
    if (agent.bot_token && agent.telegram_user_id) {
      messageSent = await sendTelegramMessage(
        agent.bot_token,
        String(agent.telegram_user_id),
        `Your ClawBroker agent has been paused because your credits have been fully used.\n\nAdd more credits here: ${paymentUrl}\n\nOnce payment is received, I'll be back online automatically!`
      );
    }

    // Stop the Fly.io machine (regardless of message result — log it)
    if (agent.fly_app_name && machineId) {
      if (!messageSent) {
        console.warn(`[check-balances] TG message failed for ${agent.telegram_user_id}, stopping VM anyway`);
      }
      await stopMachine(agent.fly_app_name, machineId);
    }

    // Update agent status
    await supabase
      .from("openclaw_agents")
      .update({ status: "suspended", updated_at: new Date().toISOString() })
      .eq("id", agent.id);

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
      `Credit exhaustion: ${email} (TG ID: ${agent.telegram_user_id || "unknown"}) ran out of credits on @${botUsername}. VM suspended.${messageSent ? "" : " (TG notification failed)"} Stripe link sent.`
    );

    suspendedCount++;
  }

  return NextResponse.json({ suspended: suspendedCount, warned: warnedCount });
}

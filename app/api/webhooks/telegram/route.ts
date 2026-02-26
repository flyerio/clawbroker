import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { sendTelegramMessage, deleteWebhook, notifyAdmin } from "@/lib/telegram";
import { startMachine, configureTenant } from "@/lib/fly";
import { sendActivationEmail } from "@/lib/email";

export async function POST(req: Request) {
  // 1. Verify secret token header
  const secretToken = req.headers.get("x-telegram-bot-api-secret-token");
  if (!secretToken || secretToken !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Parse Telegram update
  let update;
  try {
    update = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const message = update?.message;
  if (!message?.text || !message?.from?.id) {
    // Not a text message — ignore silently (Telegram expects 200)
    return NextResponse.json({ ok: true });
  }

  // 3. Extract /start {token} payload
  const match = message.text.match(/^\/start\s+(.+)$/);
  if (!match) {
    // Not a /start command with payload — ignore
    return NextResponse.json({ ok: true });
  }

  const pairingToken = match[1].trim();
  const telegramUserId = Number(message.from.id);

  // 4. Look up agent by pairing token (optimistic lock on status = "pairing")
  const { data: agent, error: lookupErr } = await supabase
    .from("openclaw_agents")
    .select("*, user_identity_map:user_id(email)")
    .eq("pairing_token", pairingToken)
    .eq("status", "pairing")
    .single();

  if (lookupErr || !agent) {
    // Token not found or already used
    return NextResponse.json({ ok: true });
  }

  // 5. Check expiry (15 min TTL)
  if (agent.pairing_expires_at && new Date(agent.pairing_expires_at) < new Date()) {
    if (agent.bot_token) {
      await sendTelegramMessage(
        agent.bot_token,
        String(telegramUserId),
        "This pairing link has expired. Please go back to clawbroker.ai and click \"Try Again\"."
      );
    }
    return NextResponse.json({ ok: true });
  }

  const email = (agent.user_identity_map as unknown as { email: string })?.email;

  // 6. Update agent: set telegram_user_id, clear pairing token, set status to activating
  const { error: updateErr } = await supabase
    .from("openclaw_agents")
    .update({
      telegram_user_id: telegramUserId,
      pairing_token: null,
      pairing_expires_at: null,
      status: "activating",
      updated_at: new Date().toISOString(),
    })
    .eq("id", agent.id)
    .eq("status", "pairing"); // optimistic lock prevents double-processing

  if (updateErr) {
    console.error("agent update error:", updateErr);
    return NextResponse.json({ ok: true });
  }

  // 7. Send confirmation message to user
  if (agent.bot_token) {
    await sendTelegramMessage(
      agent.bot_token,
      String(telegramUserId),
      "Got it! Setting up your agent now... This usually takes under a minute."
    );
  }

  // 8. Delete webhook (gateway will set its own on start)
  if (agent.bot_token) {
    await deleteWebhook(agent.bot_token);
  }

  // 9. Start VM and configure tenant
  let activated = false;
  if (agent.fly_app_name && agent.fly_machine_id) {
    try {
      await startMachine(agent.fly_app_name, agent.fly_machine_id);
      await configureTenant(agent.fly_app_name, agent.fly_machine_id);
      await supabase
        .from("openclaw_agents")
        .update({
          status: "active",
          provisioned_at: new Date().toISOString(),
          linked_at: new Date().toISOString(),
          activated_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", agent.id);
      activated = true;
    } catch (err) {
      console.error("Auto-activation failed:", err);
      // Fall back to pending for manual activation
      await supabase
        .from("openclaw_agents")
        .update({
          status: "stopped",
          linked_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", agent.id);
    }
  }

  // 10. Send activation email
  if (activated && email) {
    try {
      await sendActivationEmail({
        to: email,
        firstName: email.split("@")[0],
        botUsername: agent.bot_username,
      });
    } catch (err) {
      console.error("Activation email failed (non-blocking):", err);
    }
  }

  // 11. Notify admin
  await notifyAdmin(
    activated
      ? `Auto-activated via Telegram pairing!\nEmail: ${email}\nTelegram user ID: ${telegramUserId}\nBot: @${agent.bot_username}\nFly app: ${agent.fly_app_name}`
      : `Telegram paired but activation failed — activate manually\nEmail: ${email}\nTelegram user ID: ${telegramUserId}\nBot: @${agent.bot_username}\nFly app: ${agent.fly_app_name}`
  );

  return NextResponse.json({ ok: true });
}

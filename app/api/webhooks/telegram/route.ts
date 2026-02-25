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
  const telegramUserId = String(message.from.id);

  // 4. Look up tenant by pairing token (optimistic lock on status = "pairing")
  const { data: tenant, error: lookupErr } = await supabase
    .from("tenant_registry")
    .select("*, bot_pool(bot_token, bot_username, fly_machine_id), user_identity_map(email)")
    .eq("pairing_token", pairingToken)
    .eq("status", "pairing")
    .single();

  if (lookupErr || !tenant) {
    // Token not found or already used — send user a message
    const botToken = await getBotTokenFromUpdate(update);
    if (botToken) {
      await sendTelegramMessage(
        botToken,
        telegramUserId,
        "This link has expired or was already used. Please go back to clawbroker.ai and try again."
      );
    }
    return NextResponse.json({ ok: true });
  }

  // 5. Check expiry (15 min TTL)
  if (tenant.pairing_expires_at && new Date(tenant.pairing_expires_at) < new Date()) {
    const bot = tenant.bot_pool as unknown as { bot_token: string; bot_username: string };
    if (bot?.bot_token) {
      await sendTelegramMessage(
        bot.bot_token,
        telegramUserId,
        "This pairing link has expired. Please go back to clawbroker.ai and click \"Try Again\"."
      );
    }
    return NextResponse.json({ ok: true });
  }

  const bot = tenant.bot_pool as unknown as { bot_token: string; bot_username: string; fly_machine_id: string };
  const userIdentity = tenant.user_identity_map as unknown as { email: string };
  const email = userIdentity?.email;

  // 6. Update tenant: set telegram_user_id, clear pairing token, set status to activating
  const { error: updateErr } = await supabase
    .from("tenant_registry")
    .update({
      telegram_user_id: telegramUserId,
      pairing_token: null,
      pairing_expires_at: null,
      status: "activating",
    })
    .eq("id", tenant.id)
    .eq("status", "pairing"); // optimistic lock prevents double-processing

  if (updateErr) {
    console.error("tenant update error:", updateErr);
    return NextResponse.json({ ok: true });
  }

  // 7. Send confirmation message to user
  if (bot?.bot_token) {
    await sendTelegramMessage(
      bot.bot_token,
      telegramUserId,
      "Got it! Setting up your agent now... This usually takes under a minute."
    );
  }

  // 8. Delete webhook (gateway will set its own on start)
  if (bot?.bot_token) {
    await deleteWebhook(bot.bot_token);
  }

  // 9. Start VM and configure tenant
  let activated = false;
  if (tenant.fly_app_name && bot?.fly_machine_id) {
    try {
      await startMachine(tenant.fly_app_name, bot.fly_machine_id);
      await configureTenant(tenant.fly_app_name, bot.fly_machine_id);
      await supabase
        .from("tenant_registry")
        .update({ status: "active", provisioned_at: new Date().toISOString() })
        .eq("id", tenant.id);
      // Sync to openclaw_agents for admin dashboard
      await supabase
        .from("openclaw_agents")
        .update({
          user_id: tenant.user_id,
          telegram_user_id: telegramUserId,
          status: "active",
          linked_at: new Date().toISOString(),
          activated_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("fly_app_name", tenant.fly_app_name);
      activated = true;
    } catch (err) {
      console.error("Auto-activation failed:", err);
      // Fall back to pending for manual activation
      await supabase
        .from("tenant_registry")
        .update({ status: "pending" })
        .eq("id", tenant.id);
      // Still sync user linkage even if VM activation fails
      await supabase
        .from("openclaw_agents")
        .update({
          user_id: tenant.user_id,
          telegram_user_id: telegramUserId,
          status: "stopped",
          linked_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("fly_app_name", tenant.fly_app_name);
    }
  }

  // 10. Send activation email
  if (activated && email) {
    try {
      await sendActivationEmail({
        to: email,
        firstName: email.split("@")[0],
        botUsername: bot.bot_username,
      });
    } catch (err) {
      console.error("Activation email failed (non-blocking):", err);
    }
  }

  // 11. Notify admin
  await notifyAdmin(
    activated
      ? `✅ Auto-activated via Telegram pairing!\nEmail: ${email}\nTelegram user ID: ${telegramUserId}\nBot: @${bot.bot_username}\nFly app: ${tenant.fly_app_name}`
      : `⚠️ Telegram paired but activation failed — activate manually\nEmail: ${email}\nTelegram user ID: ${telegramUserId}\nBot: @${bot.bot_username}\nFly app: ${tenant.fly_app_name}`
  );

  return NextResponse.json({ ok: true });
}

/**
 * Extract bot token from the webhook URL context.
 * Fallback: look up from bot_pool by matching the update's bot info.
 */
async function getBotTokenFromUpdate(
  update: { message?: { chat?: { id: number } } }
): Promise<string | null> {
  // We can't determine the bot token from the update alone without DB lookup.
  // For expired/invalid tokens, we just skip sending a message.
  void update;
  return null;
}

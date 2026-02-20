import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { configureTenant, updateTenantConfig } from "@/lib/fly";
import { notifyAdmin } from "@/lib/telegram";

export const maxDuration = 60;

export async function POST() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await currentUser();
  const email = user?.emailAddresses[0]?.emailAddress ?? "unknown";

  // Resolve user → tenant → machine
  const { data: identity } = await supabase
    .from("user_identity_map")
    .select("app_user_id")
    .eq("clerk_user_id", userId)
    .single();

  if (!identity) {
    return NextResponse.json(
      { error: "Account not found." },
      { status: 400 }
    );
  }

  const { data: tenant } = await supabase
    .from("tenant_registry")
    .select("id, status, fly_app_name, bot_pool(bot_username, fly_machine_id)")
    .eq("user_id", identity.app_user_id)
    .single();

  if (!tenant) {
    return NextResponse.json(
      { error: "No tenant found. Complete the assign step first." },
      { status: 400 }
    );
  }

  const bot = tenant.bot_pool as unknown as {
    bot_username: string;
    fly_machine_id: string;
  };
  const appName = tenant.fly_app_name;
  const machineId = bot.fly_machine_id;

  if (!appName || !machineId) {
    return NextResponse.json(
      { error: "Tenant is missing Fly app or machine configuration." },
      { status: 500 }
    );
  }

  try {
    // Open DM policy — tenant bot is single-user, link is private
    await updateTenantConfig(appName, machineId, {
      channels: { telegram: { dmPolicy: "open" } },
    });

    await configureTenant(appName, machineId);
  } catch (err) {
    console.error("configureTenant failed:", err);
    return NextResponse.json(
      { error: `Failed to configure agent: ${err instanceof Error ? err.message : "Unknown error"}` },
      { status: 500 }
    );
  }

  // Mark tenant as active
  await supabase
    .from("tenant_registry")
    .update({
      status: "active",
      provisioned_at: new Date().toISOString(),
    })
    .eq("id", tenant.id);

  // Notify admin (fire-and-forget)
  notifyAdmin(
    `🚀 New signup (active)\nEmail: ${email}\nBot: @${bot.bot_username}\nFly app: ${appName}`
  ).catch(() => {});

  return NextResponse.json({
    botUsername: bot.bot_username,
    status: "active",
  });
}

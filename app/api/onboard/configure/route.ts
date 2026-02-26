import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { configureTenant, updateTenantConfig, setAppSecret } from "@/lib/fly";
import { notifyAdmin } from "@/lib/telegram";

export const maxDuration = 60;

export async function POST() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await currentUser();
  const email = user?.emailAddresses[0]?.emailAddress ?? "unknown";

  // Resolve user → agent
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

  const { data: agent } = await supabase
    .from("openclaw_agents")
    .select("id, status, fly_app_name, bot_username, fly_machine_id")
    .eq("user_id", identity.app_user_id)
    .single();

  if (!agent) {
    return NextResponse.json(
      { error: "No tenant found. Complete the assign step first." },
      { status: 400 }
    );
  }

  const appName = agent.fly_app_name;
  const machineId = agent.fly_machine_id;

  if (!appName || !machineId) {
    return NextResponse.json(
      { error: "Tenant is missing Fly app or machine configuration." },
      { status: 500 }
    );
  }

  try {
    // Open DM policy — tenant bot is single-user, link is private
    await updateTenantConfig(appName, machineId, {
      channels: { telegram: { dmPolicy: "open", allowFrom: ["*"] } },
    });

    await configureTenant(appName, machineId);

    // Set per-user CoBroker agent ID so skills can access user's data
    await setAppSecret(appName, "COBROKER_AGENT_USER_ID", identity.app_user_id);
  } catch (err) {
    console.error("configureTenant failed:", err);
    return NextResponse.json(
      { error: `Failed to configure agent: ${err instanceof Error ? err.message : "Unknown error"}` },
      { status: 500 }
    );
  }

  // Mark agent as active
  const { error: updateErr } = await supabase
    .from("openclaw_agents")
    .update({
      status: "active",
      provisioned_at: new Date().toISOString(),
      activated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", agent.id);

  if (updateErr) {
    console.error("Failed to mark agent active:", updateErr);
  }

  // Notify admin (fire-and-forget)
  notifyAdmin(
    `New signup (active)\nEmail: ${email}\nBot: @${agent.bot_username}\nFly app: ${appName}`
  ).catch(() => {});

  return NextResponse.json({
    botUsername: agent.bot_username,
    status: "active",
  });
}

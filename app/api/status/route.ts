import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: identity } = await supabase
    .from("user_identity_map")
    .select("app_user_id")
    .eq("clerk_user_id", userId)
    .single();

  if (!identity) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const { data: agent } = await supabase
    .from("openclaw_agents")
    .select("*")
    .eq("user_id", identity.app_user_id)
    .single();

  if (!agent) {
    return NextResponse.json({ status: "no_tenant" });
  }

  const response: Record<string, unknown> = {
    status: agent.status,
    botUsername: agent.bot_username,
    flyAppName: agent.fly_app_name,
    telegramUserId: agent.telegram_user_id,
    createdAt: agent.created_at,
    provisionedAt: agent.provisioned_at,
  };

  // Include pairing token so frontend can rebuild the deep link on page refresh
  if (agent.status === "pairing" && agent.pairing_token) {
    response.pairingToken = agent.pairing_token;
  }

  return NextResponse.json(response);
}

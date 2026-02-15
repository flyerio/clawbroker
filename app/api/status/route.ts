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

  const { data: tenant } = await supabase
    .from("tenant_registry")
    .select("*, bot_pool(*)")
    .eq("user_id", identity.app_user_id)
    .single();

  if (!tenant) {
    return NextResponse.json({ status: "no_tenant" });
  }

  return NextResponse.json({
    status: tenant.status,
    botUsername: tenant.bot_pool?.bot_username,
    flyAppName: tenant.fly_app_name,
    telegramUsername: tenant.telegram_username,
    createdAt: tenant.created_at,
    provisionedAt: tenant.provisioned_at,
  });
}

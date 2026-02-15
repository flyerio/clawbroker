import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Resolve Clerk user → app_user_id
  const { data: identity } = await supabase
    .from("user_identity_map")
    .select("app_user_id")
    .eq("clerk_user_id", userId)
    .single();

  if (!identity) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const { data: balance } = await supabase
    .from("v_user_usd_balance")
    .select("*")
    .eq("user_id", identity.app_user_id)
    .single();

  if (!balance) {
    return NextResponse.json({
      total_budget_usd: 0,
      llm_spent_usd: 0,
      app_spent_usd: 0,
      remaining_usd: 0,
    });
  }

  return NextResponse.json(balance);
}

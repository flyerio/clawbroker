import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  const expected = process.env.OPENCLAW_LOG_SECRET;
  if (!expected || auth !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const tenantId = url.searchParams.get("tenantId");
  if (!tenantId) {
    return NextResponse.json({ error: "Missing tenantId" }, { status: 400 });
  }

  // Look up user_id from tenant_registry by fly_app_name
  const { data: tenant, error: tenantErr } = await supabase
    .from("tenant_registry")
    .select("user_id")
    .eq("fly_app_name", tenantId)
    .single();

  if (tenantErr || !tenant) {
    return NextResponse.json({ allowed: true, remaining_usd: null });
  }

  // Query remaining balance
  const { data: balance } = await supabase
    .from("v_user_usd_balance")
    .select("remaining_usd")
    .eq("user_id", tenant.user_id)
    .single();

  const remaining = balance?.remaining_usd ?? null;
  return NextResponse.json({
    allowed: remaining === null || remaining > 0,
    remaining_usd: remaining,
  });
}

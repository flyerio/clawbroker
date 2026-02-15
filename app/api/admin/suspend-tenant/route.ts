import { NextResponse } from "next/server";
import { verifyAdminAccess } from "@/lib/admin-auth";
import { supabase } from "@/lib/supabase";
import { stopMachine } from "@/lib/fly";

export async function POST(req: Request) {
  const { authorized } = await verifyAdminAccess();
  if (!authorized) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { tenantId } = await req.json();
  if (!tenantId) {
    return NextResponse.json(
      { error: "tenantId is required" },
      { status: 400 }
    );
  }

  // Get tenant + bot info
  const { data: tenant } = await supabase
    .from("tenant_registry")
    .select("*, bot_pool(*)")
    .eq("id", tenantId)
    .single();

  if (!tenant) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }

  // Stop the VM if machine ID is known
  if (tenant.fly_app_name && tenant.bot_pool?.fly_machine_id) {
    await stopMachine(tenant.fly_app_name, tenant.bot_pool.fly_machine_id);
  }

  const { error } = await supabase
    .from("tenant_registry")
    .update({ status: "suspended" })
    .eq("id", tenantId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

import { NextResponse } from "next/server";
import { verifyAdminAccess } from "@/lib/admin-auth";
import { supabase } from "@/lib/supabase";
import { sendActivationEmail } from "@/lib/email";
import { startMachine, configureTenant } from "@/lib/fly";

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

  // Fetch tenant with bot + user details
  const { data: tenant, error: fetchErr } = await supabase
    .from("tenant_registry")
    .select("*, bot_pool(bot_username, fly_machine_id), user_identity_map(email)")
    .eq("id", tenantId)
    .single();

  if (fetchErr || !tenant) {
    return NextResponse.json(
      { error: fetchErr?.message || "Tenant not found" },
      { status: 404 }
    );
  }

  const flyAppName = tenant.fly_app_name;
  const machineId = tenant.bot_pool?.fly_machine_id;
  const email = tenant.user_identity_map?.email;
  const botUsername = tenant.bot_pool?.bot_username;

  if (!flyAppName || !machineId) {
    return NextResponse.json(
      { error: "Tenant is missing fly_app_name or fly_machine_id" },
      { status: 400 }
    );
  }

  // Ensure the VM is running (exec requires a started machine)
  const started = await startMachine(flyAppName, machineId);
  if (!started) {
    return NextResponse.json(
      { error: "Failed to start Fly machine" },
      { status: 500 }
    );
  }

  // Configure the tenant VM (clear sessions, restart)
  try {
    await configureTenant(flyAppName, machineId);
  } catch (err) {
    console.error("configureTenant failed:", err);
    return NextResponse.json(
      { error: `VM configuration failed: ${err instanceof Error ? err.message : err}` },
      { status: 500 }
    );
  }

  // Mark tenant as active
  const { error: updateErr } = await supabase
    .from("tenant_registry")
    .update({
      status: "active",
      provisioned_at: new Date().toISOString(),
    })
    .eq("id", tenantId);

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  // Best-effort: send activation email
  try {
    if (email && botUsername) {
      await sendActivationEmail({
        to: email,
        firstName: email.split("@")[0],
        botUsername,
      });
    }
  } catch (err) {
    console.error("Activation email failed (non-blocking):", err);
  }

  return NextResponse.json({ success: true });
}

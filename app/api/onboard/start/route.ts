import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { startMachine, restartMachine, getMachineStatus, waitForMachineState } from "@/lib/fly";

export const maxDuration = 60;

export async function POST() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
    .select("id, fly_app_name, fly_machine_id")
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
    const state = await getMachineStatus(appName, machineId);

    if (state === "started") {
      // Already running — skip
      return NextResponse.json({ started: true });
    }

    if (state === "failed" || state === "replacing") {
      // Failed machines can't be started — restart instead
      const ok = await restartMachine(appName, machineId);
      if (!ok) throw new Error("restartMachine returned non-200");
    } else {
      // stopped, created, etc. — normal start
      await startMachine(appName, machineId);
    }

    await waitForMachineState(appName, machineId, "started", 45000, 2000);
  } catch (err) {
    console.error("VM start failed:", err);
    return NextResponse.json(
      { error: `Failed to start VM: ${err instanceof Error ? err.message : "Unknown error"}` },
      { status: 500 }
    );
  }

  return NextResponse.json({ started: true });
}

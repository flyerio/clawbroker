const FLY_API = "https://api.machines.dev/v1";

function headers() {
  return {
    Authorization: `Bearer ${process.env.FLY_API_TOKEN}`,
    "Content-Type": "application/json",
  };
}

export async function startMachine(
  appName: string,
  machineId: string
): Promise<boolean> {
  const res = await fetch(
    `${FLY_API}/apps/${appName}/machines/${machineId}/start`,
    { method: "POST", headers: headers() }
  );
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`startMachine failed (${res.status}): ${body}`);
  }
  return true;
}

export async function stopMachine(
  appName: string,
  machineId: string
): Promise<boolean> {
  const res = await fetch(
    `${FLY_API}/apps/${appName}/machines/${machineId}/stop`,
    { method: "POST", headers: headers() }
  );
  return res.ok;
}

export async function getMachineStatus(
  appName: string,
  machineId: string
): Promise<string | null> {
  const res = await fetch(
    `${FLY_API}/apps/${appName}/machines/${machineId}`,
    { headers: headers() }
  );
  if (!res.ok) return null;
  const data = await res.json();
  return data.state;
}

// ── Exec & configure ────────────────────────────────────────────────────────

interface ExecResult {
  stdout: string;
  stderr: string;
  exit_code: number;
}

export async function execCommand(
  appName: string,
  machineId: string,
  cmd: string
): Promise<ExecResult> {
  const res = await fetch(
    `${FLY_API}/apps/${appName}/machines/${machineId}/exec`,
    {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ command: ["sh", "-c", cmd], timeout: 10 }),
    }
  );
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`exec failed (${res.status}): ${body}`);
  }
  return res.json();
}

export async function restartMachine(
  appName: string,
  machineId: string
): Promise<boolean> {
  const res = await fetch(
    `${FLY_API}/apps/${appName}/machines/${machineId}/restart`,
    { method: "POST", headers: headers() }
  );
  return res.ok;
}

/**
 * Clear sessions and restart machine to pick up fresh config.
 * 1. Clear sessions so skills re-snapshot
 * 2. Restart machine to pick up new config
 */
export async function configureTenant(
  appName: string,
  machineId: string
): Promise<void> {
  // 1. Clear sessions to force skill re-snapshot
  await execCommand(
    appName,
    machineId,
    "rm -f /data/agents/main/sessions/*.jsonl /data/agents/main/sessions/sessions.json && chown -R node:node /data/agents"
  );

  // 2. Restart to pick up new config
  const restarted = await restartMachine(appName, machineId);
  if (!restarted) {
    throw new Error("Failed to restart machine after configuration");
  }
}

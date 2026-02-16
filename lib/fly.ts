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
  return res.ok;
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
 * Replicates deploy-tenant.sh configure-user:
 * 1. Read /data/openclaw.json
 * 2. Add telegramUserId to channels.telegram.allowFrom (idempotent)
 * 3. Write updated config back
 * 4. Clear sessions so skills re-snapshot
 * 5. Restart machine to pick up new config
 */
export async function configureTenant(
  appName: string,
  machineId: string,
  telegramUserId: string
): Promise<void> {
  // 1. Read current config
  const readResult = await execCommand(appName, machineId, "cat /data/openclaw.json");
  if (readResult.exit_code !== 0) {
    throw new Error(`Failed to read openclaw.json: ${readResult.stderr}`);
  }

  // 2. Parse and update allowFrom
  const config = JSON.parse(readResult.stdout);
  if (!config.channels) config.channels = {};
  if (!config.channels.telegram) config.channels.telegram = {};
  const allowFrom: string[] = config.channels.telegram.allowFrom || [];
  if (!allowFrom.includes(telegramUserId)) {
    allowFrom.push(telegramUserId);
  }
  config.channels.telegram.allowFrom = allowFrom;

  // 3. Write updated config back via base64 to avoid shell escaping issues
  const encoded = Buffer.from(JSON.stringify(config, null, 2)).toString("base64");
  const writeResult = await execCommand(
    appName,
    machineId,
    `echo '${encoded}' | base64 -d > /data/openclaw.json && chown node:node /data/openclaw.json`
  );
  if (writeResult.exit_code !== 0) {
    throw new Error(`Failed to write openclaw.json: ${writeResult.stderr}`);
  }

  // 4. Clear sessions to force skill re-snapshot
  await execCommand(
    appName,
    machineId,
    "rm -f /data/agents/main/sessions/*.jsonl /data/agents/main/sessions/sessions.json && chown -R node:node /data/agents"
  );

  // 5. Restart to pick up new config
  const restarted = await restartMachine(appName, machineId);
  if (!restarted) {
    throw new Error("Failed to restart machine after configuration");
  }
}

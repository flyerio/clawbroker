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

// ── Wait for machine state ──────────────────────────────────────────────────

export async function waitForMachineState(
  appName: string,
  machineId: string,
  target: string = "started",
  timeoutMs: number = 45000,
  intervalMs: number = 2000
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const state = await getMachineStatus(appName, machineId);
    if (state === target) return;
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error(
    `Machine ${machineId} did not reach "${target}" within ${timeoutMs / 1000}s`
  );
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
 * Patch openclaw.json on a running VM via exec.
 * Deep-merges `patch` into the existing config.
 */
export async function updateTenantConfig(
  appName: string,
  machineId: string,
  patch: Record<string, unknown>
): Promise<void> {
  const patchStr = JSON.stringify(JSON.stringify(patch));
  const cmd = `node -e "\
const fs=require('fs');\
const cfg=JSON.parse(fs.readFileSync('/data/openclaw.json','utf8'));\
const p=JSON.parse(${patchStr});\
function m(t,s){for(const k in s){if(s[k]&&typeof s[k]==='object'&&!Array.isArray(s[k])){t[k]=t[k]||{};m(t[k],s[k])}else{t[k]=s[k]}}return t}\
m(cfg,p);\
fs.writeFileSync('/data/openclaw.json',JSON.stringify(cfg,null,2));\
"`;
  await execCommand(appName, machineId, cmd);
}

/**
 * Set a secret on a Fly app via the GraphQL API.
 * This triggers a machine restart to pick up the new secret.
 */
export async function setAppSecret(
  appName: string,
  key: string,
  value: string
): Promise<void> {
  const res = await fetch("https://api.fly.io/graphql", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.FLY_API_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: `mutation($input: SetSecretsInput!) {
        setSecrets(input: $input) { app { name } }
      }`,
      variables: {
        input: {
          appId: appName,
          secrets: [{ key, value }],
        },
      },
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`setAppSecret failed (${res.status}): ${body}`);
  }
  const json = await res.json();
  if (json.errors?.length) {
    throw new Error(`setAppSecret GraphQL error: ${json.errors[0].message}`);
  }
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

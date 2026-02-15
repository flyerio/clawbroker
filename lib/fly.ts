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

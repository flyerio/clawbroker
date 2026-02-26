import { NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { verifyAdminAccess } from "@/lib/admin-auth";
import { BLOCKED_EMAIL_DOMAINS } from "@/lib/email-policy";

export async function POST() {
  const { authorized } = await verifyAdminAccess();
  if (!authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const client = await clerkClient();

  // Enable blocklist + block subaddresses + block disposable domains
  await client.instance.updateRestrictions({
    blocklist: true,
    blockEmailSubaddresses: true,
    blockDisposableEmailDomains: true,
  });

  const results: { domain: string; status: "added" | "exists" | "error"; error?: string }[] = [];

  for (const domain of BLOCKED_EMAIL_DOMAINS) {
    try {
      await client.blocklistIdentifiers.createBlocklistIdentifier({
        identifier: `*@${domain}`,
      });
      results.push({ domain, status: "added" });
    } catch (err: unknown) {
      const status = (err as { status?: number }).status;
      const message = err instanceof Error ? err.message : String(err);
      // Clerk returns 400 "Bad Request" for duplicate blocklist entries
      if (status === 400 || message.includes("already exists") || message.includes("duplicate")) {
        results.push({ domain, status: "exists" });
      } else {
        results.push({ domain, status: "error", error: message });
      }
    }
  }

  const added = results.filter((r) => r.status === "added").length;
  const exists = results.filter((r) => r.status === "exists").length;
  const errors = results.filter((r) => r.status === "error").length;

  return NextResponse.json({
    summary: { total: BLOCKED_EMAIL_DOMAINS.length, added, exists, errors },
    results,
  });
}

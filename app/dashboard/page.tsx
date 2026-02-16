"use client";

import { useUser, useClerk } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import Link from "next/link";

interface Balance {
  total_budget_usd: number;
  llm_spent_usd: number;
  app_spent_usd: number;
  remaining_usd: number;
}

interface Status {
  status: string;
  botUsername?: string;
  flyAppName?: string;
  telegramUserId?: string;
  createdAt?: string;
  provisionedAt?: string;
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; color: string; bg: string }> = {
    pending: {
      label: "Setting up...",
      color: "text-amber-700",
      bg: "bg-amber-50 border-amber-200",
    },
    provisioning: {
      label: "Provisioning...",
      color: "text-amber-700",
      bg: "bg-amber-50 border-amber-200",
    },
    active: {
      label: "Active",
      color: "text-emerald-700",
      bg: "bg-emerald-50 border-emerald-200",
    },
    suspended: {
      label: "Paused",
      color: "text-red-700",
      bg: "bg-red-50 border-red-200",
    },
    no_tenant: {
      label: "Not set up",
      color: "text-zinc-500",
      bg: "bg-zinc-50 border-zinc-200",
    },
  };
  const c = config[status] || config.pending;
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${c.bg} ${c.color}`}
    >
      {c.label}
    </span>
  );
}

export default function DashboardPage() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const [balance, setBalance] = useState<Balance | null>(null);
  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [balRes, statRes] = await Promise.all([
        fetch("/api/balance"),
        fetch("/api/status"),
      ]);
      if (balRes.ok) setBalance(await balRes.json());
      if (statRes.ok) setStatus(await statRes.json());
      setLoading(false);
    }
    load();
  }, []);

  if (!isLoaded || loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <p className="text-zinc-400">Loading dashboard...</p>
      </div>
    );
  }

  if (status?.status === "no_tenant") {
    return (
      <div className="flex min-h-dvh items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            No agent set up yet
          </h1>
          <p className="text-sm text-zinc-400 mb-4">
            Complete onboarding to get your personal CRE AI agent.
          </p>
          <Link
            href="/onboarding"
            className="main-btn-shadow text-sm inline-block"
          >
            Set Up Agent
          </Link>
        </div>
      </div>
    );
  }

  const totalBudget = balance?.total_budget_usd ?? 10;
  const remaining = balance?.remaining_usd ?? 10;
  const spent = totalBudget - remaining;
  const pct = totalBudget > 0 ? Math.max(0, (remaining / totalBudget) * 100) : 0;

  return (
    <div className="min-h-dvh px-4 py-8 sm:py-12">
      <div className="max-w-2xl mx-auto flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              Hi, {user?.firstName || "there"}
            </h1>
            <p className="text-sm text-zinc-400">Your ClawBroker dashboard</p>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={status?.status || "pending"} />
            <button
              onClick={() => signOut({ redirectUrl: "/" })}
              className="text-xs text-zinc-400 hover:text-zinc-600 transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>

        {/* Bot Card */}
        <div className="card-frame p-2">
          <div className="bg-white border border-black/5 rounded-2xl p-6">
            {status?.status === "active" ? (
              <>
                <h2 className="text-lg font-medium text-gray-900 mb-1">
                  Your agent is ready!
                </h2>
                <p className="text-sm text-zinc-400 mb-4">
                  Message your bot on Telegram to start chatting.
                </p>
                <a
                  href={`https://t.me/${status.botUsername}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="main-btn-shadow text-sm inline-block"
                >
                  Open @{status.botUsername} on Telegram
                </a>
              </>
            ) : status?.status === "suspended" ? (
              <>
                <h2 className="text-lg font-medium text-gray-900 mb-1">
                  Agent paused
                </h2>
                <p className="text-sm text-zinc-400 mb-4">
                  Your credit balance has been used up. Add more credits to
                  reactivate your agent.
                </p>
                <a
                  href="/dashboard"
                  className="main-btn-shadow text-sm inline-block"
                >
                  Add Credits
                </a>
              </>
            ) : (
              <>
                <h2 className="text-lg font-medium text-gray-900 mb-1">
                  Setting up your agent...
                </h2>
                <p className="text-sm text-zinc-400 mb-2">
                  We&apos;re configuring your personal AI agent. This usually
                  takes under 5 minutes.
                </p>
                {status?.botUsername && (
                  <p className="text-sm text-zinc-500">
                    Your bot: <strong>@{status.botUsername}</strong>
                  </p>
                )}
              </>
            )}
          </div>
        </div>

        {/* Balance Card */}
        <div className="card-frame p-2">
          <div className="bg-white border border-black/5 rounded-2xl p-6">
            <div className="flex items-baseline justify-between mb-3">
              <h2 className="text-lg font-medium text-gray-900">Balance</h2>
              <span className="text-2xl font-semibold text-gray-900 tabular-nums">
                ${remaining.toFixed(2)}
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full h-2 bg-zinc-100 rounded-full overflow-hidden mb-2">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  pct > 20 ? "bg-emerald-500" : pct > 5 ? "bg-amber-500" : "bg-red-500"
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="text-xs text-zinc-400">
              ${spent.toFixed(2)} spent of ${totalBudget.toFixed(2)} budget
            </p>

            <Link
              href="/dashboard/usage"
              className="text-sm text-indigo-600 hover:text-indigo-700 mt-3 inline-block"
            >
              View usage breakdown &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

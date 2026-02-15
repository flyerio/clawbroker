"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Balance {
  total_budget_usd: number;
  llm_spent_usd: number;
  app_spent_usd: number;
  remaining_usd: number;
}

export default function UsagePage() {
  const [balance, setBalance] = useState<Balance | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/balance")
      .then((r) => r.json())
      .then(setBalance)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <p className="text-zinc-400">Loading...</p>
      </div>
    );
  }

  const llm = balance?.llm_spent_usd ?? 0;
  const app = balance?.app_spent_usd ?? 0;
  const total = balance?.total_budget_usd ?? 10;
  const remaining = balance?.remaining_usd ?? 10;

  return (
    <div className="min-h-dvh px-4 py-8 sm:py-12">
      <div className="max-w-2xl mx-auto flex flex-col gap-6">
        <div>
          <Link
            href="/dashboard"
            className="text-sm text-zinc-400 hover:text-zinc-600"
          >
            &larr; Back to dashboard
          </Link>
          <h1 className="text-xl font-semibold text-gray-900 mt-2">
            Usage Breakdown
          </h1>
        </div>

        {/* Summary */}
        <div className="card-frame p-2">
          <div className="bg-white border border-black/5 rounded-2xl p-6">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div>
                <p className="text-xs text-zinc-400 mb-1">Budget</p>
                <p className="text-lg font-semibold text-gray-900 tabular-nums">
                  ${total.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-xs text-zinc-400 mb-1">LLM Costs</p>
                <p className="text-lg font-semibold text-gray-900 tabular-nums">
                  ${llm.toFixed(4)}
                </p>
              </div>
              <div>
                <p className="text-xs text-zinc-400 mb-1">App Features</p>
                <p className="text-lg font-semibold text-gray-900 tabular-nums">
                  ${app.toFixed(4)}
                </p>
              </div>
              <div>
                <p className="text-xs text-zinc-400 mb-1">Remaining</p>
                <p className="text-lg font-semibold text-emerald-600 tabular-nums">
                  ${remaining.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Visual breakdown */}
        <div className="card-frame p-2">
          <div className="bg-white border border-black/5 rounded-2xl p-6">
            <h2 className="text-sm font-medium text-gray-900 mb-4">
              Spend Distribution
            </h2>
            <div className="flex flex-col gap-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-zinc-500">AI Model Usage (LLM)</span>
                  <span className="text-gray-900 tabular-nums">
                    ${llm.toFixed(4)}
                  </span>
                </div>
                <div className="w-full h-2 bg-zinc-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full"
                    style={{
                      width: `${total > 0 ? (llm / total) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-zinc-500">
                    App Features (Places, Demographics, etc.)
                  </span>
                  <span className="text-gray-900 tabular-nums">
                    ${app.toFixed(4)}
                  </span>
                </div>
                <div className="w-full h-2 bg-zinc-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{
                      width: `${total > 0 ? (app / total) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

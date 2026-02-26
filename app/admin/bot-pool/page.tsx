"use client";

import { useEffect, useState } from "react";

interface Agent {
  id: string;
  bot_username: string | null;
  fly_app_name: string;
  fly_machine_id: string | null;
  status: string;
  user_id: string | null;
  created_at: string;
  user_identity_map: { email: string } | null;
}

export default function BotPoolPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadAgents() {
    const res = await fetch("/api/admin/bot-pool");
    if (res.ok) setAgents(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    loadAgents();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <p className="text-zinc-400">Loading...</p>
      </div>
    );
  }

  const available = agents.filter((a) => a.status === "available").length;
  const assigned = agents.filter((a) => a.user_id !== null).length;

  return (
    <div className="min-h-dvh px-4 py-8 sm:py-12">
      <div className="max-w-4xl mx-auto flex flex-col gap-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Agent Pool</h1>
          <p className="text-sm text-zinc-400">
            {available} available, {assigned} assigned, {agents.length} total
          </p>
        </div>

        {/* Agent table */}
        <div className="card-frame p-2">
          <div className="bg-white border border-black/5 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-black/5">
                    <th className="text-left px-4 py-3 font-medium text-zinc-500">
                      Bot
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-zinc-500">
                      Fly App
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-zinc-500">
                      Status
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-zinc-500">
                      Assigned To
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {agents.map((agent) => (
                    <tr
                      key={agent.id}
                      className="border-b border-black/5 last:border-0"
                    >
                      <td className="px-4 py-3 text-gray-900">
                        @{agent.bot_username || "—"}
                      </td>
                      <td className="px-4 py-3 text-zinc-500 font-mono text-xs">
                        {agent.fly_app_name}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            agent.status === "available"
                              ? "bg-emerald-50 text-emerald-700"
                              : agent.status === "active"
                                ? "bg-blue-50 text-blue-700"
                                : agent.status === "suspended"
                                  ? "bg-red-50 text-red-700"
                                  : "bg-zinc-100 text-zinc-500"
                          }`}
                        >
                          {agent.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-zinc-500">
                        {agent.user_identity_map?.email || "—"}
                      </td>
                    </tr>
                  ))}
                  {agents.length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-4 py-8 text-center text-zinc-400"
                      >
                        No agents in pool.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";

interface Tenant {
  id: string;
  user_id: string;
  fly_app_name: string;
  telegram_user_id: string | null;
  status: string;
  created_at: string;
  provisioned_at: string | null;
  bot_pool: {
    bot_username: string;
    fly_machine_id: string | null;
  } | null;
  user_identity_map: {
    email: string;
  } | null;
  balance?: {
    remaining_usd: number;
    total_budget_usd: number;
  };
}

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  async function loadTenants() {
    const res = await fetch("/api/admin/tenants");
    if (res.ok) setTenants(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    loadTenants();
  }, []);

  async function activate(tenantId: string) {
    setActionLoading(tenantId);
    await fetch("/api/admin/activate-tenant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tenantId }),
    });
    await loadTenants();
    setActionLoading(null);
  }

  async function suspend(tenantId: string) {
    setActionLoading(tenantId);
    await fetch("/api/admin/suspend-tenant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tenantId }),
    });
    await loadTenants();
    setActionLoading(null);
  }

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <p className="text-zinc-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-dvh px-4 py-8 sm:py-12">
      <div className="max-w-5xl mx-auto flex flex-col gap-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Tenants</h1>
          <p className="text-sm text-zinc-400">
            {tenants.length} total tenants
          </p>
        </div>

        <div className="card-frame p-2">
          <div className="bg-white border border-black/5 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-black/5">
                    <th className="text-left px-4 py-3 font-medium text-zinc-500">
                      User
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-zinc-500">
                      Telegram
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-zinc-500">
                      Bot
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-zinc-500">
                      Status
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-zinc-500">
                      Balance
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-zinc-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tenants.map((t) => (
                    <tr
                      key={t.id}
                      className="border-b border-black/5 last:border-0"
                    >
                      <td className="px-4 py-3 text-gray-900">
                        {t.user_identity_map?.email || t.user_id}
                      </td>
                      <td className="px-4 py-3 text-zinc-500">
                        {t.telegram_user_id || "—"}
                      </td>
                      <td className="px-4 py-3 text-zinc-500">
                        @{t.bot_pool?.bot_username || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            t.status === "active"
                              ? "bg-emerald-50 text-emerald-700"
                              : t.status === "pending"
                                ? "bg-amber-50 text-amber-700"
                                : t.status === "suspended"
                                  ? "bg-red-50 text-red-700"
                                  : "bg-zinc-100 text-zinc-500"
                          }`}
                        >
                          {t.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-zinc-500 tabular-nums">
                        {t.balance
                          ? `$${Number(t.balance.remaining_usd).toFixed(2)}`
                          : "—"}
                      </td>
                      <td className="px-4 py-3">
                        {actionLoading === t.id ? (
                          <span className="text-xs text-zinc-400">...</span>
                        ) : t.status === "pending" ||
                          t.status === "suspended" ? (
                          <button
                            onClick={() => activate(t.id)}
                            className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                          >
                            Activate
                          </button>
                        ) : t.status === "active" ? (
                          <button
                            onClick={() => suspend(t.id)}
                            className="text-xs text-red-600 hover:text-red-700 font-medium"
                          >
                            Suspend
                          </button>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                  {tenants.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-8 text-center text-zinc-400"
                      >
                        No tenants yet.
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

"use client";

import { useEffect, useState } from "react";

interface Bot {
  id: string;
  bot_username: string;
  bot_token: string;
  fly_app_name: string;
  fly_machine_id: string | null;
  status: string;
  assigned_to: string | null;
  assigned_at: string | null;
  created_at: string;
  user_identity_map: { email: string } | null;
}

export default function BotPoolPage() {
  const [bots, setBots] = useState<Bot[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    bot_username: "",
    bot_token: "",
    fly_app_name: "",
    fly_machine_id: "",
  });
  const [saving, setSaving] = useState(false);

  async function loadBots() {
    const res = await fetch("/api/admin/bot-pool");
    if (res.ok) setBots(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    loadBots();
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/admin/bot-pool", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setForm({ bot_username: "", bot_token: "", fly_app_name: "", fly_machine_id: "" });
      setShowForm(false);
      await loadBots();
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <p className="text-zinc-400">Loading...</p>
      </div>
    );
  }

  const available = bots.filter((b) => b.status === "available").length;
  const assigned = bots.filter((b) => b.status === "assigned").length;

  return (
    <div className="min-h-dvh px-4 py-8 sm:py-12">
      <div className="max-w-4xl mx-auto flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Bot Pool</h1>
            <p className="text-sm text-zinc-400">
              {available} available, {assigned} assigned, {bots.length} total
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="main-btn-shadow text-sm"
          >
            {showForm ? "Cancel" : "Add Bot"}
          </button>
        </div>

        {showForm && (
          <form
            onSubmit={handleAdd}
            className="card-frame p-2"
          >
            <div className="bg-white border border-black/5 rounded-2xl p-6 flex flex-col gap-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  placeholder="Bot username (without @)"
                  value={form.bot_username}
                  onChange={(e) =>
                    setForm({ ...form, bot_username: e.target.value })
                  }
                  className="bg-black/5 border border-black/10 rounded-xl px-4 py-2.5 text-sm outline-none"
                  required
                />
                <input
                  placeholder="Bot token"
                  value={form.bot_token}
                  onChange={(e) =>
                    setForm({ ...form, bot_token: e.target.value })
                  }
                  className="bg-black/5 border border-black/10 rounded-xl px-4 py-2.5 text-sm outline-none"
                  required
                />
                <input
                  placeholder="Fly app name"
                  value={form.fly_app_name}
                  onChange={(e) =>
                    setForm({ ...form, fly_app_name: e.target.value })
                  }
                  className="bg-black/5 border border-black/10 rounded-xl px-4 py-2.5 text-sm outline-none"
                  required
                />
                <input
                  placeholder="Fly machine ID (optional)"
                  value={form.fly_machine_id}
                  onChange={(e) =>
                    setForm({ ...form, fly_machine_id: e.target.value })
                  }
                  className="bg-black/5 border border-black/10 rounded-xl px-4 py-2.5 text-sm outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={saving}
                className="main-btn-shadow text-sm self-start disabled:opacity-50"
              >
                {saving ? "Adding..." : "Add to Pool"}
              </button>
            </div>
          </form>
        )}

        {/* Bot table */}
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
                  {bots.map((bot) => (
                    <tr
                      key={bot.id}
                      className="border-b border-black/5 last:border-0"
                    >
                      <td className="px-4 py-3 text-gray-900">
                        @{bot.bot_username}
                      </td>
                      <td className="px-4 py-3 text-zinc-500 font-mono text-xs">
                        {bot.fly_app_name}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            bot.status === "available"
                              ? "bg-emerald-50 text-emerald-700"
                              : bot.status === "assigned"
                                ? "bg-blue-50 text-blue-700"
                                : "bg-zinc-100 text-zinc-500"
                          }`}
                        >
                          {bot.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-zinc-500">
                        {bot.user_identity_map?.email || "—"}
                      </td>
                    </tr>
                  ))}
                  {bots.length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-4 py-8 text-center text-zinc-400"
                      >
                        No bots in pool. Add one above.
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

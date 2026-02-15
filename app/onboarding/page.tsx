"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function OnboardingPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [telegramUsername, setTelegramUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isLoaded) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <p className="text-zinc-400">Loading...</p>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const username = telegramUsername.replace(/^@/, "").trim();
    if (!username) {
      setError("Please enter your Telegram username");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telegramUsername: username }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
        setLoading(false);
        return;
      }

      router.push("/dashboard");
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="card-frame p-2">
          <div className="bg-white border border-black/5 rounded-2xl p-6 sm:p-8">
            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              Welcome, {user?.firstName || "there"}!
            </h1>
            <p className="text-sm text-zinc-400 mb-6">
              Connect your Telegram account to get your personal CRE AI agent.
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label
                  htmlFor="telegram"
                  className="block text-sm font-medium text-gray-900 mb-1.5"
                >
                  Telegram Username
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm">
                    @
                  </span>
                  <input
                    id="telegram"
                    type="text"
                    value={telegramUsername}
                    onChange={(e) => setTelegramUsername(e.target.value)}
                    placeholder="yourusername"
                    className="w-full bg-black/5 border border-black/10 rounded-xl pl-8 pr-4 py-2.5 text-sm text-gray-900 placeholder:text-zinc-400 outline-none focus:border-black/20 transition-colors"
                    autoFocus
                  />
                </div>
                <p className="mt-1.5 text-xs text-zinc-400">
                  Open Telegram, go to Settings, and copy your username.
                </p>
              </div>

              {error && (
                <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="main-btn-shadow text-sm sm:text-base w-full disabled:opacity-50"
              >
                {loading ? "Setting up your agent..." : "Deploy My Agent"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

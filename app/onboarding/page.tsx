"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";

export default function OnboardingPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [telegramUserId, setTelegramUserId] = useState("");
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

    const userId = telegramUserId.trim();
    if (!userId || !/^\d+$/.test(userId)) {
      setError("Please enter a valid numeric Telegram user ID");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telegramUserId: userId }),
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
                  Telegram User ID
                </label>
                <input
                  id="telegram"
                  type="text"
                  inputMode="numeric"
                  value={telegramUserId}
                  onChange={(e) => setTelegramUserId(e.target.value)}
                  placeholder="8411700555"
                  className="w-full bg-black/5 border border-black/10 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder:text-zinc-400 outline-none focus:border-black/20 transition-colors"
                  autoFocus
                />
                <p className="mt-1.5 text-xs text-zinc-400">
                  Message <span className="font-medium text-zinc-500">@userinfobot</span> on Telegram — it will reply with your numeric ID.
                </p>
                <div className="mt-3 flex flex-col items-center gap-2 rounded-xl bg-black/[0.02] border border-black/5 p-4">
                  <QRCodeSVG
                    value="https://t.me/userinfobot?start=id"
                    size={120}
                    bgColor="transparent"
                    fgColor="#18181b"
                    level="M"
                  />
                  <a
                    href="https://t.me/userinfobot?start=id"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
                  >
                    Open @userinfobot in Telegram &rarr;
                  </a>
                </div>
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

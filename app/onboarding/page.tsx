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

            {/* Step 1: Get your Telegram ID */}
            <div className="flex flex-col items-center gap-3 mb-6">
              <p className="text-sm text-zinc-500 self-start">
                Open <span className="font-medium text-zinc-700">@userinfobot</span> on Telegram — it will reply with your numeric ID.
              </p>
              <div className="rounded-xl bg-black/[0.02] border border-black/5 p-4">
                <QRCodeSVG
                  value="https://t.me/userinfobot?start=id"
                  size={120}
                  bgColor="transparent"
                  fgColor="#18181b"
                  level="M"
                />
              </div>
              <a
                href="https://t.me/userinfobot?start=id"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-[#2AABEE] hover:bg-[#229ED9] text-white text-sm font-medium px-5 py-2.5 transition-colors"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                </svg>
                Open @userinfobot
              </a>
            </div>

            {/* Step 2: Paste ID and deploy */}
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

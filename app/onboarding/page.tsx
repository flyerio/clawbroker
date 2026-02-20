"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";

type Step = "deploying" | "ready" | "error";

export default function OnboardingPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [step, setStep] = useState<Step>("deploying");
  const [botUsername, setBotUsername] = useState("");
  const [error, setError] = useState("");
  const [checkingStatus, setCheckingStatus] = useState(true);
  const deployedRef = useRef(false);

  // On mount: check if user already has a tenant
  useEffect(() => {
    async function checkExisting() {
      try {
        const res = await fetch("/api/status");
        if (!res.ok) {
          setCheckingStatus(false);
          return;
        }
        const data = await res.json();

        if (data.status === "active" && data.botUsername) {
          setBotUsername(data.botUsername);
          setStep("ready");
          setCheckingStatus(false);
          return;
        }
        if (data.status === "no_tenant") {
          // Auto-deploy — no button click needed
          setCheckingStatus(false);
          if (!deployedRef.current) {
            deployedRef.current = true;
            handleDeploy();
          }
          return;
        }
        // Has a tenant in some other state — go to dashboard
        router.push("/dashboard");
        return;
      } catch {
        // Network error — show deploying state, try deploy anyway
        setCheckingStatus(false);
        if (!deployedRef.current) {
          deployedRef.current = true;
          handleDeploy();
        }
      }
    }
    checkExisting();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  async function handleDeploy() {
    setStep("deploying");
    setError("");

    try {
      const res = await fetch("/api/onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
        setStep("error");
        return;
      }

      setBotUsername(data.botUsername);
      setStep("ready");
    } catch {
      setError("Network error. Please try again.");
      setStep("error");
    }
  }

  if (!isLoaded || checkingStatus) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <p className="text-zinc-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="card-frame p-2">
          <div className="bg-white border border-black/5 rounded-2xl p-6 sm:p-8">
            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              Welcome, {user?.firstName || "there"}!
            </h1>

            {step === "deploying" && (
              <>
                <p className="text-sm text-zinc-400 mb-6">
                  Setting up your personal CRE AI agent...
                </p>
                <div className="flex items-center gap-3 text-sm text-zinc-500">
                  <svg className="w-4 h-4 animate-spin text-indigo-500 shrink-0" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                    <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75" />
                  </svg>
                  Provisioning your agent...
                </div>
              </>
            )}

            {step === "error" && (
              <>
                <p className="text-sm text-zinc-400 mb-6">
                  Deploy your personal CRE AI agent — accessible via Telegram.
                </p>

                <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2 mb-4">
                  {error || "Something went wrong"}
                </p>

                <button
                  onClick={() => {
                    deployedRef.current = true;
                    handleDeploy();
                  }}
                  className="main-btn-shadow text-sm sm:text-base w-full"
                >
                  Try Again
                </button>
              </>
            )}

            {step === "ready" && (
              <>
                <p className="text-sm text-zinc-400 mb-6">
                  Your agent is ready! Open Telegram to start chatting.
                </p>

                <div className="flex flex-col gap-3">
                  <a
                    href={`https://t.me/${botUsername}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2AABEE] hover:bg-[#229ED9] text-white text-sm font-medium px-5 py-2.5 transition-colors"
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                    </svg>
                    Open @{botUsername} on Telegram
                  </a>

                  <button
                    onClick={() => router.push("/dashboard")}
                    className="text-sm text-zinc-500 hover:text-zinc-700 transition-colors py-2"
                  >
                    Go to Dashboard
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

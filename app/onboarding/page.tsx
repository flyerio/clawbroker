"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";

type Step = "deploying" | "pairing" | "activating" | "error";

export default function OnboardingPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [step, setStep] = useState<Step>("deploying");
  const [botUsername, setBotUsername] = useState("");
  const [pairingToken, setPairingToken] = useState("");
  const [error, setError] = useState("");
  const [checkingStatus, setCheckingStatus] = useState(true);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const deployedRef = useRef(false);

  const deepLink = botUsername && pairingToken
    ? `https://t.me/${botUsername}?start=${pairingToken}`
    : "";

  // Poll /api/status every 3s to detect when pairing completes
  const startPolling = useCallback(() => {
    if (pollRef.current) return;
    startTimeRef.current = Date.now();

    pollRef.current = setInterval(async () => {
      // 10-minute timeout
      if (Date.now() - startTimeRef.current > 10 * 60 * 1000) {
        if (pollRef.current) clearInterval(pollRef.current);
        pollRef.current = null;
        setError("Pairing timed out. Please try again.");
        setStep("error");
        return;
      }

      try {
        const res = await fetch("/api/status");
        if (!res.ok) return;
        const data = await res.json();

        if (data.status === "activating") {
          setStep("activating");
        } else if (data.status === "active") {
          if (pollRef.current) clearInterval(pollRef.current);
          pollRef.current = null;
          router.push("/dashboard");
        } else if (data.status === "pending") {
          // Activation failed, fell back to pending — redirect to dashboard
          if (pollRef.current) clearInterval(pollRef.current);
          pollRef.current = null;
          router.push("/dashboard");
        }
      } catch {
        // Network error — keep polling
      }
    }, 3000);
  }, [router]);

  // On mount: check if user is already mid-pairing
  useEffect(() => {
    async function checkExisting() {
      try {
        const res = await fetch("/api/status");
        if (!res.ok) {
          setCheckingStatus(false);
          return;
        }
        const data = await res.json();

        if (data.status === "active") {
          router.push("/dashboard");
          return;
        }
        if (data.status === "pairing" && data.pairingToken && data.botUsername) {
          setBotUsername(data.botUsername);
          setPairingToken(data.pairingToken);
          setStep("pairing");
          setCheckingStatus(false);
          return;
        }
        if (data.status === "activating") {
          setBotUsername(data.botUsername || "");
          setStep("activating");
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

  // Start polling when we enter pairing or activating step
  useEffect(() => {
    if (step === "pairing" || step === "activating") {
      startPolling();
    }
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [step, startPolling]);

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
      setPairingToken(data.pairingToken);
      setStep("pairing");
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

            {step === "pairing" && (
              <>
                <p className="text-sm text-zinc-400 mb-6">
                  Tap the button below to connect your Telegram account. This links your identity automatically — no copying or pasting.
                </p>

                <div className="flex flex-col items-center gap-4 mb-6">
                  <div className="rounded-xl bg-black/[0.02] border border-black/5 p-4">
                    <QRCodeSVG
                      value={deepLink}
                      size={140}
                      bgColor="transparent"
                      fgColor="#18181b"
                      level="M"
                    />
                  </div>

                  <a
                    href={deepLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl bg-[#2AABEE] hover:bg-[#229ED9] text-white text-sm font-medium px-5 py-2.5 transition-colors"
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                    </svg>
                    Open @{botUsername} on Telegram
                  </a>
                </div>

                <div className="flex items-center gap-3 text-sm text-zinc-400">
                  <svg className="w-4 h-4 animate-spin text-zinc-300 shrink-0" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                    <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75" />
                  </svg>
                  Waiting for your Telegram message...
                </div>

                {error && (
                  <div className="mt-4">
                    <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2 mb-3">
                      {error}
                    </p>
                    <button
                      onClick={() => {
                        deployedRef.current = true;
                        handleDeploy();
                      }}
                      className="text-sm text-indigo-600 hover:text-indigo-700"
                    >
                      Try again
                    </button>
                  </div>
                )}
              </>
            )}

            {step === "activating" && (
              <>
                <p className="text-sm text-zinc-400 mb-4">
                  Telegram connected! Setting up your agent now...
                </p>
                <div className="flex items-center gap-3 text-sm text-zinc-500">
                  <svg className="w-4 h-4 animate-spin text-emerald-500 shrink-0" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                    <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75" />
                  </svg>
                  Configuring your personal AI agent...
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

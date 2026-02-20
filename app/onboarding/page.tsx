"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Loader2, XCircle } from "lucide-react";
import {
  ONBOARD_STEPS,
  type OnboardStepId,
  type StepStatus,
} from "@/lib/onboard-types";

type StepState = Record<OnboardStepId, StepStatus>;

const initialState: StepState = {
  account: "pending",
  assign: "pending",
  start: "pending",
  configure: "pending",
};

// ── Step indicator (circle icon) ────────────────────────────────────────────

function StepIndicator({ status }: { status: StepStatus }) {
  return (
    <div className="relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 bg-white transition-colors duration-300"
      style={{
        borderColor:
          status === "done"    ? "#22c55e" :
          status === "running" ? "#6366f1" :
          status === "error"   ? "#ef4444" :
          "#d4d4d8",
      }}
    >
      <AnimatePresence mode="wait">
        {status === "done" && (
          <motion.div key="done" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={{ type: "spring", stiffness: 400, damping: 15 }}>
            <Check className="h-4 w-4 text-green-500" strokeWidth={3} />
          </motion.div>
        )}
        {status === "running" && (
          <motion.div key="running" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Loader2 className="h-4 w-4 text-indigo-500 animate-spin" />
          </motion.div>
        )}
        {status === "error" && (
          <motion.div key="error" initial={{ scale: 0 }} animate={{ scale: 1, rotate: [0, -10, 10, -10, 0] }} exit={{ scale: 0 }} transition={{ duration: 0.4 }}>
            <XCircle className="h-4 w-4 text-red-500" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Single step row with connector line ─────────────────────────────────────

function StepRow({
  status,
  label,
  doneLabel,
  isLast,
}: {
  status: StepStatus;
  label: string;
  doneLabel: string;
  isLast: boolean;
}) {
  const text =
    status === "done" ? doneLabel :
    status === "error" ? label.replace("...", " failed") :
    label;

  return (
    <div className="flex gap-3">
      {/* Indicator + vertical line */}
      <div className="flex flex-col items-center">
        <StepIndicator status={status} />
        {!isLast && (
          <div
            className="w-0.5 grow transition-colors duration-500"
            style={{
              backgroundColor: status === "done" ? "#22c55e" : "#e4e4e7",
            }}
          />
        )}
      </div>

      {/* Label */}
      <p
        className={`text-sm pt-1 pb-5 transition-colors duration-300 ${
          status === "done"    ? "text-green-600" :
          status === "running" ? "text-gray-900 font-medium" :
          status === "error"   ? "text-red-600 font-medium" :
          "text-zinc-400"
        }`}
      >
        {text}
      </p>
    </div>
  );
}

// ── Main page ───────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [steps, setSteps] = useState<StepState>(initialState);
  const [botUsername, setBotUsername] = useState("");
  const [error, setError] = useState("");
  const [allDone, setAllDone] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const startedRef = useRef(false);

  const updateStep = useCallback(
    (id: OnboardStepId, status: StepStatus) =>
      setSteps((prev) => ({ ...prev, [id]: status })),
    []
  );

  // Run steps sequentially, starting from `fromIndex`
  const runSteps = useCallback(
    async (fromIndex: number) => {
      setError("");

      for (let i = fromIndex; i < ONBOARD_STEPS.length; i++) {
        const s = ONBOARD_STEPS[i];
        updateStep(s.id, "running");

        try {
          const res = await fetch(s.endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
          });
          const data = await res.json();

          if (!res.ok) {
            updateStep(s.id, "error");
            setError(data.error || "Something went wrong");
            return;
          }

          // Capture botUsername from the last step (configure) or assign
          if (data.botUsername) {
            setBotUsername(data.botUsername);
          }

          updateStep(s.id, "done");
        } catch {
          updateStep(s.id, "error");
          setError("Network error. Please check your connection.");
          return;
        }
      }

      setAllDone(true);
    },
    [updateStep]
  );

  // Retry from the first errored step
  const handleRetry = useCallback(() => {
    const idx = ONBOARD_STEPS.findIndex((s) => steps[s.id] === "error");
    if (idx >= 0) {
      runSteps(idx);
    }
  }, [steps, runSteps]);

  // On mount: check existing status, then auto-run
  useEffect(() => {
    async function checkExisting() {
      try {
        const res = await fetch("/api/status");
        if (!res.ok) {
          setCheckingStatus(false);
          if (!startedRef.current) {
            startedRef.current = true;
            runSteps(0);
          }
          return;
        }
        const data = await res.json();

        if (data.status === "active" && data.botUsername) {
          setBotUsername(data.botUsername);
          setSteps({
            account: "done",
            assign: "done",
            start: "done",
            configure: "done",
          });
          setAllDone(true);
          setCheckingStatus(false);
          return;
        }
        if (data.status === "no_tenant") {
          setCheckingStatus(false);
          if (!startedRef.current) {
            startedRef.current = true;
            runSteps(0);
          }
          return;
        }
        // Tenant in some other state — try to resume from the right step
        if (data.status === "pending" || data.status === "pairing") {
          // Account + assign already done, need to start + configure
          if (data.botUsername) setBotUsername(data.botUsername);
          setSteps((prev) => ({ ...prev, account: "done", assign: "done" }));
          setCheckingStatus(false);
          if (!startedRef.current) {
            startedRef.current = true;
            runSteps(2); // start from "start" step
          }
          return;
        }
        router.push("/dashboard");
      } catch {
        setCheckingStatus(false);
        if (!startedRef.current) {
          startedRef.current = true;
          runSteps(0);
        }
      }
    }
    checkExisting();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

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
            <h1 className="text-xl font-semibold text-gray-900 mb-1">
              Welcome, {user?.firstName || "there"}!
            </h1>
            <p className="text-sm text-zinc-400 mb-6">
              {allDone
                ? "Your agent is ready! Open Telegram to start chatting."
                : "Setting up your personal CRE AI agent..."}
            </p>

            {/* Timeline */}
            {!allDone && (
              <div className="mb-4">
                {ONBOARD_STEPS.map((s, i) => (
                  <StepRow
                    key={s.id}
                    status={steps[s.id]}
                    label={s.label}
                    doneLabel={s.doneLabel}
                    isLast={i === ONBOARD_STEPS.length - 1}
                  />
                ))}
              </div>
            )}

            {/* Error + Retry */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="mb-4"
                >
                  <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2 mb-3">
                    {error}
                  </p>
                  <button
                    onClick={handleRetry}
                    className="main-btn-shadow text-sm sm:text-base w-full"
                  >
                    Retry
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Success */}
            <AnimatePresence>
              {allDone && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="flex flex-col gap-3"
                >
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
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

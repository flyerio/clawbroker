"use client";

import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { getCalApi } from "@calcom/embed-react";

/* ─── Data ─── */

const COMPARISON_TRADITIONAL = [
  { task: "Purchasing local virtual machine", time: "15 min" },
  { task: "Creating SSH keys and storing securely", time: "10 min" },
  { task: "Connecting to the server via SSH", time: "5 min" },
  { task: "Installing Node.js and NPM", time: "5 min" },
  { task: "Installing OpenClaw", time: "7 min" },
  { task: "Setting up OpenClaw", time: "10 min" },
  { task: "Connecting to AI provider", time: "4 min" },
  { task: "Pairing with Telegram", time: "4 min" },
];

const MARQUEE_ROWS = [
  [
    "Analyze lease comps",
    "Screen tenant financials",
    "Draft LOIs",
    "Generate market reports",
    "Track competitor listings",
  ],
  [
    "Monitor rent trends",
    "Evaluate cap rates",
    "Summarize property inspections",
    "Compare investment returns",
    "Create offering memorandums",
  ],
  [
    "Research zoning regulations",
    "Analyze demographic data",
    "Draft purchase agreements",
    "Calculate NOI projections",
    "Screen cold outreach",
  ],
  [
    "Write property descriptions",
    "Assess environmental risks",
    "Build investor presentations",
    "Track lease expirations",
    "Generate rent rolls",
  ],
  [
    "Monitor construction permits",
    "Analyze traffic patterns",
    "Draft tenant communications",
    "Compare property taxes",
    "Forecast vacancy rates",
  ],
];

const PILL_STYLES = [
  "options-card border border-[#26251e]/10 text-[#26251e]/70",
  "table-left-gradient border border-[#26251e]/10 text-[#26251e]/70",
  "border-2 border-[#26251e]/10 bg-[#26251e]/[0.02] text-[#26251e]/70",
  "bg-[#26251e]/[0.04] border border-[#26251e]/10 text-[#26251e]/70",
  "bg-[#26251e]/[0.03] border border-[#26251e]/[0.06] text-[#26251e]/70",
  "border-2 border-dashed border-[#26251e]/10 text-[#26251e]/55",
  "bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(38,37,30,0.04),transparent)] border border-[#26251e]/10 text-[#26251e]/70",
];


/* ─── Lucide-style icon paths for marquee pills ─── */

const TASK_ICON_PATHS: Record<string, React.ReactNode> = {
  "Analyze lease comps": (
    <>
      <path d="M3 3v18h18" />
      <path d="M7 16V8" />
      <path d="M12 16V4" />
      <path d="M17 16v-6" />
    </>
  ),
  "Screen tenant financials": (
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </>
  ),
  "Draft LOIs": (
    <>
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
      <path d="M16 13H8" />
      <path d="M16 17H8" />
      <path d="M10 9H8" />
    </>
  ),
  "Generate market reports": (
    <>
      <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
      <path d="M18 14h-8" />
      <path d="M15 18h-5" />
      <path d="M10 6h8v4h-8V6Z" />
    </>
  ),
  "Track competitor listings": (
    <>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
      <path d="M11 8v6" />
      <path d="M8 11h6" />
    </>
  ),
  "Monitor rent trends": (
    <>
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </>
  ),
  "Evaluate cap rates": (
    <>
      <rect width="16" height="20" x="4" y="2" rx="2" />
      <line x1="8" x2="16" y1="6" y2="6" />
      <line x1="16" x2="16" y1="14" y2="18" />
      <path d="M16 10h.01" />
      <path d="M12 10h.01" />
      <path d="M8 10h.01" />
      <path d="M12 14h.01" />
      <path d="M8 14h.01" />
      <path d="M12 18h.01" />
      <path d="M8 18h.01" />
    </>
  ),
  "Summarize property inspections": (
    <>
      <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <path d="m9 14 2 2 4-4" />
    </>
  ),
  "Compare investment returns": (
    <>
      <line x1="12" x2="12" y1="20" y2="10" />
      <line x1="18" x2="18" y1="20" y2="4" />
      <line x1="6" x2="6" y1="20" y2="16" />
    </>
  ),
  "Create offering memorandums": (
    <>
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
      <path d="M10 9H8" />
      <path d="M16 13H8" />
      <path d="M16 17H8" />
    </>
  ),
  "Research zoning regulations": (
    <>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </>
  ),
  "Analyze demographic data": (
    <>
      <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
      <path d="M22 12A10 10 0 0 0 12 2v10z" />
    </>
  ),
  "Draft purchase agreements": (
    <>
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
      <path d="m15 5 4 4" />
    </>
  ),
  "Calculate NOI projections": (
    <>
      <line x1="12" x2="12" y1="1" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </>
  ),
  "Screen cold outreach": (
    <>
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </>
  ),
  "Write property descriptions": (
    <>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </>
  ),
  "Assess environmental risks": (
    <>
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </>
  ),
  "Build investor presentations": (
    <>
      <path d="M2 3h20" />
      <path d="M21 3v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V3" />
      <path d="m7 21 5-5 5 5" />
    </>
  ),
  "Track lease expirations": (
    <>
      <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
      <line x1="16" x2="16" y1="2" y2="6" />
      <line x1="8" x2="8" y1="2" y2="6" />
      <line x1="3" x2="21" y1="10" y2="10" />
    </>
  ),
  "Generate rent rolls": (
    <>
      <path d="M12 3v18" />
      <rect width="18" height="18" x="3" y="3" rx="2" />
      <path d="M3 9h18" />
      <path d="M3 15h18" />
    </>
  ),
  "Monitor construction permits": (
    <>
      <rect width="16" height="20" x="4" y="2" rx="2" ry="2" />
      <path d="M9 22v-4h6v4" />
      <path d="M8 6h.01" />
      <path d="M16 6h.01" />
      <path d="M12 6h.01" />
      <path d="M12 10h.01" />
      <path d="M12 14h.01" />
      <path d="M16 10h.01" />
      <path d="M16 14h.01" />
      <path d="M8 10h.01" />
      <path d="M8 14h.01" />
    </>
  ),
  "Analyze traffic patterns": (
    <>
      <circle cx="6" cy="19" r="3" />
      <path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15" />
      <circle cx="18" cy="5" r="3" />
    </>
  ),
  "Draft tenant communications": (
    <>
      <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
    </>
  ),
  "Compare property taxes": (
    <>
      <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" />
      <path d="M14 8H8" />
      <path d="M16 12H8" />
      <path d="M13 16H8" />
    </>
  ),
  "Forecast vacancy rates": (
    <>
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </>
  ),
};

/* ─── Mail SVG Icon ─── */

function MailIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7" />
      <path d="M3 7l9 6l9-6" />
    </svg>
  );
}


/* ─── Task Icon ─── */

function TaskIcon({ task }: { task: string }) {
  const paths = TASK_ICON_PATHS[task];
  if (!paths) return null;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-4 shrink-0 text-[#26251e]/55"
      aria-hidden="true"
    >
      {paths}
    </svg>
  );
}


/* ─── SVG Gradient Lines (responsive) ─── */

function GradientLineLeft() {
  return (
    <svg
      viewBox="0 0 272 2"
      preserveAspectRatio="none"
      className="shrink min-w-0 flex-1 h-0.5"
    >
      <defs>
        <linearGradient id="gl-left" x1="272.5" y1="1.5" x2="0.5" y2="1">
          <stop offset="0%" stopColor="rgba(38, 37, 30, 0.25)" />
          <stop offset="16.5%" stopColor="rgba(38, 37, 30, 0.15)" />
          <stop offset="100%" stopColor="rgba(38, 37, 30, 0.05)" />
        </linearGradient>
      </defs>
      <path d="M0 1 H272" stroke="url(#gl-left)" strokeWidth="2" fill="none" />
    </svg>
  );
}

function GradientLineRight() {
  return (
    <svg
      viewBox="0 0 272 2"
      preserveAspectRatio="none"
      className="shrink min-w-0 flex-1 h-0.5"
    >
      <defs>
        <linearGradient id="gl-right" x1="-0.5" y1="0.5" x2="271.5" y2="1">
          <stop offset="0%" stopColor="rgba(38, 37, 30, 0.25)" />
          <stop offset="16.5%" stopColor="rgba(38, 37, 30, 0.15)" />
          <stop offset="100%" stopColor="rgba(38, 37, 30, 0.05)" />
        </linearGradient>
      </defs>
      <path d="M0 1 H272" stroke="url(#gl-right)" strokeWidth="2" fill="none" />
    </svg>
  );
}

/* ─── Marquee Row ─── */

function MarqueeRow({
  items,
  rowIndex,
  reverse,
}: {
  items: string[];
  rowIndex: number;
  reverse?: boolean;
}) {
  const duration = `${40 + rowIndex * 5}s`;
  return (
    <div
      className="group flex overflow-hidden p-2 flex-row [--gap:0.5rem] sm:[--gap:0.75rem]"
      style={{ gap: "var(--gap)", ["--duration" as string]: duration }}
    >
      {[0, 1].map((copy) => (
        <div
          key={copy}
          className={`flex shrink-0 justify-around animate-marquee flex-row group-hover:[animation-play-state:paused] ${reverse ? "[animation-direction:reverse]" : ""}`}
          style={{ gap: "var(--gap)" }}
        >
          {items.map((item, i) => {
            const styleIdx = (rowIndex * items.length + i) % PILL_STYLES.length;
            return (
              <span
                key={`${copy}-${i}`}
                className={`${PILL_STYLES[styleIdx]} inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium shrink-0`}
              >
                <TaskIcon task={item} />
                {item}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
}

/* ─── Main Page ─── */

export default function Home() {
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    fetch("/api/status")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data && data.status !== "no_tenant") {
          router.replace("/dashboard");
        }
      })
      .catch(() => {});
  }, [isLoaded, isSignedIn, router]);

  useEffect(() => {
    (async () => {
      const cal = await getCalApi();
      cal("ui", {
        cssVarsPerTheme: {
          light: { "cal-brand": "#26251e" },
        },
        hideEventTypeDetails: false,
      });
    })();
  }, []);

  return (
    <div className="flex flex-row w-screen overflow-x-hidden h-full justify-center px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8 min-w-0">
      <div className="w-full flex flex-col gap-0 min-w-0">
        {/* ─── Header ─── */}
        <header className="w-full max-w-[1300px] mx-auto flex items-center justify-between gap-3 px-2 sm:px-0 py-2 sm:py-0 min-w-0">
          <span className="text-lg sm:text-xl font-normal text-[#26251e] truncate min-w-0">
            ClawBroker
          </span>
          <nav className="flex items-center shrink-0">
            <a
              href="mailto:isaac@cobroker.ai"
              className="flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base border-b-2 border-[#26251e]/15 text-[#26251e]/55 hover:text-[#26251e]/70 transition-colors duration-500 whitespace-nowrap"
            >
              <MailIcon className="size-4 sm:size-5 shrink-0" />
              Support
            </a>
          </nav>
        </header>

        {/* ─── Hero ─── */}
        <section className="w-full px-2 sm:px-4 md:px-6 pt-6 sm:pt-10 md:pt-16 pb-6 sm:pb-10 md:pb-12 flex flex-col items-center min-w-0">
          {/* Heading above card */}
          <div className="w-full max-w-[1300px] px-2 sm:px-0">
            <p className="font-mono text-xs sm:text-sm text-[#26251e]/45 mb-4">
              Powered by OpenClaw
            </p>
            <h1 className="text-[28px] sm:text-[32px] md:text-[36px] font-normal leading-[1.2] tracking-[-0.72px] text-[#26251e]/60 text-balance">
              Your CRE AI Employee That Does Things
            </h1>
            <div className="text-[28px] sm:text-[32px] md:text-[36px] font-normal leading-[1.2] tracking-[-0.72px] text-[#26251e] text-balance">
              So You Can Focus on Closing.
            </div>
            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <a
                href="/sign-up"
                className="main-btn-shadow inline-flex items-center justify-center px-6 py-2.5 text-sm font-medium transition-colors"
              >
                Start Free
              </a>
              <button
                onClick={async () => {
                  const cal = await getCalApi();
                  cal("modal", { calLink: "cobroker/website" });
                }}
                className="inline-flex items-center justify-center rounded-full border border-[#26251e]/20 px-6 py-2.5 text-sm font-medium text-[#26251e]/70 hover:bg-[#26251e]/[0.04] transition-colors"
              >
                Talk to a Human
              </button>
            </div>
          </div>

          {/* Gap between heading and card */}
          <div className="h-10 sm:h-14 md:h-[67px]" />

          <div className="hero-card">
            {/* Left Column */}
            <div className="hero-card-left">
              <p className="text-lg md:text-[22px] font-normal leading-[1.3] text-[#26251e]/60 text-pretty">
                Generates maps, analyzes demographics,
                remembers client profiles and search criteria, imports deal data
                from emails, and tracks market changes—all from your phone, 24/7.
              </p>
            </div>

            {/* Right Column */}
            <div className="hero-card-right">
              <div className="iphone-frame">
                <div className="iphone-screen">
                  <div className="iphone-notch" />
                  <div className="iphone-statusbar">
                    <span>9:41</span>
                    <svg width="68" height="12" viewBox="0 0 68 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="0" y="1" width="4" height="10" rx="1" fill="#1a1a1a" opacity="0.3"/>
                      <rect x="6" y="1" width="4" height="10" rx="1" fill="#1a1a1a" opacity="0.5"/>
                      <rect x="12" y="1" width="4" height="10" rx="1" fill="#1a1a1a" opacity="0.7"/>
                      <rect x="18" y="1" width="4" height="10" rx="1" fill="#1a1a1a"/>
                      <path d="M30 3a5 5 0 0 1 7 0" stroke="#1a1a1a" strokeWidth="1.2" fill="none" opacity="0.4"/>
                      <path d="M31.5 5a3 3 0 0 1 4 0" stroke="#1a1a1a" strokeWidth="1.2" fill="none" opacity="0.7"/>
                      <circle cx="33.5" cy="7.5" r="1" fill="#1a1a1a"/>
                      <rect x="42" y="2.5" width="20" height="7" rx="2" stroke="#1a1a1a" strokeWidth="1"/>
                      <rect x="43.5" y="4" width="15" height="4" rx="1" fill="#1a1a1a"/>
                      <rect x="62.5" y="4.5" width="1.5" height="3" rx="0.5" fill="#1a1a1a" opacity="0.4"/>
                    </svg>
                  </div>
                  <div className="phone-header">
                    <div className="phone-header-avatar">CB</div>
                    <div className="phone-header-info">
                      <span className="phone-header-name">ClawBroker Agent</span>
                      <span className="phone-header-status">
                        <span className="agent-status-dot" />
                        Online
                      </span>
                    </div>
                  </div>
                  <div className="phone-chat">
                    <div className="chat-bubble-user">Pull lease comps for 200 Park Ave, Class A offices, last 24 months</div>
                    <div className="chat-bubble-agent">Found <strong>14 comparable leases</strong> within 0.3 mi. Avg asking rent $78.50/SF. Generating comp report...</div>
                    <div className="chat-bubble-agent">
                      <span className="text-[#34c759]">&#10003;</span> Comp analysis complete<br/>
                      <span className="text-[#34c759]">&#10003;</span> Map generated<br/>
                      <span className="text-[#34c759]">&#10003;</span> PDF ready to share
                    </div>
                    <div className="chat-bubble-user">Draft an LOI for suite 4200 at $74/SF, 7-year term</div>
                    <div className="chat-bubble-agent">LOI drafted for <strong>Suite 4200</strong> — $74.00/SF, 7-yr term, 3% annual escalations. Ready for your review.</div>
                  </div>
                  <div className="phone-input-bar">
                    <div className="phone-input-field">Message ClawBroker...</div>
                    <div className="phone-send-btn">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 2 11 13"/>
                        <path d="M22 2 15 22 11 13 2 9 22 2z"/>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>


        {/* ─── Comparison Section ─── */}
        <section className="w-full px-4 sm:px-6 py-12 sm:py-20 md:py-32 flex flex-col gap-3 max-w-5xl mx-auto min-w-0">
          {/* Label */}
          <div className="comparison-label-bg w-full max-w-full flex flex-wrap items-center justify-center gap-2 sm:gap-4 min-h-[40px] sm:min-h-[46px] px-2">
            <GradientLineLeft />
            <span className="mx-1 sm:mx-4 shrink-0 text-xs sm:text-sm text-[#c4421a] font-medium tracking-[0.2px] leading-[160%]">
              Comparison
            </span>
            <GradientLineRight />
          </div>

          {/* Heading */}
          <h1 className="main-text mb-6 sm:mb-10 text-balance">
            Traditional Method vs ClawBroker
          </h1>

          {/* Comparison cards */}
          <div className="flex flex-col md:flex-row items-stretch min-w-0 mt-4 sm:mt-7 md:gap-0">
            {/* Traditional side */}
            <div className="flex-1 md:pr-10 min-w-0 flex flex-col gap-2 pb-6 md:pb-0">
              <p className="text-base sm:text-lg font-medium text-[#26251e]/55 italic mb-1">
                Traditional
              </p>
              <ul>
                {COMPARISON_TRADITIONAL.map((item, i) => (
                  <li
                    key={i}
                    className="flex justify-between gap-2 text-sm sm:text-base text-[#26251e]/55"
                  >
                    <span className="min-w-0">{item.task}</span>
                    <span className="shrink-0 tabular-nums">{item.time}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 pt-3 border-t-2 border-[#26251e]/15 flex justify-between text-base sm:text-lg font-medium text-[#26251e]">
                <span className="italic">Total</span>
                <span className="tabular-nums font-medium text-xl">
                  60 min
                </span>
              </p>
              <p className="mt-3 text-sm font-medium text-[#26251e]/70 text-pretty italic leading-relaxed">
                If you&apos;re{" "}
                <span className="bg-[#c4421a]/10 text-[#c4421a] px-1 py-0.5 rounded-md">
                  non-technical
                </span>
                , multiply these{" "}
                <span className="bg-[#c4421a]/10 text-[#c4421a] px-1 py-0.5 rounded-md">
                  times by 10
                </span>{" "}
                &mdash; you have to learn each step before doing.
              </p>
            </div>

            {/* Divider */}
            <div className="w-full md:w-[2px] h-[2px] md:h-auto md:min-h-px shrink-0 bg-[#26251e]/10" />

            {/* ClawBroker side */}
            <div className="flex-1 md:pl-10 min-w-0 flex flex-col justify-center pt-6 md:pt-0 gap-3 table-left-gradient">
              <p className="text-base sm:text-lg font-medium text-[#26251e]/55 italic">
                ClawBroker
              </p>
              <p className="text-2xl sm:text-4xl font-semibold text-[#26251e] tabular-nums">
                &lt;1 min
              </p>
              <p className="text-sm sm:text-base text-[#26251e]/55 text-pretty leading-relaxed">
                Pick a model, connect Telegram, deploy &mdash; done under 1
                minute.
              </p>
              <p className="text-sm sm:text-base text-[#26251e]/55 text-pretty leading-relaxed">
                Servers, SSH and OpenClaw Environment are already set up,
                waiting to get assigned. Simple, secure and fast connection to
                your bot.
              </p>
            </div>
          </div>
        </section>

        {/* ─── Use Cases Section ─── */}
        <section className="w-full px-4 sm:px-6 py-10 sm:py-16 flex flex-col gap-8 sm:gap-12 max-w-5xl mx-auto min-w-0">
          <div className="flex flex-col items-center justify-center gap-1 sm:gap-2">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-medium text-[#26251e] text-center text-balance">
              What can ClawBroker do for you?
            </h2>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-medium text-[#26251e]/55 text-center text-balance">
              One assistant, thousands of use cases
            </h2>
          </div>

          <div className="relative flex w-full flex-col items-center justify-center overflow-hidden rounded-xl gap-2 min-w-0">
            {MARQUEE_ROWS.map((row, i) => (
              <MarqueeRow
                key={i}
                items={row}
                rowIndex={i}
                reverse={i % 2 === 1}
              />
            ))}
            {/* Edge fades */}
            <div className="pointer-events-none absolute inset-y-0 left-0 w-8 sm:w-12 md:w-20 bg-gradient-to-r from-[#f7f7f4] to-transparent z-10" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-8 sm:w-12 md:w-20 bg-gradient-to-l from-[#f7f7f4] to-transparent z-10" />
          </div>

          <span className="text-sm sm:text-base text-[#26251e]/55 text-pretty text-center italic">
            P.S. — Your agent gets smarter with every conversation.
          </span>
        </section>

        {/* ─── Footer ─── */}
        <section className="w-full px-4 sm:px-6 pt-12 sm:pt-16 md:pt-24 pb-8 flex flex-col gap-6 sm:gap-12 max-w-5xl mx-auto items-center text-center min-w-0">
          <div className="flex flex-col gap-2">
            <h4 className="flex flex-wrap items-center justify-center gap-x-2 sm:gap-x-3 gap-y-2 text-sm sm:text-base">
              <span className="flex items-center gap-2">
                Built with{" "}
                <span className="text-[#c4421a]" aria-label="love">
                  &#9829;
                </span>{" "}
                by{" "}
                <a
                  href="https://cobroker.ai"
                  className="text-[#26251e] hover:text-[#26251e]/55 font-medium border-b-2 border-[#26251e]/15 transition-all duration-300"
                >
                  Cobroker.ai
                </a>
              </span>
              <span className="size-1 rounded-full bg-current opacity-60" />
              <a
                href="mailto:isaac@cobroker.ai"
                className="inline-flex items-center gap-1.5 text-[#26251e] hover:text-[#26251e]/55 transition-colors"
              >
                <MailIcon className="size-4 sm:size-5 shrink-0" />
                Support
              </a>
            </h4>
          </div>
        </section>
      </div>
    </div>
  );
}

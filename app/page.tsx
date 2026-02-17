"use client";

import { useEffect, useState, useCallback, useRef } from "react";
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


const EXAMPLE_TABS = [
  {
    title: "Search",
    description: "Find available properties for sale or lease using AI-powered web search.",
    items: ["Web Search", "Listings", "Availability", "Saved Searches"],
    gradient: "linear-gradient(135deg, #87CEEB 0%, #a8d8ea 25%, #b0e0e6 50%, #7ec8d8 75%, #6bbfcf 100%)",
    chat: [
      { role: "user" as const, text: "What's available in Uptown Dallas? Retail, 8-12K SF" },
      { role: "agent" as const, text: "Found <strong>7 spaces</strong>. Top match: 4500 McKinney Ave — <strong>10,200 SF, $32/SF NNN</strong>. Asking below market." },
      { role: "user" as const, text: "Any with corner visibility?" },
      { role: "agent" as const, text: "Two: <strong>4500 McKinney</strong> (corner lot, 180ft frontage) and <strong>3200 Cole Ave</strong> (9,400 SF, signage rights). Want me to save these?" },
    ],
  },
  {
    title: "Memory",
    description: "Remembers every client's criteria, preferences, and deal history across conversations.",
    items: ["Client Profiles", "Criteria", "Deal History", "Preferences"],
    gradient: "linear-gradient(135deg, #f7e8c1 0%, #e8c87a 25%, #d4a853 50%, #c8963f 75%, #b8862d 100%)",
    chat: [
      { role: "user" as const, text: "New client — Apex Retail Group. 10K SF retail, Uptown Dallas, $35/SF NNN cap." },
      { role: "agent" as const, text: "Saved. <strong>Apex Retail Group</strong>: 10,000 SF retail, Uptown Dallas, $35/SF NNN. I'll flag matches." },
      { role: "user" as const, text: "What was the budget for my client Rivera Holdings?" },
      { role: "agent" as const, text: "<strong>Rivera Holdings</strong>: 25K SF office, Downtown Austin, budget <strong>$42/SF gross</strong>. Last search was Jan 28." },
    ],
  },
  {
    title: "Extract",
    description: "Forward an email with property docs — agent extracts and organizes everything automatically.",
    items: ["PDF Parsing", "Data Extraction", "Auto-Organize", "Geocoding"],
    gradient: "linear-gradient(135deg, #b8e6c8 0%, #98d4a8 25%, #7cc892 50%, #6ab87e 75%, #5aad6e 100%)",
    chat: [
      { role: "user" as const, text: "Just forwarded you a 40-page offering memo from CBRE" },
      { role: "agent" as const, text: "Got it. Extracted <strong>12 properties</strong> from the PDF — addresses, SF, asking price, and cap rates. Ready to review." },
      { role: "user" as const, text: "Create a project with all of them" },
      { role: "agent" as const, text: "Done. Project <strong>\"CBRE Q1 Portfolio\"</strong> created with 12 properties. All geocoded and mapped." },
    ],
  },
  {
    title: "Demographics",
    description: "Pull population, income, housing, and employment data for any property location.",
    items: ["Population", "Income", "Housing", "Employment"],
    gradient: "linear-gradient(135deg, #d4c5f9 0%, #b8a9e8 25%, #c5b8f0 50%, #a89cd4 75%, #9b8ec7 100%)",
    chat: [
      { role: "user" as const, text: "Pull demographics for 200 Park Ave" },
      { role: "agent" as const, text: "Within 1 mile of 200 Park Ave: Population: <strong>48,200</strong> / Median HHI: <strong>$127K</strong> / 73% white-collar workforce" },
      { role: "user" as const, text: "Compare that to 500 5th Ave" },
      { role: "agent" as const, text: "500 5th Ave has <strong>62K population</strong> but lower HHI at <strong>$98K</strong>. Higher retail density — 340 stores vs 180. Want a chart?" },
    ],
  },
  {
    title: "Monitor",
    description: "Set market alerts once — get new listings and changes delivered on autopilot.",
    items: ["Daily Alerts", "New Listings", "Market Changes", "Autopilot"],
    gradient: "linear-gradient(135deg, #f5a8a0 0%, #e8928a 25%, #db7d75 50%, #cf6860 75%, #c4554d 100%)",
    chat: [
      { role: "user" as const, text: "Monitor new office listings in the Seaport District, over 5K SF" },
      { role: "agent" as const, text: "Monitor set. I'll check daily at <strong>7:30am</strong> and message you when something new hits." },
      { role: "user" as const, text: "Any updates?" },
      { role: "agent" as const, text: "New listing alert: <strong>1 Seaport Blvd, Suite 400</strong> — 8,200 SF office, $52/SF. Listed today by Cushman. Want details?" },
    ],
  },
  {
    title: "Charts",
    description: "Turn any data into professional bar, line, or doughnut charts instantly.",
    items: ["Bar Charts", "Line Charts", "Doughnut Charts", "Rent Trends"],
    gradient: "linear-gradient(135deg, #f0c4d4 0%, #e4a8be 25%, #d88da8 50%, #cc7292 75%, #c05a7e 100%)",
    chat: [
      { role: "user" as const, text: "Show me rent trends for Class A offices in Midtown, last 12 months" },
      { role: "agent" as const, text: "Avg asking rent rose from <strong>$74/SF to $81/SF</strong> — up <strong>9.5% YoY</strong>. Vacancy tightened from 14.2% to 11.8%." },
      { role: "user" as const, text: "Chart it" },
      { role: "agent" as const, text: "Here's the 12-month trend. Steepest climb was Q3 — jumped <strong>$3.20/SF</strong> in two months." },
    ],
  },
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

/* ─── Examples Section (inverted layout: phone LEFT, tabs RIGHT) ─── */

function ExamplesSection() {
  const [activeTab, setActiveTab] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startAutoplay = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setActiveTab((prev) => (prev + 1) % EXAMPLE_TABS.length);
    }, 10000);
  }, []);

  useEffect(() => {
    startAutoplay();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [startAutoplay]);

  const handleTabClick = (index: number) => {
    setActiveTab(index);
    startAutoplay();
  };

  const tab = EXAMPLE_TABS[activeTab];

  return (
    <section className="w-full px-2 sm:px-4 md:px-6 py-12 sm:py-20 md:py-28 flex flex-col items-center min-w-0">
      <div className="w-full max-w-[1300px] px-2 sm:px-0 mb-8 sm:mb-10">
        <p className="text-lg md:text-[22px] font-normal leading-[1.3] tracking-tight text-[#26251e] text-balance">
          See it in action
        </p>
        <p className="text-lg md:text-[22px] font-normal leading-[1.3] tracking-tight text-[#26251e]/60 mt-1 text-pretty">
          Research, analyze, and create — all from one chat.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-2 w-full max-w-[1300px]">
        {/* LEFT panel — phone mockup */}
        <div
          className="md:w-[67%] rounded-lg relative overflow-hidden min-h-[560px] md:min-h-[713px]"
          style={{
            background: tab.gradient,
            transition: "background 0.5s ease",
          }}
        >
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
                {tab.chat.map((msg, i) => (
                  <div
                    key={`${activeTab}-${i}`}
                    className={msg.role === "user" ? "chat-bubble-user" : "chat-bubble-agent"}
                    dangerouslySetInnerHTML={{ __html: msg.text }}
                  />
                ))}
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

        {/* RIGHT panel — tab list */}
        <div className="md:w-[33%] rounded-lg p-6 sm:p-8 flex flex-col justify-center bg-[#f2f1ed]">
          <div className="flex flex-col gap-1">
            {EXAMPLE_TABS.map((t, i) => {
              const isActive = i === activeTab;
              return (
                <button
                  key={t.title}
                  onClick={() => handleTabClick(i)}
                  className="text-left w-full transition-all duration-300"
                  style={{ cursor: "pointer" }}
                >
                  <div className="flex items-center gap-3 py-1.5">
                    <div className={`glow-dot-outer transition-opacity duration-300 ${isActive ? "opacity-100" : "opacity-0"}`}>
                      <div className="glow-dot-inner" />
                    </div>
                    <span
                      className="text-lg md:text-[22px] font-normal leading-[1.3] tracking-tight transition-colors duration-300"
                      style={{ color: isActive ? "#FF683D" : "#292929" }}
                    >
                      {t.title}
                    </span>
                  </div>
                  {isActive && (
                    <div className="pl-[24px] pb-3 flex flex-col gap-2 animate-[fadeIn_0.3s_ease]">
                      <p className="text-lg md:text-[22px] font-normal leading-[1.3] tracking-tight text-[#26251e]/60">
                        {t.description}
                      </p>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
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
              Your CRE AI Team That Does Things
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
              <p className="text-lg md:text-[22px] font-normal leading-[1.3] tracking-tight text-[#26251e] text-pretty">
                A Full Team In Your Pocket
              </p>
              <p className="text-lg md:text-[22px] font-normal leading-[1.3] tracking-tight text-[#26251e]/60 text-pretty">
                Generates maps, analyzes demographics,
                remembers client profiles and search criteria, imports deal data
                from emails, and tracks market changes—all from your phone, 24/7.
              </p>
            </div>

            {/* Right Column — static chat */}
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
                    <div className="chat-bubble-agent">&#10003; Comp analysis &nbsp; &#10003; Map &nbsp; &#10003; PDF</div>
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

          {/* Channel pills */}
          <div className="w-full max-w-[1300px] mt-10 flex flex-col items-center">
            <p className="text-sm text-[#26251e]/45 mb-3">Chat with your AI team via:</p>
            <div className="flex flex-wrap justify-center gap-3">
              {/* Telegram */}
              <span className="inline-flex items-center gap-2 rounded-full border border-[#26251e]/15 px-5 py-2 text-sm font-medium text-[#26251e]/80">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
                Telegram
              </span>
              {/* WhatsApp */}
              <span className="inline-flex items-center gap-2 rounded-full border border-[#26251e]/15 px-5 py-2 text-sm font-medium text-[#26251e]/80">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                WhatsApp
              </span>
              {/* Slack */}
              <span className="inline-flex items-center gap-2 rounded-full border border-[#26251e]/15 px-5 py-2 text-sm font-medium text-[#26251e]/80">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"/></svg>
                Slack
              </span>
            </div>
          </div>
        </section>

        {/* ─── The Problem Section ─── */}
        <section className="w-full px-4 sm:px-6 py-16 sm:py-24 md:py-32 flex flex-col items-center max-w-[1300px] mx-auto">
          <div className="w-full max-w-[1300px] mb-8 sm:mb-10">
            <p className="text-xs sm:text-sm font-semibold uppercase tracking-[0.15em] text-[#c4421a] mb-2">
              THE PROBLEM
            </p>
            <p className="text-lg md:text-[22px] font-normal leading-[1.3] tracking-tight text-[#26251e] text-balance">
              Your team is drowning in busywork instead of building
            </p>
            <p className="text-lg md:text-[22px] font-normal leading-[1.3] tracking-tight text-[#26251e]/60 mt-1 text-pretty">
              Context switching, scattered tools, and manual data entry are a second job. ClawBroker handles the busywork so your team can focus on what matters.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-[10px] w-full max-w-[1300px] mt-12 sm:mt-16">
            <div className="rounded p-3 sm:p-[15px] bg-[#f2f1ed] flex flex-col sm:aspect-[16/9]">
              <p className="text-[40px] sm:text-[52px] font-normal text-[#26251e] leading-[1.15] tracking-[-1.3px] grow">23 min</p>
              <p className="text-base font-normal text-[#26251e]/70 leading-normal tracking-[0.08px]">Lost refocusing after every interruption</p>
            </div>
            <div className="rounded p-3 sm:p-[15px] bg-[#f2f1ed] flex flex-col sm:aspect-[16/9]">
              <p className="text-[40px] sm:text-[52px] font-normal text-[#26251e] leading-[1.15] tracking-[-1.3px] grow">67%</p>
              <p className="text-base font-normal text-[#26251e]/70 leading-normal tracking-[0.08px]">Of company context lives undocumented</p>
            </div>
            <div className="rounded p-3 sm:p-[15px] bg-[#f2f1ed] flex flex-col sm:aspect-[16/9]">
              <p className="text-[40px] sm:text-[52px] font-normal text-[#26251e] leading-[1.15] tracking-[-1.3px] grow">6 hrs</p>
              <p className="text-base font-normal text-[#26251e]/70 leading-normal tracking-[0.08px]">Average before critical bugs get noticed</p>
            </div>
          </div>
        </section>

        {/* ─── Examples Section ─── */}
        <ExamplesSection />

        {/* ─── Comparison Section ─── */}
        <section className="w-full px-4 sm:px-6 py-16 sm:py-24 md:py-32 flex flex-col items-center max-w-[1300px] mx-auto">
          <div className="w-full max-w-[1300px] mb-8 sm:mb-10">
            <p className="text-xs sm:text-sm font-semibold uppercase tracking-[0.15em] text-[#c4421a] mb-2">
              COMPARISON
            </p>
            <p className="text-lg md:text-[22px] font-normal leading-[1.3] tracking-tight text-[#26251e] text-balance">
              Traditional Method vs ClawBroker
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-[10px] w-full max-w-[1300px]">
            {/* Traditional side */}
            <div className="rounded p-5 sm:p-8 bg-[#f2f1ed] flex flex-col gap-3">
              <p className="text-base font-normal text-[#26251e]/50 mb-2">
                Traditional
              </p>
              <ul className="flex flex-col gap-1">
                {COMPARISON_TRADITIONAL.map((item, i) => (
                  <li
                    key={i}
                    className="flex justify-between gap-2 text-sm text-[#26251e]/60"
                  >
                    <span className="min-w-0">{item.task}</span>
                    <span className="shrink-0 tabular-nums">{item.time}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-2 pt-3 border-t border-[#26251e]/10 flex justify-between items-baseline">
                <span className="text-base font-normal text-[#26251e]/50">Total</span>
                <span className="text-[40px] sm:text-[52px] font-normal text-[#26251e] leading-[1.15] tracking-[-1.3px] tabular-nums">
                  60 min
                </span>
              </div>
              <p className="text-sm text-[#26251e]/50 text-pretty leading-relaxed">
                If you&apos;re{" "}
                <span className="bg-[#c4421a]/10 text-[#c4421a] px-1 py-0.5 rounded">
                  non-technical
                </span>
                , multiply these{" "}
                <span className="bg-[#c4421a]/10 text-[#c4421a] px-1 py-0.5 rounded">
                  times by 10
                </span>{" "}
                &mdash; you have to learn each step before doing.
              </p>
            </div>

            {/* ClawBroker side */}
            <div className="rounded p-5 sm:p-8 bg-[#f2f1ed] flex flex-col gap-3">
              <p className="text-base font-normal text-[#26251e]/50 mb-2">
                ClawBroker
              </p>
              <p className="text-[40px] sm:text-[52px] font-normal text-[#26251e] leading-[1.15] tracking-[-1.3px] tabular-nums">
                &lt;1 min
              </p>
              <p className="text-sm text-[#26251e]/60 text-pretty leading-relaxed">
                Pick a model, connect Telegram, deploy &mdash; done under 1
                minute.
              </p>
              <p className="text-sm text-[#26251e]/60 text-pretty leading-relaxed">
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
              A Full Team In Your Pocket
            </h2>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-medium text-[#26251e]/55 text-center text-balance">
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

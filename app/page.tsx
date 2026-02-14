"use client";

import { useState, useEffect, useRef, useCallback } from "react";

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
  "options-card border border-white/10",
  "table-left-gradient border border-white/10",
  "border-2 border-white/20 bg-white/[0.02]",
  "bg-zinc-800/60 border border-zinc-600/40",
  "bg-zinc-900/80 border border-white/5",
  "border-2 border-dashed border-zinc-500/50",
  "bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(255,255,255,0.06),transparent)] border border-white/10",
];

const MODELS = [
  {
    id: "opus",
    label: "Claude Opus 4.5",
    img: "https://upload.wikimedia.org/wikipedia/commons/b/b0/Claude_AI_symbol.svg",
  },
  {
    id: "gpt",
    label: "GPT-5.2",
    img: "https://img.icons8.com/androidL/512/FFFFFF/chatgpt.png",
  },
  {
    id: "gemini",
    label: "Gemini 3 Flash",
    img: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Google_Gemini_icon_2025.svg/960px-Google_Gemini_icon_2025.svg.png",
  },
];

const CHANNELS = [
  {
    id: "telegram",
    label: "Telegram",
    active: true,
    img: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Telegram_logo.svg/960px-Telegram_logo.svg.png",
  },
  {
    id: "discord",
    label: "Discord",
    active: false,
    img: "https://scbwi-storage-prod.s3.amazonaws.com/images/discord-mark-blue_rA6tXJo.png",
  },
  {
    id: "whatsapp",
    label: "WhatsApp",
    active: false,
    img: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/WhatsApp.svg/960px-WhatsApp.svg.png",
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

/* ─── Checkmark SVG ─── */

function CheckIcon() {
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
      className="size-4 shrink-0 text-white"
    >
      <path d="M20 6 9 17l-5-5" />
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
      className="size-4 shrink-0 text-zinc-400"
      aria-hidden="true"
    >
      {paths}
    </svg>
  );
}

/* ─── Sparkle dots (edge regions with data-state toggling) ─── */

function generateEdgeDots() {
  const dots: { top: number; left: number; opacity: number; region: string }[] = [];

  // Top strip: h-[45px] across full width (~33 dots)
  for (let i = 0; i < 33; i++) {
    dots.push({
      top: Math.random() * 100,
      left: Math.random() * 100,
      opacity: 0.2 + Math.random() * 0.6,
      region: "top",
    });
  }
  // Right strip (~18 dots)
  for (let i = 0; i < 18; i++) {
    dots.push({
      top: Math.random() * 100,
      left: Math.random() * 100,
      opacity: 0.2 + Math.random() * 0.6,
      region: "right",
    });
  }
  // Bottom strip (~22 dots)
  for (let i = 0; i < 22; i++) {
    dots.push({
      top: Math.random() * 100,
      left: Math.random() * 100,
      opacity: 0.2 + Math.random() * 0.6,
      region: "bottom",
    });
  }
  // Left strip (~18 dots)
  for (let i = 0; i < 18; i++) {
    dots.push({
      top: Math.random() * 100,
      left: Math.random() * 100,
      opacity: 0.2 + Math.random() * 0.6,
      region: "left",
    });
  }
  return dots;
}

const SPARKLE_DOTS = generateEdgeDots();

function Sparkles() {
  const dotsRef = useRef<(HTMLDivElement | null)[]>([]);

  const twinkle = useCallback(() => {
    const count = 3 + Math.floor(Math.random() * 4);
    for (let i = 0; i < count; i++) {
      const idx = Math.floor(Math.random() * SPARKLE_DOTS.length);
      const el = dotsRef.current[idx];
      if (!el) continue;
      const states = ["off", "medium", "high"];
      el.dataset.state = states[Math.floor(Math.random() * states.length)];
    }
  }, []);

  useEffect(() => {
    const id = setInterval(twinkle, 300);
    return () => clearInterval(id);
  }, [twinkle]);

  const regionStyles: Record<string, string> = {
    top: "absolute top-0 right-0 left-0 h-[45px]",
    right: "absolute top-[82px] right-[50px] bottom-[82px] w-[86px]",
    bottom: "absolute right-0 bottom-0 left-0 h-[45px]",
    left: "absolute top-[82px] bottom-[82px] left-[50px] w-[86px]",
  };

  const grouped: Record<string, typeof SPARKLE_DOTS> = {};
  SPARKLE_DOTS.forEach((d, i) => {
    if (!grouped[d.region]) grouped[d.region] = [];
    grouped[d.region].push({ ...d, top: d.top, left: d.left, opacity: d.opacity, region: d.region });
  });

  let globalIdx = 0;
  return (
    <div className="absolute -top-[45px] -right-[135px] -bottom-[45px] -left-[135px] pointer-events-none select-none">
      {Object.entries(regionStyles).map(([region, cls]) => (
        <div key={region} className={cls}>
          {SPARKLE_DOTS.filter((d) => d.region === region).map((d) => {
            const idx = globalIdx++;
            return (
              <div
                key={idx}
                ref={(el) => { dotsRef.current[idx] = el; }}
                className="star-sparkle absolute bg-white rounded-full"
                data-index={idx}
                data-state="off"
                style={{
                  height: "1px",
                  width: "1px",
                  left: `${d.left}%`,
                  top: `${d.top}%`,
                  opacity: d.opacity,
                }}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}

/* ─── SVG Gradient Lines (responsive) ─── */

function GradientLineLeft() {
  return (
    <svg
      viewBox="0 0 272 2"
      preserveAspectRatio="none"
      className="shrink min-w-0 flex-1 max-w-[120px] sm:max-w-[180px] md:max-w-[272px] h-0.5"
    >
      <defs>
        <linearGradient id="gl-left" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#190E14" />
          <stop offset="50%" stopColor="#581D27" />
          <stop offset="100%" stopColor="#ECA5A7" />
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
      className="shrink min-w-0 flex-1 max-w-[120px] sm:max-w-[180px] md:max-w-[272px] h-0.5"
    >
      <defs>
        <linearGradient id="gl-right" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#ECA5A7" />
          <stop offset="50%" stopColor="#581D27" />
          <stop offset="100%" stopColor="#190E14" />
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
                className={`${PILL_STYLES[styleIdx]} inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-zinc-300 shrink-0`}
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
  const [selectedModel, setSelectedModel] = useState("opus");
  const [selectedChannel, setSelectedChannel] = useState("telegram");

  return (
    <div className="flex flex-row w-screen overflow-x-hidden h-full justify-center px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8 min-w-0">
      <div className="w-full max-w-5xl flex flex-col gap-0 min-w-0">
        {/* ─── Header ─── */}
        <header className="w-full flex items-center justify-between gap-3 px-2 sm:px-0 py-2 sm:py-0 min-w-0">
          <span className="text-base sm:text-lg font-medium text-white truncate min-w-0">
            ClawBroker<span className="text-zinc-400 italic">.ai</span>
          </span>
          <a
            href="mailto:isaac@cobroker.ai"
            className="flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base border-b-2 border-white/20 text-zinc-400 hover:text-zinc-500 transition-colors duration-500 whitespace-nowrap"
          >
            <MailIcon className="size-4 sm:size-5 shrink-0" />
            Contact Support
          </a>
        </header>

        {/* ─── Hero ─── */}
        <section className="w-full px-4 sm:px-6 md:px-8 pt-8 sm:pt-12 md:pt-24 pb-6 sm:pb-10 md:pb-12 flex flex-col gap-3 sm:gap-4 text-center min-w-0">
          <h1 className="main-text text-balance">
            Deploy your CRE AI agent in under 1 minute
          </h1>
          <p className="text-sm sm:text-base text-zinc-400 leading-relaxed text-pretty max-w-xl mx-auto">
            Skip the complexity. One-click deploy your own 24/7 commercial real
            estate intelligence assistant.
          </p>
        </section>

        {/* ─── Card with Glow ─── */}
        <div className="w-full flex justify-center">
          <div className="flex flex-col items-center md:w-[80%] w-full">
            <div className="relative select-none">
              {/* Blur glow overlay */}
              <div className="absolute -top-[60px] -right-[70px] -bottom-[60px] -left-[70px] blur-[20px] pointer-events-none">
                <div
                  className="absolute inset-0 -z-10"
                  style={{
                    clipPath:
                      "polygon(0 0, 50% 14%, 100% 0, 92% 50%, 100% 100%, 50% 86%, 0 100%, 8% 50%)",
                    background:
                      "radial-gradient(40% 147% at 50% 46.2%, rgba(255,117,117,0.1) 5%, rgba(154,170,255,0.05) 60%, rgba(255,194,194,0) 140%)",
                  }}
                />
              </div>

              {/* Sparkles */}
              <Sparkles />

              {/* Card */}
              <div className="card-frame relative p-2 border border-white/8 transform-[translateZ(0)] rounded-[24px] w-full">
                <div className="w-full min-w-[280px] min-h-[200px] overflow-hidden bg-[#07080A] border border-white/5 rounded-2xl">
                  <div className="w-full p-4 sm:p-6 md:p-8 flex flex-col gap-6 sm:gap-8 md:gap-10 min-w-0">
                    {/* Model selection */}
                    <div className="flex flex-col gap-3 sm:gap-4">
                      <h1 className="font-medium text-base sm:text-lg text-balance">
                        Choose your AI model
                      </h1>
                      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                        {MODELS.map((model) => {
                          const selected = selectedModel === model.id;
                          return (
                            <button
                              key={model.id}
                              onClick={() => setSelectedModel(model.id)}
                              className={`options-card transition-all duration-300 rounded-xl py-3 px-4 flex flex-row items-center gap-2 hover:cursor-pointer group ${selected ? "selected" : ""}`}
                            >
                              <img
                                src={model.img}
                                alt={model.label}
                                className="w-5 h-5 shrink-0"
                              />
                              <h2
                                className={`font-medium text-sm min-w-0 flex-1 text-left ${selected ? "text-white" : "text-zinc-400 group-hover:text-white"}`}
                              >
                                {model.label}
                              </h2>
                              {selected && (
                                <span className="shrink-0 ml-auto flex items-center">
                                  <CheckIcon />
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Channel selection */}
                    <div className="flex flex-col gap-3 sm:gap-4">
                      <h1 className="font-medium text-base sm:text-lg text-balance">
                        Select your channel
                      </h1>
                      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                        {CHANNELS.map((ch) => {
                          const selected = selectedChannel === ch.id;
                          return (
                            <button
                              key={ch.id}
                              onClick={() =>
                                ch.active && setSelectedChannel(ch.id)
                              }
                              disabled={!ch.active}
                              className={`options-card transition-all duration-300 rounded-xl py-3 px-4 flex flex-row items-center gap-2 hover:cursor-pointer group relative px-4 sm:px-7 ${selected ? "selected" : ""} ${!ch.active ? "opacity-50 cursor-not-allowed" : ""}`}
                            >
                              <img
                                src={ch.img}
                                alt={ch.label}
                                className="w-5 h-5 shrink-0"
                              />
                              <h2
                                className={`font-medium text-sm min-w-0 flex-1 text-left ${selected ? "text-white" : "text-zinc-400 group-hover:text-white"}`}
                              >
                                {ch.label}
                              </h2>
                              {!ch.active && (
                                <span className="absolute bottom-0 right-0 text-[10px] text-zinc-400 group-hover:text-white">
                                  Coming soon
                                </span>
                              )}
                              {selected && (
                                <span className="shrink-0 ml-auto flex items-center">
                                  <CheckIcon />
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Waitlist CTA */}
                    <div className="flex flex-col items-center gap-4">
                      <div className="flex w-full gap-2">
                        <input
                          type="email"
                          placeholder="Enter your email"
                          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-white/20 transition-colors"
                        />
                        <button className="main-btn-shadow text-sm sm:text-base whitespace-nowrap">
                          Join Waitlist
                        </button>
                      </div>
                      <h3 className="text-[#6A6B6C] font-medium text-sm">
                        Be first to access{" "}
                        <span className="text-indigo-400">ClawBroker</span> when
                        we launch.
                      </h3>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Comparison Section ─── */}
        <section className="w-full px-4 sm:px-6 py-12 sm:py-20 md:py-32 flex flex-col gap-3 max-w-5xl mx-auto min-w-0">
          {/* Label */}
          <div className="w-full max-w-full flex flex-wrap items-center justify-center gap-2 sm:gap-4 min-h-[40px] sm:min-h-[46px] px-2">
            <GradientLineLeft />
            <span className="mx-1 sm:mx-4 shrink-0 text-xs sm:text-sm text-[#FF6363] font-medium">
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
              <p className="text-base sm:text-lg font-medium text-zinc-400 italic mb-1">
                Traditional
              </p>
              <ul>
                {COMPARISON_TRADITIONAL.map((item, i) => (
                  <li
                    key={i}
                    className="flex justify-between gap-2 text-sm sm:text-base text-zinc-400"
                  >
                    <span className="min-w-0">{item.task}</span>
                    <span className="shrink-0 tabular-nums">{item.time}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 pt-3 border-t-2 border-white/20 flex justify-between text-base sm:text-lg font-medium text-white">
                <span className="italic">Total</span>
                <span className="tabular-nums font-medium text-xl">
                  60 min
                </span>
              </p>
              <p className="mt-3 text-sm font-medium text-zinc-300 text-pretty italic leading-relaxed">
                If you&apos;re{" "}
                <span className="bg-red-500/10 text-red-500 px-1 py-0.5 rounded-md">
                  non-technical
                </span>
                , multiply these{" "}
                <span className="bg-red-500/10 text-red-500 px-1 py-0.5 rounded-md">
                  times by 10
                </span>{" "}
                &mdash; you have to learn each step before doing.
              </p>
            </div>

            {/* Divider */}
            <div className="w-full md:w-[2px] h-[2px] md:h-auto md:min-h-px shrink-0 bg-white/10" />

            {/* ClawBroker side */}
            <div className="flex-1 md:pl-10 min-w-0 flex flex-col justify-center pt-6 md:pt-0 gap-3 table-left-gradient">
              <p className="text-base sm:text-lg font-medium text-zinc-400 italic">
                ClawBroker
              </p>
              <p className="text-2xl sm:text-4xl font-semibold text-white tabular-nums">
                &lt;1 min
              </p>
              <p className="text-sm sm:text-base text-zinc-400 text-pretty leading-relaxed">
                Pick a model, connect Telegram, deploy &mdash; done under 1
                minute.
              </p>
              <p className="text-sm sm:text-base text-zinc-400 text-pretty leading-relaxed">
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
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-medium text-white text-center text-balance">
              What can ClawBroker do for you?
            </h2>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-medium text-[#6A6B6C] text-center text-balance">
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
          </div>

          <span className="text-sm sm:text-base text-zinc-400 text-pretty text-center italic">
            P.S. — Your agent gets smarter with every conversation.
          </span>
        </section>

        {/* ─── Footer ─── */}
        <section className="w-full px-4 sm:px-6 pt-12 sm:pt-16 md:pt-24 pb-8 flex flex-col gap-6 sm:gap-12 max-w-5xl mx-auto items-center text-center min-w-0">
          <h4 className="flex flex-wrap items-center justify-center gap-x-2 sm:gap-x-3 gap-y-2 text-sm sm:text-base">
            Built with{" "}
            <span className="text-red-500" aria-label="love">
              &#9829;
            </span>{" "}
            from{" "}
            <a
              href="https://cobroker.ai"
              className="text-white hover:text-zinc-400 font-medium border-b-2 border-white/20 transition-all duration-300"
            >
              Cobroker.ai
            </a>
            <span className="size-1 rounded-full bg-current opacity-60" />
            <a
              href="mailto:isaac@cobroker.ai"
              className="inline-flex items-center gap-1.5 text-white hover:text-zinc-400 transition-colors"
            >
              <MailIcon className="size-4 sm:size-5 shrink-0" />
              Contact Support
            </a>
          </h4>
        </section>
      </div>
    </div>
  );
}

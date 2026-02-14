"use client";

import { useState } from "react";

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

/* ─── Sparkle dots ─── */

function Sparkles() {
  const dots = [
    { top: 12, left: 8, delay: 0.2 }, { top: 5, left: 35, delay: 1.8 },
    { top: 22, left: 62, delay: 0.7 }, { top: 8, left: 88, delay: 2.4 },
    { top: 45, left: 3, delay: 1.1 }, { top: 38, left: 95, delay: 0.5 },
    { top: 55, left: 15, delay: 2.0 }, { top: 62, left: 78, delay: 1.4 },
    { top: 75, left: 5, delay: 0.9 }, { top: 70, left: 42, delay: 2.6 },
    { top: 82, left: 68, delay: 0.3 }, { top: 88, left: 92, delay: 1.7 },
    { top: 92, left: 25, delay: 2.2 }, { top: 95, left: 55, delay: 0.6 },
    { top: 30, left: 50, delay: 1.3 }, { top: 50, left: 30, delay: 2.8 },
  ].map((d, i) => ({
    id: i,
    top: `${d.top}%`,
    left: `${d.left}%`,
    delay: `${d.delay}s`,
  }));

  return (
    <div className="absolute -top-[45px] -right-[135px] -bottom-[45px] -left-[135px] pointer-events-none">
      {dots.map((d) => (
        <div
          key={d.id}
          className="star-sparkle"
          style={{
            top: d.top,
            left: d.left,
            animationDelay: d.delay,
          }}
        />
      ))}
    </div>
  );
}

/* ─── SVG Gradient Lines ─── */

function GradientLineLeft() {
  return (
    <svg width="120" height="2" className="flex-shrink-0">
      <defs>
        <linearGradient id="gl-left" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#190E14" />
          <stop offset="50%" stopColor="#581D27" />
          <stop offset="100%" stopColor="#ECA5A7" />
        </linearGradient>
      </defs>
      <rect width="120" height="2" fill="url(#gl-left)" rx="1" />
    </svg>
  );
}

function GradientLineRight() {
  return (
    <svg width="120" height="2" className="flex-shrink-0">
      <defs>
        <linearGradient id="gl-right" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#ECA5A7" />
          <stop offset="50%" stopColor="#581D27" />
          <stop offset="100%" stopColor="#190E14" />
        </linearGradient>
      </defs>
      <rect width="120" height="2" fill="url(#gl-right)" rx="1" />
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
  return (
    <div className="flex overflow-hidden group">
      {[0, 1].map((copy) => (
        <div
          key={copy}
          className="flex shrink-0 gap-3"
          style={{
            animation: `marquee ${40 + rowIndex * 5}s linear infinite${reverse ? " reverse" : ""}`,
            paddingRight: "0.75rem",
            ["--gap" as string]: "0.75rem",
          }}
        >
          {items.map((item, i) => {
            const styleIdx = (rowIndex * items.length + i) % PILL_STYLES.length;
            return (
              <div
                key={`${copy}-${i}`}
                className={`${PILL_STYLES[styleIdx]} rounded-xl px-4 py-2.5 text-sm font-medium text-zinc-300 whitespace-nowrap`}
              >
                {item}
              </div>
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
    <div className="flex flex-row w-screen overflow-x-hidden h-full justify-center px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
      <div className="w-full max-w-4xl flex flex-col items-center">
        {/* ─── Header ─── */}
        <header className="w-full flex items-center justify-between py-4 mb-8">
          <div className="text-lg font-medium">
            ClawBroker<span className="text-zinc-400 italic">.ai</span>
          </div>
          <a
            href="mailto:isaac@cobroker.ai"
            className="text-sm text-zinc-400 hover:text-white transition-colors border-b-2 border-white/20"
          >
            Contact Support
          </a>
        </header>

        {/* ─── Hero ─── */}
        <section className="flex flex-col items-center text-center mb-12 sm:mb-16">
          <h1 className="main-text max-w-3xl">
            Deploy your CRE AI agent in under 1 minute
          </h1>
          <p className="mt-4 text-base text-zinc-400 leading-relaxed max-w-xl">
            Skip the complexity. One-click deploy your own 24/7 commercial real
            estate intelligence assistant.
          </p>
        </section>

        {/* ─── Card with Glow ─── */}
        <div className="relative w-full flex justify-center mb-20 sm:mb-28">
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
          <div className="card-frame w-full max-w-2xl relative z-10">
            <div className="bg-[#07080A] border border-white/5 rounded-2xl overflow-hidden p-6 sm:p-8">
              {/* Model selection */}
              <div className="mb-6">
                <p className="text-base font-medium text-white mb-3">
                  Choose your AI model
                </p>
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  {[
                    { id: "opus", label: "Claude Opus 4.5" },
                    { id: "gpt", label: "GPT-5.2" },
                    { id: "gemini", label: "Gemini 3 Flash" },
                  ].map((model) => (
                    <button
                      key={model.id}
                      onClick={() => setSelectedModel(model.id)}
                      className={`options-card text-sm font-medium transition-all ${
                        selectedModel === model.id
                          ? "selected text-white"
                          : "text-zinc-400"
                      }`}
                    >
                      {model.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Channel selection */}
              <div className="mb-8">
                <p className="text-base font-medium text-white mb-3">
                  Select your channel
                </p>
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  {[
                    { id: "telegram", label: "Telegram", active: true },
                    { id: "discord", label: "Discord", active: false },
                    { id: "whatsapp", label: "WhatsApp", active: false },
                  ].map((ch) => (
                    <button
                      key={ch.id}
                      onClick={() => ch.active && setSelectedChannel(ch.id)}
                      className={`options-card text-sm font-medium transition-all relative ${
                        selectedChannel === ch.id
                          ? "selected text-white"
                          : "text-zinc-400"
                      } ${!ch.active ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      {ch.label}
                      {!ch.active && (
                        <span className="block text-[10px] text-zinc-500 mt-0.5">
                          coming soon
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-white/10 my-6" />

              {/* Waitlist CTA */}
              <div className="flex flex-col items-center gap-4">
                <div className="flex w-full max-w-md gap-2">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-white/20 transition-colors"
                  />
                  <button className="main-btn-shadow text-sm whitespace-nowrap">
                    Join Waitlist
                  </button>
                </div>
                <p className="text-sm text-indigo-400">
                  Be first to access ClawBroker when we launch.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Comparison Section ─── */}
        <section className="w-full mb-20 sm:mb-28">
          {/* Label */}
          <div className="flex items-center justify-center gap-4 mb-6 comparison-label-bg py-2 rounded-full">
            <GradientLineLeft />
            <span className="text-sm font-medium text-[#FF6363] whitespace-nowrap">
              Comparison
            </span>
            <GradientLineRight />
          </div>

          {/* Heading */}
          <h2 className="main-text max-w-3xl mx-auto mb-10">
            Traditional Method vs ClawBroker
          </h2>

          {/* Comparison cards */}
          <div className="flex flex-col md:flex-row gap-0">
            {/* Traditional side */}
            <div className="flex-1 p-6 sm:p-8">
              <h3 className="text-lg font-medium text-white mb-4">
                Traditional Method
              </h3>
              <div className="space-y-3">
                {COMPARISON_TRADITIONAL.map((item, i) => (
                  <div
                    key={i}
                    className="flex justify-between text-sm text-zinc-400"
                  >
                    <span>{item.task}</span>
                    <span className="text-zinc-500 ml-4 shrink-0">
                      {item.time}
                    </span>
                  </div>
                ))}
              </div>
              <div className="border-t-2 border-white/20 mt-4 pt-4 flex justify-between text-sm font-medium text-white">
                <span>Total</span>
                <span>60 min</span>
              </div>
              <p className="mt-4 text-sm italic text-zinc-300">
                If you&apos;re non-technical, multiply these times by{" "}
                <span className="bg-red-500/10 text-red-500 px-1 py-0.5 rounded-md">
                  10
                </span>
                {" "}&mdash; you have to learn each step before doing.
              </p>
            </div>

            {/* Divider */}
            <div className="hidden md:block w-[2px] bg-white/10 self-stretch" />
            <div className="block md:hidden h-[2px] bg-white/10 mx-6" />

            {/* ClawBroker side */}
            <div className="flex-1 p-6 sm:p-8 table-left-gradient rounded-r-xl">
              <h3 className="text-lg font-medium text-white mb-4">
                ClawBroker
              </h3>
              <p className="text-4xl font-semibold text-white mb-4">&lt;1 min</p>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Pick a model, connect Telegram, deploy &mdash; done under 1
                minute. Servers, SSH and OpenClaw Environment are already set
                up, waiting to get assigned. Simple, secure and fast connection
                to your bot.
              </p>
            </div>
          </div>
        </section>

        {/* ─── Use Cases Section ─── */}
        <section className="w-full mb-20 sm:mb-28">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-4xl font-medium text-white">
              What can ClawBroker do for you?
            </h2>
            <h2 className="text-2xl sm:text-4xl font-medium text-[#6A6B6C] mt-1">
              One assistant, thousands of use cases
            </h2>
          </div>

          <div className="relative overflow-hidden rounded-xl py-4">
            {/* Left fade */}
            <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-[#07080a] to-transparent z-10 pointer-events-none" />
            {/* Right fade */}
            <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-[#07080a] to-transparent z-10 pointer-events-none" />

            <div className="flex flex-col gap-3">
              {MARQUEE_ROWS.map((row, i) => (
                <MarqueeRow
                  key={i}
                  items={row}
                  rowIndex={i}
                  reverse={i % 2 === 1}
                />
              ))}
            </div>
          </div>

          <p className="text-center mt-8 text-sm italic text-zinc-400">
            P.S. — Your agent gets smarter with every conversation.
          </p>
        </section>

        {/* ─── Footer ─── */}
        <footer className="w-full text-center pt-24 pb-8">
          <p className="text-base text-white">
            Built with{" "}
            <span className="text-red-500" aria-label="love">
              &#9829;
            </span>{" "}
            by{" "}
            <a
              href="mailto:isaac@cobroker.ai"
              className="border-b-2 border-white/20 hover:border-white/40 transition-colors"
            >
              Isaac Herrera
            </a>
            <span className="mx-3 text-zinc-600">&#183;</span>
            <a
              href="mailto:isaac@cobroker.ai"
              className="border-b-2 border-white/20 hover:border-white/40 transition-colors"
            >
              Contact Support
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
}

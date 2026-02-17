"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { getCalApi } from "@calcom/embed-react";
import { MessageSquare, Handshake, Gauge, Link as LinkIcon, Table, Tag, Menu, X } from "lucide-react";
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "framer-motion";
import Image from "next/image";

/* ─── Data ─── */

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


const DEMO_DONUT_SVG = `<svg viewBox="0 0 210 140" xmlns="http://www.w3.org/2000/svg" style="background:#fff;font-family:system-ui,sans-serif"><text x="105" y="12" text-anchor="middle" font-size="7" font-weight="600" fill="#444">Household Income — 390 Park Ave (1 mi)</text><circle cx="62" cy="78" r="32" fill="none" stroke="#74809c" stroke-width="15" stroke-dasharray="50.27 150.80" stroke-dashoffset="0" transform="rotate(-90 62 78)"/><circle cx="62" cy="78" r="32" fill="none" stroke="#888caa" stroke-width="15" stroke-dasharray="44.23 156.83" stroke-dashoffset="-50.27" transform="rotate(-90 62 78)"/><circle cx="62" cy="78" r="32" fill="none" stroke="#9e9ab8" stroke-width="15" stroke-dasharray="40.21 160.85" stroke-dashoffset="-94.50" transform="rotate(-90 62 78)"/><circle cx="62" cy="78" r="32" fill="none" stroke="#b4aec6" stroke-width="15" stroke-dasharray="36.19 164.87" stroke-dashoffset="-134.71" transform="rotate(-90 62 78)"/><circle cx="62" cy="78" r="32" fill="none" stroke="#c8c2d4" stroke-width="15" stroke-dasharray="30.16 170.90" stroke-dashoffset="-170.90" transform="rotate(-90 62 78)"/><circle cx="62" cy="78" r="18" fill="#fff"/><text x="62" y="81" text-anchor="middle" font-size="8" font-weight="700" fill="#444">$133K</text><rect x="120" y="38" width="8" height="8" rx="1" fill="#74809c"/><text x="132" y="45" font-size="6" fill="#555">$250K+ 25%</text><rect x="120" y="52" width="8" height="8" rx="1" fill="#888caa"/><text x="132" y="59" font-size="6" fill="#555">$150–250K 22%</text><rect x="120" y="66" width="8" height="8" rx="1" fill="#9e9ab8"/><text x="132" y="73" font-size="6" fill="#555">$100–150K 20%</text><rect x="120" y="80" width="8" height="8" rx="1" fill="#b4aec6"/><text x="132" y="87" font-size="6" fill="#555">$50–100K 18%</text><rect x="120" y="94" width="8" height="8" rx="1" fill="#c8c2d4"/><text x="132" y="101" font-size="6" fill="#555">Under $50K 15%</text></svg>`;

const AUSTIN_CHART_SVG = `<svg viewBox="0 0 210 140" xmlns="http://www.w3.org/2000/svg" style="background:#fff;font-family:system-ui,sans-serif"><text x="105" y="10" text-anchor="middle" font-size="7" font-weight="600" fill="#444">Avg Asking Rate ($/SF/yr)</text><line x1="24" y1="18" x2="200" y2="18" stroke="#eee" stroke-width=".5"/><line x1="24" y1="68" x2="200" y2="68" stroke="#eee" stroke-width=".5"/><line x1="24" y1="118" x2="200" y2="118" stroke="#ccc" stroke-width=".5"/><text x="21" y="21" text-anchor="end" font-size="5.5" fill="#999">$60</text><text x="21" y="71" text-anchor="end" font-size="5.5" fill="#999">$30</text><text x="21" y="121" text-anchor="end" font-size="5.5" fill="#999">$0</text><rect x="30" y="26" width="18" height="92" rx="2" fill="#5a7042"/><rect x="58" y="38" width="18" height="80" rx="2" fill="#6a8052"/><rect x="86" y="48" width="18" height="70" rx="2" fill="#7a9062"/><rect x="114" y="55" width="18" height="63" rx="2" fill="#8aa072"/><rect x="142" y="60" width="18" height="58" rx="2" fill="#9ab082"/><rect x="170" y="71" width="18" height="47" rx="2" fill="#bcc8a8"/><text x="39" y="23" text-anchor="middle" font-size="5.5" font-weight="600" fill="#555">$55</text><text x="67" y="35" text-anchor="middle" font-size="5.5" font-weight="600" fill="#555">$48</text><text x="95" y="45" text-anchor="middle" font-size="5.5" font-weight="600" fill="#555">$42</text><text x="123" y="52" text-anchor="middle" font-size="5.5" font-weight="600" fill="#555">$38</text><text x="151" y="57" text-anchor="middle" font-size="5.5" font-weight="600" fill="#555">$35</text><text x="179" y="68" text-anchor="middle" font-size="5.5" font-weight="600" fill="#555">$28</text><text x="39" y="128" text-anchor="middle" font-size="5" fill="#666">2nd St</text><text x="67" y="128" text-anchor="middle" font-size="5" fill="#666">SoCo</text><text x="95" y="128" text-anchor="middle" font-size="5" fill="#666">Domain</text><text x="123" y="128" text-anchor="middle" font-size="5" fill="#666">Triangle</text><text x="151" y="128" text-anchor="middle" font-size="5" fill="#666">Mueller</text><text x="179" y="128" text-anchor="middle" font-size="5" fill="#666">Arbrtm</text></svg>`;

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
    gradient: "linear-gradient(135deg, #c8c2d4 0%, #b4aec6 25%, #9e9ab8 50%, #888caa 75%, #74809c 100%)",
    chat: [
      { role: "user" as const, text: "Compare demographics: 390 Park Ave vs 1 World Trade Center" },
      { role: "agent" as const, text: "<strong>390 Park</strong>: 128K pop, $133K HHI<br/><strong>1 WTC</strong>: 61K pop, $158K HHI — half the density but higher income. Show breakdown?" },
      { role: "user" as const, text: "Yes, income for 390 Park" },
      { role: "agent" as const, text: `Income distribution — 390 Park Ave:${DEMO_DONUT_SVG}` },
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
    gradient: "linear-gradient(135deg, #bcc8a8 0%, #a0b088 25%, #889a70 50%, #708458 75%, #5a7042 100%)",
    chat: [
      { role: "user" as const, text: "Compare asking rates for retail spaces across Austin" },
      { role: "agent" as const, text: `2nd Street leads at <strong>$55/SF</strong>, nearly double The Arboretum. Here's the breakdown:${AUSTIN_CHART_SVG}` },
      { role: "user" as const, text: "Why is 2nd Street so much higher?" },
      { role: "agent" as const, text: "2nd Street District commands a <strong>96% premium</strong> over The Arboretum — driven by walkability, lake proximity, and high-income foot traffic." },
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
    <section id="skills" className="w-full px-2 sm:px-4 md:px-6 py-12 sm:py-20 md:py-28 flex flex-col items-center min-w-0 scroll-mt-20">
      <div className="w-full max-w-[1300px] px-2 sm:px-0 mb-8 sm:mb-10">
        <p className="text-xs font-bold font-mono uppercase tracking-widest text-[#f54e00] mb-2">
          SKILLS
        </p>
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
              <div className="phone-header">
                <div className="phone-header-avatar">CB</div>
                <div className="phone-header-info">
                  <span className="phone-header-name">ClawBroker</span>
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

/* ─── Property Data Section ─── */

const PROPERTY_TABS = [
  { label: "Score", icon: <Gauge className="w-4 h-4" />, src: "/enrichment-table.png", alt: "ClawBroker enrichment table showing confidence scores" },
  { label: "Citations", icon: <LinkIcon className="w-4 h-4" />, src: "/citations.png", alt: "ClawBroker citations view showing data sources" },
];

function PropertyDataSection() {
  const [currentTab, setCurrentTab] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startInterval = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setCurrentTab((prev) => (prev + 1) % PROPERTY_TABS.length);
    }, 10000);
  }, []);

  useEffect(() => {
    startInterval();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [startInterval]);

  const handleTabClick = (index: number) => {
    setCurrentTab(index);
    startInterval();
  };

  return (
    <section id="research" className="w-full px-4 sm:px-6 py-16 sm:py-24 md:py-32 flex flex-col items-center max-w-[1300px] mx-auto scroll-mt-20">
      <div className="border border-[#26251e]/10 rounded-xl overflow-hidden bg-[#f2f1ed] w-full">
        <div className="grid grid-cols-1 lg:grid-cols-5 min-h-[400px] lg:min-h-[650px]">
          {/* Left - Text content (2/5) */}
          <div className="lg:col-span-2 flex flex-col justify-center p-8 lg:p-10 xl:p-12 order-2 lg:order-1">
            <div>
              <p className="text-xs font-bold font-mono uppercase tracking-widest text-[#f54e00] mb-2">
                RESEARCH
              </p>
              <p className="text-lg md:text-[22px] font-normal leading-[1.3] tracking-tight text-[#26251e] mb-3">
                Property data<br />you can trust
              </p>
              <p className="text-sm md:text-base text-[#26251e]/60 leading-relaxed">
                Ask any question about a property. CLAWBROKER searches the web and returns answers with a confidence score—backed by citations you can verify.
              </p>

              {/* Tabs */}
              <div className="mt-8">
                <div className="inline-flex bg-white rounded-full p-1 gap-1">
                  {PROPERTY_TABS.map((tab, index) => (
                    <button
                      key={tab.label}
                      onClick={() => handleTabClick(index)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                        currentTab === index
                          ? "bg-[#26251e] text-white"
                          : "text-[#26251e]/50 hover:text-[#26251e]/70"
                      }`}
                    >
                      {tab.icon}
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right - Media (3/5) */}
          <div className="lg:col-span-3 relative h-[350px] lg:h-auto order-1 lg:order-2 overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative w-[90%] h-[90%] rounded-xl overflow-hidden border border-[#26251e]/10">
                {PROPERTY_TABS.map((tab, index) => (
                  <Image
                    key={tab.src}
                    src={tab.src}
                    alt={tab.alt}
                    fill
                    className={`object-cover object-top transition-opacity duration-700 ${
                      currentTab === index ? "opacity-100" : "opacity-0"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Client Experience Section ─── */

const CLIENT_TABS = [
  { value: "tab1", label: "Survey", icon: <Table size={14} />, src: "/01_cobroker_grid.png", alt: "ClawBroker interface showing property survey grid" },
  { value: "tab2", label: "Labels", icon: <Tag size={14} />, src: "/02_cobroker_labels.png", alt: "ClawBroker interface showing property labels" },
  { value: "tab3", label: "Chat", icon: <MessageSquare size={14} />, src: "/03_cobroker_feedback.png", alt: "ClawBroker interface showing client chat" },
];

function ClientExperienceSection() {
  const [activeTab, setActiveTab] = useState("tab1");

  const tabButtons = (
    <div className="inline-flex bg-[#26251e]/[0.06] rounded-full p-1 gap-1">
      {CLIENT_TABS.map((tab) => (
        <button
          key={tab.value}
          onClick={() => setActiveTab(tab.value)}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 cursor-pointer ${
            activeTab === tab.value
              ? "bg-[#26251e] text-white shadow-sm"
              : "text-[#26251e]/60 hover:text-[#26251e]/80"
          }`}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  );

  return (
    <section id="deliverables" className="w-full flex flex-col items-center scroll-mt-20">
      <div className="relative overflow-hidden bg-[#f2f1ed] w-full">
        <div className="relative w-full min-h-[800px] md:min-h-[950px]">
          {/* Mobile toggle at top center */}
          <div className="relative w-full flex justify-center mb-4 md:hidden z-20 pt-4">
            <div className="bg-white/80 rounded-full p-1 shadow-md">
              {tabButtons}
            </div>
          </div>

          {/* Full-width image container */}
          <div className="absolute inset-0 w-full h-full mt-14 md:mt-0">
            <div className="relative w-full h-full">
              {CLIENT_TABS.map((tab) => (
                <Image
                  key={tab.src}
                  src={tab.src}
                  alt={tab.alt}
                  fill
                  className={`object-contain transition-opacity duration-500 ${
                    activeTab === tab.value ? "opacity-100" : "opacity-0"
                  }`}
                  style={{ objectPosition: "left top" }}
                  priority
                />
              ))}
            </div>
          </div>

          {/* Floating glass card */}
          <div className="absolute bottom-8 left-0 right-0 md:bottom-16 md:right-16 md:left-auto w-full max-w-sm mx-auto md:mx-0 md:max-w-md z-10">
            <div
              className="backdrop-blur-xl rounded-md p-4 md:p-8 mx-4 md:mx-0"
              style={{
                background: "rgba(255, 255, 255, 0.65)",
                boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.2)",
                backdropFilter: "blur(15px)",
                WebkitBackdropFilter: "blur(15px)",
              }}
            >
              <p className="text-xs font-bold font-mono uppercase tracking-widest text-[#f54e00] mb-2">
                DELIVERABLES
              </p>
              <p className="text-lg md:text-[22px] font-normal leading-[1.3] tracking-tight text-[#26251e] mb-2 md:mb-4">
                The best client experience
              </p>
              <p className="text-[#26251e]/60 text-lg leading-relaxed">
                Deliver a frictionless, polished property survey with our modern, Interactive Property Grid. Differentiate yourself from the competition and provide the contemporary, user-friendly software experience your clients expect.
              </p>
              {/* Desktop tabs */}
              <div className="mt-3 md:mt-6 hidden md:block">
                {tabButtons}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Floating Navbar ─── */

const NAV_ITEMS = [
  { label: "Skills", href: "#skills" },
  { label: "Research", href: "#research" },
  { label: "Deliverables", href: "#deliverables" },
];

function FloatingNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { scrollY } = useScroll();

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 100);
  });

  const handleBookDemo = async () => {
    const cal = await getCalApi();
    cal("modal", { calLink: "cobroker/website" });
  };

  const scrolledWidth = isMobile ? "90%" : "min(55%, 820px)";

  return (
    <motion.nav
      className="fixed top-4 left-0 right-0 z-50 mx-auto"
      initial={false}
      animate={{
        width: scrolled ? scrolledWidth : "100%",
        maxWidth: scrolled ? (isMobile ? "9999px" : "820px") : "1348px",
        y: scrolled ? 8 : 0,
      }}
      transition={{ type: "spring", stiffness: 200, damping: 50 }}
      style={{ willChange: "transform, width" }}
    >
      <motion.div
        className="flex items-center justify-between py-3 rounded-full"
        initial={false}
        animate={{
          backgroundColor: scrolled ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0)",
          backdropFilter: scrolled ? "blur(24px)" : "blur(0px)",
          boxShadow: scrolled
            ? "0 0 24px rgba(34,42,53,0.06), 0 1px 1px rgba(0,0,0,0.05), 0 0 0 1px rgba(34,42,53,0.04), 0 0 4px rgba(34,42,53,0.08), 0 16px 68px rgba(47,48,55,0.05), 0 1px 0 rgba(255,255,255,0.1) inset"
            : "0 0 0px rgba(0,0,0,0), 0 0 0px rgba(0,0,0,0)",
          paddingLeft: scrolled ? 16 : 24,
          paddingRight: scrolled ? 16 : 24,
        }}
        transition={{ type: "spring", stiffness: 200, damping: 50 }}
      >
        {/* Logo */}
        <a href="#" className="text-lg font-semibold text-[#26251e] font-[family-name:var(--font-logo)] tracking-[-0.03em] shrink-0">
          ClawBroker
        </a>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-1" onMouseLeave={() => setHoveredIdx(null)}>
          {NAV_ITEMS.map((item, i) => (
            <a
              key={item.href}
              href={item.href}
              className="relative px-3 py-1.5 text-sm font-medium text-[#26251e]/70 hover:text-[#26251e] transition-colors"
              onMouseEnter={() => setHoveredIdx(i)}
            >
              {hoveredIdx === i && (
                <motion.span
                  layoutId="hovered"
                  className="absolute inset-0 rounded-full bg-[#26251e]/[0.06]"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10">{item.label}</span>
            </a>
          ))}
        </div>

        {/* Desktop CTAs */}
        <div className="hidden md:flex items-center gap-2 shrink-0">
          <button
            onClick={handleBookDemo}
            className="text-sm font-medium text-[#26251e]/70 hover:text-[#26251e] px-3 py-1.5 transition-colors cursor-pointer"
          >
            Book a Demo
          </button>
          <a
            href="/sign-up"
            className="main-btn-shadow inline-flex items-center justify-center px-5 py-2 text-sm font-medium"
          >
            Start Free
          </a>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 text-[#26251e]/70 hover:text-[#26251e] transition-colors cursor-pointer"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </motion.div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="md:hidden mt-2 mx-2 rounded-2xl bg-white/90 backdrop-blur-xl shadow-[0_4px_24px_rgba(0,0,0,0.08)] overflow-hidden"
          >
            <div className="flex flex-col py-3">
              {NAV_ITEMS.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="px-6 py-3 text-sm font-medium text-[#26251e]/70 hover:text-[#26251e] hover:bg-[#26251e]/[0.04] transition-colors"
                  onClick={() => setMobileOpen(false)}
                >
                  {item.label}
                </a>
              ))}
              <div className="border-t border-[#26251e]/10 mx-4 my-2" />
              <button
                onClick={() => {
                  setMobileOpen(false);
                  handleBookDemo();
                }}
                className="px-6 py-3 text-sm font-medium text-[#26251e]/70 hover:text-[#26251e] hover:bg-[#26251e]/[0.04] transition-colors text-left cursor-pointer"
              >
                Book a Demo
              </button>
              <div className="px-4 py-2">
                <a
                  href="/sign-up"
                  className="main-btn-shadow flex items-center justify-center px-5 py-2.5 text-sm font-medium w-full"
                  onClick={() => setMobileOpen(false)}
                >
                  Start Free
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}

/* ─── Main Page ─── */

export default function Home() {
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();
  const [heroScene, setHeroScene] = useState(0); // 0 = chat, 1 = video
  const heroTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const videoFadingRef = useRef(false);
  const [heroProgress, setHeroProgress] = useState(0);
  const progressRafRef = useRef<number>(0);
  const videoElRef = useRef<HTMLVideoElement | null>(null);

  // Scene-aware cycling: chat shows 5s, video plays until ~2s before end
  useEffect(() => {
    if (heroScene === 0) {
      heroTimerRef.current = setTimeout(() => {
        setHeroScene(1);
      }, 5000);
    } else if (heroScene === 1) {
      videoFadingRef.current = false;
    }
    return () => {
      if (heroTimerRef.current) clearTimeout(heroTimerRef.current);
    };
  }, [heroScene]);

  // Progress ring animation keyed on heroScene
  useEffect(() => {
    setHeroProgress(0);
    let startTime = performance.now();

    const tick = (now: number) => {
      if (heroScene === 0) {
        const elapsed = now - startTime;
        setHeroProgress(Math.min(elapsed / 5000, 1));
      } else if (heroScene === 1) {
        const vid = videoElRef.current;
        if (vid && vid.duration) {
          const effectiveDuration = vid.duration - 2;
          setHeroProgress(effectiveDuration > 0 ? Math.min(vid.currentTime / effectiveDuration, 1) : 0);
        }
      }
      progressRafRef.current = requestAnimationFrame(tick);
    };

    progressRafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(progressRafRef.current);
  }, [heroScene]);

  const switchHeroScene = useCallback((scene: number) => {
    if (heroTimerRef.current) clearTimeout(heroTimerRef.current);
    setHeroScene(scene);
  }, []);

  const handleVideoTimeUpdate = useCallback((e: React.SyntheticEvent<HTMLVideoElement>) => {
    const vid = e.currentTarget;
    if (!videoFadingRef.current && vid.duration && vid.currentTime >= vid.duration - 2) {
      videoFadingRef.current = true;
      switchHeroScene(0);
    }
  }, [switchHeroScene]);

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
          dark: { "cal-brand": "#26251e" },
        },
        hideEventTypeDetails: false,
      });
    })();
  }, []);

  return (
    <div className="flex flex-row w-screen overflow-x-hidden h-full justify-center px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8 min-w-0">
      <FloatingNavbar />
      <div className="w-full flex flex-col gap-0 min-w-0 pt-14">

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

            {/* Right Column — auto-cycling chat / video */}
            <div className="hero-card-right">
              <div className="iphone-frame">
                <div className="iphone-screen" style={{ overflow: "hidden" }}>
                  <AnimatePresence mode="wait">
                    {heroScene === 0 ? (
                      <motion.div
                        key="chat"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.4 }}
                        className="hero-scene-inner"
                      >
                        <div className="phone-header">
                          <div className="phone-header-avatar">CB</div>
                          <div className="phone-header-info">
                            <span className="phone-header-name">ClawBroker</span>
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
                      </motion.div>
                    ) : (
                      <motion.div
                        key="video"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.4 }}
                        className="hero-scene-inner"
                      >
                        <video
                          ref={(el) => { videoElRef.current = el; if (el) el.playbackRate = 1.5; }}
                          autoPlay
                          muted
                          playsInline
                          className="w-full h-full object-cover"
                          style={{ borderRadius: "inherit", objectPosition: "top" }}
                          src="/hero-demo.mp4"
                          onTimeUpdate={handleVideoTimeUpdate}
                          onEnded={() => {
                            if (!videoFadingRef.current) {
                              videoFadingRef.current = true;
                              switchHeroScene(0);
                            }
                          }}
                        />
                        {/* URL overlay to cover cropped browser bar */}
                        <div
                          className="absolute bottom-0 left-0 right-0 flex items-center justify-center"
                          style={{ height: '43px', background: 'linear-gradient(to bottom, rgba(255,255,255,0.8), rgba(255,255,255,0.95) 40%, #fff)', backdropFilter: 'blur(8px)', zIndex: 10, borderRadius: '0 0 38px 38px' }}
                        >
                          <div className="flex items-center gap-1.5 px-3 py-1 bg-white/80 rounded-full text-[11px] text-gray-500 font-medium tracking-wide">
                            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                            </svg>
                            clawbroker.ai
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
              {/* Progress-ring scene indicators — skills-style list beside phone */}
              <div
                className="absolute top-1/2 -translate-y-1/2 z-20 hidden md:flex flex-col gap-1"
                style={{ left: "calc(50% + 160px)" }}
              >
                {[
                  { label: "Chat", idx: 0 },
                  { label: "Deliverables", idx: 1 },
                ].map(({ label, idx }) => {
                  const isActive = heroScene === idx;
                  const ringRadius = 10;
                  const circumference = 2 * Math.PI * ringRadius;
                  const offset = isActive ? circumference * (1 - heroProgress) : circumference;
                  return (
                    <button
                      key={idx}
                      onClick={() => switchHeroScene(idx)}
                      className="text-left w-full transition-all duration-300"
                      aria-label={`Switch to ${label} view`}
                    >
                      <div className="flex items-center gap-3 py-1.5">
                        {/* Dot with progress ring */}
                        <div className="relative shrink-0 flex items-center justify-center" style={{ width: 24, height: 24 }}>
                          {/* Background track */}
                          <svg width="24" height="24" viewBox="0 0 24 24" className="absolute inset-0">
                            <circle
                              cx="12" cy="12" r={ringRadius}
                              fill="none"
                              stroke="#26251e"
                              strokeWidth="2"
                              opacity={isActive ? 0.15 : 0}
                              style={{ transition: "opacity 0.3s" }}
                            />
                          </svg>
                          {/* Progress arc */}
                          <svg width="24" height="24" viewBox="0 0 24 24" className="absolute inset-0">
                            <circle
                              cx="12" cy="12" r={ringRadius}
                              fill="none"
                              stroke="#26251e"
                              strokeWidth="2"
                              strokeDasharray={circumference}
                              strokeDashoffset={offset}
                              strokeLinecap="round"
                              style={{ transform: "rotate(-90deg)", transformOrigin: "center", transition: isActive ? "none" : "stroke-dashoffset 0.3s" }}
                              opacity={isActive ? 0.85 : 0}
                            />
                          </svg>
                          {/* Center dot */}
                          <div
                            className="w-[8px] h-[8px] rounded-full transition-all duration-300"
                            style={{ background: "#26251e", opacity: isActive ? 1 : 0.25 }}
                          />
                        </div>
                        <span
                          className="text-base md:text-lg font-normal leading-[1.3] tracking-tight transition-colors duration-300 whitespace-nowrap"
                          style={{ color: isActive ? "#26251e" : "rgba(38,37,30,0.4)" }}
                        >
                          {label}
                        </span>
                      </div>
                    </button>
                  );
                })}
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
            <p className="text-xs font-bold font-mono uppercase tracking-widest text-[#f54e00] mb-2">
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
              <p className="text-[40px] sm:text-[52px] font-normal text-[#26251e] leading-[1.15] tracking-[-1.3px] grow">80%</p>
              <p className="text-base font-normal text-[#26251e]/70 leading-normal tracking-[0.08px]">Of broker time spent gathering data, not deals</p>
            </div>
            <div className="rounded p-3 sm:p-[15px] bg-[#f2f1ed] flex flex-col sm:aspect-[16/9]">
              <p className="text-[40px] sm:text-[52px] font-normal text-[#26251e] leading-[1.15] tracking-[-1.3px] grow">23 min</p>
              <p className="text-base font-normal text-[#26251e]/70 leading-normal tracking-[0.08px]">Lost refocusing after every interruption</p>
            </div>
            <div className="rounded p-3 sm:p-[15px] bg-[#f2f1ed] flex flex-col sm:aspect-[16/9]">
              <p className="text-[40px] sm:text-[52px] font-normal text-[#26251e] leading-[1.15] tracking-[-1.3px] grow">67%</p>
              <p className="text-base font-normal text-[#26251e]/70 leading-normal tracking-[0.08px]">Of company context lives undocumented</p>
            </div>
          </div>
        </section>

        {/* ─── What Is An AI Team? Section ─── */}
        <section className="w-full px-4 sm:px-6 py-16 sm:py-24 md:py-32 flex flex-col gap-8 sm:gap-12 max-w-[1300px] mx-auto min-w-0">
          <div className="w-full max-w-[1300px]">
            <p className="text-xs font-bold font-mono uppercase tracking-widest text-[#f54e00] mb-2">
              WHAT IS AN AI TEAM?
            </p>
            <p className="text-lg md:text-[22px] font-normal leading-[1.3] tracking-tight text-[#26251e] text-balance">
              A teammate that never sleeps
            </p>
            <p className="text-lg md:text-[22px] font-normal leading-[1.3] tracking-tight text-[#26251e]/60 mt-1 text-pretty">
              Not a chatbot. A proactive team member that lives in your tools.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-[10px] w-full max-w-[1300px]">
            {/* Regular AI Chatbot */}
            <div className="relative rounded p-5 sm:p-8 bg-[#f2f1ed] flex flex-col gap-3">
              <span className="absolute top-4 right-4 text-xs font-medium text-[#26251e]/40 bg-[#26251e]/[0.05] rounded-full px-3 py-1">Old way</span>
              <div className="flex items-center gap-3 mb-1">
                <MessageSquare className="w-8 h-8 shrink-0 text-[#26251e]/40" />
                <div>
                  <p className="text-xl font-medium text-[#26251e]">Regular AI Chatbot</p>
                  <p className="text-sm text-[#26251e]/50">Waits for you to ask</p>
                </div>
              </div>
              <ul className="flex flex-col">
                {[
                  "Only answers when prompted",
                  "No business context",
                  "Can\u2019t take action",
                  "Forgets everything",
                  "No CRE-specific tools built in",
                ].map((item, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-3 py-1.5 text-sm text-[#26251e]"
                  >
                    <span className="shrink-0 text-[#26251e]/30 text-sm">✕</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* ClawBroker */}
            <div className="relative rounded p-5 sm:p-8 bg-[#f2f1ed] border-2 border-[#26251e] flex flex-col gap-3">
              <span className="absolute top-4 right-4 text-xs font-medium text-white bg-[#26251e] rounded-full px-3 py-1">New way</span>
              <div className="flex items-center gap-3 mb-1">
                <Handshake className="w-8 h-8 shrink-0 text-[#26251e]" />
                <div>
                  <p className="text-xl font-medium text-[#26251e]">ClawBroker</p>
                  <p className="text-sm text-[#26251e]/50">Works proactively for you</p>
                </div>
              </div>
              <ul className="flex flex-col">
                {[
                  "Monitors 24/7, alerts you first",
                  "Learns your deals & clients",
                  "Drafts LOIs, pulls comps, sends reports",
                  "Remembers everything forever",
                  "CRE tools for comps, underwriting & more",
                ].map((item, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-3 py-1.5 text-sm text-[#26251e]"
                  >
                    <span className="shrink-0 text-[#26251e]/60 text-sm">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* ─── Examples Section ─── */}
        <ExamplesSection />

        {/* ─── Property Data Section ─── */}
        <PropertyDataSection />

        {/* ─── Client Experience Section ─── */}
        <ClientExperienceSection />

        {/* ─── Use Cases Section ─── */}
        <section id="use-cases" className="w-full px-4 sm:px-6 py-16 sm:py-24 md:py-32 flex flex-col gap-8 sm:gap-12 max-w-[1300px] mx-auto min-w-0 scroll-mt-20">
          <div className="w-full max-w-[1300px]">
            <p className="text-xs font-bold font-mono uppercase tracking-widest text-[#f54e00] mb-2">
              USE CASES
            </p>
            <p className="text-lg md:text-[22px] font-normal leading-[1.3] tracking-tight text-[#26251e] text-balance">
              A Full Team In Your Pocket
            </p>
            <p className="text-lg md:text-[22px] font-normal leading-[1.3] tracking-tight text-[#26251e]/60 mt-1 text-pretty">
              What can ClawBroker do for you? One assistant, thousands of use cases.
            </p>
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

        {/* ─── Get Started Section (rewritten Comparison) ─── */}
        <section className="w-full px-4 sm:px-6 py-16 sm:py-24 md:py-32 flex flex-col items-center max-w-[1300px] mx-auto">
          <div className="w-full max-w-[1300px] mb-8 sm:mb-10">
            <p className="text-xs font-bold font-mono uppercase tracking-widest text-[#f54e00] mb-2">
              GET STARTED
            </p>
            <p className="text-lg md:text-[22px] font-normal leading-[1.3] tracking-tight text-[#26251e] text-balance">
              Up and running in 60 seconds
            </p>
            <p className="text-lg md:text-[22px] font-normal leading-[1.3] tracking-tight text-[#26251e]/60 mt-1 text-pretty">
              No downloads. No setup guides. Three steps and you&apos;re live.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-[10px] w-full max-w-[1300px]">
            {[
              { step: "1", title: "Pick your AI model", description: "Choose from GPT-4o, Claude, Gemini, or others. Switch anytime." },
              { step: "2", title: "Connect your chat", description: "Link Telegram, WhatsApp, or Slack — wherever your team already works." },
              { step: "3", title: "Start closing deals", description: "Your AI teammate is live. Ask it anything, assign it tasks, let it work." },
            ].map((item) => (
              <div key={item.step} className="rounded p-5 sm:p-8 bg-[#f2f1ed] flex flex-col gap-3">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#26251e] text-white text-sm font-medium">
                  {item.step}
                </span>
                <p className="text-lg font-medium text-[#26251e]">{item.title}</p>
                <p className="text-sm text-[#26251e]/60 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ─── Closing CTA ─── */}
        <section className="w-full px-4 sm:px-6 py-16 sm:py-24 md:py-32 flex flex-col items-center max-w-[1300px] mx-auto text-center">
          <p className="text-lg md:text-[22px] font-normal leading-[1.3] tracking-tight text-[#26251e] text-balance mb-2">
            Ready to stop drowning in busywork?
          </p>
          <p className="text-lg md:text-[22px] font-normal leading-[1.3] tracking-tight text-[#26251e]/60 text-pretty mb-8">
            Join the brokers who closed more deals last quarter — with less effort.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
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
              className="inline-flex items-center justify-center rounded-full border border-[#26251e]/20 px-6 py-2.5 text-sm font-medium text-[#26251e]/70 hover:bg-[#26251e]/[0.04] transition-colors cursor-pointer"
            >
              Book a Demo
            </button>
          </div>
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

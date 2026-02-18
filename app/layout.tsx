import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Montserrat } from "next/font/google";
import "./globals.css";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["600"],
  variable: "--font-logo",
});

export const metadata: Metadata = {
  title: "ClawBroker AI | AI-Powered CRE Team Built on OpenClaw",
  description:
    "ClawBroker AI is a commercial real estate AI platform built on OpenClaw. Property search, demographic analysis, document extraction, market monitoring, and client memory — all from Telegram. Free $10 credit to start.",
  keywords: [
    "commercial real estate AI",
    "CRE AI tool",
    "OpenClaw commercial real estate",
    "AI site selection",
    "AI demographic analysis",
    "CRE broker tools",
    "ClawBroker AI",
    "PropTech AI",
    "OpenClaw alternative",
    "AI property search",
  ],
  openGraph: {
    title: "ClawBroker AI | Your CRE AI Team Built on OpenClaw",
    description:
      "AI-powered property search, demographics, document extraction, and market monitoring for CRE brokers. Built on OpenClaw. Free $10 credit.",
    url: "https://clawbroker.ai",
    siteName: "ClawBroker AI",
    type: "website",
    images: [
      {
        url: "https://clawbroker.ai/og-image.png",
        width: 1200,
        height: 630,
        alt: "ClawBroker AI — CRE AI Team Built on OpenClaw",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ClawBroker AI | CRE AI Team Built on OpenClaw",
    description:
      "AI-powered tools for CRE brokers. Free $10 credit to start.",
  },
  alternates: {
    canonical: "https://clawbroker.ai",
  },
  robots: {
    index: true,
    follow: true,
  },
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "ClawBroker AI",
  url: "https://clawbroker.ai",
  logo: "https://clawbroker.ai/logo.png",
  description:
    "AI-powered commercial real estate platform built on the OpenClaw agent framework for CRE brokers and brokerage firms.",
  foundingDate: "2024",
  sameAs: [
    "https://www.linkedin.com/company/clawbroker-ai",
    "https://github.com/isaacherrera/openclaw",
  ],
};

const softwareSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "ClawBroker AI",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web, Telegram",
  description:
    "Commercial real estate AI platform with property search, demographic analysis, document extraction, market monitoring, client memory, and chart generation. Built on OpenClaw.",
  featureList: [
    "AI Property Search (Quick Search via Gemini, Deep Search via Parallel AI)",
    "ESRI Demographic Analysis (58 data types, radius and drive-time)",
    "Email Document Extraction (PDF, XLSX, CSV, images)",
    "Automated Market Monitoring with Daily Alerts",
    "Client Memory (profiles, criteria, deal history)",
    "Chart Generation (bar, line, doughnut)",
    "Interactive Property Survey Grid",
    "Google Places Integration (brand search, nearby analysis)",
    "AI Research Enrichment (zoning, building details, market data)",
  ],
  offers: {
    "@type": "Offer",
    priceCurrency: "USD",
    price: "0",
    description: "Free $10 credit to start. Pay-as-you-go after.",
  },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is ClawBroker AI?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "ClawBroker AI is a commercial real estate AI platform built on the OpenClaw agent framework. It provides CRE brokers with an AI team accessible via Telegram that handles property search, demographic analysis, document extraction, market monitoring, client memory, and chart generation — all from your phone, 24/7.",
      },
    },
    {
      "@type": "Question",
      name: "How is ClawBroker AI different from a regular AI chatbot?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Unlike chatbots that only answer when prompted, ClawBroker monitors markets 24/7 and alerts you proactively. It remembers your clients and deals across conversations, takes real actions like pulling comps and drafting LOIs, and has CRE-specific tools for demographics, property search, and lease analysis built in.",
      },
    },
    {
      "@type": "Question",
      name: "What is OpenClaw and how does ClawBroker use it?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "OpenClaw is an open-source AI agent framework with over 200,000 GitHub stars. ClawBroker is a vertical application built on OpenClaw specifically for commercial real estate brokerage — it adds CRE-specific skills like property search, ESRI demographics, document extraction, and market monitoring on top of the OpenClaw runtime.",
      },
    },
    {
      "@type": "Question",
      name: "What can ClawBroker AI do for CRE brokers?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "ClawBroker handles six core tasks: finding available properties via AI-powered search, analyzing demographics with ESRI data (population, income, housing), extracting deal data from emailed PDFs and spreadsheets, monitoring markets for new listings, remembering client profiles and criteria, and generating professional charts from any data.",
      },
    },
    {
      "@type": "Question",
      name: "How much does ClawBroker AI cost?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "ClawBroker starts with a free $10 credit — no credit card required. After that, you pay only for what you use. AI model usage and app features (demographics, Places search, enrichment) are tracked separately. Your agent pauses when your balance reaches zero and reactivates instantly when you add credits.",
      },
    },
    {
      "@type": "Question",
      name: "Is ClawBroker AI an alternative to CoStar?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "ClawBroker serves a different role than CoStar. CoStar is a data subscription ($500+/month) focused on property listings and comps. ClawBroker is an AI agent ($10 to start) that actively works for you — searching for properties, analyzing demographics, extracting documents, and monitoring markets. Many brokers use both.",
      },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider dynamic>
      <html lang="en">
        <body className={`${GeistSans.className} ${GeistMono.variable} ${montserrat.variable} antialiased overflow-x-hidden min-h-dvh`}>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
          />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
          />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
          />
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}

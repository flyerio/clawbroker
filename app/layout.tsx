import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";

export const metadata: Metadata = {
  title: "ClawBroker — Deploy Your CRE AI Agent",
  description:
    "Skip the complexity. One-click deploy your own 24/7 commercial real estate intelligence assistant.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider dynamic>
      <html lang="en">
        <body className={`${GeistSans.className} ${GeistMono.variable} antialiased overflow-x-hidden min-h-dvh`}>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}

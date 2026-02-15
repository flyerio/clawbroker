import type { Metadata } from "next";
import { themeScript } from "./theme-script";
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
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="font-sans antialiased overflow-x-hidden min-h-dvh">
        {children}
      </body>
    </html>
  );
}

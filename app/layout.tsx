import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SyncBridge — One report. Every board. Delivered automatically.",
  description:
    "SyncBridge automatically aggregates cross-board Monday.com data into executive reports delivered on your schedule. No more manual dashboards.",
  keywords: ["Monday.com", "reporting", "automation", "executive dashboard", "cross-board"],
  authors: [{ name: "SyncBridge" }],
  openGraph: {
    title: "SyncBridge",
    description: "One report. Every board. Delivered automatically.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-gray-50 text-gray-900 font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
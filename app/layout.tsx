import type { Metadata } from "next";
import "./globals.css";
import "./product-refinements.css";

export const metadata: Metadata = {
  title: "TRACE — AI Research Copilot",
  description:
    "From customer conversations to confident product decisions. An evidence-first research workspace.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}

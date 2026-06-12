import type { Metadata } from "next";
import "./globals.css";
import { Shell } from "@/components/sentinel/shell";

export const metadata: Metadata = {
  title: "Sentinel — Agent Telemetry",
  description: "Live telemetry & monitoring for agent sandboxes",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}

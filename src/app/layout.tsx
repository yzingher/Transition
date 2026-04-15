import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Transition",
  description:
    "A mobile AI governance simulation. You lead the UK's AI & Economy Taskforce through five chapters from 2024 to 2035. Every decision has consequences.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#1a1a1e",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-dvh flex flex-col items-center">
        <main className="w-full max-w-[480px] min-h-dvh flex flex-col">
          {children}
        </main>
      </body>
    </html>
  );
}

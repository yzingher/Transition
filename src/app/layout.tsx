import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Transition",
  description: "An AI governance simulation. You lead the taskforce. 12 turns. 2024-2035.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
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

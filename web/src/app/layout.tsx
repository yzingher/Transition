import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Project Ledger",
    template: "%s — Project Ledger",
  },
  description:
    "The true cost of the British state, from first principles. Open source. Every number traceable.",
};

const NAV = [
  { href: "/programme", label: "The Programme" },
  { href: "/ledger", label: "The Ledger" },
  { href: "/feed", label: "The Feed" },
];

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-GB">
      <body className="min-h-dvh flex flex-col">
        <header className="border-b border-hairline">
          <div className="mx-auto w-full max-w-4xl px-5 py-4 flex items-baseline justify-between gap-6">
            <Link href="/" className="font-semibold tracking-tight text-lg">
              Project Ledger
            </Link>
            <nav className="flex gap-5 text-sm text-ink-2">
              {NAV.map((item) => (
                <Link key={item.href} href={item.href} className="hover:text-ink">
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>
        <main className="mx-auto w-full max-w-4xl px-5 py-10 flex-1">{children}</main>
        <footer className="border-t border-hairline">
          <div className="mx-auto w-full max-w-4xl px-5 py-6 text-xs text-ink-muted space-y-1">
            <p>
              Every published number links to source documents, the calculation, and the model
              version that produced it. No claim without a chain.
            </p>
            <p>
              Open source — models, pipelines, FOI correspondence, and editorial decisions live in
              the public repository. Dispute a number? Open a pull request.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}

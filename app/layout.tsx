import "./../styles/globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sága DM",
  description: "Sága — AI Dungeon Master with multivoice narration",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className="
          min-h-screen
          bg-saga-bg
          text-saga-text
          font-ui
          antialiased
          bg-saga-gradient
          selection:bg-saga-accent selection:text-saga-bg
        "
      >
        <div className="relative flex flex-col min-h-screen">
          {/* Header (optional global nav or logo) */}
          <header className="px-6 py-4 border-b border-saga-accent/30 shadow-glow">
            <h1 className="font-saga text-3xl text-saga-accent tracking-wide drop-shadow">
              Sága DM
            </h1>
            <p className="text-saga-subtext text-sm">
              The AI Dungeon Master — cinematic storytelling reimagined
            </p>
          </header>

          {/* Main Content */}
          <main className="flex-1 p-4 md:p-8">{children}</main>

          {/* Footer */}
          <footer className="text-center text-xs text-saga-subtext py-4 border-t border-saga-accent/20">
            <span>© {new Date().getFullYear()} Sága DM by Shiv Kohli</span>
          </footer>
        </div>
      </body>
    </html>
  );
}

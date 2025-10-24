import Chat from "@/components/Chat";
import { AudioProvider } from "@/components/AudioQueue";

export default function PlayPage() {
  return (
    <main
      className="
        min-h-screen
        flex flex-col
        items-center
        justify-center
        bg-saga-gradient
        text-saga-text
        font-ui
        p-4 md:p-8
      "
    >
      <section
        className="
          w-full
          max-w-4xl
          flex flex-col
          flex-1
          bg-saga-panel
          rounded-2xl
          border border-saga-accent/30
          shadow-glow
          overflow-hidden
        "
      >
        <header
          className="
            p-4
            border-b border-saga-accent/30
            bg-saga-bg
            flex items-center justify-between
          "
        >
          <h1 className="font-saga text-2xl text-saga-accent tracking-wide">
            Sága DM
          </h1>
          <span className="text-saga-subtext text-sm italic">
            “The story awaits...”
          </span>
        </header>

        <div className="flex-1 overflow-y-auto">
          <AudioProvider>
            <Chat />
          </AudioProvider>
        </div>

        <footer
          className="
            border-t border-saga-accent/20
            text-center text-xs text-saga-subtext
            p-3
            bg-saga-bg/80
          "
        >
          © {new Date().getFullYear()} Sága DM — AI Dungeon Master
        </footer>
      </section>
    </main>
  );
}

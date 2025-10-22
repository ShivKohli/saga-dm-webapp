import Chat from "@/components/Chat";
import { AudioProvider } from "@/components/AudioQueue";

export default function Page() {
  return (
    </main>
    <AudioProvider>
      <h1 className="text-3xl font-bold">Sága is alive 🎉</h1>
      <Chat />
    </AudioProvider>
  );
}

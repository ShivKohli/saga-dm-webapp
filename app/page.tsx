import Chat from "@/components/Chat";
import { AudioProvider } from "@/components/AudioQueue";

export default function Page() {
  return (
        <main className="flex min-h-screen items-center justify-center">
      <h1 className="text-3xl font-bold">Sága is alive 🎉</h1>
    </main>
    <AudioProvider>
      <Chat />
    </AudioProvider>
  );
}

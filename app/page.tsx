import Chat from "@/components/Chat";
import { AudioProvider } from "@/components/AudioQueue";

export default function Page() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-black text-white">
      <AudioProvider>
        <Chat />
      </AudioProvider>
    </main>
  );
}

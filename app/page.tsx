import Chat from "@/components/Chat";
import { AudioProvider } from "@/components/AudioQueue";

export default function Page() {
  return (
    </main>
    <AudioProvider>
      <Chat />
    </AudioProvider>
  );
}

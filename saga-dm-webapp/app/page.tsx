import Chat from "@/components/Chat";
import { AudioProvider } from "@/components/AudioQueue";

export default function Page() {
  return (
    <AudioProvider>
      <Chat />
    </AudioProvider>
  );
}

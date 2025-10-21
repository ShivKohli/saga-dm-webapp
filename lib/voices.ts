export type VoiceClip = { character: string; url: string; voice_used?: string };

export function extractVoiceSegments(text: string): { character: string; line: string }[] {
  // Parse [Voice: Name] "quoted line" patterns; fallback to one segment for entire text as Saga
  const segments: { character: string; line: string }[] = [];
  const regex = /\[Voice:\s*([^\]]+)\]\s*[“\"]([\s\S]*?)[”\"]/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    const character = match[1].trim();
    const line = match[2].trim();
    if (line) segments.push({ character, line });
  }
  if (segments.length === 0) {
    // No explicit tags; treat entire assistant text as Saga narration
    const line = text.replace(/^\s+|\s+$/g, "");
    if (line) segments.push({ character: "Saga", line });
  }
  return segments;
}

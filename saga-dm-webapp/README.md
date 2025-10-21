# Sága DM — Full Web App (Next.js + Multivoice Auto-Play)

This project hosts the *entire* Saga conversation in a single web app with **automatic audio playback**.
It connects to OpenAI for text generation and to your existing **Saga TTS API** for voice lines (uploaded to Cloudflare R2).

## Features
- Next.js 14 (App Router) + TypeScript
- Tailwind styling
- Server route `/api/saga` calls OpenAI and your TTS
- Multi-voice parsing: `[Voice: Name] "Line..."` → generates per-segment audio
- Audio queue with auto-play, pause/resume
- Toggle sound ON/OFF
- Production-ready structure

## Environment Variables
Create `.env.local` in the project root with:

```
OPENAI_API_KEY=sk-xxxxx
OPENAI_MODEL=gpt-4o-mini
SAGA_TTS_URL=https://saga-tts.vercel.app/tts
```

> If you host your TTS elsewhere, update `SAGA_TTS_URL` accordingly.

## Dev
```
npm install
npm run dev
```

Open http://localhost:3000

## Deploy (Vercel)
- Push this repo to GitHub
- Import into Vercel
- Add env vars (`OPENAI_API_KEY`, `OPENAI_MODEL`, `SAGA_TTS_URL`)
- Deploy
- Optionally map `play.sagadmai.com` to this app in your domain DNS

## How it Works
- Client sends `history` + `userMessage` to `/api/saga`
- Server calls OpenAI with a concise **Sága** system prompt to produce the next turn
- The assistant text is parsed for `[Voice: ...] "..."` segments
- For each segment, the server calls your **TTS** endpoint and collects `audio_url`s
- Client enqueues all returned clips and plays them in order automatically

## Notes
- Safari/Chrome may require a first user interaction before audio can play; the UI has a **Sound ON/OFF** toggle.
- You can expand multi-user support with websockets if desired.

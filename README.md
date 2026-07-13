# LIFF Check-in Starter

A minimal **LINE LIFF event check-in** app. Attendees scan an event QR, the LIFF
opens inside LINE, and they check in with their LINE identity — no forms, no
accounts. Runs in a plain browser via **demo mode**, so you can try the whole
flow without a LINE app or a LIFF ID.

> Built as an open-source starter by [Thichanon Ratanasaenwan](https://portfolio.shipfold.com).
> The pattern behind several shipped LIFF systems (event check-in, staff, loyalty).

## How it works

```
event QR  ──►  LIFF URL (?event=expo-2026)  ──►  LINE login  ──►  POST /api/checkin
  (poster)          (opens in LINE)              (identity)        (idempotent per user)
```

- **Frontend** (`public/`) — vanilla JS + the LIFF SDK. Resolves a LINE profile
  in-app, or a stable mock profile in demo mode.
- **Backend** (`server.ts`) — Bun + Elysia. Validates the payload and records
  check-ins in an in-memory store, deduped per `(event, userId)`.
- The event QR is simply a QR of the LIFF URL — generate it with any QR tool.

## Run it

```bash
bun install
bun run dev          # http://localhost:3000  → demo mode (no LIFF_ID)
bun test             # store logic unit tests
```

Open `http://localhost:3000/?event=expo-2026` — you'll get a mock identity and
can check in. Add `?demo` to force demo mode even when a LIFF ID is set.

## Go live inside LINE

1. Create a **LINE Login** channel and a **LIFF** app at the
   [LINE Developers console](https://developers.line.biz/console/).
2. Set the LIFF **Endpoint URL** to your deployed HTTPS origin, scope `profile`.
3. Copy `.env.example` → `.env` and set `LIFF_ID`.
4. Deploy (see below). Point your event QR at
   `https://your-host/?event=<your-event-id>`.

## Deploy

Any host that runs Bun. Included `Dockerfile` works on Coolify / Fly / Railway:

```bash
docker build -t liff-checkin .
docker run -p 3000:3000 -e LIFF_ID=xxxxxxxx-xxxxxxxx liff-checkin
```

## Production notes

- The store is **in-memory** — check-ins reset on restart and don't share across
  instances. Swap the `Map` in `store.ts` for Postgres/Redis for real events.
- `/api/checkin` trusts the `userId` from the client. For anti-spoofing, send the
  LIFF `idToken` and verify it server-side against LINE's endpoint before recording.
- Add rate limiting on `/api/checkin` if the endpoint is public.

## License

MIT © Thichanon Ratanasaenwan

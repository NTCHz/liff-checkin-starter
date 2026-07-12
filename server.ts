import { Elysia, t } from "elysia";
import { staticPlugin } from "@elysiajs/static";
import { createStore } from "./store";

const store = createStore();
const LIFF_ID = process.env.LIFF_ID ?? "";

const app = new Elysia()
  // Serves the LIFF frontend from ./public (index.html at "/").
  .use(staticPlugin({ assets: "public", prefix: "/" }))
  // Expose the configured LIFF ID to the client (public value, safe to send).
  .get("/api/config", () => ({ liffId: LIFF_ID }))
  .post(
    "/api/checkin",
    ({ body }) => {
      const event = body.event.trim() || "default";
      const name = body.name.trim() || "Guest";
      const result = store.checkIn(event, body.userId, name);
      return { ok: true, ...result };
    },
    {
      // Validate at the boundary — never trust the client payload.
      body: t.Object({
        event: t.String({ maxLength: 120 }),
        userId: t.String({ minLength: 1, maxLength: 120 }),
        name: t.String({ maxLength: 120 }),
      }),
    },
  )
  .get("/api/event/:id", ({ params }) => store.getEvent(params.id))
  .listen(process.env.PORT ?? 3000);

console.log(`▲ liff-checkin-starter on :${app.server?.port}  (LIFF_ID ${LIFF_ID ? "set" : "MISSING — demo mode only"})`);

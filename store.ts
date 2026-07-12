// In-memory attendance store, keyed by event → attendee.
// ponytail: in-memory is intentional for a starter demo; swap `Map` for Postgres/
// Redis when you need persistence across restarts or multiple server instances.

export type CheckIn = { userId: string; name: string; at: number };
export type CheckInResult = { already: boolean; count: number; at: number };

export type Store = {
  checkIn: (event: string, userId: string, name: string, now?: number) => CheckInResult;
  getEvent: (event: string) => { count: number; checkins: CheckIn[] };
};

export function createStore(): Store {
  const events = new Map<string, Map<string, CheckIn>>();

  function checkIn(event: string, userId: string, name: string, now = Date.now()): CheckInResult {
    let attendees = events.get(event);
    if (!attendees) {
      attendees = new Map();
      events.set(event, attendees);
    }
    const existing = attendees.get(userId);
    if (existing) {
      return { already: true, count: attendees.size, at: existing.at };
    }
    attendees.set(userId, { userId, name, at: now });
    return { already: false, count: attendees.size, at: now };
  }

  function getEvent(event: string) {
    const attendees = events.get(event);
    if (!attendees) return { count: 0, checkins: [] };
    const checkins = [...attendees.values()].sort((a, b) => a.at - b.at);
    return { count: checkins.length, checkins };
  }

  return { checkIn, getEvent };
}

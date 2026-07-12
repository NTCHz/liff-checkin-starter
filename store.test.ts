import { test, expect } from "bun:test";
import { createStore } from "./store";

test("first check-in records the attendee", () => {
  const s = createStore();
  const r = s.checkIn("expo", "U1", "Alice", 1000);
  expect(r.already).toBe(false);
  expect(r.count).toBe(1);
  expect(s.getEvent("expo").count).toBe(1);
});

test("same user checking in twice is idempotent", () => {
  const s = createStore();
  s.checkIn("expo", "U1", "Alice", 1000);
  const again = s.checkIn("expo", "U1", "Alice", 2000);
  expect(again.already).toBe(true);
  expect(again.count).toBe(1);
  expect(again.at).toBe(1000); // keeps original time, not the retry
});

test("distinct users and events are counted separately", () => {
  const s = createStore();
  s.checkIn("expo", "U1", "Alice", 1000);
  s.checkIn("expo", "U2", "Bob", 1001);
  s.checkIn("gala", "U1", "Alice", 1002);
  expect(s.getEvent("expo").count).toBe(2);
  expect(s.getEvent("gala").count).toBe(1);
  expect(s.getEvent("unknown").count).toBe(0);
});

test("checkins are returned in arrival order", () => {
  const s = createStore();
  s.checkIn("expo", "U2", "Bob", 2000);
  s.checkIn("expo", "U1", "Alice", 1000);
  expect(s.getEvent("expo").checkins.map((c) => c.name)).toEqual(["Alice", "Bob"]);
});

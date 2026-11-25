import assert from "node:assert/strict";
import { test } from "node:test";
import { createWatchdog } from "./contrast-watchdog.mjs";

// A clock the test moves by hand. advance() runs every timer that falls due, in order of its time.
function fakeClock() {
  let now = 0;
  let nextId = 0;
  const timers = new Map();
  const clock = {
    now: () => now,
    setTimeout: (fn, ms) => {
      const id = nextId;
      nextId += 1;
      timers.set(id, { at: now + ms, fn });
      return id;
    },
    clearTimeout: (id) => timers.delete(id),
  };
  const advance = (ms) => {
    const end = now + ms;
    for (;;) {
      const due = [...timers.entries()].filter(([, t]) => t.at <= end).sort((a, b) => a[1].at - b[1].at)[0];
      if (!due) break;
      timers.delete(due[0]);
      now = Math.max(now, due[1].at);
      due[1].fn();
    }
    now = end;
  };
  // Moves the time without running timers, as when callbacks queue behind other work.
  const skip = (ms) => { now += ms; };
  return { clock, advance, skip, pending: () => timers.size };
}

function setup(totalMs = 1000, stallMs = 300) {
  const c = fakeClock();
  const calls = [];
  let wd;
  const seen = [];
  wd = createWatchdog({ totalMs, stallMs, clock: c.clock, onExpire: (e) => { seen.push(wd.expired); calls.push(e); } });
  return { ...c, wd, calls, seen };
}

test("expires on the stall limit when nothing moves", () => {
  const s = setup();
  s.advance(299);
  assert.equal(s.calls.length, 0);
  s.advance(1);
  assert.equal(s.calls.length, 1);
  assert.equal(s.calls[0].reason, "stall");
  assert.equal(s.calls[0].elapsedMs, 300);
});

test("expires on the total limit while progress continues", () => {
  const s = setup();
  const h = s.wd.begin("a");
  for (let t = 0; t < 10; t += 1) { s.advance(100); h.update(`a ${t}`); }
  assert.equal(s.calls.length, 1);
  assert.equal(s.calls[0].reason, "total");
  assert.equal(s.calls[0].elapsedMs, 1000);
});

test("begin, update and end each move the stall deadline", () => {
  const s = setup(5000, 300);
  s.advance(250);
  const h = s.wd.begin("a");
  s.advance(250);
  h.update("b");
  s.advance(250);
  h.end();
  s.advance(299);
  assert.equal(s.calls.length, 0);
  s.advance(1);
  assert.equal(s.calls[0].reason, "stall");
  assert.equal(s.calls[0].elapsedMs, 1050);
});

test("progress after the stall deadline neither moves it nor changes the entries", () => {
  const s = setup();
  const h = s.wd.begin("waiting");
  s.skip(400);
  h.update("late");
  h.end();
  assert.equal(s.calls.length, 1);
  assert.equal(s.calls[0].reason, "stall");
  assert.deepEqual(s.calls[0].inFlight.map((e) => e.label), ["waiting"]);
});

test("when both deadlines have passed, the first one is the reason", () => {
  const stall = setup(1000, 300);
  stall.skip(2000);
  assert.equal(stall.wd.check(), true);
  assert.equal(stall.calls[0].reason, "stall");

  const total = setup(1000, 300);
  const h = total.wd.begin("a");
  for (let t = 0; t < 9; t += 1) { total.advance(100); h.update(`a ${t}`); }
  total.skip(500);
  assert.equal(total.wd.check(), true);
  assert.equal(total.calls[0].reason, "total");
});

test("a tie between the deadlines is total", () => {
  const s = setup(1000, 300);
  const h = s.wd.begin("a");
  for (let t = 0; t < 7; t += 1) { s.advance(100); h.update(`a ${t}`); }
  s.skip(300);
  s.wd.check();
  assert.equal(s.calls[0].reason, "total");
});

test("in flight holds only open entries, each by its own handle, with both ages", () => {
  const s = setup(1000, 300);
  const a = s.wd.begin("page");
  s.advance(100);
  const b = s.wd.begin("page");
  s.advance(100);
  a.end();
  b.update("page step");
  s.advance(50);
  s.wd.begin("other");
  s.advance(300);
  assert.equal(s.calls.length, 1);
  assert.deepEqual(s.calls[0].inFlight, [
    { label: "page step", ageMs: 450, stepAgeMs: 350 },
    { label: "other", ageMs: 300, stepAgeMs: 300 },
  ]);
});

test("stop before a deadline returns true and nothing expires after", () => {
  const s = setup();
  s.advance(100);
  assert.equal(s.wd.stop(), true);
  s.advance(5000);
  assert.equal(s.calls.length, 0);
  assert.equal(s.wd.expired, false);
  assert.equal(s.pending(), 0);
});

test("stop after a deadline returns false and expires", () => {
  const s = setup();
  s.skip(301);
  assert.equal(s.wd.stop(), false);
  assert.equal(s.calls.length, 1);
  assert.equal(s.wd.expired, true);
});

test("onExpire runs once", () => {
  const s = setup();
  s.advance(300);
  s.wd.check();
  s.wd.stop();
  s.wd.begin("x").end();
  s.advance(5000);
  assert.equal(s.calls.length, 1);
});

test("expired is true before onExpire runs", () => {
  const s = setup();
  s.advance(300);
  assert.deepEqual(s.seen, [true]);
});

test("a tracked object marks each call and refuses all but close after expiry", async () => {
  const { tracked, Expired } = await import("./contrast-watchdog.mjs");
  const s = setup(1000, 300);
  const h = s.wd.begin("tab");
  const calls = [];
  const page = {
    goto(url) { calls.push(`goto ${url}`); return Promise.resolve(); },
    close() { calls.push("close"); return Promise.resolve(); },
    locator() { return { count: () => { calls.push("count"); return 1; } }; },
    mouse: { move(x) { calls.push(`move ${x}`); } },
  };
  const tab = tracked(page, s.wd, h, () => "site wide /");
  s.advance(200);
  await tab.goto("a");
  tab.locator("x").count();
  tab.mouse.move(1);
  s.advance(200);
  assert.equal(s.calls.length, 0, "each call moved the stall deadline");
  s.skip(400);
  assert.throws(() => tab.goto("b"), Expired);
  await tab.close();
  assert.deepEqual(calls, ["goto a", "count", "move 1", "close"]);
  assert.equal(s.calls[0].reason, "stall");
  assert.deepEqual(s.calls[0].inFlight.map((e) => e.label), ["site wide / mouse move"]);
});

test("a late begin or end, alone, changes nothing and expires on the old deadline", () => {
  const lateBegin = setup(1000, 300);
  lateBegin.skip(300);
  lateBegin.wd.begin("late");
  assert.equal(lateBegin.calls.length, 1);
  assert.equal(lateBegin.calls[0].elapsedMs, 300);
  assert.deepEqual(lateBegin.calls[0].inFlight, []);

  const lateEnd = setup(1000, 300);
  const h = lateEnd.wd.begin("open");
  lateEnd.skip(300);
  h.end();
  assert.equal(lateEnd.calls.length, 1);
  assert.equal(lateEnd.calls[0].elapsedMs, 300);
  assert.deepEqual(lateEnd.calls[0].inFlight.map((e) => e.label), ["open"]);
});

test("progress judges and records at one reading of the clock", () => {
  // Each reading moves 1ms, so a check at 299 and a record at 300 would slip past the deadline.
  let now = 0;
  const clock = { now: () => now, setTimeout: () => 0, clearTimeout: () => {} };
  const calls = [];
  const wd = createWatchdog({ totalMs: 1000, stallMs: 300, clock, onExpire: (e) => calls.push(e) });
  now = 299;
  const tick = clock.now;
  clock.now = () => { const t = now; now += 1; return t; };
  wd.begin("at 299");
  clock.now = tick;
  // Judged and recorded at 299, the stall deadline is 599. Recorded at the next reading, it would be 600.
  now = 599;
  wd.check();
  assert.equal(calls.length, 1);
  assert.equal(calls[0].reason, "stall");
  assert.equal(calls[0].elapsedMs, 599);
  assert.deepEqual(calls[0].inFlight.map((e) => e.label), ["at 299"]);
});

test("a tracked page marks each call of a locator chain and the keyboard, and refuses them after expiry", async () => {
  const { tracked, Expired } = await import("./contrast-watchdog.mjs");
  const s = setup(5000, 300);
  const h = s.wd.begin("tab");
  const page = {
    getByText() { return { first: () => ({ click: () => Promise.resolve() }) }; },
    locator() { return { count: () => 1 }; },
    keyboard: { press() { return Promise.resolve(); } },
    goto() { return Promise.resolve(); },
  };
  const tab = tracked(page, s.wd, h, () => "focus /");
  const steps = [
    () => tab.getByText("x"),
    (r) => r.first(),
    (r) => r.click(),
    () => tab.locator("y").count(),
    () => tab.keyboard.press("Tab"),
  ];
  let last;
  for (const step of steps) {
    s.advance(250);
    last = step(last);
  }
  s.advance(250);
  assert.equal(s.calls.length, 0, "every call in the chain moved the stall deadline");
  s.skip(300);
  assert.throws(() => tab.keyboard.press("Tab"), Expired);
  assert.equal(s.calls[0].inFlight[0].label, "focus / keyboard press");

  const t = setup(5000, 300);
  const h2 = t.wd.begin("tab");
  const tab2 = tracked(page, t.wd, h2, () => "rest /");
  const loc = tab2.locator("y");
  t.skip(300);
  assert.throws(() => loc.count(), Expired);
});

test("the call whose own update finds the deadline passed does not start", async () => {
  const { tracked, Expired } = await import("./contrast-watchdog.mjs");
  let now = 0;
  const clock = { now: () => now, setTimeout: () => 0, clearTimeout: () => {} };
  const wd = createWatchdog({ totalMs: 1000, stallMs: 300, clock, onExpire: () => {} });
  const h = wd.begin("tab");
  let started = false;
  const tab = tracked({ goto() { started = true; } }, wd, h, () => "rest /");
  now = 299;
  // The first check reads 299; the update reads 300, the deadline.
  let reads = 0;
  clock.now = () => (reads++ === 0 ? 299 : 300);
  assert.throws(() => tab.goto(), Expired);
  assert.equal(started, false);
});

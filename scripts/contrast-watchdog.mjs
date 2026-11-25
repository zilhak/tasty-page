/**
 * A time limit for the contrast check as a whole. The check waits on the browser in many places, and most of those waits
 * have no limit of their own, so one watchdog watches them all instead of a limit on each call.
 *
 * It expires on the total limit, counted from its creation, or on the stall limit, counted from the last progress of any
 * entry. Deadlines are absolute: progress that arrives after the stall deadline has passed neither moves it nor changes
 * the entries, so the entries reported are the ones in flight when the limit passed. When both deadlines have passed, the
 * one that passed first is the reason, and "total" on a tie.
 *
 * The timers run on the same event loop as the check. They fire while the check waits for the browser, not while the
 * event loop is held by synchronous work.
 */

const systemClock = {
  now: () => performance.now(),
  setTimeout: (fn, ms) => setTimeout(fn, ms),
  clearTimeout: (id) => clearTimeout(id),
};

export function createWatchdog({ totalMs, stallMs, onExpire, clock = systemClock }) {
  const start = clock.now();
  const totalAt = start + totalMs;
  let stallAt = start + stallMs;
  let expired = false;
  let stopped = false;
  let timer = null;
  let nextId = 0;
  const entries = new Map();

  const reasonAt = (now) => {
    if (now >= totalAt && (now < stallAt || totalAt <= stallAt)) return "total";
    if (now >= stallAt) return "stall";
    return null;
  };

  const expire = (reason, now) => {
    expired = true;
    if (timer !== null) clock.clearTimeout(timer);
    timer = null;
    const inFlight = [...entries.values()].map((e) => ({ label: e.label, ageMs: now - e.began, stepAgeMs: now - e.stepped }));
    onExpire({ reason, elapsedMs: now - start, inFlight });
  };

  // True when a deadline has passed at now. Expires on the spot, so the caller sees expired before it changes anything.
  // Progress reads the clock once and judges and records at that one time, so it cannot pass the check at one time and
  // be recorded at a later one.
  const checkAt = (now) => {
    if (expired) return true;
    if (stopped) return false;
    const reason = reasonAt(now);
    if (reason === null) return false;
    expire(reason, now);
    return true;
  };
  const check = () => checkAt(clock.now());

  const arm = () => {
    if (timer !== null) clock.clearTimeout(timer);
    const wait = Math.max(0, Math.min(totalAt, stallAt) - clock.now());
    timer = clock.setTimeout(() => {
      timer = null;
      if (!check() && !stopped) arm();
    }, wait);
  };

  const progress = (now) => {
    stallAt = now + stallMs;
    arm();
  };

  const begin = (label) => {
    const id = nextId;
    nextId += 1;
    const now = clock.now();
    if (!checkAt(now) && !stopped) {
      entries.set(id, { label, began: now, stepped: now });
      progress(now);
    }
    return {
      update(next) {
        const at = clock.now();
        if (checkAt(at) || stopped) return;
        const entry = entries.get(id);
        if (!entry) return;
        entry.label = next;
        entry.stepped = at;
        progress(at);
      },
      end() {
        const at = clock.now();
        if (checkAt(at) || stopped) return;
        if (entries.delete(id)) progress(at);
      },
    };
  };

  // True when it stopped before any deadline. False when a deadline had already passed; it has expired instead.
  const stop = () => {
    if (check()) return false;
    stopped = true;
    if (timer !== null) clock.clearTimeout(timer);
    timer = null;
    return true;
  };

  arm();
  return {
    begin,
    check,
    stop,
    get expired() {
      return expired;
    },
  };
}

// A watchdog that never expires, for callers that pass none.
export const NO_WATCHDOG = {
  begin: () => ({ update() {}, end() {} }),
  check: () => false,
  stop: () => true,
  expired: false,
};

// Thrown in place of a browser call that would start after the watchdog expired.
export class Expired extends Error {
  constructor(what) {
    super(`not started after the time limit: ${what}`);
    this.name = "Expired";
  }
}

// Calls whose result is another object to wrap: a locator chain, or the keyboard and mouse of a page.
const CHAINED = new Set(["locator", "getByText", "first"]);
const MEMBERS = new Set(["keyboard", "mouse"]);

// Wraps a Playwright browser, context or page so that each method call marks progress on the handle, labelled with
// where() and the method name. That covers the waits inside shared helpers too, since they call the same object. Once the
// watchdog has expired, every call but close throws Expired instead of starting, so no new tab, navigation or
// measurement begins after the limit while open tabs can still be closed.
export function tracked(target, watchdog, handle, where) {
  return new Proxy(target, {
    get(obj, prop) {
      const value = Reflect.get(obj, prop, obj);
      if (MEMBERS.has(prop)) return tracked(value, watchdog, handle, () => `${where()} ${prop}`);
      if (typeof value !== "function" || typeof prop !== "string") return value;
      return (...args) => {
        const label = `${where()} ${prop}`;
        if (prop !== "close" && watchdog.check()) throw new Expired(label);
        handle.update(label);
        // The update itself can be the one that finds the deadline passed.
        if (prop !== "close" && watchdog.expired) throw new Expired(label);
        const result = value.apply(obj, args);
        return CHAINED.has(prop) ? tracked(result, watchdog, handle, where) : result;
      };
    },
  });
}

// Browser tests for kit popups that take the keys right after they are placed (vendor/ui_kits/terminal/overlays/
// tools_menu.jsx, port_scanner.jsx), under the site's reduced-motion rule (src/styles/global.css). That rule sets every
// element's transition-duration and declares no transition-property, so an element that declares no transition of its
// own keeps the initial all and its inherited visibility change becomes a transition. A popup hidden until placed must
// be visible when it or a child takes the focus, and the Tools menu must refit to its host room's final size, both when
// the room alone changes size and after a window resize. The tests open the English landing and the gallery's live Tools room on Overlays > Popups. They need the
// build (npm run build) and Chromium (playwright-core's, or CHROMIUM_PATH).
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { chromium } from "playwright-core";
import { browserPath, dist, serve, urlFor } from "./lib/browser-test.mjs";

// Each of the eight pages gets PAGE_MS from before its server starts to the end of its steps. Past it the page stops:
// no further step starts, and a server or browser that arrives late is shut as it arrives. Closing then gets CLOSE_MS
// for the browser and the server side by side, after which a browser that has not closed is killed (KILL_MS more at
// most). So each page ends within 20 s and the eight inside the CI step's three minutes, and a stuck page says which
// page it was. The page's own waits keep their own limits; the budget bounds the page as a whole.
const PAGE_MS = 17000;
const CLOSE_MS = 1500;
const KILL_MS = 1500;
const REFIT_MS = 2000;
// How long an open menu gets to take the focus; well under PAGE_MS, so a menu that never does is named as such.
const FOCUS_MS = 5000;
const LIMIT_MS = 30000;
const LANDING = "/";
const POPUPS = "/design/gallery/overlays-popups/";
const TOOLS = '[role="menu"][aria-label="Tools"]';
const LIVE_TOOLS = `[data-tools-live] ${TOOLS}`;

// Runs a wait and, if it fails, names what was not ready, so a page that never got ready is told apart from a popup
// that got the keys wrong.
async function ready(what, wait) {
  try {
    return await wait;
  } catch (e) {
    throw new Error(`${what}: ${e.message}`);
  }
}

// Settles to a value, or to null once ms run out, whether or not the promise does, and clears its timer either way.
function capped(promise, ms) {
  let timer = null;
  const out = new Promise((r) => { timer = setTimeout(() => r(null), Math.max(0, ms)); });
  return Promise.race([promise, out]).finally(() => clearTimeout(timer));
}

// Closes the static server: drops its open connections first, so a client that holds one cannot keep it listening.
function closeServer(server) {
  server.closeAllConnections();
  return new Promise((r) => server.close(() => r()));
}

// Closes the browser server within CLOSE_MS, and kills its process if it has not closed by then. Resolves to an error
// message when it had to kill or the kill did not end in KILL_MS, or to null.
async function shutBrowser(browserServer) {
  const closed = await capped(browserServer.close().then(() => true, () => false), CLOSE_MS);
  if (closed) return null;
  const killed = await capped(browserServer.kill().then(() => true, () => false), KILL_MS);
  return killed ? `the browser did not close in ${CLOSE_MS}ms and was killed` : `the browser did not close or die in ${CLOSE_MS + KILL_MS}ms`;
}

// Opens path in a fresh context with the given motion setting and hands run the page, the path the browser was sent
// to (with the deployment prefix) and a function that gives the time left in the page's budget. The server and the
// browser close whatever happens after they opened, within the limits above, so the test returns its result instead
// of leaving the process waiting. A close that needed a kill fails a page that otherwise passed.
async function withPage(path, reducedMotion, run) {
  assert.ok(existsSync(join(dist, path, "index.html")), `No built ${path}index.html. Run npm run build first.`);
  const end = Date.now() + PAGE_MS;
  const left = () => Math.max(1, end - Date.now());
  const late = new Error(`${path} (${reducedMotion}) ran past ${PAGE_MS}ms`);
  let over = false;
  let server = null;
  let browserServer = null;
  const steps = (async () => {
    const s = await serve();
    if (over) { await closeServer(s); throw late; }
    server = s;
    const bs = await chromium.launchServer({ executablePath: browserPath(), timeout: left() });
    if (over) { await shutBrowser(bs); throw late; }
    browserServer = bs;
    const browser = await chromium.connect(bs.wsEndpoint(), { timeout: left() });
    if (over) throw late;
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion, locale: "en-US" });
    const page = await context.newPage();
    page.setDefaultTimeout(left());
    const url = urlFor(server, path);
    await page.goto(url, { waitUntil: "load", timeout: left() });
    if (over) throw late;
    page.setDefaultTimeout(left());
    await run(page, new URL(url).pathname, left);
  })();
  steps.catch(() => {}); // a page past its budget still rejects once its browser closes; the budget's error is the result
  let timer = null;
  const budget = new Promise((_, no) => { timer = setTimeout(() => { over = true; no(late); }, PAGE_MS); });
  let failure = null;
  try {
    await Promise.race([steps, budget]);
  } catch (e) {
    failure = e;
  } finally {
    clearTimeout(timer);
    over = true;
  }
  const [browserTrouble] = await Promise.all([
    browserServer ? shutBrowser(browserServer) : null,
    server ? capped(closeServer(server), CLOSE_MS) : null,
  ]);
  if (failure) throw failure;
  assert.equal(browserTrouble, null, `closing ${path} (${reducedMotion}): ${browserTrouble}`);
}

// The landing's Tools button, once the app shell around it is hydrated (Astro drops the island's ssr mark), so a
// failure to open is not taken for a page that was not ready. sent is the path the browser was sent to; the root must
// stay there, on the English landing.
async function landingTools(page, sent) {
  assert.equal(new URL(page.url()).pathname, sent, "the root did not stay on the English landing");
  const tools = page.locator(".shell button", { hasText: /^Tools$/ });
  await ready("the landing's Tools button never showed", tools.waitFor({ state: "visible" }));
  await ready("the landing's app shell never hydrated", page.waitForFunction(() => {
    const island = document.querySelector(".shell")?.closest("astro-island");
    return island && !island.hasAttribute("ssr");
  }));
  return tools;
}

const frames = (page) => page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));

// What has the focus: the Tools menu, a menu row by its label, a checkbox by its label, or a button by its label.
const focused = (page) =>
  page.evaluate(() => {
    const a = document.activeElement;
    if (!a) return null;
    if (a.getAttribute("role") === "menu") return `menu:${a.getAttribute("aria-label")}`;
    if (a.getAttribute("role") === "menuitem") return `row:${a.textContent.trim()}`;
    if (a.matches("input[type=checkbox]")) return `check:${a.closest("label")?.textContent.trim()}`;
    return `${a.tagName.toLowerCase()}:${a.getAttribute("aria-label") || a.textContent.trim()}`;
  });
const markedRows = async (page, menu) => (await page.locator(`${menu} .tasty-menuitem--active`).allTextContents()).map((t) => t.trim());

for (const motion of ["reduce", "no-preference"]) {
  test(`the Tools menu takes the keys on open and the first Down marks Command palette (${motion})`, async () => {
    await withPage(LANDING, motion, async (page, sent) => {
      const tools = await landingTools(page, sent);
      await tools.click();
      await page.locator(TOOLS).waitFor({ state: "visible" });
      // The menu focuses itself in the effect after it is placed; wait for that effect, not for the focus.
      await frames(page);
      assert.equal(await focused(page), "menu:Tools", "the focus after the menu opened");
      assert.deepEqual(await markedRows(page, TOOLS), [], "a row was marked before any key");
      await page.keyboard.press("ArrowDown");
      assert.equal(await focused(page), "row:Command palette…", "the focus after the first Down");
      assert.deepEqual(await markedRows(page, TOOLS), ["Command palette…"], "the row the first Down marked");
    });
  });
}

// The first Down sent in the same task as the menu taking the focus, the earliest a key can reach the menu: the row it
// focuses must already be visible, not still inheriting the menu's hidden through a transition.
test("a Down right as the Tools menu takes the focus moves the focus to Command palette (reduce)", async () => {
  await withPage(LANDING, "reduce", async (page, sent) => {
    const tools = await landingTools(page, sent);
    await page.evaluate(() => {
      document.addEventListener("focusin", function down(e) {
        if (e.target.getAttribute?.("role") !== "menu" || e.target.getAttribute("aria-label") !== "Tools") return;
        document.removeEventListener("focusin", down, true);
        e.target.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", code: "ArrowDown", bubbles: true, cancelable: true }));
        window.__toolsDownSent = true;
      }, true);
    });
    await tools.click();
    await ready("the Tools menu never took the focus", page.waitForFunction(() => window.__toolsDownSent === true, null, { timeout: FOCUS_MS }));
    await frames(page);
    assert.deepEqual(await markedRows(page, TOOLS), ["Command palette…"], "the row the Down marked");
    assert.equal(await focused(page), "row:Command palette…", "the focus after the Down sent as the menu took the focus");
  });
});

test("the first Tab from Columns reaches Proto and Esc returns to Columns (reduce)", async () => {
  await withPage(LANDING, "reduce", async (page, sent) => {
    const tools = await landingTools(page, sent);
    await tools.click();
    await page.locator(`${TOOLS} [role="menuitem"]`, { hasText: "Listening ports…" }).click();
    const columns = page.locator('[data-ports-window] [aria-label="Columns"]').first();
    await ready("the ports window never showed Columns", columns.waitFor({ state: "visible" }));
    await columns.click();
    // The first Tab goes in as soon as the chooser is in the DOM, the moment a hidden chooser would refuse the focus.
    await page.locator('[role="dialog"][aria-label="Show columns"]').waitFor({ state: "attached" });
    await page.keyboard.press("Tab");
    assert.equal(await focused(page), "check:Proto", "the focus after the first Tab from Columns");
    await page.keyboard.press("Escape");
    assert.equal(await focused(page), "button:Columns", "the focus after Esc");
    assert.equal(await page.locator('[role="dialog"][aria-label="Show columns"]').count(), 0, "the chooser stayed open after Esc");
    assert.equal(await page.locator("[data-ports-window]").count(), 1, "Esc closed the ports window too");
  });
});

// The live room's inner height, the open menu's box, whether the menu lies inside the room's inner box, and whether
// the Git row lies whole inside both the menu's scroll area (inside its border) and the room's inner box, on both axes.
const roomState = (page) =>
  page.evaluate(() => {
    const inner = (el) => {
      const r = el.getBoundingClientRect();
      const left = r.left + el.clientLeft;
      const top = r.top + el.clientTop;
      return { left, top, right: left + el.clientWidth, bottom: top + el.clientHeight };
    };
    const within = (r, box) => r.left >= box.left - 0.5 && r.right <= box.right + 0.5 && r.top >= box.top - 0.5 && r.bottom <= box.bottom + 0.5;
    const room = document.querySelector("[data-tools-live]");
    const menu = room.querySelector('[role="menu"][aria-label="Tools"]');
    const git = Array.from(menu.querySelectorAll('[role="menuitem"]')).find((r) => r.textContent.trim() === "Git");
    const box = inner(room);
    const m = menu.getBoundingClientRect();
    const g = git.getBoundingClientRect();
    return {
      room: room.clientHeight,
      menu: m.height,
      menuInRoom: within(m, box),
      gitWhole: within(g, inner(menu)) && within(g, box),
      gitFocused: document.activeElement === git,
      scrollY: window.scrollY,
    };
  });

// Polls the page until check(state) holds or ms run out, on the test's own clock, so a page that stops answering or
// stops drawing frames still ends the poll. Returns the last state it read, so the asserts that follow report what the
// page ended with; other page errors propagate.
async function settle(page, check, ms = REFIT_MS) {
  const end = performance.now() + ms;
  let state = null;
  // No read starts once the deadline has passed, and the wait between reads stops at the deadline.
  for (let rest = end - performance.now(); rest > 0; rest = end - performance.now()) {
    const read = await capped(roomState(page), rest);
    if (read) state = read;
    if (read && check(read)) break;
    const pause = Math.min(16, end - performance.now());
    if (pause > 0) await new Promise((r) => setTimeout(r, pause));
  }
  assert.ok(state, `the page gave no reading within ${ms}ms`);
  return state;
}

// Git keeps the keyboard focus and is the one marked row, whole inside the menu's scroll area and the room, and the
// menu lies inside the room.
async function gitKept(page, state, when) {
  assert.equal(state.menuInRoom, true, `the menu does not lie inside the room ${when}`);
  assert.equal(state.gitFocused, true, `Git lost the focus ${when}`);
  assert.deepEqual(await markedRows(page, LIVE_TOOLS), ["Git"], `the marked rows ${when}`);
  assert.equal(state.gitWhole, true, `Git is cut ${when}`);
}

// The room's inner height for the window it is in now, read from a probe that takes the room's own height rule and
// border with no transition, so it is the height the room ends at, not one it passes on the way.
const roomTarget = (page) =>
  page.evaluate(() => {
    const room = document.querySelector("[data-tools-live]");
    const cs = getComputedStyle(room);
    const probe = document.createElement("div");
    probe.style.cssText = `position:absolute;visibility:hidden;transition:none;box-sizing:${cs.boxSizing};height:${room.style.height};border:${cs.borderTopWidth} solid transparent`;
    document.body.append(probe);
    const h = probe.clientHeight;
    probe.remove();
    return h;
  });

// Opens the live room's Tools menu and marks Git with Shift+Tab, the start both refit paths share. A failure here is
// the menu or its rows refusing the focus, not a refit.
async function openOnGit(page) {
  const button = page.locator("[data-tools-live] button", { hasText: /^Tools$/ });
  await ready("the gallery's live Tools room never mounted", button.waitFor({ state: "visible" }));
  await button.scrollIntoViewIfNeeded();
  await button.click();
  await page.locator(LIVE_TOOLS).waitFor({ state: "visible" });
  await ready("the live Tools menu never took the focus", page.waitForFunction(() => document.activeElement?.getAttribute("aria-label") === "Tools", null, { timeout: FOCUS_MS }));
  // The rows' own reveal is the open tests' concern: wait until every row reads visible, so this start does not fail
  // on a row still hidden and the refit is what these tests judge.
  await page.waitForFunction(() => Array.from(document.querySelectorAll('[data-tools-live] [role="menu"][aria-label="Tools"] [role="menuitem"]'))
    .every((r) => getComputedStyle(r).visibility === "visible"), null, { timeout: FOCUS_MS });
  await page.keyboard.press("Shift+Tab");
  const full = await roomState(page);
  assert.equal(full.gitFocused, true, "before any resize, Shift+Tab did not move the focus to Git");
  await gitKept(page, full, "before any resize");
  return full;
}

for (const motion of ["reduce", "no-preference"]) {
  test(`the Tools menu refits when its room alone changes size, with Git kept in view (${motion})`, async () => {
    await withPage(POPUPS, motion, async (page) => {
      const full = await openOnGit(page);
      const shrink = full.room - 60;
      assert.ok(full.menu > shrink, `the menu (${full.menu}) is not taller than the room it will get (${shrink})`);
      const original = await page.evaluate(() => document.querySelector("[data-tools-live]").style.height);

      // Shrink the room alone, with no window resize; the room's border stays, so its outer height is inner + 2.
      await page.evaluate((h) => { document.querySelector("[data-tools-live]").style.height = `${h + 2}px`; }, shrink);
      const small = await settle(page, (s) => s.room === shrink && Math.abs(s.menu - s.room) < 0.5);
      assert.equal(small.room, shrink, "the room did not take its new height");
      assert.ok(Math.abs(small.menu - Math.min(full.menu, small.room)) < 0.5, `the menu is ${small.menu} high in a ${small.room} room`);
      await gitKept(page, small, "after the room shrank");
      assert.equal(small.scrollY, full.scrollY, "the page scrolled when the room shrank");

      // Give the room its height back: the menu grows to its first height and Git stays in view.
      await page.evaluate((h) => { document.querySelector("[data-tools-live]").style.height = h; }, original);
      const back = await settle(page, (s) => s.room === full.room && Math.abs(s.menu - full.menu) < 0.5);
      assert.equal(back.room, full.room, "the room did not take its height back");
      assert.ok(Math.abs(back.menu - full.menu) < 0.5, `the menu is ${back.menu} high after the room grew back, was ${full.menu}`);
      await gitKept(page, back, "after the room grew back");
    });
  });

  test(`the Tools menu refits to the room's final height after a window resize, with Git kept in view (${motion})`, async () => {
    await withPage(POPUPS, motion, async (page, sent, left) => {
      const full = await openOnGit(page);
      // Record the room's height when the resize arrives: under reduced motion the room's own height change can still
      // be under way then, and the menu must follow the room's final height, not the one read at the resize.
      await page.evaluate(() => {
        window.addEventListener("resize", () => { window.__roomAtResize = document.querySelector("[data-tools-live]").clientHeight; }, { once: true });
      });
      await page.setViewportSize({ width: 1440, height: 300 });
      const target = await roomTarget(page);
      assert.ok(target < full.room, `the window resize gives the room ${target}, not less than ${full.room}`);
      // Wait, as a plain condition, until the room has reached that height and the resize has been seen.
      await ready(`the room never reached ${target} after the window resize`, page.waitForFunction((t) =>
        document.querySelector("[data-tools-live]").clientHeight === t && window.__roomAtResize !== undefined, target, { timeout: Math.min(LIMIT_MS, left()) }));
      const atResize = await page.evaluate(() => window.__roomAtResize);
      const low = await settle(page, (s) => s.room === target && Math.abs(s.menu - Math.min(full.menu, target)) < 0.5);
      const note = `room ${atResize} at the resize, ${low.room} at the end, ${target} the target`;
      assert.equal(low.room, target, `the room left its target (${note})`);
      assert.ok(Math.abs(low.menu - Math.min(full.menu, target)) < 0.5, `after the window resize the menu is ${low.menu} high (${note})`);
      await gitKept(page, low, `after the window resize (${note})`);
      assert.equal(low.scrollY, full.scrollY, `the page scrolled with the window resize (${note})`);
    });
  });
}

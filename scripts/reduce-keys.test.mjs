// Browser tests for kit popups that take the keys right after they are placed (vendor/ui_kits/terminal/overlays/
// tools_menu.jsx, port_scanner.jsx), under the site's reduced-motion rule (src/styles/global.css), which sets every
// element's transition-duration and leaves transition-property at all. A popup hidden until placed must be visible
// when it or a child takes the focus, and the Tools menu must refit when its host room changes size without a window
// resize. The tests open the English landing and the gallery's live Tools room on Overlays > Popups. They need the
// build (npm run build) and Chromium (playwright-core's, or CHROMIUM_PATH).
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { chromium } from "playwright-core";
import { browserPath, dist, serve, urlFor } from "./lib/browser-test.mjs";

const LIMIT_MS = 30000;
// Each page gets this long in all, so the six to eight pages end, with their cleanup, inside the CI step's three
// minutes and a stuck page says which page it was.
const PAGE_MS = 20000;
const REFIT_MS = 2000;
// How long an open menu gets to take the focus; well under PAGE_MS, so a menu that never does is named as such.
const FOCUS_MS = 5000;
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

// Opens path in a fresh context with the given motion setting and hands run the page and the path the browser was
// sent to (with the deployment prefix). The server and the browser close whatever happens after they opened, so the
// test returns its result instead of leaving the process waiting.
async function withPage(path, reducedMotion, run) {
  assert.ok(existsSync(join(dist, path, "index.html")), `No built ${path}index.html. Run npm run build first.`);
  const server = await serve();
  let browser = null;
  let timer = null;
  try {
    browser = await chromium.launch({ executablePath: browserPath() });
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion, locale: "en-US" });
    const page = await context.newPage();
    page.setDefaultTimeout(LIMIT_MS);
    const url = urlFor(server, path);
    const steps = (async () => {
      await page.goto(url, { waitUntil: "load", timeout: LIMIT_MS });
      await run(page, new URL(url).pathname);
    })();
    const budget = new Promise((_, no) => {
      timer = setTimeout(() => no(new Error(`${path} (${reducedMotion}) ran past ${PAGE_MS}ms`)), PAGE_MS);
    });
    await Promise.race([steps, budget]);
  } finally {
    clearTimeout(timer);
    try {
      if (browser) await browser.close();
    } finally {
      await new Promise((r) => server.close(r));
    }
  }
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
// the Git row lies whole inside both the menu's scroll area (inside its border) and the room's inner box.
const roomState = (page) =>
  page.evaluate(() => {
    const room = document.querySelector("[data-tools-live]");
    const menu = room.querySelector('[role="menu"][aria-label="Tools"]');
    const git = Array.from(menu.querySelectorAll('[role="menuitem"]')).find((r) => r.textContent.trim() === "Git");
    const top = room.getBoundingClientRect().top + room.clientTop;
    const bottom = top + room.clientHeight;
    const m = menu.getBoundingClientRect();
    const areaTop = m.top + menu.clientTop;
    const areaBottom = areaTop + menu.clientHeight;
    const g = git.getBoundingClientRect();
    return {
      room: room.clientHeight,
      menu: m.height,
      menuInRoom: m.top >= top - 0.5 && m.bottom <= bottom + 0.5,
      gitWhole: g.top >= areaTop - 0.5 && g.bottom <= areaBottom + 0.5 && g.top >= top - 0.5 && g.bottom <= bottom + 0.5,
      gitFocused: document.activeElement === git,
      scrollY: window.scrollY,
    };
  });

// Polls the page until check(state) holds or ms run out, and returns the last state either way, so the asserts that
// follow report what the page ended with.
async function settle(page, check, ms = REFIT_MS) {
  const end = Date.now() + ms;
  for (;;) {
    const state = await roomState(page);
    if (check(state) || Date.now() >= end) return state;
    await frames(page);
  }
}

// Git keeps the keyboard focus and is the one marked row, whole inside the menu's scroll area and the room.
async function gitKept(page, state, when) {
  assert.equal(state.gitFocused, true, `Git lost the focus ${when}`);
  assert.deepEqual(await markedRows(page, LIVE_TOOLS), ["Git"], `the marked rows ${when}`);
  assert.equal(state.gitWhole, true, `Git is cut ${when}`);
}

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
  assert.deepEqual(await markedRows(page, LIVE_TOOLS), ["Git"], "before any resize, the rows Shift+Tab marked");
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
      assert.equal(small.menuInRoom, true, "the menu does not lie inside the room after it shrank");
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
    await withPage(POPUPS, motion, async (page) => {
      const full = await openOnGit(page);
      // Record the room's height when the resize arrives: under reduced motion the room's own height change can still
      // be under way then, and the menu must follow the room's final height, not the one read at the resize.
      await page.evaluate(() => {
        window.addEventListener("resize", () => { window.__roomAtResize = document.querySelector("[data-tools-live]").clientHeight; }, { once: true });
      });
      await page.setViewportSize({ width: 1440, height: 300 });
      // The room has its final height once it reads the same over two frames in a row and is below its first height.
      const end = Date.now() + LIMIT_MS;
      let final = null;
      for (let last = -1; Date.now() < end; await frames(page)) {
        const h = await page.evaluate(() => document.querySelector("[data-tools-live]").clientHeight);
        if (h === last && h < full.room) { final = h; break; }
        last = h;
      }
      assert.ok(final !== null, "the room never settled on a lower height after the window resize");
      const atResize = await page.evaluate(() => window.__roomAtResize);
      const low = await settle(page, (s) => Math.abs(s.menu - Math.min(full.menu, s.room)) < 0.5);
      const note = `room ${atResize} at the resize, ${low.room} at the end`;
      assert.equal(low.room, final, `the room moved again after it settled (${note})`);
      assert.ok(Math.abs(low.menu - Math.min(full.menu, low.room)) < 0.5, `after the window resize the menu is ${low.menu} high (${note})`);
      assert.equal(low.menuInRoom, true, `the menu does not lie inside the room after the window resize (${note})`);
      await gitKept(page, low, `after the window resize (${note})`);
    });
  });
}

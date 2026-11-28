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
const LANDING = "/";
const POPUPS = "/design/gallery/overlays-popups/";

// Opens path in a fresh context with the given motion setting and hands the page to run. The server and the browser
// close whatever happens after they opened, so the test returns its result instead of leaving the process waiting.
async function withPage(path, reducedMotion, run) {
  assert.ok(existsSync(join(dist, path, "index.html")), `No built ${path}index.html. Run npm run build first.`);
  const server = await serve();
  let browser = null;
  try {
    browser = await chromium.launch({ executablePath: browserPath() });
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion, locale: "en-US" });
    const page = await context.newPage();
    page.setDefaultTimeout(LIMIT_MS);
    await page.goto(urlFor(server, path), { waitUntil: "load", timeout: LIMIT_MS });
    await run(page);
  } finally {
    try {
      if (browser) await browser.close();
    } finally {
      await new Promise((r) => server.close(r));
    }
  }
}

// The landing's Tools button, once the app shell around it is hydrated (Astro drops the island's ssr mark), so a
// failure to open is not taken for a page that was not ready.
async function landingTools(page) {
  assert.equal(new URL(page.url()).pathname, LANDING, "the root did not stay on the English landing");
  const tools = page.locator(".shell button", { hasText: /^Tools$/ });
  await tools.waitFor({ state: "visible" });
  await page.waitForFunction(() => {
    const island = document.querySelector(".shell")?.closest("astro-island");
    return island && !island.hasAttribute("ssr");
  });
  return tools;
}

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
const markedRows = (page, menu) => page.locator(`${menu} .tasty-menuitem--active`).allTextContents();

for (const motion of ["reduce", "no-preference"]) {
  test(`the Tools menu takes the keys on open and the first Down marks Command palette (${motion})`, async () => {
    await withPage(LANDING, motion, async (page) => {
      const tools = await landingTools(page);
      await tools.click();
      const menu = '[role="menu"][aria-label="Tools"]';
      await page.locator(menu).waitFor({ state: "visible" });
      // The menu focuses itself in the effect after it is placed; wait for that effect, not for the focus.
      await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
      assert.equal(await focused(page), "menu:Tools", "the focus after the menu opened");
      assert.deepEqual(await markedRows(page, menu), [], "a row was marked before any key");
      await page.keyboard.press("ArrowDown");
      assert.equal(await focused(page), "row:Command palette…", "the focus after the first Down");
      assert.deepEqual((await markedRows(page, menu)).map((t) => t.trim()), ["Command palette…"], "the row the first Down marked");
    });
  });
}

// The first Down sent in the same task as the menu taking the focus, the earliest a key can reach the menu: the row it
// focuses must already be visible, not still inheriting the menu's hidden through a transition.
test("a Down right as the Tools menu takes the focus moves the focus to Command palette (reduce)", async () => {
  await withPage(LANDING, "reduce", async (page) => {
    const tools = await landingTools(page);
    await page.evaluate(() => {
      document.addEventListener("focusin", function down(e) {
        if (e.target.getAttribute?.("role") !== "menu" || e.target.getAttribute("aria-label") !== "Tools") return;
        document.removeEventListener("focusin", down, true);
        e.target.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", code: "ArrowDown", bubbles: true, cancelable: true }));
        window.__toolsDownSent = true;
      }, true);
    });
    await tools.click();
    const menu = '[role="menu"][aria-label="Tools"]';
    await page.waitForFunction(() => window.__toolsDownSent === true);
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
    assert.deepEqual((await markedRows(page, menu)).map((t) => t.trim()), ["Command palette…"], "the row the Down marked");
    assert.equal(await focused(page), "row:Command palette…", "the focus after the Down sent as the menu took the focus");
  });
});

test("the first Tab from Columns reaches Proto and Esc returns to Columns (reduce)", async () => {
  await withPage(LANDING, "reduce", async (page) => {
    const tools = await landingTools(page);
    await tools.click();
    await page.locator('[role="menu"][aria-label="Tools"] [role="menuitem"]', { hasText: "Listening ports…" }).click();
    const columns = page.locator('[data-ports-window] [aria-label="Columns"]').first();
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

// The live room's inner height, the open menu's box and whether the marked Git row lies whole inside both the menu's
// box and the room's inner box.
const roomState = (page) =>
  page.evaluate(() => {
    const room = document.querySelector("[data-tools-live]");
    const menu = room.querySelector('[role="menu"][aria-label="Tools"]');
    const git = Array.from(menu.querySelectorAll('[role="menuitem"]')).find((r) => r.textContent.trim() === "Git");
    const rr = room.getBoundingClientRect();
    const top = rr.top + room.clientTop;
    const m = menu.getBoundingClientRect();
    const g = git.getBoundingClientRect();
    return {
      room: room.clientHeight,
      menu: m.height,
      menuInRoom: m.top >= top - 0.5 && m.bottom <= top + room.clientHeight + 0.5,
      gitWhole: g.top >= m.top - 0.5 && g.bottom <= m.bottom + 0.5 && g.top >= top - 0.5 && g.bottom <= top + room.clientHeight + 0.5,
      gitFocused: document.activeElement === git,
      scrollY: window.scrollY,
    };
  });

for (const motion of ["reduce", "no-preference"]) {
  test(`the Tools menu refits when its room changes size, with Git kept in view (${motion})`, async () => {
    await withPage(POPUPS, motion, async (page) => {
      const button = page.locator("[data-tools-live] button", { hasText: /^Tools$/ });
      await button.waitFor({ state: "visible" });
      await button.scrollIntoViewIfNeeded();
      await button.click();
      await page.locator('[data-tools-live] [role="menu"][aria-label="Tools"]').waitFor({ state: "visible" });
      await page.waitForFunction(() => document.activeElement?.getAttribute("aria-label") === "Tools");
      await page.keyboard.press("Shift+Tab");
      const full = await roomState(page);
      assert.equal(full.gitFocused, true, "Shift+Tab did not mark Git");
      const shrink = full.room - 60;
      assert.ok(full.menu > shrink, `the menu (${full.menu}) is not taller than the room it will get (${shrink})`);
      const original = await page.evaluate(() => document.querySelector("[data-tools-live]").style.height);

      // Shrink the room alone, with no window resize; the room's border stays, so its outer height is inner + 2.
      await page.evaluate((h) => { document.querySelector("[data-tools-live]").style.height = `${h + 2}px`; }, shrink);
      await page.waitForFunction((h) => document.querySelector("[data-tools-live]").clientHeight === h, shrink);
      await page.waitForFunction(() => {
        const room = document.querySelector("[data-tools-live]");
        const m = room.querySelector('[role="menu"][aria-label="Tools"]').getBoundingClientRect();
        return Math.abs(m.height - room.clientHeight) < 0.5;
      }, null, { timeout: 2000 }).catch(() => {});
      const small = await roomState(page);
      assert.equal(small.room, shrink, "the room did not take its new height");
      assert.ok(Math.abs(small.menu - Math.min(full.menu, small.room)) < 0.5, `the menu is ${small.menu} high in a ${small.room} room`);
      assert.equal(small.menuInRoom, true, "the menu does not lie inside the room");
      assert.equal(small.gitWhole, true, "Git is cut after the room shrank");
      assert.equal(small.gitFocused, true, "Git lost the focus after the room shrank");
      assert.equal(small.scrollY, full.scrollY, "the page scrolled when the room shrank");

      // Give the room its height back: the menu grows to its first height and Git stays in view.
      await page.evaluate((h) => { document.querySelector("[data-tools-live]").style.height = h; }, original);
      await page.waitForFunction((h) => document.querySelector("[data-tools-live]").clientHeight === h, full.room);
      await page.waitForFunction((h) => {
        const room = document.querySelector("[data-tools-live]");
        return Math.abs(room.querySelector('[role="menu"][aria-label="Tools"]').getBoundingClientRect().height - h) < 0.5;
      }, full.menu, { timeout: 2000 }).catch(() => {});
      const back = await roomState(page);
      assert.ok(Math.abs(back.menu - full.menu) < 0.5, `the menu is ${back.menu} high after the room grew back, was ${full.menu}`);
      assert.equal(back.gitWhole, true, "Git is cut after the room grew back");
      assert.equal(back.gitFocused, true, "Git lost the focus after the room grew back");

      // A window resize that changes the room's height: under reduced motion the room's own height change can still be
      // under way when the resize arrives, so the menu must follow the room's final height, not the one read then.
      await page.setViewportSize({ width: 1440, height: 300 });
      await page.waitForFunction(() => {
        const room = document.querySelector("[data-tools-live]");
        const h = room.clientHeight;
        return new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r(room.clientHeight === h && h < 200))));
      });
      await page.waitForFunction(() => {
        const room = document.querySelector("[data-tools-live]");
        return Math.abs(room.querySelector('[role="menu"][aria-label="Tools"]').getBoundingClientRect().height - room.clientHeight) < 0.5;
      }, null, { timeout: 2000 }).catch(() => {});
      const low = await roomState(page);
      assert.ok(Math.abs(low.menu - Math.min(full.menu, low.room)) < 0.5, `after the window resize the menu is ${low.menu} high in a ${low.room} room`);
      assert.equal(low.gitWhole, true, "Git is cut after the window resize");
      assert.equal(low.gitFocused, true, "Git lost the focus after the window resize");
    });
  });
}

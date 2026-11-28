// Browser tests for the banner more menu trigger in the vendor kit (vendor/ui_kits/terminal/overlays/banner.jsx,
// useBannerMoreMenu, on the shared fresh-press contract in vendor/components/core/fresh-press.js). Independent
// activations of the trigger (click(), detail 0) must each toggle the menu: two in one JS task, and the ones a script
// makes while a Space that began on another control is released on the trigger. That release itself still runs nothing.
// A pointer press on the trigger of the open menu closes it, and its release on the trigger opens it again with the
// focus in the menu, as the app does; released off the trigger, the menu stays closed.
// The tests drive the gallery's live specimen on Overlays > Banners, which calls the same hook. They need the build
// (npm run build) and Chromium (playwright-core's, or CHROMIUM_PATH).
import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { dirname, extname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";
import { BASE } from "../src/lib/base.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");
const prefix = BASE.replace(/\/$/, "");
const PAGE = "/design/gallery/overlays-banners/";
const SPEC = "the-menu-2-rows-anchored-under-the-trigger";
const LIMIT_MS = 30000;

const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".woff2": "font/woff2" };

// Serves dist the way the site is served: the base prefix is taken off the request path.
function serve() {
  const server = createServer((req, res) => {
    let path = decodeURIComponent(new URL(req.url, "http://x").pathname);
    if (prefix && path.startsWith(prefix)) path = path.slice(prefix.length);
    let file = join(dist, path);
    if (existsSync(file) && statSync(file).isDirectory()) file = join(file, "index.html");
    if (!existsSync(file)) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { "Content-Type": MIME[extname(file)] || "application/octet-stream" });
    res.end(readFileSync(file));
  });
  return new Promise((ok, no) => {
    server.once("error", no);
    server.listen(0, "127.0.0.1", () => ok(server));
  });
}

function browserPath() {
  const candidates = [process.env.CHROMIUM_PATH, chromium.executablePath(), "/snap/bin/chromium"].filter(Boolean);
  const found = candidates.find((p) => existsSync(p));
  assert.ok(found, `No browser. Tried: ${candidates.join(", ")}. Set CHROMIUM_PATH.`);
  return found;
}

// The live trigger: the spec's "More options" button outside its inert Views.
const TRIGGER = `#${SPEC} [data-banner-card] [aria-label="More options"]:not([inert] *)`;

// Opens the live specimen and hands its page and trigger to run. The server closes whatever happens after it opened,
// a browser that fails to start included, so the test always returns its result instead of leaving the process waiting
// on an open socket.
async function withTrigger(run) {
  assert.ok(existsSync(join(dist, PAGE, "index.html")), `No built ${PAGE}index.html. Run npm run build first.`);
  const server = await serve();
  let browser = null;
  try {
    browser = await chromium.launch({ executablePath: browserPath() });
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    page.setDefaultTimeout(LIMIT_MS);
    const url = `http://127.0.0.1:${server.address().port}${prefix}${PAGE}#${SPEC}`;
    await page.goto(url, { waitUntil: "load", timeout: LIMIT_MS });
    const trigger = page.locator(TRIGGER);
    await trigger.waitFor({ state: "attached" });
    assert.equal(await trigger.count(), 1, "expected exactly one live trigger");
    assert.equal(await trigger.getAttribute("aria-expanded"), "false");
    await run(page, trigger);
  } finally {
    try {
      if (browser) await browser.close();
    } finally {
      await new Promise((r) => server.close(r));
    }
  }
}

// Let React commit the updates and any effect they schedule.
const settle = (page) => page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
const waitExpanded = (page, value) =>
  page.waitForFunction(([sel, v]) => document.querySelector(sel)?.getAttribute("aria-expanded") === v, [TRIGGER, value]);

test("two independent activations of the banner more trigger in one task toggle the menu twice", async () => {
  await withTrigger(async (page, trigger) => {
    // Control: one independent activation opens the menu, so the test is not passing on a trigger that does nothing.
    await trigger.evaluate((t) => t.click());
    await waitExpanded(page, "true");
    await trigger.evaluate((t) => t.click());
    await waitExpanded(page, "false");

    // Two in one task, from closed: open then closed again.
    await trigger.evaluate((t) => { t.click(); t.click(); });
    await settle(page);
    assert.equal(await trigger.getAttribute("aria-expanded"), "false", "two click() calls in one task left the menu open");
    assert.equal(await page.locator(`#${SPEC} [data-banner-card] [role="menu"][aria-label="Banner options"]:not([inert] *)`).count(), 0);
  });
});

test("click() calls made while a Space from another control is released on the trigger each toggle the menu", async () => {
  await withTrigger(async (page, trigger) => {
    // A plain button next to the live card stands for the other control the Space began on.
    await trigger.evaluate((t) => {
      const b = document.createElement("button");
      b.id = "banner-more-probe";
      b.textContent = "probe";
      t.closest("[data-banner-card]").after(b);
    });

    // Control: a Space pressed and released on the trigger opens the menu, so the release cases below are not passing
    // on a trigger that ignores Space.
    await trigger.focus();
    await page.keyboard.down(" ");
    await page.keyboard.up(" ");
    await waitExpanded(page, "true");
    await trigger.evaluate((t) => t.click());
    await waitExpanded(page, "false");

    // From closed: Space down on the probe, focus moved to the trigger, and on the keyup a listener on document calls
    // the trigger's click() n times. The release itself runs nothing, so the menu ends open only for an odd n.
    for (const [n, want] of [[0, "false"], [1, "true"], [2, "false"]]) {
      await page.locator("#banner-more-probe").focus();
      await page.keyboard.down(" ");
      await trigger.evaluate((t, count) => {
        t.focus();
        const onUp = (e) => {
          if (e.key !== " ") return;
          document.removeEventListener("keyup", onUp);
          for (let i = 0; i < count; i++) t.click();
        };
        document.addEventListener("keyup", onUp);
      }, n);
      await page.keyboard.up(" ");
      await settle(page);
      assert.equal(await trigger.getAttribute("aria-expanded"), want, `${n} click() call(s) during the Space release`);
      if (want === "true") {
        await trigger.evaluate((t) => t.click());
        await waitExpanded(page, "false");
      }
    }
  });
});

test("a pointer press on the open menu's trigger closes it and its release there opens it again", async () => {
  await withTrigger(async (page, trigger) => {
    // The menu's focus() can scroll the page, so the trigger's centre is measured again before every pointer step.
    const centre = async () => {
      const b = await trigger.boundingBox();
      assert.ok(b, "the live trigger has no box");
      return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
    };
    const state = () =>
      trigger.evaluate((t) => ({
        expanded: t.getAttribute("aria-expanded"),
        focus: document.activeElement === t ? "trigger" : document.activeElement?.getAttribute("role") || document.activeElement?.tagName,
      }));

    // Control: a click from closed opens the menu with the focus in it.
    let c = await centre();
    await page.mouse.move(c.x, c.y);
    await page.mouse.down();
    await page.mouse.up();
    await waitExpanded(page, "true");
    assert.deepEqual(await state(), { expanded: "true", focus: "menu" });

    // Press on the open menu's trigger: the menu closes and the trigger keeps the focus.
    c = await centre();
    await page.mouse.move(c.x, c.y);
    await page.mouse.down();
    await settle(page);
    assert.deepEqual(await state(), { expanded: "false", focus: "trigger" }, "press on the open trigger");

    // Release on the trigger: the menu opens again with the focus in it.
    await page.mouse.up();
    await settle(page);
    assert.deepEqual(await state(), { expanded: "true", focus: "menu" }, "release on the trigger after closing the menu");

    // Press on the open trigger again and release off it, on the specimen's terminal body: the menu stays closed.
    c = await centre();
    await page.mouse.move(c.x, c.y);
    await page.mouse.down();
    await settle(page);
    assert.deepEqual(await state(), { expanded: "false", focus: "trigger" }, "second press on the open trigger");
    // A point in the terminal body that the press has left uncovered, checked as the real hit target, so the release
    // is known to land on the terminal and not on the card or the trigger.
    const off = await trigger.evaluate((t) => {
      // The nearest ancestor of the trigger that also holds a terminal body is the specimen's scope.
      let scope = t.parentElement;
      while (scope && !scope.querySelector("[data-terminal-content]")) scope = scope.parentElement;
      const term = scope && scope.querySelector("[data-terminal-content]");
      if (!term) return null;
      const r = term.getBoundingClientRect();
      for (let y = r.bottom - 4; y > r.top; y -= 8) {
        for (const x of [r.left + 8, r.left + r.width / 2, r.right - 8]) {
          const hit = document.elementFromPoint(x, y);
          if (hit && term.contains(hit) && !hit.closest("[data-banner-card]")) return { x, y };
        }
      }
      return null;
    });
    assert.ok(off, "no uncovered point in the specimen's terminal body");
    await page.mouse.move(off.x, off.y);
    await page.mouse.up();
    await settle(page);
    assert.deepEqual(await state(), { expanded: "false", focus: "trigger" }, "release off the trigger");
  });
});

// Browser test for the banner more menu trigger in the vendor kit (vendor/ui_kits/terminal/overlays/banner.jsx,
// useBannerMoreMenu). Two independent activations of the trigger in one JS task (click() twice, detail 0) must toggle
// the menu twice, so a closed menu ends closed. The test drives the gallery's live specimen on Overlays > Banners, which
// calls the same hook. It needs the build (npm run build) and Chromium (playwright-core's, or CHROMIUM_PATH).
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

test("two independent activations of the banner more trigger in one task toggle the menu twice", async () => {
  assert.ok(existsSync(join(dist, PAGE, "index.html")), `No built ${PAGE}index.html. Run npm run build first.`);
  const server = await serve();
  const browser = await chromium.launch({ executablePath: browserPath() });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    page.setDefaultTimeout(LIMIT_MS);
    const url = `http://127.0.0.1:${server.address().port}${prefix}${PAGE}#${SPEC}`;
    await page.goto(url, { waitUntil: "load", timeout: LIMIT_MS });
    const trigger = page.locator(TRIGGER);
    await trigger.waitFor({ state: "attached" });
    assert.equal(await trigger.count(), 1, "expected exactly one live trigger");
    const expanded = () => trigger.getAttribute("aria-expanded");
    assert.equal(await expanded(), "false");

    // Control: one independent activation opens the menu, so the test is not passing on a trigger that does nothing.
    await trigger.evaluate((t) => t.click());
    await page.waitForFunction((sel) => document.querySelector(sel)?.getAttribute("aria-expanded") === "true", TRIGGER);
    await trigger.evaluate((t) => t.click());
    await page.waitForFunction((sel) => document.querySelector(sel)?.getAttribute("aria-expanded") === "false", TRIGGER);

    // Two in one task, from closed: open then closed again.
    await trigger.evaluate((t) => { t.click(); t.click(); });
    // Let React commit both updates and any effect they schedule.
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
    assert.equal(await expanded(), "false", "two click() calls in one task left the menu open");
    assert.equal(await page.locator(`#${SPEC} [data-banner-card] [role="menu"][aria-label="Banner options"]:not([inert] *)`).count(), 0);
  } finally {
    await browser.close();
    await new Promise((r) => server.close(r));
  }
});

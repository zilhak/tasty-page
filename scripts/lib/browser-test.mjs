// Shared setup for the browser tests in scripts/ (banner-more.test.mjs, reduce-keys.test.mjs): where the build is,
// the URL prefix the site is served under, a static server for that build, and the Chromium to drive. The tests keep
// their own checks and their own cleanup.
import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";
import { BASE } from "../../src/lib/base.mjs";

/** The repository root, two levels above this file (scripts/lib/). */
export const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
/** The built site the tests open. */
export const dist = join(root, "dist");
/** The deployment prefix without its trailing slash: "" when the site is served from the root. */
export const prefix = BASE.replace(/\/$/, "");

const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".woff2": "font/woff2" };

/** Maps a request path to a file under dir the way the site is served: the deployment prefix p is taken off the
 * path when it starts with it. Returns null when there is no file. */
export function fileFor(path, dir = dist, p = prefix) {
  if (p && path.startsWith(p)) path = path.slice(p.length);
  let file = join(dir, path);
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, "index.html");
  return existsSync(file) ? file : null;
}

/** Serves dist on a free loopback port. Resolves to the listening server. */
export function serve(dir = dist, p = prefix) {
  const server = createServer((req, res) => {
    const file = fileFor(decodeURIComponent(new URL(req.url, "http://x").pathname), dir, p);
    if (!file) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { "Content-Type": MIME[extname(file)] || "application/octet-stream" });
    res.end(readFileSync(file));
  });
  return new Promise((ok, no) => {
    server.once("error", no);
    server.listen(0, "127.0.0.1", () => ok(server));
  });
}

/** The page URL for a site path ("/", "/design/gallery/x/") on a server from serve(). */
export function urlFor(server, path) {
  return `http://127.0.0.1:${server.address().port}${prefix}${path}`;
}

/** The Chromium to launch: CHROMIUM_PATH, then playwright-core's own, then the snap. */
export function browserPath() {
  const candidates = [process.env.CHROMIUM_PATH, chromium.executablePath(), "/snap/bin/chromium"].filter(Boolean);
  const found = candidates.find((p) => existsSync(p));
  assert.ok(found, `No browser. Tried: ${candidates.join(", ")}. Set CHROMIUM_PATH.`);
  return found;
}

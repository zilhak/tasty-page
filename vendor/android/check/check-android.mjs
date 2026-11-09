/**
 * Measures what npm run check-contrast leaves out: the inside of the Android gallery's specimens. That check measures
 * specimens only under design/gallery and its fixed specimen routes, and its site pass skips [data-gallery-page].
 *
 *   npm run build && node vendor/android/check/check-android.mjs [--dist <dir>] [--json <file>]
 *
 * Opens every built page under android-gallery/, on each language path, in Mocha and Latte, wide and narrow. Fails on: a
 * page error, page-level horizontal scroll, no noindex in the head, anything but one [data-gallery-page], nothing measured
 * in it, an ink below its grade, a frozen cell that differs from its contract row or has none, or an unknown exempt id.
 *
 * The gallery's measure function is read from scripts/check-contrast.mjs when this runs, so its rules are not copied here.
 * That file does not export it, and importing the file would start its run. If the function cannot be found this stops.
 */
import { createServer } from "node:http";
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";
import { BASE } from "../../../src/lib/base.mjs";
import { PART_MAP } from "../../gallery/parts/part-map.js";
import { installPageLib, stylesSettled } from "../../../scripts/contrast-page.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const args = process.argv.slice(2);
const argOf = (name) => (args.includes(name) ? args[args.indexOf(name) + 1] : null);
const dist = resolve(argOf("--dist") ?? join(root, "dist"));
const ROUTE = "android-gallery";
const THEMES = ["mocha", "latte"];
const VIEWPORTS = [{ name: "wide", width: 1440, height: 1000 }, { name: "narrow", width: 390, height: 844 }];

function stop(message) {
  console.error(message);
  process.exit(2);
}

function measureSource() {
  const text = readFileSync(join(root, "scripts/check-contrast.mjs"), "utf8");
  const start = text.indexOf("function measure({");
  const end = text.indexOf("\nasync function run()", start);
  if (start < 0 || end < 0) stop("Cannot find the measure function in scripts/check-contrast.mjs.");
  return text.slice(start, end);
}

// Every built page under the route, on each language path. Which folders hold it comes from the build, not from a list.
function routePages() {
  const pages = [];
  const walk = (dir, rel) => {
    for (const name of readdirSync(dir).sort()) {
      const next = rel ? `${rel}/${name}` : name;
      if (!statSync(join(dir, name)).isDirectory()) {
        if (name === "index.html" && `/${rel}/`.includes(`/${ROUTE}/`)) pages.push(`${rel}/`);
      } else if (next !== "_astro") walk(join(dir, name), next);
    }
  };
  walk(dist, "");
  return pages;
}

const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png" };
function serve() {
  const prefix = BASE.replace(/\/$/, "");
  const server = createServer((req, res) => {
    let path = decodeURIComponent(new URL(req.url, "http://x").pathname);
    if (prefix && path.startsWith(prefix)) path = path.slice(prefix.length);
    let file = join(dist, path);
    if (existsSync(file) && statSync(file).isDirectory()) file = join(file, "index.html");
    if (!existsSync(file)) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { "Content-Type": MIME[extname(file)] || "application/octet-stream" });
    res.end(readFileSync(file));
  });
  return new Promise((ok) => server.listen(0, "127.0.0.1", () => ok(server)));
}

async function launch() {
  const candidates = [process.env.CHROMIUM_PATH, chromium.executablePath(), "/snap/bin/chromium"].filter(Boolean);
  const executablePath = candidates.find((p) => existsSync(p));
  if (!executablePath) stop(`No browser. Tried: ${candidates.join(", ")}. Set CHROMIUM_PATH.`);
  return chromium.launch({ executablePath });
}

async function waitForSpecimens(tab) {
  await tab.waitForLoadState("networkidle", { timeout: 180000 }).catch(() => {});
  let last = -1;
  for (let i = 0; i < 40; i += 1) {
    await tab.waitForTimeout(250);
    const size = await tab.evaluate(() => document.querySelectorAll("[data-gallery-page] *").length);
    if (size === last && !(await tab.evaluate(() => document.querySelector("astro-island[ssr]") !== null))) break;
    last = size;
  }
  await stylesSettled(tab);
}

async function measurePage(context, origin, path, measure, theme, viewport) {
  const problems = [];
  const tab = await context.newPage();
  tab.on("pageerror", (e) => problems.push(`page error: ${String(e).slice(0, 200)}`));
  await tab.goto(`${origin}/${path}?audit=1`, { waitUntil: "load", timeout: 180000 });
  await waitForSpecimens(tab);
  const shape = await tab.evaluate(() => ({
    wrappers: document.querySelectorAll("[data-gallery-page]").length,
    robots: document.head.querySelector('meta[name="robots"]')?.content ?? "",
    scrollWidth: document.documentElement.scrollWidth,
  }));
  if (shape.wrappers !== 1) problems.push(`expected one [data-gallery-page], found ${shape.wrappers}`);
  if (!shape.robots.includes("noindex")) problems.push(`no noindex in the head: "${shape.robots}"`);
  if (shape.scrollWidth > viewport.width) problems.push(`page scrolls sideways: scrollWidth ${shape.scrollWidth} at ${viewport.width}`);
  let m = null;
  if (shape.wrappers === 1) {
    await installPageLib(tab);
    m = await tab.evaluate(`(${measure.source})(${JSON.stringify({ ...measure.args, theme })})`);
    if (m.rows.length + m.text + m.glyph + m.inputs === 0) problems.push("nothing measured");
    m.rows.filter((r) => r.status !== "ok").forEach((r) => problems.push(`${r.status} ${r.contract} ${r.part}: got ${r.got} want ${r.token} on ${r.ground}`));
    m.below.forEach((b) => problems.push(`${b.kind} "${b.text}" ${b.got} on ${b.ground} ${b.ratio} < ${b.grade} at ${b.spec}`));
    m.badExempt.forEach((b) => problems.push(`unknown exempt id ${b.id} at ${b.spec}`));
    // The measure function skips a cell's inside and reads it through its rows, so a cell with no row is not measured at all.
    const known = new Set(measure.args.rows.map((r) => `${r.component}|${r.state}|${r.host}`));
    m.keys.filter((k) => !known.has(k)).forEach((k) => problems.push(`frozen cell ${k} has no contract row, so nothing in it is measured`));
  }
  await tab.close();
  return { path, theme, viewport: viewport.name, scrollWidth: shape.scrollWidth, robots: shape.robots, measured: m && { cells: m.cells, rows: m.rows.length, text: m.text, glyph: m.glyph, inputs: m.inputs, svgs: m.svgs, exempt: m.exemptUses, noGrade: m.gradeNone.length, picture: m.picture }, problems };
}

async function run() {
  if (!existsSync(dist)) stop(`No build at ${dist}. Run npm run build first.`);
  const pages = routePages();
  if (pages.length === 0) stop(`No built page under ${ROUTE}/ in ${dist}.`);
  const data = JSON.parse(readFileSync(join(root, "vendor/tokens/ground-ink-rules.json"), "utf8"));
  const noGradeRoles = new Set(data.roles.filter((r) => r.grade === null).map((r) => r.id));
  const measure = {
    source: measureSource(),
    args: {
      rows: data.components,
      tokens: Object.fromEntries(data.tokens.map((t) => [t.name, t.values])),
      grades: Object.fromEntries(data.roles.map((r) => [r.id, { grade: r.grade, kind: r.kind }])),
      partMap: PART_MAP,
      exemptIds: data.exceptions.filter((e) => e.audit === "subtree").map((e) => e.id),
      noGradeTokens: [...new Set([...data.components, ...data.matrix].filter((r) => noGradeRoles.has(r.role) && r.token).map((r) => r.token))],
    },
  };
  const server = await serve();
  const origin = `http://127.0.0.1:${server.address().port}${BASE.replace(/\/$/, "")}`;
  const browser = await launch();
  const results = [];
  for (const theme of THEMES) {
    for (const viewport of VIEWPORTS) {
      const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height } });
      await context.addInitScript((name) => localStorage.setItem("tasty-theme", name), theme);
      for (const path of pages) {
        const r = await measurePage(context, origin, path, measure, theme, viewport);
        results.push(r);
        const c = r.measured;
        console.log(`${theme} ${viewport.name} /${path}: ${c ? `cells ${c.cells}, rows ${c.rows}, text ${c.text}, shapes ${c.glyph} in ${c.svgs} svgs, inputs ${c.inputs}, no grade ${c.noGrade}, on a picture ${c.picture}` : "not measured"}, scrollWidth ${r.scrollWidth}, problems ${r.problems.length}`);
        r.problems.forEach((p) => console.log(`  ${p}`));
      }
      await context.close();
    }
  }
  await browser.close();
  server.close();
  if (argOf("--json")) writeFileSync(argOf("--json"), JSON.stringify(results, null, 1));
  const bad = results.reduce((sum, r) => sum + r.problems.length, 0);
  console.log(bad > 0 ? `check-android: FAILED, ${bad} problems` : `check-android: passed, ${results.length} passes`);
  process.exit(bad > 0 ? 1 : 0);
}

run();

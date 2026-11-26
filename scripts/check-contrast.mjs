/**
 * Renders the built site in Mocha and Latte and measures what is on screen: every gallery page against the contract, as
 * vendor/RULES.md section 14 and vendor/gallery/README.md "The check" say, and the site's own pages against
 * vendor/RULES.md section 15, in contrast-site.mjs.
 *
 *   npm run build && npm run check-contrast -- [--json <file>] [--site-only | --gallery-only] [--page <key>]
 *
 * On a gallery page, fails on: a contract row with no frozen cell, a part that cannot be found, an ink that is not the row's
 * token, an ink below its grade, invalid data-parts, other text below 4.5, any painted shape of another glyph below 3,
 * an unknown exempt id, or nothing measured. An ink inside a disabled ancestor is measured at its grade unless it is a no-grade token.
 * Shapes composite through their own fill or stroke opacity and every opacity above them, a g inside the svg included.
 * --page names one gallery page and leaves the site pages out, as --gallery-only does; the two can go together, and then
 * only that page is measured. An unknown or repeated option, a missing or empty value, --site-only with --gallery-only or
 * --page, and a page key the build lacks exit 2 before the browser starts (parseArgs() in contrast-args.mjs).
 * Browser: CHROMIUM_PATH, else the Playwright browser, else /snap/bin/chromium.
 * Time limit: from after the built pages are listed, the whole run, and any span with no progress (a browser call starting, or a step of the run such as
 * listen, launch or a context), are limited (TOTAL_S and STALL_S below, or CONTRAST_TIMEOUT_S and CONTRAST_STALL_S in
 * seconds). Past either it starts closing the browser, prints what was in flight, and waits for the close up to
 * CLOSE_GRACE_MS and, at the same time, for the --json report as below, then up to FLUSH_GRACE_MS for stderr, and exits 3,
 * also when the close or the report fails or runs late. It cannot stop a run held by synchronous work in this process
 * (contrast-watchdog.mjs), the report's JSON.stringify included.
 * Report: --json is written by a child process (contrast-report.mjs) within CLOSE_GRACE_MS, and a writer killed past
 * that is waited for up to REAP_GRACE_MS more. A finished run writes it after the time limit has stopped. If the write
 * fails it exits 1, if it runs late 3, each after one stderr line and up to FLUSH_GRACE_MS for stderr, and without the
 * verdict line. A timed out run exits 3 whatever its partial report did. After 1 or 3 the file may be missing, empty or
 * cut short. The child shares this process's stdout and stderr, so /dev/stdout and /dev/stderr reach the caller as paths,
 * with limits: on a pipe the report mixes with the summary and verdict lines; on a regular file the child opens it again
 * from the start, so the report overwrites what was written before it and a later line can overwrite the report; on a
 * socket it cannot be opened (ENXIO), so a finished run exits 1 and a timed out run 3. A separate file is the safe path.
 * scripts/contrast-cli.test.mjs runs this file with a stand-in browser to pin the exits before the browser and on a timeout.
 */
import { createServer } from "node:http";
import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";
import { BASE } from "../src/lib/base.mjs";
import { DEFAULT_LANG, LANGS } from "../src/lib/langs.mjs";
import { PART_MAP } from "../vendor/gallery/parts/part-map.js";
import { USAGE, parseArgs } from "./contrast-args.mjs";
import { reportExit, timeoutWriteNote, writeReport } from "./contrast-report.mjs";
import { measureGallery } from "./contrast-gallery.mjs";
import { installPageLib, missingCellRows, stylesSettled } from "./contrast-page.mjs";
import { CHECK_LOCALE, SPECIMEN_ROUTES, emptySiteTally, galleryPages, measureRest, reportChrome, runSite, sitePages, siteRules } from "./contrast-site.mjs";
import { closingTab, createWatchdog, tracked } from "./contrast-watchdog.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");
// Set first thing in run(), before anything that can time out.
let opts = null;
const THEMES = ["mocha", "latte"];
const EXPECTED_PAGES = 15;
// A full run takes about 230s here and 250-330s in CI. The total limit is about three times that, and leaves room in the
// Design job's 20 minutes: up to 65s before this step, 900s, 10s to close and write, 2s to reap the writer and 2s to flush come to about 979s. The stall limit
// is above the longest single wait with a limit of its own, 180s (launch, gallery goto and networkidle).
const TOTAL_S = 900;
const STALL_S = 300;
// How long writing the report may take, and past the time limit closing the browser too, then how long stderr may take.
const CLOSE_GRACE_MS = 10000;
const FLUSH_GRACE_MS = 2000;
// How long a killed report writer is waited for after its grace time, before the run ends without it.
const REAP_GRACE_MS = 2000;

const data = JSON.parse(readFileSync(join(root, "vendor/tokens/ground-ink-rules.json"), "utf8"));
const tokens = Object.fromEntries(data.tokens.map((t) => [t.name, t.values]));
const grades = Object.fromEntries(data.roles.map((r) => [r.id, { grade: r.grade, kind: r.kind }]));
const exemptIds = data.exceptions.filter((e) => e.audit === "subtree").map((e) => e.id);
// A token an ink may carry with no grade: its role has none, in some row or cell of the file.
const noGradeRoles = new Set(data.roles.filter((r) => r.grade === null).map((r) => r.id));
const noGradeTokens = new Set([...data.components, ...data.matrix].filter((r) => noGradeRoles.has(r.role) && r.token).map((r) => r.token));

// The one place the run exits. Only the first call counts, so a later path cannot replace the code once it is settled.
let exiting = false;
function finish(code) {
  if (exiting) return;
  exiting = true;
  process.exit(code);
}

function fail(message) {
  console.error(message);
  finish(2);
}

// Seconds from the environment, as a whole number Node can hold in one timer (2^31 - 1 ms).
function seconds(name, fallback) {
  const raw = process.env[name];
  if (raw === undefined) return fallback;
  if (!/^[0-9]+$/.test(raw) || Number(raw) < 1 || Number(raw) > 2147483) fail(`${name} must be a whole number of seconds from 1 to 2147483, got ${JSON.stringify(raw)}.`);
  return Number(raw);
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
  return new Promise((ok, no) => {
    server.once("error", no);
    server.listen(0, "127.0.0.1", () => ok(server));
  });
}

// The gallery pages a run measures. A build without design/gallery, or without one of the pages every build has, is refused.
function builtGallery() {
  const { pages, missing } = galleryPages(dist);
  if (pages === null) fail("No built gallery. Run npm run build first.");
  if (missing.length > 0) fail(`Built gallery is missing ${missing.map((p) => `${p}index.html`).join(", ")}. Run npm run build first.`);
  return pages;
}

// Specimens are measured once, on the default language path. Each other language path repeats the same source, so the site
// pass measures only what differs: the shared parts around the specimen. This fails if one of those paths goes missing.
function languageGalleries() {
  const built = sitePages(dist);
  const counts = LANGS.filter((row) => row.code !== DEFAULT_LANG).map((row) => ({
    code: row.code,
    pages: built.filter((path) => path.startsWith(`${row.prefix}design/gallery/`)).length,
  }));
  const short = counts.filter((c) => c.pages !== EXPECTED_PAGES);
  if (short.length > 0) fail(`Expected ${EXPECTED_PAGES} gallery pages per language, found ${short.map((c) => `${c.code} ${c.pages}`).join(", ")}.`);
  return counts;
}

async function launch() {
  const candidates = [process.env.CHROMIUM_PATH, chromium.executablePath(), "/snap/bin/chromium"].filter(Boolean);
  const executablePath = candidates.find((p) => existsSync(p));
  if (!executablePath) fail(`No browser. Tried: ${candidates.join(", ")}. Set CHROMIUM_PATH.`);
  return chromium.launch({ executablePath });
}

async function run() {
  try {
    opts = parseArgs(process.argv.slice(2));
  } catch (error) {
    fail(`${error.message}\n${USAGE}`);
    return;
  }
  const totalS = seconds("CONTRAST_TIMEOUT_S", TOTAL_S);
  const stallS = seconds("CONTRAST_STALL_S", STALL_S);
  if (stallS >= totalS) fail(`The stall limit (${stallS}s) must be below the total limit (${totalS}s).`);
  // The built pages are listed, and a wrong page key refused, before the time limit starts: no exit here can meet a timeout.
  const { siteOnly, galleryOnly } = opts;
  const built = siteOnly ? [] : builtGallery();
  if (opts.page !== null && !built.some((p) => p.key === opts.page)) fail(`No gallery page ${JSON.stringify(opts.page)}. Pages: ${built.map((p) => p.key).join(", ")}.\n${USAGE}`);
  const pages = opts.page === null ? built : built.filter((p) => p.key === opts.page);
  if (!siteOnly && opts.page === null && pages.length !== EXPECTED_PAGES + SPECIMEN_ROUTES.length) fail(`Expected ${EXPECTED_PAGES} gallery pages and ${SPECIMEN_ROUTES.length} specimen routes, found ${pages.length} in all.`);
  const galleries = galleryOnly ? [] : languageGalleries();
  // Made before the first wait, so a run that times out at any point can still write what it finished.
  const report = { themes: {}, languageGalleries: galleries };
  const doneThemes = [];
  let current = null;
  const watchdog = createWatchdog({ totalMs: totalS * 1000, stallMs: stallS * 1000, onExpire: (e) => timedOut(e, report, doneThemes, current) });
  held.watchdog = watchdog;
  const startHandle = watchdog.begin("start: listen");
  if (!galleryOnly) console.log(`gallery pages per language path, shared parts only: ${galleries.map((c) => `${c.code} ${c.pages}`).join(", ") || "no other language"}`);
  if (watchdog.check()) return;
  const server = await serve();
  held.server = server;
  const port = server.address().port;
  startHandle.update("start: launch");
  if (watchdog.check()) return;
  const browser = await launch();
  held.browser = browser;
  startHandle.end();
  let failed = false;
  const prefix = BASE.replace(/\/$/, "");
  const noGrade = [...noGradeTokens];
  const rules = siteRules(data);
  const origin = `http://127.0.0.1:${port}${prefix}`;
  for (const theme of THEMES) {
    if (watchdog.check()) return;
    current = theme;
    const chrome = emptySiteTally(rules);
    if (!galleryOnly) {
      const ok = await runSite({ browser, origin, dist, rules, theme, report, watchdog });
      if (ok === null) return;
      if (!ok) failed = true;
    }
    if (siteOnly) { doneThemes.push(theme); continue; }
    const measuredRows = [];
    const t = { cells: 0, rows: 0, ok: 0, unlocated: [], mismatch: [], below: [], diagnostics: [], text: 0, svgs: 0, emptySvgs: 0, glyph: 0, inputs: 0, other: [], exemptUses: {}, badExempt: [], gradeNone: {}, picture: 0, paintServer: 0, hscroll: [], errors: [], passes: {} };
    const base = `${theme} gallery`;
    // The context is an entry only while it is made and while it closes. Each tab is its own entry from before newPage.
    // An entry ends when its call settles, rejected too, so a failed call is not reported in flight.
    const contextHandle = watchdog.begin(`${base} newContext`);
    if (watchdog.expired) return;
    let context;
    try {
      context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, locale: CHECK_LOCALE });
      contextHandle.update(`${base} addInitScript`);
      if (watchdog.expired) return;
      await context.addInitScript((name) => localStorage.setItem("tasty-theme", name), theme);
    } finally {
      contextHandle.end();
    }
    for (const page of pages) {
      const handle = watchdog.begin(`${base} ${page.key} newPage`);
      if (watchdog.expired) return;
      try {
        // The tab closes after the measurement, also when the measurement rejects (closingTab).
        const raw = await context.newPage();
        await closingTab(raw, tracked(raw, watchdog, handle, () => `${base} ${page.key}`), async (tab) => {
          tab.on("pageerror", (e) => t.errors.push(`${page.key}: ${String(e).slice(0, 200)}`));
          await tab.goto(`${origin}/${page.path}?audit=1`, { waitUntil: "load", timeout: 180000 });
          await tab.waitForLoadState("networkidle", { timeout: 180000 }).catch(() => {});
          // Hydration, then stages and fetched tables. Measure once the page stops growing.
          let last = -1;
          for (let i = 0; i < 40; i += 1) {
            await tab.waitForTimeout(500);
            const size = await tab.evaluate(() => document.querySelectorAll("[data-gallery-page] *").length);
            if (size === last && !(await tab.evaluate(() => document.querySelector("astro-island[ssr]") !== null))) break;
            last = size;
          }
          await stylesSettled(tab);
          await installPageLib(tab);
          const m = await tab.evaluate(measureGallery, { rows: data.components, tokens, grades, partMap: PART_MAP, exemptIds, noGradeTokens: noGrade, theme });
          t.passes[page.key] = { cells: m.cells, rows: m.rows.length, text: m.text, glyph: m.glyph, inputs: m.inputs };
          t.cells += m.cells;
          t.rows += m.rows.length;
          for (const r of m.rows) {
            measuredRows.push(r);
            if (r.status === "ok") t.ok += 1;
            else t[r.status].push({ ...r, page: page.key });
          }
          m.diagnostics.forEach((d) => t.diagnostics.push({ ...d, page: page.key }));
          t.text += m.text; t.svgs += m.svgs; t.emptySvgs += m.emptySvgs; t.glyph += m.glyph; t.inputs += m.inputs; t.picture += m.picture; t.paintServer += m.paintServer;
          m.below.forEach((b) => t.other.push({ ...b, page: page.key }));
          for (const [id, n] of Object.entries(m.exemptUses)) t.exemptUses[id] = (t.exemptUses[id] || 0) + n;
          m.badExempt.forEach((b) => t.badExempt.push({ ...b, page: page.key }));
          m.gradeNone.forEach((g) => { t.gradeNone[g.why] = (t.gradeNone[g.why] || 0) + 1; });
          if (m.hscroll) t.hscroll.push(page.key);
          await measureRest(tab, chrome, rules, theme, page.path, "gallery chrome");
        });
      } finally {
        handle.end();
      }
    }
    const closeHandle = watchdog.begin(`${base} context close`);
    try {
      await context.close();
    } finally {
      closeHandle.end();
    }
    // The shared parts around the specimens, measured here on the default language paths the site pass leaves out.
    // A row's below and wrong ink records fail here as on the site (reportChrome in contrast-site.mjs).
    const chromeResult = reportChrome(chrome, rules, theme);
    if (chromeResult.bad > 0) failed = true;
    t.missingCells = opts.page !== null ? [] : missingCellRows(data.components, measuredRows);
    report.themes[theme] = { ...t, chromePasses: chrome.passes, chromeRows: chromeResult.chromeRows };
    const measured = t.rows + t.text + t.glyph + t.inputs;
    const bad = t.unlocated.length + t.mismatch.length + t.below.length + t.diagnostics.length + t.other.length + t.badExempt.length + t.missingCells.length + t.errors.length;
    console.log(`${theme}: cells ${t.cells}, rows ${t.rows} (ok ${t.ok}, unlocated ${t.unlocated.length}, mismatch ${t.mismatch.length}, below ${t.below.length}), text ${t.text}, svgs ${t.svgs} (${t.glyph} painted shapes, ${t.emptySvgs} svgs painting nothing, ${t.paintServer} gradient or pattern paints not measured), inputs ${t.inputs}, below on page ${t.other.length}, on a picture ${t.picture}, missing cells ${t.missingCells.length}, page errors ${t.errors.length}`);
    console.log(`  exempt: ${Object.entries(t.exemptUses).map(([k, v]) => `${k} ${v}`).join(", ") || "none"}`);
    console.log(`  no grade: ${Object.entries(t.gradeNone).map(([k, v]) => `${k} ${v}`).join(", ") || "none"}`);
    if (measured === 0) { console.error(`${theme}: nothing measured`); failed = true; }
    if (bad > 0) failed = true;
    const at = (b) => `${b.page}${b.spec ? `#${b.spec}` : ""}${b.view ? ` (data-view=${b.view})` : ""}`;
    const pairs = new Map();
    for (const b of [...t.mismatch, ...t.below]) pairs.set(`${b.contract} ${b.part}: got ${b.got} want ${b.token} (${b.expect}) on ${b.ground}${b.status === "below" ? ` ${b.ratio} < ${b.grade}` : ""}${b.inks === undefined ? "" : ` (${b.inks} paints, ${b.off} off the token)`} at ${at(b)}`, b);
    for (const b of t.other) pairs.set(`${b.page}#${b.spec}: ${b.kind} ${b.text} ${b.got} on ${b.ground} ${b.ratio} < ${b.grade}`, b);
    [...pairs.keys()].slice(0, 400).forEach((p) => console.log(`  ${p}`));
    t.unlocated.slice(0, 200).forEach((b) => console.log(`  unlocated ${b.contract} ${b.part} at ${at(b)}`));
    t.diagnostics.forEach((d) => console.log(`  invalid data-parts ${JSON.stringify(d.value)} for ${d.contract}|${d.state}|${d.host} at ${at(d)}: ${d.error}`));
    t.badExempt.forEach((b) => console.log(`  unknown exempt id ${b.id} at ${b.page}#${b.spec}`));
    t.missingCells.slice(0, 500).forEach((k) => console.log(`  no cell ${k}`));
    t.errors.forEach((e) => console.log(`  page error ${e}`));
    doneThemes.push(theme);
  }
  const closeHandle = watchdog.begin("closing the browser");
  try {
    await closeBrowser();
    closeServer();
  } finally {
    closeHandle.end();
  }
  // The last look at the deadlines. Past one, the timeout path owns the exit and this run writes nothing more.
  if (!watchdog.stop()) return;
  // The report is written by a child process within its own grace time (contrast-report.mjs).
  const written = opts.json === null ? null : await writeReport(opts.json, JSON.stringify(report, null, 1), { graceMs: CLOSE_GRACE_MS, reapMs: REAP_GRACE_MS });
  const end = reportExit({ failed, json: opts.json, written, graceMs: CLOSE_GRACE_MS });
  if (end.err !== null) {
    process.stderr.on("error", () => {});
    console.error(end.err);
    await flushStderr();
  }
  if (end.out !== null) console.log(end.out);
  finish(end.code);
}

// What the run holds open. Both paths close through these, so the browser and the server each close once, whichever
// path starts first, and the other waits on the same close.
const held = { server: null, browser: null, closing: null, serverClosed: false, watchdog: null };
function closeBrowser() {
  if (!held.closing && held.browser) held.closing = held.browser.close();
  return held.closing;
}
function closeServer() {
  if (held.serverClosed || !held.server) return;
  held.serverClosed = true;
  held.server.close();
}

const flushStderr = () => settleWithin(new Promise((done) => process.stderr.write("", done)), FLUSH_GRACE_MS);

// Settles within the grace time, and says how it settled instead of throwing.
const settleWithin = (promise, ms) => new Promise((done) => {
  const timer = setTimeout(() => done({ late: true }), ms);
  Promise.resolve(promise).then(() => { clearTimeout(timer); done({ ok: true }); }, (error) => { clearTimeout(timer); done({ error }); });
});

async function timedOut({ reason, elapsedMs, inFlight }, report, doneThemes, current) {
  try {
    // A closed pipe must not end the run with another code while it closes.
    process.stderr.on("error", () => {});
    const snapshot = {
      complete: false,
      timedOut: { reason, elapsedMs: Math.round(elapsedMs), inFlight: inFlight.map((e) => ({ ...e, ageMs: Math.round(e.ageMs), stepAgeMs: Math.round(e.stepAgeMs) })) },
      languageGalleries: report.languageGalleries,
      themes: Object.fromEntries(doneThemes.filter((name) => report.themes[name]).map((name) => [name, report.themes[name]])),
      site: Object.fromEntries(doneThemes.filter((name) => report.site?.[name]).map((name) => [name, report.site[name]])),
    };
    if (current !== null && !doneThemes.includes(current)) snapshot.incompleteTheme = current;
    const closing = closeBrowser();
    closeServer();
    const s = (ms) => (ms / 1000).toFixed(0);
    console.error(`check-contrast: TIMED OUT (${reason}) after ${s(elapsedMs)}s`);
    inFlight.forEach((e) => console.error(`  in flight ${s(e.ageMs)}s (step ${s(e.stepAgeMs)}s): ${e.label}`));
    const writing = opts.json !== null ? writeReport(opts.json, JSON.stringify(snapshot, null, 1), { graceMs: CLOSE_GRACE_MS, reapMs: REAP_GRACE_MS }) : null;
    const [closed, written] = await Promise.all([settleWithin(closing, CLOSE_GRACE_MS), writing]);
    if (closed.late) console.error(`  the browser did not close within ${CLOSE_GRACE_MS / 1000}s`);
    if (closed.error) console.error(`  closing the browser failed: ${String(closed.error).slice(0, 200)}`);
    const note = timeoutWriteNote({ json: opts.json, written, graceMs: CLOSE_GRACE_MS });
    if (note !== null) console.error(`  ${note}`);
    await flushStderr();
  } finally {
    finish(3);
  }
}

run().catch((error) => {
  // After the time limit, a call refused or a browser closed under a pass rejects here: the timeout path owns the exit.
  if (held.watchdog && held.watchdog.check()) return;
  console.error(error);
  finish(1);
});

/**
 * Runs scripts/check-contrast.mjs itself, without a real browser, to pin how the command ends: the gallery list checks that
 * exit 2 before the browser, and the timed out run that exits 3 with or without its partial --json report.
 *
 * Needs a built dist (npm run build) and Linux: it reads /proc and makes a FIFO. CI runs it after the build step.
 *
 * The check finds its dist next to its own scripts folder, so the test copies scripts/ and dist/ to a scratch root and links
 * the rest. Each case moves files in the copy only, and puts them back. CHROMIUM_PATH names a stand-in that never answers,
 * so the run stalls at launch and the 1s stall limit ends it. Each case runs in its own folder with its stdout and stderr in
 * files there. Every process of a case carries a marker in its environment, and after the command exits the case looks for
 * marked processes still running: one that had to be killed fails the case.
 */
import assert from "node:assert/strict";
import { execFileSync, spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import {
  chmodSync, closeSync, cpSync, existsSync, lstatSync, mkdirSync, mkdtempSync, openSync, readFileSync, readdirSync, readlinkSync,
  renameSync, rmSync, symlinkSync, unlinkSync, writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { after, before, test } from "node:test";
import { DEFAULT_LANG, LANGS } from "../src/lib/langs.mjs";

const repo = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const LINKED = ["src", "vendor", "node_modules", "package.json"];
// The whole file's time. A case that would run past it fails and cleans up; later cases do not start.
const BUDGET_MS = 120000;
const CLI_MS = 30000;
const firstStart = performance.now();
const left = () => BUDGET_MS - (performance.now() - firstStart);
// Set when a case could not clean up after itself, so later cases do not wait on the same fault.
let aborted = null;

const otherLang = LANGS.find((row) => row.code !== DEFAULT_LANG);
const NEEDED = [
  "design/gallery/index.html",
  "design/tokens/index.html",
  "design/gallery/icons/index.html",
  "design/gallery/components/index.html",
  `${otherLang.prefix}design/gallery/components/index.html`,
];

let root = null;

const walkLinks = (dir, found = []) => {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    const stat = lstatSync(path);
    if (stat.isSymbolicLink()) found.push(path);
    else if (stat.isDirectory()) walkLinks(path, found);
  }
  return found;
};

before(() => {
  const dist = join(repo, "dist");
  const missing = NEEDED.filter((p) => !existsSync(join(dist, p)));
  if (missing.length > 0) throw new Error(`The build lacks ${missing.join(", ")}. Run npm run build first.`);
  // A link that points outside the copy would let a case reach the real build.
  const absolute = walkLinks(dist).filter((p) => isAbsolute(readlinkSync(p)));
  if (absolute.length > 0) throw new Error(`The build holds absolute links, which the copy cannot keep apart: ${absolute.join(", ")}`);
  root = mkdtempSync(join(tmpdir(), "contrast-cli-root-"));
  cpSync(join(repo, "scripts"), join(root, "scripts"), { recursive: true });
  for (const name of LINKED) symlinkSync(join(repo, name), join(root, name));
  cpSync(dist, join(root, "dist"), { recursive: true, verbatimSymlinks: true });
});

after(() => {
  if (root === null) return;
  for (const name of LINKED) {
    try { unlinkSync(join(root, name)); } catch { /* not made */ }
  }
  rmSync(root, { recursive: true, force: true });
});

// The state and start time of a process, or null when it is gone. The name in /proc/<pid>/stat may hold spaces or
// brackets, so the fields are read after the last ")".
function procStat(pid) {
  try {
    const text = readFileSync(`/proc/${pid}/stat`, "utf8");
    const fields = text.slice(text.lastIndexOf(")") + 2).split(" ");
    return { state: fields[0], start: fields[19] };
  } catch (error) {
    if (error.code === "ENOENT" || error.code === "ESRCH") return null;
    throw error;
  }
}

// The marked processes that still run (not gone, not a zombie). A process whose environment cannot be read is not ours,
// unless it is a known pid of the case, which then counts as running.
function marked(marker, known) {
  const entry = `CONTRAST_CLI_TEST_CASE=${marker}`;
  const found = [];
  for (const name of readdirSync("/proc")) {
    if (!/^\d+$/.test(name)) continue;
    const pid = Number(name);
    let env;
    try {
      env = readFileSync(`/proc/${pid}/environ`, "utf8");
    } catch (error) {
      if (known.has(pid) && error.code !== "ENOENT" && error.code !== "ESRCH") {
        const stat = procStat(pid);
        if (stat && stat.state !== "Z") found.push({ pid, ...stat, unreadable: true });
      }
      continue;
    }
    if (!env.split("\0").includes(entry)) continue;
    const stat = procStat(pid);
    if (stat && stat.state !== "Z") found.push({ pid, ...stat });
  }
  return found;
}

const pause = (ms) => new Promise((done) => setTimeout(done, ms));
const within = (promise, ms) => new Promise((done) => {
  const timer = setTimeout(() => done(null), Math.max(ms, 0));
  promise.then((value) => { clearTimeout(timer); done(value); });
});

// Waits for the marked processes to end by themselves. Any that do not within waitMs are killed (each after its start
// time is checked again) and named in killed; those still running after killMs more are in left.
async function settle(marker, known, waitMs, killMs) {
  let live = marked(marker, known);
  const waitEnd = performance.now() + waitMs;
  while (live.length > 0 && performance.now() < waitEnd) {
    await pause(100);
    live = marked(marker, known);
  }
  const killed = [];
  const killEnd = performance.now() + killMs;
  while (live.length > 0) {
    for (const p of live) {
      const now = procStat(p.pid);
      if (!now || now.start !== p.start) continue;
      if (!killed.some((k) => k.pid === p.pid)) killed.push(p);
      try { process.kill(p.pid, "SIGKILL"); } catch { /* gone */ }
    }
    if (performance.now() >= killEnd) break;
    await pause(100);
    live = marked(marker, known);
  }
  return { killed, left: live };
}

const readIf = (path) => {
  try {
    return lstatSync(path).isFile() ? readFileSync(path, "utf8") : null;
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
};

// Runs the check once in a case folder and returns what it left: exit, stdout, stderr, whether the stand-in browser
// started, the report and the folder's new entries. Files named in moves are moved aside in the copied dist meanwhile.
async function runCase(name, args, { moves = [], fifo = false } = {}) {
  if (aborted !== null) assert.fail(`not started, an earlier case could not clean up: ${aborted}`);
  if (left() <= 0) assert.fail(`not started, the ${BUDGET_MS / 1000}s budget is spent`);
  const dir = mkdtempSync(join(tmpdir(), `contrast-cli-${name}-`));
  const marker = randomUUID();
  const pidFile = join(dir, "browser.pid");
  const known = new Set();
  const errors = [];
  const seen = {};
  const moved = [];
  const fds = [];
  let child = null;
  let ended = null;
  try {
    const browser = join(dir, "browser.sh");
    writeFileSync(browser, `#!/bin/bash\necho $$ > ${JSON.stringify(pidFile)}\nexec sleep 60\n`);
    chmodSync(browser, 0o755);
    mkdirSync(join(dir, "tmp"));
    if (fifo) execFileSync("mkfifo", [join(dir, "fifo")]);
    for (const p of moves) {
      renameSync(join(root, "dist", p), join(root, "dist", `${p}.moved`));
      moved.push(p);
    }
    seen.before = readdirSync(dir);
    fds.push(openSync(join(dir, "stdout.txt"), "w"));
    fds.push(openSync(join(dir, "stderr.txt"), "w"));
    child = spawn(process.execPath, [join(root, "scripts/check-contrast.mjs"), ...args], {
      cwd: dir,
      stdio: ["ignore", fds[0], fds[1]],
      env: { ...process.env, CHROMIUM_PATH: browser, CONTRAST_STALL_S: "1", CONTRAST_TIMEOUT_S: "5", TMPDIR: join(dir, "tmp"), CONTRAST_CLI_TEST_CASE: marker },
    });
    ended = new Promise((done) => {
      child.once("error", (error) => done({ error }));
      child.once("exit", (code, signal) => done({ code, signal }));
    });
    if (child.pid) known.add(child.pid);
    for (const fd of fds.splice(0)) closeSync(fd);
    seen.end = await within(ended, Math.min(CLI_MS, left()));
    if (seen.end === null) {
      errors.push(`the check did not exit within ${Math.round(Math.min(CLI_MS, left()) / 1000)}s`);
      try { child.kill("SIGKILL"); } catch { /* gone */ }
      seen.end = (await within(ended, 2000)) || { code: null };
    }
    if (seen.end.error) errors.push(`the check did not start: ${seen.end.error.message}`);
  } catch (error) {
    errors.push(`setup: ${error.message}`);
  } finally {
    try {
      const pid = readIf(pidFile);
      if (pid !== null && /^\d+\s*$/.test(pid)) known.add(Number(pid));
      const { killed, left: still } = await settle(marker, known, 3000, 2000);
      if (killed.length > 0) errors.push(`still running after the check exited, killed: ${killed.map((p) => `${p.pid} ${p.state}`).join(", ")}`);
      if (still.length > 0) {
        aborted = `${name}: still running after SIGKILL: ${still.map((p) => `${p.pid} ${p.state}`).join(", ")}`;
        errors.push(aborted);
      }
    } catch (error) {
      aborted = `${name}: could not look for its processes: ${error.message}`;
      errors.push(aborted);
    }
    for (const fd of fds) {
      try { closeSync(fd); } catch { /* closed */ }
    }
    for (const p of moved) {
      try {
        renameSync(join(root, "dist", `${p}.moved`), join(root, "dist", p));
      } catch (error) {
        aborted = `${name}: could not put back ${p}: ${error.message}`;
        errors.push(aborted);
      }
    }
    try {
      seen.stdout = readIf(join(dir, "stdout.txt")) ?? "";
      seen.stderr = readIf(join(dir, "stderr.txt")) ?? "";
      seen.started = existsSync(pidFile);
      seen.report = readIf(join(dir, "out.json"));
      seen.added = readdirSync(dir).filter((n) => !(seen.before || []).includes(n)).sort();
    } catch (error) {
      errors.push(`reading the results: ${error.message}`);
    }
    try {
      rmSync(dir, { recursive: true, force: true });
    } catch (error) {
      errors.push(`removing ${dir}: ${error.message}`);
    }
  }
  if (left() < 0) errors.push(`the ${BUDGET_MS / 1000}s budget ran out during this case`);
  if (errors.length > 0) assert.fail(`${name}: ${errors.join("; ")}`);
  return { code: seen.end.code, stdout: seen.stdout, stderr: seen.stderr, lines: seen.stderr.split("\n"), started: seen.started, report: seen.report, added: seen.added };
}

const VERDICT = /check-contrast: (passed|FAILED)/;
const assertTimedOut = (run) => {
  assert.equal(run.code, 3, run.stderr);
  assert.ok(run.lines.some((l) => /^check-contrast: TIMED OUT \(stall\) after \d+s$/.test(l)), run.stderr);
  assert.ok(run.stderr.includes("start: launch"), run.stderr);
  assert.doesNotMatch(run.stdout, VERDICT);
  assert.equal(run.started, true, "the stand-in browser was started");
};
const PAGE = ["--gallery-only", "--page", "icons"];

test("a timed out run writes its partial report and exits 3", async () => {
  const run = await runCase("file", [...PAGE, "--json", "out.json"]);
  assertTimedOut(run);
  assert.equal(run.stdout, "");
  const report = JSON.parse(run.report);
  assert.equal(report.complete, false);
  assert.equal(report.timedOut.reason, "stall");
});

test("a timed out run whose report path is a FIFO with no reader says so and exits 3", async () => {
  const run = await runCase("fifo", [...PAGE, "--json", "fifo"], { fifo: true });
  assertTimedOut(run);
  assert.equal(run.stdout, "");
  assert.ok(run.lines.includes("  writing fifo did not finish within 10s"), run.stderr);
  assert.doesNotMatch(run.stderr, /not seen to exit/);
});

test("a timed out run whose report cannot be written says why and exits 3", async () => {
  const run = await runCase("missdir", [...PAGE, "--json", "missing/out.json"]);
  assertTimedOut(run);
  assert.equal(run.stdout, "");
  assert.ok(run.lines.some((l) => l.startsWith("  writing missing/out.json failed: ENOENT")), run.stderr);
});

test("a timed out run without --json writes no report and exits 3", async () => {
  const run = await runCase("nojson", PAGE);
  assertTimedOut(run);
  assert.equal(run.stdout, "");
  assert.doesNotMatch(run.stderr, /writing /);
  assert.deepEqual(run.added, ["browser.pid", "stderr.txt", "stdout.txt"]);
});

test("a missing required page is refused before a wrong page key, and before the browser", async () => {
  const run = await runCase("required", ["--page", "nope"], { moves: ["design/tokens/index.html"] });
  assert.equal(run.code, 2, run.stderr);
  assert.match(run.stderr, /Built gallery is missing design\/tokens\/index\.html/);
  assert.doesNotMatch(run.stderr, /No gallery page/);
  assert.equal(run.started, false);
});

test("a build missing another page's index still runs a page it has, gallery only, and refuses the missing key", async () => {
  const moves = ["design/gallery/icons/index.html"];
  const ran = await runCase("other-page", ["--page", "components"], { moves });
  assertTimedOut(ran);
  assert.equal(ran.stdout, "", "--page measures no language path");
  const refused = await runCase("missing-key", ["--page", "icons"], { moves });
  assert.equal(refused.code, 2, refused.stderr);
  assert.match(refused.stderr, /No gallery page "icons"/);
  assert.equal(refused.started, false);
});

// The gallery pages under a language path, as the check counts them.
const countUnder = (dir) => readdirSync(dir).reduce((n, name) => {
  const path = join(dir, name);
  const stat = lstatSync(path);
  if (stat.isDirectory()) return n + countUnder(path);
  return n + (name === "index.html" ? 1 : 0);
}, 0);

test("--site-only skips the gallery list but counts each language's gallery pages", async () => {
  const counts = LANGS.filter((row) => row.code !== DEFAULT_LANG).map((row) => `${row.code} ${countUnder(join(root, "dist", `${row.prefix}design/gallery`))}`);
  const run = await runCase("site-only", ["--site-only"], { moves: ["design/gallery/index.html"] });
  assertTimedOut(run);
  assert.ok(run.stdout.split("\n").includes(`gallery pages per language path, shared parts only: ${counts.join(", ")}`), run.stdout);
  const short = countUnder(join(root, "dist", `${otherLang.prefix}design/gallery`)) - 1;
  const refused = await runCase("language-short", ["--site-only"], { moves: [`${otherLang.prefix}design/gallery/components/index.html`] });
  assert.equal(refused.code, 2, refused.stderr);
  assert.match(refused.stderr, new RegExp(`Expected \\d+ gallery pages per language, found ${otherLang.code} ${short}`));
  assert.equal(refused.started, false);
});

test("an unknown argument is refused before the browser", async () => {
  const run = await runCase("bogus", ["--bogus"]);
  assert.equal(run.code, 2, run.stderr);
  assert.match(run.stderr, /Unknown argument: "--bogus"/);
  assert.equal(run.started, false);
});

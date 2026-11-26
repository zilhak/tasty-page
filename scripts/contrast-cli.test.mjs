/**
 * Runs scripts/check-contrast.mjs itself, without a real browser, to pin how the command ends: the gallery list checks that
 * exit 2 before the browser, and the timed out run that exits 3 with or without its partial --json report.
 *
 * Needs a built dist (npm run build) and Linux: it reads /proc and makes a FIFO. CI runs it after the build step.
 *
 * The check finds its dist next to its own scripts folder, so the test copies scripts/ and dist/ to a scratch root and links
 * the rest. Each case moves files in the copy only, and puts them back. CHROMIUM_PATH names a stand-in that never answers,
 * so the run stalls at launch and the 1s stall limit ends it. Each case runs in its own folder with its stdout and stderr in
 * files there. A case's processes are the check's descendants seen while it runs and the processes whose environment
 * holds the case's marker, each matched by its start time. After the check exits the case waits for them to end: one
 * that had to be killed fails the case, and no other process is signalled. A copy whose links lead outside it is refused,
 * and a file is moved aside only inside the copy, so the real build is never touched.
 */
import assert from "node:assert/strict";
import { execFileSync, spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import {
  chmodSync, closeSync, cpSync, existsSync, lstatSync, mkdirSync, mkdtempSync, openSync, readFileSync, readdirSync, realpathSync,
  renameSync, rmSync, symlinkSync, unlinkSync, writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { after, before, test } from "node:test";
import { DEFAULT_LANG, LANGS } from "../src/lib/langs.mjs";
import { sitePages } from "./contrast-site.mjs";

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
  root = mkdtempSync(join(tmpdir(), "contrast-cli-root-"));
  cpSync(join(repo, "scripts"), join(root, "scripts"), { recursive: true });
  for (const name of LINKED) symlinkSync(join(repo, name), join(root, name));
  cpSync(dist, join(root, "dist"), { recursive: true, verbatimSymlinks: true });
  mkdirSync(join(root, "cases"));
  // A dist that is itself a link is copied as the link, so the copy would be the real build.
  if (!lstatSync(join(root, "dist")).isDirectory()) throw new Error("dist is a link, which the copy cannot keep apart. Build into a real folder.");
  // A link in the copy that leads outside it would let a case reach the real build or another folder.
  const top = realpathSync(join(root, "dist"));
  const out = walkLinks(join(root, "dist")).filter((p) => {
    try {
      const real = realpathSync(p);
      return real !== top && !real.startsWith(top + sep);
    } catch {
      return true;
    }
  });
  if (out.length > 0) throw new Error(`The build holds links that lead outside it or nowhere, which the copy cannot keep apart: ${out.join(", ")}`);
});

after(() => {
  if (root === null) return;
  for (const name of LINKED) {
    try { unlinkSync(join(root, name)); } catch { /* not made */ }
  }
  rmSync(root, { recursive: true, force: true });
});

// A process's parent, state and start time, or null when it is gone. The name in /proc/<pid>/stat may hold spaces or
// brackets, so the fields are read after the last ")".
function procStat(pid) {
  try {
    const text = readFileSync(`/proc/${pid}/stat`, "utf8");
    const fields = text.slice(text.lastIndexOf(")") + 2).split(" ");
    return { state: fields[0], ppid: Number(fields[1]), start: fields[19] };
  } catch (error) {
    if (error.code === "ENOENT" || error.code === "ESRCH") return null;
    throw error;
  }
}
const procIds = () => readdirSync("/proc").filter((name) => /^\d+$/.test(name)).map(Number);
const running = (stat) => stat !== null && stat.state !== "Z";
const keyOf = (pid, start) => `${pid}:${start}`;

// The case's own processes. Two ways find them, and each confirms the process is the one it saw by its start time:
// - seen: while the check runs, every descendant of the check by parent links. A link counts only when the child started
//   no earlier than the parent and, read again after the scan, has the same start time and either the same parent with
//   the same start time or another parent (the first one ended and the child was handed on). A parent pid reused during
//   the scan therefore cannot pass an unrelated process off as the case's;
// - marked: a process whose environment holds the case's marker entry, read between two stat reads of the same start.
// A process found either way is the case's, so only those are signalled. A pid that cannot be read is skipped by the scan
// and its error kept in errors, so the case fails but its cleanup goes on.
function createTracker(marker) {
  const entry = `CONTRAST_CLI_TEST_CASE=${marker}`;
  const owned = new Map();
  const errors = [];
  const statOf = (pid) => {
    try {
      return procStat(pid);
    } catch (error) {
      if (errors.length < 20) errors.push(`${pid}: ${error.code || error.message}`);
      return null;
    }
  };
  const cmdline = (pid) => {
    try { return readFileSync(`/proc/${pid}/cmdline`, "utf8").split("\0").join(" "); } catch { return ""; }
  };
  const remember = (pid, stat, how) => {
    const key = keyOf(pid, stat.start);
    if (!owned.has(key)) owned.set(key, { pid, start: stat.start, how, cmd: cmdline(pid) });
  };
  const ids = () => {
    try {
      return procIds();
    } catch (error) {
      errors.push(`/proc: ${error.message}`);
      return [];
    }
  };
  return {
    owned,
    errors,
    // Records the descendants of the root process (pid and start time) as they are now.
    descendants(rootPid, rootStart) {
      const stats = new Map();
      for (const pid of ids()) {
        const stat = statOf(pid);
        if (stat !== null) stats.set(pid, stat);
      }
      const below = new Map([[rootPid, rootStart]]);
      let grew = true;
      while (grew) {
        grew = false;
        for (const [pid, stat] of stats) {
          if (below.has(pid) || !below.has(stat.ppid)) continue;
          const parentStart = below.get(stat.ppid);
          if (BigInt(stat.start) < BigInt(parentStart)) continue;
          const child = statOf(pid);
          if (child === null || child.start !== stat.start) continue;
          // Still under the same parent pid: that parent must be the one first seen, or the pid was reused. Under another
          // parent: the first parent ended and the child was handed on, so the link seen first stands.
          if (child.ppid === stat.ppid) {
            const parent = statOf(stat.ppid);
            if (parent === null || parent.start !== parentStart) continue;
          }
          below.set(pid, stat.start);
          grew = true;
          remember(pid, stat, "seen");
        }
      }
    },
    // Records the marked processes as they are now.
    marked() {
      for (const pid of ids()) {
        let env;
        try { env = readFileSync(`/proc/${pid}/environ`, "utf8"); } catch { continue; }
        if (!env.split("\0").includes(entry)) continue;
        const first = statOf(pid);
        if (!running(first)) continue;
        try { env = readFileSync(`/proc/${pid}/environ`, "utf8"); } catch { continue; }
        const second = statOf(pid);
        if (running(second) && second.start === first.start && env.split("\0").includes(entry)) remember(pid, first, "marked");
      }
    },
    // The owned processes that still run: same start time, not a zombie. One that cannot be read counts as running.
    live() {
      return [...owned.values()].filter((p) => {
        let now;
        try { now = procStat(p.pid); } catch { return true; }
        return running(now) && now.start === p.start;
      });
    },
  };
}

const pause = (ms) => new Promise((done) => setTimeout(done, ms));
const within = (promise, ms) => new Promise((done) => {
  const timer = setTimeout(() => done(null), Math.max(ms, 0));
  promise.then((value) => { clearTimeout(timer); done(value); });
});

// Waits for the case's processes to end by themselves until waitMs from now, looking for marked ones again each round.
// Any still running are then killed (after their start time is checked again) and named in killed, and checked until
// killMs after that; those still running are in left. No wait runs past deadline, but one kill pass always runs.
async function settle(tracker, waitMs, killMs, deadline) {
  const until = (end) => Math.max(0, Math.min(end, deadline) - performance.now());
  tracker.marked();
  let live = tracker.live();
  const waitEnd = performance.now() + waitMs;
  while (live.length > 0 && until(waitEnd) > 0) {
    await pause(Math.min(100, until(waitEnd)));
    tracker.marked();
    live = tracker.live();
  }
  const killed = [];
  const killEnd = performance.now() + killMs;
  while (live.length > 0) {
    for (const p of live) {
      let now;
      try { now = procStat(p.pid); } catch { continue; }
      if (!running(now) || now.start !== p.start) continue;
      if (!killed.includes(p)) killed.push(p);
      try { process.kill(p.pid, "SIGKILL"); } catch { /* gone */ }
    }
    if (until(killEnd) <= 0) break;
    await pause(Math.min(100, until(killEnd)));
    tracker.marked();
    live = tracker.live();
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
// Every path under dir, relative to it, folders ending in "/".
const listAll = (dir, rel = "") => readdirSync(join(dir, rel)).sort().flatMap((name) => {
  const path = rel ? `${rel}/${name}` : name;
  return lstatSync(join(dir, path)).isDirectory() ? [`${path}/`, ...listAll(dir, path)] : [path];
});

// Moves a file of the copied dist aside, after checking that its real path is inside the copy and that the place it
// moves to is free, so a case can never move a file of the real build or overwrite one.
function moveAside(p) {
  const from = join(root, "dist", p);
  const real = realpathSync(from);
  const inside = realpathSync(join(root, "dist")) + sep;
  if (!real.startsWith(inside)) throw new Error(`${p} is outside the copied dist (${real})`);
  const to = `${from}.moved-${randomUUID()}`;
  if (existsSync(to)) throw new Error(`${to} is taken`);
  renameSync(from, to);
  return { from, to };
}

// Cleanup needs at most this much after the check's own wait: 2s for a killed check, 3s for its processes, 2s to kill
// the rest, and room for the file work.
const CLEANUP_MS = 10000;

// Runs the check once in a case folder and returns what it left: exit, stdout, stderr, the stand-in browser's pid file,
// the report, the case folder's entries and which of the case's processes still ran when the check exited. Files named in
// moves are moved aside in the copied dist meanwhile.
async function runCase(name, args, { moves = [], fifo = false } = {}) {
  if (aborted !== null) assert.fail(`not started, an earlier case could not clean up: ${aborted}`);
  if (left() <= CLEANUP_MS) assert.fail(`not started, the ${BUDGET_MS / 1000}s budget is spent`);
  const dir = mkdtempSync(join(root, "cases", `${name}-`));
  const marker = randomUUID();
  const pidFile = join(dir, "browser.pid");
  const tracker = createTracker(marker);
  const errors = [];
  const seen = {};
  const moved = [];
  const fds = [];
  let watching = null;
  try {
    const browser = join(dir, "browser.sh");
    writeFileSync(browser, '#!/bin/bash\necho $$ > "$CONTRAST_CLI_TEST_PID_FILE"\nexec sleep 60\n');
    chmodSync(browser, 0o755);
    mkdirSync(join(dir, "tmp"));
    if (fifo) execFileSync("mkfifo", [join(dir, "fifo")]);
    for (const p of moves) moved.push(moveAside(p));
    seen.before = listAll(dir);
    fds.push(openSync(join(dir, "stdout.txt"), "w"));
    fds.push(openSync(join(dir, "stderr.txt"), "w"));
    // Setup may have used the time the cleanup needs. The finally below closes the files.
    if (left() <= CLEANUP_MS) throw new Error(`the ${BUDGET_MS / 1000}s budget ran short before the check started`);
    const child = spawn(process.execPath, [join(root, "scripts/check-contrast.mjs"), ...args], {
      cwd: dir,
      stdio: ["ignore", fds[0], fds[1]],
      env: {
        ...process.env, CHROMIUM_PATH: browser, CONTRAST_STALL_S: "1", CONTRAST_TIMEOUT_S: "5", TMPDIR: join(dir, "tmp"),
        CONTRAST_CLI_TEST_CASE: marker, CONTRAST_CLI_TEST_PID_FILE: pidFile,
      },
    });
    const ended = new Promise((done) => {
      child.once("error", (error) => done({ error }));
      child.once("exit", (code, signal) => done({ code, signal }));
    });
    for (const fd of fds.splice(0)) closeSync(fd);
    if (child.pid) {
      const self = procStat(child.pid);
      if (self) {
        tracker.owned.set(keyOf(child.pid, self.start), { pid: child.pid, start: self.start, how: "check", cmd: "" });
        const look = () => {
          try { tracker.descendants(child.pid, self.start); } catch (error) { tracker.errors.push(`scan: ${error.message}`); }
        };
        watching = setInterval(look, 50);
        look();
      }
    }
    const cliMs = Math.min(CLI_MS, left() - CLEANUP_MS);
    seen.end = await within(ended, cliMs);
    clearInterval(watching);
    watching = null;
    tracker.marked();
    seen.atExit = tracker.live().filter((p) => p.pid !== child.pid);
    if (seen.end === null) {
      errors.push(`the check did not exit within ${Math.round(cliMs / 1000)}s`);
      try { child.kill("SIGKILL"); } catch { /* gone */ }
      seen.end = (await within(ended, Math.min(2000, Math.max(left(), 0)))) || { code: null };
    }
    if (seen.end.error) errors.push(`the check did not start: ${seen.end.error.message}`);
  } catch (error) {
    errors.push(`setup: ${error.message}`);
  } finally {
    if (watching !== null) clearInterval(watching);
    try {
      // Both waits end at their own limits or at the end of the budget, whichever comes first; one kill pass always runs.
      const { killed, left: still } = await settle(tracker, 3000, 2000, firstStart + BUDGET_MS);
      if (killed.length > 0) errors.push(`still running after the check exited, killed: ${killed.map((p) => `${p.pid} (${p.how}) ${p.cmd}`).join(", ")}`);
      if (still.length > 0) {
        aborted = `${name}: still running after SIGKILL: ${still.map((p) => p.pid).join(", ")}`;
        errors.push(aborted);
      }
    } catch (error) {
      aborted = `${name}: could not look for its processes: ${error.message}`;
      errors.push(aborted);
    }
    if (tracker.errors.length > 0) errors.push(`some processes could not be read: ${tracker.errors.join(", ")}`);
    for (const fd of fds) {
      try { closeSync(fd); } catch { /* closed */ }
    }
    for (const { from, to } of moved) {
      try {
        renameSync(to, from);
      } catch (error) {
        aborted = `${name}: could not put back ${from}: ${error.message}`;
        errors.push(aborted);
      }
    }
    try {
      seen.stdout = readIf(join(dir, "stdout.txt")) ?? "";
      seen.stderr = readIf(join(dir, "stderr.txt")) ?? "";
      seen.pid = readIf(pidFile);
      seen.report = readIf(join(dir, "out.json"));
      seen.fifoKept = fifo ? lstatSync(join(dir, "fifo")).isFIFO() : null;
      seen.added = listAll(dir).filter((n) => !(seen.before || []).includes(n));
    } catch (error) {
      errors.push(`reading the results: ${error.message}`);
    }
    try {
      rmSync(dir, { recursive: true, force: true });
    } catch (error) {
      aborted = `${name}: could not remove its folder: ${error.message}`;
      errors.push(aborted);
    }
  }
  if (left() < 0) errors.push(`the ${BUDGET_MS / 1000}s budget ran out during this case`);
  if (errors.length > 0) assert.fail(`${name}: ${errors.join("; ")}`);
  return {
    code: seen.end.code, stdout: seen.stdout, stderr: seen.stderr, lines: seen.stderr.split("\n"), pid: seen.pid,
    started: seen.pid !== null, report: seen.report, fifoKept: seen.fifoKept, added: seen.added, atExit: seen.atExit,
  };
}

const VERDICT = /check-contrast: (passed|FAILED)/;
const assertTimedOut = (run) => {
  assert.equal(run.code, 3, run.stderr);
  assert.ok(run.lines.some((l) => /^check-contrast: TIMED OUT \(stall\) after \d+s$/.test(l)), run.stderr);
  assert.ok(run.stderr.includes("start: launch"), run.stderr);
  assert.doesNotMatch(run.stdout, VERDICT);
  assert.match(run.pid ?? "", /^\d+\n$/, "the stand-in browser was started once");
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
  assert.equal(run.fifoKept, true, "the report path is still the FIFO");
  assert.deepEqual(run.atExit.filter((p) => p.cmd.includes("--input-type=commonjs")), [], "the writer was gone when the check exited");
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
  assert.deepEqual(run.added, ["browser.pid", "stderr.txt", "stdout.txt"], "no report anywhere in the case folder, tmp/ included");
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

// The gallery pages under a language path, listed as the check lists them.
const countUnder = (prefix) => sitePages(join(root, "dist")).filter((p) => p.startsWith(`${prefix}design/gallery/`)).length;

test("--site-only skips the gallery list but counts each language's gallery pages", async () => {
  const counts = LANGS.filter((row) => row.code !== DEFAULT_LANG).map((row) => `${row.code} ${countUnder(row.prefix)}`);
  const run = await runCase("site-only", ["--site-only"], { moves: ["design/gallery/index.html"] });
  assertTimedOut(run);
  assert.ok(run.stdout.split("\n").includes(`gallery pages per language path, shared parts only: ${counts.join(", ")}`), run.stdout);
  const short = countUnder(otherLang.prefix) - 1;
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

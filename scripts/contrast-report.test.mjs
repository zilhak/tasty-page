import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { reportExit, timeoutWriteNote, writeReport } from "./contrast-report.mjs";

const withDir = async (check) => {
  const dir = mkdtempSync(join(tmpdir(), "contrast-report-"));
  try {
    await check(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
};
const alive = (pid) => {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return error.code !== "ESRCH";
  }
};

test("writeReport writes the text, also to a path that starts with a hyphen, relative to the working directory", async () => {
  await withDir(async (dir) => {
    const text = JSON.stringify({ note: "대비 검사 — 결과" }, null, 1);
    const cwd = process.cwd();
    process.chdir(dir);
    try {
      assert.deepEqual(await writeReport("-probe.json", text, { graceMs: 10000, reapMs: 2000 }), { ok: true });
    } finally {
      process.chdir(cwd);
    }
    assert.equal(readFileSync(join(dir, "-probe.json"), "utf8"), text);
  });
});

test("writeReport gives the child's error when the write fails", async () => {
  await withDir(async (dir) => {
    const res = await writeReport(join(dir, "missing", "out.json"), "{}", { graceMs: 10000, reapMs: 2000 });
    assert.match(res.error, /ENOENT/);
  });
});

// Node's error text repeats the path, so a CR, CRLF or LF in it must each become one space for the line to stay one line.
test("writeReport gives a failed write's error on one line, whatever line breaks the path holds", async () => {
  await withDir(async (dir) => {
    const path = join(dir, "missing", "a\rB\r\nC\nD.json");
    const res = await writeReport(path, "{}", { graceMs: 10000, reapMs: 2000 });
    assert.match(res.error, /ENOENT/);
    assert.ok(res.error.includes("a B C D.json"), res.error);
    assert.doesNotMatch(res.error, /[\r\n]/);
    const quoted = `writing ${JSON.stringify(path)} failed: `;
    for (const line of [reportExit({ failed: false, json: path, written: res, graceMs: 10000 }).err, timeoutWriteNote({ json: path, written: res, graceMs: 10000 })]) {
      assert.ok(line.startsWith(quoted), line);
      assert.doesNotMatch(line, /[\r\n]/);
    }
  });
});

test("writeReport gives an error when the writer cannot start, whether spawn fails at once or later", async () => {
  const res = await writeReport("out.json", "{}", { graceMs: 10000, reapMs: 2000, execPath: "/nonexistent/node" });
  assert.match(res.error, /^could not start the writer: .*ENOENT/);
  const sync = await writeReport("out.json", "{}", { graceMs: 10000, reapMs: 2000, execPath: "" });
  assert.match(sync.error, /^could not start the writer: /);
});

test("writeReport writes when the caller's NODE_OPTIONS make ES modules the default", async () => {
  await withDir(async (dir) => {
    const before = process.env.NODE_OPTIONS;
    process.env.NODE_OPTIONS = "--experimental-default-type=module";
    try {
      assert.deepEqual(await writeReport(join(dir, "out.json"), "{}", { graceMs: 10000, reapMs: 2000 }), { ok: true });
    } finally {
      if (before === undefined) delete process.env.NODE_OPTIONS;
      else process.env.NODE_OPTIONS = before;
    }
    assert.equal(readFileSync(join(dir, "out.json"), "utf8"), "{}");
  });
});

// A FIFO with no reader holds the writer's open call. The writer must have reached it before the grace time ends, so the
// test waits for its note first, then checks it was killed and reaped. The test runner never opens the FIFO itself.
test("writeReport kills and reaps a writer held past its grace time", { timeout: 30000 }, async () => {
  await withDir(async (dir) => {
    const fifo = join(dir, "fifo");
    execFileSync("mkfifo", [fifo]);
    let pid = null;
    let reachedAt = null;
    const started = performance.now();
    const res = await writeReport(fifo, "{}", { graceMs: 8000, reapMs: 2000, onWriting: (p) => { pid = p; reachedAt = performance.now(); } });
    // A writer that started too slowly to reach the FIFO within the grace time did not test the held open call.
    assert.notEqual(reachedAt, null, `the writer did not reach the write within the grace time: ${JSON.stringify(res)}`);
    assert.ok(reachedAt - started < 8000);
    assert.deepEqual(res, { late: true, signalled: true, reaped: true });
    assert.equal(alive(pid), false);
  });
});

test("reportExit: the verdict when the report is written or not asked for, 1 when it failed, 3 when it ran late", () => {
  const passed = { code: 0, out: "check-contrast: passed", err: null };
  const failed = { code: 1, out: "check-contrast: FAILED", err: null };
  assert.deepEqual(reportExit({ failed: false, json: null, written: null, graceMs: 10000 }), passed);
  assert.deepEqual(reportExit({ failed: true, json: null, written: null, graceMs: 10000 }), failed);
  assert.deepEqual(reportExit({ failed: false, json: "r.json", written: { ok: true }, graceMs: 10000 }), passed);
  assert.deepEqual(reportExit({ failed: true, json: "r.json", written: { ok: true }, graceMs: 10000 }), failed);
  for (const measuredFail of [false, true]) {
    assert.deepEqual(reportExit({ failed: measuredFail, json: "r.json", written: { error: "ENOENT: no such file" }, graceMs: 10000 }),
      { code: 1, out: null, err: "writing r.json failed: ENOENT: no such file" });
    assert.deepEqual(reportExit({ failed: measuredFail, json: "r.json", written: { late: true, signalled: true, reaped: true }, graceMs: 10000 }),
      { code: 3, out: null, err: "writing r.json did not finish within 10s" });
  }
  assert.equal(reportExit({ failed: false, json: "r.json", written: { late: true, signalled: true, reaped: false }, graceMs: 10000 }).err,
    "writing r.json did not finish within 10s; the writer was not seen to exit");
});

test("timeoutWriteNote: nothing when the partial report is written or not asked for, else what went wrong", () => {
  assert.equal(timeoutWriteNote({ json: null, written: null, graceMs: 10000 }), null);
  assert.equal(timeoutWriteNote({ json: "r.json", written: { ok: true }, graceMs: 10000 }), null);
  assert.equal(timeoutWriteNote({ json: "r.json", written: { error: "EACCES" }, graceMs: 10000 }), "writing r.json failed: EACCES");
  assert.equal(timeoutWriteNote({ json: "r.json", written: { late: true, signalled: true, reaped: true }, graceMs: 10000 }), "writing r.json did not finish within 10s");
  assert.equal(timeoutWriteNote({ json: "r.json", written: { late: true, signalled: true, reaped: false }, graceMs: 10000 }),
    "writing r.json did not finish within 10s; the writer was not seen to exit");
});

test("report lines quote a path that holds a line break, so each stays one line", () => {
  const err = reportExit({ failed: false, json: "a\nb.json", written: { error: "ENOENT" }, graceMs: 10000 }).err;
  assert.equal(err, 'writing "a\\nb.json" failed: ENOENT');
  const late = { late: true, signalled: true, reaped: true };
  assert.equal(reportExit({ failed: false, json: "a\nb.json", written: late, graceMs: 10000 }).err, 'writing "a\\nb.json" did not finish within 10s');
  assert.equal(timeoutWriteNote({ json: "a\nb.json", written: { error: "ENOENT" }, graceMs: 10000 }), 'writing "a\\nb.json" failed: ENOENT');
  assert.equal(timeoutWriteNote({ json: "a\nb.json", written: late, graceMs: 10000 }), 'writing "a\\nb.json" did not finish within 10s');
});

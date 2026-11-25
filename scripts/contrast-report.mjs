/**
 * Writes the --json report of the contrast check, and says how the run ends after it.
 *
 * The check does not open the report file itself. A path such as a FIFO with no reader can hold the open call, and a
 * Node process waiting on that call in its thread pool does not exit even on process.exit(). So a child Node process
 * writes the report, and the check waits for it only up to a grace time. Past that the child is killed and waited for
 * a short while more, and the check ends either way. A signal the kernel holds back (an I/O call that does not return
 * on a kill) can leave the child running after the check has exited.
 *
 * The child gets the report on its stdin and the path as its own argument after --, so a path that starts with a
 * hyphen stays a path, and a relative path reads from the same working directory. It shares the check's stdout and
 * stderr, so a path such as /dev/stdout still reaches the caller. It reports on file descriptor 3: a line "W" just
 * before it writes, and a line "E<message>" when the write fails.
 */
import { spawn } from "node:child_process";

const CHILD = [
  'const fs = require("node:fs");',
  "const chunks = [];",
  'process.stdin.on("data", (c) => chunks.push(c));',
  'process.stdin.on("end", () => {',
  '  fs.writeSync(3, "W\\n");',
  "  try { fs.writeFileSync(process.argv[1], Buffer.concat(chunks)); }",
  '  catch (e) { fs.writeSync(3, "E" + String((e && e.message) || e).replace(/\\n/g, " ") + "\\n"); process.exit(1); }',
  "  process.exit(0);",
  "});",
].join("\n");

const startFailed = (error) => ({ error: `could not start the writer: ${(error && error.message) || error}` });

// { ok: true } when the child wrote the file, { error } when it could not start or the write failed, and
// { late: true, signalled, reaped } when it did not finish within graceMs. signalled says the kill was sent, reaped that
// the child was seen to exit within reapMs after it. onWriting(pid) is called when the child is about to write.
export function writeReport(path, text, { graceMs, reapMs, onWriting = null, execPath = process.execPath }) {
  return new Promise((done) => {
    let child;
    try {
      child = spawn(execPath, ["-e", CHILD, "--", path], { stdio: ["pipe", "inherit", "inherit", "pipe"] });
    } catch (error) {
      done(startFailed(error));
      return;
    }
    let settled = false;
    let startError = null;
    let note = "";
    const settle = (result) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      done(result);
    };
    child.stdio[3].setEncoding("utf8");
    child.stdio[3].on("data", (chunk) => {
      note += chunk;
      if (onWriting && note.split("\n").includes("W")) {
        const call = onWriting;
        onWriting = null;
        call(child.pid);
      }
    });
    child.stdio[3].on("error", () => {});
    child.on("error", (error) => { startError = error; });
    // close comes after the child's pipes have closed, so its last note is in. A child that never started closes too.
    child.on("close", (code, signal) => {
      if (startError) return settle(startFailed(startError));
      if (code === 0) return settle({ ok: true });
      const message = note.split("\n").filter((l) => l.startsWith("E")).map((l) => l.slice(1)).join(" ");
      settle({ error: message || `the writer exited with ${code === null ? signal : code}` });
    });
    child.stdin.on("error", () => {});
    child.stdin.end(text);
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      let signalled = false;
      try { signalled = child.kill("SIGKILL"); } catch { signalled = false; }
      if (child.exitCode !== null || child.signalCode !== null) return done({ late: true, signalled, reaped: true });
      const reap = setTimeout(() => done({ late: true, signalled, reaped: false }), reapMs);
      child.once("exit", () => {
        clearTimeout(reap);
        done({ late: true, signalled, reaped: true });
      });
    }, graceMs);
  });
}

const lateNote = (path, written, graceMs) =>
  `writing ${path} did not finish within ${graceMs / 1000}s${written.reaped ? "" : "; the writer was not seen to exit"}`;

// How a run that finished its measuring ends. out is the verdict line for stdout, err a report line for stderr. A report
// that failed to write ends the run with 1, one that ran late with 3, and neither prints the verdict.
export function reportExit({ failed, json, written, graceMs }) {
  if (json === null || (written && written.ok)) return { code: failed ? 1 : 0, out: failed ? "check-contrast: FAILED" : "check-contrast: passed", err: null };
  if (written.late) return { code: 3, out: null, err: lateNote(json, written, graceMs) };
  return { code: 1, out: null, err: `writing ${json} failed: ${String(written.error).slice(0, 200)}` };
}

// The report line of a timed out run's partial report, or null when it was written or not asked for. The run ends with 3.
export function timeoutWriteNote({ json, written, graceMs }) {
  if (json === null || !written || written.ok) return null;
  if (written.late) return lateNote(json, written, graceMs);
  return `writing ${json} failed: ${String(written.error).slice(0, 200)}`;
}

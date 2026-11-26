<!-- source-hash: 8ed38b0439e6 -->
# Crash and hang reports and logs

When Tasty exits unexpectedly or stops responding, you can collect reports and logs to report the problem.

1. Note the time and what you were doing just before the problem. If Tasty is still frozen, you can also collect a stack sample below before quitting.
2. **Copy `debug.log` from the data folder to another folder before starting Tasty again. The previous contents are cleared when a new instance opens this log.** Copy the relevant plugin logs before restarting the plugins too.
3. Collect `crash-*.log` or `hang-*.log` from the same time, along with the diagnostic information below. If there is no report, send the available logs and describe the symptoms.
4. Redact tokens and personal information from the copies you attach, then report the problem on [GitHub Issues](https://github.com/zilhak/tasty/issues).

## Find the data folder

If you set `TASTY_HOME`, look in that folder. If its value is empty after trimming leading and trailing whitespace, Tasty uses the default folder.

| OS | Default data folder |
|---|---|
| Windows | `%USERPROFILE%\.tasty\` |
| macOS · Linux | `~/.tasty/` |

All paths below are relative to this data folder.

## Which files to collect

| File | Contents and when to save it |
|---|---|
| `crash-reports/crash-*.log` | Crash time, Tasty version, OS and architecture, error location and message, and backtrace. Attach the file that matches the time of the problem |
| `crash-reports/hang-*.log` | In Tasty with a graphical interface (GUI), a record is written when progress is detected to have stopped for more than roughly 5 seconds. Not every hang produces a record. Attach the file that matches the time of the problem |
| `debug.log` | Warnings and above by default. Logs the running Tasty instance and remains after it exits. The next instance to open the file clears it. **Copy it before restarting** |
| `plugins-logs/<id>.log` | Per-plugin logs. **Copy the relevant files before restarting the plugins** |
| `hook-failures.log` · `hook-failures.log.1` | Records of Claude Code and Codex CLI hooks that failed to reach Tasty. Include these for hook problems. Once the log exceeds 256 KiB, it is moved to `.1` before the next entry |

Crash reports are not deleted automatically. Choose files from the time of the problem. `debug.log` may lack early output produced before the log file was opened. Running a CLI command such as `tasty --version` does not clear this file.

Automatic hang detection and hang reports are available only when running Tasty with a graphical interface (GUI). Hang reports include the time spent stalled, the last recorded activity and rendering state, and window focus and occlusion state. On Linux, they also include system load, Tasty CPU time, and execution, wait and scheduling information. If Linux load, CPU or scheduling information cannot be collected, the report shows the reason for each unavailable item. Window focus and occlusion state may be shown as unknown. The last rendering state alone does not establish the cause of a hang.

In Linux and Windows distribution builds, crash report backtraces show Tasty function names. Line numbers for Tasty functions are not included. Windows ZIPs, headless ZIPs and MSI installation folders include `tasty.pdb` alongside `tasty.exe`; no separate download is needed. **Do not delete `tasty.pdb` or move `tasty.exe` on its own.** Without `tasty.pdb` alongside it, backtraces may show incorrect function names. Even with `tasty.pdb` present, function names for some frames may be inaccurate.

## Collect more detailed logs

If the default logs do not explain the problem, raise the log level with `TASTY_LOG` and reproduce it again. **Copy the previous logs first.**

On macOS and Linux, run the following from a terminal outside Tasty to save standard error output (stderr) to `tasty.log`. If Tasty is running, copy its logs and quit it first.

```sh
TASTY_LOG=debug tasty 2> tasty.log
```

Standard error output includes logs, crash messages and backtraces. The Windows GUI build does not show console output, and console output is also difficult to view when launching the macOS app bundle. Collect the logs and reports in the data folder in these cases too.

## Diagnostic commands

Check the version with:

```sh
tasty --version
```

If Tasty is running and responding, collect these outputs too:

```sh
tasty list info
tasty list pressure
```

`tasty list pressure` shows connection and request processing status and diagnostic totals for this run. Restarting resets the totals. For GPU issues or repeated hangs, output from `tasty list gpu-stats` and `tasty list timers` can also help. If a command does not respond, avoid running it repeatedly and see [CLI response delays and connection diagnostics](cli-diagnostics.md).

## Sample the stack while frozen

If Tasty is still running but frozen, OS tools can collect a stack sample. After it exits, you can no longer sample that state.

On Linux, if GDB is installed and you have permission to attach to the process, run `gdb -p <PID>` from a terminal outside Tasty. Replace `<PID>` with the frozen Tasty process ID. Run the following in GDB and save the output:

```text
thread apply all bt
detach
quit
```

GDB stack samples from Linux distribution builds also show Tasty function names, without line numbers for Tasty functions.

If you already have a process sample or dump collected on macOS or Windows, attach it with the tool used and the collection time.

## OS crash records

If you already have an OS crash record, check that it matches the time of the problem and attach it with the tool used and the collection time.

## What to attach and redact

Include the following in your report:

- What you were doing, reproduction steps, time of occurrence, and whether it repeats
- Output of `tasty --version`, OS version and architecture
- Crash or hang reports from that time, `debug.log` copied before restarting, and relevant plugin logs
- Any diagnostic command output, stack sample or OS crash record you could collect

**Redact the following from attachment copies and screenshots.**

- The value of `TASTY_SESSION_TOKEN`: a 64-character hexadecimal string that may appear in terminal screens, environment dumps or `ps` output.
- Your username in home paths, and working folder paths
- Remote attach hostnames and SSH usernames

Check every file you attach, including logs, for tokens and personal information, and redact them. Plugin logs may contain file paths, so redact home paths too. Apply the same checks to dumps and OS records.

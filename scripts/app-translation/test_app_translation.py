#!/usr/bin/env python3
"""Synthetic tests. A fake Codex stands in for the real one and no translated text is used:
the fake marks values with one filler character. Run: python3 -B test_app_translation.py

With TASTY_REPO set to a Tasty checkout, the pinned commit is also prepared and calibrated.
"""
import json
import os
import shutil
import signal
import stat
import subprocess
import sys
import tempfile
import time
import tomllib
import unittest

sys.dont_write_bytecode = True
TOOL = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, TOOL)
import catalog as cat
import rules

FILLER = "\u4e00"

FAKE = r'''#!/usr/bin/env python3
import json, os, re, sys, time
args = sys.argv[1:]
prompt = sys.stdin.read()
control = json.load(open(os.environ["FAKE_CONTROL"], encoding="utf-8")) if os.path.exists(os.environ["FAKE_CONTROL"]) else {}
items = json.loads(re.search(r"<<<INPUT\n(.*)\nINPUT>>>", prompt, re.S).group(1))
with open(os.environ["FAKE_LOG"], "a", encoding="utf-8") as f:
    f.write(json.dumps({"args": args, "ids": [i["id"] for i in items], "items": items, "prompt": prompt, "pid": os.getpid()}, ensure_ascii=False) + "\n")
sandbox = control.get("sandbox", "read-only")
sys.stderr.write("OpenAI Codex v0\n--------\nmodel: fake-model\n")
if sandbox:
    sys.stderr.write(f"sandbox: {sandbox}\n")
sys.stderr.write("reasoning effort: medium\n--------\nuser\n" + prompt[:50] + "\n")
sys.stderr.flush()
time.sleep(control.get("sleep", 0))
if control.get("exit"):
    sys.exit(control["exit"])
out = args[args.index("-o") + 1]
if control.get("no_output"):
    sys.exit(0)
if control.get("not_json"):
    open(out, "w").write("not json")
    sys.exit(0)
result = []
for it in items:
    if it["id"] in control.get("drop", []):
        continue
    value = control.get("overrides", {}).get(it["id"])
    if value is None:
        value = it["en"] if "table_header" in it["constraints"] else "\u4e00 " + it["en"]
    result.append({"id": it["id"], "value": value})
for extra in control.get("extra", []):
    result.append({"id": extra, "value": "x"})
json.dump({"items": result}, open(out, "w", encoding="utf-8"), ensure_ascii=False)
sys.stderr.write("tokens used\n1,234\n")
'''

EN = '''# Tasty Terminal Emulator - English (en)

[meta]
name = "English"

[toast]
char_limit_notice = "Limited to {} characters"
screenshot_saved = "Saved to {}"

[menu.macos]
about = "About {}"
hide = "Hide {}"
quit = "Quit {}"
file = "File"

[file_handler.picker]
when_just_now = "now"
when_minutes = "{} min"
when_hours = "{} hr"
when_yesterday = "prior"
when_days = "{} days"

[cli.remote_profile]
list_header = "NAME             TYPE          HOST/REF                 DETAIL           STATUS"
list_local_header = "ALIAS                SOURCE                       TARGET               IMPORTED"

[cli.passkey]
list_header = "NAME                     KIND"

[cli.help.run]
about = "Run `tasty run` with --fast"
steps = """
First line

- one
- two"""

[settings]
count = "{} items"
count_one = "{} item"
named = "{done} of {total}"
order = "{} of {}"
unit = "pt"
'''
PLUGIN_EN = '''[surface.kind]
html = "HTML"

[settings]
unit = "points"

[html]
"cli.desc" = "Viewer commands"

[html.cli]
desc = "Viewer commands"
'''


def localized(text, name, code):
    out = text.replace('count_one = "{} item"\n', "").replace('name = "English"', f'name = "{name}"')
    return out.replace("English (en)", f"{name} ({code})")


def git(repo, *args):
    env = dict(os.environ, GIT_AUTHOR_NAME="t", GIT_AUTHOR_EMAIL="t@t.invalid", GIT_COMMITTER_NAME="t",
               GIT_COMMITTER_EMAIL="t@t.invalid")
    return subprocess.run(["git", "-C", repo, *args], check=True, capture_output=True, text=True, env=env).stdout.strip()


def load(path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def lines_of(path):
    with open(path, encoding="utf-8") as f:
        return [json.loads(line) for line in f]


def load_toml(path):
    with open(path, "rb") as f:
        return tomllib.load(f)


def read_text(path):
    with open(path, encoding="utf-8") as f:
        return f.read()


def write(path, text):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(text)


def commit_catalogs(repo, en, plugin_en, message="c"):
    for rel, text in (("lang", en), ("crates/tasty-plugin-html/lang", plugin_en)):
        write(f"{repo}/{rel}/en.toml", text)
        write(f"{repo}/{rel}/ko.toml", localized(text, "KO", "ko"))
        write(f"{repo}/{rel}/ja.toml", localized(text, "JA", "ja"))
    git(repo, "add", "-A")
    git(repo, "commit", "-qm", message)
    return git(repo, "rev-parse", "HEAD")


class Base(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.root = tempfile.mkdtemp(prefix="app-translation-test-")
        cls.repo = os.path.join(cls.root, "tasty")
        os.makedirs(cls.repo)
        git(cls.repo, "init", "-q")
        cls.sha = commit_catalogs(cls.repo, EN, PLUGIN_EN)
        cls.tool = os.path.join(cls.root, "tool")
        os.makedirs(cls.tool)
        for name in os.listdir(TOOL):
            if not name.startswith(("test_", "__")):
                shutil.copy(os.path.join(TOOL, name), cls.tool)
        en_entries = len(cat.scan(EN))
        baseline = {
            "catalogs": {
                "lang": {"ko": en_entries - 1, "en": en_entries, "en_chars": sum(len(e.value) for e in cat.scan(EN))},
                "html": {"ko": 4, "en": 4, "en_chars": sum(len(e.value) for e in cat.scan(PLUGIN_EN))},
            },
            "items": en_entries + 3,
            "dotted": en_entries + 2,
            "public": {"local_guide_dir": 0, "account_example": 0},
        }
        with open(os.path.join(cls.tool, "catalog.py"), "a", encoding="utf-8") as f:
            f.write(f"\nBASELINES[{cls.sha!r}] = {baseline!r}\n")
        cls.expected_items = baseline["items"]
        cls.fake = os.path.join(cls.root, "fake-codex")
        write(cls.fake, FAKE)
        os.chmod(cls.fake, os.stat(cls.fake).st_mode | stat.S_IEXEC)
        cls.counter = 0

    @classmethod
    def tearDownClass(cls):
        shutil.rmtree(cls.root, ignore_errors=True)

    def setUp(self):
        type(self).counter += 1
        self.dir = os.path.join(self.root, f"t{self.counter}")
        os.makedirs(self.dir)
        self.state = os.path.join(self.dir, "state")
        self.glossary = os.path.join(self.dir, "glossary.json")
        self.control = os.path.join(self.dir, "control.json")
        self.log = os.path.join(self.dir, "fake.log")
        self.write_glossary()
        self.env = dict(os.environ, FAKE_CONTROL=self.control, FAKE_LOG=self.log)

    def write_glossary(self, **extra):
        g = {"language": "zh-Hans", "display_name": "Display name for tests", "language_order": ["en", "zh-Hans"],
             "style": {"ui": "plain"}, "terms": [{"id": "a", "en": "Tasty", "translate": False, "scope": ["app"]}]}
        g.update(extra)
        write(self.glossary, json.dumps(g))

    def set_control(self, **control):
        write(self.control, json.dumps(control, ensure_ascii=False))

    def tool_cmd(self, *args, tool=None):
        return [sys.executable, "-B", os.path.join(tool or self.tool, "app_translation.py"), *args]

    def run_tool(self, *args, tool=None):
        return subprocess.run(self.tool_cmd(*args, tool=tool), capture_output=True, text=True, env=self.env)

    def with_state(self, command, *args, tool=None, state=None, codex=False):
        extra = ["--codex-bin", self.fake] if codex else []
        return self.run_tool(command, "--state", state or self.state, "--glossary", self.glossary, *extra, *args, tool=tool)

    def prepare(self, *args):
        r = self.run_tool("prepare", "--tasty", self.repo, "--commit", self.sha, "--state", self.state, *args)
        self.assertEqual(r.returncode, 0, r.stderr)
        return r

    def run_pending(self, *args, state=None):
        return self.with_state("run", "--pending", *args, codex=True, state=state)

    def status(self, state=None):
        r = self.with_state("status", "--json", state=state)
        self.assertEqual(r.returncode, 0, r.stderr)
        return json.loads(r.stdout)

    def check(self, *args, state=None):
        path = os.path.join(self.dir, "check.json")
        r = self.with_state("check", "--json", path, *args, state=state)
        self.assertIn(r.returncode, (0, 1), r.stderr)
        return r.returncode, load(path)

    def ledger(self, state=None):
        path = os.path.join(state or self.state, "runs", "ledger.jsonl")
        if not os.path.exists(path):
            return []
        return lines_of(path)

    def raws(self, state=None):
        return sorted(n for n in os.listdir(os.path.join(state or self.state, "runs")) if n.endswith(".raw.json"))

    def calls(self):
        if not os.path.exists(self.log):
            return []
        return lines_of(self.log)

    def decide_all(self, state=None):
        _, data = self.check(state=state)
        ids = sorted({r["id"] for r in data["undecided"]})
        if ids:
            path = os.path.join(self.dir, "keys.txt")
            write(path, "\n".join(ids))
            r = self.with_state("decide", "--keys-file", path, "--keep", "--reason", "synthetic", state=state)
            self.assertEqual(r.returncode, 0, r.stderr)

    def keep_glossary_raw(self, state=None):
        shutil.copy(self.glossary, os.path.join(state or self.state, "glossary", "g.raw.json"))


class Prepare(Base):
    def test_every_entry_lands_in_exactly_one_chunk(self):
        self.prepare()
        placed = []
        for name in os.listdir(os.path.join(self.state, "input")):
            placed += [i["id"] for i in load(os.path.join(self.state, "input", name))["items"]]
        self.assertEqual(len(placed), self.expected_items)
        self.assertEqual(len(set(placed)), self.expected_items)
        self.assertEqual(self.status()["summary"]["not_run"], self.status()["summary"]["chunks"])

    def test_a_small_limit_keeps_entries_with_one_dotted_key_together(self):
        self.prepare("--max-keys", "1")
        chunks = {}
        for name in os.listdir(os.path.join(self.state, "input")):
            for i in load(os.path.join(self.state, "input", name))["items"]:
                chunks[i["id"]] = name
        self.assertEqual(chunks['html:html."cli.desc"'], chunks["html:html.cli.desc"])

    def test_an_unknown_commit_stops(self):
        write(f"{self.repo}/note.txt", "x")
        git(self.repo, "add", "-A")
        git(self.repo, "commit", "-qm", "other")
        other = git(self.repo, "rev-parse", "HEAD")
        git(self.repo, "reset", "--hard", "-q", self.sha)
        r = self.run_tool("prepare", "--tasty", self.repo, "--commit", other, "--state", self.state)
        self.assertEqual(r.returncode, 2)
        self.assertIn("not the pinned commit", r.stderr)

    def test_another_commit_in_the_same_folder_stops(self):
        self.prepare()
        r = self.run_tool("prepare", "--tasty", self.repo, "--commit", self.sha, "--state", self.state)
        self.assertEqual(r.returncode, 0, r.stderr)
        manifest = os.path.join(self.state, "manifest.json")
        data = load(manifest)
        data["commit"] = "0" * 40
        write(manifest, json.dumps(data))
        r = self.run_tool("prepare", "--tasty", self.repo, "--commit", self.sha, "--state", self.state)
        self.assertEqual(r.returncode, 2)
        self.assertIn("already holds", r.stderr)


HEADER_ID = "lang:cli.passkey.list_header"


class FailureRules(Base):
    CASES = [
        ("key removed", {"drop": ["lang:settings.order"]}, "lang:settings.order", "schema_ids"),
        ("{} removed", {"overrides": {"lang:settings.count": FILLER}}, "lang:settings.count", "placeholders"),
        ("{0} mixed", {"overrides": {"lang:settings.order": "{} " + FILLER + " {0}"}}, "lang:settings.order", "placeholder_mix"),
        ("flag changed", {"overrides": {"lang:cli.help.run.about": FILLER + " `tasty run` --slow"}}, "lang:cli.help.run.about", "flags"),
        ("backtick removed", {"overrides": {"lang:cli.help.run.about": FILLER + " `tasty run --fast"}}, "lang:cli.help.run.about", "backtick_parity"),
        ("list line removed", {"overrides": {"lang:cli.help.run.steps": "\n" + FILLER + "\n\n- one"}}, "lang:cli.help.run.steps", "list_lines"),
        ("header width", {"overrides": {HEADER_ID: FILLER * 2 + " " * 10 + FILLER * 2}}, HEADER_ID, "table_header"),
        ("hangul", {"overrides": {"lang:toast.screenshot_saved": "\uac00 {}"}}, "lang:toast.screenshot_saved", "foreign_script"),
        ("kana", {"overrides": {"lang:toast.screenshot_saved": "\u3042 {}"}}, "lang:toast.screenshot_saved", "foreign_script"),
        ("html values differ", {"overrides": {'html:html."cli.desc"': FILLER, "html:html.cli.desc": FILLER * 2}}, "html:html.cli.desc", "duplicate_key"),
        ("digit in the limit", {"overrides": {"lang:toast.char_limit_notice": FILLER + " 200 {}"}}, "lang:toast.char_limit_notice", "char_limit_notice"),
        ("{0} for the app name", {"overrides": {"lang:menu.macos.about": FILLER + " {0}"}}, "lang:menu.macos.about", "macos_app_name"),
        ("placeholder in a menu", {"overrides": {"lang:menu.macos.file": FILLER + " {}"}}, "lang:menu.macos.file", "placeholders"),
        ("toast too long", {"overrides": {"lang:toast.screenshot_saved": FILLER * 189 + "{}"}}, "lang:toast.screenshot_saved", "toast_cap"),
        ("column too wide", {"overrides": {"lang:file_handler.picker.when_minutes": "{}" + FILLER * 5}}, "lang:file_handler.picker.when_minutes", "when_column"),
        ("empty value", {"overrides": {"lang:settings.unit": ""}}, "lang:settings.unit", "empty_value"),
        ("home path", {"overrides": {"lang:settings.unit": "/ho" + "me/someone/" + FILLER}}, "lang:settings.unit", "local_path"),
        ("extra id", {"extra": ["lang:not.in.input"]}, "lang:not.in.input", "schema_ids"),
    ]

    def test_each_rule_catches_its_case(self):
        self.prepare()
        for name, control, key, rule in self.CASES:
            with self.subTest(name):
                shutil.rmtree(self.state)
                self.prepare()
                self.set_control(**control)
                r = self.run_pending()
                self.assertEqual(r.returncode, 0, r.stdout + r.stderr)
                code, data = self.check()
                self.assertEqual(code, 1)
                self.assertIn((rule, key), {(f["rule"], f["id"]) for f in data["failures"]})
                self.assertGreater(self.status()["summary"]["failed"], 0)

    def test_one_key_in_two_catalogs_may_have_two_values(self):
        self.prepare()
        self.set_control(overrides={"html:settings.unit": FILLER * 2})
        self.run_pending()
        self.assertEqual(self.check()[1]["failures"], [])

    def test_a_good_output_has_no_failure(self):
        self.prepare()
        self.set_control()
        self.assertEqual(self.run_pending().returncode, 0)
        code, data = self.check()
        self.assertEqual(data["failures"], [])
        self.assertEqual(code, 0)

    def test_an_edited_raw_is_refused(self):
        self.prepare()
        self.set_control()
        self.run_pending()
        raw = os.path.join(self.state, "runs", self.raws()[0])
        write(raw, read_text(raw).replace(FILLER, "\u4e8c", 1))
        code, result = self.check()
        self.assertEqual(code, 1)
        self.assertIn("raw_integrity", {f["rule"] for f in result["failures"]})
        self.keep_glossary_raw()
        r = self.with_state("assemble", "--out", os.path.join(self.dir, "out"))
        self.assertEqual(r.returncode, 2)
        self.assertIn("raw_integrity", r.stderr)


class Sandbox(Base):
    def test_the_command_asks_for_read_only_and_reads_from_stdin(self):
        self.prepare()
        self.set_control()
        self.run_pending()
        args = self.calls()[0]["args"]
        self.assertEqual(args[0], "exec")
        self.assertEqual(args[args.index("-s") + 1], "read-only")
        self.assertEqual(args[-1], "-")
        self.assertNotIn("--dangerously-bypass-approvals-and-sandbox", args)
        self.assertEqual(self.ledger()[0]["sandbox"], "read-only")

    def test_another_sandbox_stops_everything_and_keeps_nothing(self):
        self.prepare("--max-keys", "3")
        self.set_control(sandbox="danger-full-access", sleep=30)
        started = time.time()
        r = self.run_pending()
        self.assertLess(time.time() - started, 20, "the running call must be killed")
        self.assertEqual(r.returncode, 2)
        self.assertIn("read-only", r.stderr)
        self.assertEqual(self.raws(), [])
        self.assertEqual(len(self.calls()), 1, "no further chunk may start")
        row = self.ledger()[0]
        self.assertEqual(row["status"], "failed")
        self.assertEqual(row["sandbox"], "danger-full-access")

    def test_a_log_without_a_sandbox_line_stops(self):
        self.prepare()
        self.set_control(sandbox="")
        r = self.run_pending()
        self.assertEqual(r.returncode, 2)
        self.assertEqual(self.raws(), [])


class Interruption(Base):
    def start_slow(self, *args):
        self.set_control(sleep=30)
        proc = subprocess.Popen(self.tool_cmd("run", "--state", self.state, "--glossary", self.glossary,
                                              "--codex-bin", self.fake, *args), env=self.env,
                                stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        for _ in range(100):
            if self.calls():
                return proc
            time.sleep(0.1)
        self.fail("the fake never started")

    def wait_gone(self, pid):
        for _ in range(100):
            try:
                os.kill(pid, 0)
            except ProcessLookupError:
                return
            time.sleep(0.1)
        self.fail(f"process {pid} is still running")

    def test_a_killed_tool_leaves_nothing_and_the_chunk_runs_again(self):
        self.prepare("--max-keys", "3")
        total = self.status()["summary"]["chunks"]
        proc = self.start_slow("--pending")
        fake_pid = self.calls()[0]["pid"]
        proc.kill()
        proc.communicate()
        self.wait_gone(fake_pid)
        self.assertEqual(self.raws(), [])
        self.assertEqual(self.ledger(), [])
        self.assertEqual(self.status()["summary"]["not_run"], total)
        self.set_control()
        self.assertEqual(self.run_pending().returncode, 0)
        self.assertEqual(self.status()["summary"]["done"], total)

    def test_a_terminated_tool_records_the_round(self):
        self.prepare()
        proc = self.start_slow("--pending")
        proc.send_signal(signal.SIGTERM)
        proc.communicate()
        self.assertEqual(proc.returncode, 130)
        self.assertEqual(self.raws(), [])
        self.assertEqual(self.ledger()[0]["status"], "failed")
        self.assertEqual(self.ledger()[0]["failure"], "interrupted")
        self.assertEqual(os.listdir(os.path.join(self.state, "locks")), [])

    def test_a_failed_exit_keeps_no_file(self):
        self.prepare()
        for control in ({"exit": 3}, {"no_output": True}, {"not_json": True}):
            with self.subTest(control):
                shutil.rmtree(self.state)
                self.prepare()
                self.set_control(**control)
                r = self.run_pending()
                self.assertEqual(r.returncode, 1)
                self.assertEqual(self.raws(), [])
                self.assertEqual(self.ledger()[0]["status"], "failed")
                self.assertEqual(self.status()["summary"]["not_run"], 1)

    def test_an_orphan_raw_is_not_used_and_moves_to_quarantine(self):
        self.prepare()
        orphan = os.path.join(self.state, "runs", "c001.1.raw.json")
        write(orphan, json.dumps({"items": [{"id": "lang:meta.name", "value": "planted"}]}))
        summary = self.status()["summary"]
        self.assertEqual(summary["orphan_raws"], 1)
        self.assertEqual(summary["not_run"], summary["chunks"])
        self.set_control()
        self.assertEqual(self.run_pending().returncode, 0)
        self.assertEqual(self.raws(), ["c001.2.raw.json"])
        self.assertEqual(len(os.listdir(os.path.join(self.state, "quarantine"))), 1)
        self.assertEqual(self.status()["summary"]["done"], 1)

    def test_the_same_chunk_cannot_run_twice_at_once(self):
        self.prepare()
        proc = self.start_slow("--chunk", "c001")
        second = self.with_state("run", "--chunk", "c001", codex=True)
        self.assertEqual(second.returncode, 1)
        self.assertIn("is being run by process", second.stdout)
        proc.kill()
        proc.communicate()

    def test_a_lock_of_a_dead_process_is_taken_over(self):
        self.prepare()
        dead = subprocess.Popen(["true"])
        dead.wait()
        write(os.path.join(self.state, "locks", "c001"), str(dead.pid))
        self.set_control()
        self.assertEqual(self.run_pending().returncode, 0)

    def test_failed_runs_stop_at_the_limit(self):
        self.prepare()
        self.set_control(exit=3)
        for _ in range(3):
            self.assertEqual(self.run_pending().returncode, 1)
        r = self.run_pending()
        self.assertIn("3 failed rounds", r.stdout)
        self.assertEqual(len(self.calls()), 3)


class Repair(Base):
    def fail_one(self):
        self.prepare()
        self.set_control(overrides={"lang:settings.count": FILLER})
        self.run_pending()

    def test_repair_sends_only_the_failing_key_with_its_reason(self):
        self.fail_one()
        self.set_control()
        r = self.with_state("repair", "--chunk", "c001", codex=True)
        self.assertEqual(r.returncode, 0, r.stderr)
        call = self.calls()[-1]
        self.assertEqual(call["ids"], ["lang:settings.count"])
        self.assertIn("placeholders", call["items"][0]["problems"][0])
        self.assertEqual(call["items"][0]["current"], FILLER)
        self.assertEqual(self.check()[0], 0)
        self.assertEqual(self.status()["summary"]["done"], 1)

    def test_the_limit_holds_across_separate_processes(self):
        self.fail_one()
        for _ in range(3):
            self.assertEqual(self.with_state("repair", "--chunk", "c001", codex=True).returncode, 0)
        before = len(self.calls())
        r = self.with_state("repair", "--chunk", "c001", codex=True)
        self.assertEqual(r.returncode, 2)
        self.assertIn("lang:settings.count", r.stderr)
        self.assertEqual(len(self.calls()), before)

    def test_a_failed_round_counts_toward_the_limit(self):
        self.fail_one()
        self.set_control(exit=3)
        for _ in range(3):
            self.with_state("repair", "--chunk", "c001", codex=True)
        self.set_control()
        r = self.with_state("repair", "--chunk", "c001", codex=True)
        self.assertEqual(r.returncode, 2)


class Staleness(Base):
    def done_state(self):
        self.prepare()
        self.set_control()
        self.assertEqual(self.run_pending().returncode, 0)
        self.assertEqual(self.status()["summary"]["done"], 1)

    def test_a_glossary_change_marks_results_stale_and_pending_leaves_them(self):
        self.done_state()
        self.write_glossary(style={"ui": "changed"})
        self.assertEqual(self.status()["summary"]["stale"], 1)
        calls = len(self.calls())
        self.run_pending()
        self.assertEqual(len(self.calls()), calls, "pending must not rerun stale chunks by itself")
        self.assertEqual(self.check()[0], 1)
        self.assertEqual(self.run_pending("--include-stale").returncode, 0)
        self.assertEqual(self.status()["summary"]["done"], 1)

    def test_a_site_only_term_does_not_mark_results_stale(self):
        self.done_state()
        self.write_glossary(terms=[{"id": "a", "en": "Tasty", "translate": False, "scope": ["app"]},
                                   {"id": "b", "en": "Pricing", "scope": ["site"]}])
        self.assertEqual(self.status()["summary"]["done"], 1)

    def test_a_prompt_change_marks_results_stale(self):
        self.done_state()
        tool = os.path.join(self.dir, "tool")
        shutil.copytree(self.tool, tool)
        with open(os.path.join(tool, "prompt.md"), "a", encoding="utf-8") as f:
            f.write("\nOne more rule.\n")
        r = self.with_state("status", "--json", tool=tool)
        self.assertEqual(json.loads(r.stdout)["summary"]["stale"], 1)

    def test_results_of_an_older_fingerprint_are_not_mixed_in(self):
        self.done_state()
        self.write_glossary(style={"ui": "changed"})
        self.set_control(drop=["lang:settings.count"])
        self.run_pending("--include-stale")
        _, data = self.check()
        self.assertIn(("schema_ids", "lang:settings.count"), {(f["rule"], f["id"]) for f in data["failures"]})


class Review(Base):
    def test_a_decision_ends_when_the_raw_changes(self):
        self.prepare()
        self.set_control()
        self.run_pending()
        key = HEADER_ID  # the fake leaves headers in English
        _, data = self.check()
        self.assertIn(key, {r["id"] for r in data["undecided"]})
        r = self.with_state("decide", "--key", key, "--keep", "--reason", "column words")
        self.assertEqual(r.returncode, 0, r.stderr)
        _, data = self.check()
        self.assertNotIn(key, {r["id"] for r in data["undecided"]})
        self.set_control(overrides={key: "NAME                     KIND"})
        r = self.with_state("retranslate", "--keys", key, "--reason", "look again", codex=True)
        self.assertEqual(r.returncode, 0, r.stderr)
        self.assertIn("look again", self.calls()[-1]["prompt"])
        _, data = self.check()
        self.assertIn(key, {r["id"] for r in data["undecided"]}, "the decision saw another raw")

    def test_only_a_flagged_key_can_be_decided(self):
        self.prepare()
        self.set_control(overrides={HEADER_ID: FILLER * 2 + " " * 23 + FILLER * 2})
        self.run_pending()
        r = self.with_state("decide", "--key", HEADER_ID, "--keep", "--reason", "x")
        self.assertEqual(r.returncode, 2)
        self.assertIn("not on the review list", r.stderr)

    def test_a_retranslated_key_uses_the_latest_round(self):
        self.prepare()
        self.set_control()
        self.run_pending()
        key = "lang:settings.named"
        self.set_control(overrides={key: FILLER * 3 + " {done} {total}"})
        self.with_state("retranslate", "--keys", key, "--reason", "shorter", codex=True)
        calls = self.calls()
        self.assertEqual(calls[-1]["ids"], [key])
        self.assertEqual(self.check()[0], 0)

    def test_review_rules_are_reported(self):
        self.prepare()
        self.write_glossary(terms=[{"id": "t", "en": "Saved", "zh_hans": "\u4e8c", "avoid": ["\u4e09"], "scope": ["app"]}])
        self.set_control(overrides={
            "lang:toast.screenshot_saved": "\u4e09 {}",
            "lang:settings.unit": "pts",
            "lang:settings.count": "\u9ad4 {}",
        })
        self.run_pending()
        _, data = self.check()
        seen = {(r["rule"], r["id"]) for r in data["review"]}
        self.assertIn(("glossary_missing", "lang:toast.screenshot_saved"), seen)
        self.assertIn(("glossary_avoid", "lang:toast.screenshot_saved"), seen)
        self.assertIn(("latin_no_han", "lang:settings.unit"), seen)
        self.assertIn(("traditional_candidate", "lang:settings.count"), seen)
        self.assertIn(("same_as_en", HEADER_ID), seen)

    def test_one_en_with_two_values_is_listed(self):
        self.prepare()
        self.set_control(overrides={"lang:settings.count": FILLER + " {}"})
        self.run_pending()
        _, data = self.check()
        self.assertFalse([r for r in data["review"] if r["rule"] == "same_en_different_value"])
        repeated = EN.replace('count = "{} items"', 'count = "{} of {}"')
        new_sha = commit_catalogs(self.repo, repeated, PLUGIN_EN, "repeat")
        state = os.path.join(self.dir, "delta")
        try:
            r = self.run_tool("prepare", "--tasty", self.repo, "--commit", new_sha, "--state", state, "--delta-from", self.state,
                              "--glossary", self.glossary)
            self.assertEqual(r.returncode, 0, r.stderr)
            self.set_control(overrides={"lang:settings.count": FILLER * 2 + " {} {}"})
            self.run_pending(state=state)
            _, data = self.check(state=state)
            flagged = {r["id"] for r in data["review"] if r["rule"] == "same_en_different_value"}
            self.assertEqual(flagged, {"lang:settings.count", "lang:settings.order"})
        finally:
            git(self.repo, "reset", "--hard", "-q", self.sha)


class Assemble(Base):
    def assemble(self, state=None, out=None):
        return self.with_state("assemble", "--out", out or os.path.join(self.dir, "out"), state=state)

    def test_it_stops_while_anything_is_open(self):
        self.prepare()
        self.keep_glossary_raw()
        self.assertEqual(self.assemble().returncode, 2)
        self.set_control()
        self.run_pending()
        r = self.assemble()
        self.assertEqual(r.returncode, 2)
        self.assertIn("review items have no decision", r.stderr)

    def test_it_needs_the_glossary_raw(self):
        self.prepare()
        self.set_control()
        self.run_pending()
        self.decide_all()
        r = self.assemble()
        self.assertEqual(r.returncode, 2)
        self.assertIn("glossary", r.stderr)

    def test_the_files_read_back_as_the_raw_values(self):
        self.prepare()
        tricky = {
            "lang:settings.unit": 'a "quoted" \\ back\\slash\ttab',
            "lang:settings.named": "  {done} of {total}  ",
            "lang:cli.help.run.steps": 'starts\n\n- one\n- two\nends with quotes""""\\\n"""',
            "lang:toast.char_limit_notice": 'one line that was {} "',
        }
        self.set_control(overrides=tricky)
        self.assertEqual(self.run_pending().returncode, 0)
        self.decide_all()
        self.keep_glossary_raw()
        out = os.path.join(self.dir, "out")
        r = self.assemble(out=out)
        self.assertEqual(r.returncode, 0, r.stderr)
        root = load_toml(f"{out}/lang/zh-Hans.toml")
        self.assertEqual(root["settings"]["unit"], tricky["lang:settings.unit"])
        self.assertEqual(root["settings"]["named"], tricky["lang:settings.named"])
        self.assertEqual(root["cli"]["help"]["run"]["steps"], tricky["lang:cli.help.run.steps"])
        self.assertEqual(root["toast"]["char_limit_notice"], tricky["lang:toast.char_limit_notice"])
        self.assertEqual(root["meta"]["name"], "Display name for tests")
        # Same paths and order as ko, and only values changed around the comments.
        text = read_text(f"{out}/lang/zh-Hans.toml")
        self.assertEqual([e.path for e in cat.scan(text)], [e.path for e in cat.scan(localized(EN, "KO", "ko"))])
        self.assertTrue(text.startswith(cat.FIRST_LINE_ZH))
        self.assertNotIn("count_one", text)
        plugin = load_toml(f"{out}/crates/tasty-plugin-html/lang/zh-Hans.toml")
        self.assertEqual(plugin["html"]["cli.desc"], plugin["html"]["cli"]["desc"])
        manifest = load(f"{out}/MANIFEST.json")
        self.assertEqual(manifest["tasty_commit"], self.sha)
        self.assertEqual(manifest["entries"], self.expected_items)
        self.assertEqual(manifest["execution"]["sandboxes"], ["read-only"])
        self.assertEqual(manifest["execution"]["tokens"], 1234)
        self.assertTrue(manifest["display_name"]["glossary_raw_sha256"])
        self.assertTrue(manifest["review"])
        self.assertEqual(rules.local_path_violations(json.dumps(manifest)), [])


class Delta(Base):
    def test_only_new_and_changed_entries_go_to_codex_and_assemble_merges(self):
        self.prepare()
        self.set_control()
        self.assertEqual(self.run_pending().returncode, 0)
        self.decide_all()
        self.keep_glossary_raw()
        base_values = {r["id"]: r["value"] for raw in self.raws() for r in load(os.path.join(self.state, "runs", raw))["items"]}

        en = EN.replace('unit = "pt"\n', 'fresh = "New words"\n').replace('"{} of {}"', '"{} out of {}"')
        plugin = PLUGIN_EN.replace('"Viewer commands"', '"Viewer actions"')
        new_sha = commit_catalogs(self.repo, en, plugin, "more keys")
        delta_state = os.path.join(self.dir, "delta")
        try:
            r = self.run_tool("prepare", "--tasty", self.repo, "--commit", new_sha, "--state", delta_state,
                              "--delta-from", self.state, "--glossary", self.glossary)
            self.assertEqual(r.returncode, 0, r.stderr)
            self.assertIn("added: lang:settings.fresh", r.stdout)
            self.assertIn("changed: lang:settings.order", r.stdout)
            self.assertIn("removed: lang:settings.unit", r.stdout)
            self.assertIn('changed: html:html."cli.desc"', r.stdout)
            summary = self.status(delta_state)["summary"]
            self.assertEqual(summary["not_run"], 1)
            self.assertTrue(summary["base_complete"])

            r = self.assemble_delta(delta_state)
            self.assertEqual(r.returncode, 2, "the new keys are not translated yet")

            calls = len(self.calls())
            self.assertEqual(self.run_pending(state=delta_state).returncode, 0)
            sent = self.calls()[calls:]
            self.assertEqual(len(sent), 1)
            self.assertEqual(sorted(sent[0]["ids"]), sorted(['lang:settings.fresh', 'lang:settings.order', 'html:html."cli.desc"', "html:html.cli.desc"]))
            self.assertEqual(sent[0]["args"][sent[0]["args"].index("-s") + 1], "read-only")
            self.assertEqual(self.check(state=delta_state)[0], 0)

            self.decide_all(delta_state)
            out = os.path.join(self.dir, "out")
            r = self.with_state("assemble", "--out", out, state=delta_state)
            self.assertEqual(r.returncode, 0, r.stderr)
            root = load_toml(f"{out}/lang/zh-Hans.toml")
            self.assertEqual(root["settings"]["fresh"], FILLER + " New words")
            self.assertEqual(root["settings"]["order"], FILLER + " {} out of {}")
            self.assertNotIn("unit", root["settings"])
            self.assertEqual(root["settings"]["named"], base_values["lang:settings.named"])
            manifest = load(f"{out}/MANIFEST.json")
            self.assertEqual(manifest["tasty_commit"], new_sha)
            self.assertEqual(manifest["based_on_commits"], [self.sha, new_sha])
            self.assertEqual(manifest["delta"]["added"], ["lang:settings.fresh"])
            self.assertNotIn(self.dir, json.dumps(manifest))
        finally:
            git(self.repo, "reset", "--hard", "-q", self.sha)

    def assemble_delta(self, state):
        return self.with_state("assemble", "--out", os.path.join(self.dir, "out"), state=state)


class Unit(unittest.TestCase):
    def test_toml_strings_read_back(self):
        for value in ["", "plain", 'q"q', '"', '""', '"""', 'a""""b', "tab\there", "\\", "end\\", " lead", "trail ",
                      "a\nb", "\na", "a\n", "\n", 'a\n"', 'a\n""', 'a\n"""', 'a\n""""""', "a\\\nb", "a \nb", "\r", "x\ry\nz",
                      "\x01\x7f", "a\tb\nc\td", "\u4e00\n\u4e8c", "'''", "a\n'''"]:
            text = "v = " + cat.toml_string(value) + "\n"
            self.assertEqual(tomllib.loads(text)["v"], value, repr(value))

    def test_the_scanner_keeps_document_order_and_reads_every_form(self):
        text = '# c\n[b]\nz = "1"\n"a.b" = \'2\'\n[a]\nx = """\nm\n"""\n[b.c]\ny = \'\'\'l\'\'\'\n'
        self.assertEqual([e.path for e in cat.scan(text)], [("b", "z"), ("b", "a.b"), ("a", "x"), ("b", "c", "y")])

    def test_non_string_values_stop_the_scan(self):
        with self.assertRaises(cat.CatalogError):
            cat.scan("a = 1\n")

    def test_placeholders_match_the_ported_behaviour(self):
        self.assertEqual(rules.placeholders("{} {}"), rules.placeholders("{1} {0}"))
        self.assertEqual(rules.placeholder_forms("{name} {not valid} {"), (0, set(), {"name"}))
        self.assertNotEqual(rules.placeholders("{a}"), rules.placeholders("{b}"))

    def test_column_starts_measure_cells(self):
        self.assertEqual(rules.column_starts("NAME                     KIND"), [0, 25])
        self.assertEqual(rules.column_starts("\u4e00\u4e8c" + " " * 21 + "x"), [0, 25])

    def test_local_paths(self):
        self.assertTrue(rules.local_path_violations("/ho" + "me/someone/x"))
        self.assertEqual(rules.local_path_violations("/ho" + "me/me/x"), [])
        self.assertEqual(rules.local_path_violations("~/" + rules.LOCAL_GUIDE_DIR + "settings.json"), [])
        self.assertTrue(rules.local_path_violations("see " + rules.LOCAL_GUIDE_DIR + "x"))


@unittest.skipUnless(os.environ.get("TASTY_REPO"), "TASTY_REPO is not set")
class PinnedCommit(unittest.TestCase):
    def test_prepare_and_calibration(self):
        with tempfile.TemporaryDirectory() as d:
            state = os.path.join(d, "state")
            tool = [sys.executable, "-B", os.path.join(TOOL, "app_translation.py")]
            r = subprocess.run(tool + ["prepare", "--tasty", os.environ["TASTY_REPO"], "--commit", cat.BASELINE_COMMIT,
                                       "--state", state], capture_output=True, text=True)
            self.assertEqual(r.returncode, 0, r.stderr)
            self.assertIn("entries 4400, dotted keys 4399", r.stdout)
            self.assertIn("chunks 34, entries in chunks 4400", r.stdout)
            for lang in ("ko", "ja"):
                r = subprocess.run(tool + ["check", "--state", state, "--lang", lang], capture_output=True, text=True)
                self.assertEqual(r.returncode, 0, r.stdout)
                self.assertIn(f"{lang}: failures 0", r.stdout)


if __name__ == "__main__":
    unittest.main()

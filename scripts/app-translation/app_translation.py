#!/usr/bin/env python3
"""Prepare, run, check and assemble the zh-Hans translation of the Tasty catalogs.

Codex writes every translated value. This tool only feeds it, keeps its output
files unchanged and checks them. See README.md.
"""
import argparse
import concurrent.futures
import ctypes
import datetime
import fcntl
import hashlib
import json
import os
import re
import shutil
import signal
import subprocess
import sys
import threading
import time
import tomllib

sys.dont_write_bytecode = True  # keep __pycache__ out of the working tree
TOOL_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, TOOL_DIR)
import catalog as cat
import rules

REPO_ROOT = os.path.dirname(os.path.dirname(TOOL_DIR))
DEFAULT_GLOSSARY = os.path.join(REPO_ROOT, "vendor", "i18n", "zh-Hans", "glossary.json")
PROMPT_PATH = os.path.join(TOOL_DIR, "prompt.md")
SCHEMA_PATH = os.path.join(TOOL_DIR, "output-schema.json")
MAX_REPAIRS = 3
MAX_FAILED_RUNS = 3
DEFAULT_TIMEOUT = 900
REQUIRED_SANDBOX = "read-only"
LANGS = ("en", "ko", "ja")

# tests whose ported rules the tool follows; a delta prepare warns when one changed.
RULE_SOURCES = (
    "tests/i18n_key_parity.rs",
    "tests/toast_message_fits_cap.rs",
    "tests/file_handler_when_fits_column.rs",
    "tests/native_surface_labels_i18n.rs",
)

# Patterns that must not occur in the text sent to Codex. Names are split so this
# file passes the repository's own local path check.
PUBLIC_ZERO = {
    "home path": r"/ho" r"me/|/Us" r"ers/|C:\\Us" r"ers",
    "local folder": re.escape(rules.LOCAL_WORKSPACE) + "|" + "|".join(rules.LOCAL_FOLDER_NAMES) + "|tasty-" + "page",
    "private repository": r"market" r"place|market-be|market-fe",
    "secret": r"ghp_|sk-ant|AKIA|PRIVATE KEY",
    "email": r"[\w.+-]+@[\w-]+\.[A-Za-z]{2,}",
    "private ip": r"\b10\.\d+\.\d+\.\d+\b|\b192\.168\.\d+\.\d+\b",
    "adr": r"\bADR\b",
}
GUIDE_DIR = re.compile(re.escape(rules.LOCAL_GUIDE_DIR))
ACCOUNT_NAME = "zilhak"


class Stop(Exception):
    """The tool cannot go on. The message says why; exit code 2."""


class SandboxViolation(Stop):
    pass


TERMINATE = threading.Event()  # a signal asked the run to end
HALT = threading.Event()  # a sandbox violation: no further Codex call may start


def sha256_bytes(data):
    return hashlib.sha256(data).hexdigest()


def sha256_file(path):
    with open(path, "rb") as f:
        return sha256_bytes(f.read())


def canonical(obj):
    return json.dumps(obj, ensure_ascii=False, sort_keys=True, separators=(",", ":"))


def write_json(path, obj):
    tmp = f"{path}.{os.getpid()}.{threading.get_ident()}.tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(obj, f, ensure_ascii=False, indent=2)
        f.write("\n")
    os.replace(tmp, path)


def read_json(path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def now():
    return datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def app_terms(glossary):
    return [t for t in glossary.get("terms", []) if "app" in t.get("scope", ["app"])]


class Source:
    """Where a value came from: a raw file named by the ledger, or the glossary."""

    def __init__(self, value, raw_sha256=None, raw=None, round_no=None):
        self.value = value
        self.raw_sha256 = raw_sha256
        self.raw = raw
        self.round = round_no


class State:
    def __init__(self, path, glossary_path=None):
        self.path = os.path.abspath(path)
        manifest_path = os.path.join(self.path, "manifest.json")
        if not os.path.isfile(manifest_path):
            raise Stop(f"no manifest in {self.path}: run prepare first")
        self.manifest = read_json(manifest_path)
        self.glossary_path = glossary_path or DEFAULT_GLOSSARY
        self.chunks = self.manifest["chunks"]
        self.chunk_by_id = {c["id"]: c for c in self.chunks}
        self.sources = {}
        for catalog, info in self.manifest["catalogs"].items():
            self.sources[catalog] = {}
            for lang in LANGS:
                p = os.path.join(self.path, "source", catalog, f"{lang}.toml")
                with open(p, "rb") as f:
                    data = f.read()
                if sha256_bytes(data) != info["sha256"][lang]:
                    raise Stop(f"{p} does not match the manifest")
                self.sources[catalog][lang] = data.decode("utf-8")
        self.items = cat.build_items(self.sources)
        self.item_by_id = {i["id"]: i for i in self.items}
        self.allowlist = {k: v for k, v in read_json(os.path.join(self.path, "allowlist.json"))}
        self.base = None
        if self.manifest.get("base_state"):
            self.base = State(self.manifest["base_state"], glossary_path)
        self._glossary = None
        self._resolved = None

    # --- files ---

    def p(self, *parts):
        return os.path.join(self.path, *parts)

    @property
    def glossary(self):
        if self._glossary is None and os.path.isfile(self.glossary_path):
            self._glossary = read_json(self.glossary_path)
        return self._glossary

    def chunk_items(self, chunk_id):
        path = self.p("input", f"{chunk_id}.json")
        with open(path, "rb") as f:
            data = f.read()
        if sha256_bytes(data) != self.chunk_by_id[chunk_id]["input_sha256"]:
            raise Stop(f"{path} does not match the manifest")
        return json.loads(data)["items"]

    def rows(self):
        path = self.p("runs", "ledger.jsonl")
        out = []
        if os.path.isfile(path):
            with open(path, encoding="utf-8") as f:
                for line in f:
                    try:
                        out.append(json.loads(line))
                    except json.JSONDecodeError:
                        pass  # a line cut short by a killed process names no usable raw
        return out

    def all_rows(self):
        return (self.base.all_rows() if self.base else []) + self.rows()

    def append_row(self, row):
        path = self.p("runs", "ledger.jsonl")
        with open(path, "a", encoding="utf-8") as f:
            fcntl.flock(f, fcntl.LOCK_EX)
            f.write(json.dumps(row, ensure_ascii=False) + "\n")
            f.flush()
            os.fsync(f.fileno())
            fcntl.flock(f, fcntl.LOCK_UN)

    # --- staleness ---

    def fingerprint(self, chunk_id):
        """What Codex saw. A change in any part makes earlier results stale."""
        g = self.glossary
        if g is None:
            return None
        return sha256_bytes(canonical({
            "input": self.chunk_by_id[chunk_id]["input_sha256"],
            "glossary": {"style": g.get("style"), "terms": app_terms(g)},
            "prompt": sha256_file(PROMPT_PATH),
            "schema": sha256_file(SCHEMA_PATH),
            "commit": self.manifest["commit"],
        }).encode("utf-8"))

    # --- resolving values ---

    def resolve_chunk(self, chunk_id):
        fp = self.fingerprint(chunk_id)
        rows = [r for r in self.rows() if r["chunk"] == chunk_id]
        current = sorted(
            (r for r in rows if r["status"] == "ok" and fp is not None and r["fingerprint"] == fp),
            key=lambda r: r["round"],
        )
        values, integrity, extras = {}, [], []
        expected = {i["id"] for i in self.chunk_items(chunk_id) if i.get("source") != "glossary"}
        for n, row in enumerate(current):
            raw_path = self.p("runs", row["raw"])
            if not os.path.isfile(raw_path):
                integrity.append(f"{row['raw']} is missing")
                continue
            if sha256_file(raw_path) != row["raw_sha256"]:
                integrity.append(f"{row['raw']} does not match the ledger hash")
                continue
            data = read_json(raw_path)
            wanted = set(row.get("keys") or expected)
            for entry in data["items"]:
                if entry["id"] in wanted and entry["id"] in expected:
                    values[entry["id"]] = Source(entry["value"], row["raw_sha256"], row["raw"], row["round"])
                elif n == len(current) - 1:
                    extras.append(entry["id"])
        return {
            "values": values,
            "integrity": integrity,
            "extras": extras,
            "current": current,
            "stale": not current and any(r["status"] == "ok" for r in rows),
            "failed_runs": sum(1 for r in rows if r["status"] != "ok" and r["kind"] == "run"
                               and r.get("fingerprint") == fp),
            "repairs": sum(1 for r in rows if r["kind"] == "repair" and r.get("fingerprint") == fp),
            "expected": expected,
        }

    def own_ids(self):
        return {i["id"] for c in self.chunks for i in self.chunk_items(c["id"])}

    def resolve_all(self):
        if self._resolved is not None:
            return self._resolved
        out = {}
        if self.base:
            inherited = self.base.resolve_all()
            own = self.own_ids()
            for item in self.items:
                if item["id"] not in own and item["id"] in inherited:
                    out[item["id"]] = inherited[item["id"]]
        for chunk in self.chunks:
            out.update(self.resolve_chunk(chunk["id"])["values"])
        g = self.glossary
        for item in self.items:
            if item.get("source") == "glossary" and g and g.get("display_name"):
                out[item["id"]] = Source(g["display_name"])
        self._resolved = out
        return out

    # --- checks ---

    def chunk_failures(self, chunk_id):
        res = self.resolve_chunk(chunk_id)
        out = []
        for problem in res["integrity"]:
            out.append({"rule": "raw_integrity", "id": chunk_id, "message": problem})
        for extra in res["extras"]:
            out.append({"rule": "schema_ids", "id": extra, "message": "id not in the input"})
        if not res["current"]:
            return out
        items = [i for i in self.chunk_items(chunk_id) if i.get("source") != "glossary"]
        by_key = {}
        for item in items:
            src = res["values"].get(item["id"])
            if src is None:
                out.append({"rule": "schema_ids", "id": item["id"], "message": "missing from the output"})
                continue
            for rule, message in rules.value_failures(item, src.value):
                out.append({"rule": rule, "id": item["id"], "message": message})
            # A chunk can span catalogs; only entries of one catalog flatten to one key.
            by_key.setdefault((item["catalog"], item["key"]), []).append(item["id"])
        for (_, key), ids in by_key.items():
            if len({res["values"][i].value for i in ids}) > 1:
                for i in ids:
                    out.append({"rule": "duplicate_key", "id": i, "message": f"{key} has different values"})
        return out

    def chunk_state(self, chunk_id, res=None, failures=None):
        res = res or self.resolve_chunk(chunk_id)
        if res["current"]:
            failures = self.chunk_failures(chunk_id) if failures is None else failures
            return "failed" if failures else "done"
        if res["stale"]:
            return "stale"
        return "failed" if res["failed_runs"] >= MAX_FAILED_RUNS else "not_run"

    def inherited_failures(self):
        if not self.base:
            return []
        own = self.own_ids()
        values = self.resolve_all()
        out = []
        for item in self.items:
            if item["id"] in own or item.get("source") == "glossary":
                continue
            src = values.get(item["id"])
            if src is None:
                out.append({"rule": "schema_ids", "id": item["id"], "message": "no value in the base state"})
                continue
            for rule, message in rules.value_failures(item, src.value):
                out.append({"rule": rule, "id": item["id"], "message": message})
        return out

    def complete(self):
        if self.base and not self.base.complete():
            return False
        return all(self.chunk_state(c["id"]) == "done" for c in self.chunks)

    def tree_failures(self, values=None):
        """Rules on the whole files. Needs a value for every entry."""
        values = values if values is not None else {k: s.value for k, s in self.resolve_all().items()}
        out = []
        rendered = {}
        en_only = set(cat.en_only_keys(self.sources)[0])
        total = dotted = 0
        for catalog, langs in self.sources.items():
            entries = cat.scan(langs["ko"])
            by_path = {e.path: values[cat.item_id(catalog, e.path)] for e in entries}
            text = cat.render(langs["ko"], by_path)
            rendered[catalog] = text
            try:
                tomllib.loads(text)
                got = cat.scan(text)
            except (tomllib.TOMLDecodeError, cat.CatalogError) as e:
                out.append({"rule": "toml_parse", "id": catalog, "message": str(e)})
                continue
            if [e.path for e in got] != [e.path for e in entries]:
                out.append({"rule": "key_set", "id": catalog, "message": "paths or order differ from ko"})
            want = self.manifest["catalogs"][catalog]["ko"]
            if len(got) != want:
                out.append({"rule": "key_set", "id": catalog, "message": f"{len(got)} entries, expected {want}"})
            for e in got:
                if f"{catalog}:{cat.dotted(e.path)}" in en_only:
                    out.append({"rule": "key_set", "id": catalog, "message": f"en-only {e.path}"})
            total += len(got)
            dotted += len({cat.dotted(e.path) for e in got})
            for problem in rules.local_path_violations(text):
                out.append({"rule": "local_path", "id": catalog, "message": problem})
        if total != self.manifest["expected"]["items"] or dotted != self.manifest["expected"]["dotted"]:
            out.append({"rule": "key_set", "id": "total",
                        "message": f"{total} entries and {dotted} dotted keys, expected "
                                   f"{self.manifest['expected']['items']} and {self.manifest['expected']['dotted']}"})
        return out, rendered

    # --- review ---

    def review_items(self, only_ids=None):
        """Review entries for the current values."""
        values = self.resolve_all()
        terms = app_terms(self.glossary) if self.glossary else []
        out = []
        groups = {}
        for item in self.items:
            src = values.get(item["id"])
            if src is None or item.get("source") == "glossary":
                continue
            for rule, detail in rules.translation_review(item, src.value, self.allowlist, terms):
                out.append({"id": item["id"], "rule": rule, "detail": detail})
            groups.setdefault(item["en"], {}).setdefault(src.value, []).append(item["id"])
        for en, by_value in groups.items():
            if len(by_value) > 1 and en.strip():
                ids = sorted(i for v in by_value.values() for i in v)
                for i in ids:
                    out.append({"id": i, "rule": "same_en_different_value", "detail": f"{len(ids)} keys"})
        if only_ids is not None:
            out = [r for r in out if r["id"] in only_ids]
        return out

    def decisions(self):
        out = self.base.decisions() if self.base else {}
        path = self.p("decisions.json")
        if os.path.isfile(path):
            out.update(read_json(path))
        return out

    def undecided(self, reviews=None):
        reviews = self.review_items() if reviews is None else reviews
        values = self.resolve_all()
        decisions = self.decisions()
        out = []
        for r in reviews:
            d = decisions.get(r["id"])
            src = values.get(r["id"])
            valid = d and src and d["raw_sha256"] == src.raw_sha256 and r["rule"] in d["rules"]
            if not valid:
                out.append(r)
        return out

    def same_as_english(self):
        values = self.resolve_all()
        decisions = self.decisions()
        out = {"neutral": [], "allowlisted": [], "other": []}
        for item in self.items:
            src = values.get(item["id"])
            if src is None or item.get("source") == "glossary":
                continue
            group = rules.same_as_en_class(item, src.value, self.allowlist)
            if group == "other":
                d = decisions.get(item["id"]) or {}
                out[group].append({"id": item["id"], "key": item["key"], "reason": d.get("reason", "")})
            elif group:
                out[group].append(item["id"])
        return out


# --- prepare ---


def public_scan(sources, commit_is_baseline, expected):
    """Search every line of en, ko and ja, comments included."""
    hits = {name: [] for name in PUBLIC_ZERO}
    guide, account = [], []
    bad_guide, bad_account = [], []
    for catalog, langs in sources.items():
        for lang in LANGS:
            for n, line in enumerate(langs[lang].split("\n"), 1):
                where = f"{catalog}/{lang}.toml:{n}"
                for name, pattern in PUBLIC_ZERO.items():
                    if re.search(pattern, line):
                        hits[name].append(where)
                if GUIDE_DIR.search(line):
                    guide.append(where)
                    if any(not line[: m.start()].endswith(rules.USER_CONFIG_PREFIXES) for m in GUIDE_DIR.finditer(line)):
                        bad_guide.append(where)
                if ACCOUNT_NAME in line:
                    account.append(where)
                    if line.count(ACCOUNT_NAME) != line.count(f"--account {ACCOUNT_NAME}") + line.count(f"account:{ACCOUNT_NAME}"):
                        bad_account.append(where)
    result = {
        "zero_patterns": {k: len(v) for k, v in hits.items()},
        "local_guide_dir": len(guide),
        "account_example": len(account),
    }
    problems = [f"{k}: {v[:5]}" for k, v in hits.items() if v]
    if bad_guide:
        problems.append(f"guide folder not under the user's home: {bad_guide[:5]}")
    if bad_account:
        problems.append(f"account name outside the known example: {bad_account[:5]}")
    if commit_is_baseline:
        for key in ("local_guide_dir", "account_example"):
            if result[key] != expected[key]:
                problems.append(f"{key}: {result[key]} lines, measured {expected[key]}")
    return result, problems


def allowlist_from(tasty, commit):
    """SAME_AS_ENGLISH_ALLOWLIST, tests/i18n_key_parity.rs at the commit being translated."""
    try:
        text = cat.git(tasty, "show", f"{commit}:tests/i18n_key_parity.rs")
    except cat.CatalogError:
        return []
    m = re.search(r"const SAME_AS_ENGLISH_ALLOWLIST.*?= &\[(.*?)\n\];", text, re.S)
    if not m:
        return []
    return [[key, re.findall(r'"([^"]+)"', langs)]
            for key, langs in re.findall(r'\(\s*"([^"]+)",\s*&\[([^\]]*)\]', m.group(1))]


def rule_blobs(tasty, commit):
    out = {}
    for path in RULE_SOURCES:
        try:
            out[path] = cat.git(tasty, "rev-parse", f"{commit}:{path}").strip()
        except cat.CatalogError:
            out[path] = None
    return out


def cmd_prepare(args):
    tasty = os.path.abspath(args.tasty)
    commit = cat.git(tasty, "rev-parse", "--verify", f"{args.commit}^{{commit}}").strip()
    state = os.path.abspath(args.state)
    manifest_path = os.path.join(state, "manifest.json")
    existing = read_json(manifest_path) if os.path.isfile(manifest_path) else None
    if existing and existing["commit"] != commit:
        raise Stop(f"{state} already holds commit {existing['commit']}; use a new folder")

    base = None
    if args.delta_from:
        base = State(args.delta_from, args.glossary)
        if os.path.abspath(args.delta_from) == state:
            raise Stop("--delta-from must name another folder")
    baseline = cat.BASELINES.get(commit)
    if not base and not baseline:
        raise Stop(f"{commit} is not the pinned commit. New keys go through --delta-from.")

    folders = cat.discover(tasty, commit)
    sources = {}
    for catalog, rel in folders.items():
        sources[catalog] = {lang: cat.git(tasty, "show", f"{commit}:{rel}/{lang}.toml") for lang in LANGS}
    registered = [rel for rel in folders.values()
                  if subprocess.run(["git", "-C", tasty, "cat-file", "-e", f"{commit}:{rel}/zh-Hans.toml"],
                                    capture_output=True).returncode == 0]
    if registered:
        raise Stop(f"{commit} already has zh-Hans files: {registered[:3]}. Fix values in Tasty, not here.")

    items = cat.build_items(sources)
    catalogs = {}
    for catalog, rel in folders.items():
        en_entries = cat.scan(sources[catalog]["en"])
        catalogs[catalog] = {
            "rel": rel,
            "ko": len(cat.scan(sources[catalog]["ko"])),
            "en": len(en_entries),
            "en_chars": sum(len(e.value) for e in en_entries),
            "sha256": {lang: sha256_bytes(sources[catalog][lang].encode("utf-8")) for lang in LANGS},
        }
    total = len(items)
    dotted = len({(i["catalog"], i["key"]) for i in items})
    variants, others = cat.en_only_keys(sources)

    problems = []
    if others:
        problems.append(f"en keys missing from ko that are not _one variants: {others[:5]}")
    if baseline:
        for catalog, want in baseline["catalogs"].items():
            got = catalogs.get(catalog)
            if not got or any(got[k] != want[k] for k in want):
                problems.append(f"{catalog}: {got and {k: got[k] for k in want}} measured {want}")
        extra = set(catalogs) - set(baseline["catalogs"])
        if extra:
            problems.append(f"catalogs not in the table: {sorted(extra)}")
        if total != baseline["items"] or dotted != baseline["dotted"]:
            problems.append(f"{total} entries and {dotted} dotted keys, measured {baseline['items']} and {baseline['dotted']}")
    public, public_problems = public_scan(sources, bool(baseline) and not base, baseline["public"] if baseline else {})
    problems += public_problems
    if problems:
        raise Stop("prepare stopped:\n  " + "\n  ".join(problems))

    delta = None
    if base:
        before = base.item_by_id
        now_ids = {i["id"]: i for i in items}
        added = [i["id"] for i in items if i["id"] not in before]
        changed = [i["id"] for i in items if i["id"] in before and before[i["id"]]["en"] != i["en"]]
        removed = [i for i in before if i not in now_ids]
        delta = {"base_commit": base.manifest["commit"], "added": added, "changed": changed, "removed": removed}
        targets = set(added) | set(changed)
        # An entry that shares its dotted key with a target is translated with it.
        keys = {(now_ids[i]["catalog"], now_ids[i]["key"]) for i in targets}
        work = [i for i in items if (i["catalog"], i["key"]) in keys and i.get("source") != "glossary"]
    else:
        work = items
    chunks = cat.make_chunks(work, args.max_keys, args.max_chars)
    placed = [i["id"] for c in chunks for i in c["items"]]
    if len(placed) != len(set(placed)) or set(placed) != {i["id"] for i in work}:
        raise Stop("chunking lost or repeated an entry")

    chunk_info = []
    inputs = {}
    for c in chunks:
        data = json.dumps({"chunk": c["id"], "items": c["items"]}, ensure_ascii=False, indent=2).encode("utf-8")
        inputs[c["id"]] = data
        chunk_info.append({
            "id": c["id"],
            "keys": len(c["items"]),
            "en_chars": sum(len(i["en"]) for i in c["items"]),
            "input_sha256": sha256_bytes(data),
            "first": c["items"][0]["id"],
            "last": c["items"][-1]["id"],
        })
    manifest = {
        "kind": "delta" if base else "full",
        "commit": commit,
        "catalogs": catalogs,
        "expected": {"items": total, "dotted": dotted},
        "en_only_variants": len(variants),
        "limits": {"max_keys": args.max_keys, "max_chars": args.max_chars},
        "chunks": chunk_info,
        "rule_sources": rule_blobs(tasty, commit),
    }
    if base:
        manifest["base_state"] = base.path
        manifest["delta"] = delta
    if existing:
        if canonical(existing) != canonical(manifest):
            raise Stop(f"{state} was prepared differently for this commit; use a new folder")
        print(f"already prepared: {state}")
    else:
        for sub in ("runs", "input", "locks", "tmp", "quarantine", "glossary"):
            os.makedirs(os.path.join(state, sub), exist_ok=True)
        for catalog, langs in sources.items():
            os.makedirs(os.path.join(state, "source", catalog), exist_ok=True)
            for lang, text in langs.items():
                with open(os.path.join(state, "source", catalog, f"{lang}.toml"), "wb") as f:
                    f.write(text.encode("utf-8"))
        for chunk_id, data in inputs.items():
            with open(os.path.join(state, "input", f"{chunk_id}.json"), "wb") as f:
                f.write(data)
        write_json(os.path.join(state, "allowlist.json"), allowlist_from(tasty, commit))
        write_json(os.path.join(state, "public-check.json"), public)
        write_json(manifest_path, manifest)

    print(f"commit {commit}" + (f" (delta from {delta['base_commit']})" if base else ""))
    for catalog, info in catalogs.items():
        print(f"  {info['rel']:45} ko {info['ko']:5} en {info['en']:5} en chars {info['en_chars']:7}")
    print(f"  entries {total}, dotted keys {dotted}, en-only _one variants {len(variants)}")
    print(f"  chunks {len(chunks)}, entries in chunks {len(placed)}")
    print(f"  public check: {canonical(public)}")
    if base:
        print(f"  added {len(delta['added'])}, changed {len(delta['changed'])}, removed {len(delta['removed'])}")
        for name in ("added", "changed", "removed"):
            for i in delta[name]:
                print(f"    {name}: {i}")
        moved = [p for p, blob in manifest["rule_sources"].items() if base.manifest["rule_sources"].get(p) != blob]
        if moved:
            print(f"  warning: rule sources changed since the base commit, compare them with rules.py: {moved}")
    return 0


# --- running Codex ---


def build_prompt(state, kind, items, reason=None):
    glossary = state.glossary
    if glossary is None:
        raise Stop(f"no glossary at {state.glossary_path}")
    with open(PROMPT_PATH, encoding="utf-8") as f:
        text = f.read()
    # head, then run, repair and retranslate blocks, then the tail after "end".
    parts = re.split(r"(?m)^=== (?:mode: (\w+)|end) ===\n", text)
    head, tail = parts[0], parts[-1]
    modes = {parts[i]: parts[i + 1] for i in range(1, len(parts) - 1, 2) if parts[i]}
    payload = json.dumps(items, ensure_ascii=False, indent=1)
    glossary_text = json.dumps({"style": glossary.get("style"), "terms": app_terms(glossary)}, ensure_ascii=False, indent=1)
    task = modes[kind].replace("{{REASON}}", reason or "")
    return head + task + tail.replace("{{GLOSSARY}}", glossary_text).replace("{{INPUT}}", payload)


class ChunkLock:
    def __init__(self, state, chunk_id):
        self.path = state.p("locks", chunk_id)

    def __enter__(self):
        for _ in range(2):
            try:
                fd = os.open(self.path, os.O_CREAT | os.O_EXCL | os.O_WRONLY)
            except FileExistsError:
                try:
                    with open(self.path, encoding="utf-8") as f:
                        pid = int(f.read().strip() or 0)
                except (OSError, ValueError):
                    pid = 0
                if pid and pid_alive(pid):
                    raise Stop(f"{os.path.basename(self.path)} is being run by process {pid}")
                try:
                    os.unlink(self.path)  # the process that held it is gone
                except FileNotFoundError:
                    pass
                continue
            with os.fdopen(fd, "w", encoding="utf-8") as f:
                f.write(str(os.getpid()))
            return self
        raise Stop(f"could not take {self.path}")

    def __exit__(self, *exc):
        try:
            os.unlink(self.path)
        except FileNotFoundError:
            pass


def pid_alive(pid):
    try:
        os.kill(pid, 0)
    except ProcessLookupError:
        return False
    except PermissionError:
        return True
    return True


def quarantine_orphans(state, chunk_id):
    """A raw the ledger does not name is never used. Called with the chunk lock held."""
    known = {r.get("raw") for r in state.rows()}
    pattern = re.compile(re.escape(chunk_id) + r"\.\d+\.raw\.json$")
    moved = []
    for name in os.listdir(state.p("runs")):
        if pattern.fullmatch(name) and name not in known:
            target = state.p("quarantine", f"{name}.{int(time.time() * 1000)}")
            os.replace(state.p("runs", name), target)
            moved.append(name)
    return moved


def next_round(state, chunk_id):
    numbers = [r["round"] for r in state.rows() if r["chunk"] == chunk_id]
    pattern = re.compile(re.escape(chunk_id) + r"\.(\d+)\.raw\.json")
    for folder in ("runs", "quarantine"):
        for name in os.listdir(state.p(folder)):
            m = pattern.match(name)
            if m:
                numbers.append(int(m.group(1)))
    return max(numbers, default=0) + 1


def read_log_header(path):
    """Fields of the banner Codex prints before it echoes the prompt."""
    fields = {}
    try:
        with open(path, encoding="utf-8", errors="replace") as f:
            for line in f:
                line = line.rstrip("\n")
                if line == "user":
                    fields["_complete"] = True
                    break
                m = re.match(r"(model|sandbox|reasoning effort): (.*)$", line)
                if m and m.group(1) not in fields:
                    fields[m.group(1)] = m.group(2).strip()
    except FileNotFoundError:
        pass
    return fields


def read_tokens(path):
    try:
        with open(path, encoding="utf-8", errors="replace") as f:
            lines = f.read().splitlines()
    except FileNotFoundError:
        return None
    for i in range(len(lines) - 1, -1, -1):
        if lines[i].strip() == "tokens used" and i + 1 < len(lines):
            digits = re.sub(r"\D", "", lines[i + 1])
            return int(digits) if digits else None
    return None


def _die_with_parent():
    # Linux: a SIGKILL of this tool should not leave Codex spending tokens.
    try:
        ctypes.CDLL(None, use_errno=True).prctl(1, signal.SIGTERM)
    except (OSError, AttributeError):
        pass


def kill_group(proc):
    try:
        os.killpg(proc.pid, signal.SIGTERM)
    except ProcessLookupError:
        return
    try:
        proc.wait(5)
    except subprocess.TimeoutExpired:
        try:
            os.killpg(proc.pid, signal.SIGKILL)
        except ProcessLookupError:
            pass
        proc.wait()


def valid_raw(path):
    try:
        data = read_json(path)
    except (OSError, ValueError):
        return False
    items = data.get("items") if isinstance(data, dict) else None
    return isinstance(items, list) and all(
        isinstance(e, dict) and isinstance(e.get("id"), str) and isinstance(e.get("value"), str) for e in items
    )


def codex_binary(args):
    """The executable itself. A subprocess does not read shell aliases."""
    found = args.codex_bin or shutil.which("codex")
    if not found:
        raise Stop("codex is not on PATH")
    return found


def call_codex(state, chunk_id, kind, payload, ids, args, reason=None):
    """One Codex round. Only an exit code 0 with valid JSON and the read-only sandbox keeps a file."""
    if HALT.is_set() or TERMINATE.is_set():
        return {"chunk": chunk_id, "status": "skipped"}
    with ChunkLock(state, chunk_id):
        moved = quarantine_orphans(state, chunk_id)
        for name in moved:
            print(f"{chunk_id}: {name} is not in the ledger, moved to quarantine")
        round_no = next_round(state, chunk_id)
        fp = state.fingerprint(chunk_id)
        prompt = build_prompt(state, kind, payload, reason)
        tmp = state.p("tmp", f"{chunk_id}.{round_no}")
        shutil.rmtree(tmp, ignore_errors=True)
        os.makedirs(tmp)
        prompt_path = os.path.join(tmp, "prompt.txt")
        with open(prompt_path, "w", encoding="utf-8") as f:
            f.write(prompt)
        out_path = os.path.join(tmp, "out.json")
        log_path = os.path.join(tmp, "stderr.log")
        cmd = [codex_binary(args), "exec", "--skip-git-repo-check", "--ephemeral",
               "-s", REQUIRED_SANDBOX, "--output-schema", SCHEMA_PATH, "-o", out_path]
        if args.model:
            cmd += ["-m", args.model]
        cmd.append("-")
        env = dict(os.environ)
        env.pop("TASTY_CODEX_GEN", None)  # this call is not the Codex a Tasty surface is waiting on
        started = time.time()
        failure = None
        violation = None
        with open(prompt_path, "rb") as stdin, open(log_path, "wb") as stderr:
            proc = subprocess.Popen(cmd, stdin=stdin, stdout=subprocess.DEVNULL, stderr=stderr, cwd=tmp, env=env,
                                    start_new_session=True, preexec_fn=_die_with_parent)
            while proc.poll() is None:
                time.sleep(0.2)
                header = read_log_header(log_path)
                if "sandbox" in header:
                    if header["sandbox"] != REQUIRED_SANDBOX:
                        violation = f"sandbox: {header['sandbox']}"
                elif header.get("_complete"):
                    violation = "the log names no sandbox"
                if violation:
                    HALT.set()
                    kill_group(proc)
                elif TERMINATE.is_set():
                    failure = "interrupted"
                    kill_group(proc)
                elif time.time() - started > args.timeout:
                    failure = f"timeout after {args.timeout}s"
                    kill_group(proc)
        rc = proc.returncode
        header = read_log_header(log_path)
        if not violation and header.get("sandbox") != REQUIRED_SANDBOX:
            violation = f"sandbox: {header['sandbox']}" if "sandbox" in header else "the log names no sandbox"
            HALT.set()
        row = {
            "chunk": chunk_id,
            "round": round_no,
            "kind": kind,
            "fingerprint": fp,
            "keys": ids,
            "reason": reason,
            "exit_code": rc,
            "model": header.get("model"),
            "reasoning_effort": header.get("reasoning effort"),
            "sandbox": header.get("sandbox"),
            "tokens": read_tokens(log_path),
            "seconds": round(time.time() - started, 1),
            "at": now(),
        }
        if violation:
            failure = violation
        elif failure is None:
            if rc != 0:
                failure = f"exit code {rc}"
            elif not os.path.isfile(out_path):
                failure = "no output file"
            elif not valid_raw(out_path):
                failure = "the output is not the expected JSON"
        if failure:
            with open(log_path, encoding="utf-8", errors="replace") as f:
                tail = f.read()[-300:]
            row.update(status="failed", failure=failure, raw=None, raw_sha256=None, log_tail=tail)
        else:
            name = f"{chunk_id}.{round_no}.raw.json"
            target = state.p("runs", name)
            os.replace(out_path, target)  # the bytes stay as Codex wrote them
            row.update(status="ok", raw=name, raw_sha256=sha256_file(target))
        state.append_row(row)
        shutil.rmtree(tmp, ignore_errors=True)
        state._resolved = None
        return row


def run_many(state, jobs, tasks):
    """tasks: (chunk id, callable). Returns rows; a busy lock is reported as a failure."""
    results = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=max(1, jobs)) as pool:
        futures = {pool.submit(fn): chunk_id for chunk_id, fn in tasks}
        for fut in concurrent.futures.as_completed(futures):
            chunk_id = futures[fut]
            try:
                row = fut.result()
            except Stop as e:
                row = {"chunk": chunk_id, "status": "stopped", "failure": str(e)}
            results.append(row)
            detail = row.get("failure") or row.get("raw") or ""
            print(f"{chunk_id}: {row['status']} round {row.get('round', '-')} "
                  f"model {row.get('model')} sandbox {row.get('sandbox')} tokens {row.get('tokens')} "
                  f"{row.get('seconds', '-')}s {detail}", flush=True)
    return results


def finish_run(results):
    if HALT.is_set():
        raise SandboxViolation(
            f"stopped: Codex did not run in the {REQUIRED_SANDBOX} sandbox. No output was kept and no "
            "further chunk was started. Run this tool, not a shell alias, and check the Codex settings.")
    if TERMINATE.is_set():
        return 130
    bad = [r for r in results if r["status"] not in ("ok", "skipped")]
    return 1 if bad else 0


def install_signal_handlers():
    def handle(_sig, _frame):
        TERMINATE.set()

    signal.signal(signal.SIGTERM, handle)
    signal.signal(signal.SIGINT, handle)


def payload_of(item):
    return {k: item[k] for k in ("id", "key", "en", "ko", "ja", "constraints")}


def cmd_run(args):
    state = State(args.state, args.glossary)
    if state.glossary is None:
        raise Stop(f"no glossary at {state.glossary_path}")
    if bool(args.chunk) == bool(args.pending):
        raise Stop("give --chunk or --pending")
    selected, blocked = [], []
    for chunk in state.chunks:
        chunk_id = chunk["id"]
        if args.chunk and chunk_id not in args.chunk:
            continue
        res = state.resolve_chunk(chunk_id)
        current = state.chunk_state(chunk_id, res)
        if res["failed_runs"] >= MAX_FAILED_RUNS and not args.force:
            blocked.append(f"{chunk_id}: {res['failed_runs']} failed rounds. Find the cause, then use --force.")
        elif args.pending:
            if current == "not_run" or (current == "stale" and args.include_stale):
                selected.append(chunk_id)
        elif current in ("done", "failed") and not args.force:
            blocked.append(f"{chunk_id} is {current}: use repair, retranslate or --force")
        else:
            selected.append(chunk_id)
    if args.chunk:
        unknown = set(args.chunk) - set(state.chunk_by_id)
        if unknown:
            raise Stop(f"unknown chunks: {sorted(unknown)}")
    for line in blocked:
        print(line)
    install_signal_handlers()
    tasks = []
    for chunk_id in selected:
        items = [i for i in state.chunk_items(chunk_id) if i.get("source") != "glossary"]
        if not items:
            continue
        payload = [payload_of(i) for i in items]
        tasks.append((chunk_id, lambda c=chunk_id, p=payload: call_codex(state, c, "run", p, None, args)))
    results = run_many(state, args.jobs, tasks)
    code = finish_run(results)
    return code if code else (1 if blocked else 0)


def cmd_repair(args):
    state = State(args.state, args.glossary)
    chunk_id = args.chunk
    if chunk_id not in state.chunk_by_id:
        raise Stop(f"unknown chunk {chunk_id}")
    res = state.resolve_chunk(chunk_id)
    failures = state.chunk_failures(chunk_id)
    if not res["current"]:
        raise Stop(f"{chunk_id} has no current result: use run")
    ids = {f["id"] for f in failures if f["id"] in res["expected"]}
    if not ids:
        if failures:
            raise Stop(f"{chunk_id} fails without a key to repair: {failures[:3]}. Use run --force.")
        print(f"{chunk_id} has nothing to repair")
        return 0
    if res["repairs"] >= MAX_REPAIRS:
        lines = [f"{f['id']} [{f['rule']}] {f['message']}" for f in failures]
        raise Stop(f"{chunk_id} used its {MAX_REPAIRS} repair rounds. Still failing:\n  " + "\n  ".join(lines))
    payload = []
    for item in state.chunk_items(chunk_id):
        if item["id"] in ids:
            entry = payload_of(item)
            src = res["values"].get(item["id"])
            entry["current"] = src.value if src else None
            entry["problems"] = [f"{f['rule']}: {f['message']}" for f in failures if f["id"] == item["id"]]
            payload.append(entry)
    install_signal_handlers()
    results = run_many(state, 1, [(chunk_id, lambda: call_codex(state, chunk_id, "repair", payload, sorted(ids), args))])
    return finish_run(results)


def read_keys(spec):
    if os.path.isfile(spec):
        with open(spec, encoding="utf-8") as f:
            return [line.strip() for line in f if line.strip()]
    return [k.strip() for k in spec.split(",") if k.strip()]


def cmd_retranslate(args):
    state = State(args.state, args.glossary)
    keys = read_keys(args.keys)
    by_chunk = {}
    for chunk in state.chunks:
        for item in state.chunk_items(chunk["id"]):
            if item["id"] in keys:
                if item.get("source") == "glossary":
                    raise Stop(f"{item['id']} comes from the glossary")
                by_chunk.setdefault(chunk["id"], []).append(item)
    found = {i["id"] for items in by_chunk.values() for i in items}
    missing = [k for k in keys if k not in found]
    if missing:
        hint = " They may belong to the base state." if state.base else ""
        raise Stop(f"not in any chunk here: {missing[:5]}.{hint}")
    values = state.resolve_all()
    tasks = []
    for chunk_id, items in by_chunk.items():
        payload = []
        for item in items:
            entry = payload_of(item)
            entry["current"] = values[item["id"]].value if item["id"] in values else None
            payload.append(entry)
        ids = [i["id"] for i in items]
        tasks.append((chunk_id, lambda c=chunk_id, p=payload, k=ids:
                      call_codex(state, c, "retranslate", p, k, args, args.reason)))
    install_signal_handlers()
    return finish_run(run_many(state, args.jobs, tasks))


def cmd_decide(args):
    state = State(args.state, args.glossary)
    keys = list(args.key or [])
    if args.keys_file:
        keys += read_keys(args.keys_file)
    if not keys:
        raise Stop("give --key or --keys-file")
    values = state.resolve_all()
    reviews = state.review_items()
    path = state.p("decisions.json")
    decisions = read_json(path) if os.path.isfile(path) else {}
    for key in keys:
        src = values.get(key)
        if src is None:
            raise Stop(f"{key} has no current value")
        flagged = sorted({r["rule"] for r in reviews if r["id"] == key})
        if not flagged:
            raise Stop(f"{key} is not on the review list")
        decisions[key] = {"action": "keep", "reason": args.reason, "raw_sha256": src.raw_sha256,
                          "rules": flagged, "at": now()}
    write_json(path, decisions)
    print(f"kept {len(keys)} keys")
    return 0


def cmd_status(args):
    state = State(args.state, args.glossary)
    rows = []
    counts = {"done": 0, "not_run": 0, "failed": 0, "stale": 0}
    remaining = 0
    known_raws = {r.get("raw") for r in state.rows()}
    for chunk in state.chunks:
        res = state.resolve_chunk(chunk["id"])
        failures = state.chunk_failures(chunk["id"]) if res["current"] else []
        st = state.chunk_state(chunk["id"], res, failures)
        counts[st] += 1
        if st != "done":
            remaining += chunk["keys"]
        rows.append({"chunk": chunk["id"], "state": st, "keys": chunk["keys"], "en_chars": chunk["en_chars"],
                     "rounds": len(res["current"]), "failed_runs": res["failed_runs"],
                     "repairs": res["repairs"], "failures": len(failures), "first": chunk["first"]})
    orphans = [n for n in os.listdir(state.p("runs")) if n.endswith(".raw.json") and n not in known_raws]
    reviews = state.review_items()
    undecided = state.undecided(reviews)
    summary = {
        "commit": state.manifest["commit"], "kind": state.manifest["kind"], "chunks": len(state.chunks),
        **counts, "remaining_keys": remaining, "review_items": len(reviews), "undecided": len(undecided),
        "orphan_raws": len(orphans), "glossary": state.glossary is not None,
    }
    if state.base:
        summary["base_complete"] = state.base.complete()
    if args.json:
        print(json.dumps({"summary": summary, "chunks": rows}, ensure_ascii=False, indent=2))
        return 0
    for r in rows:
        print(f"{r['chunk']} {r['state']:8} keys {r['keys']:4} chars {r['en_chars']:5} rounds {r['rounds']} "
              f"failed runs {r['failed_runs']} repairs {r['repairs']} failures {r['failures']}  {r['first']}")
    print(canonical(summary))
    return 0


def print_review_counts(counts, baseline):
    for rule in sorted(set(counts) | set(baseline or {})):
        ref = f" (ko {baseline[rule]['ko']}, ja {baseline[rule]['ja']})" if baseline and rule in baseline else ""
        print(f"  review {rule}: {counts.get(rule, 0)}{ref}")


def calibration_table(commit):
    table = rules.CALIBRATION.get(commit)
    if not table:
        return None
    return {r: {"ko": table["ko"][r], "ja": table["ja"][r]} for r in table["ko"]}


def cmd_check_lang(state, lang):
    """Run the rules on an existing translation, to calibrate them."""
    fails = []
    counts = {}
    for catalog, langs in state.sources.items():
        a = [e.path for e in cat.scan(langs[lang])]
        b = [e.path for e in cat.scan(langs["ko"])]
        if a != b:
            fails.append({"rule": "key_set", "id": catalog, "message": f"{lang} paths or order differ from ko"})
        for problem in rules.local_path_violations(langs[lang]):
            fails.append({"rule": "local_path", "id": catalog, "message": problem})
    for item in state.items:
        value = item[lang]
        for rule, message in rules.value_failures(item, value, foreign_script=False):
            fails.append({"rule": rule, "id": item["id"], "message": message})
        for rule in rules.shape_review(item["en"], value):
            counts[rule] = counts.get(rule, 0) + 1
        if value == item["en"]:
            counts["same_as_en"] = counts.get("same_as_en", 0) + 1
    by_key = {}
    for item in state.items:
        by_key.setdefault((item["catalog"], item["key"]), set()).add(item[lang])
    for (catalog, key), vals in by_key.items():
        if len(vals) > 1:
            fails.append({"rule": "duplicate_key", "id": f"{catalog}:{key}", "message": "values differ"})
    for f in fails:
        print(f"FAIL {f['rule']} {f['id']}: {f['message']}")
    table = rules.CALIBRATION.get(state.manifest["commit"], {}).get(lang)
    for rule in sorted(counts):
        ref = f" (measured {table[rule]})" if table and rule in table else ""
        print(f"  review {rule}: {counts[rule]}{ref}")
    print(f"{lang}: failures {len(fails)}")
    mismatch = bool(table) and any(counts.get(r, 0) != n for r, n in table.items())
    if mismatch:
        print(f"{lang}: review counts differ from the calibration table")
    return 1 if fails or mismatch else 0


def cmd_check(args):
    state = State(args.state, args.glossary)
    if args.lang:
        return cmd_check_lang(state, args.lang)
    if args.chunk and args.chunk not in state.chunk_by_id:
        raise Stop(f"unknown chunk {args.chunk}")
    chunk_ids = [args.chunk] if args.chunk else [c["id"] for c in state.chunks]
    failures, incomplete = [], []
    for chunk_id in chunk_ids:
        res = state.resolve_chunk(chunk_id)
        failures += state.chunk_failures(chunk_id)
        if not res["current"]:
            incomplete.append(chunk_id)
    only = None
    if args.chunk:
        only = {i["id"] for i in state.chunk_items(args.chunk)}
    else:
        failures += state.inherited_failures()
        if state.base and not state.base.complete():
            incomplete.append("base state")
    if not args.chunk and not incomplete:
        values = {k: s.value for k, s in state.resolve_all().items()}
        missing = [i for i in state.items if i["id"] not in values]
        for item in missing:
            if item.get("source") == "glossary":
                incomplete.append("glossary display_name")
            else:
                failures.append({"rule": "key_set", "id": item["id"], "message": "no value"})
        if not missing:
            failures += state.tree_failures(values)[0]
    reviews = state.review_items(only)
    undecided = state.undecided(reviews)
    for f in failures:
        print(f"FAIL {f['rule']} {f['id']}: {f['message']}")
    counts = {}
    for r in reviews:
        counts[r["rule"]] = counts.get(r["rule"], 0) + 1
    print_review_counts(counts, calibration_table(state.manifest["commit"]))
    print(f"failures {len(failures)}, not run {len(incomplete)} chunks, review {len(reviews)}, undecided {len(undecided)}")
    if args.json:
        write_json(args.json, {"failures": failures, "incomplete": incomplete, "review": reviews, "undecided": undecided})
    return 1 if failures or incomplete else 0


# --- assembling ---


def find_glossary_raw(state):
    """The kept Codex output the committed glossary came from. Only indentation may differ."""
    folder = state.p("glossary")
    parent = state
    while parent.base:
        parent = parent.base
    folders = [folder, parent.p("glossary")]
    for d in folders:
        if not os.path.isdir(d):
            continue
        for name in sorted(os.listdir(d)):
            path = os.path.join(d, name)
            try:
                if read_json(path) == state.glossary:
                    return sha256_file(path)
            except (OSError, ValueError):
                continue
    return None


def cmd_assemble(args):
    state = State(args.state, args.glossary)
    if state.glossary is None:
        raise Stop(f"no glossary at {state.glossary_path}")
    states = []
    s = state
    while s:
        states.append(s)
        s = s.base
    problems = []
    for s in states:
        for chunk in s.chunks:
            st = s.chunk_state(chunk["id"])
            if st != "done":
                problems.append(f"{s.manifest['commit'][:9]} {chunk['id']} is {st}")
    failures = state.inherited_failures()
    for chunk in state.chunks:
        failures += state.chunk_failures(chunk["id"])
    problems += [f"{f['rule']} {f['id']}: {f['message']}" for f in failures]
    sources = state.resolve_all()
    missing = [i["id"] for i in state.items if i["id"] not in sources]
    problems += [f"no value: {i}" for i in missing[:20]]
    if problems:
        raise Stop("assemble stopped:\n  " + "\n  ".join(problems[:40]))
    glossary_raw = find_glossary_raw(state)
    if not glossary_raw:
        raise Stop("no file in the state's glossary folder parses to the same value as the glossary")
    values = {k: s.value for k, s in sources.items()}
    tree, rendered = state.tree_failures(values)
    if tree:
        raise Stop("assemble stopped:\n  " + "\n  ".join(f"{f['rule']} {f['id']}: {f['message']}" for f in tree))
    reviews = state.review_items()
    undecided = state.undecided(reviews)
    if undecided:
        lines = [f"{r['id']} [{r['rule']}]" for r in undecided[:40]]
        raise Stop(f"{len(undecided)} review items have no decision:\n  " + "\n  ".join(lines))

    # Read the text back: every value must match the raw output to the character.
    for catalog, text in rendered.items():
        for e in cat.scan(text):
            if e.value != values[cat.item_id(catalog, e.path)]:
                raise Stop(f"{catalog}: {e.path} changed when written")

    all_rows = state.all_rows()
    ok_rows = [r for r in all_rows if r["status"] == "ok"]
    decisions = state.decisions()
    review_out = []
    grouped = {}
    for r in reviews:
        grouped.setdefault(r["id"], []).append(r["rule"])
    for key, flagged in sorted(grouped.items()):
        d = decisions[key]
        review_out.append({"id": key, "rules": sorted(set(flagged)), "action": d["action"], "reason": d["reason"],
                           "raw_sha256": d["raw_sha256"]})
    manifest = {
        "language": "zh-Hans",
        "tasty_commit": state.manifest["commit"],
        "based_on_commits": [s.manifest["commit"] for s in reversed(states)],
        "catalogs": {f"{info['rel']}/zh-Hans.toml": info["ko"] for info in state.manifest["catalogs"].values()},
        "entries": state.manifest["expected"]["items"],
        "dotted_keys": state.manifest["expected"]["dotted"],
        "display_name": {"glossary_raw_sha256": glossary_raw},
        "execution": {
            "command": f"codex exec --skip-git-repo-check --ephemeral -s {REQUIRED_SANDBOX} "
                       "--output-schema <schema> -o <file> -",
            "models": sorted({r.get("model") for r in ok_rows if r.get("model")}),
            "reasoning_efforts": sorted({r.get("reasoning_effort") for r in ok_rows if r.get("reasoning_effort")}),
            "sandboxes": sorted({r.get("sandbox") for r in ok_rows if r.get("sandbox")}),
            "chunks": sum(len(s.chunks) for s in states),
            "rounds_kept": len(ok_rows),
            "rounds_failed": len(all_rows) - len(ok_rows),
            "repair_rounds": sum(1 for r in ok_rows if r["kind"] == "repair"),
            "retranslate_rounds": sum(1 for r in ok_rows if r["kind"] == "retranslate"),
            "tokens": sum(r.get("tokens") or 0 for r in all_rows),
        },
        "checks": {"failures": 0, "review_items": len(reviews), "undecided": 0},
        "same_as_english": state.same_as_english(),
        "review": review_out,
        "retranslated": [{"chunk": r["chunk"], "round": r["round"], "keys": r["keys"], "reason": r["reason"]}
                         for r in ok_rows if r["kind"] == "retranslate"],
    }
    if state.manifest.get("delta"):
        d = state.manifest["delta"]
        manifest["delta"] = {k: d[k] for k in ("base_commit", "added", "changed", "removed")}
    manifest_text = json.dumps(manifest, ensure_ascii=False, indent=2) + "\n"
    leaks = rules.local_path_violations(manifest_text)
    if leaks:
        raise Stop(f"MANIFEST.json would carry a local path: {leaks}. Fix the reason text.")

    out = os.path.abspath(args.out)
    for catalog, text in rendered.items():
        target = os.path.join(out, state.manifest["catalogs"][catalog]["rel"], "zh-Hans.toml")
        os.makedirs(os.path.dirname(target), exist_ok=True)
        with open(target, "w", encoding="utf-8", newline="") as f:
            f.write(text)
        with open(target, "rb") as f:
            again = cat.scan(f.read().decode("utf-8"))
        if {e.path: e.value for e in again} != {e.path: values[cat.item_id(catalog, e.path)] for e in again}:
            raise Stop(f"{target} does not read back as the raw values")
    with open(os.path.join(out, "MANIFEST.json"), "w", encoding="utf-8") as f:
        f.write(manifest_text)
    print(f"assembled {len(rendered)} files, {manifest['entries']} entries, into {out}")
    return 0


# --- command line ---


def parser():
    p = argparse.ArgumentParser(description=__doc__)
    sub = p.add_subparsers(dest="command", required=True)

    def add(name, fn):
        c = sub.add_parser(name)
        c.set_defaults(fn=fn)
        c.add_argument("--state", required=True, help="the state folder")
        c.add_argument("--glossary", help="glossary JSON. Default: the one in vendor/i18n/zh-Hans")
        return c

    def codex_options(c):
        c.add_argument("--codex-bin", help="the Codex executable. Default: codex on PATH")
        c.add_argument("--model", help="passed to codex exec. Default: the Codex setting")
        c.add_argument("--timeout", type=int, default=DEFAULT_TIMEOUT, help="seconds per round")

    c = add("prepare", cmd_prepare)
    c.add_argument("--tasty", required=True)
    c.add_argument("--commit", required=True)
    c.add_argument("--delta-from", help="an earlier state folder: only new and changed entries get chunks")
    c.add_argument("--max-keys", type=int, default=cat.MAX_KEYS)
    c.add_argument("--max-chars", type=int, default=cat.MAX_EN_CHARS)

    c = add("run", cmd_run)
    c.add_argument("--chunk", action="append")
    c.add_argument("--pending", action="store_true")
    c.add_argument("--include-stale", action="store_true")
    c.add_argument("--force", action="store_true")
    c.add_argument("--jobs", type=int, default=1)
    codex_options(c)

    c = add("repair", cmd_repair)
    c.add_argument("--chunk", required=True)
    codex_options(c)

    c = add("retranslate", cmd_retranslate)
    c.add_argument("--keys", required=True, help="comma separated ids, or a file with one id per line")
    c.add_argument("--reason", required=True)
    c.add_argument("--jobs", type=int, default=1)
    codex_options(c)

    c = add("decide", cmd_decide)
    c.add_argument("--key", action="append")
    c.add_argument("--keys-file")
    c.add_argument("--keep", action="store_true", required=True)
    c.add_argument("--reason", required=True)

    c = add("status", cmd_status)
    c.add_argument("--json", action="store_true")

    c = add("check", cmd_check)
    c.add_argument("--chunk")
    c.add_argument("--lang", choices=("ko", "ja"))
    c.add_argument("--json", help="also write failures and the review list to this file")

    c = add("assemble", cmd_assemble)
    c.add_argument("--out", required=True)
    return p


def main(argv=None):
    args = parser().parse_args(argv)
    try:
        return args.fn(args)
    except (Stop, cat.CatalogError) as e:
        print(e, file=sys.stderr)
        return 2


if __name__ == "__main__":
    sys.exit(main())

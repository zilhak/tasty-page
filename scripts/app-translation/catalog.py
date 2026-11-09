"""Read the Tasty language catalogs and write a translated copy of one.

The scanner keeps document order and the position of every string value, which
tomllib does not. Every scan is compared with tomllib, so a scanner bug stops the
tool instead of producing a wrong file.
"""
import json
import re
import subprocess
import tomllib
from collections import namedtuple

# The commit the translation is pinned to, with what it must contain. A count that
# differs means the input is not the one the plan measured, so prepare stops.
BASELINE_COMMIT = "0801838a8d779843b49423496f0f1e2905f28152"
BASELINES = {
    BASELINE_COMMIT: {
        "catalogs": {
            "lang": {"ko": 3736, "en": 3797, "en_chars": 195716},
            "claude": {"ko": 260, "en": 261, "en_chars": 28017},
            "codex": {"ko": 168, "en": 168, "en_chars": 14608},
            "markdown": {"ko": 70, "en": 70, "en_chars": 1339},
            "image": {"ko": 55, "en": 55, "en_chars": 1196},
            "agent-stream": {"ko": 38, "en": 38, "en_chars": 4088},
            "git-viewer": {"ko": 26, "en": 26, "en_chars": 356},
            "clipboard-viewer": {"ko": 24, "en": 26, "en_chars": 608},
            "html": {"ko": 20, "en": 20, "en_chars": 518},
            "mesh-demo": {"ko": 3, "en": 3, "en_chars": 42},
        },
        "items": 4400,
        "dotted": 4399,
        "public": {"local_guide_dir": 12, "account_example": 48},
    }
}

CATALOG_ORDER = [
    "lang", "claude", "codex", "markdown", "image", "agent-stream",
    "git-viewer", "clipboard-viewer", "html", "mesh-demo",
]

MAX_KEYS = 200
MAX_EN_CHARS = 8000

# The display name comes from the glossary, not from a Codex round.
GLOSSARY_KEY = ("lang", ("meta", "name"))

FIRST_LINE = re.compile(r"^# Tasty .*\(ko\)[ \t]*$")
FIRST_LINE_ZH = "# Tasty Terminal Emulator - Simplified Chinese (zh-Hans)"

Entry = namedtuple("Entry", "path start end value")

_BARE = re.compile(r"[A-Za-z0-9_-]+")


class CatalogError(Exception):
    pass


def path_str(path):
    return ".".join(s if _BARE.fullmatch(s) else json.dumps(s, ensure_ascii=False) for s in path)


def dotted(path):
    """The key the loader sees (flatten_catalog_toml, crates/tasty-i18n/src/lib.rs)."""
    return ".".join(path)


def item_id(catalog, path):
    # The TOML path, not the dotted key: two entries can flatten to one dotted key.
    return f"{catalog}:{path_str(path)}"


def _string_end(text, i):
    if text.startswith('"""', i):
        j = i + 3
        while True:
            if j >= len(text):
                raise CatalogError("unterminated multi-line string")
            if text[j] == "\\":
                j += 2
            elif text.startswith('"""', j):
                end = j + 3
                while end < len(text) and text[end] == '"' and end - (j + 3) < 2:
                    end += 1
                return end
            else:
                j += 1
    if text.startswith("'''", i):
        j = text.find("'''", i + 3)
        if j < 0:
            raise CatalogError("unterminated literal string")
        end = j + 3
        while end < len(text) and text[end] == "'" and end - (j + 3) < 2:
            end += 1
        return end
    if text[i] == '"':
        j = i + 1
        while j < len(text) and text[j] not in '"\n':
            j += 2 if text[j] == "\\" else 1
        if j >= len(text) or text[j] != '"':
            raise CatalogError("unterminated string")
        return j + 1
    if text[i] == "'":
        j = text.find("'", i + 1)
        if j < 0:
            raise CatalogError("unterminated literal string")
        return j + 1
    raise CatalogError(f"only string values are supported, found {text[i:i + 20]!r}")


def _decode(raw):
    return tomllib.loads("v = " + raw)["v"]


def _key_path(text, i, stop):
    parts = []
    while True:
        while text[i] in " \t":
            i += 1
        if text[i] in "\"'":
            end = _string_end(text, i)
            parts.append(_decode(text[i:end]))
            i = end
        else:
            m = _BARE.match(text, i)
            if not m:
                raise CatalogError(f"bad key at {text[i:i + 30]!r}")
            parts.append(m.group())
            i = m.end()
        while text[i] in " \t":
            i += 1
        if text[i] == ".":
            i += 1
            continue
        if text[i] != stop:
            raise CatalogError(f"expected {stop!r} at {text[i:i + 30]!r}")
        return tuple(parts), i + 1


def _flatten(table, prefix=()):
    for key, value in table.items():
        if isinstance(value, dict):
            yield from _flatten(value, prefix + (key,))
        else:
            yield prefix + (key,), value


def scan(text):
    """Every value in document order. Stops on anything tomllib reads differently."""
    entries = []
    table = ()
    i = 0
    n = len(text)
    while i < n:
        c = text[i]
        if c in " \t\r\n":
            i += 1
        elif c == "#":
            nl = text.find("\n", i)
            i = n if nl < 0 else nl
        elif text.startswith("[[", i):
            raise CatalogError("arrays of tables are not supported")
        elif c == "[":
            table, i = _key_path(text, i + 1, "]")
        else:
            key, i = _key_path(text, i, "=")
            while text[i] in " \t":
                i += 1
            end = _string_end(text, i)
            entries.append(Entry(table + key, i, end, _decode(text[i:end])))
            i = end
    parsed = dict(_flatten(tomllib.loads(text)))
    if len(entries) != len(parsed) or parsed != {e.path: e.value for e in entries}:
        raise CatalogError("the scanner and tomllib disagree")
    return entries


def toml_string(value):
    """Write a value as a TOML basic string. tomllib reads it back unchanged."""
    out = []
    multi = "\n" in value
    quotes = 0  # unescaped quotes just written: three in a row would close a multi-line string
    for n, ch in enumerate(value):
        o = ord(ch)
        if ch == '"' and multi and quotes < 2 and n < len(value) - 1:
            out.append('"')
            quotes += 1
            continue
        quotes = 0
        if ch == "\\":
            out.append("\\\\")
        elif ch == '"':
            out.append('\\"')
        elif ch == "\n":
            out.append("\n")
        elif ch == "\t":
            out.append("\\t")
        elif ch == "\r":
            out.append("\\r")
        elif o < 0x20 or o == 0x7F:
            out.append(f"\\u{o:04X}")
        else:
            out.append(ch)
    body = "".join(out)
    if not multi:
        return f'"{body}"'
    # A newline right after the opening quotes is not part of the value.
    return f'"""\n{body}"""'


def render(template, values):
    """Replace only the values of the ko file: order, sections and comments stay."""
    pieces = []
    last = 0
    for e in scan(template):
        pieces.append(template[last:e.start])
        pieces.append(toml_string(values[e.path]))
        last = e.end
    pieces.append(template[last:])
    text = "".join(pieces)
    first, sep, rest = text.partition("\n")
    if FIRST_LINE.match(first):
        text = FIRST_LINE_ZH + sep + rest
    return text


def git(tasty, *args):
    r = subprocess.run(["git", "-C", tasty, *args], capture_output=True, text=True, encoding="utf-8")
    if r.returncode != 0:
        raise CatalogError(f"git {' '.join(args)}: {r.stderr.strip()}")
    return r.stdout


def discover(tasty, commit):
    """Catalog id to folder, in the order of the plan's table."""
    found = {}
    for line in git(tasty, "ls-tree", "-r", "--name-only", commit).splitlines():
        if line == "lang/ko.toml":
            found["lang"] = "lang"
        else:
            m = re.fullmatch(r"crates/([^/]+)/lang/ko\.toml", line)
            if m:
                found[m.group(1).removeprefix("tasty-plugin-")] = f"crates/{m.group(1)}/lang"
    order = [c for c in CATALOG_ORDER if c in found] + sorted(set(found) - set(CATALOG_ORDER))
    return {c: found[c] for c in order}


def build_items(sources):
    """Every entry of every ko file, joined with en and ja by TOML path."""
    from rules import constraints

    items = []
    for catalog, langs in sources.items():
        en = scan(langs["en"])
        ja = scan(langs["ja"])
        en_path = {e.path: e.value for e in en}
        en_key = {dotted(e.path): e.value for e in en}
        ja_path = {e.path: e.value for e in ja}
        ja_key = {dotted(e.path): e.value for e in ja}
        for e in scan(langs["ko"]):
            key = dotted(e.path)
            en_value = en_path.get(e.path, en_key.get(key))
            ja_value = ja_path.get(e.path, ja_key.get(key))
            if en_value is None or ja_value is None:
                raise CatalogError(f"{catalog}: {key} is in ko but not in en or ja")
            item = {
                "id": item_id(catalog, e.path),
                "catalog": catalog,
                "path": list(e.path),
                "key": key,
                "en": en_value,
                "ko": e.value,
                "ja": ja_value,
                "constraints": constraints(catalog, key),
            }
            if (catalog, e.path) == GLOSSARY_KEY:
                item["source"] = "glossary"
            items.append(item)
    return items


def en_only_keys(sources):
    """en keys with no ko entry. Each must be a `_one` variant of a key that exists."""
    variants, others = [], []
    for catalog, langs in sources.items():
        en = {dotted(e.path) for e in scan(langs["en"])}
        ko = {dotted(e.path) for e in scan(langs["ko"])}
        for key in sorted(en - ko):
            if key.endswith("_one") and key[: -len("_one")] in en:
                variants.append(f"{catalog}:{key}")
            else:
                others.append(f"{catalog}:{key}")
    return variants, others


def _group(item):
    path = item["path"]
    if path[0] == "cli" and len(path) > 1 and path[1].startswith("help"):
        return tuple(path[:3])
    return tuple(path[:1])


def make_chunks(items, max_keys=MAX_KEYS, max_chars=MAX_EN_CHARS):
    """Fill chunks in catalog, then section order, cutting only at a limit.

    Entries that flatten to one dotted key stay together so their values can be compared.
    """
    units = {}
    for it in items:
        units.setdefault((it["catalog"], it["key"]), []).append(it)
    grouped = {}
    for (catalog, _), unit in units.items():
        grouped.setdefault((catalog, _group(unit[0])), []).append(unit)
    chunks, current, chars = [], [], 0
    for unit_list in grouped.values():
        for unit in unit_list:
            size = sum(len(i["en"]) for i in unit)
            if current and (len(current) + len(unit) > max_keys or chars + size > max_chars):
                chunks.append(current)
                current, chars = [], 0
            current.extend(unit)
            chars += size
    if current:
        chunks.append(current)
    return [{"id": f"c{n:03d}", "items": c} for n, c in enumerate(chunks, 1)]

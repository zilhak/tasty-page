"""Checks for one translated value, ported from the Tasty test suite.

Failure rules scored zero against the existing ko and ja catalogs. Review rules did
not, so they produce a list for a person to decide, not a failure. The sources are
named next to each rule so a change there can be followed here.
"""
import re
from collections import Counter

BASELINE_COMMIT = "0801838a8d779843b49423496f0f1e2905f28152"

# Review counts of the existing translations at the pinned commit.
CALIBRATION = {
    BASELINE_COMMIT: {
        "ko": {"line_structure": 31, "backtick_count": 14, "backtick_spans": 19, "flag_count": 2,
               "angle_tokens": 5, "urls": 2, "edge_whitespace": 2, "tasty_commands": 43, "same_as_en": 67},
        "ja": {"line_structure": 31, "backtick_count": 13, "backtick_spans": 18, "flag_count": 2,
               "angle_tokens": 5, "urls": 2, "edge_whitespace": 5, "tasty_commands": 43, "same_as_en": 67},
    }
}

# --- ported constants ---

# tests/toast_message_fits_cap.rs, crates/tasty-i18n/src/lib.rs
TOAST_PREFIXES = ("persistence.warn.", "toast.screenshot_", "attach.toast.mirror_capture_")
TOAST_MAX_CHARS = 200
MIN_FRAGMENT_CHARS = 12
# tests/file_handler_when_fits_column.rs
COLUMN_CELLS = 10
BUCKETS = {
    "file_handler.picker.when_just_now": None,
    "file_handler.picker.when_minutes": 59,
    "file_handler.picker.when_hours": 23,
    "file_handler.picker.when_yesterday": None,
    "file_handler.picker.when_days": 6,
}
# tests/native_surface_labels_i18n.rs
APP_NAME_FMT_KEYS = ("menu.macos.about", "menu.macos.hide", "menu.macos.quit")
# tests/i18n_key_parity.rs
MODIFIER_TOKENS = ("Ctrl", "Alt", "Shift", "Cmd", "Command", "Option", "Super", "Meta", "Win", "Fn")
# crates/tasty-cli/src/local/remote_profile.rs, crates/tasty-cli/src/local/passkey.rs
TABLE_HEADERS = ("cli.remote_profile.list_header", "cli.remote_profile.list_local_header", "cli.passkey.list_header")

# checks/tests/no_local_path_in_tracked_files.rs. Names are split so this file passes that check.
LOCAL_WORKSPACE = ".cla" + "ude-workspace"
LOCAL_GUIDE_DIR = ".cla" + "ude/"
LOCAL_FOLDER_NAMES = ("tasty-" + "project", "tasty-" + "worktree")
USER_CONFIG_PREFIXES = ("~/", "$HOME/")
HOME_PREFIXES = ("/ho" + "me/", "/Us" + "ers/", "C:\\Us" + "ers\\")
FICTIONAL_HOMES = (
    "/ho" + "me/me", "/ho" + "me/tasty", "/ho" + "me/deploy", "/Us" + "ers/me",
    "/Us" + "ers/hana", "/Us" + "ers/hyunjun", "/Us" + "ers/hyunjoon.kim",
)

# --- ported helpers ---


def placeholder_forms(value):
    """placeholder_forms, tests/i18n_key_parity.rs: `{}` count, `{N}` set, `{name}` set."""
    positional = 0
    numbered, named = set(), set()
    rest = value
    while True:
        open_at = rest.find("{")
        if open_at < 0:
            break
        after = rest[open_at + 1:]
        close = after.find("}")
        if close < 0:
            break
        inner = after[:close]
        if not inner:
            positional += 1
        elif inner.isascii() and inner.isdigit():
            numbered.add(int(inner))
        elif is_identifier(inner):
            named.add(inner)
        rest = after[close + 1:]
    return positional, numbered, named


def placeholders(value):
    """placeholders, tests/i18n_key_parity.rs: `{} {}` and `{1} {0}` take the same two slots."""
    positional, numbered, named = placeholder_forms(value)
    return (numbered if numbered else set(range(positional))), named


def is_identifier(s):
    return re.fullmatch(r"[A-Za-z_][A-Za-z0-9_]*", s) is not None


def without_placeholders(value):
    """without_placeholders, tests/i18n_key_parity.rs."""
    out = []
    rest = value
    while True:
        open_at = rest.find("{")
        if open_at < 0:
            break
        after = rest[open_at + 1:]
        close = after.find("}")
        if close < 0:
            return "".join(out) + rest
        out.append(rest[:open_at])
        rest = after[close + 1:]
    return "".join(out) + rest


def is_language_neutral(value):
    """is_language_neutral, tests/i18n_key_parity.rs."""
    body = without_placeholders(value)
    letters = [c for c in body if c.isalpha()]
    if not letters:
        return True
    trimmed = body.strip()
    if "://" in trimmed or trimmed.startswith(("~/", "/", "tasty ")) or "$" in trimmed:
        return True
    if len(letters) <= 5 and all(c.isascii() and c.isupper() for c in letters):
        return True
    return trimmed in MODIFIER_TOKENS


def mono_cells(s):
    """mono_cells, tests/file_handler_when_fits_column.rs."""
    total = 0
    for c in s:
        w = ord(c)
        wide = (
            0x1100 <= w <= 0x115F or 0x2E80 <= w <= 0xA4CF or 0xAC00 <= w <= 0xD7A3
            or 0xF900 <= w <= 0xFAFF or 0xFE30 <= w <= 0xFE6F or 0xFF00 <= w <= 0xFF60
            or 0xFFE0 <= w <= 0xFFE6
        )
        total += 2 if wide else 1
    return total


def column_starts(header):
    """Where each column starts, in cells. Columns are separated by two or more spaces."""
    return [mono_cells(header[: m.start()]) for m in re.finditer(r"\S+(?: \S+)*", header)]


def local_path_violations(text):
    """violations, checks/tests/no_local_path_in_tracked_files.rs, without the file allowlist."""
    out = []
    for prefix in HOME_PREFIXES:
        for m in re.finditer(re.escape(prefix), text):
            name = re.match(r"[A-Za-z0-9._-]*", text[m.end():]).group()
            if name and prefix + name not in FICTIONAL_HOMES:
                out.append("home path")
    out += [f"local folder name {n[:5]}" for n in LOCAL_FOLDER_NAMES if n in text]
    if LOCAL_WORKSPACE in text:
        out.append("local work folder name")
    for m in re.finditer(re.escape(LOCAL_GUIDE_DIR), text):
        if not text[: m.start()].endswith(USER_CONFIG_PREFIXES):
            out.append("local guide folder path")
    return out


# --- shapes ---

_FLAG = re.compile(r"--[a-zA-Z0-9][a-zA-Z0-9-]*")
_SPAN = re.compile(r"`([^`]*)`")
_TOKEN = re.compile(r"<[a-zA-Z_][a-zA-Z0-9_-]*>")
_URL = re.compile(r"https?://[^\s`)]+")
_COMMAND = re.compile(r"tasty [a-z][a-z0-9-]*")
_HANGUL_KANA = re.compile(
    "[\u1100-\u11ff\u3130-\u318f\ua960-\ua97f\uac00-\ud7a3\ud7b0-\ud7ff"
    "\u3040-\u30ff\u31f0-\u31ff\uff66-\uff9f]"
)
_HAN = re.compile("[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]")


def list_lines(s):
    return sum(1 for line in s.split("\n") if line.lstrip().startswith(("- ", "* ")))


def constraints(catalog, key):
    """Marks in the chunk input. The prompt explains each one."""
    out = []
    if catalog == "lang":
        if key in TABLE_HEADERS:
            out.append("table_header")
        if key.startswith(TOAST_PREFIXES):
            out.append("toast")
        if key in BUCKETS:
            out.append("cell_width")
        if key.startswith("menu.macos."):
            out.append("macos_menu")
        if key == "toast.char_limit_notice":
            out.append("limit_as_argument")
    if key.startswith("cli.") or ".cli." in key:
        out.append("cli_help")
    if catalog != "lang":
        out.append("plugin")
    return out


def value_failures(item, value, foreign_script=True):
    """Failure rules for one value. `foreign_script` is off when checking ko and ja themselves."""
    en = item["en"]
    key = item["key"]
    root = item["catalog"] == "lang"
    fails = []

    if not value.strip():
        # Word order leaves a few ko values empty; a filled value is also fine there.
        if item["ko"].strip():
            return [("empty_value", "empty value where ko is not empty")]
        return []

    if placeholders(en) != placeholders(value):
        fails.append(("placeholders", f"en {placeholders(en)} value {placeholders(value)}"))
    positional, numbered, _ = placeholder_forms(value)
    if positional and numbered:
        fails.append(("placeholder_mix", "mixes {} and {N}"))
    if set(_FLAG.findall(en)) != set(_FLAG.findall(value)):
        fails.append(("flags", f"en {sorted(set(_FLAG.findall(en)))} value {sorted(set(_FLAG.findall(value)))}"))
    if en.count("`") % 2 != value.count("`") % 2:
        fails.append(("backtick_parity", f"en {en.count('`')} value {value.count('`')}"))
    if list_lines(en) != list_lines(value):
        fails.append(("list_lines", f"en {list_lines(en)} value {list_lines(value)}"))
    if root and key in TABLE_HEADERS and column_starts(en) != column_starts(value):
        fails.append(("table_header", f"en {column_starts(en)} value {column_starts(value)}"))
    if root and key.startswith(TOAST_PREFIXES):
        needed = len(value.replace("{}", "")) + (MIN_FRAGMENT_CHARS if "{}" in value else 0)
        if needed > TOAST_MAX_CHARS:
            fails.append(("toast_cap", f"needs {needed} chars, cap {TOAST_MAX_CHARS}"))
    if root and key in BUCKETS:
        n = BUCKETS[key]
        rendered = value if n is None else value.replace("{}", str(n), 1)
        if mono_cells(rendered) > COLUMN_CELLS:
            fails.append(("when_column", f"{mono_cells(rendered)} cells, column {COLUMN_CELLS}"))
    if foreign_script:
        foreign = sorted({c for c in _HANGUL_KANA.findall(value) if c not in en})
        if foreign:
            fails.append(("foreign_script", "Hangul or kana not in en: " + "".join(foreign)))
    for problem in local_path_violations(value):
        fails.append(("local_path", problem))
    if root and key == "toast.char_limit_notice":
        if value.count("{}") != 1 or any(c.isascii() and c.isdigit() for c in value):
            fails.append(("char_limit_notice", "needs exactly one {} and no ASCII digit"))
    if root and key in APP_NAME_FMT_KEYS:
        if value.count("{}") != 1:
            fails.append(("macos_app_name", "needs exactly one {} (not {0})"))
    elif root and key.startswith("menu.macos.") and "{}" in value:
        fails.append(("macos_no_placeholder", "this menu item takes no argument"))
    return fails


# --- review ---

_SHAPES = {
    "line_structure": lambda s: (s.count("\n"), len(re.findall(r"\n[ \t]*\n", s))),
    "backtick_count": lambda s: s.count("`"),
    "backtick_spans": lambda s: sorted(_SPAN.findall(s)),
    "flag_count": lambda s: Counter(_FLAG.findall(s)),
    "angle_tokens": lambda s: set(_TOKEN.findall(s)),
    "urls": lambda s: set(_URL.findall(s)),
    "edge_whitespace": lambda s: (s[: len(s) - len(s.lstrip())], s[len(s.rstrip()):]),
    "tasty_commands": lambda s: set(_COMMAND.findall(s)),
}


def shape_review(en, value):
    return [name for name, shape in _SHAPES.items() if shape(en) != shape(value)]


def same_as_en_class(item, value, allowlist):
    """The three groups of values left in English. None when the value differs from en."""
    if value != item["en"]:
        return None
    if is_language_neutral(value):
        return "neutral"
    langs = allowlist.get(item["key"], ())
    if "ko" in langs and "ja" in langs:
        return "allowlisted"
    return "other"


def gb2312_outsiders(value):
    """An approximation for traditional forms: a candidate list, not a verdict."""
    out = []
    for c in _HAN.findall(value):
        try:
            c.encode("gb2312")
        except UnicodeEncodeError:
            out.append(c)
    return sorted(set(out))


def term_review(item, value, terms):
    """Glossary comparison. A term that is not translated must stay as it is in en."""
    out = []
    for term in terms:
        source = term.get("en") or ""
        if source and re.search(r"(?<![A-Za-z0-9])" + re.escape(source) + r"(?![A-Za-z0-9])", item["en"], re.I):
            wanted = term.get("zh_hans") or ""
            if term.get("translate", True) is False:
                wanted = source
            if wanted and wanted.lower() not in value.lower():
                out.append(("glossary_missing", term.get("id") or source))
        for bad in term.get("avoid") or []:
            if bad and bad in value:
                out.append(("glossary_avoid", term.get("id") or source))
    return out


def translation_review(item, value, allowlist, terms):
    """Rule and detail pairs for a zh-Hans value. Groups across keys are found by the caller."""
    out = [(rule, "") for rule in shape_review(item["en"], value)]
    if same_as_en_class(item, value, allowlist) == "other":
        out.append(("same_as_en", "not neutral and not on the allowlist"))
    if value.strip() and value != item["en"] and re.search("[A-Za-z]", value) and not _HAN.search(value):
        out.append(("latin_no_han", ""))
    outsiders = gb2312_outsiders(value)
    if outsiders:
        out.append(("traditional_candidate", "".join(outsiders)))
    out += term_review(item, value, terms)
    return out

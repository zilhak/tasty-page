#!/usr/bin/env python3
"""Check the token tier rules in the three token CSS files.

usage: verify_token_tiers.py <project-dir>
  e.g. verify_token_tiers.py vendor

The rules are in vendor/TOKENS.md: the three tiers and raw primitives, "Part-only
measures", "Component references" and "Literal parameters". This script checks only
what a machine can settle from the CSS. Whether a measure belongs to one part, whether
a role with the same meaning exists, and whether a component reference is a composition
or a peer stay review rules. So do the ingredients inside a composite value (for example
a literal color inside color-mix()): R1 to R4 do not judge them.

It reads only tokens/primitives.css, tokens/semantic.css and tokens/components.css.
The tokens.css copy is compared by check-tokens-copy.mjs, not here.

Declarations, read strictly (file:line on failure):
  - Blocks are a base block (:root, ":root, [data-theme]" or
    ':root, [data-theme="mocha"]') and an optional Latte block, exactly
    [data-theme="latte"], after the base block. No other selectors, nesting or @-rules.
  - Each declaration is --tasty-<name>: <value>; with <name> in [a-z0-9-]+. A value has
    no comment, no !important, and no quoted semicolon. A quoted string is one atom; one
    whose content would change when whitespace is collapsed is rejected.
  - A name is declared once per theme and in one tier only.
  - The declarations must be the same set gen_tokens_json.collect() reads.

Rules, for base and Latte declarations each:
  R3a  Every variable function is exactly var(--tasty-<name>) and names a declared
       token. Primitives use no var(); semantic reads primitive and semantic;
       component reads all three. No alias cycle in the base or the Latte values
       (a Latte map is the base values with the Latte values over them).
  R1   A component reads a primitive only from the size-, radius- and duration- scales.
  R2   The same check, with its own message for color- and alpha-.
  R4   A component value with no var() is a listed literal of the right shape (LITERALS).
  Size, radius and duration primitives and component literals have no Latte value.

Prints each violation and the counts, and exits 1 on any violation.
"""
import os, re, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.dont_write_bytecode = True  # keep __pycache__ out of the working tree
import gen_tokens_json as g
from verify_ground_ink_tokens import var_arguments, var_functions

FILES = {"primitive": "primitives.css", "semantic": "semantic.css", "component": "components.css"}
BASE_SELECTORS = {":root", ":root, [data-theme]", ':root, [data-theme="mocha"]'}
LATTE_SELECTOR = '[data-theme="latte"]'
NAME = re.compile(r"--tasty-([a-z0-9-]+)")
REFERENCE = re.compile(r"var\(--tasty-([a-z0-9-]+)\)")
NEW_DECLARATION = re.compile(r"\n\s*--[\w-]*\s*:")
MARKER = "/* @kind other */"
PART_SCALES = ("size-", "radius-", "duration-")
ROLE_SCALES = ("color-", "alpha-")

# The listed component literals and their kinds. The table and its reasons are in
# vendor/TOKENS.md "Literal parameters"; a new literal is reviewed in the commit that adds it here.
LITERALS = {
    "notification-item-body-lines": "count",
    "notification-item-body-lines-wide": "count",
    "explorer-favorites-pin-ratio": "coefficient",
    "cut-pending-font-style": "keyword",
    "titlebar-csd-shadow": "window-shadow",
    "dag-edge-dash-fallback": "dash",
    "dag-edge-dash-reduce": "dash",
    "dag-edge-dash-binding": "dash",
    "dag-edge-dash-transition": "dash",
}
LENGTH = r"(?:0|-?[0-9]+px)"
BLUR = r"(?:0|[0-9]+px)"
SHADOW = re.compile(rf"({LENGTH}) ({LENGTH}) ({BLUR}) ({LENGTH}) rgba\(([^()]*)\)")
ALPHA = re.compile(r"(?:[0-9]+(?:\.[0-9]+)?|\.[0-9]+)")


def shadow_ok(value):
    m = SHADOW.fullmatch(value)
    if not m:
        return False
    parts = [p.strip() for p in m.group(5).split(",")]
    return (len(parts) == 4 and parts[:3] == ["0", "0", "0"]
            and bool(ALPHA.fullmatch(parts[3])) and float(parts[3]) <= 1)


SHAPES = {
    "count": lambda v: re.fullmatch(r"[0-9]+", v) is not None,
    "coefficient": lambda v: re.fullmatch(r"0?\.[0-9]+|[0-9]+\.[0-9]+", v) is not None,
    "dash": lambda v: re.fullmatch(r"[1-9][0-9]*(?: [1-9][0-9]*)+", v) is not None,
    "keyword": lambda v: v == "italic",
    "window-shadow": shadow_ok,
}


class Decl:
    def __init__(self, tier, theme, key, value, path, line, marker):
        self.tier, self.theme, self.key, self.value = tier, theme, key, value
        self.path, self.line, self.marker = path, line, marker

    @property
    def where(self):
        return f"{self.path}:{self.line}"

    @property
    def collapsed(self):
        return re.sub(r"\s+", " ", self.value).strip()


class Reader:
    """Strict reader of one token CSS file."""

    def __init__(self, tier, path):
        self.tier, self.path = tier, path
        with open(path, encoding="utf-8") as f:
            self.text = f.read()
        self.i = 0
        self.decls, self.errors = [], []

    def line(self, at=None):
        return self.text.count("\n", 0, self.i if at is None else at) + 1

    def fail(self, message, at=None):
        raise ValueError(f"{self.path}:{self.line(at)}: {message}")

    def skip_space_and_comments(self):
        t = self.text
        while self.i < len(t):
            if t[self.i].isspace():
                self.i += 1
            elif t.startswith("/*", self.i):
                end = t.find("*/", self.i + 2)
                if end < 0:
                    self.fail("unclosed comment")
                self.i = end + 2
            else:
                return

    def read(self):
        t = self.text
        seen_base = seen_latte = False
        while True:
            self.skip_space_and_comments()
            if self.i >= len(t):
                break
            start = self.i
            end = t.find("{", start)
            stop = min(x for x in (t.find(";", start), t.find("}", start), len(t)) if x >= 0)
            if end < 0 or stop < end:
                self.fail("text outside a block")
            selector = re.sub(r"\s+", " ", t[start:end]).strip()
            if "/*" in selector or selector.startswith("@"):
                self.fail(f"unsupported selector {selector!r}", start)
            if selector == LATTE_SELECTOR:
                if not seen_base:
                    self.fail("Latte block before the base block", start)
                if seen_latte:
                    self.fail("a second Latte block", start)
                seen_latte, theme = True, "latte"
            elif selector in BASE_SELECTORS:
                if seen_base or seen_latte:
                    self.fail("a second base block, or a base block after the Latte block", start)
                seen_base, theme = True, "mocha"
            else:
                self.fail(f"unsupported selector {selector!r}", start)
            self.i = end + 1
            self.read_block(theme)
        return self.decls

    def read_block(self, theme):
        t = self.text
        while True:
            self.skip_space_and_comments()
            if self.i >= len(t):
                self.fail("block not closed")
            if t[self.i] == "}":
                self.i += 1
                return
            m = re.compile(r"(--[^\s:;{}]*)\s*:").match(t, self.i)
            if not m:
                self.fail("expected a --tasty-<name>: declaration")
            name = m.group(1)
            n = NAME.fullmatch(name)
            if not n:
                self.fail(f"declaration name outside --tasty-[a-z0-9-]+: {name}")
            self.i = m.end()
            value, semi = self.read_value()
            marker = self.marker_after(semi)
            self.decls.append(Decl(self.tier, theme, n.group(1), value, self.path, self.line(semi), marker))

    def read_value(self):
        t = self.text
        start, depth = self.i, 0
        while self.i < len(t):
            c = t[self.i]
            if c in "\"'":
                close = self.i + 1
                while close < len(t) and t[close] != c:
                    if t[close] == "\\":
                        close += 1
                    elif t[close] == "\n":
                        break
                    close += 1
                if close >= len(t) or t[close] != c:
                    self.fail("unclosed string")
                content = t[self.i + 1:close]
                if ";" in content:
                    self.fail("semicolon inside a quoted string")
                if re.sub(r"\s+", " ", content) != content:
                    self.fail("whitespace inside a quoted string would be collapsed")
                self.i = close + 1
                continue
            if t.startswith("/*", self.i):
                self.fail("comment inside a value")
            if c == "!":
                self.fail("!important or ! inside a value")
            if c == "(":
                depth += 1
            elif c == ")":
                depth -= 1
                if depth < 0:
                    self.fail("unbalanced ) in a value")
            elif c in "{}" and depth == 0:
                self.fail("missing semicolon before the end of the block" if c == "}" else "nested rule")
            elif c == ";" and depth == 0:
                value = t[start:self.i]
                if NEW_DECLARATION.search(value):
                    self.fail("missing semicolon: a new declaration starts inside the value",
                              start + NEW_DECLARATION.search(value).start() + 1)
                semi = self.i
                self.i += 1
                return value.strip(), semi
            self.i += 1
        self.fail("missing semicolon at the end of the file")

    def marker_after(self, semi):
        """The first comment on the line of the semicolon, right after it (only blanks between)."""
        m = re.compile(r"[ \t]*(/\*.*?\*/)").match(self.text, semi + 1)
        return m.group(1) if m else None


def references(d):
    """-> [token names] of the var() functions in a declaration, or raises ValueError."""
    out = []
    for f in var_functions(d.value):
        _, _, end = var_arguments(d.value, f.end())
        raw = d.value[f.start():end + 1]
        m = REFERENCE.fullmatch(raw)
        if not m:
            raise ValueError(f"variable function not in the form var(--tasty-<name>): {raw!r}")
        out.append(m.group(1))
    return out


def cycles(graph):
    """-> [cycle paths], one per cycle, each starting at its smallest name."""
    found, state = {}, {}
    for root in sorted(graph):
        if root in state:
            continue
        stack = [(root, iter(sorted(graph[root])))]
        path = [root]
        state[root] = "open"
        while stack:
            node, it = stack[-1]
            nxt = next(it, None)
            if nxt is None:
                state[node] = "done"
                stack.pop()
                path.pop()
            elif state.get(nxt) == "open":
                loop = path[path.index(nxt):]
                k = loop.index(min(loop))
                loop = loop[k:] + loop[:k]
                found.setdefault(tuple(loop), loop + [loop[0]])
            elif nxt not in state:
                state[nxt] = "open"
                path.append(nxt)
                stack.append((nxt, iter(sorted(graph.get(nxt, ())))))
    return list(found.values())


def check(project):
    errors = []
    decls = []
    for tier, name in FILES.items():
        r = Reader(tier, f"{project}/tokens/{name}")
        try:
            decls += r.read()
        except ValueError as e:
            errors.append(f"read: {e}")
    if errors:
        return errors, None

    # one declaration per theme and tier, one tier per name
    where = {}
    for d in decls:
        k = (d.theme, d.key)
        if k in where:
            errors.append(f"duplicate: --tasty-{d.key} ({d.theme}) at {where[k].where} and {d.where}")
        else:
            where[k] = d
    owner_at = {}
    for d in decls:
        if d.theme != "mocha":
            continue
        if d.key in owner_at and owner_at[d.key].tier != d.tier:
            errors.append(f"two tiers: --tasty-{d.key} at {owner_at[d.key].where} and {d.where}")
        owner_at.setdefault(d.key, d)
    for d in decls:
        if d.theme == "latte" and (d.key not in owner_at or owner_at[d.key].tier != d.tier):
            errors.append(f"Latte value without a base value in its tier: --tasty-{d.key} at {d.where}")
    if errors:
        return errors, None

    # the same declarations as collect()
    try:
        tiers = g.collect(project)
    except SystemExit as e:
        return [f"collect(): {e}"], None
    theirs = {(t, th, k, v) for t, (base, latte) in tiers.items()
              for th, m in (("mocha", base), ("latte", latte)) for k, v in m.items()}
    ours = {(d.tier, d.theme, d.key, d.collapsed) for d in decls}
    for x in sorted(ours - theirs):
        errors.append(f"read differently from collect(): {x}")
    for x in sorted(theirs - ours):
        errors.append(f"collect() reads a declaration this reader does not: {x}")
    if errors:
        return errors, None

    owner = {d.key: d.tier for d in decls if d.theme == "mocha"}
    base = {d.key: d for d in decls if d.theme == "mocha"}
    counts = {
        "declarations": {"mocha": 0, "latte": 0},
        "var": {"mocha": 0, "latte": 0},
        "component->primitive": {th: {s: 0 for s in PART_SCALES} for th in ("mocha", "latte")},
        "component->component": {"mocha": 0, "latte": 0},
        "semantic->semantic": {"mocha": 0, "latte": 0},
        "literals": {},
    }
    refs = {}
    for d in decls:
        counts["declarations"][d.theme] += 1
        at = f"--tasty-{d.key} ({d.theme}) at {d.where}"
        try:
            targets = references(d)
        except ValueError as e:
            errors.append(f"R3a: {at}: {e}")
            continue
        refs[(d.theme, d.key)] = targets
        counts["var"][d.theme] += len(targets)
        for t in targets:
            if t not in owner:
                errors.append(f"R3a: {at} reads an undeclared token --tasty-{t}")
                continue
            to = owner[t]
            if d.tier == "primitive":
                errors.append(f"R3a: {at}: a primitive reads --tasty-{t}; primitives hold raw values")
            elif d.tier == "semantic" and to == "component":
                errors.append(f"R3a: {at}: a semantic token reads the component token --tasty-{t}")
            elif d.tier == "semantic" and to == "semantic":
                counts["semantic->semantic"][d.theme] += 1
            elif d.tier == "component" and to == "component":
                counts["component->component"][d.theme] += 1
            elif d.tier == "component" and to == "primitive":
                scale = next((s for s in PART_SCALES if t.startswith(s)), None)
                if scale:
                    counts["component->primitive"][d.theme][scale] += 1
                elif t.startswith(ROLE_SCALES):
                    errors.append(f"R2: {at} reads the primitive --tasty-{t}: "
                                  "color and alpha go through a semantic role")
                else:
                    errors.append(f"R1: {at} reads the primitive --tasty-{t}: a component reads "
                                  "primitives only from the size-, radius- and duration- scales")
        if d.tier == "primitive" and d.theme == "latte" and d.key.startswith(PART_SCALES):
            errors.append(f"scale: {at}: size, radius and duration primitives are the same in both themes")
        if d.tier == "component":
            literal = not targets
            if d.theme == "latte" and (literal or refs.get(("mocha", d.key)) == []):
                errors.append(f"R4: {at}: a component literal has no Latte value")
                continue
            if literal:
                kind = LITERALS.get(d.key)
                if kind is None:
                    errors.append(f"R4: {at}: a component literal not in LITERALS: {d.collapsed!r}")
                    continue
                if not SHAPES[kind](d.collapsed):
                    errors.append(f"R4: {at}: {d.collapsed!r} is not a {kind}")
                if kind == "window-shadow":
                    if d.marker and "@kind" in d.marker:
                        errors.append(f"R4: {at}: the window shadow takes no @kind marker")
                elif d.marker != MARKER:
                    errors.append(f"R4: {at}: a {kind} literal needs {MARKER} right after its semicolon")
                counts["literals"][kind] = counts["literals"].get(kind, 0) + 1

    # cycles in each theme's effective map: base values, with the Latte values over them
    for theme in ("mocha", "latte"):
        graph = {}
        for k in owner:
            targets = refs.get((theme, k)) if theme == "latte" and (theme, k) in refs else refs.get(("mocha", k), [])
            graph[k] = {t for t in targets if t in owner}
        for loop in cycles(graph):
            errors.append(f"R3a: alias cycle in {theme}: " + " -> ".join(f"--tasty-{x}" for x in loop)
                          + f" ({base[loop[0]].where})")
    return errors, counts


def main(argv):
    if len(argv) != 1:
        print(__doc__.split("\n\n")[1], file=sys.stderr)
        return 2
    errors, counts = check(argv[0])
    for e in errors:
        print(e)
    if counts:
        cp = counts["component->primitive"]
        print("declarations: base {mocha}, Latte {latte}".format(**counts["declarations"]))
        print("var() references: base {mocha}, Latte {latte}".format(**counts["var"]))
        for theme, label in (("mocha", "base"), ("latte", "Latte")):
            scales = ", ".join(f"{s[:-1]} {n}" for s, n in cp[theme].items())
            print(f"component -> primitive ({label}): {sum(cp[theme].values())} ({scales})")
        print("component -> component: base {mocha}, Latte {latte}".format(**counts["component->component"]))
        print("semantic -> semantic: base {mocha}, Latte {latte}".format(**counts["semantic->semantic"]))
        lit = counts["literals"]
        print(f"component literals: {sum(lit.values())} ("
              + ", ".join(f"{k} {lit[k]}" for k in sorted(lit)) + ")")
    print(f"token tiers: {len(errors)} violations")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))

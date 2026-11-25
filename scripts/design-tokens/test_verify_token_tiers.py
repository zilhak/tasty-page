#!/usr/bin/env python3
"""Tests for verify_token_tiers.py.

usage: python3 -B scripts/design-tokens/test_verify_token_tiers.py [-v]

Each test writes three small token CSS files to a temporary directory and runs the
check as a command (and once as a function). A rejected case must exit 1 and name the
rule, the token, the target and the theme, or the file and line.
"""
import os, re, subprocess, sys, tempfile, unittest

HERE = os.path.dirname(os.path.abspath(__file__))
SCRIPT = os.path.join(HERE, "verify_token_tiers.py")
sys.path.insert(0, HERE)
sys.dont_write_bytecode = True
import verify_token_tiers as vt

PRIMITIVE = {
    "size-4": "4px", "size-8": "8px", "radius-4": "4px", "duration-120": "120ms",
    "color-blue": "#89b4fa", "color-base": "#1e1e2e", "alpha-40": "0.4",
    "font-size-13": "13px", "opacity-disabled": "0.5", "ease-out": "cubic-bezier(0.2, 0, 0, 1)",
    "scale-100": "1",
}
SEMANTIC = {"accent": "var(--tasty-color-blue)", "bg": "var(--tasty-color-base)",
            "focus": "var(--tasty-accent)"}
COMPONENT = {"button-pad": "var(--tasty-size-4)", "button-fg": "var(--tasty-focus)"}
LITERAL_DECLS = {
    "notification-item-body-lines": "2; /* @kind other */ /* popup */",
    "notification-item-body-lines-wide": "3; /* @kind other */",
    "explorer-favorites-pin-ratio": "0.4; /* @kind other */",
    "cut-pending-font-style": "italic; /* @kind other */",
    "titlebar-csd-shadow": "0 18px 50px -8px rgba(0,0,0,.5);",
    "dag-edge-dash-fallback": "6 3; /* @kind other */",
    "dag-edge-dash-reduce": "2 3; /* @kind other */",
    "dag-edge-dash-binding": "8 2 2 2;                    /* @kind other */ /* dash-dot */",
    "dag-edge-dash-transition": "10 4; /* @kind other */",
}


COMPLETE = re.compile(r";\s*(?:/\*.*?\*/\s*)*$", re.S)  # already ends in ; and its comments


def block(selector, decls):
    """decls: {name: value}. A value already ending in ; (and comments) is written as it is."""
    lines = []
    for k, v in decls.items():
        lines.append(f"  --tasty-{k}: {v}" + ("" if COMPLETE.search(v) else ";"))
    return f"{selector} {{\n" + "\n".join(lines) + "\n}\n"


def files(prim=None, prim_latte=None, sem=None, sem_latte=None, comp=None, comp_latte=None,
          literals=True):
    """The three files' text, from the defaults with the given declarations added."""
    out = {}
    for tier, default, extra, latte in (
            ("primitive", PRIMITIVE, prim, prim_latte),
            ("semantic", SEMANTIC, sem, sem_latte),
            ("component", {**COMPONENT, **(LITERAL_DECLS if literals else {})}, comp, comp_latte)):
        decls = {**default, **(extra or {})}
        decls = {k: v for k, v in decls.items() if v is not None}
        text = "/* header */\n" + block(vt.BASE_SELECTOR[tier], decls)
        if latte:
            text += block('[data-theme="latte"]', latte)
        out[tier] = text
    return out


class Base(unittest.TestCase):
    def run_check(self, texts, extra_files=None):
        tmp = tempfile.TemporaryDirectory()
        self.addCleanup(tmp.cleanup)
        os.makedirs(os.path.join(tmp.name, "tokens"))
        for tier, name in vt.FILES.items():
            with open(os.path.join(tmp.name, "tokens", name), "w", encoding="utf-8") as f:
                f.write(texts[tier])
        for name, text in (extra_files or {}).items():
            with open(os.path.join(tmp.name, "tokens", name), "w", encoding="utf-8") as f:
                f.write(text)
        r = subprocess.run([sys.executable, "-B", SCRIPT, tmp.name], capture_output=True, text=True)
        return r, tmp.name

    def ok(self, texts, **kw):
        r, _ = self.run_check(texts, **kw)
        self.assertEqual(r.returncode, 0, r.stdout + r.stderr)
        self.assertIn("token tiers: 0 violations", r.stdout)
        return r.stdout

    def fails(self, texts, *needles, **kw):
        r, _ = self.run_check(texts, **kw)
        self.assertEqual(r.returncode, 1, r.stdout + r.stderr)
        for n in needles:
            self.assertIn(n, r.stdout)
        return r.stdout


# Each count line of the tier check: its label (how the line starts) and its whole form.
COUNT_LINES = {
    "declarations": ("declarations:", r"declarations: base (\d+), Latte (\d+)"),
    "references": ("var() references:", r"var\(\) references: base (\d+), Latte (\d+)"),
    "primitive-base": ("component -> primitive (base):",
                       r"component -> primitive \(base\): (\d+) \(size (\d+), radius (\d+), duration (\d+)\)"),
    "primitive-latte": ("component -> primitive (Latte):",
                        r"component -> primitive \(Latte\): (\d+) \(size (\d+), radius (\d+), duration (\d+)\)"),
    "component": ("component -> component:", r"component -> component: base (\d+), Latte (\d+)"),
    "semantic": ("semantic -> semantic:", r"semantic -> semantic: base (\d+), Latte (\d+)"),
    "literals": ("component literals:", r"component literals: (\d+) \((.*)\)"),
}
JSON_LINE = re.compile(r"(primitive|semantic|component): css (\d+) json \d+ css-only \d+ json-only \d+ "
                       r"\| aliases \d+ \| latte css (\d+) json \d+ matched \d+")


def one_line(lines, label, pattern, where):
    """The groups of the one line that starts with label; it must have the whole form."""
    hits = [line for line in lines if line.startswith(label)]
    m = re.fullmatch(pattern, hits[0]) if len(hits) == 1 else None
    if not m:
        raise AssertionError((where, label, hits))
    return m.groups()


def count_lines(out):
    """Each count line of the tier check's output, read whole, as a tuple of its numbers
    (the literal kinds as a dict). A line that is missing, repeated or reads differently
    fails, and so does a literal kind that verify_token_tiers.LITERALS does not list."""
    lines = out.splitlines()
    got = {key: one_line(lines, label, pattern, "tier check")
           for key, (label, pattern) in COUNT_LINES.items()}
    total, kinds = got["literals"]
    pairs = [re.fullmatch(r"([a-z][a-z-]*) (\d+)", k) for k in kinds.split(", ")] if kinds else []
    if not all(pairs) or (not pairs and total != "0"):
        raise AssertionError(("literals", out))
    lit = {m.group(1): int(m.group(2)) for m in pairs}
    if len(lit) != len(pairs) or not set(lit) <= set(vt.LITERALS.values()):
        raise AssertionError(("literals", out))
    got["literals"] = (int(total), lit)
    for key in COUNT_LINES:
        if key != "literals":
            got[key] = tuple(map(int, got[key]))
    return got


def json_counts(out):
    """The base and Latte declaration counts summed over the token JSON checker's three
    tier lines; each tier must have exactly one line, in the whole form."""
    lines = out.splitlines()
    tiers = [one_line(lines, f"{tier}:", JSON_LINE.pattern, "token JSON check")
             for tier in ("primitive", "semantic", "component")]
    return sum(int(t[1]) for t in tiers), sum(int(t[2]) for t in tiers)


class Canon(Base):
    def test_vendor_tokens_pass(self):
        # The canon grows as tokens are added, so its counts are not pinned here. The
        # declaration counts are compared with the token JSON checker, which reads the
        # CSS with gen_tokens_json.parse(), and each breakdown must add up to its total.
        # What each count means is pinned on the small inputs in test_defaults_pass_and_count.
        vendor = os.path.join(HERE, "..", "..", "vendor")
        r = subprocess.run([sys.executable, "-B", SCRIPT, vendor], capture_output=True, text=True)
        self.assertEqual(r.returncode, 0, r.stdout + r.stderr)
        out = r.stdout
        self.assertIn("token tiers: 0 violations", out.splitlines())
        got = count_lines(out)
        j = subprocess.run([sys.executable, "-B", os.path.join(HERE, "verify_tokens_json.py"),
                            vendor, os.path.join(vendor, "tokens", "tasty.tokens.json")],
                           capture_output=True, text=True)
        self.assertEqual(j.returncode, 0, j.stdout + j.stderr)
        base, latte = json_counts(j.stdout)
        self.assertEqual(got["declarations"], (base, latte))
        self.assertGreater(base, 0)
        self.assertGreater(got["references"][0], 0)
        for key in ("primitive-base", "primitive-latte"):
            total, *parts = got[key]
            self.assertEqual(total, sum(parts), key)
        self.assertEqual(got["primitive-latte"], (0, 0, 0, 0))
        total, kinds = got["literals"]
        self.assertEqual(total, sum(kinds.values()))

    def test_defaults_pass_and_count(self):
        out = self.ok(files(sem_latte={"accent": "var(--tasty-color-base)", "focus": "var(--tasty-bg)"},
                            comp={"button-gap": "var(--tasty-button-pad)"},
                            comp_latte={"button-fg": "var(--tasty-button-pad)"}))
        got = count_lines(out)
        # 11 primitives, 3 semantic and 2 + 1 component tokens, plus the 9 literal ones;
        # Latte: 2 semantic and 1 component. var(): 3 semantic and 3 component in the
        # base blocks, all 3 Latte values. Latte has a same-tier reference in each tier.
        self.assertEqual(got["declarations"], (len(PRIMITIVE) + len(SEMANTIC) + len(COMPONENT) + 1 + len(LITERAL_DECLS), 3))
        self.assertEqual(got["references"], (6, 3))
        self.assertEqual(got["primitive-base"], (1, 1, 0, 0))
        self.assertEqual(got["primitive-latte"], (0, 0, 0, 0))
        self.assertEqual(got["component"], (1, 1))
        self.assertEqual(got["semantic"], (1, 1))
        self.assertEqual(got["literals"], (9, {"coefficient": 1, "count": 2, "dash": 4, "keyword": 1, "window-shadow": 1}))

    def test_count_lines_reads_no_literals(self):
        self.assertEqual(count_lines(self.ok(files(literals=False)))["literals"], (0, {}))

    def test_json_counts_reject_changed_lines(self):
        out = ("primitive: css 3 json 3 css-only 0 json-only 0 | aliases 0 | latte css 1 json 1 matched 1\n"
               "semantic: css 2 json 2 css-only 0 json-only 0 | aliases 2 | latte css 0 json 0 matched 0\n"
               "component: css 4 json 4 css-only 0 json-only 0 | aliases 4 | latte css 0 json 0 matched 0\n"
               "total 9 errors []\n")
        self.assertEqual(json_counts(out), (9, 1))
        for old, new in (("latte css 0 json 0 matched 0\ncomponent", "latte CSS 0 json 0 matched 0\ncomponent"),
                         ("total", "component: css 1232 | latte CSS 0\ntotal"),
                         ("primitive:", "primitives:")):
            self.assertIn(old, out)
            with self.assertRaises(AssertionError, msg=new):
                json_counts(out.replace(old, new, 1))

    def test_count_lines_rejects_changed_output(self):
        out = self.ok(files())
        for old, new in (("dash 4", "??? 4"), ("window-shadow 1)", "window-shadow 1, JUNK)"),
                         ("Latte 0\nvar()", "Latte 00x\nvar()"),
                         ("component literals: 9 (coefficient 1, count 2, dash 4, keyword 1, window-shadow 1)",
                          "component literals: 0 (GARBAGE)"),
                         ("var() references", "var() refs"),
                         ("dash 4", "bogus 4"),
                         ("dash 4", "dash 2, dash 2"),
                         ("token tiers", "declarations: base invalid, Latte 0\ntoken tiers")):
            self.assertIn(old, out)
            with self.assertRaises(AssertionError, msg=new):
                count_lines(out.replace(old, new))

    def test_function_returns_violations(self):
        r, project = self.run_check(files(comp={"bad": "var(--tasty-color-blue)"}))
        errors, counts = vt.check(project)
        self.assertEqual(len(errors), 1)
        self.assertTrue(errors[0].startswith("R2: --tasty-bad (mocha)"))
        self.assertEqual(counts["declarations"]["mocha"], len(PRIMITIVE) + len(SEMANTIC) + 12)


class PartOnly(Base):
    def test_part_scales_pass(self):
        out = self.ok(files(comp={"a": "var(--tasty-size-8)", "b": "var(--tasty-radius-4)",
                                  "c": "var(--tasty-duration-120)",
                                  "d": "calc(var(--tasty-size-4) * 2 + var(--tasty-size-8))"}))
        self.assertIn("component -> primitive (base): 6 (size 4, radius 1, duration 1)", out)

    def test_color_and_alpha_take_r2(self):
        for t in ("color-blue", "alpha-40"):
            with self.subTest(t):
                self.fails(files(comp={"bad": f"var(--tasty-{t})"}),
                           f"R2: --tasty-bad (mocha) at", f"reads the primitive --tasty-{t}",
                           "color and alpha go through a semantic role")

    def test_other_scales_take_r1(self):
        for t in ("font-size-13", "opacity-disabled", "ease-out", "scale-100"):
            with self.subTest(t):
                self.fails(files(comp={"bad": f"var(--tasty-{t})"}),
                           "R1: --tasty-bad (mocha)", f"--tasty-{t}", "size-, radius- and duration-")

    def test_each_var_inside_calc(self):
        self.fails(files(comp={"bad": "calc(var(--tasty-size-4) + var(--tasty-font-size-13))"}),
                   "R1: --tasty-bad (mocha)", "--tasty-font-size-13")

    def test_violation_only_in_latte(self):
        self.fails(files(comp_latte={"button-fg": "var(--tasty-color-blue)"}),
                   "R2: --tasty-button-fg (latte)", "--tasty-color-blue")


class References(Base):
    def test_allowed_directions(self):
        out = self.ok(files(sem={"ring": "var(--tasty-focus)"},
                            comp={"a": "var(--tasty-bg)", "b": "var(--tasty-button-fg)"}))
        self.assertIn("semantic -> semantic: base 2, Latte 0", out)
        self.assertIn("component -> component: base 1, Latte 0", out)

    def test_bad_spellings(self):
        for v in ("var( --tasty-size-4)", "var(--tasty-Size-4)", "var(--tasty-size-4, 4px)",
                  "VAR(--tasty-size-4)", r"v\61 r(--tasty-size-4)", "calc(var(--tasty-size-4 ) * 2)"):
            with self.subTest(v):
                self.fails(files(comp={"bad": v}), "R3a: --tasty-bad (mocha)", "var(--tasty-<name>)")

    def test_name_outside_tasty(self):
        self.fails(files(comp={"bad": "var(--outside)"}), "R3a: --tasty-bad (mocha)", "--outside")

    def test_undeclared_name(self):
        self.fails(files(comp={"bad": "var(--tasty-nowhere)"}),
                   "R3a: --tasty-bad (mocha)", "undeclared token --tasty-nowhere")

    def test_name_only_in_the_tokens_css_copy(self):
        copy = ":root {\n  --tasty-copy-only: 4px;\n}\n"
        self.fails(files(comp={"bad": "var(--tasty-copy-only)"}), "undeclared token --tasty-copy-only",
                   extra_files={"tokens.css": copy})

    def test_primitive_reads_nothing(self):
        self.fails(files(prim={"size-x": "var(--tasty-size-4)"}),
                   "R3a: --tasty-size-x (mocha)", "a primitive reads --tasty-size-4")

    def test_semantic_does_not_read_components(self):
        self.fails(files(sem={"up": "var(--tasty-button-fg)"}),
                   "R3a: --tasty-up (mocha)", "component token --tasty-button-fg")

    def test_strings_and_other_functions_are_not_variables(self):
        self.ok(files(prim={"font-family-x": '"var(--tasty-size-4)", sans-serif',
                            "font-family-y": "myvar(--tasty-nowhere), sans-serif"},
                      comp={"a": "calc(var(--tasty-size-4) * 2)"}))

    def test_unclosed_function(self):
        self.fails(files(comp={"bad": "calc(var(--tasty-size-4) * 2"}), "components.css:")


class Cycles(Base):
    def test_converging_dag(self):
        self.ok(files(sem={"x": "var(--tasty-focus)", "y": "var(--tasty-focus)", "z": "var(--tasty-x)"}))

    def test_direction_flips_between_themes(self):
        self.ok(files(sem={"a": "var(--tasty-b)", "b": "var(--tasty-color-blue)"},
                      sem_latte={"a": "var(--tasty-color-base)", "b": "var(--tasty-a)"}))

    def test_self_cycle(self):
        self.fails(files(sem={"loop": "var(--tasty-loop)"}),
                   "R3a: alias cycle in mocha: --tasty-loop -> --tasty-loop", "semantic.css:")

    def test_three_component_cycle(self):
        self.fails(files(comp={"a": "var(--tasty-b)", "b": "var(--tasty-c)", "c": "var(--tasty-a)"}),
                   "alias cycle in mocha: --tasty-a -> --tasty-b -> --tasty-c -> --tasty-a")

    def test_cycle_only_in_latte(self):
        t = files(sem={"a": "var(--tasty-b)", "b": "var(--tasty-color-blue)"}, sem_latte={"b": "var(--tasty-a)"})
        lines = t["semantic"].splitlines()
        a_line = 1 + next(i for i, x in enumerate(lines) if "--tasty-a:" in x)
        b_latte = 1 + next(i for i, x in enumerate(lines) if "--tasty-b: var(--tasty-a)" in x)
        out = self.fails(t, "alias cycle in latte: --tasty-a -> --tasty-b -> --tasty-a",
                         f"semantic.css:{a_line}", f"semantic.css:{b_latte}")
        self.assertNotIn("cycle in mocha", out)

    def test_long_cycle(self):
        n = 1100
        chain = {f"c{i}": f"var(--tasty-c{(i + 1) % n})" for i in range(n)}
        self.fails(files(sem=chain), "alias cycle in mocha: --tasty-c0 -> --tasty-c1")


class Literals(Base):
    def literal(self, name, decl, *needles):
        return self.fails(files(comp={name: decl}), f"R4: --tasty-{name} (mocha)", *needles)

    def test_shadow_shapes_pass(self):
        for v in ("0 18px 50px -8px rgba(0, 0, 0, 0.5);", "0 1px 0 0 rgba(0,0,0,0);",
                  "2px 2px 4px 0 rgba(0,0,0,1);"):
            with self.subTest(v):
                self.ok(files(comp={"titlebar-csd-shadow": v}))

    def test_unlisted_literal(self):
        self.literal("button-gap", "4px", "not in LITERALS")

    def test_count_without_marker(self):
        self.literal("notification-item-body-lines", "2;", "@kind other */ right after its semicolon")

    def test_marker_on_the_next_line_does_not_count(self):
        self.literal("notification-item-body-lines", "2;\n  /* @kind other */", "right after its semicolon")

    def test_window_shadow_with_marker(self):
        for v in ("0 18px 50px -8px rgba(0,0,0,.5); /* @kind other */",
                  "0 18px 50px -8px rgba(0,0,0,.5); /* note */ /* @kind other */"):
            with self.subTest(v):
                self.literal("titlebar-csd-shadow", v, "takes no @kind marker")

    def test_window_shadow_notes_that_mention_the_marker(self):
        self.ok(files(comp={"titlebar-csd-shadow":
                            "0 18px 50px -8px rgba(0,0,0,.5); /* note */ /* Do not add @kind to the window shadow. */"}))
        self.literal("titlebar-csd-shadow", "0 18px 50px -8px rgba(0,0,0,.5); /* @kind other\n  */",
                     "takes no @kind marker")

    def test_marker_on_the_line_after_a_multi_line_note(self):
        self.ok(files(comp={"titlebar-csd-shadow": "0 18px 50px -8px rgba(0,0,0,.5); /* note\n  */ /* @kind other */"}))

    def test_marker_of_the_next_declaration_on_the_same_line(self):
        t = files()
        t["component"] = t["component"].replace(
            "  --tasty-notification-item-body-lines: 2; /* @kind other */ /* popup */\n"
            "  --tasty-notification-item-body-lines-wide: 3; /* @kind other */",
            "  --tasty-notification-item-body-lines: 2; --tasty-notification-item-body-lines-wide: 3;"
            " /* @kind other */")
        out = self.fails(t, "R4: --tasty-notification-item-body-lines (mocha)", "right after its semicolon")
        self.assertNotIn("--tasty-notification-item-body-lines-wide (mocha)", out)

    def test_leading_zero_dash_and_exact_alpha_bound(self):
        self.ok(files(comp={"dag-edge-dash-fallback": "02 3; /* @kind other */"}))
        self.literal("titlebar-csd-shadow", "0 18px 50px -8px rgba(0,0,0,1.00000000000000001);",
                     "is not a window-shadow")

    def test_wrong_shapes(self):
        cases = [
            ("notification-item-body-lines", "2px"),
            ("notification-item-body-lines", "#fff"),
            ("notification-item-body-lines", "rgb(0, 0, 0)"),
            ("notification-item-body-lines", "red"),
            ("notification-item-body-lines", "calc(1)"),
            ("notification-item-body-lines", "٢"),
            ("explorer-favorites-pin-ratio", "٠.٤"),
            ("cut-pending-font-style", "normal"),
            ("dag-edge-dash-fallback", "2,3"),
            ("dag-edge-dash-fallback", "-2 3"),
            ("dag-edge-dash-fallback", "2"),
            ("dag-edge-dash-fallback", "0 3"),
            ("dag-edge-dash-fallback", "٦ ٣"),
        ]
        for name, v in cases:
            with self.subTest(name=name, value=v):
                self.literal(name, f"{v}; /* @kind other */", "is not a")

    def test_wrong_shadows(self):
        for v in ("0 18px 50px -8px rgba(0,0,0,.5), 0 1px 2px 0 rgba(0,0,0,.2)",
                  "0 18px -50px -8px rgba(0,0,0,.5)", "0 18px 50px -8px rgba(0,0,0,1.5)",
                  "5 18px 50px -8px rgba(0,0,0,.5)", "0 1em 50px -8px rgba(0,0,0,.5)",
                  "0 18px 50px -8px rgba(255,0,0,.5)"):
            with self.subTest(v):
                self.literal("titlebar-csd-shadow", f"{v};", "is not a window-shadow")

    def test_component_literal_has_no_latte_value(self):
        for latte in ("2", "var(--tasty-size-4)"):
            with self.subTest(latte):
                self.fails(files(comp_latte={"notification-item-body-lines": f"{latte}; /* @kind other */"}),
                           "R4: --tasty-notification-item-body-lines (latte)", "has no Latte value")

    def test_component_alias_with_a_latte_literal(self):
        self.fails(files(comp_latte={"button-pad": "4px"}), "R4: --tasty-button-pad (latte)", "has no Latte value")

    def test_part_scales_have_no_latte_value(self):
        for k in ("size-4", "radius-4", "duration-120"):
            with self.subTest(k):
                self.fails(files(prim_latte={k: PRIMITIVE[k]}), f"scale: --tasty-{k} (latte)")


class Reading(Base):
    def test_multi_line_values_and_comments_after_the_marker(self):
        self.ok(files(prim={"font-family-x": '"Inter", "Noto Sans",\n      "Segoe UI", sans-serif'},
                      comp={"a": "calc(\n    var(--tasty-size-4) * 2\n  )"}))

    def test_base_selector_of_each_tier(self):
        # primitives keep the Mocha theme block; semantic and component repeat on every [data-theme]
        for tier, other in (("primitive", ":root, [data-theme]"), ("component", ":root"),
                            ("semantic", ':root, [data-theme="mocha"]')):
            with self.subTest(tier):
                t = files()
                t[tier] = t[tier].replace(vt.BASE_SELECTOR[tier] + " {", other + " {", 1)
                self.fails(t, vt.FILES[tier] + ":2", "unsupported selector", vt.BASE_SELECTOR[tier])

    def test_non_css_space_in_a_selector(self):
        t = files(sem_latte={"accent": "var(--tasty-color-base)"})
        t["semantic"] = t["semantic"].replace('[data-theme="latte"] {', '\u00a0[data-theme="latte"] {')
        self.fails(t, "semantic.css:", "unsupported selector")

    def test_missing_semicolon_on_the_same_line(self):
        t = files(comp={"zz-a": "calc(var(--tasty-size-4) * 2) --tasty-zz-b: 4px"})
        self.fails(t, "components.css:", "missing semicolon: a new declaration starts")

    def test_declaration_shape_inside_a_block_is_a_value(self):
        self.ok(files(prim={"font-family-x": "custom(\n    --tasty-size-4: 4px\n  )"}))

    def test_escapes_and_bang_inside_a_function(self):
        self.ok(files(prim={"font-family-x": "O\\'Brien, sans-serif", "font-family-y": "A\\(B, sans-serif",
                            "font-family-z": "custom(!)"}))

    def test_escaped_colon_and_space_are_not_a_new_declaration(self):
        self.ok(files(prim={"font-family-x": "--Acme\\:Display, sans-serif",
                            "font-family-y": "Acme\\ --x: 4px"}))

    def test_hash_at_keyword_and_dotted_names_are_not_declarations(self):
        self.ok(files(prim={"font-family-x": "#--x: label", "font-family-y": "@--x: label",
                            "font-family-z": "red,--x.foo: label"}))

    def test_missing_semicolon_before_an_escaped_name(self):
        for v in ("calc(var(--tasty-size-4)*2) --tasty-\\62: 4px", "calc(var(--tasty-size-4)*2) --tasty-\\62 : 4px"):
            with self.subTest(v):
                self.fails(files(comp={"zz-a": v}), "components.css:", "missing semicolon: a new declaration starts")

    def test_missing_semicolon_without_a_space(self):
        t = files(comp={"zz-a": "calc(var(--tasty-size-4)*2)--tasty-zz-b: 4px"})
        self.fails(t, "components.css:", "missing semicolon: a new declaration starts")

    def test_braces_inside_a_function(self):
        self.ok(files(prim={"font-family-x": "custom(/ {x})"}))
        self.fails(files(prim={"font-family-x": "custom(/ {x)}"}), "primitives.css:", "unbalanced")

    def test_name_with_a_non_css_space(self):
        t = files()
        t["semantic"] = t["semantic"].replace("--tasty-focus:", "--tasty-focus\u00a0:")
        self.fails(t, "semantic.css:", "--tasty-[a-z0-9-]+")

    def test_a_file_without_its_base_block(self):
        t = files()
        t["semantic"] = "/* empty */\n"
        self.fails(t, "semantic.css:", "no base block")

    def test_unclosed_bracket(self):
        self.fails(files(comp={"bad": "calc([var(--tasty-size-4))"}), "components.css:", "unbalanced )")

    def test_comment_inside_a_value(self):
        self.fails(files(comp={"bad": "var(--tasty-size-4) /* x */ ;"}), "comment inside a value")

    def test_quoted_strings(self):
        for v, needle in (('"a;b", sans-serif', "semicolon inside a quoted string"),
                          ('"open, sans-serif', "unclosed string"),
                          ('"Segoe  UI", sans-serif', "would be collapsed")):
            with self.subTest(v):
                self.fails(files(prim={"font-family-x": v}), "primitives.css:", needle)

    def test_missing_semicolons(self):
        t = files()
        t["component"] = t["component"].replace("var(--tasty-size-4);", "var(--tasty-size-4)", 1)
        self.fails(t, "components.css:", "missing semicolon: a new declaration starts")
        t = files(comp={"zz-last": "var(--tasty-size-4)"})
        t["component"] = t["component"].replace("--tasty-zz-last: var(--tasty-size-4);",
                                                "--tasty-zz-last: var(--tasty-size-4)")
        self.fails(t, "components.css:", "missing semicolon before the end of the block")

    def test_block_not_closed(self):
        t = files()
        t["component"] = t["component"].rstrip().rstrip("}")
        self.fails(t, "components.css:", "block not closed")

    def test_other_selectors(self):
        for sel in ("[data-theme = 'latte']", ':not([data-theme="latte"])', '[data-theme="latte"].extra',
                    '.preview [data-theme="latte"]', "@media (prefers-color-scheme: light)"):
            with self.subTest(sel):
                t = files()
                t["semantic"] += f"{sel} {{\n  --tasty-accent: var(--tasty-color-base);\n}}\n"
                self.fails(t, "semantic.css:")

    def test_latte_before_base(self):
        t = files()
        t["semantic"] = '[data-theme="latte"] {\n  --tasty-accent: var(--tasty-color-base);\n}\n' + t["semantic"]
        self.fails(t, "semantic.css:1", "Latte block before the base block")

    def test_important(self):
        self.fails(files(comp={"bad": "var(--tasty-size-4) !important"}), "components.css:", "!important")

    def test_name_grammar(self):
        self.fails(files(comp={"배경": "var(--tasty-size-4)"}), "components.css:", "--tasty-[a-z0-9-]+")
        self.fails(files(comp={"bad": "var(--tasty-배경)"}), "R3a: --tasty-bad (mocha)")

    def test_same_name_in_two_tiers(self):
        out = self.fails(files(comp={"accent": "var(--tasty-size-4)"}), "two tiers: --tasty-accent at")
        self.assertIn("semantic.css:", out)
        self.assertIn("components.css:", out)

    def test_latte_value_in_another_tier(self):
        out = self.fails(files(comp_latte={"accent": "var(--tasty-color-base)"}), "two tiers: --tasty-accent at")
        self.assertIn("semantic.css:", out)
        self.assertIn("its Latte value at", out)
        self.assertIn("components.css:", out)

    def test_read_differently_from_collect(self):
        # collect() takes the text before a quoted { for a selector; this reader keeps the string
        self.fails(files(prim={"font-family-x": '"a{b", sans-serif'}), "collect", "primitives.css:")


if __name__ == "__main__":
    unittest.main()

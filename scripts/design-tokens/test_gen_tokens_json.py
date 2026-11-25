#!/usr/bin/env python3
"""Tests for gen_tokens_json.py and verify_tokens_json.py.

usage: python3 -B scripts/design-tokens/test_gen_tokens_json.py [-v]

Each test writes three small token CSS files and a previous JSON to a temporary
directory, then runs the generator or the verifier as a command.
"""
import json, os, subprocess, sys, tempfile, unittest

HERE = os.path.dirname(os.path.abspath(__file__))
GEN = os.path.join(HERE, "gen_tokens_json.py")
VERIFY = os.path.join(HERE, "verify_tokens_json.py")
FILES = {"primitive": "primitives.css", "semantic": "semantic.css", "component": "components.css"}


def css(base, latte=None):
    """One token file: base declarations, then an optional Latte block."""
    out = ":root {\n" + "".join(f"  --tasty-{k}: {v};\n" for k, v in base.items()) + "}\n"
    if latte:
        out += '[data-theme="latte"] {\n' + "".join(f"  --tasty-{k}: {v};\n" for k, v in latte.items()) + "}\n"
    return out


class Project:
    """A temporary project dir holding tokens/*.css and a previous JSON."""

    def __init__(self, tiers, prev=None):
        self.tmp = tempfile.TemporaryDirectory()
        self.dir = self.tmp.name
        os.makedirs(os.path.join(self.dir, "tokens"))
        for tier, name in FILES.items():
            base, latte = tiers.get(tier, ({}, {}))
            with open(os.path.join(self.dir, "tokens", name), "w", encoding="utf-8") as f:
                f.write(css(base, latte))
        if prev is None:
            prev = {"$description": "top", **{t: {} for t in FILES}}
        self.prev = os.path.join(self.dir, "prev.json")
        self.out = os.path.join(self.dir, "out.json")
        with open(self.prev, "w", encoding="utf-8") as f:
            json.dump(prev, f)

    def gen(self, *extra):
        return subprocess.run([sys.executable, "-B", GEN, self.dir, self.prev, self.out, *extra],
                              capture_output=True, text=True)

    def verify(self, path=None):
        return subprocess.run([sys.executable, "-B", VERIFY, self.dir, path or self.out],
                              capture_output=True, text=True)

    def result(self):
        with open(self.out, encoding="utf-8") as f:
            return json.load(f)

    def close(self):
        self.tmp.cleanup()


class Base(unittest.TestCase):
    def project(self, tiers, prev=None):
        p = Project(tiers, prev)
        self.addCleanup(p.close)
        return p

    def ok(self, tiers, prev=None):
        p = self.project(tiers, prev)
        r = p.gen()
        self.assertEqual(r.returncode, 0, r.stderr)
        return p, p.result()

    def fails(self, tiers, *needles, prev=None):
        p = self.project(tiers, prev)
        r = p.gen()
        self.assertEqual(r.returncode, 1, r.stdout + r.stderr)
        for n in needles:
            self.assertIn(n, r.stderr)
        return r.stderr

    def types(self, res, tier):
        return {k: v["$type"] for k, v in res[tier].items() if k != "$description"}


class InferredTypes(Base):
    def test_inferred_type_replaces_a_wrong_previous_type(self):
        prev = {"$description": "top", "primitive": {},
                "semantic": {"font-style-absent": {"$type": "number", "$value": "italic"}},
                "component": {"cut-pending-font-style": {"$type": "strokeStyle", "$value": "italic"}}}
        _, res = self.ok({"semantic": ({"font-style-absent": "italic"}, {}),
                          "component": ({"cut-pending-font-style": "italic"}, {})}, prev)
        self.assertEqual(res["semantic"]["font-style-absent"]["$type"], "fontStyle")
        self.assertEqual(res["component"]["cut-pending-font-style"]["$type"], "fontStyle")

    def test_previous_json_keeps_order_description_and_number_spelling(self):
        prev = {"$description": "top", "$extra": 1,
                "primitive": {"$description": "group",
                              "b": {"$type": "dimension", "$value": 2, "$description": "kept"},
                              "a": {"$type": "number", "$value": "3"}},
                "semantic": {}, "component": {}}
        _, res = self.ok({"primitive": ({"a": "3", "b": "2px", "c": "4"}, {"a": "5"})}, prev)
        self.assertEqual(res["$description"], "top")
        self.assertEqual(res["$extra"], 1)
        # old order first; the new c goes right after its CSS predecessor b
        self.assertEqual(list(res["primitive"]), ["$description", "b", "c", "a"])
        self.assertEqual(res["primitive"]["b"], {"$type": "dimension", "$value": "2px", "$description": "kept"})
        self.assertEqual(res["primitive"]["a"]["$value"], "3")
        self.assertEqual(res["primitive"]["a"]["$extensions"], {"com.tasty.mode": {"latte": "5"}})

    def test_int_spelling_is_kept_when_the_string_is_the_same(self):
        prev = {"primitive": {"n": {"$type": "number", "$value": 1}}, "semantic": {}, "component": {}}
        _, res = self.ok({"primitive": ({"n": "1"}, {})}, prev)
        self.assertEqual(res["primitive"]["n"]["$value"], 1)

    def test_aliases_through_several_steps(self):
        _, res = self.ok({"primitive": ({"blue": "#89b4fa", "w": "2px"}, {}),
                          "semantic": ({"accent": "var(--tasty-blue)", "focus": "var(--tasty-accent)"}, {}),
                          "component": ({"ring": "var(--tasty-focus)", "ring-w": "var(--tasty-w)"}, {})})
        self.assertEqual(res["component"]["ring"], {"$type": "color", "$value": "{semantic.focus}"})
        self.assertEqual(res["component"]["ring-w"]["$type"], "dimension")

    def test_shapes_keep_their_types(self):
        _, res = self.ok({"primitive": ({
            "font-family-ui": '"Inter", "Pretendard", sans-serif',
            "font-weight-600": "600",
            "size-0": "0",
            "gap-x": "1px",
            "dash-cut": "4 2",
            "inset-x": "calc(4px + 2px)",
            "veil": "color-mix(in srgb, #000 40%, transparent)",
            "shadow-none": "none",
            "ease-out": "cubic-bezier(0.2, 0, 0, 1)",
            "duration-fast": "120ms",
            "neg": "-1",
            "half": ".5",
            "ratio": "0.25",
        }, {})})
        self.assertEqual(self.types(res, "primitive"), {
            "font-family-ui": "fontFamily", "font-weight-600": "fontWeight", "size-0": "dimension",
            "gap-x": "dimension", "dash-cut": "strokeStyle", "inset-x": "dimension",
            "veil": "color", "shadow-none": "shadow", "ease-out": "cubicBezier",
            "duration-fast": "duration", "neg": "number", "half": "number", "ratio": "number"})

    def test_latte_follows_aliases_through_latte_values(self):
        # a has no Latte value of its own; in Latte it reaches c-latte through b's Latte value
        _, res = self.ok({"primitive": ({"c-mocha": "#111111", "c-latte": "#eeeeee"}, {}),
                          "semantic": ({"b": "var(--tasty-c-mocha)", "a": "var(--tasty-b)"},
                                       {"b": "var(--tasty-c-latte)"})})
        self.assertEqual(res["semantic"]["b"]["$extensions"], {"com.tasty.mode": {"latte": "{primitive.c-latte}"}})
        self.assertNotIn("$extensions", res["semantic"]["a"])
        self.assertEqual(res["semantic"]["a"]["$type"], "color")

    def test_latte_literal_and_alias_directions_with_the_same_type(self):
        _, res = self.ok({"primitive": ({"c": "#111111"}, {}),
                          "semantic": ({"lit": "#222222", "ali": "var(--tasty-c)"},
                                       {"lit": "var(--tasty-c)", "ali": "#333333"})})
        self.assertEqual(self.types(res, "semantic"), {"lit": "color", "ali": "color"})


class Rejected(Base):
    def test_values_that_are_not_numbers(self):
        for v in ("auto", "1e3", "1.", "١٢", "NaN", "1%"):
            with self.subTest(value=v):
                err = self.fails({"primitive": ({"odd-one": v}, {})}, "primitive.odd-one", "no $type fits")
                self.assertIn(repr(v), err)

    def test_normal_is_not_a_font_style(self):
        self.fails({"semantic": ({"font-style-plain": "normal"}, {})}, "semantic.font-style-plain")

    def test_italic_needs_font_style_in_the_name(self):
        self.fails({"semantic": ({"label-slant": "italic"}, {})}, "semantic.label-slant")

    def test_alias_of_a_missing_token(self):
        self.fails({"semantic": ({"accent": "var(--tasty-nowhere)"}, {})},
                   "alias of a missing token", "var(--tasty-nowhere)")

    def test_self_cycle(self):
        self.fails({"semantic": ({"loop": "var(--tasty-loop)"}, {})}, "alias cycle", "loop -> loop")

    def test_three_node_cycle(self):
        self.fails({"component": ({"a": "var(--tasty-b)", "b": "var(--tasty-c)", "c": "var(--tasty-a)"}, {})},
                   "alias cycle in mocha", "a -> b -> c -> a")

    def test_cycle_only_in_latte(self):
        self.fails({"primitive": ({"c": "#111111"}, {}),
                    "semantic": ({"a": "var(--tasty-b)", "b": "var(--tasty-c)"}, {"b": "var(--tasty-a)"})},
                   "alias cycle in latte", "b -> a -> b")

    def test_latte_value_with_another_type(self):
        self.fails({"primitive": ({"gap-x": "4px"}, {"gap-x": "0.5"})},
                   "primitive.gap-x", "the Latte value has another $type")


class VerifyJson(Base):
    TIERS = {"primitive": ({"blue": "#89b4fa", "n": "2"}, {"blue": "#1e66f5"}),
             "semantic": ({"accent": "var(--tasty-blue)"}, {})}

    def regenerated(self):
        p, res = self.ok(self.TIERS)
        return p, res

    def write(self, p, res):
        path = os.path.join(p.dir, "edited.json")
        with open(path, "w", encoding="utf-8") as f:
            json.dump(res, f)
        return path

    def test_regenerated_json_passes(self):
        p, _ = self.regenerated()
        r = p.verify()
        self.assertEqual(r.returncode, 0, r.stdout + r.stderr)
        self.assertIn("errors []", r.stdout)

    def test_type_errors_name_the_json_path(self):
        cases = {"missing": None, "not a string": 7, "another type": "dimension"}
        for label, bad in cases.items():
            with self.subTest(label):
                p, res = self.regenerated()
                if bad is None:
                    del res["semantic"]["accent"]["$type"]
                else:
                    res["semantic"]["accent"]["$type"] = bad
                r = p.verify(self.write(p, res))
                self.assertEqual(r.returncode, 1, r.stdout + r.stderr)
                self.assertIn("semantic.accent.$type", r.stdout)


if __name__ == "__main__":
    unittest.main()

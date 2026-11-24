#!/usr/bin/env python3
"""Test the ground-ink token verifier against temporary CSS and rules files."""

import json
from pathlib import Path
import subprocess
import sys
from tempfile import TemporaryDirectory
import unittest


VERIFIER = Path(__file__).with_name("verify_ground_ink_tokens.py")


def color_entry(name, tier, mocha, latte=None):
    return {
        "name": name, "tier": tier, "kind": "ground",
        "values": {"mocha": mocha, "latte": mocha if latte is None else latte},
    }


class VerifyGroundInkTokens(unittest.TestCase):
    def setUp(self):
        directory = TemporaryDirectory()
        self.addCleanup(directory.cleanup)
        self.project = Path(directory.name)
        self.rules = self.project / "ground-ink-rules.json"
        self.tokens = self.project / "tokens"
        self.tokens.mkdir()
        self.css = {
            "primitives": """
                :root {
                    --tasty-paint: #123456;
                    --tasty-alpha: 0.30;
                    --tasty-size: 8px;
                }
                :root[data-theme="latte"] {
                    --tasty-paint: #abcdef;
                    --tasty-alpha: 0.60;
                    --tasty-size: 12px;
                }
            """,
            "semantic": """
                :root {
                    --tasty-ink: var(--tasty-paint);
                    --tasty-shadow: 0 6px 18px rgba(0, 0, 0, .5);
                    --tasty-mix: color-mix(in srgb, var(--tasty-ink) 30%, transparent);
                }
            """,
            "components": """
                :root {
                    --tasty-tint: color-mix(in srgb, var(--tasty-ink) calc(var(--tasty-alpha) * 100%), transparent);
                    --tasty-half-up: rgb(10.5 25.5 45.5 / 30%);
                    --tasty-mix-premultiplied: color-mix(in srgb, #ff0000, rgba(0, 0, 255, 0.5) 50%);
                    --tasty-mix-underfull: color-mix(in srgb, #fff 30%, #000 30%);
                    --tasty-mix-overfull: color-mix(in srgb, #fff 60%, #000 60%);
                    --tasty-mix-default: color-mix(in srgb, #fff, #000);
                }
            """,
        }
        self.entries = [
            color_entry("paint", "primitive", "#123456", "#abcdef"),
            {"name": "alpha", "tier": "primitive", "kind": "non-color"},
            {"name": "size", "tier": "primitive", "kind": "non-color"},
            color_entry("ink", "semantic", "#123456", "#abcdef"),
            {"name": "shadow", "tier": "semantic", "kind": "non-color"},
            color_entry("mix", "semantic", "#123456@0.30", "#abcdef@0.30"),
            color_entry("tint", "component", "#1234564d", "#abcdef@0.60"),
            color_entry("half-up", "component", "#0b1a2e4d"),
            color_entry("mix-premultiplied", "component", "#aa0055@0.75"),
            color_entry("mix-underfull", "component", "#808080@0.60"),
            color_entry("mix-overfull", "component", "#808080"),
            color_entry("mix-default", "component", "#808080"),
        ]

    def entry(self, name):
        return next(entry for entry in self.entries if entry["name"] == name)

    def run_verifier(self):
        for tier, css in self.css.items():
            (self.tokens / f"{tier}.css").write_text(css, encoding="utf-8")
        self.rules.write_text(json.dumps({"tokens": self.entries}), encoding="utf-8")
        return subprocess.run(
            [sys.executable, str(VERIFIER), str(self.project), str(self.rules)],
            capture_output=True, text=True, check=False,
        )

    def assert_failure(self, *errors):
        result = self.run_verifier()
        self.assertEqual(result.returncode, 1, result.stdout + result.stderr)
        self.assertEqual(result.stderr, "")
        summary, *reported = result.stdout.splitlines()
        self.assertTrue(summary.endswith(f"errors {len(errors)}"), summary)
        self.assertCountEqual([line.strip() for line in reported], errors)

    def assert_success(self):
        result = self.run_verifier()
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        count = len(self.entries)
        self.assertEqual(result.stdout.strip(), f"ground-ink tokens: CSS {count}, rules {count}, errors 0")

    def test_valid_tokens(self):
        self.assert_success()

    def test_r1_checks_names_in_both_directions_and_tier(self):
        self.entries.remove(self.entry("size"))
        self.entries.append({"name": "extra", "tier": "primitive", "kind": "non-color"})
        self.entry("paint")["tier"] = "semantic"
        self.assert_failure(
            "R1 size: missing from rules",
            "R1 extra: missing from CSS",
            "R1 paint: tier is 'semantic' in rules, 'primitive' in CSS",
        )

    def test_r1_rejects_a_css_name_in_two_tiers(self):
        self.css["semantic"] += ":root { --tasty-paint: #123456; }"
        self.assert_failure("token in two tiers: paint")

    def test_r2_checks_kinds_and_duplicate_names(self):
        self.entry("size")["kind"] = "size"
        self.entries.append(self.entry("ink").copy())
        self.assert_failure("R2 size: invalid kind 'size'", "R2 ink: duplicate rules name")

    def test_r3_requires_each_themes_color(self):
        del self.entry("ink")["values"]["latte"]
        self.assert_failure("R3 ink [latte]: missing rules color")

    def test_r3_checks_exact_alpha_and_half_up_bytes(self):
        self.entry("mix")["values"]["mocha"] = "#123456@0.3001"
        self.entry("tint")["values"]["mocha"] = "#1234564c"
        self.entry("half-up")["values"]["mocha"] = "#0a1a2e4d"
        self.assert_failure(
            "R3 mix [mocha]: rules '#123456@0.3001', CSS evaluates to #123456@3/10",
            "R3 tint [mocha]: rules '#1234564c', CSS evaluates to #123456@3/10",
            "R3 half-up [mocha]: rules '#0a1a2e4d', CSS evaluates to #0b1a2e@3/10",
        )

    def test_r3_six_digit_hex_requires_opaque_color(self):
        self.entry("mix")["values"]["mocha"] = "#123456"
        self.assert_failure(
            "R3 mix [mocha]: rules '#123456', CSS evaluates to #123456@3/10"
        )

    def test_r3_mix_complements_an_omitted_left_weight(self):
        self.css["components"] = self.css["components"].replace(
            "#ff0000, rgba(0, 0, 255, 0.5) 50%", "#ff0000, #0000ff 25%"
        )
        self.entry("mix-premultiplied")["values"] = {"mocha": "#bf0040", "latte": "#bf0040"}
        self.assert_success()

    def test_r3_mix_premultiplies_the_left_alpha(self):
        self.css["components"] = self.css["components"].replace(
            "#ff0000, rgba(0, 0, 255, 0.5) 50%", "rgba(255, 0, 0, 0.5), #0000ff 25%"
        )
        self.entry("mix-premultiplied")["values"] = {"mocha": "#990066@0.625", "latte": "#990066@0.625"}
        self.assert_success()

    def test_r3_clamps_calculated_weights_to_percentage_range(self):
        self.css["primitives"] = self.css["primitives"].replace(
            "--tasty-alpha: 0.30", "--tasty-alpha: -0.20"
        ).replace("--tasty-alpha: 0.60", "--tasty-alpha: 1.20")
        self.entry("tint")["values"] = {"mocha": "#000000@0", "latte": "#abcdef"}
        self.assert_success()

    def test_r3_rejects_out_of_range_literal_weights(self):
        css = self.css["semantic"]
        for weight in ("-20%", "120%"):
            with self.subTest(weight=weight):
                self.css["semantic"] = css.replace("30%, transparent", f"{weight}, transparent")
                self.assert_failure(*(
                    f"R3 mix [{theme}]: weight outside 0–100%: {weight}"
                    for theme in ("mocha", "latte")
                ))

    def test_r3_reports_unsupported_color_separately_from_kind(self):
        self.css["primitives"] = self.css["primitives"].replace("#abcdef", "oklch(0.5 0.2 30)")
        self.assert_failure(*(
            f"R3 {name} [latte]: unsupported color expression: oklch(0.5 0.2 30)"
            for name in ("paint", "ink", "mix", "tint")
        ))

    def test_r4_checks_whole_values_in_both_themes(self):
        self.css["primitives"] = self.css["primitives"].replace("12px", "var(--tasty-ink)")
        self.entry("shadow")["kind"] = "ground"
        self.entry("shadow")["values"] = {"mocha": "#000000", "latte": "#000000"}
        self.assert_failure(
            "R4 size [latte]: expected a non-color value, CSS has '#abcdef'",
            "R4 shadow [mocha]: expected a single color, CSS has '0 6px 18px rgba(0, 0, 0, .5)'",
            "R4 shadow [latte]: expected a single color, CSS has '0 6px 18px rgba(0, 0, 0, .5)'",
        )

    def test_r4_var_uses_the_primary_value_in_each_theme(self):
        self.css["primitives"] = self.css["primitives"].replace(
            "8px", "var(--tasty-alpha, #000)"
        ).replace("12px", "var(--tasty-paint, #000)")
        self.assert_failure("R4 size [latte]: expected a non-color value, CSS has '#abcdef'")

    def test_valid_primary_skips_nested_fallback_substitution(self):
        self.css = {"primitives": "", "semantic": "", "components": ""}
        self.entries = [
            {"name": name, "tier": "primitive", "kind": "non-color"}
            for name in ("space", "legacy", "size")
        ]
        for fallback in ("--site-size", "--tasty-legacy"):
            with self.subTest(fallback=fallback):
                self.css["primitives"] = f"""
                    :root {{
                        --tasty-space: 8px;
                        --site-size: 16px;
                        --tasty-legacy: inherit;
                        --tasty-size: var(--tasty-space, var({fallback}));
                    }}
                """
                self.assert_success()

    def test_var_resolves_nested_and_embedded_fallbacks(self):
        self.css["primitives"] = self.css["primitives"].replace(
            "12px", "var(--tasty-missing, var(--tasty-also-missing, 12px))"
        )
        self.css["semantic"] = self.css["semantic"].replace(
            "var(--tasty-paint)", "var(--tasty-missing, var(--tasty-paint, #000))"
        ).replace(
            "30%, transparent", "30%, var(--tasty-missing, rgba(0, 0, 0, 0))"
        )
        self.assert_success()

    def test_r4_classifies_a_value_after_empty_fallback_substitution(self):
        self.css["primitives"] = self.css["primitives"].replace(
            "12px", "#abcdef var(--tasty-missing,)"
        )
        self.assert_failure("R4 size [latte]: expected a non-color value, CSS has '#abcdef'")

    def test_r4_fails_on_unresolved_and_cyclic_variables(self):
        self.css["primitives"] = self.css["primitives"].replace(
            "8px", "var(--tasty-missing, var(--tasty-also-missing))"
        ).replace("12px", "var(--tasty-paint, var(--tasty-size))")
        self.assert_failure(
            "R4 size [mocha]: unresolved var() in 'var(--tasty-missing, var(--tasty-also-missing))'",
            "R4 size [latte]: cyclic alias: --tasty-size",
        )

    def test_consumers_use_fallbacks_for_a_cyclic_token(self):
        self.css = {
            "primitives": """
                :root {
                    --tasty-loop: var(--tasty-missing, var(--tasty-loop));
                    --tasty-size: var(--tasty-loop, 8px);
                    --tasty-ink: var(--tasty-loop, #abcdef);
                }
            """,
            "semantic": "",
            "components": "",
        }
        self.entries = [
            {"name": "loop", "tier": "primitive", "kind": "non-color"},
            {"name": "size", "tier": "primitive", "kind": "non-color"},
            color_entry("ink", "primitive", "#abcdef"),
        ]
        self.assert_failure(
            "R4 loop [mocha]: cyclic alias: --tasty-loop",
            "R4 loop [latte]: cyclic alias: --tasty-loop",
        )

    def test_r4_recognizes_unsupported_colors(self):
        self.css["primitives"] = self.css["primitives"].replace("12px", "rebeccapurple")
        self.css["semantic"] = self.css["semantic"].replace("0 6px 18px rgba(0, 0, 0, .5)", "hsl(240 100% 50%)")
        self.assert_failure(
            "R4 size [latte]: expected a non-color value, CSS has 'rebeccapurple'",
            "R4 shadow [mocha]: expected a non-color value, CSS has 'hsl(240 100% 50%)'",
            "R4 shadow [latte]: expected a non-color value, CSS has 'hsl(240 100% 50%)'",
        )


if __name__ == "__main__":
    unittest.main()

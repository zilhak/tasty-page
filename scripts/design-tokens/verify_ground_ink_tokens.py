#!/usr/bin/env python3
"""Compare the ground-ink rules token list with the three tiers of token CSS.

Usage: verify_ground_ink_tokens.py <project-dir> <rules-json>
"""

import argparse
from fractions import Fraction
import json
import re
import sys

sys.dont_write_bytecode = True
from gen_tokens_json import collect, tier_of


THEMES = ("mocha", "latte")
KINDS = {"ground", "foreground", "border", "exception", "non-color"}
ALIAS = re.compile(r"(?i:var)\(\s*--tasty-([\w-]+)\s*\)")
NUMBER = r"[+-]?(?:[0-9]*\.)?[0-9]+(?:e[+-]?[0-9]+)?"
CSS_HEX = re.compile(r"#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})", re.I)
RULE_HEX = re.compile(rf"#([0-9a-f]{{6}})(?:([0-9a-f]{{2}})|@({NUMBER}))?", re.I)
FUNCTION = re.compile(r"([a-z][a-z-]*)\((.*)\)", re.I)
CALC_WEIGHT = re.compile(r"calc\(\s*(.+?)\s*\*\s*100%\s*\)", re.I)
COLOR_FUNCTIONS = {
    "rgb", "rgba", "hsl", "hsla", "hwb", "lab", "lch", "oklab", "oklch",
    "color", "color-mix", "device-cmyk", "light-dark", "contrast-color",
}
# CSS Color 4 keywords are recognized here even when their colors cannot be evaluated.
COLOR_KEYWORDS = set("""
    aliceblue antiquewhite aqua aquamarine azure beige bisque black blanchedalmond
    blue blueviolet brown burlywood cadetblue chartreuse chocolate coral
    cornflowerblue cornsilk crimson cyan darkblue darkcyan darkgoldenrod darkgray
    darkgreen darkgrey darkkhaki darkmagenta darkolivegreen darkorange darkorchid
    darkred darksalmon darkseagreen darkslateblue darkslategray darkslategrey
    darkturquoise darkviolet deeppink deepskyblue dimgray dimgrey dodgerblue
    firebrick floralwhite forestgreen fuchsia gainsboro ghostwhite gold goldenrod
    gray green greenyellow grey honeydew hotpink indianred indigo ivory khaki
    lavender lavenderblush lawngreen lemonchiffon lightblue lightcoral lightcyan
    lightgoldenrodyellow lightgray lightgreen lightgrey lightpink lightsalmon
    lightseagreen lightskyblue lightslategray lightslategrey lightsteelblue
    lightyellow lime limegreen linen magenta maroon mediumaquamarine mediumblue
    mediumorchid mediumpurple mediumseagreen mediumslateblue mediumspringgreen
    mediumturquoise mediumvioletred midnightblue mintcream mistyrose moccasin
    navajowhite navy oldlace olive olivedrab orange orangered orchid
    palegoldenrod palegreen paleturquoise palevioletred papayawhip peachpuff peru
    pink plum powderblue purple rebeccapurple red rosybrown royalblue saddlebrown
    salmon sandybrown seagreen seashell sienna silver skyblue slateblue slategray
    slategrey snow springgreen steelblue tan teal thistle tomato turquoise violet
    wheat white whitesmoke yellow yellowgreen transparent currentcolor
    accentcolor accentcolortext activetext buttonborder buttonface buttontext
    canvas canvastext field fieldtext graytext highlight highlighttext linktext
    mark marktext selecteditem selecteditemtext visitedtext
    activeborder activecaption appworkspace background buttonhighlight buttonshadow
    captiontext inactiveborder inactivecaption inactivecaptiontext infobackground
    infotext menu menutext scrollbar threeddarkshadow threedface threedhighlight
    threedlightshadow threedshadow window windowframe windowtext
""".split())


def resolve_aliases(value, values, *, embedded=False, stack=()):
    def resolve(match):
        name = match[1]
        if name in stack:
            raise ValueError(f"cyclic alias: {match[0]}")
        if name not in values:
            raise ValueError(f"alias of a missing token: {match[0]}")
        return resolve_aliases(values[name], values, embedded=embedded, stack=(*stack, name))

    if embedded:
        return ALIAS.sub(resolve, value)
    if match := ALIAS.fullmatch(value):
        return resolve(match)
    return value


def split_top_level(value, separator):
    """Split commas or spaces, skipping over nested functions."""
    parts = []
    start = depth = 0
    for index, character in enumerate(value):
        if character == "(":
            depth += 1
        elif character == ")":
            depth -= 1
            if depth < 0:
                raise ValueError(f"unbalanced parentheses: {value}")
        elif character == separator and depth == 0:
            parts.append(value[start:index].strip())
            start = index + 1
    if depth:
        raise ValueError(f"unbalanced parentheses: {value}")
    parts.append(value[start:].strip())
    return parts


def is_color(value):
    if CSS_HEX.fullmatch(value) or value.lower() in COLOR_KEYWORDS:
        return True
    match = FUNCTION.fullmatch(value)
    if not match or match[1].lower() not in COLOR_FUNCTIONS:
        return False
    try:
        split_top_level(match[2], ",")
    except ValueError:
        return False
    return True


def number(value, scale=1):
    literal = value.removesuffix("%")
    if not re.fullmatch(NUMBER, literal, re.I):
        raise ValueError(f"unsupported number: {value}")
    result = Fraction(literal)
    return result * scale / 100 if value.endswith("%") else result


def rgb(body):
    if "," in body:
        channels = [part.strip() for part in body.split(",")]
        if len(channels) not in (3, 4):
            raise ValueError(f"unsupported RGB channels: {body}")
        if len({part.endswith("%") for part in channels[:3]}) != 1:
            raise ValueError(f"mixed units in comma-separated RGB: {body}")
        red, green, blue, *alpha = channels
    else:
        channels, *alpha = body.split("/")
        if len(channels.split()) != 3 or len(alpha) > 1:
            raise ValueError(f"unsupported RGB channels: {body}")
        red, green, blue = channels.split()
    rgb_channels = tuple(min(255, max(0, number(channel, 255))) for channel in (red, green, blue))
    opacity = min(1, max(0, number(alpha[0].strip()))) if alpha else 1
    return (*rgb_channels, opacity)


def mix_stop(stop):
    parts = split_top_level(stop, " ")
    if len(parts) == 1:
        return parts[0], None
    if len(parts) != 2:
        raise ValueError(f"unsupported color stop: {stop}")
    color, weight = parts
    if calc := CALC_WEIGHT.fullmatch(weight):
        scalar = calc[1]
        if scalar.endswith("%"):
            raise ValueError(f"expected a unitless weight in {stop}")
        fraction = number(scalar)
    elif weight.endswith("%"):
        fraction = number(weight)
    else:
        raise ValueError(f"unsupported weight: {weight}")
    if not 0 <= fraction <= 1:
        raise ValueError(f"weight outside 0–100%: {weight}")
    return color, fraction


def mix(body):
    parts = split_top_level(body, ",")
    if len(parts) != 3 or parts[0].lower() != "in srgb":
        raise ValueError("expected color-mix(in srgb, …) with two stops")
    left, p = mix_stop(parts[1])
    right, q = mix_stop(parts[2])
    if p is None:
        p = Fraction(1, 2) if q is None else 1 - q
    if q is None:
        q = 1 - p
    total = p + q
    if not total:
        raise ValueError("color-mix weights sum to zero")

    a = evaluate_color(left)
    b = evaluate_color(right)
    p_alpha = p * a[3]
    q_alpha = q * b[3]
    alpha = p_alpha + q_alpha
    if not alpha:
        return (0, 0, 0, 0)
    # Interpolate premultiplied channels. Weight sums under 100% also reduce alpha.
    channels = tuple((x * p_alpha + y * q_alpha) / alpha for x, y in zip(a[:3], b[:3]))
    return (*channels, alpha / max(1, total))


def evaluate_color(value):
    if CSS_HEX.fullmatch(value):
        digits = value[1:]
        if len(digits) in (3, 4):
            digits = "".join(digit * 2 for digit in digits)
        channels = hex_channels(digits)
        alpha = Fraction(int(digits[6:], 16), 255) if len(digits) == 8 else 1
        return (*channels, alpha)
    if value.lower() == "transparent":
        return (0, 0, 0, 0)
    if match := FUNCTION.fullmatch(value):
        name, body = match.groups()
        if name.lower() in ("rgb", "rgba"):
            return rgb(body)
        if name.lower() == "color-mix":
            return mix(body)
    raise ValueError(f"unsupported color expression: {value}")


def hex_channels(digits):
    return tuple(int(digits[index:index + 2], 16) for index in (0, 2, 4))


def half_up(value):
    return int(value + Fraction(1, 2))


def compare_color(color, value):
    match = RULE_HEX.fullmatch(value) if isinstance(value, str) else None
    if not match:
        raise ValueError(f"invalid rules color: {value!r}")
    digits, alpha_byte, alpha_text = match.groups()
    alpha = color[3]
    if alpha_text is not None:
        alpha_ok = alpha == Fraction(alpha_text)
    elif alpha_byte is not None:
        alpha_ok = half_up(alpha * 255) == int(alpha_byte, 16)
    else:
        alpha_ok = alpha == 1
    return tuple(map(half_up, color[:3])) == hex_channels(digits) and alpha_ok


def verify_value(name, theme, values, is_color_kind, expected):
    label = f"{name} [{theme}]"
    errors = []
    has_expected = isinstance(expected, dict) and theme in expected
    if is_color_kind and not has_expected:
        errors.append(f"R3 {label}: missing rules color")
    try:
        value = resolve_aliases(values[name], values)
    except ValueError as error:
        rule = "R3" if is_color_kind else "R4"
        return [*errors, f"{rule} {label}: {error}"]

    if is_color(value) != is_color_kind:
        requirement = "a single color" if is_color_kind else "a non-color value"
        return [*errors, f"R4 {label}: expected {requirement}, CSS has {value!r}"]
    if is_color_kind:
        try:
            color = evaluate_color(resolve_aliases(value, values, embedded=True))
            if has_expected and not compare_color(color, expected[theme]):
                digits = "".join(f"{half_up(channel):02x}" for channel in color[:3])
                errors.append(f"R3 {label}: rules {expected[theme]!r}, CSS evaluates to #{digits}@{color[3]}")
        except ValueError as error:
            errors.append(f"R3 {label}: {error}")
    return errors


def verify_tokens(tiers, owners, entries):
    errors = []
    names = set()
    theme_values = {theme: {} for theme in THEMES}
    for name, tier in owners.items():
        base, latte = tiers[tier]
        theme_values["mocha"][name] = base[name]
        theme_values["latte"][name] = latte.get(name, base[name])

    for index, entry in enumerate(entries, start=1):
        if not isinstance(entry, dict) or not isinstance(entry.get("name"), str) or not entry["name"]:
            errors.append(f"R1 rules entry {index}: missing or invalid name")
            continue
        name = entry["name"]
        if name in names:
            errors.append(f"R2 {name}: duplicate rules name")
        names.add(name)

        kind = entry.get("kind")
        valid_kind = isinstance(kind, str) and kind in KINDS
        if not valid_kind:
            errors.append(f"R2 {name}: invalid kind {kind!r}")
        if name not in owners:
            continue
        if entry.get("tier") != owners[name]:
            errors.append(f"R1 {name}: tier is {entry.get('tier')!r} in rules, {owners[name]!r} in CSS")
        if not valid_kind:
            continue

        for theme, values in theme_values.items():
            errors.extend(verify_value(name, theme, values, kind != "non-color", entry.get("values")))

    errors.extend(f"R1 {name}: missing from rules" for name in sorted(owners.keys() - names))
    errors.extend(f"R1 {name}: missing from CSS" for name in sorted(names - owners.keys()))
    return errors


def main():
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("project")
    parser.add_argument("rules")
    args = parser.parse_args()

    css_count = rules_count = 0
    try:
        tiers = collect(args.project)
        owners = tier_of(tiers)
        css_count = len(owners)
        with open(args.rules, encoding="utf-8") as file:
            rules = json.load(file)
        if not isinstance(rules, dict) or not isinstance(rules.get("tokens"), list):
            raise ValueError("rules must have a tokens list")
        entries = rules["tokens"]
        rules_count = len(entries)
        errors = verify_tokens(tiers, owners, entries)
    except (OSError, ValueError, SystemExit) as error:
        errors = [str(error)]

    print(f"ground-ink tokens: CSS {css_count}, rules {rules_count}, errors {len(errors)}")
    for error in errors:
        print(f"  {error}")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())

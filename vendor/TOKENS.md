# Tasty token system

A strict **3-tier** token architecture. Reference flows in one direction only:

```
primitive  ──▶  semantic  ──▶  component  ──▶  your UI
(raw value)     (role)         (one part)      (reads --tasty-*)
```

Every token is namespaced `--tasty-*`. The canonical source lives in `tokens/`:

| File | Tier | Holds |
|------|------|-------|
| `tokens/primitives.css` | 1 · primitive | The raw values. Numeric scales: `--tasty-color-*`, `--tasty-size-*`, `--tasty-radius-*`, `--tasty-font-*`, `--tasty-duration-*`. Theme (Mocha/Latte) lives here. |
| `tokens/semantic.css`   | 2 · semantic  | Roles. Each reads a primitive or another role. The shadows, the attention ranks, the count display cap, the absent-note font style and the Latte value of `--tasty-node-dim-opacity` are literals. `--tasty-bg-*`, `--tasty-text-*`, `--tasty-accent-*`, `--tasty-space-*`, `--tasty-control-height*`, … |
| `tokens/components.css` | 3 · component | One token per styled part of one component. Each is `var(--tasty-<semantic>)`, a part-only measure on the size, radius or duration scale ([Part-only measures](#part-only-measures)), another component token ([Component references](#component-references)), or a literal parameter ([Literal parameters](#literal-parameters)). `--tasty-button-primary-bg`, `--tasty-input-border-focus`, … |

Load order is fixed in `styles.css`: `primitives → semantic → components → base`. Fonts are not part of it: the site serves them, and `styles.css` alone falls back to the system stacks. A token reads tokens of its own tier or of an earlier tier, never of a later one. A semantic role may read another role, and a component token may read a primitive or another component token only where the sections below allow it. Every consumer references `--tasty-*` directly — the pre-3-tier names (`--ctp-*`, `--bg-*`, `--space-*`…) have been fully migrated out and the legacy shim removed.

---

## Naming rules

```
TIER 1   --tasty-<category>-<scale>            --tasty-color-blue        --tasty-size-12
                                               --tasty-color-neutral-300 --tasty-font-size-13
TIER 2   --tasty-<role>                        --tasty-accent-primary    --tasty-space-md
                                               --tasty-text-muted        --tasty-control-height
TIER 3   --tasty-<component>-<part>[-<state>]  --tasty-button-primary-bg --tasty-input-border-focus
                                               --tasty-tab-fg-active     --tasty-checkbox-bg-checked
```

- **Scales are numeric and context-free.** `--tasty-size-12` = `12px`, full stop. The number carries no meaning beyond its value.
- **The neutral ramp is numbered by elevation role, not lightness.** `--tasty-color-neutral-0` is the deepest background; `-1100` is the strongest foreground. In Latte the ramp is *non-monotonic by lightness* (surfaces get darker as they raise) — that is correct, because the step tracks the role position, not the brightness.
- **Accent hues have no ramp.** Catppuccin ships one value per hue per theme, so primitives are `--tasty-color-blue`, not `--tasty-color-blue-500`.
- **States** use the suffixes `-hover`, `-active`, `-focus`, `-disabled`, `-checked`, `-on`.

---

## How theming works

Mocha (dark) is the `:root` baseline. Latte (light) activates under `<html data-theme="latte">`.

**Theme is resolved in the primitive layer.** `[data-theme="latte"]` re-points the theme-scoped color primitives (`--tasty-color-blue`, the neutral ramp, …). Because the swap happens at tier 1, the semantic and component layers stay theme-agnostic pointers and need no per-theme variants.

The **only** exceptions are a handful of *role-remaps* in `semantic.css` — roles that point at a genuinely different primitive between themes:

| Token | Mocha | Latte |
|-------|-------|-------|
| `--tasty-text-on-accent` | `--tasty-color-neutral-0` (dark) | `--tasty-color-white` |
| `--tasty-overlay-hover` / `-active` / `--tasty-separator` | white alpha | black alpha |
| `--tasty-surface-terminal-focused-bg` | `--tasty-color-black` | `--tasty-color-white` |
| `--tasty-surface-bed-unfocused` | `--tasty-bg-panel` | `--tasty-bg-app` |
| `--tasty-search-match-active-unfocused-fg` | `--tasty-search-match-active-fg` | `--tasty-color-black` |
| `--tasty-surface-on-raised` | `--tasty-surface-hover` | `--tasty-color-neutral-200` |
| `--tasty-text-on-active`, `--tasty-text-on-active-hover` | `--tasty-text-primary`, white | neutral-1100 70%, 60% toward black |
| `--tasty-text-muted` | neutral-900 | neutral-1000 |
| `--tasty-surface-field` | `--tasty-surface-raised` | neutral-200 |
| `--tasty-border-control`, `-raised` | neutral-600, neutral-700 | neutral-800 85% toward neutral-1100, neutral-900 |
| Hue inks: `--tasty-accent-<hue>-raised`, `-strong`, `-on-active` | the accent, or the accent toward white | the hue toward black |
| `--tasty-brand-ink` | `--tasty-color-melon-flesh` | `--tasty-color-melon-flesh-deep` |
| `--tasty-code-inline-bg` | `--tasty-surface-raised` | `--tasty-bg-sidebar` |

Hue ink bands: `-raised` holds its grade on `surface-raised` and every lower ground. `-strong` also holds it under hover and press and on opaque status tints. `-on-active` is the 3:1 glyph on a selected row, including hover and press. Which band goes on which ground is in [`RULES.md`](RULES.md).

Sizes, type, and motion are theme-invariant and never repeated.

---

## Using tokens

✅ **DO**

```css
/* app code & component CSS read SEMANTIC (or COMPONENT) tokens */
.my-panel   { background: var(--tasty-bg-panel); padding: var(--tasty-space-lg); }
.my-button  { background: var(--tasty-button-primary-bg); color: var(--tasty-button-primary-fg);
              height: var(--tasty-button-height); border-radius: var(--tasty-button-radius); }
```

```css
/* re-theme a component by overriding ONLY its tier-3 tokens */
.danger-zone { --tasty-button-primary-bg: var(--tasty-accent-danger); }
```

❌ **DON'T**

```css
.x { background: #89b4fa; }                       /* never a literal — use a token */
.x { background: var(--tasty-color-blue); }        /* never a PRIMITIVE in UI — use the role */
.x { color: var(--ctp-text); }                     /* legacy name — use --tasty-text-primary */
```

**Rule of thumb:** components and app code read **semantic** or **component** tokens. Primitives are referenced by the semantic layer, and by component tokens only for the part-only measures below. If you find yourself reaching for `--tasty-color-*` or `--tasty-size-*` in a UI rule, there is almost certainly a role token you should use instead.

---

## Adding a token

1. **New raw value?** Add a primitive on the right numeric scale in `primitives.css` (and its Latte counterpart if it is a color).
2. **New role?** Add a semantic token in `semantic.css` as `var(--tasty-<primitive>)`, or as another role's `var()` when it is that role in a narrower use. Never a literal: the only literal roles are the shadows, the attention ranks, the Latte value of `--tasty-node-dim-opacity`, and a literal parameter that several components share for one reason (`--tasty-count-display-max`, `--tasty-font-style-absent`, see [Literal parameters](#literal-parameters)).
3. **New component part?** Add a component token in `components.css` as `var(--tasty-<semantic>)`. A part-only measure may read its size, radius or duration primitive instead. A part of the same component may read that component's token, and so may a part drawn as another component, a member of its family, or a part that fills its slot. A count, coefficient, dash pattern or keyword may be a literal, and so may the window frame shadow. See the three sections below.
4. From the repository root, run `python3 scripts/design-tokens/verify_token_tiers.py vendor`. Then regenerate `tokens/tasty.tokens.json` with `scripts/design-tokens/gen_tokens_json.py` and run `scripts/design-tokens/verify_tokens_json.py`. Check that the token count rises and the verifier reports no errors. Non-color/size tokens (durations, easings, unitless multipliers) need a trailing `/* @kind other */`.
5. After the JSON check passes, run `scripts/design-tokens/verify_ground_ink_tokens.py` to compare the ground-ink rules' token list with the token CSS.

The tier checker covers only what it can determine from CSS, leaving the ingredients of composite values (such as a literal color in `color-mix()`) and questions of meaning (whether a measure belongs to one part, whether a semantic role with the same meaning exists, and whether a component reference is composition or peer sharing) to review.
Variable functions must use the exact lowercase form `var(--tasty-<name>)` (no case variants of the function name, escapes, whitespace or fallbacks), and token names must independently match `[a-z0-9-]+` (ASCII lowercase letters, digits and hyphens), as detailed in the docstring of [`verify_token_tiers.py`](../scripts/design-tokens/verify_token_tiers.py).

Never skip a tier for color, type, opacity, easing or UI scale. A component token that points straight at one of those primitives breaks the contract — the next person who re-themes via the semantic layer will be surprised it didn't follow.

### Part-only measures

A component token may read a primitive directly when all of these hold:

- The primitive is on the **size** (`--tasty-size-*`), **radius** (`--tasty-radius-*`) or **duration** (`--tasty-duration-*`) scale. These are theme-invariant, so the semantic layer has nothing to re-point for them.
- The value belongs to that one part: a column width, a dot diameter, a popup's fixed width, a spinner period. No other component reads it for the same reason.
- No semantic role already names that meaning. Spacing reads `--tasty-space-*`, control and bar heights read `--tasty-control-height*`, `--tasty-toolbar-height` and the other height roles, icon boxes read `--tasty-icon-size-*`, and hairlines, rings, dashes and edges read `--tasty-border-*`, `--tasty-focus-ring-*`, `--tasty-selection-edge-width` and `--tasty-tint-edge-width`. A corner reads `--tasty-radius*` unless it is a fixed platform shape. A matching value is not a matching meaning: the role must also behave the same under UI zoom. `--tasty-border-*` (width and dash), `--tasty-focus-ring-offset`, `--tasty-selection-edge-width` and `--tasty-tint-edge-width` are hairlines that keep their size at every zoom, so a measure that grows with zoom stays on the size scale even where the pixel value is the same. The move source ring is the example: its width reads `--tasty-focus-ring-width`, which zooms, and its dash and gap read `--tasty-size-4` so the pattern grows with that width instead of following the zoom-exempt `--tasty-border-dash`.

When a second component starts reading the same value for the same reason, add a semantic role and point both at it. The role name says what the value is for (`--tasty-titlebar-height`), never what it measures (`--tasty-size-36` already does that).

These families always go through a semantic role, with no part-only exception:

- color and alpha (`--tasty-color-*`, `--tasty-alpha-*`): theme lives there, and the ground-ink rules classify the roles.
- type (`--tasty-font-*`, `--tasty-line-height-*`, `--tasty-letter-spacing-*`): the type roles carry the 14px UI cap and its branding exceptions.
- opacity (`--tasty-opacity-*`): the dim, disabled and tint coefficients have rules of their own.
- easing and UI scale (`--tasty-easing-*`, `--tasty-scale-*`): one system-wide value each.

### Component references

A component token may read another component token in two cases:

- **Same component.** A state or variant reads its base part (`--tasty-menu-item-selected-fg` reads `--tasty-menu-item-fg-hover`, the DAG status fills read `--tasty-dag-node-bg`). A part can also be derived from another part (`--tasty-titlebar-window-glyph-size` is `calc(0.44 * var(--tasty-titlebar-window-button-size))`), or two parts of one component can line up (`--tasty-kb-record-height` reads `--tasty-kb-ie-slot-height`). A component is one name prefix, or a family that its comment in `components.css` declares as one component: the `graph-*` tokens extend the shared `dag-*` graph.
- **Composition.** The part is drawn as the other component, belongs to its family, or fills its slot, so it must change when that component changes. The MultiSelect trigger reads the Select tokens, the AutoComplete dropdown reads the menu tokens, the Select search field reads the Input tokens, the switch overlay keycap reads the Kbd tokens, the tab dot reads the compact StatusDot size, the loading overlay on a tab reads the tab icon slot, and the graph toolbar reads the drill-down back bar height so a push never moves the canvas.

Not allowed:

- **Peer sharing.** Two parts need the same value for the same reason, but they are not one component and neither is drawn as the other. Neither owns the value, so neither reads the other. Both read the semantic role, and if none exists, add one, as under Part-only measures. A Select placeholder is not an Input, so it reads `--tasty-text-placeholder` as the Input does. It does not read `--tasty-input-placeholder`.
- A `var()` naming a token that none of `primitives.css`, `semantic.css` and `components.css` declares, and a cycle among component tokens that read each other.

A chain may pass through several component tokens (`--tasty-notification-item-unread-dot-size` → `--tasty-badge-dot-size` → `--tasty-status-dot-size`). Every link follows these rules, and the last component token in the chain follows the tier rules above. Inside `calc()`, each `var()` follows the rule for its own tier.

### Literal parameters

A component token may hold a literal (no `var()`) only in the kinds below. Each is theme-invariant and has no scale in `primitives.css` to read.

Review each new component literal in the commit that adds it to `LITERALS` in [`verify_token_tiers.py`](../scripts/design-tokens/verify_token_tiers.py). When a component literal moves to a shared semantic role, remove its key from `LITERALS` in [`verify_token_tiers.py`](../scripts/design-tokens/verify_token_tiers.py) and the matching entry from `LITERAL_DECLS` in [`test_verify_token_tiers.py`](../scripts/design-tokens/test_verify_token_tiers.py). In the same commit, update the expectations in `test_verify_token_tiers.py` for any literal totals, per-kind counts, declaration counts, or output text containing those counts that change with the move, along with any tests that depend on the moved key. Make sure all tests in the file pass.

| Kind | Example | Why no scale fits |
|------|---------|-------------------|
| Count or clamp: a unitless integer | `--tasty-notification-item-body-lines` (2) | A number of items or lines, not a measure. |
| Coefficient: a unitless factor in the part's own layout formula | `--tasty-explorer-favorites-pin-ratio` (0.4) | It scales a measure the part computes at run time. Opacity is not a coefficient: it goes through its role. |
| Dash pattern: an SVG `stroke-dasharray` list | `--tasty-dag-edge-dash-binding` (`8 2 2 2`) | A list. The size scale holds single values. |
| Keyword | `--tasty-cut-pending-font-style` (`italic`) | A keyword is not on any scale. |
| Window frame shadow | `--tasty-titlebar-csd-shadow` | OS window-frame chrome, outside the two UI shadows in `semantic.css`. It is the only component shadow. |

Every kind except the shadow carries `/* @kind other */`. A literal is never a color, alpha, size, radius, duration, font size, font weight, opacity, easing or scale, because each of those has a scale or a role. When a second component needs the same literal for the same reason, add a semantic role, as under Part-only measures. That role holds the literal, with `/* @kind other */`, and each component token reads it: the "99+" caps of the workspace running count and the notification badge read `--tasty-count-display-max`. A keyword several parts share is the same case: every note that stands in for absent content (empty list, unbound shortcut, lines or a preview not shown) reads `--tasty-font-style-absent` (`italic`). A cut row's italic name is another reason, so `--tasty-cut-pending-font-style` keeps its own literal.

---

## Machine-readable export

`tokens/tasty.tokens.json` exports all three tiers in DTCG format with Tasty extensions. The generator infers each `$type` from its CSS value. The export keeps dimensions, shadows and dash patterns as CSS strings and uses the Tasty-specific `fontStyle` type for `italic` in tokens with `font-style` in their names.

The tier checker validates variable syntax before export. The generator turns an exact `var(--tasty-<name>)` value into a `$value` alias such as `{primitive.color-blue}`. Theme overrides use `latte` under `$extensions["com.tasty.mode"]`.

With the default transform groups in Style Dictionary 5.8.0, CSS (`css/variables`) and Android (`android/resources`) emit `italic` as a string. Swift (`ios-swift/enum.swift`) and Compose (`compose/object`) emit unquoted `italic` and need a custom transform to produce a string or a platform value.

Strict DTCG consumers need a separate export. This repository currently provides only the Tasty export.

> The token JSON is generated as a 1:1 mirror of the three CSS files.
> Edit only the top-level `$description` by hand. The generator copies it from the previous JSON.
> A partial export silently drops parts of the component contract, so CSS ↔ JSON parity is a build invariant.
> CI regenerates the JSON, then runs `git diff --exit-code` and `verify_tokens_json.py`.

---

## Token name history (reference)

The system was migrated from a flat pre-3-tier naming to `--tasty-*`. The mapping below is kept for anyone reading old commits or external snapshots; the old names no longer resolve.

| Old (removed) | New |
|-----|-----|
| `--ctp-blue` | `--tasty-color-blue` |
| `--ctp-surface0` | `--tasty-color-neutral-300` |
| `--ctp-text` | `--tasty-color-neutral-1100` |
| `--bg-app` / `--bg-panel` | `--tasty-bg-app` / `--tasty-bg-panel` |
| `--text-primary` / `--text-muted` | `--tasty-text-primary` / `--tasty-text-muted` |
| `--accent-primary` | `--tasty-accent-primary` |
| `--space-md` | `--tasty-space-md` |
| `--radius` | `--tasty-radius` |
| `--item-height-interactive` | `--tasty-control-height` |
| `--separator` | `--tasty-separator` |

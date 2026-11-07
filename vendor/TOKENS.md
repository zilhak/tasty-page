# Tasty token system

A strict **3-tier** token architecture. Reference flows in one direction only:

```
primitive  ──▶  semantic  ──▶  component  ──▶  your UI
(raw value)     (role)         (one part)      (reads --tasty-*)
```

Every token is namespaced `--tasty-*`. The canonical source lives in `tokens/`:

| File | Tier | Holds |
|------|------|-------|
| `tokens/primitives.css` | 1 · primitive | The **only** literal values. Numeric scales: `--tasty-color-*`, `--tasty-size-*`, `--tasty-radius-*`, `--tasty-font-*`, `--tasty-duration-*`. Theme (Mocha/Latte) lives here. |
| `tokens/semantic.css`   | 2 · semantic  | Roles. Each is `var(--tasty-<primitive>)`. `--tasty-bg-*`, `--tasty-text-*`, `--tasty-accent-*`, `--tasty-space-*`, `--tasty-control-height*`, … |
| `tokens/components.css` | 3 · component | One token per styled part of one component. Each is `var(--tasty-<semantic>)`. `--tasty-button-primary-bg`, `--tasty-input-border-focus`, … |

Load order is fixed in `styles.css`: `fonts → primitives → semantic → components → base`. Each layer references the one above it, so order matters. Every consumer references `--tasty-*` directly — the pre-3-tier names (`--ctp-*`, `--bg-*`, `--space-*`…) have been fully migrated out and the legacy shim removed.

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
| `--tasty-surface-terminal-focused-bg` / markdown | `--tasty-color-black` | `--tasty-color-white` |
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

**Rule of thumb:** components and app code read **semantic** or **component** tokens. Primitives are referenced *only* by the semantic layer. If you find yourself reaching for `--tasty-color-*` or `--tasty-size-*` in a UI rule, there is almost certainly a role token you should use instead.

---

## Adding a token

1. **New raw value?** Add a primitive on the right numeric scale in `primitives.css` (and its Latte counterpart if it is a color).
2. **New role?** Add a semantic token in `semantic.css` as `var(--tasty-<primitive>)`. Never a literal.
3. **New component part?** Add a component token in `components.css` as `var(--tasty-<semantic>)`.
4. Run `check_design_system` and confirm the token count rises and there are no classification warnings. Non-color/size tokens (durations, easings, unitless multipliers) need a trailing `/* @kind other */`.

Never skip a tier. A component token that points straight at a primitive (or a literal) breaks the contract — the next person who re-themes via the semantic layer will be surprised it didn't follow.

---

## Machine-readable export

`tokens/tasty.tokens.json` is a **W3C DTCG**-format export of the whole system (primitive / semantic / component groups, with `$value` aliases like `{primitive.color-blue}` / `{semantic.space-md}` mirroring the CSS `var()` chain, and a `latte` mode under `$extensions["com.tasty.mode"]` for the theme-scoped tokens). Feed it to Style Dictionary / Tokens Studio to generate platform outputs (Swift, Kotlin, Tailwind config, etc.).

> It is a **generated artifact** — a full 1:1 mirror of the three CSS files (regenerate it from them; never hand-edit). Keeping it partial silently drops half the component contract, so treat CSS ↔ JSON parity as a build invariant.

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

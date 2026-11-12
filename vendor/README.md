# Tasty Design System

This folder is the source of truth for the Tasty UI design. The Tasty app and its gallery (`crates/tasty-gallery` in the [Tasty repository](https://github.com/zilhak/tasty)) follow it, and this site renders its gallery and component demos straight from these files. The design is not kept anywhere else: a design change is made here first, then carried into the Tasty gallery and the app.

A design system for **Tasty** — a cross-platform, GPU-accelerated terminal emulator purpose-built for AI coding agents. It mirrors Tasty's real theme system (Catppuccin Mocha/Latte, 4px grid, 14px UI cap) as web tokens, a React component library, an interactive UI-kit recreation of the product, and the component gallery.

> **Use this to** build well-branded Tasty interfaces and assets — marketing pages, docs, settings mockups, plugin UIs, slides, or throwaway prototypes — without re-deriving the palette or spacing.

## The form kept here

The files are in their final form as they stand. Tier 1 values live in `tokens/primitives.css` itself, which does not import `tokens.css`; `tokens.css` holds the same values. The D2Coding font files are not kept in this folder, so `styles.css` alone falls back to the system sans and the mono fallback stack. The site keeps them with their license at `/fonts/` and draws gallery specimens in them. Icons carry no provenance metadata (C2PA). Token comments do not cite working notes. There is no prebuilt component bundle or per-component preview page: the site imports `components/**/*.jsx` directly, so every `.jsx` here is an ES module.

---

## Sources

Everything here is lifted from the product's own code, not guessed. Explore these further if you have access — they will let you build with higher fidelity.

- **GitHub:** [`github.com/zilhak/tasty`](https://github.com/zilhak/tasty) — Rust workspace (winit + wgpu + egui + termwiz).
  - `crates/tasty-themes/themes/{mocha,latte}.toml` — the exact color palettes reproduced as primitives in `tokens.css`.
  - `crates/tasty-type-appearance/src/theme.rs` — `SIZING` constants (spacing, radius, item heights, font caps) reproduced across `tokens.css` + `tokens/semantic.css`, plus `derive_overlays()` (hover/active/separator).
  - [`docs/design/systems/theme.md`](https://github.com/zilhak/tasty/blob/develop/docs/design/systems/theme.md), [`CLAUDE.md`](https://github.com/zilhak/tasty/blob/develop/CLAUDE.md) — the UI design rules (4px grid, 14px cap, 1px border, overlays, 0ms terminal motion).
  - `lang/en.toml` — UI copy, the source for the tone notes below.
  - `assets/icons/` — the watermelon app icon.
- **Fonts:** `D2Coding` (ligature build) — Tasty's default terminal/code typeface. The font files are not kept in this folder (see "The form kept here").

---

## Product context

Tasty is a native terminal emulator (Windows / macOS / Linux) whose defining idea is the **strict separation of user actions from agent actions**:

- **User actions** = keyboard shortcuts, mouse, OS-native input. Only the user makes them.
- **Agent actions** = IPC methods / CLI subcommands. An AI agent calls them to do its own work.

An agent's side effects never touch the user's focus, history, or selection; every command targets a resource by **ID**, never "the focused thing." This is the soul of the product, and it shapes the UI: surfaces show whether they're user- or agent-driven, focus is explicit, and agent activity is always legible but never intrusive.

**Object model (ubiquitous language):** Window › Workspace › Tab › Pane › **Surface**. A surface has a *kind* — `terminal`, `markdown`, `explorer`, `html`, `image`, or a plugin-defined kind. Modal / Popup / Toast are distinct UI layers.

**Signature features:** multi-agent orchestration (`agent.task_*` DAGs, barrier/semaphore/lease/rate-limit), headless operation (`--headless`), vi copy mode, a Plugin SDK with a permission system, shared context (Blackboard / Plan / Cache), OSC-133 command indexing, output observers, telemetry + token cost caps, and a fully user-rebindable keybinding system.

---

## Content fundamentals

How Tasty writes. Match this voice in any copy you produce.

- **Voice:** terse, technical, second person ("you"). Developer-to-developer, zero marketing fluff. Example: *"You're up to date."* / *"Held by another client (readonly). Force detach to take over."*
- **Casing:** Sentence case for everything — labels, headings, buttons (`New workspace`, `Mark all read`, `Force detach`). Never Title Case sentences.
- **Imperatives for actions:** buttons and menu items are bare verbs or verb phrases — `Save`, `Add`, `Open folder`, `Move to Trash`, `Force detach`.
- **Commands in backticks:** CLI is referenced inline in monospace — *"Tip: run `tasty config edit` to open your config in the editor."*
- **Explain trade-offs plainly:** tooltips state the consequence, not marketing. *"Auto: adjusts font rendering to match monitor DPI. Fixed: more cells on high-DPI monitors, smaller text."*
- **No emoji in chrome.** Status is carried by symbols (`✓ ✗ ⚠`), color dots, and short words (`enabled`, `running`, `disabled`). The watermelon logo is the one playful note. (Emoji like 🦀 may appear inside *terminal content* — that's the user's shell, not Tasty's UI.)
- **IDs are first-class:** surfaces, tabs, panes are referenced by short IDs (`s_01HX`, `t_build`). Show them in monospace.
- **i18n-aware:** strings ship in English, Korean, Japanese. Keep copy short and translation-friendly.

---

## Visual foundations

- **Palette — Catppuccin.** Mocha (dark) is the default and the fallback-guaranteed theme; Latte (light) is the built-in alternate. Colors flow through a strict **3-tier token system** (see below): raw primitives (`--tasty-color-blue`, `--tasty-color-neutral-300`) → semantic roles (`--tasty-accent-primary`, `--tasty-surface-raised`) → component tokens (`--tasty-button-primary-bg`). Reference the role/component layers in UI — never a primitive or a literal.
- **Elevation by tint inside the page.** There is **no general shadow system**, and nothing inside the page casts a shadow. Depth reads through the surface ramp: `crust → mantle → base → surface0 → surface1 → surface2`. Only a surface that floats over the page takes a shadow, and there are exactly two: `--tasty-shadow-popover` when it is anchored with no scrim, and `--tasty-shadow-modal` when it is centered over a scrim. That holds in components too: a dropdown menu or tooltip reads `--tasty-shadow-popover`. The OS window frame's `--tasty-titlebar-csd-shadow` is the one value outside the pair. A `box-shadow` that draws a focus ring or a selected bar is a stroke, not elevation.
- **Accents map to roles.** `blue` = primary, `sky` = info, `green` = success, `yellow` = warning, `red` = danger, **`mauve` = AI-agent**. The agent accent is deliberate — agent-driven surfaces and actions are tinted mauve so user vs. agent stays visible.
- **Type.** UI chrome uses a native system sans, **hard-capped at 14px** (`--tasty-font-size-max`); body is 13px, captions 11px. Headings are body-size at weight 600 — hierarchy comes from weight, not scale. Terminal/code uses **D2Coding** (the brand mono, with ligatures), 12–16px and user-scalable. Small labels that draw translated words read `--tasty-font-label`, which is mono in English and Korean and the UI sans in Japanese and Simplified Chinese ([`RULES.md`](RULES.md) section 8).
- **Spacing.** Strict **4px grid** — only `--tasty-space-xs/sm/md/lg/xl` (4/8/12/16/24). Fixed interactive heights: tree row 22px, control 28px, tab 24px (×150px wide).
- **Borders & radius.** Borders are **always 1px**; radius is **always 4px** (`--tasty-radius`, with a 2px `--tasty-radius-sm` for tiny inner elements). Crisp and rectilinear — this is a terminal, not a consumer app.
- **States via overlays.** Hover and active are derived tints, not new colors: **8%** hover, **12%** active. In dark themes they're white; in light themes black (mirrors `derive_overlays()`). Focus is a 2px `--accent-primary` ring.
- **Contrast and color choice.** [`RULES.md`](RULES.md) is the source: which ground sits where, which ink sits on it, what each component reads in each state. `tokens/ground-ink-rules.json` holds the same content for machines. A combination that is not in the table cannot be made. Change the rule first.
- **Motion.** **Terminal content never animates — 0ms, always** (input responsiveness wins). UI widgets get short feedback only (90–120ms, `--tasty-ease-ui`). Reveals are slower and answer a pause, not an input: `--tasty-motion-ui-med` (150ms) is the tooltip show delay. Everything honors `prefers-reduced-motion`.
- **State vs transition.** For every interactive component the **rest / hover / active / focus / disabled *resting states* are canonical** — design parity is judged on those resting states alone. The *transitions between* them (the `--tasty-motion-ui-fast` hover/active tint fades) are **decorative**: an immediate-mode renderer (egui, etc.) that **snaps straight to the end state is fully compliant**, not a parity miss. Two things are exempt and stay strict — **terminal content is 0ms** (above), and anything **functional must be instant, never faded**: focus-ring visibility, the `invalid` border, and checked/selected/active states must read correctly the moment the state changes (their *appearance* is canonical; only the ease into it is optional).
- **Content parity exception — markdown is library-driven.** Design parity (pixel transcription of the design into the real UI) binds **app chrome** — popups, tabs, panels, toolbars, the markdown surface's own address-bar/chrome. It does **not** bind **markdown rendered content**. The markdown viewer renders through the `egui_commonmark` library, whose heading size ladder, paragraph leading, and block spacing are fixed by the library — so **markdown content typography follows the library's form (library-driven), not a pixel spec.** What we *do* inject is **color**: Tasty theme tokens are pushed into `egui::Visuals` so the content matches the palette 1:1 (mapping in the Markdown gallery specimen). The scope is the markdown **content body only**; the surrounding chrome keeps strict pixel parity like everything else.
- **Surface focus.** A surface whose bed belongs to Tasty swaps its bed with focus: terminal, markdown, empty, explorer file area, DAG canvas, image canvas. Html and plugin surfaces paint their own bed, so the host paints a 2px neutral edge across their top instead. It is not the keyboard focus ring, which stays blue. [`RULES.md`](RULES.md) section 4 has the rules.
- **Backgrounds.** Flat solid surface tones — no gradients, no textures, no imagery behind UI. The focused terminal reads `surface-terminal-focused-bg`: true black in Mocha, white in Latte. Transparency appears only as the configurable terminal background opacity and the modal scrim.
- **Cards/panels** = a `surface-raised` (surface0) fill + 1px `border-default` + 4px radius. No drop shadow. That's the whole recipe.

---

## Iconography

- **Style:** thin, rectilinear **line icons, \~2px stroke, no fill** — consistent with egui's native UI feel. Square-ish, 14–16px in chrome.
- **In the repo:** Tasty ships only a handful of raster/SVG marks (the watermelon app icon `assets/icons/icon_*.png`, plus `chevron-left/right.svg`). It does **not** bundle a large icon font; egui draws most affordances as simple vector paths.
- **In this system:** the canonical glyph set lives in **`icons/<name>.svg`** (one 24×24 viewBox, 2px stroke, round cap/join, `currentColor`), with `icons.json` as its manifest and `gallery/icons/index.jsx` as its catalog. UI renders a glyph **by name** through the `Icon` component (`components/core/Icon.jsx`) — never an inline `<svg>` or `<img src=".svg">`. **⚠ Substitution flagged** — the set is designed here in a Lucide-like 2px style; it is not extracted from the product's egui draw code.
- **Unicode as glyphs:** Tasty uses bare unicode for some affordances — `❯` prompt, `◑` theme, `✓ ✗ ⚠` status, `+ −` toggles, `↑ ↓ ↵` palette hints. Reuse these rather than inventing icons for them.
- **Logo:** a watermelon slice (coral-red flesh `#f25d6b`, deep-green rind `#1e7d4f`, dark seeds) — the single playful brand element. Pair with the lowercase monospace wordmark `tasty.` (the `.` in flesh red). Assets in [`assets/icons/`](https://github.com/zilhak/tasty/tree/develop/assets/icons) of the Tasty repository.
- **No emoji as UI icons.**

---

## Index

**Root**

- `styles.css` — the single entry point consumers link. `@import`s only, in tier order.
- `RULES.md` — the ground, ink, component and layout rules. Canonical for color choice.
- `TOKENS.md` — the token-system guide: naming rules, how theming resolves, do/don't, how to add a token, migration table.
- `tokens.css` — tier 1 values (Mocha / Latte colors, size, radius, type scale, opacity, scale).
- `tokens/` — a **3-tier** system, all namespaced `--tasty-*`:
  - `primitives.css` (tier 1) — the only literals: numeric color/size/radius/font/duration scales; Mocha baseline + Latte re-points under `[data-theme="latte"]`.
  - `semantic.css` (tier 2) — roles (`--tasty-bg-*`, `--tasty-text-*`, `--tasty-accent-*`, `--tasty-space-*`, `--tasty-control-height*`…), each `var(--tasty-<primitive>)`.
  - `components.css` (tier 3) — one token per styled part of each component (`--tasty-button-*`, `--tasty-input-*`, `--tasty-tab-*`…), each `var(--tasty-<semantic>)`.
  - `base.css` — element defaults, scrollbars, focus.
  - `ground-ink-rules.json` — the rules as data: grounds, roles, every ground × role cell, locations, component contracts, the class of every token, exceptions.
  - `tasty.tokens.json` — W3C DTCG export of all three tiers (alias chain + Latte mode) for Style Dictionary / Tokens Studio. The app takes its tokens from this file.
- The 3-tier chain is shown in `gallery/tokens/index.jsx`, with primitive → semantic → component rows read from `tokens/tasty.tokens.json`. Mocha and Latte appear together, with no theme toggle.
- `icons/` + `icons.json` — the canonical UI glyph set (source of truth) and its manifest; rendered via `<Icon name>`. The app icons are transcribed from `icons.json`.
- `i18n/zh-Hans/glossary.json` — Simplified Chinese terms, style rules, display name and language order, read by the app and site translation. Codex writes its values; send changes back to Codex rather than editing them by hand.

**Components** (sources and types in `components/<group>/<Comp>.jsx` and `<Comp>.d.ts`; `components/index.js` re-exports them)

- `core/` — Button, IconButton, Badge, Tag, Kbd, Icon (by-name glyph renderer over `icons/`)
- `forms/` — Input, CodeArea, Select, SearchableSelect, MultiSelect, AutoComplete, Checkbox, Switch
- `navigation/` — Tab, TreeRow, MenuItem, DrillDown
- `feedback/` — PendingIndicator, NotificationBadge / NotificationBadgeGroup, NotificationItem, Toast, StatusDot, Spinner, LoadingOverlay, Tooltip, HelpHint, CenterState
- `data/` — Table, ListCtrl

**UI kit** (`ui_kits/terminal/`)

- An interactive recreation of the Tasty main window — sidebar (+ context menus), tab strip, split terminal/markdown surfaces, command palette, search bar, and overlays, plus CSD title-bar explorations under `titlebar/`.
- `app.jsx` writes its own theme state to `document.documentElement.dataset.theme` when it mounts. The site mounts it through a wrapper that passes the theme as props, so it does not fight the site's theme toggle.

**Gallery** (`gallery/`)

- The catalog of the system, rendered by the site's gallery pages: foundations, icons, rules, location map, components, overlays (dialogs · windows · popups · banners · tutorial), layouts, the Task DAG surface, startup chrome, and plugin surfaces. One folder per page with `index.jsx`; shared parts in `parts/`. See [`gallery/README.md`](gallery/README.md), [`gallery/coverage.md`](gallery/coverage.md) and `gallery/contract-audit.js`.

**Screens** (`screens/`) — Mocha screenshots of the app UI. There are no Latte counterparts.

**Share images** (`share/`) — the 1200×630 link preview image for each language, with the HTML and render script they come from. `gallery/foundations/` shows them.

---

## Caveats

- **Icons are a flagged substitution** — the `icons/` set is designed here (Lucide-like 2px line style) and stands in for Tasty's egui-drawn affordances. The product side should adopt it as-is or map each name to its own asset.
- **UI sans is a system stack** — Tasty's UI font is whatever egui renders natively; this system uses the platform sans rather than a bundled webfont. D2Coding (the mono) is the brand font. Its files are not kept in this folder, and on the site only gallery specimens draw in them.

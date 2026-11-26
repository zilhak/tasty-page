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
- **Fonts:** `D2Coding` (ligature build) — the UI face the design sets, and the default terminal/code typeface. In Japanese and Simplified Chinese UI text the language's CJK font draws Han and kana instead. The font files are not kept in this folder (see "The form kept here").

---

## Product context

Tasty is a native terminal emulator (Windows / macOS / Linux) whose defining idea is the **strict separation of user actions from agent actions**:

- **User actions** = keyboard shortcuts, mouse, OS-native input. Only the user makes them.
- **Agent actions** = IPC methods / CLI subcommands. An AI agent calls them to do its own work.

An agent's side effects never touch the user's focus, history, or selection; every command targets a resource by **ID**, never "the focused thing." This is the soul of the product, and it shapes the UI: surfaces show whether they're user- or agent-driven, focus is explicit, and agent activity is always legible but never intrusive.

**Object model (ubiquitous language):** Window › Workspace › Tab › Pane › **Surface**. A surface has a *kind* — `terminal`, `markdown`, `explorer`, `html`, `image`, or a plugin-defined kind. Modal / Popup / Toast are distinct UI layers.

**Signature features:** multi-agent orchestration (`agent.task_*` DAGs, barrier/semaphore/lease/rate-limit), headless operation (`--headless`), vi copy mode, a Plugin SDK, shared context (Blackboard / Plan / Cache), OSC-133 command indexing, output observers, telemetry + token cost caps, and a fully user-rebindable keybinding system.

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
- **Type.** UI chrome is set in **D2Coding** (`--tasty-font-ui`), with the system sans after it for the letters it lacks, **hard-capped at 14px** (`--tasty-font-size-max`); body is 13px, captions 11px. Headings are body-size at weight 600 — hierarchy comes from weight, not scale. The face has two weights: 400 and 500 draw D2Coding Regular, 600 and 700 draw D2Coding Bold. Terminal/code uses D2Coding too (`--tasty-font-mono`, the brand mono), 12–16px and user-scalable. Only terminal content draws its ligatures. UI text, mono runs in the UI (paths, IDs, code runs) and keycaps draw none, because the app lays them out glyph by glyph. In Japanese and Simplified Chinese `--tasty-font-ui` reads `--tasty-font-family-ui-ja` or `--tasty-font-family-ui-zh-hans`: Latin, digits, Hangul and symbols still draw in D2Coding, and Han, kana and CJK punctuation draw in the language's CJK font (`tokens/base.css`). Small labels that draw translated words read `--tasty-font-label`, which is mono in English and Korean and `--tasty-font-ui` in Japanese and Simplified Chinese ([`RULES.md`](RULES.md) section 8). The gallery's writing about a specimen (headings, descriptions, notes, spec tables) reads `--tasty-font-prose`, the system sans; the specimen itself reads the app's faces.
- **Spacing.** Strict **4px grid** — only `--tasty-space-xs/sm/md/lg/xl` (4/8/12/16/24). Fixed interactive heights: tree row 22px, control 28px, tab 24px (×150px wide).
- **Borders & radius.** Borders are **always 1px**; radius is **always 4px** (`--tasty-radius`, with a 2px `--tasty-radius-sm` for tiny inner elements). Crisp and rectilinear — this is a terminal, not a consumer app.
- **States via overlays.** Hover and active are derived tints, not new colors: **8%** hover, **12%** active. In dark themes they're white; in light themes black (mirrors `derive_overlays()`). Focus is a 2px `--accent-primary` ring, in one of two shapes. A text field (Input, Select, CodeArea, AutoComplete, SearchableSelect and MultiSelect triggers, and the address and path fields) turns its 1px border `--tasty-border-focus` and adds a 1px ring flush outside it, with no gap: one solid 2px edge that reaches 1px past the box. Invalid draws the same two lines in the danger edge color. No field draws a gap between edge and ring or a translucent halo. Any other control (button, icon button, checkbox, tab) draws a 2px outline `--tasty-focus-ring-offset` (1px) off its box; the switch draws it 2px off its track. The pane tab strip is no keyboard stop and draws no focus ring: tabs move by shortcut. The app does not hold to this yet, since egui focus can still reach a pane tab and its close button, and taking them out of the focus order is the app's pending work. The Tab component is no Tab stop; where a web host gives a pane tab one, its ring sits 2px inside the tab, because tabs abut and the strip clips, and the close button inside it keeps the 1px-off ring. The settings L1 tab keeps its ring inside the tab at a −5px offset so the ring stays visible at the window's top edge, and every remote tab uses the same inset because an outer ring would cross the 2px gap and overlap the next tab's underline when that tab is open. The inset leaves 1px of clearance from the tab's own 2px underline, and settings L2 rows, remote segments, and the plugins tab bar take keyboard focus by Tab and Shift+Tab and keep the 1px-off ring.
- **Contrast and color choice.** [`RULES.md`](RULES.md) is the source: which ground sits where, which ink sits on it, what each component reads in each state. `tokens/ground-ink-rules.json` holds the same content for machines. A combination that is not in the table cannot be made. Change the rule first.
- **Motion.** **Terminal content never animates — 0ms, always** (input responsiveness wins). UI widgets get short feedback only (90–120ms, `--tasty-ease-ui`). Reveals are slower and answer a pause, not an input: `--tasty-motion-ui-med` (150ms) is the tooltip show delay. Everything honors `prefers-reduced-motion`.
- **State vs transition.** For every interactive component the **rest / hover / active / focus / disabled *resting states* are canonical** — design parity is judged on those resting states alone. The *transitions between* them (the `--tasty-motion-ui-fast` hover/active tint fades) are **decorative**: an immediate-mode renderer (egui, etc.) that **snaps straight to the end state is fully compliant**, not a parity miss. Two things are exempt and stay strict — **terminal content is 0ms** (above), and anything **functional must be instant, never faded**: focus-ring visibility, the `invalid` border, and checked/selected/active states must read correctly the moment the state changes (their *appearance* is canonical; only the ease into it is optional).
- **Content parity exception — markdown is library-driven.** Design parity (pixel transcription of the design into the real UI) binds **app chrome** — popups, tabs, panels, toolbars, the markdown surface's own address-bar/chrome. It does **not** bind **markdown rendered content**. The markdown viewer renders through the `egui_commonmark` library, whose heading size ladder, paragraph leading, and block spacing are fixed by the library — so **markdown content typography follows the library's form (library-driven), not a pixel spec.** What we *do* inject is **color**: Tasty theme tokens are pushed into `egui::Visuals` so the content matches the palette 1:1 (mapping in the Markdown gallery specimen). The scope is the markdown **content body only**; the surrounding chrome keeps strict pixel parity like everything else.
- **Surface focus.** A surface whose bed belongs to Tasty swaps its bed with focus: terminal, markdown, empty, explorer file area, DAG canvas, image canvas. Html and plugin surfaces paint their own bed, so the host paints a 2px neutral edge across their top instead. It is not the keyboard focus ring, which stays blue. Focus here is key focus, so while a popup holds it the surface under it reads unfocused. Highlight clearing, the terminal cursor and the focus a mesh, webview or plugin is told follow the same key focus. [`RULES.md`](RULES.md) section 4 has the rules and their exceptions.
- **Backgrounds.** Flat solid surface tones — no gradients, no textures, no imagery behind UI. The focused terminal reads `surface-terminal-focused-bg`: true black in Mocha, white in Latte. Transparency appears only as the configurable terminal background opacity and the modal scrim.
- **Cards/panels** = a `surface-raised` (surface0) fill + 1px `border-strong` + 4px radius. No drop shadow.

---

## Iconography

- **Style:** thin, rectilinear **line icons, \~2px stroke, no fill** — consistent with egui's native UI feel. Square-ish, 14–16px in chrome.
- **In the repo:** Tasty ships only a handful of raster/SVG marks (the watermelon app icon `assets/icons/icon_*.png`, plus `chevron-left/right.svg`). It does **not** bundle a large icon font; egui draws most affordances as simple vector paths.
- **In this system:** the canonical glyph set lives in **`icons/<name>.svg`** (one 24×24 viewBox, 2px stroke, round cap/join, `currentColor`), with `icons.json` as its manifest and `gallery/icons/index.jsx` as its catalog. UI renders a glyph **by name** through the `Icon` component (`components/core/Icon.jsx`) — never an inline `<svg>` or `<img src=".svg">`. **⚠ Substitution flagged** — the set is independent of the product's egui draw code. Of the 79 icons, 35 carry a Lucide attribution and 44 have no source entry. Seventeen have the same shape as icons in `lucide-static` 0.460.0. Another 18 carry the `Adapted from` label as a precaution based on shape comparisons with that release. The `source` fields in [`icons.json`](icons.json) name the corresponding Lucide icons. See the [Lucide ISC License](icons/LICENSE-lucide.txt) and the [MIT License for the Feather portions](icons/LICENSE-feather.txt).
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
  - `primitives.css` (tier 1) — the raw values: numeric color/size/radius/font/duration scales; Mocha baseline + Latte re-points under `[data-theme="latte"]`.
  - `semantic.css` (tier 2) — roles (`--tasty-bg-*`, `--tasty-text-*`, `--tasty-accent-*`, `--tasty-space-*`, `--tasty-control-height*`…), each reading a primitive or another role; the shadows, the attention ranks, the count display cap, the absent-note font style and the Latte `--tasty-node-dim-opacity` are literals.
  - `components.css` (tier 3) — one token per styled part of each component (`--tasty-button-*`, `--tasty-input-*`, `--tasty-tab-*`…), each `var(--tasty-<semantic>)`. A measure that belongs to one part may read the size, radius or duration primitive instead, a part may read another component token of its own component or of the component it is drawn as, belongs to the family of, or whose slot it fills, and a count, coefficient, dash pattern, keyword or the window frame shadow may be a literal (`TOKENS.md`, "Part-only measures", "Component references", "Literal parameters").
  - `base.css` — element defaults, scrollbars, focus.
  - `ground-ink-rules.json` — the rules as data: grounds, roles, every ground × role cell, locations, component contracts, the class of every token, exceptions.
  - `tasty.tokens.json` — exports all three tiers in DTCG format with Tasty extensions, including the `fontStyle` type. The generator infers each `$type` from its CSS value and stores dimensions, shadows and dash patterns as CSS strings. The app takes its tokens from this file. See [Machine-readable export](TOKENS.md#machine-readable-export).
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

- The catalog of the system, rendered by the site's gallery pages: foundations, icons, rules, location map, components, overlays (dialogs · windows · popups · banners · tutorial), layouts, the Task DAG surface, startup chrome, and plugin surfaces. One folder per page with `index.jsx`; shared parts in `parts/`. See [`gallery/coverage.md`](gallery/coverage.md) and the gallery README for [the rendered contrast check](gallery/README.md#the-check).

**Screens** (`screens/`) — Mocha screenshots of the app UI. There are no Latte counterparts.

**Share images** (`share/`) — the 1200×630 link preview image for each language, with the HTML and render script they come from. `gallery/foundations/` shows them.

---

## Caveats

- **Icons are a flagged substitution** — the `icons/` set stands in for Tasty's egui-drawn affordances. The `source` fields in [`icons.json`](icons.json) identify 35 credited entries, 17 marked `Same shape as` and 18 marked `Adapted from`. The other 44 entries have no source field. See the [Lucide ISC License](icons/LICENSE-lucide.txt) and the [Feather MIT License](icons/LICENSE-feather.txt). The product side should adopt it as-is or map each name to its own asset.
- **D2Coding is the UI face too** — the design sets the UI's proportional text in D2Coding, Regular and Bold, with the system fonts after it for the letters it lacks. In Japanese and Simplified Chinese, D2Coding does not draw Han, kana, CJK punctuation or full-width forms: the language's CJK font draws them, so Han in one word never comes from two faces ([`RULES.md`](RULES.md) section 8, "CJK ranges"). On the site this takes a second `@font-face` for the same files, `D2Coding Hangul Latin`, with a `unicode-range`. This is the target the app is measured against, not a description of a build. D2Coding is also the mono and the brand font. Its files are not kept in this folder, and on the site only gallery specimens draw in them.

# Ground and ink rules

The source for which ground sits where, which ink sits on it, and what each component reads in each state. `tokens/ground-ink-rules.json` is the same content for machines, and it holds every cell. If this page and the file disagree, the file wins.

Contrast is the WCAG 2 ratio, measured in Mocha and Latte. Every number here is computed from `tokens/tasty.tokens.json`.

**Measure in 8 bits, because the app paints in 8 bits.** Each resolved color rounds per channel to 8 bits, half up. A translucent layer or ink composites source-over in sRGB, and the result rounds per channel again. The ratio is taken on those rounded values, in the same form as `grounds[].values` in `tokens/ground-ink-rules.json`. A cell has to pass with the alpha as the token gives it and with the alpha itself rounded to n/255. The ratio is compared to the grade before any display rounding. One 8-bit step moves a ratio by about 0.02 to 0.04, so a cell within 0.05 above its grade is a boundary cell.

## 1. How to find a value

1. **Location.** Find where the UI sits in the [location map](#4-location-map). That gives the ground and the child grounds it may hold.
2. **Ground.** Take the ground for the current state from [state grounds](#3-state-grounds). A child with its own fill is the ground for its own ink.
3. **Role.** Say what the ink does: body text, muted text, a glyph, an edge. See [roles](#5-roles-and-grades).
4. **Token.** Read the cell in [the table](#6-ground-by-role). A component with a contract in [section 9](#9-component-contracts) has that lookup done already.

No cell, or the cell says forbidden? Do not pick a value. Change the rule first, as in [section 13](#13-changing-the-rules).

## 2. How strong the rules are

These have no exceptions:

- A UI ink sits only on a ground and role whose cell names a token. The ink is that token, or a component token that is listed in the file with that ground and role.
- A ground nests only as the location map says.
- UI reads no primitive and no literal.
- Every color token is classified in the file. An unclassified token fails the check.
- Below grade is a failure in either theme. Text has no large-text allowance, because UI type stops at 14px. The site's display type is the one place it exists, in [section 15](#15-site-pages).
- Hover and press hold the same grade as rest. A person reads a row while pointing at it.

Exceptions exist only in the `exceptions` list of the file and in [section 12](#12-exceptions). A case that is not on that list is not an exception.

## 3. Grounds

### Opaque neutral grounds

| ID | Token | Mocha | Latte | Used for |
|---|---|---|---|---|
| `crust` | `bg-app` | #11111b | #dce0e8 | Window chrome, title bar, sidebar category band, markdown page, recessed progress track, DAG log. |
| `mantle` | `bg-sidebar` | #181825 | #e6e9ef | Sidebar, tab strip, address bars, table header, DAG chrome and detail, code gutter, notice path box. |
| `base` | `bg-panel` | #1e1e2e | #eff1f5 | Panels, active tab, dialogs, popups, windows, DAG canvas, modifier hint, unfocused terminal. |
| `raised` | `surface-raised` | #313244 | #ccd0da | Menus, tooltips, toasts, banners, cards, keycaps, Tags, DAG nodes, code blocks. |
| `on-raised` | `surface-on-raised` | #45475a | #eff1f5 | A control fill on a raised shell (banner Secondary). |
| `field` | `surface-field` | #313244 | #eff1f5 | Fill of an enterable control: Input, Select, Checkbox box. |
| `solid-hover` | `surface-hover` | #45475a | #bcc0cc | Opaque step above raised. Read only by on-raised in Mocha. |
| `active` | `surface-active` | #585b70 | #acb0be | Selected and keyboard-active rows, special-role row in the modifier hint, neutral Badge. |
| `term` | `surface-terminal-focused-bg` | #000000 | #ffffff | Focused terminal. |
| `tab-hover` | `tab-bg-hover` | #1c1c2a | #ebeef3 | Pointer over an inactive tab. |

### Filled grounds

| ID | Token | Mocha | Latte |
|---|---|---|---|
| `fill-primary` | `accent-primary` | #89b4fa | #1e66f5 |
| `fill-agent` | `accent-agent` | #cba6f7 | #8839ef |
| `fill-danger` | `accent-danger` | #f38ba8 | #d20f39 |
| `fill-success` | `accent-success-fill` | #a6e3a1 | #307820 |
| `fill-warning` | `attention-needs-input-fill` | #f9e2af | #efc78e |
| `fill-close` | `accent-window-close` | #c42b1c | #c42b1c |

### Opaque tints and tracks

| ID | Token | Hue | Mocha | Latte |
|---|---|---|---|---|
| `tint-avatar` | `plugin-avatar-bg` | primary | #414965 | #adbddf |
| `dag-running` | `dag-status-running-bg` | primary | #3f4761 | #b0bfde |
| `dag-failed` | `dag-status-failed-bg` | danger | #483d50 | #cdb9c7 |
| `dag-unknown` | `dag-status-unknown-bg` | warning | #45444f | #cec9c7 |
| `dag-partial` | `dag-status-partially-failed-bg` | attention | #49414c | #d2c3c1 |
| `dag-awaiting` | `dag-phase-awaiting-bg` | warning | #494751 | #cec8c3 |
| `dag-stalled` | `dag-runner-stalled-bg` | warning | #45444f | #cec9c7 |
| `dag-crashed` | `dag-runner-crashed-bg` | danger | #483d50 | #cdb9c7 |
| `dag-cycle` | `dag-cycle-bg` | warning | #3d3940 | #ede3d7 |
| `approval` | `approval-danger-bg` | danger | #382b3d | #ecd6de |
| `track` | `border-control` | - | #6c7086 | #75788d |
| `track-raised` | `border-control-raised` | - | #7f849c | #63667c |
| `term-selection` | `selection-bg` | - | #585b70 | #acb0be |
| `term-cursor` | `vi-cursor-bg` | - | #b4befe | #7287fd |

### State grounds

Translucent layers are measured over each parent they can sit on. Each result is its own ground in the file.

| State | Ground | Notes |
|---|---|---|
| Rest | the parent | |
| Hover | `<parent>+hover` | `overlay-hover` over the parent. Inactive tab: `tab-hover`. |
| Press | `<parent>+press` | `overlay-active` over the parent. |
| Selected, keyboard-active | `active` | `surface-active`. |
| Selected and hover | `active+hover` | |
| Selected and press | `active+press` | |
| Focus | no change | Adds a ring on the parent ground. Focus never changes a ground or an ink. |
| Disabled | `raised` for a box, the parent for a row | Ink is `text-disabled`. Fill and hover drop out. This is for the label of a control that does nothing now. A reason, a progress word or a value in effect is read, so it takes `text-muted` and stays outside the disabled control. |
| Drag over | `drop-target@<parent>`, `file-drop@<parent>` | Primary tint over the parent. |
| Drag select | `marquee@<parent>` | |
| Preset split zone | `split-zone@<parent>` | |
| Tint box | `tint-<hue>@<parent>` | Parent is `mantle`, `base` or `raised`. |
| Unfocused terminal | `base` | Default ink `surface-terminal-unfocused-fg`. |
| Surface focus | no change | The host paints the surface focus edge above the surface, see [section 4](#4-location-map). Only the terminal also swaps its bed. |
| Dimmed item | the parent | `state-dim-opacity` over an item that is inert and comes back. No target, see section 12. An item the user still reads or selects is not dimmed: a pending cut reads `cut-pending-fg`, a disabled plugin row reads `text-muted`, a route not taken reads `dag-edge-dim`. |
| Under a scrim | `scrim@<parent>` | Inert. Every cell is forbidden. Only the modal frame sits on it. |

Composited values:

| Ground | Mocha | Latte |
|---|---|---|
| `crust+hover` | #24242d | #caced5 |
| `crust+press` | #2e2e36 | #c2c5cc |
| `mantle+hover` | #2a2a36 | #d4d6dc |
| `mantle+press` | #34343f | #cacdd2 |
| `base+hover` | #30303f | #dcdee1 |
| `base+press` | #393947 | #d2d4d8 |
| `raised+hover` | #414253 | #bcbfc9 |
| `raised+press` | #4a4b5a | #b4b7c0 |
| `on-raised+hover` | #545667 | #dcdee1 |
| `on-raised+press` | #5b5d6e | #d2d4d8 |
| `active+hover` | #65687b | #9ea2af |
| `active+press` | #6c6f81 | #979ba7 |
| `fill-primary+hover` | #92bafa | #1c5ee1 |
| `fill-primary+press` | #97bdfb | #1a5ad8 |
| `fill-agent+hover` | #cfadf8 | #7d34dc |
| `fill-agent+press` | #d1b1f8 | #7832d2 |
| `fill-danger+hover` | #f494af | #c10e34 |
| `fill-danger+press` | #f499b2 | #b90d32 |
| `drop-target@mantle` | #262b3f | #ced9f0 |
| `drop-target@base` | #2b3046 | #d6e0f5 |
| `drop-target@raised` | #3c425a | #b7c3dd |
| `file-drop@crust` | #1f2536 | #c5d1ea |
| `file-drop@mantle` | #262b3f | #ced9f0 |
| `file-drop@base` | #2b3046 | #d6e0f5 |
| `file-drop@term` | #10161e | #e4edfe |
| `marquee@mantle` | #262b3f | #ced9f0 |
| `marquee@base` | #2b3046 | #d6e0f5 |
| `split-zone@crust` | #2b354c | #b2c5eb |
| `split-zone@mantle` | #313a54 | #baccf0 |
| `split-zone@base` | #363f5b | #c1d2f5 |
| `match@term` | #4b4435 | #f5ddbb |
| `match@base` | #605955 | #ead3b4 |
| `match-active@term` | #ae9e7b | #efc78e |
| `match-active@base` | #b7a788 | #e7c089 |
| `scrim@crust` | #09090e | #6e7074 |
| `scrim@mantle` | #0c0c13 | #737578 |
| `scrim@base` | #0f0f17 | #78797b |
| `scrim@raised` | #191922 | #66686d |
| `scrim@active` | #2c2e38 | #56585f |
| `scrim@term` | #000000 | #808080 |

Tint boxes:

| Ground | Mocha | Latte |
|---|---|---|
| `tint-primary@mantle` | #262b3f | #ced9f0 |
| `tint-primary@base` | #2b3046 | #d6e0f5 |
| `tint-primary@raised` | #3c425a | #b7c3dd |
| `tint-info@mantle` | #26303d | #cbe1ee |
| `tint-info@base` | #2b3545 | #d3e8f3 |
| `tint-info@raised` | #3c4658 | #b4cbdb |
| `tint-success@mantle` | #293034 | #d2e0d7 |
| `tint-success@base` | #2e363c | #dae7dd |
| `tint-success@raised` | #3f474f | #bbcac5 |
| `tint-warning@mantle` | #333036 | #e5ded6 |
| `tint-warning@base` | #38363d | #ede5db |
| `tint-warning@raised` | #494751 | #cec8c3 |
| `tint-danger@mantle` | #322635 | #e4cfd9 |
| `tint-danger@base` | #382b3d | #ecd6de |
| `tint-danger@raised` | #483d50 | #cdb9c7 |
| `tint-agent@mantle` | #2d293e | #dbd4ef |
| `tint-agent@base` | #332e46 | #e3dbf4 |
| `tint-agent@raised` | #434059 | #c4bedd |

## 4. Location map

Each location has one ground. It may hold only the listed children, to the listed depth below its own ground. A child of a child must also be on the list. A nesting that is not on the map is forbidden. The gallery page `gallery/rules-map/index.jsx` draws this.

| Location | Ground | Depth | Children | Notes |
|---|---|---|---|---|
| Title bar | `crust` | 1 | `crust+hover`, `crust+press`, `fill-close`, `mantle` | Inactive window: mantle. |
| Collapsed rail | `mantle` | 2 | `mantle+hover`, `mantle+press`, `active`, `raised`, filled controls | Avatar fill, count Badge, mirror chip. |
| Sidebar | `mantle` | 2 | `crust`, `mantle+hover`, `mantle+press`, `active`, `active+hover`, `active+press`, `raised`, `field`, `track`, filled controls, tint boxes over `mantle` | Category band is crust. Selected workspace row is active. |
| Workspace status bar | `crust` | 1 | `crust+hover`, `crust+press` | Glyphs and text only. |
| Tab bar | `mantle` | 1 | `tab-hover`, `base`, `mantle+hover`, `mantle+press`, `raised` | Active tab is base. Scroll arrow cell is raised. |
| Pane body | `base` | 1 | `term`, `crust`, `mantle`, `raised` | Holds one surface. Every surface starts with the focus edge. |
| Surface head and split line | `mantle` | 2 | `field`, `mantle+hover`, `mantle+press`, `raised`, filled controls, tint boxes over `mantle` | Address bar band: mantle. Split lines take border-frame. |
| Terminal surface, focused | `term` | 1 | `term-selection`, `term-cursor`, `match@term`, `match-active@term`, `file-drop@term`, `raised` | Banner, toast and search bar float on raised. |
| Terminal surface, unfocused | `base` | 1 | `match@base`, `match-active@base`, `raised` | Default ink takes surface-terminal-unfocused-fg. |
| Markdown surface | `crust` | 2 | `base`, `mantle`, `raised`, `file-drop@crust` | Content typography is library-driven. Colors follow this table. One document bed in both focus states. |
| HTML surface | `mantle` | 2 | `field`, `raised` | The page is web content, outside these rules. Focus shows on the edge above the address band. |
| Image surface | `base` | 1 | `mantle`, `raised` |  |
| Empty surface | `crust` | 1 | `raised` | Nothing but the ground, under the focus edge. Banner and toast float on raised. |
| Explorer | `base` | 2 | `mantle`, `base+hover`, `base+press`, `mantle+hover`, `mantle+press`, `active`, `active+hover`, `active+press`, `raised`, `field`, `drop-target@base`, `drop-target@mantle`, `marquee@base`, `marquee@mantle`, `file-drop@base`, `file-drop@mantle`, `drop-target@raised`, `track`, `track-raised`, filled controls, tint boxes over `mantle` | Selected row is active. Drag chip is raised. |
| Modal dialog | `base` | 2 | `raised`, `field`, `mantle`, `crust`, `active`, `approval`, `base+hover`, `base+press`, `track`, `track-raised`, filled controls, tint boxes over `base`, `raised` | Sits on scrim. Depth counts from the dialog. |
| Scrim | `scrim@base` | 1 | `base` | Only a modal frame sits on it. |
| Popup | `base` | 2 | `raised`, `field`, `mantle`, `crust`, `active`, `base+hover`, `base+press`, `track`, `track-raised`, filled controls, tint boxes over `raised` | Port popup, file picker and DAG popup share this. |
| Menu | `raised` | 1 | `raised+hover`, `raised+press`, `active`, `active+hover`, `active+press`, `base` | Search field in the menu is base. |
| Tooltip | `raised` | 0 | none | Text only. |
| Toast | `raised` | 1 | `raised+hover`, `raised+press`, filled controls |  |
| Banner | `raised` | 1 | `on-raised`, `on-raised+hover`, `on-raised+press`, `raised+hover`, `raised+press`, `base`, `solid-hover`, `track-raised`, filled controls, tint boxes over `raised` | Field and Select on a banner step down to base. |
| Modifier hint | `base` | 1 | `mantle`, `active`, `raised`, filled controls | Header strip is mantle. Keycaps are raised. |
| Settings window | `base` | 2 | `mantle`, `mantle+hover`, `mantle+press`, `active`, `raised`, `field`, `base+hover`, `base+press`, `track`, `track-raised`, filled controls, tint boxes over `mantle`, `raised` | Left nav is mantle. |
| Listening ports popup | `base` | 2 | `mantle`, `base+hover`, `base+press`, `active`, `active+hover`, `active+press`, `raised`, `field`, filled controls |  |
| File picker | `base` | 2 | `mantle`, `base+hover`, `base+press`, `active`, `active+hover`, `active+press`, `raised`, `field`, filled controls |  |
| Remote connections | `base` | 2 | `mantle`, `base+hover`, `base+press`, `active`, `active+hover`, `active+press`, `raised`, `field`, filled controls, tint boxes over `base`, `raised` |  |
| Preset editor | `base` | 2 | `mantle`, `crust`, `raised`, `field`, `active`, `split-zone@crust`, `split-zone@mantle`, `split-zone@base`, `track`, filled controls |  |
| Task DAG | `base` | 2 | `raised`, `raised+hover`, `raised+press`, `mantle`, `crust`, `dag-running`, `dag-failed`, `dag-unknown`, `dag-partial`, `dag-awaiting`, `dag-stalled`, `dag-crashed`, `dag-cycle`, filled controls | Canvas is base. Chrome and detail are mantle. Log is crust. |
| Plugin surface chrome | `base` | 2 | `mantle`, `raised`, `field`, `active`, `active+hover`, `active+press`, `base+hover`, `base+press`, `tint-avatar`, `track`, filled controls, tint boxes over `raised` | What the host draws, the focus edge included. |
| Plugin UI through host widgets | `base` | 2 | `mantle`, `raised`, `field`, `active`, `base+hover`, `base+press`, `track`, filled controls, tint boxes over `raised` | Same as any panel. Widgets read by role. |
| Startup and boot error | `crust` | 1 | `base`, `raised` |  |
| Code area | `field` | 1 | `mantle` | Gutter is mantle. |
| Scrim over crust | `scrim@crust` | 1 | `base` | Only a modal or popup frame sits on it. |
| Scrim over mantle | `scrim@mantle` | 1 | `base` | Only a modal or popup frame sits on it. |
| Scrim over raised | `scrim@raised` | 1 | `base` | Only a modal or popup frame sits on it. |
| Scrim over active | `scrim@active` | 1 | `base` | Only a modal or popup frame sits on it. |
| Scrim over term | `scrim@term` | 1 | `base` | Only a modal or popup frame sits on it. |

Filled controls means the `fill-*` grounds with their hover and press states. The full lists are in the file.

### Surface focus

Every surface kind shows focus the same way, on the **surface focus edge**: a bar across the top of the leaf, above any head or address band. The host paints it from its own model focus. No plugin, manifest or page can change or hide it, and it needs nothing from them.

| Part | Focused | Unfocused | Lowest against a neighbor, Mocha · Latte |
|---|---|---|---|
| Edge | `surface-focus-edge-focused` | `surface-focus-edge-unfocused` | 7.10 · 4.05 on `raised` |
| Height | `surface-focus-edge-width` 2px | The same | Zoom-exempt |

| Kind | What changes with focus | What stays |
|---|---|---|
| `terminal` | Edge, bed, default ink | Cell content. Motion stays 0ms |
| `markdown` | Edge | Document bed, address band, table and code fills. All in the webview |
| `html` | Edge | Address band, banners, the page, webview chrome tiles |
| `image` | Edge | Panel, canvas, popups |
| `explorer` | Edge | Inner tab bar, toolbar, body, status line, preview panel |
| `empty` | Edge | Ground |
| `dag_graph` | Edge | Head, canvas |
| Plugin, webview | Edge | The plugin's page |
| Plugin, `egui-mesh` | Edge | The plugin's frame |

- **The row stays.** The edge holds its row on every leaf in both states. A webview starts below it. Focus never moves content or reflows a page.
- **Motion.** None on any kind. The color changes in one frame, as the terminal bed does.
- **Follows model focus.** An inactive OS window keeps its focused edge. With no focused surface, no edge is lit.
- **Paint order.** Unfocused edge, then ring (needs input, occupancy, completion), then lit edge. With a ring on the leaf, the lit edge takes only the lower row, `border-width` tall, and the ring keeps the upper row. Both stay visible, and the content does not move.
- **Ring against edge.** Where the host surface shows on all four sides, a ring has four sides and the edge one, so position tells them apart as well as color. A native webview sits above the host surface and covers the ring, so a webview leaf shows only the ring's top side, in the edge's own row. An inset on a pane's outer side can show a little more on macOS and Windows. On a webview leaf, then:
  - Focused: the ring's upper row over the lit lower row. They are told apart by row and by hue, ΔE 0.135 or more. Completion clears on focus, so it never meets the lit edge on one leaf.
  - Unfocused: the ring's top side fills as many rows as it is wide. Occupancy leaves the unfocused edge in the lower row, and a 2px ring covers it.
  - Between two leaves, a completed webview leaf and a focused one both show a bar on top, and hue tells them apart: ΔE 0.088 in Mocha, the closest pair in the group. It clears the 0.08 limit, with little to spare.
  - This reading comes from the stacking order, not from the app. It is unmeasured. Measure it when the edge is built, and send it back to design if a 1px row does not read.
- **Hard occupied.** A terminal keeps the unfocused bed and ink because it takes no input. The edge still follows focus.
- **Mirror.** The host that draws the leaf paints the edge from its own focus, so nothing depends on the plugin's frame.
- **Keyboard focus.** A field or control keeps its blue ring. The edge is never blue, so a focused field inside a focused surface shows both.
- **Only leaves in a pane.** A DAG in a workspace popup is not a surface and has no edge.

### Terminal content

Three layers, three answers:

| Layer | In the rules? | What holds |
|---|---|---|
| ANSI colors, reverse video, bold, cell backgrounds | No | The running program picks them. The `ansi-*` tokens are the palette. No pair is promised. |
| Default cell ink and the surface fill | Yes | `surface-terminal-focused-fg` on `term`, `surface-terminal-unfocused-fg` on `base`. |
| What the app draws over cells | Yes | Below. |

| Overlay | Ground | Ink | Mocha · Latte |
|---|---|---|---|
| Selection | `term-selection` | `text-on-active` | 4.62 · 5.40 |
| Vi cursor cell | `term-cursor` | `vi-cursor-fg` | 10.48 · 6.60 |
| Search match | `match@term` | `text-primary` | 6.67 · 6.06 |
| Active search match | `match-active@term` | `search-match-active-fg` | 6.23 · 5.03 |
| Search match, unfocused | `match@base` | `text-primary` | 4.75 · 5.50 |
| Active match, unfocused | `match-active@base` | `search-match-active-fg` | 6.95 · 4.68 |

The overlay ink applies to default cell ink. A cell with its own ANSI color keeps it inside a selection or match, and that pair is content. A terminal link takes an underline in the cell's own ink, so it needs no color. Terminal content never animates.

## 5. Roles and grades

| Role | Grade | What it is |
|---|---|---|
| `text-body` | 4.5 | Primary reading text, titles, values. |
| `text-secondary` | 4.5 | Labels and row text one step under body. |
| `text-muted` | 4.5 | Captions, meta, hints, counts. |
| `text-placeholder` | 4.5 | Hint in an empty control. Allowed only in a field. |
| `text-disabled` | none | Disabled label. No contrast target. Never on a fill. |
| `text-match` | 4.5 | The matched run in a list. Underlined on a selected row. |
| `text-primary` | 4.5 | Text whose hue says primary. |
| `text-info` | 4.5 | Text whose hue says info. |
| `text-success` | 4.5 | Text whose hue says success. |
| `text-warning` | 4.5 | Text whose hue says warning. |
| `text-attention` | 4.5 | Text whose hue says attention. |
| `text-danger` | 4.5 | Text whose hue says danger. |
| `text-agent` | 4.5 | Text whose hue says agent. |
| `text-remote` | 4.5 | Text whose hue says remote. |
| `text-attached` | 4.5 | Text whose hue says attached. |
| `glyph` | 3 | Icon or mark that does a job: chevron, close, kind icon. |
| `glyph-dim` | 3 | Orienting mark that recedes. |
| `glyph-decorative` | none | Ornament with no state meaning. |
| `glyph-primary` | 3 | Glyph, status dot, ring, bar or edge whose hue says primary. |
| `glyph-info` | 3 | Glyph, status dot, ring, bar or edge whose hue says info. |
| `glyph-success` | 3 | Glyph, status dot, ring, bar or edge whose hue says success. |
| `glyph-warning` | 3 | Glyph, status dot, ring, bar or edge whose hue says warning. |
| `glyph-attention` | 3 | Glyph, status dot, ring, bar or edge whose hue says attention. |
| `glyph-danger` | 3 | Glyph, status dot, ring, bar or edge whose hue says danger. |
| `glyph-agent` | 3 | Glyph, status dot, ring, bar or edge whose hue says agent. |
| `glyph-remote` | 3 | Glyph, status dot, ring, bar or edge whose hue says remote. |
| `glyph-attached` | 3 | Glyph, status dot, ring, bar or edge whose hue says attached. |
| `glyph-move` | 3 | Glyph, status dot, ring, bar or edge whose hue says move. |
| `glyph-data` | 3 | Glyph, status dot, ring, bar or edge whose hue says data. |
| `glyph-route` | 3 | Glyph, status dot, ring, bar or edge whose hue says route. |
| `dot-idle` | 3 | Idle status dot. |
| `border-control` | 3 | Edge that alone identifies an empty control. |
| `border-partition` | none | Outline of a card, popup or keycap. The fill and content identify it. |
| `border-frame` | none | Pane divider, popup frame. Closed list of four places. |
| `separator` | none | Hairline inside a surface. |
| `focus-ring` | 3 | Keyboard focus ring. |
| `selection-bar` | 3 | One-edge selection bar, tab indicator. |
| `scrollbar-thumb` | 3 | Scrollbar thumb at rest. |
| `progress-fill` | 3 | Determinate fill, spinner indicator. |

The role `text-primary` is text in the primary hue. It is not the token of the same name, which is what the role `text-body` reads.

A status dot, status bar, status edge and hue ring all read their `glyph-<hue>` role. The idle dot is `dot-idle`.

Grades:

- **4.5** for all text that stays on screen, placeholder included. A placeholder is the only hint of what goes in a field.
- **3** for anything non-text that carries meaning or state.
- **None** for disabled ink, ornaments and partitions. A partition is not the only thing that identifies its region: the fill and the content do that too.
- A control is identified by its edge only when nothing else does. A field, Select, Checkbox and Switch track can be empty, so they take `border-control`. A Button has a label, a Tag has a word, a Kbd has a key. They take `border-partition`.

## 6. Ground by role

Read as: this role, on these grounds, is this token. The lowest ratio is across those grounds, Mocha · Latte. Every ground × role cell is in the file, 88 × 39 = 3432. Forbidden cells list their reason here.

### `text-body`

| Token | Grounds | Lowest, Mocha · Latte |
|---|---|---|
| `text-primary` | `crust`, `mantle`, `base`, `raised`, `on-raised`, `field`, `term`, `tab-hover`, `dag-unknown`, `dag-partial`, `dag-awaiting`, `dag-stalled`, `dag-cycle`, `approval`, `crust+hover`, `crust+press`, `mantle+hover`, `mantle+press`, `base+hover`, `base+press`, `on-raised+hover`, `tint-primary@mantle`, `tint-primary@base`, `tint-primary@raised`, `tint-info@mantle`, `tint-info@base`, `tint-info@raised`, `tint-success@mantle`, `tint-success@base`, `tint-success@raised`, `tint-warning@mantle`, `tint-warning@base`, `tint-warning@raised`, `tint-danger@mantle`, `tint-danger@base`, `tint-agent@mantle`, `tint-agent@base`, `drop-target@mantle`, `drop-target@base`, `drop-target@raised`, `file-drop@crust`, `file-drop@mantle`, `file-drop@base`, `file-drop@term`, `marquee@mantle`, `marquee@base`, `split-zone@crust`, `split-zone@mantle`, `split-zone@base`, `match@term`, `match@base` | 4.75 · 4.51 |
| `text-on-active` | `solid-hover`, `active`, `tint-avatar`, `dag-running`, `dag-failed`, `dag-crashed`, `term-selection`, `raised+hover`, `raised+press`, `tint-danger@raised`, `tint-agent@raised` | 4.62 · 5.40 |
| `text-on-accent` | `fill-primary`, `fill-agent`, `fill-danger`, `fill-success`, `fill-primary+hover`, `fill-primary+press`, `fill-agent+hover`, `fill-agent+press`, `fill-danger+hover`, `fill-danger+press` | 8.10 · 4.91 |
| `notify-warning-fg` | `fill-warning` | 14.76 · 5.03 |
| `text-on-window-close` | `fill-close` | 5.66 · 5.66 |
| `vi-cursor-fg` | `term-cursor` | 10.48 · 6.60 |
| `text-on-active-hover` | `on-raised+press`, `active+hover`, `active+press` | 4.97 · 4.74 |
| `search-match-active-fg` | `match-active@term`, `match-active@base` | 6.23 · 4.68 |

Forbidden:

- `track`, `track-raised`. A track holds its thumb and nothing else.
- Every `scrim@*` ground. Inert layer. Content under a scrim has no target, and nothing new is drawn on it.

### `text-secondary`

| Token | Grounds | Lowest, Mocha · Latte |
|---|---|---|
| `text-secondary` | `crust`, `mantle`, `base`, `on-raised`, `field`, `term`, `tab-hover`, `dag-cycle`, `approval`, `tint-primary@base`, `tint-info@mantle`, `tint-info@base`, `tint-success@mantle`, `tint-success@base`, `tint-warning@mantle`, `tint-warning@base`, `tint-danger@base`, `tint-agent@base`, `drop-target@base`, `file-drop@base`, `file-drop@term`, `marquee@base` | 5.15 · 4.54 |
| `text-secondary-raised` | `raised`, `dag-unknown`, `dag-partial`, `dag-awaiting`, `dag-stalled`, `crust+hover`, `crust+press`, `mantle+hover`, `mantle+press`, `base+hover`, `base+press`, `tint-primary@mantle`, `tint-primary@raised`, `tint-info@raised`, `tint-success@raised`, `tint-warning@raised`, `tint-danger@mantle`, `tint-agent@mantle`, `drop-target@mantle`, `drop-target@raised`, `file-drop@crust`, `file-drop@mantle`, `marquee@mantle`, `split-zone@crust`, `split-zone@mantle`, `split-zone@base` | 5.15 · 4.51 |
| `text-on-active` | `solid-hover`, `active`, `tint-avatar`, `dag-running`, `dag-failed`, `dag-crashed`, `raised+hover`, `raised+press`, `tint-danger@raised`, `tint-agent@raised` | 4.62 · 5.40 |
| `text-on-accent` | `fill-primary`, `fill-agent`, `fill-danger`, `fill-success`, `fill-primary+hover`, `fill-primary+press`, `fill-agent+hover`, `fill-agent+press`, `fill-danger+hover`, `fill-danger+press` | 8.10 · 4.91 |
| `notify-warning-fg` | `fill-warning` | 14.76 · 5.03 |
| `text-on-window-close` | `fill-close` | 5.66 · 5.66 |
| `text-primary` | `on-raised+hover` | 5.00 · 5.92 |
| `text-on-active-hover` | `on-raised+press`, `active+hover`, `active+press` | 4.97 · 4.74 |

Forbidden:

- `track`, `track-raised`. A track holds its thumb and nothing else.
- `term-selection`, `term-cursor`. A terminal layer holds the cell ink only.
- `match@term`, `match@base`, `match-active@term`, `match-active@base`. Only the terminal cell ink sits in a search match.
- Every `scrim@*` ground. Inert layer. Content under a scrim has no target, and nothing new is drawn on it.

### `text-muted`

| Token | Grounds | Lowest, Mocha · Latte |
|---|---|---|
| `text-muted` | `crust`, `mantle`, `base`, `field`, `term`, `tab-hover`, `dag-cycle`, `approval`, `base+hover`, `tint-primary@base`, `tint-info@mantle`, `tint-info@base`, `tint-success@mantle`, `tint-success@base`, `tint-warning@mantle`, `tint-warning@base`, `tint-danger@base`, `tint-agent@base`, `drop-target@base`, `file-drop@base`, `file-drop@term`, `marquee@base` | 5.08 · 4.54 |
| `text-muted-raised` | `raised`, `crust+hover`, `crust+press`, `mantle+hover`, `mantle+press`, `base+press`, `tint-primary@mantle`, `tint-danger@mantle`, `tint-agent@mantle`, `drop-target@mantle`, `file-drop@crust`, `file-drop@mantle`, `marquee@mantle`, `split-zone@crust`, `split-zone@mantle`, `split-zone@base` | 4.67 · 4.59 |
| `text-secondary` | `on-raised` | 5.15 · 5.53 |
| `text-on-active` | `solid-hover`, `active`, `tint-avatar`, `dag-running`, `dag-failed`, `dag-crashed`, `raised+hover`, `raised+press`, `tint-danger@raised`, `tint-agent@raised` | 4.62 · 5.40 |
| `text-on-accent` | `fill-primary`, `fill-agent`, `fill-danger`, `fill-success`, `fill-primary+hover`, `fill-primary+press`, `fill-agent+hover`, `fill-agent+press`, `fill-danger+hover`, `fill-danger+press` | 8.10 · 4.91 |
| `notify-warning-fg` | `fill-warning` | 14.76 · 5.03 |
| `text-on-window-close` | `fill-close` | 5.66 · 5.66 |
| `text-primary` | `dag-unknown`, `dag-partial`, `dag-awaiting`, `dag-stalled`, `on-raised+hover`, `tint-primary@raised`, `tint-info@raised`, `tint-success@raised`, `tint-warning@raised`, `drop-target@raised` | 5.00 · 4.51 |
| `text-on-active-hover` | `on-raised+press`, `active+hover`, `active+press` | 4.97 · 4.74 |

Forbidden:

- `track`, `track-raised`. A track holds its thumb and nothing else.
- `term-selection`, `term-cursor`. A terminal layer holds the cell ink only.
- `match@term`, `match@base`, `match-active@term`, `match-active@base`. Only the terminal cell ink sits in a search match.
- Every `scrim@*` ground. Inert layer. Content under a scrim has no target, and nothing new is drawn on it.

### `text-placeholder`

| Token | Grounds | Lowest, Mocha · Latte |
|---|---|---|
| `text-placeholder` | `base`, `field` | 5.65 · 5.53 |

Forbidden:

- `crust`, `mantle`, `raised`, `on-raised`, `solid-hover`, `active`, `term`, `tab-hover`, `tint-avatar`, `dag-running`, `dag-failed`, `dag-unknown`, `dag-partial`, `dag-awaiting`, `dag-stalled`, `dag-crashed`, `dag-cycle`, `approval`, `crust+hover`, `crust+press`, `mantle+hover`, `mantle+press`, `base+hover`, `base+press`, `raised+hover`, `raised+press`, `on-raised+hover`, `on-raised+press`, `active+hover`, `active+press`, `tint-primary@mantle`, `tint-primary@base`, `tint-primary@raised`, `tint-info@mantle`, `tint-info@base`, `tint-info@raised`, `tint-success@mantle`, `tint-success@base`, `tint-success@raised`, `tint-warning@mantle`, `tint-warning@base`, `tint-warning@raised`, `tint-danger@mantle`, `tint-danger@base`, `tint-danger@raised`, `tint-agent@mantle`, `tint-agent@base`, `tint-agent@raised`, `drop-target@mantle`, `drop-target@base`, `drop-target@raised`, `file-drop@crust`, `file-drop@mantle`, `file-drop@base`, `file-drop@term`, `marquee@mantle`, `marquee@base`, `split-zone@crust`, `split-zone@mantle`, `split-zone@base`. A placeholder sits only in a field.
- `fill-primary`, `fill-agent`, `fill-danger`, `fill-success`, `fill-warning`, `fill-close`, `fill-primary+hover`, `fill-primary+press`, `fill-agent+hover`, `fill-agent+press`, `fill-danger+hover`, `fill-danger+press`. A filled control carries one ink pair. Hue or neutral steps on it would read as a second state.
- `track`, `track-raised`. A track holds its thumb and nothing else.
- `term-selection`, `term-cursor`. A terminal layer holds the cell ink only.
- `match@term`, `match@base`, `match-active@term`, `match-active@base`. Only the terminal cell ink sits in a search match.
- Every `scrim@*` ground. Inert layer. Content under a scrim has no target, and nothing new is drawn on it.

### `text-disabled`

| Token | Grounds | Lowest, Mocha · Latte |
|---|---|---|
| `text-disabled` | `crust`, `mantle`, `base`, `raised`, `on-raised`, `field`, `solid-hover`, `active`, `term`, `tab-hover` | no target |

Forbidden:

- `fill-primary`, `fill-agent`, `fill-danger`, `fill-success`, `fill-warning`, `fill-close`, `tint-avatar`, `dag-running`, `dag-failed`, `dag-unknown`, `dag-partial`, `dag-awaiting`, `dag-stalled`, `dag-crashed`, `dag-cycle`, `approval`, `fill-primary+hover`, `fill-primary+press`, `fill-agent+hover`, `fill-agent+press`, `fill-danger+hover`, `fill-danger+press`, `tint-primary@mantle`, `tint-primary@base`, `tint-primary@raised`, `tint-info@mantle`, `tint-info@base`, `tint-info@raised`, `tint-success@mantle`, `tint-success@base`, `tint-success@raised`, `tint-warning@mantle`, `tint-warning@base`, `tint-warning@raised`, `tint-danger@mantle`, `tint-danger@base`, `tint-danger@raised`, `tint-agent@mantle`, `tint-agent@base`, `tint-agent@raised`, `drop-target@mantle`, `drop-target@base`, `drop-target@raised`, `file-drop@crust`, `file-drop@mantle`, `file-drop@base`, `file-drop@term`, `marquee@mantle`, `marquee@base`, `split-zone@crust`, `split-zone@mantle`, `split-zone@base`. Disabled drops the fill first, then the ink. Disabled ink never sits on an accent or a tint.
- `track`, `track-raised`. A track holds its thumb and nothing else.
- `term-selection`, `term-cursor`. A terminal layer holds the cell ink only.
- `crust+hover`, `crust+press`, `mantle+hover`, `mantle+press`, `base+hover`, `base+press`, `raised+hover`, `raised+press`, `on-raised+hover`, `on-raised+press`, `active+hover`, `active+press`. A disabled item takes no hover or press.
- `match@term`, `match@base`, `match-active@term`, `match-active@base`. Only the terminal cell ink sits in a search match.
- Every `scrim@*` ground. Inert layer. Content under a scrim has no target, and nothing new is drawn on it.

### `text-match`

| Token | Grounds | Lowest, Mocha · Latte |
|---|---|---|
| `accent-primary-raised` | `crust`, `mantle`, `base`, `raised`, `field`, `term`, `tab-hover`, `dag-unknown`, `dag-partial`, `dag-stalled`, `dag-cycle`, `approval`, `crust+hover`, `crust+press`, `mantle+hover`, `mantle+press`, `base+hover`, `base+press`, `raised+hover`, `tint-primary@mantle`, `tint-primary@base`, `tint-primary@raised`, `tint-info@mantle`, `tint-info@base`, `tint-success@mantle`, `tint-success@base`, `tint-warning@mantle`, `tint-warning@base`, `tint-danger@mantle`, `tint-danger@base`, `tint-agent@mantle`, `tint-agent@base`, `tint-agent@raised`, `drop-target@mantle`, `drop-target@base`, `drop-target@raised`, `file-drop@crust`, `file-drop@mantle`, `file-drop@base`, `file-drop@term`, `marquee@mantle`, `marquee@base`, `split-zone@crust`, `split-zone@mantle`, `split-zone@base` | 4.55 · 4.52 |
| `accent-primary-strong` | `on-raised`, `solid-hover`, `tint-avatar`, `dag-running`, `dag-failed`, `dag-awaiting`, `dag-crashed`, `raised+press`, `tint-info@raised`, `tint-success@raised`, `tint-warning@raised`, `tint-danger@raised` | 4.60 · 4.54 |
| `text-on-active` + underline | `active` | 4.62 · 5.40 |
| `text-on-active-hover` + underline | `active+hover`, `active+press` | 4.97 · 4.74 |

Forbidden:

- `fill-primary`, `fill-agent`, `fill-danger`, `fill-success`, `fill-warning`, `fill-close`, `fill-primary+hover`, `fill-primary+press`, `fill-agent+hover`, `fill-agent+press`, `fill-danger+hover`, `fill-danger+press`. A filled control carries one ink pair. Hue or neutral steps on it would read as a second state.
- `track`, `track-raised`. A track holds its thumb and nothing else.
- `term-selection`, `term-cursor`. A terminal layer holds the cell ink only.
- `on-raised+hover`, `on-raised+press`. No token holds the grade here in both themes, and no component needs this pair.
- `match@term`, `match@base`, `match-active@term`, `match-active@base`. Only the terminal cell ink sits in a search match.
- Every `scrim@*` ground. Inert layer. Content under a scrim has no target, and nothing new is drawn on it.

### `text-primary`

| Token | Grounds | Lowest, Mocha · Latte |
|---|---|---|
| `accent-primary-raised` | `crust`, `mantle`, `base`, `raised`, `field`, `term`, `tab-hover`, `crust+hover`, `crust+press`, `mantle+hover`, `mantle+press`, `base+hover`, `base+press`, `raised+hover`, `tint-primary@mantle`, `tint-primary@base`, `tint-primary@raised`, `drop-target@mantle`, `drop-target@base`, `drop-target@raised`, `file-drop@crust`, `file-drop@mantle`, `file-drop@base`, `file-drop@term`, `marquee@mantle`, `marquee@base`, `split-zone@crust`, `split-zone@mantle`, `split-zone@base` | 4.68 · 4.52 |
| `accent-primary-strong` | `on-raised`, `solid-hover`, `tint-avatar`, `dag-running`, `raised+press` | 4.60 · 4.54 |

Forbidden:

- `active`, `active+hover`, `active+press`. No hue reaches 4.5:1 on this fill and still differs from the row ink. Use the row ink, with a hue glyph beside it.
- `fill-primary`, `fill-agent`, `fill-danger`, `fill-success`, `fill-warning`, `fill-close`, `fill-primary+hover`, `fill-primary+press`, `fill-agent+hover`, `fill-agent+press`, `fill-danger+hover`, `fill-danger+press`. A filled control carries one ink pair. Hue or neutral steps on it would read as a second state.
- `dag-failed`, `dag-unknown`, `dag-partial`, `dag-awaiting`, `dag-stalled`, `dag-crashed`, `dag-cycle`, `approval`, `tint-info@mantle`, `tint-info@base`, `tint-info@raised`, `tint-success@mantle`, `tint-success@base`, `tint-success@raised`, `tint-warning@mantle`, `tint-warning@base`, `tint-warning@raised`, `tint-danger@mantle`, `tint-danger@base`, `tint-danger@raised`, `tint-agent@mantle`, `tint-agent@base`, `tint-agent@raised`. A tint carries its own hue and neutrals. A second hue reads as a conflict.
- `track`, `track-raised`. A track holds its thumb and nothing else.
- `term-selection`, `term-cursor`. A terminal layer holds the cell ink only.
- `on-raised+hover`, `on-raised+press`. No token holds the grade here in both themes, and no component needs this pair.
- `match@term`, `match@base`, `match-active@term`, `match-active@base`. Only the terminal cell ink sits in a search match.
- Every `scrim@*` ground. Inert layer. Content under a scrim has no target, and nothing new is drawn on it.

### `text-info`

| Token | Grounds | Lowest, Mocha · Latte |
|---|---|---|
| `accent-info-raised` | `crust`, `mantle`, `base`, `raised`, `on-raised`, `field`, `term`, `tab-hover`, `crust+hover`, `mantle+hover`, `mantle+press`, `base+hover`, `base+press`, `on-raised+hover`, `tint-info@mantle`, `tint-info@base` | 4.65 · 4.70 |
| `accent-info-strong` | `solid-hover`, `crust+press`, `raised+hover`, `raised+press`, `tint-info@raised` | 5.52 · 4.81 |

Forbidden:

- `active`, `active+hover`, `active+press`. No hue reaches 4.5:1 on this fill and still differs from the row ink. Use the row ink, with a hue glyph beside it.
- `fill-primary`, `fill-agent`, `fill-danger`, `fill-success`, `fill-warning`, `fill-close`, `fill-primary+hover`, `fill-primary+press`, `fill-agent+hover`, `fill-agent+press`, `fill-danger+hover`, `fill-danger+press`. A filled control carries one ink pair. Hue or neutral steps on it would read as a second state.
- `tint-avatar`, `dag-running`, `dag-failed`, `dag-unknown`, `dag-partial`, `dag-awaiting`, `dag-stalled`, `dag-crashed`, `dag-cycle`, `approval`, `tint-primary@mantle`, `tint-primary@base`, `tint-primary@raised`, `tint-success@mantle`, `tint-success@base`, `tint-success@raised`, `tint-warning@mantle`, `tint-warning@base`, `tint-warning@raised`, `tint-danger@mantle`, `tint-danger@base`, `tint-danger@raised`, `tint-agent@mantle`, `tint-agent@base`, `tint-agent@raised`, `drop-target@mantle`, `drop-target@base`, `drop-target@raised`, `file-drop@crust`, `file-drop@mantle`, `file-drop@base`, `file-drop@term`, `marquee@mantle`, `marquee@base`, `split-zone@crust`, `split-zone@mantle`, `split-zone@base`. A tint carries its own hue and neutrals. A second hue reads as a conflict.
- `track`, `track-raised`. A track holds its thumb and nothing else.
- `term-selection`, `term-cursor`. A terminal layer holds the cell ink only.
- `on-raised+press`. No token holds the grade here in both themes, and no component needs this pair.
- `match@term`, `match@base`, `match-active@term`, `match-active@base`. Only the terminal cell ink sits in a search match.
- Every `scrim@*` ground. Inert layer. Content under a scrim has no target, and nothing new is drawn on it.

### `text-success`

| Token | Grounds | Lowest, Mocha · Latte |
|---|---|---|
| `accent-success-raised` | `crust`, `mantle`, `base`, `raised`, `on-raised`, `field`, `term`, `tab-hover`, `crust+hover`, `mantle+hover`, `mantle+press`, `base+hover`, `base+press`, `on-raised+hover`, `tint-success@mantle`, `tint-success@base` | 4.86 · 4.76 |
| `accent-success-strong` | `solid-hover`, `crust+press`, `raised+hover`, `raised+press`, `tint-success@raised` | 5.78 · 4.72 |

Forbidden:

- `active`, `active+hover`, `active+press`. No hue reaches 4.5:1 on this fill and still differs from the row ink. Use the row ink, with a hue glyph beside it.
- `fill-primary`, `fill-agent`, `fill-danger`, `fill-success`, `fill-warning`, `fill-close`, `fill-primary+hover`, `fill-primary+press`, `fill-agent+hover`, `fill-agent+press`, `fill-danger+hover`, `fill-danger+press`. A filled control carries one ink pair. Hue or neutral steps on it would read as a second state.
- `tint-avatar`, `dag-running`, `dag-failed`, `dag-unknown`, `dag-partial`, `dag-awaiting`, `dag-stalled`, `dag-crashed`, `dag-cycle`, `approval`, `tint-primary@mantle`, `tint-primary@base`, `tint-primary@raised`, `tint-info@mantle`, `tint-info@base`, `tint-info@raised`, `tint-warning@mantle`, `tint-warning@base`, `tint-warning@raised`, `tint-danger@mantle`, `tint-danger@base`, `tint-danger@raised`, `tint-agent@mantle`, `tint-agent@base`, `tint-agent@raised`, `drop-target@mantle`, `drop-target@base`, `drop-target@raised`, `file-drop@crust`, `file-drop@mantle`, `file-drop@base`, `file-drop@term`, `marquee@mantle`, `marquee@base`, `split-zone@crust`, `split-zone@mantle`, `split-zone@base`. A tint carries its own hue and neutrals. A second hue reads as a conflict.
- `track`, `track-raised`. A track holds its thumb and nothing else.
- `term-selection`, `term-cursor`. A terminal layer holds the cell ink only.
- `on-raised+press`. No token holds the grade here in both themes, and no component needs this pair.
- `match@term`, `match@base`, `match-active@term`, `match-active@base`. Only the terminal cell ink sits in a search match.
- Every `scrim@*` ground. Inert layer. Content under a scrim has no target, and nothing new is drawn on it.

### `text-warning`

| Token | Grounds | Lowest, Mocha · Latte |
|---|---|---|
| `accent-warning-raised` | `crust`, `mantle`, `base`, `raised`, `on-raised`, `field`, `term`, `tab-hover`, `dag-unknown`, `dag-awaiting`, `dag-stalled`, `dag-cycle`, `crust+hover`, `crust+press`, `mantle+hover`, `mantle+press`, `base+hover`, `base+press`, `on-raised+hover`, `on-raised+press`, `tint-warning@mantle`, `tint-warning@base`, `tint-warning@raised` | 5.11 · 4.68 |
| `accent-warning-strong` | `solid-hover`, `raised+hover`, `raised+press` | 6.76 · 4.59 |

Forbidden:

- `active`, `active+hover`, `active+press`. No hue reaches 4.5:1 on this fill and still differs from the row ink. Use the row ink, with a hue glyph beside it.
- `fill-primary`, `fill-agent`, `fill-danger`, `fill-success`, `fill-warning`, `fill-close`, `fill-primary+hover`, `fill-primary+press`, `fill-agent+hover`, `fill-agent+press`, `fill-danger+hover`, `fill-danger+press`. A filled control carries one ink pair. Hue or neutral steps on it would read as a second state.
- `tint-avatar`, `dag-running`, `dag-failed`, `dag-partial`, `dag-crashed`, `approval`, `tint-primary@mantle`, `tint-primary@base`, `tint-primary@raised`, `tint-info@mantle`, `tint-info@base`, `tint-info@raised`, `tint-success@mantle`, `tint-success@base`, `tint-success@raised`, `tint-danger@mantle`, `tint-danger@base`, `tint-danger@raised`, `tint-agent@mantle`, `tint-agent@base`, `tint-agent@raised`, `drop-target@mantle`, `drop-target@base`, `drop-target@raised`, `file-drop@crust`, `file-drop@mantle`, `file-drop@base`, `file-drop@term`, `marquee@mantle`, `marquee@base`, `split-zone@crust`, `split-zone@mantle`, `split-zone@base`. A tint carries its own hue and neutrals. A second hue reads as a conflict.
- `track`, `track-raised`. A track holds its thumb and nothing else.
- `term-selection`, `term-cursor`. A terminal layer holds the cell ink only.
- `match@term`, `match@base`, `match-active@term`, `match-active@base`. Only the terminal cell ink sits in a search match.
- Every `scrim@*` ground. Inert layer. Content under a scrim has no target, and nothing new is drawn on it.

### `text-attention`

| Token | Grounds | Lowest, Mocha · Latte |
|---|---|---|
| `accent-attention-raised` | `crust`, `mantle`, `base`, `raised`, `on-raised`, `field`, `term`, `tab-hover`, `dag-partial`, `crust+hover`, `crust+press`, `mantle+hover`, `mantle+press`, `base+hover`, `base+press` | 5.15 · 4.56 |
| `accent-attention-strong` | `solid-hover`, `raised+hover`, `raised+press` | 4.85 · 5.00 |

Forbidden:

- `active`, `active+hover`, `active+press`. No hue reaches 4.5:1 on this fill and still differs from the row ink. Use the row ink, with a hue glyph beside it.
- `fill-primary`, `fill-agent`, `fill-danger`, `fill-success`, `fill-warning`, `fill-close`, `fill-primary+hover`, `fill-primary+press`, `fill-agent+hover`, `fill-agent+press`, `fill-danger+hover`, `fill-danger+press`. A filled control carries one ink pair. Hue or neutral steps on it would read as a second state.
- `tint-avatar`, `dag-running`, `dag-failed`, `dag-unknown`, `dag-awaiting`, `dag-stalled`, `dag-crashed`, `dag-cycle`, `approval`, `tint-primary@mantle`, `tint-primary@base`, `tint-primary@raised`, `tint-info@mantle`, `tint-info@base`, `tint-info@raised`, `tint-success@mantle`, `tint-success@base`, `tint-success@raised`, `tint-warning@mantle`, `tint-warning@base`, `tint-warning@raised`, `tint-danger@mantle`, `tint-danger@base`, `tint-danger@raised`, `tint-agent@mantle`, `tint-agent@base`, `tint-agent@raised`, `drop-target@mantle`, `drop-target@base`, `drop-target@raised`, `file-drop@crust`, `file-drop@mantle`, `file-drop@base`, `file-drop@term`, `marquee@mantle`, `marquee@base`, `split-zone@crust`, `split-zone@mantle`, `split-zone@base`. A tint carries its own hue and neutrals. A second hue reads as a conflict.
- `track`, `track-raised`. A track holds its thumb and nothing else.
- `term-selection`, `term-cursor`. A terminal layer holds the cell ink only.
- `on-raised+hover`, `on-raised+press`. No token holds the grade here in both themes, and no component needs this pair.
- `match@term`, `match@base`, `match-active@term`, `match-active@base`. Only the terminal cell ink sits in a search match.
- Every `scrim@*` ground. Inert layer. Content under a scrim has no target, and nothing new is drawn on it.

### `text-danger`

| Token | Grounds | Lowest, Mocha · Latte |
|---|---|---|
| `accent-danger-raised` | `crust`, `mantle`, `base`, `raised`, `field`, `term`, `tab-hover`, `approval`, `crust+hover`, `mantle+hover`, `mantle+press`, `base+hover`, `base+press`, `tint-danger@mantle`, `tint-danger@base` | 4.90 · 4.65 |
| `accent-danger-strong` | `on-raised`, `solid-hover`, `dag-failed`, `dag-crashed`, `crust+press`, `raised+hover`, `raised+press`, `tint-danger@raised` | 4.61 · 4.52 |

Forbidden:

- `active`, `active+hover`, `active+press`. No hue reaches 4.5:1 on this fill and still differs from the row ink. Use the row ink, with a hue glyph beside it.
- `fill-primary`, `fill-agent`, `fill-danger`, `fill-success`, `fill-warning`, `fill-close`, `fill-primary+hover`, `fill-primary+press`, `fill-agent+hover`, `fill-agent+press`, `fill-danger+hover`, `fill-danger+press`. A filled control carries one ink pair. Hue or neutral steps on it would read as a second state.
- `tint-avatar`, `dag-running`, `dag-unknown`, `dag-partial`, `dag-awaiting`, `dag-stalled`, `dag-cycle`, `tint-primary@mantle`, `tint-primary@base`, `tint-primary@raised`, `tint-info@mantle`, `tint-info@base`, `tint-info@raised`, `tint-success@mantle`, `tint-success@base`, `tint-success@raised`, `tint-warning@mantle`, `tint-warning@base`, `tint-warning@raised`, `tint-agent@mantle`, `tint-agent@base`, `tint-agent@raised`, `drop-target@mantle`, `drop-target@base`, `drop-target@raised`, `file-drop@crust`, `file-drop@mantle`, `file-drop@base`, `file-drop@term`, `marquee@mantle`, `marquee@base`, `split-zone@crust`, `split-zone@mantle`, `split-zone@base`. A tint carries its own hue and neutrals. A second hue reads as a conflict.
- `track`, `track-raised`. A track holds its thumb and nothing else.
- `term-selection`, `term-cursor`. A terminal layer holds the cell ink only.
- `on-raised+hover`, `on-raised+press`. No token holds the grade here in both themes, and no component needs this pair.
- `match@term`, `match@base`, `match-active@term`, `match-active@base`. Only the terminal cell ink sits in a search match.
- Every `scrim@*` ground. Inert layer. Content under a scrim has no target, and nothing new is drawn on it.

### `text-agent`

| Token | Grounds | Lowest, Mocha · Latte |
|---|---|---|
| `accent-agent-raised` | `crust`, `mantle`, `base`, `raised`, `field`, `term`, `tab-hover`, `crust+hover`, `mantle+hover`, `mantle+press`, `base+hover`, `base+press`, `tint-agent@mantle`, `tint-agent@base` | 5.59 · 4.72 |
| `accent-agent-strong` | `on-raised`, `solid-hover`, `crust+press`, `raised+hover`, `raised+press`, `tint-agent@raised` | 4.57 · 4.87 |

Forbidden:

- `active`, `active+hover`, `active+press`. No hue reaches 4.5:1 on this fill and still differs from the row ink. Use the row ink, with a hue glyph beside it.
- `fill-primary`, `fill-agent`, `fill-danger`, `fill-success`, `fill-warning`, `fill-close`, `fill-primary+hover`, `fill-primary+press`, `fill-agent+hover`, `fill-agent+press`, `fill-danger+hover`, `fill-danger+press`. A filled control carries one ink pair. Hue or neutral steps on it would read as a second state.
- `tint-avatar`, `dag-running`, `dag-failed`, `dag-unknown`, `dag-partial`, `dag-awaiting`, `dag-stalled`, `dag-crashed`, `dag-cycle`, `approval`, `tint-primary@mantle`, `tint-primary@base`, `tint-primary@raised`, `tint-info@mantle`, `tint-info@base`, `tint-info@raised`, `tint-success@mantle`, `tint-success@base`, `tint-success@raised`, `tint-warning@mantle`, `tint-warning@base`, `tint-warning@raised`, `tint-danger@mantle`, `tint-danger@base`, `tint-danger@raised`, `drop-target@mantle`, `drop-target@base`, `drop-target@raised`, `file-drop@crust`, `file-drop@mantle`, `file-drop@base`, `file-drop@term`, `marquee@mantle`, `marquee@base`, `split-zone@crust`, `split-zone@mantle`, `split-zone@base`. A tint carries its own hue and neutrals. A second hue reads as a conflict.
- `track`, `track-raised`. A track holds its thumb and nothing else.
- `term-selection`, `term-cursor`. A terminal layer holds the cell ink only.
- `on-raised+hover`, `on-raised+press`. No token holds the grade here in both themes, and no component needs this pair.
- `match@term`, `match@base`, `match-active@term`, `match-active@base`. Only the terminal cell ink sits in a search match.
- Every `scrim@*` ground. Inert layer. Content under a scrim has no target, and nothing new is drawn on it.

### `text-remote`

| Token | Grounds | Lowest, Mocha · Latte |
|---|---|---|
| `accent-remote-raised` | `crust`, `mantle`, `base`, `raised`, `on-raised`, `field`, `term`, `tab-hover`, `crust+hover`, `mantle+hover`, `mantle+press`, `base+hover`, `base+press`, `on-raised+hover`, `tint-info@mantle`, `tint-info@base` | 4.65 · 4.70 |
| `accent-remote-strong` | `solid-hover`, `crust+press`, `raised+hover`, `raised+press`, `tint-info@raised` | 5.52 · 4.81 |

Forbidden:

- `active`, `active+hover`, `active+press`. No hue reaches 4.5:1 on this fill and still differs from the row ink. Use the row ink, with a hue glyph beside it.
- `fill-primary`, `fill-agent`, `fill-danger`, `fill-success`, `fill-warning`, `fill-close`, `fill-primary+hover`, `fill-primary+press`, `fill-agent+hover`, `fill-agent+press`, `fill-danger+hover`, `fill-danger+press`. A filled control carries one ink pair. Hue or neutral steps on it would read as a second state.
- `tint-avatar`, `dag-running`, `dag-failed`, `dag-unknown`, `dag-partial`, `dag-awaiting`, `dag-stalled`, `dag-crashed`, `dag-cycle`, `approval`, `tint-primary@mantle`, `tint-primary@base`, `tint-primary@raised`, `tint-success@mantle`, `tint-success@base`, `tint-success@raised`, `tint-warning@mantle`, `tint-warning@base`, `tint-warning@raised`, `tint-danger@mantle`, `tint-danger@base`, `tint-danger@raised`, `tint-agent@mantle`, `tint-agent@base`, `tint-agent@raised`, `drop-target@mantle`, `drop-target@base`, `drop-target@raised`, `file-drop@crust`, `file-drop@mantle`, `file-drop@base`, `file-drop@term`, `marquee@mantle`, `marquee@base`, `split-zone@crust`, `split-zone@mantle`, `split-zone@base`. A tint carries its own hue and neutrals. A second hue reads as a conflict.
- `track`, `track-raised`. A track holds its thumb and nothing else.
- `term-selection`, `term-cursor`. A terminal layer holds the cell ink only.
- `on-raised+press`. No token holds the grade here in both themes, and no component needs this pair.
- `match@term`, `match@base`, `match-active@term`, `match-active@base`. Only the terminal cell ink sits in a search match.
- Every `scrim@*` ground. Inert layer. Content under a scrim has no target, and nothing new is drawn on it.

### `text-attached`

| Token | Grounds | Lowest, Mocha · Latte |
|---|---|---|
| `accent-attached-raised` | `crust`, `mantle`, `base`, `raised`, `on-raised`, `field`, `solid-hover`, `term`, `tab-hover`, `crust+hover`, `crust+press`, `mantle+hover`, `mantle+press`, `base+hover`, `base+press` | 5.10 · 4.51 |
| `accent-attached-strong` | `raised+hover`, `raised+press` | 4.80 · 4.54 |

Forbidden:

- `active`, `active+hover`, `active+press`. No hue reaches 4.5:1 on this fill and still differs from the row ink. Use the row ink, with a hue glyph beside it.
- `fill-primary`, `fill-agent`, `fill-danger`, `fill-success`, `fill-warning`, `fill-close`, `fill-primary+hover`, `fill-primary+press`, `fill-agent+hover`, `fill-agent+press`, `fill-danger+hover`, `fill-danger+press`. A filled control carries one ink pair. Hue or neutral steps on it would read as a second state.
- `tint-avatar`, `dag-running`, `dag-failed`, `dag-unknown`, `dag-partial`, `dag-awaiting`, `dag-stalled`, `dag-crashed`, `dag-cycle`, `approval`, `tint-primary@mantle`, `tint-primary@base`, `tint-primary@raised`, `tint-info@mantle`, `tint-info@base`, `tint-info@raised`, `tint-success@mantle`, `tint-success@base`, `tint-success@raised`, `tint-warning@mantle`, `tint-warning@base`, `tint-warning@raised`, `tint-danger@mantle`, `tint-danger@base`, `tint-danger@raised`, `tint-agent@mantle`, `tint-agent@base`, `tint-agent@raised`, `drop-target@mantle`, `drop-target@base`, `drop-target@raised`, `file-drop@crust`, `file-drop@mantle`, `file-drop@base`, `file-drop@term`, `marquee@mantle`, `marquee@base`, `split-zone@crust`, `split-zone@mantle`, `split-zone@base`. A tint carries its own hue and neutrals. A second hue reads as a conflict.
- `track`, `track-raised`. A track holds its thumb and nothing else.
- `term-selection`, `term-cursor`. A terminal layer holds the cell ink only.
- `on-raised+hover`, `on-raised+press`. No token holds the grade here in both themes, and no component needs this pair.
- `match@term`, `match@base`, `match-active@term`, `match-active@base`. Only the terminal cell ink sits in a search match.
- Every `scrim@*` ground. Inert layer. Content under a scrim has no target, and nothing new is drawn on it.

### `glyph`

| Token | Grounds | Lowest, Mocha · Latte |
|---|---|---|
| `text-secondary` | `crust`, `mantle`, `base`, `raised`, `on-raised`, `field`, `solid-hover`, `term`, `tab-hover`, `tint-avatar`, `dag-running`, `dag-failed`, `dag-unknown`, `dag-partial`, `dag-awaiting`, `dag-stalled`, `dag-crashed`, `dag-cycle`, `approval`, `crust+hover`, `crust+press`, `mantle+hover`, `mantle+press`, `base+hover`, `base+press`, `raised+hover`, `raised+press`, `on-raised+hover`, `on-raised+press`, `tint-primary@mantle`, `tint-primary@base`, `tint-primary@raised`, `tint-info@mantle`, `tint-info@base`, `tint-info@raised`, `tint-success@mantle`, `tint-success@base`, `tint-success@raised`, `tint-warning@mantle`, `tint-warning@base`, `tint-warning@raised`, `tint-danger@mantle`, `tint-danger@base`, `tint-danger@raised`, `tint-agent@mantle`, `tint-agent@base`, `tint-agent@raised`, `drop-target@mantle`, `drop-target@base`, `drop-target@raised`, `file-drop@crust`, `file-drop@mantle`, `file-drop@base`, `file-drop@term`, `marquee@mantle`, `marquee@base`, `split-zone@crust`, `split-zone@mantle`, `split-zone@base` | 3.67 · 3.12 |
| `text-on-active` | `active`, `active+hover`, `active+press` | 3.43 · 4.21 |
| `text-on-accent` | `fill-primary`, `fill-agent`, `fill-danger`, `fill-success`, `fill-close`, `fill-primary+hover`, `fill-primary+press`, `fill-agent+hover`, `fill-agent+press`, `fill-danger+hover`, `fill-danger+press` | 3.31 · 4.91 |
| `notify-warning-fg` | `fill-warning` | 14.76 · 5.03 |
| `control-thumb` | `track` | 3.38 · 4.35 |
| `control-thumb-raised` | `track-raised` | 3.70 · 5.64 |

Forbidden:

- `term-selection`, `term-cursor`. A terminal layer holds the cell ink only.
- `match@term`, `match@base`, `match-active@term`, `match-active@base`. Only the terminal cell ink sits in a search match.
- Every `scrim@*` ground. Inert layer. Content under a scrim has no target, and nothing new is drawn on it.

### `glyph-dim`

| Token | Grounds | Lowest, Mocha · Latte |
|---|---|---|
| `glyph-dim` | `crust`, `mantle`, `base`, `term`, `tab-hover`, `crust+hover`, `file-drop@crust`, `file-drop@term` | 3.12 · 3.57 |
| `glyph-dim-raised` | `raised`, `field`, `dag-cycle`, `approval`, `crust+press`, `mantle+hover`, `mantle+press`, `base+hover`, `base+press`, `tint-primary@mantle`, `tint-primary@base`, `tint-info@mantle`, `tint-info@base`, `tint-success@mantle`, `tint-success@base`, `tint-warning@mantle`, `tint-warning@base`, `tint-danger@mantle`, `tint-danger@base`, `tint-agent@mantle`, `tint-agent@base`, `drop-target@mantle`, `drop-target@base`, `file-drop@mantle`, `file-drop@base`, `marquee@mantle`, `marquee@base`, `split-zone@crust`, `split-zone@mantle` | 3.05 · 3.25 |
| `text-muted-raised` | `on-raised`, `solid-hover`, `tint-avatar`, `dag-running`, `dag-failed`, `dag-unknown`, `dag-partial`, `dag-awaiting`, `dag-stalled`, `dag-crashed`, `raised+hover`, `raised+press`, `on-raised+hover`, `tint-primary@raised`, `tint-info@raised`, `tint-success@raised`, `tint-warning@raised`, `tint-danger@raised`, `tint-agent@raised`, `drop-target@raised`, `split-zone@base` | 3.25 · 3.98 |
| `text-on-active` | `active`, `on-raised+press`, `active+hover`, `active+press` | 3.43 · 4.21 |

Forbidden:

- `fill-primary`, `fill-agent`, `fill-danger`, `fill-success`, `fill-warning`, `fill-close`, `fill-primary+hover`, `fill-primary+press`, `fill-agent+hover`, `fill-agent+press`, `fill-danger+hover`, `fill-danger+press`. A filled control carries one ink pair. Hue or neutral steps on it would read as a second state.
- `track`, `track-raised`. A track holds its thumb and nothing else.
- `term-selection`, `term-cursor`. A terminal layer holds the cell ink only.
- `match@term`, `match@base`, `match-active@term`, `match-active@base`. Only the terminal cell ink sits in a search match.
- Every `scrim@*` ground. Inert layer. Content under a scrim has no target, and nothing new is drawn on it.

### `glyph-decorative`

| Token | Grounds | Lowest, Mocha · Latte |
|---|---|---|
| `accent-decorative` | `crust`, `mantle`, `base`, `raised`, `on-raised`, `field`, `solid-hover`, `term`, `tab-hover` | no target |

Forbidden:

- `active`, `tint-avatar`, `dag-running`, `dag-failed`, `dag-unknown`, `dag-partial`, `dag-awaiting`, `dag-stalled`, `dag-crashed`, `dag-cycle`, `approval`, `crust+hover`, `crust+press`, `mantle+hover`, `mantle+press`, `base+hover`, `base+press`, `raised+hover`, `raised+press`, `on-raised+hover`, `on-raised+press`, `active+hover`, `active+press`, `tint-primary@mantle`, `tint-primary@base`, `tint-primary@raised`, `tint-info@mantle`, `tint-info@base`, `tint-info@raised`, `tint-success@mantle`, `tint-success@base`, `tint-success@raised`, `tint-warning@mantle`, `tint-warning@base`, `tint-warning@raised`, `tint-danger@mantle`, `tint-danger@base`, `tint-danger@raised`, `tint-agent@mantle`, `tint-agent@base`, `tint-agent@raised`, `drop-target@mantle`, `drop-target@base`, `drop-target@raised`, `file-drop@crust`, `file-drop@mantle`, `file-drop@base`, `file-drop@term`, `marquee@mantle`, `marquee@base`, `split-zone@crust`, `split-zone@mantle`, `split-zone@base`. An ornament stays on a resting neutral ground.
- `fill-primary`, `fill-agent`, `fill-danger`, `fill-success`, `fill-warning`, `fill-close`, `fill-primary+hover`, `fill-primary+press`, `fill-agent+hover`, `fill-agent+press`, `fill-danger+hover`, `fill-danger+press`. A filled control carries one ink pair. Hue or neutral steps on it would read as a second state.
- `track`, `track-raised`. A track holds its thumb and nothing else.
- `term-selection`, `term-cursor`. A terminal layer holds the cell ink only.
- `match@term`, `match@base`, `match-active@term`, `match-active@base`. Only the terminal cell ink sits in a search match.
- Every `scrim@*` ground. Inert layer. Content under a scrim has no target, and nothing new is drawn on it.

### `glyph-primary`

| Token | Grounds | Lowest, Mocha · Latte |
|---|---|---|
| `accent-primary` | `crust`, `mantle`, `base`, `raised`, `on-raised`, `field`, `term`, `tab-hover`, `crust+hover`, `mantle+hover`, `mantle+press`, `base+hover`, `base+press`, `on-raised+hover`, `on-raised+press`, `tint-primary@mantle`, `tint-primary@base`, `drop-target@mantle`, `drop-target@base`, `file-drop@crust`, `file-drop@mantle`, `file-drop@base`, `file-drop@term`, `marquee@mantle`, `marquee@base`, `split-zone@mantle`, `split-zone@base` | 3.08 · 3.04 |
| `accent-primary-raised` | `solid-hover`, `tint-avatar`, `dag-running`, `crust+press`, `raised+hover`, `raised+press`, `tint-primary@raised`, `drop-target@raised`, `split-zone@crust` | 4.08 · 4.14 |
| `accent-primary-on-active` | `active`, `active+hover`, `active+press` | 3.10 · 3.27 |

Forbidden:

- `fill-primary`, `fill-agent`, `fill-danger`, `fill-success`, `fill-warning`, `fill-close`, `fill-primary+hover`, `fill-primary+press`, `fill-agent+hover`, `fill-agent+press`, `fill-danger+hover`, `fill-danger+press`. A filled control carries one ink pair. Hue or neutral steps on it would read as a second state.
- `dag-failed`, `dag-unknown`, `dag-partial`, `dag-awaiting`, `dag-stalled`, `dag-crashed`, `dag-cycle`, `approval`, `tint-info@mantle`, `tint-info@base`, `tint-info@raised`, `tint-success@mantle`, `tint-success@base`, `tint-success@raised`, `tint-warning@mantle`, `tint-warning@base`, `tint-warning@raised`, `tint-danger@mantle`, `tint-danger@base`, `tint-danger@raised`, `tint-agent@mantle`, `tint-agent@base`, `tint-agent@raised`. A tint carries its own hue and neutrals. A second hue reads as a conflict.
- `track`, `track-raised`. A track holds its thumb and nothing else.
- `term-selection`, `term-cursor`. A terminal layer holds the cell ink only.
- `match@term`, `match@base`, `match-active@term`, `match-active@base`. Only the terminal cell ink sits in a search match.
- Every `scrim@*` ground. Inert layer. Content under a scrim has no target, and nothing new is drawn on it.

### `glyph-info`

| Token | Grounds | Lowest, Mocha · Latte |
|---|---|---|
| `accent-info-raised` | `crust`, `mantle`, `base`, `raised`, `on-raised`, `field`, `solid-hover`, `term`, `tab-hover`, `crust+hover`, `crust+press`, `mantle+hover`, `mantle+press`, `base+hover`, `base+press`, `raised+hover`, `raised+press`, `on-raised+hover`, `on-raised+press`, `tint-info@mantle`, `tint-info@base`, `tint-info@raised` | 4.17 · 3.74 |
| `accent-info-on-active` | `active`, `active+hover`, `active+press` | 3.19 · 3.04 |

Forbidden:

- `fill-primary`, `fill-agent`, `fill-danger`, `fill-success`, `fill-warning`, `fill-close`, `fill-primary+hover`, `fill-primary+press`, `fill-agent+hover`, `fill-agent+press`, `fill-danger+hover`, `fill-danger+press`. A filled control carries one ink pair. Hue or neutral steps on it would read as a second state.
- `tint-avatar`, `dag-running`, `dag-failed`, `dag-unknown`, `dag-partial`, `dag-awaiting`, `dag-stalled`, `dag-crashed`, `dag-cycle`, `approval`, `tint-primary@mantle`, `tint-primary@base`, `tint-primary@raised`, `tint-success@mantle`, `tint-success@base`, `tint-success@raised`, `tint-warning@mantle`, `tint-warning@base`, `tint-warning@raised`, `tint-danger@mantle`, `tint-danger@base`, `tint-danger@raised`, `tint-agent@mantle`, `tint-agent@base`, `tint-agent@raised`, `drop-target@mantle`, `drop-target@base`, `drop-target@raised`, `file-drop@crust`, `file-drop@mantle`, `file-drop@base`, `file-drop@term`, `marquee@mantle`, `marquee@base`, `split-zone@crust`, `split-zone@mantle`, `split-zone@base`. A tint carries its own hue and neutrals. A second hue reads as a conflict.
- `track`, `track-raised`. A track holds its thumb and nothing else.
- `term-selection`, `term-cursor`. A terminal layer holds the cell ink only.
- `match@term`, `match@base`, `match-active@term`, `match-active@base`. Only the terminal cell ink sits in a search match.
- Every `scrim@*` ground. Inert layer. Content under a scrim has no target, and nothing new is drawn on it.

### `glyph-success`

| Token | Grounds | Lowest, Mocha · Latte |
|---|---|---|
| `accent-success-raised` | `crust`, `mantle`, `base`, `raised`, `on-raised`, `field`, `solid-hover`, `tab-hover`, `crust+hover`, `crust+press`, `mantle+hover`, `mantle+press`, `base+hover`, `base+press`, `raised+hover`, `raised+press`, `on-raised+hover`, `on-raised+press`, `tint-success@mantle`, `tint-success@base`, `tint-success@raised` | 4.36 · 3.78 |
| `accent-success-on-active` | `active`, `active+hover`, `active+press` | 3.34 · 3.05 |
| `accent-success` | `term` | 14.12 · 3.34 |

Forbidden:

- `fill-primary`, `fill-agent`, `fill-danger`, `fill-success`, `fill-warning`, `fill-close`, `fill-primary+hover`, `fill-primary+press`, `fill-agent+hover`, `fill-agent+press`, `fill-danger+hover`, `fill-danger+press`. A filled control carries one ink pair. Hue or neutral steps on it would read as a second state.
- `tint-avatar`, `dag-running`, `dag-failed`, `dag-unknown`, `dag-partial`, `dag-awaiting`, `dag-stalled`, `dag-crashed`, `dag-cycle`, `approval`, `tint-primary@mantle`, `tint-primary@base`, `tint-primary@raised`, `tint-info@mantle`, `tint-info@base`, `tint-info@raised`, `tint-warning@mantle`, `tint-warning@base`, `tint-warning@raised`, `tint-danger@mantle`, `tint-danger@base`, `tint-danger@raised`, `tint-agent@mantle`, `tint-agent@base`, `tint-agent@raised`, `drop-target@mantle`, `drop-target@base`, `drop-target@raised`, `file-drop@crust`, `file-drop@mantle`, `file-drop@base`, `file-drop@term`, `marquee@mantle`, `marquee@base`, `split-zone@crust`, `split-zone@mantle`, `split-zone@base`. A tint carries its own hue and neutrals. A second hue reads as a conflict.
- `track`, `track-raised`. A track holds its thumb and nothing else.
- `term-selection`, `term-cursor`. A terminal layer holds the cell ink only.
- `match@term`, `match@base`, `match-active@term`, `match-active@base`. Only the terminal cell ink sits in a search match.
- Every `scrim@*` ground. Inert layer. Content under a scrim has no target, and nothing new is drawn on it.

### `glyph-warning`

| Token | Grounds | Lowest, Mocha · Latte |
|---|---|---|
| `accent-warning-glyph` | `crust`, `mantle`, `base`, `on-raised`, `field`, `term`, `tab-hover`, `dag-cycle`, `mantle+hover`, `base+hover`, `base+press`, `on-raised+hover`, `on-raised+press`, `tint-warning@mantle`, `tint-warning@base` | 5.11 · 3.04 |
| `accent-warning-raised` | `raised`, `solid-hover`, `dag-unknown`, `dag-awaiting`, `dag-stalled`, `crust+hover`, `crust+press`, `mantle+press`, `raised+hover`, `raised+press`, `tint-warning@raised` | 6.76 · 4.03 |
| `accent-warning-on-active` | `active`, `active+hover`, `active+press` | 3.91 · 3.32 |

Forbidden:

- `fill-primary`, `fill-agent`, `fill-danger`, `fill-success`, `fill-warning`, `fill-close`, `fill-primary+hover`, `fill-primary+press`, `fill-agent+hover`, `fill-agent+press`, `fill-danger+hover`, `fill-danger+press`. A filled control carries one ink pair. Hue or neutral steps on it would read as a second state.
- `tint-avatar`, `dag-running`, `dag-failed`, `dag-partial`, `dag-crashed`, `approval`, `tint-primary@mantle`, `tint-primary@base`, `tint-primary@raised`, `tint-info@mantle`, `tint-info@base`, `tint-info@raised`, `tint-success@mantle`, `tint-success@base`, `tint-success@raised`, `tint-danger@mantle`, `tint-danger@base`, `tint-danger@raised`, `tint-agent@mantle`, `tint-agent@base`, `tint-agent@raised`, `drop-target@mantle`, `drop-target@base`, `drop-target@raised`, `file-drop@crust`, `file-drop@mantle`, `file-drop@base`, `file-drop@term`, `marquee@mantle`, `marquee@base`, `split-zone@crust`, `split-zone@mantle`, `split-zone@base`. A tint carries its own hue and neutrals. A second hue reads as a conflict.
- `track`, `track-raised`. A track holds its thumb and nothing else.
- `term-selection`, `term-cursor`. A terminal layer holds the cell ink only.
- `match@term`, `match@base`, `match-active@term`, `match-active@base`. Only the terminal cell ink sits in a search match.
- Every `scrim@*` ground. Inert layer. Content under a scrim has no target, and nothing new is drawn on it.

### `glyph-attention`

| Token | Grounds | Lowest, Mocha · Latte |
|---|---|---|
| `accent-attention-raised` | `crust`, `mantle`, `base`, `raised`, `on-raised`, `field`, `solid-hover`, `term`, `tab-hover`, `dag-partial`, `crust+hover`, `crust+press`, `mantle+hover`, `mantle+press`, `base+hover`, `base+press`, `raised+hover`, `raised+press`, `on-raised+hover`, `on-raised+press` | 3.67 · 3.93 |
| `accent-attention-on-active` | `active`, `active+hover`, `active+press` | 3.06 · 3.20 |

Forbidden:

- `fill-primary`, `fill-agent`, `fill-danger`, `fill-success`, `fill-warning`, `fill-close`, `fill-primary+hover`, `fill-primary+press`, `fill-agent+hover`, `fill-agent+press`, `fill-danger+hover`, `fill-danger+press`. A filled control carries one ink pair. Hue or neutral steps on it would read as a second state.
- `tint-avatar`, `dag-running`, `dag-failed`, `dag-unknown`, `dag-awaiting`, `dag-stalled`, `dag-crashed`, `dag-cycle`, `approval`, `tint-primary@mantle`, `tint-primary@base`, `tint-primary@raised`, `tint-info@mantle`, `tint-info@base`, `tint-info@raised`, `tint-success@mantle`, `tint-success@base`, `tint-success@raised`, `tint-warning@mantle`, `tint-warning@base`, `tint-warning@raised`, `tint-danger@mantle`, `tint-danger@base`, `tint-danger@raised`, `tint-agent@mantle`, `tint-agent@base`, `tint-agent@raised`, `drop-target@mantle`, `drop-target@base`, `drop-target@raised`, `file-drop@crust`, `file-drop@mantle`, `file-drop@base`, `file-drop@term`, `marquee@mantle`, `marquee@base`, `split-zone@crust`, `split-zone@mantle`, `split-zone@base`. A tint carries its own hue and neutrals. A second hue reads as a conflict.
- `track`, `track-raised`. A track holds its thumb and nothing else.
- `term-selection`, `term-cursor`. A terminal layer holds the cell ink only.
- `match@term`, `match@base`, `match-active@term`, `match-active@base`. Only the terminal cell ink sits in a search match.
- Every `scrim@*` ground. Inert layer. Content under a scrim has no target, and nothing new is drawn on it.

### `glyph-danger`

| Token | Grounds | Lowest, Mocha · Latte |
|---|---|---|
| `accent-danger` | `crust`, `mantle`, `base`, `raised`, `on-raised`, `field`, `term`, `tab-hover`, `approval`, `crust+hover`, `crust+press`, `mantle+hover`, `mantle+press`, `base+hover`, `base+press`, `on-raised+hover`, `tint-danger@mantle`, `tint-danger@base` | 3.12 · 3.14 |
| `accent-danger-raised` | `solid-hover`, `dag-failed`, `dag-crashed`, `raised+hover`, `raised+press`, `tint-danger@raised` | 3.71 · 3.69 |
| `accent-danger-on-active` | `active`, `active+hover`, `active+press` | 3.03 · 3.26 |
| `accent-danger-strong` | `on-raised+press` | 3.48 · 6.10 |

Forbidden:

- `fill-primary`, `fill-agent`, `fill-danger`, `fill-success`, `fill-warning`, `fill-close`, `fill-primary+hover`, `fill-primary+press`, `fill-agent+hover`, `fill-agent+press`, `fill-danger+hover`, `fill-danger+press`. A filled control carries one ink pair. Hue or neutral steps on it would read as a second state.
- `tint-avatar`, `dag-running`, `dag-unknown`, `dag-partial`, `dag-awaiting`, `dag-stalled`, `dag-cycle`, `tint-primary@mantle`, `tint-primary@base`, `tint-primary@raised`, `tint-info@mantle`, `tint-info@base`, `tint-info@raised`, `tint-success@mantle`, `tint-success@base`, `tint-success@raised`, `tint-warning@mantle`, `tint-warning@base`, `tint-warning@raised`, `tint-agent@mantle`, `tint-agent@base`, `tint-agent@raised`, `drop-target@mantle`, `drop-target@base`, `drop-target@raised`, `file-drop@crust`, `file-drop@mantle`, `file-drop@base`, `file-drop@term`, `marquee@mantle`, `marquee@base`, `split-zone@crust`, `split-zone@mantle`, `split-zone@base`. A tint carries its own hue and neutrals. A second hue reads as a conflict.
- `track`, `track-raised`. A track holds its thumb and nothing else.
- `term-selection`, `term-cursor`. A terminal layer holds the cell ink only.
- `match@term`, `match@base`, `match-active@term`, `match-active@base`. Only the terminal cell ink sits in a search match.
- Every `scrim@*` ground. Inert layer. Content under a scrim has no target, and nothing new is drawn on it.

### `glyph-agent`

| Token | Grounds | Lowest, Mocha · Latte |
|---|---|---|
| `accent-agent` | `crust`, `mantle`, `base`, `raised`, `on-raised`, `field`, `term`, `tab-hover`, `crust+hover`, `crust+press`, `mantle+hover`, `mantle+press`, `base+hover`, `base+press`, `on-raised+hover`, `on-raised+press`, `tint-agent@mantle`, `tint-agent@base`, `tint-agent@raised` | 3.19 · 3.03 |
| `accent-agent-raised` | `solid-hover`, `raised+hover`, `raised+press` | 4.23 · 3.75 |
| `accent-agent-on-active` | `active`, `active+hover`, `active+press` | 3.08 · 3.22 |

Forbidden:

- `fill-primary`, `fill-agent`, `fill-danger`, `fill-success`, `fill-warning`, `fill-close`, `fill-primary+hover`, `fill-primary+press`, `fill-agent+hover`, `fill-agent+press`, `fill-danger+hover`, `fill-danger+press`. A filled control carries one ink pair. Hue or neutral steps on it would read as a second state.
- `tint-avatar`, `dag-running`, `dag-failed`, `dag-unknown`, `dag-partial`, `dag-awaiting`, `dag-stalled`, `dag-crashed`, `dag-cycle`, `approval`, `tint-primary@mantle`, `tint-primary@base`, `tint-primary@raised`, `tint-info@mantle`, `tint-info@base`, `tint-info@raised`, `tint-success@mantle`, `tint-success@base`, `tint-success@raised`, `tint-warning@mantle`, `tint-warning@base`, `tint-warning@raised`, `tint-danger@mantle`, `tint-danger@base`, `tint-danger@raised`, `drop-target@mantle`, `drop-target@base`, `drop-target@raised`, `file-drop@crust`, `file-drop@mantle`, `file-drop@base`, `file-drop@term`, `marquee@mantle`, `marquee@base`, `split-zone@crust`, `split-zone@mantle`, `split-zone@base`. A tint carries its own hue and neutrals. A second hue reads as a conflict.
- `track`, `track-raised`. A track holds its thumb and nothing else.
- `term-selection`, `term-cursor`. A terminal layer holds the cell ink only.
- `match@term`, `match@base`, `match-active@term`, `match-active@base`. Only the terminal cell ink sits in a search match.
- Every `scrim@*` ground. Inert layer. Content under a scrim has no target, and nothing new is drawn on it.

### `glyph-remote`

| Token | Grounds | Lowest, Mocha · Latte |
|---|---|---|
| `accent-remote-raised` | `crust`, `mantle`, `base`, `raised`, `on-raised`, `field`, `solid-hover`, `term`, `tab-hover`, `crust+hover`, `crust+press`, `mantle+hover`, `mantle+press`, `base+hover`, `base+press`, `raised+hover`, `raised+press`, `on-raised+hover`, `on-raised+press`, `tint-info@mantle`, `tint-info@base`, `tint-info@raised` | 4.17 · 3.74 |
| `accent-remote-on-active` | `active`, `active+hover`, `active+press` | 3.19 · 3.04 |

Forbidden:

- `fill-primary`, `fill-agent`, `fill-danger`, `fill-success`, `fill-warning`, `fill-close`, `fill-primary+hover`, `fill-primary+press`, `fill-agent+hover`, `fill-agent+press`, `fill-danger+hover`, `fill-danger+press`. A filled control carries one ink pair. Hue or neutral steps on it would read as a second state.
- `tint-avatar`, `dag-running`, `dag-failed`, `dag-unknown`, `dag-partial`, `dag-awaiting`, `dag-stalled`, `dag-crashed`, `dag-cycle`, `approval`, `tint-primary@mantle`, `tint-primary@base`, `tint-primary@raised`, `tint-success@mantle`, `tint-success@base`, `tint-success@raised`, `tint-warning@mantle`, `tint-warning@base`, `tint-warning@raised`, `tint-danger@mantle`, `tint-danger@base`, `tint-danger@raised`, `tint-agent@mantle`, `tint-agent@base`, `tint-agent@raised`, `drop-target@mantle`, `drop-target@base`, `drop-target@raised`, `file-drop@crust`, `file-drop@mantle`, `file-drop@base`, `file-drop@term`, `marquee@mantle`, `marquee@base`, `split-zone@crust`, `split-zone@mantle`, `split-zone@base`. A tint carries its own hue and neutrals. A second hue reads as a conflict.
- `track`, `track-raised`. A track holds its thumb and nothing else.
- `term-selection`, `term-cursor`. A terminal layer holds the cell ink only.
- `match@term`, `match@base`, `match-active@term`, `match-active@base`. Only the terminal cell ink sits in a search match.
- Every `scrim@*` ground. Inert layer. Content under a scrim has no target, and nothing new is drawn on it.

### `glyph-attached`

| Token | Grounds | Lowest, Mocha · Latte |
|---|---|---|
| `accent-attached-raised` | `crust`, `mantle`, `base`, `raised`, `on-raised`, `field`, `solid-hover`, `tab-hover`, `crust+hover`, `crust+press`, `mantle+hover`, `mantle+press`, `base+hover`, `base+press`, `raised+hover`, `raised+press`, `on-raised+hover`, `on-raised+press` | 3.63 · 4.09 |
| `accent-attached-on-active` | `active`, `active+hover`, `active+press` | 3.05 · 3.28 |
| `accent-attached` | `term` | 11.74 · 3.18 |

Forbidden:

- `fill-primary`, `fill-agent`, `fill-danger`, `fill-success`, `fill-warning`, `fill-close`, `fill-primary+hover`, `fill-primary+press`, `fill-agent+hover`, `fill-agent+press`, `fill-danger+hover`, `fill-danger+press`. A filled control carries one ink pair. Hue or neutral steps on it would read as a second state.
- `tint-avatar`, `dag-running`, `dag-failed`, `dag-unknown`, `dag-partial`, `dag-awaiting`, `dag-stalled`, `dag-crashed`, `dag-cycle`, `approval`, `tint-primary@mantle`, `tint-primary@base`, `tint-primary@raised`, `tint-info@mantle`, `tint-info@base`, `tint-info@raised`, `tint-success@mantle`, `tint-success@base`, `tint-success@raised`, `tint-warning@mantle`, `tint-warning@base`, `tint-warning@raised`, `tint-danger@mantle`, `tint-danger@base`, `tint-danger@raised`, `tint-agent@mantle`, `tint-agent@base`, `tint-agent@raised`, `drop-target@mantle`, `drop-target@base`, `drop-target@raised`, `file-drop@crust`, `file-drop@mantle`, `file-drop@base`, `file-drop@term`, `marquee@mantle`, `marquee@base`, `split-zone@crust`, `split-zone@mantle`, `split-zone@base`. A tint carries its own hue and neutrals. A second hue reads as a conflict.
- `track`, `track-raised`. A track holds its thumb and nothing else.
- `term-selection`, `term-cursor`. A terminal layer holds the cell ink only.
- `match@term`, `match@base`, `match-active@term`, `match-active@base`. Only the terminal cell ink sits in a search match.
- Every `scrim@*` ground. Inert layer. Content under a scrim has no target, and nothing new is drawn on it.

### `glyph-move`

| Token | Grounds | Lowest, Mocha · Latte |
|---|---|---|
| `accent-move-raised` | `crust`, `mantle`, `base`, `raised`, `on-raised`, `field`, `solid-hover`, `term`, `tab-hover`, `crust+hover`, `crust+press`, `mantle+hover`, `mantle+press`, `base+hover`, `base+press`, `raised+hover`, `raised+press`, `on-raised+hover`, `on-raised+press` | 4.25 · 3.58 |
| `accent-move-on-active` | `active`, `active+hover`, `active+press` | 3.25 · 3.34 |

Forbidden:

- `fill-primary`, `fill-agent`, `fill-danger`, `fill-success`, `fill-warning`, `fill-close`, `fill-primary+hover`, `fill-primary+press`, `fill-agent+hover`, `fill-agent+press`, `fill-danger+hover`, `fill-danger+press`. A filled control carries one ink pair. Hue or neutral steps on it would read as a second state.
- `tint-avatar`, `dag-running`, `dag-failed`, `dag-unknown`, `dag-partial`, `dag-awaiting`, `dag-stalled`, `dag-crashed`, `dag-cycle`, `approval`, `tint-primary@mantle`, `tint-primary@base`, `tint-primary@raised`, `tint-info@mantle`, `tint-info@base`, `tint-info@raised`, `tint-success@mantle`, `tint-success@base`, `tint-success@raised`, `tint-warning@mantle`, `tint-warning@base`, `tint-warning@raised`, `tint-danger@mantle`, `tint-danger@base`, `tint-danger@raised`, `tint-agent@mantle`, `tint-agent@base`, `tint-agent@raised`, `drop-target@mantle`, `drop-target@base`, `drop-target@raised`, `file-drop@crust`, `file-drop@mantle`, `file-drop@base`, `file-drop@term`, `marquee@mantle`, `marquee@base`, `split-zone@crust`, `split-zone@mantle`, `split-zone@base`. A tint carries its own hue and neutrals. A second hue reads as a conflict.
- `track`, `track-raised`. A track holds its thumb and nothing else.
- `term-selection`, `term-cursor`. A terminal layer holds the cell ink only.
- `match@term`, `match@base`, `match-active@term`, `match-active@base`. Only the terminal cell ink sits in a search match.
- Every `scrim@*` ground. Inert layer. Content under a scrim has no target, and nothing new is drawn on it.

### `glyph-data`

| Token | Grounds | Lowest, Mocha · Latte |
|---|---|---|
| `accent-data` | `base` | 11.01 · 3.31 |

Forbidden:

- `crust`, `mantle`, `raised`, `on-raised`, `field`, `solid-hover`, `active`, `term`, `tab-hover`, `crust+hover`, `crust+press`, `mantle+hover`, `mantle+press`, `base+hover`, `base+press`, `raised+hover`, `raised+press`, `on-raised+hover`, `on-raised+press`, `active+hover`, `active+press`. A data edge lives on the DAG canvas only.
- `fill-primary`, `fill-agent`, `fill-danger`, `fill-success`, `fill-warning`, `fill-close`, `fill-primary+hover`, `fill-primary+press`, `fill-agent+hover`, `fill-agent+press`, `fill-danger+hover`, `fill-danger+press`. A filled control carries one ink pair. Hue or neutral steps on it would read as a second state.
- `tint-avatar`, `dag-running`, `dag-failed`, `dag-unknown`, `dag-partial`, `dag-awaiting`, `dag-stalled`, `dag-crashed`, `dag-cycle`, `approval`, `tint-primary@mantle`, `tint-primary@base`, `tint-primary@raised`, `tint-info@mantle`, `tint-info@base`, `tint-info@raised`, `tint-success@mantle`, `tint-success@base`, `tint-success@raised`, `tint-warning@mantle`, `tint-warning@base`, `tint-warning@raised`, `tint-danger@mantle`, `tint-danger@base`, `tint-danger@raised`, `tint-agent@mantle`, `tint-agent@base`, `tint-agent@raised`, `drop-target@mantle`, `drop-target@base`, `drop-target@raised`, `file-drop@crust`, `file-drop@mantle`, `file-drop@base`, `file-drop@term`, `marquee@mantle`, `marquee@base`, `split-zone@crust`, `split-zone@mantle`, `split-zone@base`. A tint carries its own hue and neutrals. A second hue reads as a conflict.
- `track`, `track-raised`. A track holds its thumb and nothing else.
- `term-selection`, `term-cursor`. A terminal layer holds the cell ink only.
- `match@term`, `match@base`, `match-active@term`, `match-active@base`. Only the terminal cell ink sits in a search match.
- Every `scrim@*` ground. Inert layer. Content under a scrim has no target, and nothing new is drawn on it.

### `glyph-route`

| Token | Grounds | Lowest, Mocha · Latte |
|---|---|---|
| `accent-route-raised` | `crust`, `mantle`, `base`, `raised`, `on-raised`, `field`, `solid-hover`, `tab-hover`, `crust+hover`, `crust+press`, `mantle+hover`, `mantle+press`, `base+hover`, `base+press`, `raised+hover`, `raised+press`, `on-raised+hover`, `on-raised+press` | 3.63 · 4.09 |
| `accent-route-on-active` | `active`, `active+hover`, `active+press` | 3.05 · 3.28 |
| `accent-route` | `term` | 11.74 · 3.18 |

Forbidden:

- `fill-primary`, `fill-agent`, `fill-danger`, `fill-success`, `fill-warning`, `fill-close`, `fill-primary+hover`, `fill-primary+press`, `fill-agent+hover`, `fill-agent+press`, `fill-danger+hover`, `fill-danger+press`. A filled control carries one ink pair. Hue or neutral steps on it would read as a second state.
- `tint-avatar`, `dag-running`, `dag-failed`, `dag-unknown`, `dag-partial`, `dag-awaiting`, `dag-stalled`, `dag-crashed`, `dag-cycle`, `approval`, `tint-primary@mantle`, `tint-primary@base`, `tint-primary@raised`, `tint-info@mantle`, `tint-info@base`, `tint-info@raised`, `tint-success@mantle`, `tint-success@base`, `tint-success@raised`, `tint-warning@mantle`, `tint-warning@base`, `tint-warning@raised`, `tint-danger@mantle`, `tint-danger@base`, `tint-danger@raised`, `tint-agent@mantle`, `tint-agent@base`, `tint-agent@raised`, `drop-target@mantle`, `drop-target@base`, `drop-target@raised`, `file-drop@crust`, `file-drop@mantle`, `file-drop@base`, `file-drop@term`, `marquee@mantle`, `marquee@base`, `split-zone@crust`, `split-zone@mantle`, `split-zone@base`. A tint carries its own hue and neutrals. A second hue reads as a conflict.
- `track`, `track-raised`. A track holds its thumb and nothing else.
- `term-selection`, `term-cursor`. A terminal layer holds the cell ink only.
- `match@term`, `match@base`, `match-active@term`, `match-active@base`. Only the terminal cell ink sits in a search match.
- Every `scrim@*` ground. Inert layer. Content under a scrim has no target, and nothing new is drawn on it.

### `dot-idle`

| Token | Grounds | Lowest, Mocha · Latte |
|---|---|---|
| `status-idle` | `crust`, `mantle`, `base`, `term`, `tab-hover`, `crust+hover`, `file-drop@crust`, `file-drop@term` | 3.12 · 3.57 |
| `glyph-dim-raised` | `raised`, `field`, `dag-cycle`, `approval`, `crust+press`, `mantle+hover`, `mantle+press`, `base+hover`, `base+press`, `tint-primary@mantle`, `tint-primary@base`, `tint-info@mantle`, `tint-info@base`, `tint-success@mantle`, `tint-success@base`, `tint-warning@mantle`, `tint-warning@base`, `tint-danger@mantle`, `tint-danger@base`, `tint-agent@mantle`, `tint-agent@base`, `drop-target@mantle`, `drop-target@base`, `file-drop@mantle`, `file-drop@base`, `marquee@mantle`, `marquee@base`, `split-zone@crust`, `split-zone@mantle` | 3.05 · 3.25 |
| `text-muted-raised` | `on-raised`, `solid-hover`, `tint-avatar`, `dag-running`, `dag-failed`, `dag-unknown`, `dag-partial`, `dag-awaiting`, `dag-stalled`, `dag-crashed`, `raised+hover`, `raised+press`, `on-raised+hover`, `tint-primary@raised`, `tint-info@raised`, `tint-success@raised`, `tint-warning@raised`, `tint-danger@raised`, `tint-agent@raised`, `drop-target@raised`, `split-zone@base` | 3.25 · 3.98 |
| `text-on-active` | `active`, `on-raised+press`, `active+hover`, `active+press` | 3.43 · 4.21 |

Forbidden:

- `fill-primary`, `fill-agent`, `fill-danger`, `fill-success`, `fill-warning`, `fill-close`, `fill-primary+hover`, `fill-primary+press`, `fill-agent+hover`, `fill-agent+press`, `fill-danger+hover`, `fill-danger+press`. A filled control carries one ink pair. Hue or neutral steps on it would read as a second state.
- `track`, `track-raised`. A track holds its thumb and nothing else.
- `term-selection`, `term-cursor`. A terminal layer holds the cell ink only.
- `match@term`, `match@base`, `match-active@term`, `match-active@base`. Only the terminal cell ink sits in a search match.
- Every `scrim@*` ground. Inert layer. Content under a scrim has no target, and nothing new is drawn on it.

### `border-control`

| Token | Grounds | Lowest, Mocha · Latte |
|---|---|---|
| `border-control` | `crust`, `mantle`, `base`, `term`, `tab-hover` | 3.36 · 3.29 |
| `border-control-raised` | `raised`, `field`, `crust+hover`, `crust+press`, `mantle+hover`, `mantle+press`, `base+hover`, `base+press` | 3.07 · 3.26 |
| `text-muted-raised` | `on-raised`, `solid-hover`, `raised+hover`, `raised+press`, `on-raised+hover` | 3.25 · 3.98 |
| `text-on-active` | `active`, `on-raised+press`, `active+hover`, `active+press` | 3.43 · 4.21 |

Forbidden:

- `fill-primary`, `fill-agent`, `fill-danger`, `fill-success`, `fill-warning`, `fill-close`, `fill-primary+hover`, `fill-primary+press`, `fill-agent+hover`, `fill-agent+press`, `fill-danger+hover`, `fill-danger+press`. A filled control carries one ink pair. Hue or neutral steps on it would read as a second state.
- `tint-avatar`, `dag-running`, `dag-failed`, `dag-unknown`, `dag-partial`, `dag-awaiting`, `dag-stalled`, `dag-crashed`, `dag-cycle`, `approval`, `tint-primary@mantle`, `tint-primary@base`, `tint-primary@raised`, `tint-info@mantle`, `tint-info@base`, `tint-info@raised`, `tint-success@mantle`, `tint-success@base`, `tint-success@raised`, `tint-warning@mantle`, `tint-warning@base`, `tint-warning@raised`, `tint-danger@mantle`, `tint-danger@base`, `tint-danger@raised`, `tint-agent@mantle`, `tint-agent@base`, `tint-agent@raised`, `drop-target@mantle`, `drop-target@base`, `drop-target@raised`, `file-drop@crust`, `file-drop@mantle`, `file-drop@base`, `file-drop@term`, `marquee@mantle`, `marquee@base`, `split-zone@crust`, `split-zone@mantle`, `split-zone@base`. Controls do not sit on a tint. Put them on a neutral ground beside it.
- `track`, `track-raised`. A track holds its thumb and nothing else.
- `term-selection`, `term-cursor`. A terminal layer holds the cell ink only.
- `match@term`, `match@base`, `match-active@term`, `match-active@base`. Only the terminal cell ink sits in a search match.
- Every `scrim@*` ground. Inert layer. Content under a scrim has no target, and nothing new is drawn on it.

### `border-partition`

| Token | Grounds | Lowest, Mocha · Latte |
|---|---|---|
| `border-default` | `crust`, `mantle`, `base`, `field`, `term`, `tab-hover`, `crust+hover`, `crust+press`, `mantle+hover`, `mantle+press`, `base+hover`, `base+press` | no target |
| `border-strong` | `raised`, `raised+hover`, `raised+press` | no target |
| `border-frame` | `on-raised`, `solid-hover`, `active`, `on-raised+hover`, `on-raised+press`, `active+hover`, `active+press` | no target |

Forbidden:

- `fill-primary`, `fill-agent`, `fill-danger`, `fill-success`, `fill-warning`, `fill-close`, `fill-primary+hover`, `fill-primary+press`, `fill-agent+hover`, `fill-agent+press`, `fill-danger+hover`, `fill-danger+press`. A filled control carries one ink pair. Hue or neutral steps on it would read as a second state.
- `tint-avatar`, `dag-running`, `dag-failed`, `dag-unknown`, `dag-partial`, `dag-awaiting`, `dag-stalled`, `dag-crashed`, `dag-cycle`, `approval`, `tint-primary@mantle`, `tint-primary@base`, `tint-primary@raised`, `tint-info@mantle`, `tint-info@base`, `tint-info@raised`, `tint-success@mantle`, `tint-success@base`, `tint-success@raised`, `tint-warning@mantle`, `tint-warning@base`, `tint-warning@raised`, `tint-danger@mantle`, `tint-danger@base`, `tint-danger@raised`, `tint-agent@mantle`, `tint-agent@base`, `tint-agent@raised`, `drop-target@mantle`, `drop-target@base`, `drop-target@raised`, `file-drop@crust`, `file-drop@mantle`, `file-drop@base`, `file-drop@term`, `marquee@mantle`, `marquee@base`, `split-zone@crust`, `split-zone@mantle`, `split-zone@base`. Controls do not sit on a tint. Put them on a neutral ground beside it.
- `track`, `track-raised`. A track holds its thumb and nothing else.
- `term-selection`, `term-cursor`. A terminal layer holds the cell ink only.
- `match@term`, `match@base`, `match-active@term`, `match-active@base`. Only the terminal cell ink sits in a search match.
- Every `scrim@*` ground. Inert layer. Content under a scrim has no target, and nothing new is drawn on it.

### `border-frame`

| Token | Grounds | Lowest, Mocha · Latte |
|---|---|---|
| `border-frame` | `crust`, `mantle`, `base`, `raised`, `on-raised`, `field`, `solid-hover`, `active`, `term`, `tab-hover` | no target |

Forbidden:

- `fill-primary`, `fill-agent`, `fill-danger`, `fill-success`, `fill-warning`, `fill-close`, `fill-primary+hover`, `fill-primary+press`, `fill-agent+hover`, `fill-agent+press`, `fill-danger+hover`, `fill-danger+press`. A filled control carries one ink pair. Hue or neutral steps on it would read as a second state.
- `tint-avatar`, `dag-running`, `dag-failed`, `dag-unknown`, `dag-partial`, `dag-awaiting`, `dag-stalled`, `dag-crashed`, `dag-cycle`, `approval`, `tint-primary@mantle`, `tint-primary@base`, `tint-primary@raised`, `tint-info@mantle`, `tint-info@base`, `tint-info@raised`, `tint-success@mantle`, `tint-success@base`, `tint-success@raised`, `tint-warning@mantle`, `tint-warning@base`, `tint-warning@raised`, `tint-danger@mantle`, `tint-danger@base`, `tint-danger@raised`, `tint-agent@mantle`, `tint-agent@base`, `tint-agent@raised`, `drop-target@mantle`, `drop-target@base`, `drop-target@raised`, `file-drop@crust`, `file-drop@mantle`, `file-drop@base`, `file-drop@term`, `marquee@mantle`, `marquee@base`, `split-zone@crust`, `split-zone@mantle`, `split-zone@base`. Controls do not sit on a tint. Put them on a neutral ground beside it.
- `track`, `track-raised`. A track holds its thumb and nothing else.
- `term-selection`, `term-cursor`. A terminal layer holds the cell ink only.
- `crust+hover`, `crust+press`, `mantle+hover`, `mantle+press`, `base+hover`, `base+press`, `raised+hover`, `raised+press`, `on-raised+hover`, `on-raised+press`, `active+hover`, `active+press`. A frame edge is drawn between resting neutral grounds only.
- `match@term`, `match@base`, `match-active@term`, `match-active@base`. Only the terminal cell ink sits in a search match.
- Every `scrim@*` ground. Inert layer. Content under a scrim has no target, and nothing new is drawn on it.

### `separator`

| Token | Grounds | Lowest, Mocha · Latte |
|---|---|---|
| `separator` | `crust`, `mantle`, `base`, `on-raised`, `field`, `solid-hover`, `active`, `term`, `tab-hover`, `crust+hover`, `crust+press`, `mantle+hover`, `mantle+press`, `base+hover`, `base+press`, `on-raised+hover`, `on-raised+press`, `active+hover`, `active+press` | no target |
| `border-strong` | `raised`, `raised+hover`, `raised+press` | no target |

Forbidden:

- `fill-primary`, `fill-agent`, `fill-danger`, `fill-success`, `fill-warning`, `fill-close`, `fill-primary+hover`, `fill-primary+press`, `fill-agent+hover`, `fill-agent+press`, `fill-danger+hover`, `fill-danger+press`. A filled control carries one ink pair. Hue or neutral steps on it would read as a second state.
- `tint-avatar`, `dag-running`, `dag-failed`, `dag-unknown`, `dag-partial`, `dag-awaiting`, `dag-stalled`, `dag-crashed`, `dag-cycle`, `approval`, `tint-primary@mantle`, `tint-primary@base`, `tint-primary@raised`, `tint-info@mantle`, `tint-info@base`, `tint-info@raised`, `tint-success@mantle`, `tint-success@base`, `tint-success@raised`, `tint-warning@mantle`, `tint-warning@base`, `tint-warning@raised`, `tint-danger@mantle`, `tint-danger@base`, `tint-danger@raised`, `tint-agent@mantle`, `tint-agent@base`, `tint-agent@raised`, `drop-target@mantle`, `drop-target@base`, `drop-target@raised`, `file-drop@crust`, `file-drop@mantle`, `file-drop@base`, `file-drop@term`, `marquee@mantle`, `marquee@base`, `split-zone@crust`, `split-zone@mantle`, `split-zone@base`. Controls do not sit on a tint. Put them on a neutral ground beside it.
- `track`, `track-raised`. A track holds its thumb and nothing else.
- `term-selection`, `term-cursor`. A terminal layer holds the cell ink only.
- `match@term`, `match@base`, `match-active@term`, `match-active@base`. Only the terminal cell ink sits in a search match.
- Every `scrim@*` ground. Inert layer. Content under a scrim has no target, and nothing new is drawn on it.

### `focus-ring`

| Token | Grounds | Lowest, Mocha · Latte |
|---|---|---|
| `border-focus` | `crust`, `mantle`, `base`, `raised`, `on-raised`, `field`, `term`, `tab-hover`, `crust+hover`, `mantle+hover`, `mantle+press`, `base+hover`, `base+press`, `on-raised+hover`, `on-raised+press` | 3.08 · 3.08 |
| `accent-primary-raised` | `solid-hover`, `active`, `crust+press`, `raised+hover`, `raised+press` | 3.17 · 3.84 |
| `accent-primary-on-active` | `active+hover`, `active+press` | 3.10 · 3.27 |

Forbidden:

- `fill-primary`, `fill-agent`, `fill-danger`, `fill-success`, `fill-warning`, `fill-close`, `fill-primary+hover`, `fill-primary+press`, `fill-agent+hover`, `fill-agent+press`, `fill-danger+hover`, `fill-danger+press`. A filled control carries one ink pair. Hue or neutral steps on it would read as a second state.
- `tint-avatar`, `dag-running`, `dag-failed`, `dag-unknown`, `dag-partial`, `dag-awaiting`, `dag-stalled`, `dag-crashed`, `dag-cycle`, `approval`, `tint-primary@mantle`, `tint-primary@base`, `tint-primary@raised`, `tint-info@mantle`, `tint-info@base`, `tint-info@raised`, `tint-success@mantle`, `tint-success@base`, `tint-success@raised`, `tint-warning@mantle`, `tint-warning@base`, `tint-warning@raised`, `tint-danger@mantle`, `tint-danger@base`, `tint-danger@raised`, `tint-agent@mantle`, `tint-agent@base`, `tint-agent@raised`, `drop-target@mantle`, `drop-target@base`, `drop-target@raised`, `file-drop@crust`, `file-drop@mantle`, `file-drop@base`, `file-drop@term`, `marquee@mantle`, `marquee@base`, `split-zone@crust`, `split-zone@mantle`, `split-zone@base`. Controls do not sit on a tint. Put them on a neutral ground beside it.
- `track`, `track-raised`. A track holds its thumb and nothing else.
- `term-selection`, `term-cursor`. A terminal layer holds the cell ink only.
- `match@term`, `match@base`, `match-active@term`, `match-active@base`. Only the terminal cell ink sits in a search match.
- Every `scrim@*` ground. Inert layer. Content under a scrim has no target, and nothing new is drawn on it.

### `selection-bar`

| Token | Grounds | Lowest, Mocha · Latte |
|---|---|---|
| `accent-primary` | `crust`, `mantle`, `base`, `raised`, `on-raised`, `field`, `term`, `tab-hover` | 4.33 · 3.18 |
| `accent-primary-raised` | `solid-hover` | 4.33 · 4.57 |
| `accent-primary-on-active` | `active`, `active+hover`, `active+press` | 3.10 · 3.27 |

Forbidden:

- `fill-primary`, `fill-agent`, `fill-danger`, `fill-success`, `fill-warning`, `fill-close`, `fill-primary+hover`, `fill-primary+press`, `fill-agent+hover`, `fill-agent+press`, `fill-danger+hover`, `fill-danger+press`. A filled control carries one ink pair. Hue or neutral steps on it would read as a second state.
- `tint-avatar`, `dag-running`, `dag-failed`, `dag-unknown`, `dag-partial`, `dag-awaiting`, `dag-stalled`, `dag-crashed`, `dag-cycle`, `approval`, `tint-primary@mantle`, `tint-primary@base`, `tint-primary@raised`, `tint-info@mantle`, `tint-info@base`, `tint-info@raised`, `tint-success@mantle`, `tint-success@base`, `tint-success@raised`, `tint-warning@mantle`, `tint-warning@base`, `tint-warning@raised`, `tint-danger@mantle`, `tint-danger@base`, `tint-danger@raised`, `tint-agent@mantle`, `tint-agent@base`, `tint-agent@raised`, `drop-target@mantle`, `drop-target@base`, `drop-target@raised`, `file-drop@crust`, `file-drop@mantle`, `file-drop@base`, `file-drop@term`, `marquee@mantle`, `marquee@base`, `split-zone@crust`, `split-zone@mantle`, `split-zone@base`. Controls do not sit on a tint. Put them on a neutral ground beside it.
- `track`, `track-raised`. A track holds its thumb and nothing else.
- `term-selection`, `term-cursor`. A terminal layer holds the cell ink only.
- `crust+hover`, `crust+press`, `mantle+hover`, `mantle+press`, `base+hover`, `base+press`, `raised+hover`, `raised+press`, `on-raised+hover`, `on-raised+press`. A progress or selection mark takes no hover state of its own.
- `match@term`, `match@base`, `match-active@term`, `match-active@base`. Only the terminal cell ink sits in a search match.
- Every `scrim@*` ground. Inert layer. Content under a scrim has no target, and nothing new is drawn on it.

### `scrollbar-thumb`

| Token | Grounds | Lowest, Mocha · Latte |
|---|---|---|
| `scrollbar-thumb` | `crust`, `mantle`, `base`, `term`, `tab-hover` | 3.36 · 3.29 |
| `scrollbar-thumb-raised` | `raised`, `field` | 3.40 · 3.65 |
| `scrollbar-thumb-hover` | `on-raised`, `solid-hover` | 4.10 · 4.39 |

Forbidden:

- `active`, `crust+hover`, `crust+press`, `mantle+hover`, `mantle+press`, `base+hover`, `base+press`, `raised+hover`, `raised+press`, `on-raised+hover`, `on-raised+press`, `active+hover`, `active+press`. A row does not own a scrollbar.
- `fill-primary`, `fill-agent`, `fill-danger`, `fill-success`, `fill-warning`, `fill-close`, `fill-primary+hover`, `fill-primary+press`, `fill-agent+hover`, `fill-agent+press`, `fill-danger+hover`, `fill-danger+press`. A filled control carries one ink pair. Hue or neutral steps on it would read as a second state.
- `tint-avatar`, `dag-running`, `dag-failed`, `dag-unknown`, `dag-partial`, `dag-awaiting`, `dag-stalled`, `dag-crashed`, `dag-cycle`, `approval`, `tint-primary@mantle`, `tint-primary@base`, `tint-primary@raised`, `tint-info@mantle`, `tint-info@base`, `tint-info@raised`, `tint-success@mantle`, `tint-success@base`, `tint-success@raised`, `tint-warning@mantle`, `tint-warning@base`, `tint-warning@raised`, `tint-danger@mantle`, `tint-danger@base`, `tint-danger@raised`, `tint-agent@mantle`, `tint-agent@base`, `tint-agent@raised`, `drop-target@mantle`, `drop-target@base`, `drop-target@raised`, `file-drop@crust`, `file-drop@mantle`, `file-drop@base`, `file-drop@term`, `marquee@mantle`, `marquee@base`, `split-zone@crust`, `split-zone@mantle`, `split-zone@base`. Controls do not sit on a tint. Put them on a neutral ground beside it.
- `track`, `track-raised`. A track holds its thumb and nothing else.
- `term-selection`, `term-cursor`. A terminal layer holds the cell ink only.
- `match@term`, `match@base`, `match-active@term`, `match-active@base`. Only the terminal cell ink sits in a search match.
- Every `scrim@*` ground. Inert layer. Content under a scrim has no target, and nothing new is drawn on it.

### `progress-fill`

| Token | Grounds | Lowest, Mocha · Latte |
|---|---|---|
| `accent-primary` | `crust`, `mantle`, `base`, `raised`, `on-raised`, `field`, `term`, `tab-hover` | 4.33 · 3.18 |
| `accent-primary-raised` | `solid-hover`, `active` | 3.17 · 3.84 |

Forbidden:

- `fill-primary`, `fill-agent`, `fill-danger`, `fill-success`, `fill-warning`, `fill-close`, `fill-primary+hover`, `fill-primary+press`, `fill-agent+hover`, `fill-agent+press`, `fill-danger+hover`, `fill-danger+press`. A filled control carries one ink pair. Hue or neutral steps on it would read as a second state.
- `tint-avatar`, `dag-running`, `dag-failed`, `dag-unknown`, `dag-partial`, `dag-awaiting`, `dag-stalled`, `dag-crashed`, `dag-cycle`, `approval`, `tint-primary@mantle`, `tint-primary@base`, `tint-primary@raised`, `tint-info@mantle`, `tint-info@base`, `tint-info@raised`, `tint-success@mantle`, `tint-success@base`, `tint-success@raised`, `tint-warning@mantle`, `tint-warning@base`, `tint-warning@raised`, `tint-danger@mantle`, `tint-danger@base`, `tint-danger@raised`, `tint-agent@mantle`, `tint-agent@base`, `tint-agent@raised`, `drop-target@mantle`, `drop-target@base`, `drop-target@raised`, `file-drop@crust`, `file-drop@mantle`, `file-drop@base`, `file-drop@term`, `marquee@mantle`, `marquee@base`, `split-zone@crust`, `split-zone@mantle`, `split-zone@base`. Controls do not sit on a tint. Put them on a neutral ground beside it.
- `track`, `track-raised`. A track holds its thumb and nothing else.
- `term-selection`, `term-cursor`. A terminal layer holds the cell ink only.
- `crust+hover`, `crust+press`, `mantle+hover`, `mantle+press`, `base+hover`, `base+press`, `raised+hover`, `raised+press`, `on-raised+hover`, `on-raised+press`, `active+hover`, `active+press`. A progress or selection mark takes no hover state of its own.
- `match@term`, `match@base`, `match-active@term`, `match-active@base`. Only the terminal cell ink sits in a search match.
- Every `scrim@*` ground. Inert layer. Content under a scrim has no target, and nothing new is drawn on it.

## 7. Meaning

**Hue or shape.** Ask what carries the meaning.

- **Hue:** favorite star, plugin dot, mirror glyph, status dots, attached ring. The glyph keeps its hue through the `-on-active` token on a selected row.
- **Shape:** file kinds, chevrons, close, the unregistered star. The glyph takes the row ink on a selected row.
- **Selection mark:** check, selection bar. It takes `accent-primary-on-active`.
- **Text hue on a selected row:** forbidden. No hue reaches 4.5:1 there and still differs from the row ink. Use the row ink, with a hue glyph or a Tag beside it.
- **Match run on a selected row:** row ink with an underline, `autocomplete-match-underline-*`.

**Never color alone.** Each state also has a word, a glyph, a dash pattern, a position or a fill. A dot alone must also have a tooltip or a label.

**Colors told apart.** In a group that must be told apart, every pair holds OKLab ΔE 0.08 or more. A pair under that must have a second channel, which is part of the contract.

| Group | Theme | Closest pair | ΔE | Second channel |
|---|---|---|---|---|
| status dots at rest | mocha | `status-dot-agent`, `status-dot-completion` | 0.090 | not needed |
| status dots at rest | latte | `status-dot-success`, `status-dot-warning` | 0.122 | not needed |
| status dots on a selected row | mocha | `status-dot-idle-active`, `status-dot-completion-active` | 0.044 | Idle draws as a 1px ring on a selected row, so shape tells it from completion. |
| status dots on a selected row | latte | `status-dot-agent-active`, `status-dot-completion-active` | 0.111 | not needed |
| Tag text | mocha | `tag-info-fg`, `tag-attached-fg` | 0.101 | not needed |
| Tag text | latte | `tag-warning-fg`, `tag-attention-fg` | 0.063 | Every Tag carries a word. |
| DAG states | mocha | `dag-status-ready`, `dag-status-succeeded` | 0.110 | not needed |
| DAG states | latte | `dag-status-unknown`, `dag-status-partially-failed` | 0.063 | Every state carries a glyph and a word. |
| DAG edges | mocha | `dag-edge-reduce`, `dag-edge-binding` | 0.041 | Every relation has its own dash pattern (dag-edge-dash-*). |
| DAG edges | latte | `dag-edge-reduce`, `dag-edge-transition` | 0.070 | Every relation has its own dash pattern (dag-edge-dash-*). |
| surface focus edge | mocha | `surface-focus-edge-focused`, `surface-focus-edge-unfocused` | 0.602 | not needed |
| surface focus edge | latte | `surface-focus-edge-focused`, `surface-focus-edge-unfocused` | 0.442 | not needed |
| terminal bed | mocha | `surface-terminal-focused-bg`, `surface-terminal-unfocused-bg` | 0.245 | not needed |
| terminal bed | latte | `surface-terminal-focused-bg`, `surface-terminal-unfocused-bg` | 0.043 | The surface focus edge tells them apart. The bed swap is not what the rule relies on. |
| surface focus edge and rings | mocha | `surface-focus-edge-focused`, `surface-highlight-done-border` | 0.088 | not needed |
| surface focus edge and rings | latte | `surface-focus-edge-focused`, `surface-highlight-input-border` | 0.135 | not needed |

**Surface focus pass mark.** The pair `surface-focus-edge-focused`, `surface-focus-edge-unfocused` must hold OKLab ΔE 0.08 or more and contrast 3:1 or more in Mocha and in Latte, and `surface-focus-edge-focused` must hold 3:1 on `crust`, `mantle`, `base`, `raised` and `term`. Both values are opaque. A translucent value composites over its neighbor first, as the [measure](#2-how-strong-the-rules-are) says. The contrast is required on top of the ΔE because the two states meet in one thin bar with no word or glyph. It binds the built-in themes only. The `surface-terminal-*-bg` pair must differ, and it may stay under ΔE 0.08 because the edge carries the rule.

**Rings among themselves.** The group `surface focus edge and rings` compares the lit edge with each ring and holds no ring pair. The closest ring pair is `surface-occupied-hard-border`, `surface-highlight-input-border` in Latte at ΔE 0.062. Width separates them, 1px against 2px, except on a focused webview leaf, where the top side of either one is a single 1px row. Only hue is left there. That case is unmeasured, and it goes back to design if it does not read in the app.

**Tint rule.** A tint holds its own hue and neutrals. A second hue on it reads as a conflict, so it is forbidden.

## 8. Hierarchy

Contrast sets the floor, so the ink steps can merge. In Latte `text-secondary` and `text-muted` are one ink, and on `raised` body, secondary and muted are one ink. On `active` every neutral is one ink. This is by design. Order holds through these, in this order:

1. **Size.** Body 13, caption 11, micro 10. A supporting line is one step smaller than the line it supports.
2. **Weight.** A title is 13 at 600. An unread item is semibold.
3. **Family.** Paths, IDs, times and process names are mono.
4. **Position.** The line under a label is its detail, `label-detail-gap` away.
5. **Ink step,** where one exists.

Do not add a fainter ink to get order back. An ink under grade is a failure, whatever it does for the order.

## 9. Component contracts

**Priority when states overlap.** One order for every component:

disabled › selected + press › selected + hover › selected or keyboard-active › press › hover › rest

Focus sits outside this order. It adds a ring and changes nothing else. Invalid and read-only replace rest in a field. A disabled item shows no other state.

**Hover and press move the ground, not the ink step.** An ink changes under hover only when the cell for the new ground names another token, and then for contrast. On `crust`, `mantle` and `base`, `text-secondary` under hover or press is always `text-secondary-raised`, so a widget does not need to know which of the three it sits on. `glyph` stays `text-secondary`.

**Components inside components.** One rule, no per-widget exceptions:

- **A child with its own fill** (Tag, Kbd, Badge, Button with a fill, field, Checkbox box) is its own ground. Its ink comes from that fill, so the host's state does not reach it. Its edge is measured on the host ground. A host overlay is drawn under the child.
- **A child with no fill** (icon, status dot, text, the Kbd `+`, ghost Button, IconButton) reads its role on the host's current ground. On a selected row it reads the `active` column, and under hover the `active+hover` column.
- **Depth** stops at the location map.
- A disabled host passes `text-disabled` down to a child with no fill, and the disabled variant to a child with a fill. An accent fill never carries disabled ink.

**A child with no fill is told its host.** `Kbd`, `Tag`, `Checkbox` and `StatusDot` take `ground` (`raised` or `active`, the default reads a neutral ground). `ListCtrl` takes `activeId` for the keyboard-active row. They cannot see the ground behind them, so the host passes it.

The file has every row, 1 per component, part, state and host. Below, rows with one token are merged. A component token is named where one exists. A semantic token means read that token directly.

### Button.secondary

Sits on: `crust`, `mantle`, `base`

| Part | Token | States | Ground | Lowest, Mocha · Latte |
|---|---|---|---|---|
| label | `button-fg` | rest, focus | `raised` | 8.69 · 5.17 |
| icon | `text-secondary` | rest, hover, press, focus | `raised`, `raised+hover`, `raised+press` | 4.85 · 3.12 |
| edge | `button-secondary-border` | rest, focus | `crust`, `mantle`, `base` | no target |
| label | `text-on-active` | hover, press | `raised+hover`, `raised+press` | 5.94 · 5.83 |
| edge | `button-secondary-border-hover` | hover | `crust`, `mantle`, `base` | no target |
| edge | `border-default` | press, disabled | `crust`, `mantle`, `base` | no target |
| ring | `border-focus` | focus | `crust`, `mantle`, `base` | 7.79 · 3.71 |
| label | `text-disabled` | disabled | `raised` | no target |
| icon | `text-disabled` | disabled | `raised` | no target |

### Button.secondary (on raised)

Sits on: `raised`

| Part | Token | States | Ground | Lowest, Mocha · Latte |
|---|---|---|---|---|
| label | `text-primary` | rest, hover, focus | `on-raised`, `on-raised+hover` | 5.00 · 5.92 |
| icon | `text-secondary` | rest, hover, press, focus | `on-raised`, `on-raised+hover`, `on-raised+press` | 3.67 · 4.21 |
| edge | `banner-button-border` | rest, focus | `raised` | no target |
| edge | `border-frame` | hover, press | `raised` | no target |
| label | `text-on-active-hover` | press | `on-raised+press` | 6.49 · 8.87 |
| ring | `border-focus` | focus | `raised` | 5.97 · 3.18 |
| label | `text-disabled` | disabled | `on-raised` | no target |
| icon | `text-disabled` | disabled | `on-raised` | no target |

### Button.primary

Sits on: `crust`, `mantle`, `base`, `raised`

| Part | Token | States | Ground | Lowest, Mocha · Latte |
|---|---|---|---|---|
| label | `button-primary-fg` | rest, hover, press, focus | `fill-primary`, `fill-primary+hover`, `fill-primary+press` | 8.91 · 4.91 |
| icon | `text-on-accent` | rest, hover, press, focus | `fill-primary`, `fill-primary+hover`, `fill-primary+press` | 8.91 · 4.91 |
| ring | `border-focus` | focus | `crust`, `mantle`, `base`, `raised` | 5.97 · 3.18 |

### Button.agent

Sits on: `crust`, `mantle`, `base`, `raised`

| Part | Token | States | Ground | Lowest, Mocha · Latte |
|---|---|---|---|---|
| label | `button-agent-fg` | rest, hover, press, focus | `fill-agent`, `fill-agent+hover`, `fill-agent+press` | 9.23 · 5.41 |
| icon | `text-on-accent` | rest, hover, press, focus | `fill-agent`, `fill-agent+hover`, `fill-agent+press` | 9.23 · 5.41 |
| ring | `border-focus` | focus | `crust`, `mantle`, `base`, `raised` | 5.97 · 3.18 |

### Button.danger

Sits on: `crust`, `mantle`, `base`, `raised`

| Part | Token | States | Ground | Lowest, Mocha · Latte |
|---|---|---|---|---|
| label | `button-danger-fg` | rest, hover, press, focus | `fill-danger`, `fill-danger+hover`, `fill-danger+press` | 8.10 · 5.43 |
| icon | `text-on-accent` | rest, hover, press, focus | `fill-danger`, `fill-danger+hover`, `fill-danger+press` | 8.10 · 5.43 |
| ring | `border-focus` | focus | `crust`, `mantle`, `base`, `raised` | 5.97 · 3.18 |

### Button.ghost

Sits on: `crust`, `mantle`, `base`, `raised`, `active`

| Part | Token | States | Ground | Lowest, Mocha · Latte |
|---|---|---|---|---|
| label | `button-ghost-fg` | rest, focus | `crust`, `mantle`, `base` | 9.26 · 4.73 |
| icon | `text-secondary` | rest, hover, press, focus | `crust`, `crust+hover`, `crust+press`, `mantle` and 8 more | 4.85 · 3.12 |
| label | `text-secondary-raised` | hover, press, rest, focus | `crust+hover`, `crust+press`, `mantle+hover`, `mantle+press` and 3 more | 6.41 · 4.62 |
| ring | `border-focus` | focus | `crust`, `mantle`, `base`, `raised` | 5.97 · 3.18 |
| label | `text-disabled` | disabled | `crust`, `mantle`, `base`, `raised`, `active` | no target |
| icon | `text-disabled` | disabled | `crust`, `mantle`, `base`, `raised`, `active` | no target |
| label | `text-on-active` | hover, press, rest, focus | `raised+hover`, `raised+press`, `active` | 4.62 · 5.40 |
| icon | `text-on-active` | rest, hover, press, focus | `active`, `active+hover`, `active+press` | 3.43 · 4.21 |
| label | `text-on-active-hover` | hover, press | `active+hover`, `active+press` | 4.97 · 4.74 |
| ring | `accent-primary-raised` | focus | `active` | 3.17 · 3.84 |

### IconButton

Sits on: `crust`, `mantle`, `base`, `raised`, `active`

| Part | Token | States | Ground | Lowest, Mocha · Latte |
|---|---|---|---|---|
| glyph | `icon-button-fg` | rest, focus | `crust`, `mantle`, `base`, `raised` | 7.10 · 4.05 |
| glyph | `text-secondary` | hover, press | `crust+hover`, `crust+press`, `mantle+hover`, `mantle+press` and 4 more | 4.85 · 3.12 |
| ring | `border-focus` | focus | `crust`, `mantle`, `base`, `raised` | 5.97 · 3.18 |
| glyph | `text-disabled` | disabled | `crust`, `mantle`, `base`, `raised`, `active` | no target |
| glyph | `text-on-active` | rest, hover, press, focus | `active`, `active+hover`, `active+press` | 3.43 · 4.21 |
| ring | `accent-primary-raised` | focus | `active` | 3.17 · 3.84 |

### Badge.default

Sits on: `crust`, `mantle`, `base`, `raised`, `active`

| Part | Token | States | Ground | Lowest, Mocha · Latte |
|---|---|---|---|---|
| count | `badge-danger-fg` | rest | `fill-danger` | 8.10 · 5.43 |

### Badge.danger

Sits on: `crust`, `mantle`, `base`, `raised`, `active`

| Part | Token | States | Ground | Lowest, Mocha · Latte |
|---|---|---|---|---|
| count | `badge-danger-fg` | rest | `fill-danger` | 8.10 · 5.43 |

### Badge.primary

Sits on: `crust`, `mantle`, `base`, `raised`, `active`

| Part | Token | States | Ground | Lowest, Mocha · Latte |
|---|---|---|---|---|
| count | `badge-primary-fg` | rest | `fill-primary` | 8.91 · 4.91 |

### Badge.warning

Sits on: `crust`, `mantle`, `base`, `raised`, `active`

| Part | Token | States | Ground | Lowest, Mocha · Latte |
|---|---|---|---|---|
| count | `badge-warning-fg` | rest | `fill-warning` | 14.76 · 5.03 |

### Badge.agent

Sits on: `crust`, `mantle`, `base`, `raised`, `active`

| Part | Token | States | Ground | Lowest, Mocha · Latte |
|---|---|---|---|---|
| count | `badge-agent-fg` | rest | `fill-agent` | 9.23 · 5.41 |

### Badge.success

Sits on: `crust`, `mantle`, `base`, `raised`, `active`

| Part | Token | States | Ground | Lowest, Mocha · Latte |
|---|---|---|---|---|
| count | `badge-success-fg` | rest | `fill-success` | 12.61 · 5.48 |

### Badge.neutral

Sits on: `crust`, `mantle`, `base`, `raised`, `active`

| Part | Token | States | Ground | Lowest, Mocha · Latte |
|---|---|---|---|---|
| count | `badge-neutral-fg` | rest | `active` | 4.62 · 5.40 |

### Tag

Sits on: `crust`, `mantle`, `base`, `raised`, `active`

| Part | Token | States | Ground | Lowest, Mocha · Latte |
|---|---|---|---|---|
| label | `tag-fg` | rest | `raised` | 7.10 · 5.17 |
| label.success | `tag-success-fg` | rest | `raised` | 8.46 · 4.91 |
| label.warning | `tag-warning-fg` | rest | `raised` | 9.89 · 5.24 |
| label.attention | `tag-attention-fg` | rest | `raised` | 7.10 · 5.11 |
| label.danger | `tag-danger-fg` | rest | `raised` | 5.43 · 4.80 |
| label.info | `tag-info-fg` | rest | `raised` | 8.08 · 4.86 |
| label.attached | `tag-attached-fg` | rest | `raised` | 7.03 · 5.31 |
| edge | `tag-border` | rest | `crust`, `mantle`, `base`, `raised`, `active` | no target |
| label | `text-disabled` | disabled | `raised` | no target |
| edge | `border-default` | disabled | `crust`, `mantle`, `base` | no target |
| edge | `border-strong` | disabled | `raised` | no target |
| edge | `border-frame` | disabled | `active` | no target |

### Kbd

Sits on: `crust`, `mantle`, `base`, `raised`, `active`

| Part | Token | States | Ground | Lowest, Mocha · Latte |
|---|---|---|---|---|
| cap | `kbd-fg` | rest | `raised` | 7.10 · 5.17 |
| plus | `kbd-plus-fg` | rest | `crust`, `mantle`, `base`, `raised` | 5.65 · 5.17 |
| edge | `kbd-border` | rest | `crust`, `mantle`, `base`, `raised`, `active` | no target |
| plus | `text-on-active` | rest | `active` | 4.62 · 5.40 |

### Input

Sits on: `crust`, `mantle`, `base`

| Part | Token | States | Ground | Lowest, Mocha · Latte |
|---|---|---|---|---|
| value | `input-fg` | rest, focus | `field` | 8.69 · 7.06 |
| placeholder | `input-placeholder` | rest, focus | `field` | 5.65 · 5.53 |
| icon | `input-icon-fg` | rest, focus | `field` | 5.65 · 5.53 |
| edge | `input-border` | rest | `crust`, `mantle`, `base` | 3.36 · 3.29 |
| value | `text-primary` | hover, invalid | `field` | 8.69 · 7.06 |
| placeholder | `text-placeholder` | hover | `field` | 5.65 · 5.53 |
| icon | `text-secondary` | hover | `field` | 7.10 · 5.53 |
| edge | `border-control-raised` | hover | `crust`, `mantle`, `base` | 4.44 · 4.26 |
| ring | `border-focus` | focus | `crust`, `mantle`, `base` | 7.79 · 3.71 |
| edge.invalid | `input-border-invalid` | invalid | `crust`, `mantle`, `base` | 7.08 · 4.10 |
| value.readonly | `input-readonly-fg` | readonly | `raised` | 7.10 · 5.17 |

### Input (on raised)

Sits on: `raised`

| Part | Token | States | Ground | Lowest, Mocha · Latte |
|---|---|---|---|---|
| value | `input-fg` | rest, focus | `base` | 11.34 · 7.06 |
| placeholder | `input-placeholder` | rest, focus | `base` | 7.37 · 5.53 |
| icon | `input-icon-fg` | rest, focus | `base` | 7.37 · 5.53 |
| edge | `input-raised-border` | rest | `raised` | 3.40 · 3.65 |
| value | `text-primary` | hover, invalid | `base` | 11.34 · 7.06 |
| placeholder | `text-placeholder` | hover | `base` | 7.37 · 5.53 |
| icon | `text-secondary` | hover | `base` | 9.26 · 5.53 |
| edge | `border-control-raised` | hover | `raised` | 3.40 · 3.65 |
| ring | `border-focus` | focus | `raised` | 5.97 · 3.18 |
| edge.invalid | `input-border-invalid` | invalid | `raised` | 5.43 · 3.52 |
| value.readonly | `input-readonly-fg` | readonly | `base` | 9.26 · 7.06 |

### Select trigger

Sits on: `crust`, `mantle`, `base`

| Part | Token | States | Ground | Lowest, Mocha · Latte |
|---|---|---|---|---|
| value | `select-fg` | rest, focus | `field` | 8.69 · 7.06 |
| placeholder | `select-placeholder` | rest, focus | `field` | 5.65 · 5.53 |
| chevron | `select-chevron-fg` | rest, focus | `field` | 5.65 · 5.53 |
| edge | `select-border` | rest | `crust`, `mantle`, `base` | 3.36 · 3.29 |
| value | `text-primary` | hover | `field` | 8.69 · 7.06 |
| placeholder | `text-placeholder` | hover | `field` | 5.65 · 5.53 |
| chevron | `text-secondary` | hover | `field` | 7.10 · 5.53 |
| edge | `border-control` | hover | `crust`, `mantle`, `base` | 3.36 · 3.29 |
| ring | `border-focus` | focus | `crust`, `mantle`, `base` | 7.79 · 3.71 |

### Select trigger (on raised)

Sits on: `raised`

| Part | Token | States | Ground | Lowest, Mocha · Latte |
|---|---|---|---|---|
| value | `select-fg` | rest, focus | `base` | 11.34 · 7.06 |
| placeholder | `select-placeholder` | rest, focus | `base` | 7.37 · 5.53 |
| chevron | `select-chevron-fg` | rest, focus | `base` | 7.37 · 5.53 |
| edge | `select-raised-border` | rest | `raised` | 3.40 · 3.65 |
| value | `text-primary` | hover | `base` | 11.34 · 7.06 |
| placeholder | `text-placeholder` | hover | `base` | 7.37 · 5.53 |
| chevron | `text-secondary` | hover | `base` | 9.26 · 5.53 |
| edge | `border-control-raised` | hover | `raised` | 3.40 · 3.65 |
| ring | `border-focus` | focus | `raised` | 5.97 · 3.18 |

### MenuItem

Sits on: `raised`

| Part | Token | States | Ground | Lowest, Mocha · Latte |
|---|---|---|---|---|
| label | `menu-item-fg` | rest | `raised` | 7.10 · 5.17 |
| label.danger | `accent-danger-raised` | rest | `raised` | 5.43 · 4.80 |
| icon | `text-secondary` | rest, hover, press | `raised`, `raised+hover`, `raised+press` | 4.85 · 3.12 |
| shortcut | `text-muted-raised` | rest | `raised` | 5.65 · 5.17 |
| check | `menu-item-check-fg` | rest, keyboard-active | `raised`, `active` | 4.17 · 4.20 |
| label | `menu-item-fg-hover` | hover, press, keyboard-active | `raised+hover`, `raised+press`, `active` | 4.62 · 5.40 |
| label.danger | `accent-danger-strong` | hover, press | `raised+hover`, `raised+press` | 4.61 · 4.52 |
| shortcut | `text-on-active` | hover, press, keyboard-active | `raised+hover`, `raised+press`, `active` | 4.62 · 5.40 |
| check | `accent-primary-raised` | hover, press | `raised+hover`, `raised+press` | 4.08 · 4.14 |
| icon | `menu-item-part-fg-active` | keyboard-active | `active` | 4.62 · 5.40 |
| label | `text-disabled` | disabled | `raised` | no target |
| icon | `text-disabled` | disabled | `raised` | no target |
| shortcut | `text-disabled` | disabled | `raised` | no target |
| check | `text-disabled` | disabled | `raised` | no target |

### AutoComplete row

Sits on: `raised`

| Part | Token | States | Ground | Lowest, Mocha · Latte |
|---|---|---|---|---|
| label | `autocomplete-row-fg` | rest | `raised` | 7.10 · 5.17 |
| match | `autocomplete-match-fg` | rest, hover | `raised`, `raised+hover` | 5.28 · 4.95 |
| icon | `text-secondary` | rest, hover | `raised`, `raised+hover` | 5.57 · 3.40 |
| label | `autocomplete-row-fg-active` | hover, keyboard-active | `raised+hover`, `active` | 4.62 · 5.40 |
| match | `text-on-active` | keyboard-active | `active` | 4.62 · 5.40 |
| icon | `autocomplete-part-fg-active` | keyboard-active | `active` | 4.62 · 5.40 |

### MultiSelect row

Sits on: `raised`

| Part | Token | States | Ground | Lowest, Mocha · Latte |
|---|---|---|---|---|
| label | `multiselect-row-fg` | rest | `raised` | 8.69 · 5.17 |
| bulk | `multiselect-all-fg` | rest | `raised` | 5.97 · 5.38 |
| label | `text-on-active` | hover | `raised+hover` | 6.82 · 6.36 |
| bulk | `accent-primary-raised` | hover | `raised+hover` | 4.68 · 4.52 |
| label | `multiselect-row-fg-active` | keyboard-active | `active` | 4.62 · 5.40 |

### SearchableSelect status row

Sits on: `raised`

| Part | Token | States | Ground | Lowest, Mocha · Latte |
|---|---|---|---|---|
| status | `select-search-status-fg` | rest | `raised` | 7.10 · 5.17 |

### Checkbox.off

Sits on: `crust`, `mantle`, `base`, `raised`, `active`

| Part | Token | States | Ground | Lowest, Mocha · Latte |
|---|---|---|---|---|
| edge | `border-control` | rest, focus | `crust`, `mantle`, `base` | 3.36 · 3.29 |
| ring | `border-focus` | focus | `crust`, `mantle`, `base`, `raised` | 5.97 · 3.18 |
| edge | `border-default` | disabled | `crust`, `mantle`, `base` | no target |
| edge | `border-control-raised` | rest, focus | `raised` | 3.40 · 3.65 |
| edge | `border-strong` | disabled | `raised` | no target |
| edge | `text-on-active` | rest, focus | `active` | 4.62 · 5.40 |
| ring | `accent-primary-raised` | focus | `active` | 3.17 · 3.84 |
| edge | `border-frame` | disabled | `active` | no target |

### Checkbox.on

Sits on: `crust`, `mantle`, `base`, `raised`

| Part | Token | States | Ground | Lowest, Mocha · Latte |
|---|---|---|---|---|
| check | `checkbox-check-fg` | rest, focus | `fill-primary` | 8.91 · 4.91 |
| ring | `border-focus` | focus | `crust`, `mantle`, `base`, `raised` | 5.97 · 3.18 |

### Switch.off

Sits on: `crust`, `mantle`, `base`

| Part | Token | States | Ground | Lowest, Mocha · Latte |
|---|---|---|---|---|
| thumb | `switch-thumb-bg` | rest, focus | `track` | 3.38 · 4.35 |
| ring | `border-focus` | focus | `crust`, `mantle`, `base` | 7.79 · 3.71 |

### Switch.off (on raised)

Sits on: `raised`

| Part | Token | States | Ground | Lowest, Mocha · Latte |
|---|---|---|---|---|
| thumb | `switch-thumb-raised-bg` | rest, focus | `track-raised` | 3.70 · 5.64 |
| ring | `border-focus` | focus | `raised` | 5.97 · 3.18 |

### Switch.on

Sits on: `crust`, `mantle`, `base`, `raised`

| Part | Token | States | Ground | Lowest, Mocha · Latte |
|---|---|---|---|---|
| thumb | `switch-thumb-bg-on` | rest, focus | `fill-primary` | 8.91 · 4.91 |
| ring | `border-focus` | focus | `crust`, `mantle`, `base`, `raised` | 5.97 · 3.18 |

### Tab.inactive

Sits on: `mantle`

| Part | Token | States | Ground | Lowest, Mocha · Latte |
|---|---|---|---|---|
| label | `tab-fg` | rest | `mantle` | 7.89 · 5.14 |
| label.needs-input | `tab-fg-needs-input` | rest | `mantle` | 13.81 · 6.65 |
| label.completion | `tab-fg-completion` | rest | `mantle` | 8.34 · 6.83 |
| icon | `text-secondary` | rest | `mantle` | 9.91 · 5.14 |
| close | `text-secondary` | rest | `mantle` | 9.91 · 5.14 |
| dot | `accent-success-raised` | rest | `mantle` | 11.81 · 6.23 |
| separator | `tab-separator` | rest | `mantle` | no target |

### Tab.hover

Sits on: `tab-hover`

| Part | Token | States | Ground | Lowest, Mocha · Latte |
|---|---|---|---|---|
| label | `tab-fg-hover` | rest | `tab-hover` | 9.50 · 5.38 |
| label.needs-input | `tab-fg-needs-input` | rest | `tab-hover` | 13.23 · 6.95 |
| label.completion | `tab-fg-completion` | rest | `tab-hover` | 7.99 · 7.14 |
| icon | `text-secondary` | rest | `tab-hover` | 9.50 · 5.38 |
| close | `text-secondary` | rest | `tab-hover` | 9.50 · 5.38 |
| dot | `accent-success-raised` | rest | `tab-hover` | 11.31 · 6.52 |

### Tab.active

Sits on: `base`

| Part | Token | States | Ground | Lowest, Mocha · Latte |
|---|---|---|---|---|
| label | `tab-fg-active` | rest | `base` | 11.34 · 7.06 |
| icon | `text-secondary` | rest | `base` | 9.26 · 5.53 |
| close | `text-secondary` | rest | `base` | 9.26 · 5.53 |
| dot | `accent-success-raised` | rest | `base` | 11.03 · 6.70 |
| indicator | `tab-indicator` | rest | `base` | 7.79 · 4.34 |

### TreeRow

Sits on: `mantle`, `base`

| Part | Token | States | Ground | Lowest, Mocha · Latte |
|---|---|---|---|---|
| label | `tree-row-fg` | rest | `mantle`, `base` | 9.26 · 5.14 |
| chevron | `text-secondary` | rest, hover, press | `mantle`, `mantle+hover`, `mantle+press`, `base` and 2 more | 6.41 · 3.92 |
| icon | `text-secondary` | rest, hover, press | `mantle`, `mantle+hover`, `mantle+press`, `base` and 2 more | 6.41 · 3.92 |
| meta | `text-muted` | rest | `mantle`, `base` | 7.37 · 5.14 |
| label | `text-secondary-raised` | hover, press | `mantle+hover`, `mantle+press`, `base+hover`, `base+press` | 6.41 · 5.01 |
| meta | `text-muted-raised` | hover, press | `mantle+hover`, `mantle+press`, `base+hover`, `base+press` | 5.10 · 5.01 |
| label | `tree-row-fg-active` | selected | `active` | 4.62 · 5.40 |
| chevron | `tree-row-part-fg-active` | selected | `active` | 4.62 · 5.40 |
| icon | `tree-row-icon-fg-active` | selected | `active` | 4.17 · 4.20 |
| icon.selected | `tree-row-icon-fg-active` | selected | `active` | 4.17 · 4.20 |
| meta | `tree-row-part-fg-active` | selected | `active` | 4.62 · 5.40 |
| label | `text-on-active-hover` | selected+hover, selected+press | `active+hover`, `active+press` | 4.97 · 4.74 |
| chevron | `text-on-active` | selected+hover, selected+press | `active+hover`, `active+press` | 3.43 · 4.21 |
| icon | `accent-primary-on-active` | selected+hover, selected+press | `active+hover`, `active+press` | 3.10 · 3.27 |
| icon.selected | `accent-primary-on-active` | selected+hover, selected+press | `active+hover`, `active+press` | 3.10 · 3.27 |
| meta | `text-on-active-hover` | selected+hover, selected+press | `active+hover`, `active+press` | 4.97 · 4.74 |

### ListCtrl row

Sits on: `mantle`, `base`

| Part | Token | States | Ground | Lowest, Mocha · Latte |
|---|---|---|---|---|
| label | `listctrl-label-fg` | rest | `base`, `mantle` | 9.26 · 5.14 |
| desc | `listctrl-desc-fg` | rest | `base`, `mantle` | 7.37 · 5.14 |
| icon | `listctrl-icon-fg` | rest | `base`, `mantle` | 7.37 · 5.14 |
| chevron | `listctrl-chevron-fg` | rest | `base`, `mantle` | 7.37 · 5.14 |
| divider | `listctrl-divider` | rest | `base`, `mantle` | no target |
| label | `listctrl-label-fg-active` | hover, selected | `base+hover`, `active`, `mantle+hover` | 4.62 · 5.40 |
| desc | `text-muted-raised` | hover, press | `base+hover`, `base+press`, `mantle+hover`, `mantle+press` | 5.10 · 5.01 |
| icon | `text-secondary` | hover, press | `base+hover`, `base+press`, `mantle+hover`, `mantle+press` | 6.41 · 3.92 |
| chevron | `text-secondary` | hover, press | `base+hover`, `base+press`, `mantle+hover`, `mantle+press` | 6.41 · 3.92 |
| label | `text-secondary-raised` | press | `base+press`, `mantle+press` | 6.41 · 5.01 |
| desc | `listctrl-part-fg-selected` | selected | `active` | 4.62 · 5.40 |
| icon | `listctrl-part-fg-selected` | selected | `active` | 4.62 · 5.40 |
| chevron | `listctrl-part-fg-selected` | selected | `active` | 4.62 · 5.40 |
| bar | `listctrl-selected-bar` | selected | `active` | 4.17 · 4.20 |
| label | `text-on-active-hover` | selected+hover, selected+press | `active+hover`, `active+press` | 4.97 · 4.74 |
| desc | `text-on-active-hover` | selected+hover, selected+press | `active+hover`, `active+press` | 4.97 · 4.74 |
| icon | `text-on-active` | selected+hover, selected+press, keyboard-active | `active+hover`, `active+press`, `active` | 3.43 · 4.21 |
| chevron | `text-on-active` | selected+hover, selected+press, keyboard-active | `active+hover`, `active+press`, `active` | 3.43 · 4.21 |
| label | `text-on-active` | keyboard-active | `active` | 4.62 · 5.40 |
| desc | `text-on-active` | keyboard-active | `active` | 4.62 · 5.40 |
| label | `text-disabled` | disabled | `base`, `mantle` | no target |
| desc | `text-disabled` | disabled | `base`, `mantle` | no target |
| icon | `text-disabled` | disabled | `base`, `mantle` | no target |

### Table row

Sits on: `mantle`, `base`

| Part | Token | States | Ground | Lowest, Mocha · Latte |
|---|---|---|---|---|
| cell | `table-row-fg` | rest | `base`, `mantle` | 9.26 · 5.14 |
| border | `table-border` | rest | `base`, `mantle` | no target |
| cell | `text-secondary-raised` | hover, press | `base+hover`, `base+press`, `mantle+hover`, `mantle+press` | 6.41 · 5.01 |
| cell | `table-row-fg-selected` | selected | `active` | 4.62 · 5.40 |
| cell | `text-on-active-hover` | selected+hover, selected+press | `active+hover`, `active+press` | 4.97 · 4.74 |

### Table header

Sits on: `mantle`

| Part | Token | States | Ground | Lowest, Mocha · Latte |
|---|---|---|---|---|
| label | `table-header-fg` | rest | `mantle` | 7.89 · 5.14 |

### Toast

Sits on: `crust`, `mantle`, `base`, `term`

| Part | Token | States | Ground | Lowest, Mocha · Latte |
|---|---|---|---|---|
| text | `toast-fg` | rest | `raised` | 8.69 · 5.17 |
| edge | `toast-border` | rest | `raised` | no target |
| accent.info | `toast-accent-info` | rest | `raised` | 8.08 · 4.86 |
| accent.success | `toast-accent-success` | rest | `raised` | 8.46 · 4.91 |
| accent.warning | `toast-accent-warning` | rest | `raised` | 9.89 · 5.24 |
| accent.danger | `toast-accent-danger` | rest | `raised` | 5.43 · 3.52 |
| accent.agent | `toast-accent-agent` | rest | `raised` | 6.19 · 3.51 |

### Tooltip

Sits on: `crust`, `mantle`, `base`, `raised`, `term`

| Part | Token | States | Ground | Lowest, Mocha · Latte |
|---|---|---|---|---|
| text | `tooltip-fg` | rest | `raised` | 7.10 · 5.17 |
| edge | `tooltip-border` | rest | `raised` | no target |

### HelpHint

Sits on: `crust`, `mantle`, `base`, `raised`

| Part | Token | States | Ground | Lowest, Mocha · Latte |
|---|---|---|---|---|
| glyph | `help-hint-color` | rest | `crust`, `mantle`, `base`, `raised` | 5.65 · 4.05 |

### Banner

Sits on: `crust`, `mantle`, `base`, `term`

| Part | Token | States | Ground | Lowest, Mocha · Latte |
|---|---|---|---|---|
| title | `banner-fg` | rest | `raised` | 8.69 · 5.17 |
| body | `banner-body-fg` | rest | `raised` | 5.65 · 5.17 |
| countdown | `banner-countdown-fg` | rest | `raised` | 5.65 · 5.17 |
| glyph | `banner-icon-fg` | rest | `raised` | 5.65 · 4.05 |
| edge | `banner-border` | rest | `raised` | no target |

### StatusDot

Sits on: `crust`, `mantle`, `base`, `raised`, `active`

| Part | Token | States | Ground | Lowest, Mocha · Latte |
|---|---|---|---|---|
| idle | `status-idle` | rest | `crust`, `mantle`, `base` | 3.36 · 4.26 |
| success | `accent-success-raised` | rest | `crust`, `mantle`, `base`, `raised` | 8.46 · 4.91 |
| warning | `accent-warning-glyph` | rest | `crust`, `mantle`, `base` | 12.91 · 3.41 |
| danger | `accent-danger` | rest | `crust`, `mantle`, `base`, `raised` | 5.43 · 3.52 |
| agent | `accent-agent` | rest | `crust`, `mantle`, `base`, `raised` | 6.19 · 3.51 |
| completion | `accent-primary` | rest | `crust`, `mantle`, `base`, `raised` | 5.97 · 3.18 |
| attached-ring | `accent-attached-raised` | rest | `crust`, `mantle`, `base`, `raised` | 7.03 · 5.31 |
| idle | `glyph-dim-raised` | rest | `raised` | 3.40 · 3.65 |
| warning | `accent-warning-raised` | rest | `raised` | 9.89 · 5.24 |
| idle | `text-on-active` | rest | `active` | 4.62 · 5.40 |
| success | `accent-success-on-active` | rest | `active` | 4.49 · 3.91 |
| warning | `accent-warning-on-active` | rest | `active` | 5.25 · 4.26 |
| danger | `accent-danger-on-active` | rest | `active` | 4.07 · 4.19 |
| agent | `accent-agent-on-active` | rest | `active` | 4.14 · 4.13 |
| completion | `accent-primary-on-active` | rest | `active` | 4.17 · 4.20 |
| attached-ring | `accent-attached-on-active` | rest | `active` | 4.10 · 4.21 |

### Spinner

Sits on: `crust`, `mantle`, `base`, `raised`

| Part | Token | States | Ground | Lowest, Mocha · Latte |
|---|---|---|---|---|
| indicator | `spinner-indicator` | rest | `crust`, `mantle`, `base`, `raised` | 7.86 · 5.89 |

**Track.** The arc and its motion say the work is running, and the arc holds 3:1. The track is an ornament with no grade: arc ink at 22%, 1.44 to 1.73 in Mocha and 1.33 to 1.44 in Latte. It carries the mark `data-ink-grade="none" data-ink-why="ornament"`, and `noGradeParts` in the file records it. It goes wherever the arc goes, `solid-hover` and `active` included. The `glyph-decorative` ban on `active` is about a separate ornament that reads as a second state. The track is inside the arc, in the arc's hue, so it adds none. Nothing else may lean on this.

### Progress

Sits on: `base`

| Part | Token | States | Ground | Lowest, Mocha · Latte |
|---|---|---|---|---|
| fill | `progress-fill-bg` | rest | `crust` | 8.91 · 3.71 |

### NotificationBadge.error

Sits on: `crust`, `mantle`, `base`, `raised`, `active`

| Part | Token | States | Ground | Lowest, Mocha · Latte |
|---|---|---|---|---|
| count | `notification-badge-error-fg` | rest | `fill-danger` | 8.10 · 5.43 |

### NotificationBadge.warning

Sits on: `crust`, `mantle`, `base`, `raised`, `active`

| Part | Token | States | Ground | Lowest, Mocha · Latte |
|---|---|---|---|---|
| count | `notification-badge-warning-fg` | rest | `fill-warning` | 14.76 · 5.03 |

### NotificationBadge.info

Sits on: `crust`, `mantle`, `base`, `raised`, `active`

| Part | Token | States | Ground | Lowest, Mocha · Latte |
|---|---|---|---|---|
| count | `notification-badge-info-fg` | rest | `fill-primary` | 8.91 · 4.91 |

### NotificationItem

Sits on: `base`

| Part | Token | States | Ground | Lowest, Mocha · Latte |
|---|---|---|---|---|
| title | `notification-item-title-fg` | rest | `base` | 11.34 · 7.06 |
| body | `notification-item-body-fg` | rest | `base` | 9.26 · 5.53 |
| meta | `notification-item-meta-fg` | rest | `base` | 7.37 · 5.53 |
| more | `notification-item-more-fg` | rest | `base` | 7.79 · 7.34 |
| glyph.error | `notification-item-error-glyph` | rest | `base` | 7.08 · 4.80 |
| glyph.warning | `notification-item-warning-glyph` | rest | `base` | 12.91 · 3.99 |
| glyph.info | `notification-item-info-glyph` | rest | `base` | 7.79 · 4.34 |
| unread | `notification-item-unread-dot` | rest | `base` | 7.79 · 4.34 |
| title | `text-primary` | hover | `base+hover` | 8.96 · 5.92 |
| body | `text-secondary-raised` | hover | `base+hover` | 7.32 · 5.92 |
| meta | `text-muted` | hover | `base+hover` | 5.82 · 4.64 |
| more | `accent-primary-raised` | hover | `base+hover` | 6.16 · 6.16 |
| glyph.error | `accent-danger` | hover | `base+hover` | 5.60 · 4.03 |
| glyph.warning | `accent-warning-glyph` | hover | `base+hover` | 10.20 · 3.35 |
| glyph.info | `accent-primary` | hover | `base+hover` | 6.16 · 3.64 |
| unread | `accent-primary` | hover | `base+hover` | 6.16 · 3.64 |
| title | `notification-item-fg-selected` | selected | `active` | 4.62 · 5.40 |
| body | `notification-item-fg-selected` | selected | `active` | 4.62 · 5.40 |
| meta | `notification-item-fg-selected` | selected | `active` | 4.62 · 5.40 |
| more.selected | `notification-item-fg-selected` | selected | `active` | 4.62 · 5.40 |
| glyph.error | `accent-danger-on-active` | selected, selected+hover, selected+press | `active`, `active+hover`, `active+press` | 3.03 · 3.26 |
| glyph.warning | `accent-warning-on-active` | selected, selected+hover, selected+press | `active`, `active+hover`, `active+press` | 3.91 · 3.32 |
| glyph.info | `accent-primary-on-active` | selected, selected+hover, selected+press | `active`, `active+hover`, `active+press` | 3.10 · 3.27 |
| unread | `notification-item-unread-dot-selected` | selected | `active` | 4.17 · 4.20 |
| title | `text-on-active-hover` | selected+hover, selected+press | `active+hover`, `active+press` | 4.97 · 4.74 |
| body | `text-on-active-hover` | selected+hover, selected+press | `active+hover`, `active+press` | 4.97 · 4.74 |
| meta | `text-on-active-hover` | selected+hover, selected+press | `active+hover`, `active+press` | 4.97 · 4.74 |
| more.selected | `text-on-active-hover` | selected+hover, selected+press | `active+hover`, `active+press` | 4.97 · 4.74 |
| unread | `accent-primary-on-active` | selected+hover, selected+press | `active+hover`, `active+press` | 3.10 · 3.27 |

### NotificationSummary

Sits on: `mantle`

| Part | Token | States | Ground | Lowest, Mocha · Latte |
|---|---|---|---|---|
| label | `notification-summary-label-fg` | rest | `mantle` | 9.91 · 5.14 |
| meta | `notification-summary-meta-fg` | rest | `mantle` | 7.89 · 5.14 |
| label | `text-secondary-raised` | hover, press | `mantle+hover`, `mantle+press` | 6.94 · 5.01 |
| meta | `text-muted-raised` | hover, press | `mantle+hover`, `mantle+press` | 5.52 · 5.01 |

### PendingIndicator

Sits on: `crust`, `mantle`, `base`, `term`

| Part | Token | States | Ground | Lowest, Mocha · Latte |
|---|---|---|---|---|
| label | `pending-indicator-fg` | rest | `raised` | 7.10 · 5.17 |
| time | `pending-indicator-time-fg` | rest | `raised` | 8.69 · 5.17 |
| sep | `pending-indicator-sep-fg` | rest | `raised` | 5.65 · 5.17 |

### CenterState

Sits on: `crust`, `mantle`, `base`

| Part | Token | States | Ground | Lowest, Mocha · Latte |
|---|---|---|---|---|
| glyph | `center-state-glyph-fg` | rest | `crust`, `mantle`, `base` | 3.36 · 4.26 |
| error | `center-state-error-fg` | rest | `crust`, `mantle`, `base` | 7.08 · 4.10 |
| title | `center-state-title-fg` | rest | `crust`, `mantle`, `base` | 9.26 · 4.73 |
| sub | `center-state-sub-fg` | rest | `crust`, `mantle`, `base` | 7.37 · 4.73 |

### CodeArea

Sits on: `crust`, `mantle`, `base`

| Part | Token | States | Ground | Lowest, Mocha · Latte |
|---|---|---|---|---|
| code | `text-primary` | rest | `field` | 8.69 · 7.06 |
| error | `codearea-error-fg` | rest | `field` | 5.43 · 6.55 |
| edge | `border-control` | rest | `crust`, `mantle`, `base` | 3.36 · 3.29 |

### CodeArea gutter

Sits on: `field`

| Part | Token | States | Ground | Lowest, Mocha · Latte |
|---|---|---|---|---|
| number | `codearea-gutter-fg` | rest | `mantle` | 7.89 · 5.14 |

### DrillDown back bar

Sits on: `crust`, `mantle`, `base`

| Part | Token | States | Ground | Lowest, Mocha · Latte |
|---|---|---|---|---|
| title | `drilldown-title-fg` | rest | `crust`, `mantle`, `base` | 11.34 · 6.04 |
| border | `drilldown-backbar-border` | rest | `crust`, `mantle`, `base` | no target |

### Title bar

Sits on: `crust`

| Part | Token | States | Ground | Lowest, Mocha · Latte |
|---|---|---|---|---|
| title | `titlebar-fg` | rest | `crust` | 10.59 · 4.73 |
| button | `titlebar-button-fg` | rest | `crust` | 8.42 · 4.73 |
| button | `titlebar-button-fg-hover` | hover, press | `crust+hover`, `crust+press` | 9.31 · 4.62 |

### Title bar (inactive)

Sits on: `mantle`

| Part | Token | States | Ground | Lowest, Mocha · Latte |
|---|---|---|---|---|
| title | `titlebar-fg-inactive` | rest | `mantle` | 7.89 · 5.14 |
| button | `titlebar-button-fg` | rest | `mantle` | 7.89 · 5.14 |
| button | `titlebar-button-fg-hover` | hover, press | `mantle+hover`, `mantle+press` | 8.50 · 5.01 |

### Window close button

Sits on: `crust`, `mantle`

| Part | Token | States | Ground | Lowest, Mocha · Latte |
|---|---|---|---|---|
| glyph | `titlebar-close-hover-fg` | rest | `fill-close` | 5.66 · 5.66 |

### Sidebar category band

Sits on: `mantle`

| Part | Token | States | Ground | Lowest, Mocha · Latte |
|---|---|---|---|---|
| label | `sidebar-category-header-fg` | rest | `crust` | 10.59 · 4.73 |
| count | `sidebar-category-header-count-fg` | rest | `crust` | 5.07 · 4.73 |

### Workspace row

Sits on: `mantle`

| Part | Token | States | Ground | Lowest, Mocha · Latte |
|---|---|---|---|---|
| label | `text-secondary` | rest | `mantle` | 9.91 · 5.14 |
| mirror | `workspace-mirror-fg` | rest | `mantle` | 11.29 · 6.17 |
| dot | `status-idle` | rest | `mantle` | 3.59 · 4.64 |
| label | `text-secondary-raised` | hover, press | `mantle+hover`, `mantle+press` | 6.94 · 5.01 |
| mirror | `accent-remote-raised` | hover, press | `mantle+hover`, `mantle+press` | 7.90 · 4.70 |
| dot | `glyph-dim-raised` | hover, press | `mantle+hover`, `mantle+press` | 3.33 · 3.54 |
| label | `text-on-active` | selected | `active` | 4.62 · 5.40 |
| mirror | `workspace-mirror-fg-active` | selected | `active` | 4.29 · 3.90 |
| dot | `text-on-active` | selected, selected+hover, selected+press | `active`, `active+hover`, `active+press` | 3.43 · 4.21 |
| label | `text-on-active-hover` | selected+hover, selected+press | `active+hover`, `active+press` | 4.97 · 4.74 |
| mirror | `accent-remote-on-active` | selected+hover, selected+press | `active+hover`, `active+press` | 3.19 · 3.04 |

### Status bar

Sits on: `crust`, `mantle`

| Part | Token | States | Ground | Lowest, Mocha · Latte |
|---|---|---|---|---|
| label | `text-muted` | rest | `crust`, `mantle` | 7.89 · 4.73 |
| glyph | `statusbar-glyph` | rest | `crust`, `mantle` | 3.59 · 4.26 |

### Address bar

Sits on: `mantle`

| Part | Token | States | Ground | Lowest, Mocha · Latte |
|---|---|---|---|---|
| pending | `md-address-pending-fg` | rest | `mantle` | 9.91 · 5.14 |
| error | `html-address-error-glyph` | rest | `mantle` | 7.58 · 4.46 |

### Modifier hint row

Sits on: `base`

| Part | Token | States | Ground | Lowest, Mocha · Latte |
|---|---|---|---|---|
| text | `text-secondary` | rest | `base` | 9.26 · 5.53 |
| empty | `modhint-empty-fg` | rest | `base` | 7.37 · 5.53 |
| grip | `modhint-grip-fg` | rest | `base` | 3.36 · 4.99 |

### Modifier hint role row

Sits on: `base`

| Part | Token | States | Ground | Lowest, Mocha · Latte |
|---|---|---|---|---|
| text | `modhint-role-text-fg` | rest | `active` | 4.62 · 5.40 |
| glyph | `modhint-role-fg` | rest | `active` | 4.17 · 4.20 |

### DAG node

Sits on: `base`

| Part | Token | States | Ground | Lowest, Mocha · Latte |
|---|---|---|---|---|
| title | `dag-node-fg` | rest | `raised` | 8.69 · 5.17 |
| meta | `dag-node-meta-fg` | rest | `raised` | 5.65 · 5.17 |
| edge | `dag-node-border` | rest | `raised` | no target |
| title | `text-on-active` | hover | `raised+hover` | 6.82 · 6.36 |
| meta | `text-on-active` | hover | `raised+hover` | 6.82 · 6.36 |
| edge | `border-strong` | hover | `raised+hover` | no target |

### DAG node.running

Sits on: `base`

| Part | Token | States | Ground | Lowest, Mocha · Latte |
|---|---|---|---|---|
| title | `text-on-active` | rest | `dag-running` | 6.35 · 6.32 |
| meta | `dag-node-meta-status-fg` | rest | `dag-running` | 6.35 · 6.32 |
| status | `dag-status-running-label` | rest | `dag-running` | 4.92 · 4.92 |
| glyph | `dag-status-running` | rest | `dag-running` | 4.36 · 4.49 |

### DAG node.failed

Sits on: `base`

| Part | Token | States | Ground | Lowest, Mocha · Latte |
|---|---|---|---|---|
| title | `text-on-active` | rest | `dag-failed` | 7.05 · 6.32 |
| meta | `dag-node-meta-status-fg` | rest | `dag-failed` | 7.05 · 6.32 |
| status | `dag-status-failed-label` | rest | `dag-failed` | 5.47 · 4.90 |
| glyph | `dag-status-failed` | rest | `dag-failed` | 4.41 · 4.01 |

### DAG node.unknown

Sits on: `base`

| Part | Token | States | Ground | Lowest, Mocha · Latte |
|---|---|---|---|---|
| title | `text-primary` | rest | `dag-unknown` | 6.62 · 4.87 |
| meta | `dag-node-meta-status-fg` | rest | `dag-unknown` | 6.62 · 7.13 |
| status | `dag-status-unknown-label` | rest | `dag-unknown` | 7.54 · 5.61 |
| glyph | `dag-status-unknown` | rest | `dag-unknown` | 7.54 · 4.93 |

### DAG node.partially-failed

Sits on: `base`

| Part | Token | States | Ground | Lowest, Mocha · Latte |
|---|---|---|---|---|
| title | `text-primary` | rest | `dag-partial` | 6.77 · 4.68 |
| meta | `dag-node-meta-status-fg` | rest | `dag-partial` | 6.77 · 6.85 |
| status | `dag-status-partially-failed-label` | rest | `dag-partial` | 5.53 · 5.88 |
| glyph | `dag-status-partially-failed` | rest | `dag-partial` | 5.53 · 4.62 |

### DAG node.awaiting

Sits on: `base`

| Part | Token | States | Ground | Lowest, Mocha · Latte |
|---|---|---|---|---|
| title | `text-primary` | rest | `dag-awaiting` | 6.30 · 4.82 |
| meta | `dag-node-meta-status-fg` | rest | `dag-awaiting` | 6.30 · 7.05 |
| status | `dag-phase-awaiting-label` | rest | `dag-awaiting` | 7.17 · 5.56 |
| glyph | `dag-phase-awaiting` | rest | `dag-awaiting` | 7.17 · 5.56 |

### DAG runner badge.stalled

Sits on: `base`

| Part | Token | States | Ground | Lowest, Mocha · Latte |
|---|---|---|---|---|
| label | `dag-runner-stalled-fg` | rest | `dag-stalled` | 7.54 · 5.61 |

### DAG runner badge.crashed

Sits on: `base`

| Part | Token | States | Ground | Lowest, Mocha · Latte |
|---|---|---|---|---|
| label | `dag-runner-crashed-fg` | rest | `dag-crashed` | 5.47 · 4.90 |

### DAG cycle notice

Sits on: `base`

| Part | Token | States | Ground | Lowest, Mocha · Latte |
|---|---|---|---|---|
| label | `dag-cycle-fg` | rest | `dag-cycle` | 8.90 · 7.26 |

### Approval danger box

Sits on: `base`

| Part | Token | States | Ground | Lowest, Mocha · Latte |
|---|---|---|---|---|
| text | `approval-danger-fg` | rest | `approval` | 9.18 · 5.80 |

### Plugin avatar

Sits on: `mantle`, `base`

| Part | Token | States | Ground | Lowest, Mocha · Latte |
|---|---|---|---|---|
| initial | `plugin-avatar-fg` | rest | `tint-avatar` | 4.75 · 4.82 |

### Tint box.success

Sits on: `mantle`, `base`, `raised`

| Part | Token | States | Ground | Lowest, Mocha · Latte |
|---|---|---|---|---|
| text | `text-primary` | rest | `tint-success@mantle`, `tint-success@base`, `tint-success@raised` | 6.52 · 4.70 |
| ink | `accent-success-raised` | rest | `tint-success@mantle`, `tint-success@base` | 8.26 · 5.55 |
| glyph | `accent-success-raised` | rest | `tint-success@mantle`, `tint-success@base`, `tint-success@raised` | 6.35 · 4.46 |
| ink | `accent-success-strong` | rest | `tint-success@raised` | 6.35 · 5.57 |

### Tint box.warning

Sits on: `mantle`, `base`, `raised`

| Part | Token | States | Ground | Lowest, Mocha · Latte |
|---|---|---|---|---|
| text | `text-primary` | rest | `tint-warning@mantle`, `tint-warning@base`, `tint-warning@raised` | 6.30 · 4.82 |
| ink | `accent-warning-raised` | rest | `tint-warning@mantle`, `tint-warning@base`, `tint-warning@raised` | 7.17 · 4.88 |
| glyph | `accent-warning-glyph` | rest | `tint-warning@mantle`, `tint-warning@base` | 9.37 · 3.39 |
| glyph | `accent-warning-raised` | rest | `tint-warning@raised` | 7.17 · 4.88 |

### Tint box.danger

Sits on: `mantle`, `base`, `raised`

| Part | Token | States | Ground | Lowest, Mocha · Latte |
|---|---|---|---|---|
| text | `text-primary` | rest | `tint-danger@mantle`, `tint-danger@base` | 9.18 · 5.41 |
| ink | `accent-danger-raised` | rest | `tint-danger@mantle`, `tint-danger@base` | 5.74 · 5.02 |
| glyph | `accent-danger` | rest | `tint-danger@mantle`, `tint-danger@base` | 5.74 · 3.68 |
| text | `text-on-active` | rest | `tint-danger@raised` | 7.05 · 6.32 |
| ink | `accent-danger-strong` | rest | `tint-danger@raised` | 5.47 · 4.90 |
| glyph | `accent-danger-raised` | rest | `tint-danger@raised` | 4.41 · 4.01 |

### Tint box.info

Sits on: `mantle`, `base`, `raised`

| Part | Token | States | Ground | Lowest, Mocha · Latte |
|---|---|---|---|---|
| text | `text-primary` | rest | `tint-info@mantle`, `tint-info@base`, `tint-info@raised` | 6.57 · 4.76 |
| ink | `accent-info-raised` | rest | `tint-info@mantle`, `tint-info@base` | 7.95 · 5.55 |
| glyph | `accent-info-raised` | rest | `tint-info@mantle`, `tint-info@base`, `tint-info@raised` | 6.11 · 4.47 |
| ink | `accent-info-strong` | rest | `tint-info@raised` | 6.11 · 5.74 |

### Terminal

Sits on: `term`

| Part | Token | States | Ground | Lowest, Mocha · Latte |
|---|---|---|---|---|
| default ink | `surface-terminal-focused-fg` | rest | `term` | 14.52 · 7.99 |

### Terminal (unfocused)

Sits on: `base`

| Part | Token | States | Ground | Lowest, Mocha · Latte |
|---|---|---|---|---|
| default ink | `surface-terminal-unfocused-fg` | rest | `base` | 7.37 · 5.53 |

### Surface focus edge

Sits on: `crust`, `mantle`, `base`, `term`

| Part | Token | States | Ground | Lowest, Mocha · Latte |
|---|---|---|---|---|
| edge | `surface-focus-edge-unfocused` | rest | `crust`, `mantle`, `base`, `term` | no target |
| edge | `surface-focus-edge-focused` | focus | `crust`, `mantle`, `base`, `term` | 9.26 · 4.73 |

In this contract `rest` is unfocused and `focus` is focused.

### Markdown document

Sits on: `crust`

| Part | Token | States | Ground | Lowest, Mocha · Latte |
|---|---|---|---|---|
| body | `md-doc-fg` | rest | `crust` | 10.59 · 4.73 |
| quote | `md-quote-fg` | rest | `crust` | 8.42 · 4.73 |

### Markdown table

Sits on: `crust`

| Part | Token | States | Ground | Lowest, Mocha · Latte |
|---|---|---|---|---|
| cell | `md-table-cell-fg` | rest | `base` | 9.26 · 5.53 |

### Markdown table header

Sits on: `crust`

| Part | Token | States | Ground | Lowest, Mocha · Latte |
|---|---|---|---|---|
| cell | `md-table-header-fg` | rest | `raised` | 8.69 · 5.17 |

### Scrollbar

Sits on: `crust`, `mantle`, `base`, `raised`, `term`

| Part | Token | States | Ground | Lowest, Mocha · Latte |
|---|---|---|---|---|
| thumb | `scrollbar-thumb` | rest | `crust`, `mantle`, `base`, `term` | 3.36 · 3.29 |
| thumb | `scrollbar-thumb-raised` | rest | `raised` | 3.40 · 3.65 |

## 10. Layout

Inside the fixed limits: 4px grid, UI type 14px or less, borders 1px, radius 4px with 2px for tiny inner parts. Heights are `control-height` families. Weights are 400, 500, 600.

| Place | Height | Inset | Icon | Type | Align | Long text |
|---|---|---|---|---|---|---|
| Title bar | `titlebar-height` 36px | - | `titlebar-window-button-size` 24px | Body, secondary ink | Left or centered by OS | Ellipsis, right end |
| Tab bar | `tab-height` 24px | `tab-padding-x` 8px | `tab-icon-size` 14px | Body | Left | Ellipsis in the fixed tab-width |
| Sidebar tree row | `tree-row-height` 22px | `workspace-row-padding-x` 8px | `icon-size-sm` 14px | Body | Left | Ellipsis |
| Sidebar category band | `tree-row-height` 22px | `sidebar-category-header-pad-x` 8px | `icon-size-xs` 12px | Caption, 600 | Left, count right | Ellipsis |
| Status bar | `status-bar-height` 24px | `space-sm` 8px | `statusbar-glyph-size` 12px | Caption | Left and right groups | Items drop by the collapse order |
| Surface focus edge | `surface-focus-edge-width` 2px | - | - | - | Full leaf width, top of the leaf | - |
| Address bar | `html-address-bar-height` 40px | `html-address-bar-padding-x` 8px | `icon-size-sm` 14px | Body in a 28 field | Center | Middle of path, then Forward drops |
| In-surface toolbar | `toolbar-height` 32px | `space-sm` 8px | `icon-size-md` 16px | Body | Center | Items fold into More |
| Menu row | `menu-item-height` 28px | `menu-item-padding-x` 12px | `icon-size-sm` 14px | Body, shortcut micro | Left, shortcut right | Wraps only for fixed copy over max width |
| Control | `control-height` 28px | `button-padding-x` 12px | `icon-size-md` 16px | Body, 500 on Button | Center | Ellipsis |
| Small control | `button-height-sm` 24px | `space-sm` 8px | `icon-size-xs` 12px | Body | Center | Ellipsis |
| Table cell | `table-cell-height` 28px | `table-cell-padding-x` 12px | `icon-size-sm` 14px | Body mono, header caption 500 | Left, numbers right | Ellipsis |
| ListCtrl row | `listctrl-row-min-height` 36px | `listctrl-row-padding-x` 12px | `icon-size-md` 16px | Body, detail caption | Left, chevron right | Ellipsis on each line |
| Settings row | `settings-row-min-height` 32px | `space-lg` 16px | `icon-size-sm` 14px | Body, caption under | Label left, control right, stacks when narrow | Label wraps |
| Popup title | `popup-title-btn-size` 24px | `popup-title-edge-inset` 4px | `icon-size-sm` 14px | Body 600 | Left, buttons right | Ellipsis |
| Modal body | - | `popup-content-margin` 4px | `icon-size-md` 16px | Body | Top left | Wraps |
| Toast | `toast-min-height` 28px | `toast-padding-x` 12px | `icon-size-md` 16px | Body, hint micro | Left | Wraps to toast-max-width |
| Tooltip | - | `tooltip-padding-x` 8px | - | Caption | Left | Wraps to tooltip-max-width |
| Banner | - | `banner-padding-x` 12px | `icon-size-md` 16px | Body title, caption body | Left, actions right, wraps under when narrow | Wraps |
| Modifier hint row | `modhint-row-min-height` 24px | `space-sm` 8px | `icon-size-sm` 14px | Caption | Left | Ellipsis |
| Notification item | - | `notification-item-pad-x` 12px | `notification-item-glyph-size` 14px | Body title, caption body, micro meta | Top left | Clamps to notification-item-body-lines |
| File picker row | `tree-row-height` 22px | `fp-inset-start` 12px | `icon-size-sm` 14px | Body, mono micro meta | Left, size and date right | Ellipsis |
| DAG row | `dag-row-height` 36px | `listctrl-row-padding-x` 12px | `icon-size-md` 16px | Body, caption | Left | Ellipsis |
| Keycap, Tag, Badge | `kbd-size` 16px | `tag-padding-x` 8px | - | Micro | Center | No wrap, no ellipsis in keycaps |

**Density.** One density. The UI scale multiplies it as a whole, except hairlines and fixed host chrome, which stay outside the scale.

**One role, different values, on purpose:**

| Role | Values | Why |
|---|---|---|
| Row height | tree 22, table 28, menu 28, settings 32, ListCtrl 36 | Tree is one line in a long list. A menu row is a pointer target. Settings holds a 28 control and 2px of air. ListCtrl holds two lines. |
| Progress bar | `progress-height` 4, `explorer-progress-height` 2 | A popup progress is the content. The Explorer one sits on the status line. |
| Modifier hint row | `modhint-row-min-height` 24, `modhint-empty-row-min-height` 20 | The empty row has no keycap to clear. |
| Status dot | `status-dot-size` 8, `status-dot-size-compact` 6 | 6 is for 24px chrome. Same meaning, smaller footprint. |
| Selection edge | `selection-edge-width` 2 | One value now. `toast-accent-width` moved from 3 to `tint-edge-width` 2. |

**Values moved onto the grid in this change:** `banner-radius` 8 → 4, `kbd-gap` 3 → 4, `transfer-pad-x` 14 → 12, `transfer-body-gap` 10 → 8, `transfer-footer-pad-y` 10 → 8, `transfer-well-pad-x` 10 → 12, `preset-cfg-footer-padding-x` 14 → 12, `modhint-row-gap` 6 → 8, `image-popup-pad-x` 14 → 12, `image-popup-gap` 10 → 8, `image-path-row-gap` 6 → 8, `explorer-props-padding-x` 14 → 12, `toast-accent-width` 3 → 2.

## 11. User themes and plugins

**Theme files.** A theme file can override these sections, and no others:

| Section | Keys |
|---|---|
| `palette` | `crust`, `mantle`, `base`, `surface0`, `surface1`, `surface2`, `overlay0`, `overlay1`, `overlay2`, `text`, `subtext1`, `subtext0`, `placeholder` |
| `accent` | `blue`, `green`, `red`, `yellow`, `peach`, `mauve`, `teal`, `sky`, `lavender`, `flamingo`, `pink`, `maroon`, `rosewater` |
| `terminal` | `selection_bg`, `vi_cursor_bg`, `search_match_bg`, `search_match_active_bg`, `search_match_active_fg` |
| `ansi` | The terminal colors. |
| `surfaces` | A color per surface kind. The surface focus edge has no key here: it follows `subtext1` and `mantle`, and no manifest color reaches it. |

No section sets a semantic or component token directly.

**The rules and the contrast grades apply to the built-in themes, Mocha and Latte, and to nothing else.** A user theme gets no contrast guarantee, no check and no warning. The app does not block it, warn about it or correct its colors. A theme with every color set to white applies like any other.

What carries over to a user theme is only the structure of token choice: each cell of the table still names the same token, and the theme changes what that token resolves to. That says nothing about whether the result is readable. The bands (`-raised`, `-strong`, `-on-active`) mix from the palette and accents, so they move with the override and are not re-fitted.

**Plugins.** Nothing in the SDK enforces token use. An `egui-mesh` plugin drives egui in its own process and sends the tessellated result to the host, so it can technically paint raw colors. Taking colors and spacing from the Theme tokens the host passes is a documented promise. So the rules split by who can keep the promise:

| What is drawn | Status | How it holds |
|---|---|---|
| Host chrome around a plugin: tab, address bar, frame, banner, menu, surface focus edge | In the rules | The host draws it. |
| Bundled `egui-mesh` plugin UI | In the rules, by promise | Not enforced at run time. Bundled sources have no raw color call today (`Color32::from_*`, `from_rgb`, tests excluded). A source check can hold that. |
| Third-party `egui-mesh` plugin pixels | Exception | The host cannot check them. A plugin that takes its colors from the host's Theme tokens follows the table, and one that does not is content. |
| `html` page | Exception | Webview content, like a web page. |
| `markdown` document | In the rules, except code highlight | Rendered in a webview. The table covers its `md-*` tokens. The frame around it is host chrome. |
| `tag-*` source chip, plugin avatar, plugin dots | In the rules | They read their normal contracts. |

## 12. Exceptions

| Target | Gallery id | Why |
|---|---|---|
| `ansi-*` | `ansi-content` | Terminal content. The running program picks the color. |
| `terminal cell attributes` | `terminal-attributes` | Reverse video, bold and SGR colors come from the program. |
| `html page content` | `html-page` | A web page paints itself. |
| `plugin webview content` | `plugin-webview` | Same as a web page. Host chrome around it stays in the rules. |
| `third-party egui-mesh plugin pixels` | `third-party-plugin` | The plugin tessellates in its own process, so the host cannot check its colors. Using the host Theme tokens is a documented promise. Bundled plugins stay in the rules. |
| `image surface content` | `image-content` | The file is the content. |
| `markdown code highlight` | `code-highlight` | Content colors from the highlighter. The block fill stays in the rules. |
| `brand-melon-*` | `brand` | Logo artwork. |
| `titlebar-traffic-*, accent-macos-*` | `os-window-controls` | OS window controls keep OS colors. |
| `state-dim-opacity, banner-recessed-opacity` | `dimmed` | A list behind an open editor or a banner behind another banner is inert and comes back. Anything a user still reads or selects takes an ink with a grade, not opacity. |
| `content under scrim` | `under-scrim` | Inert while the modal is open. |
| `dag-canvas-dot` | `decorative-grid` | Decorative grid. The canvas reads without it. |
| `titlebar-csd-radius` | not contrast | Window corner follows the OS window shape, 8px. |
| `font-size-brand-*, font-size-prose-h1, font-size-term*` | not contrast | Brand, rendered content and terminal cell are outside the 14px UI cap. |
| `control-height-tree 22` | not contrast | The tree row is the one off-grid height. It is the system constant. |

Token classes in the file: 180 grounds, 378 foregrounds, 97 borders, 86 exceptions, 740 non-color. Exceptions include the primitive color values, which UI never reads.

Disabled ink and ornaments are not exceptions. Their grade is none.

Before an exception or a no-grade mark goes on anything, ask: is this inert, decorative or program output, or does a user read it to act? Text a user reads to act is measured, including a command to approve, a file name, a reason, a progress word and a value in effect.

## 13. Changing the rules

When a new UI needs a cell that is forbidden or missing:

1. Do not pick a value in the widget. Ask for the change with a design request.
2. The designer adds the ground, role or cell. New values are new tokens. A token is never renamed or removed.
3. The designer updates `ground-ink-rules.json` in the same commit as the tokens. Every new token gets a class.
4. Recompute every cell in both themes. Below grade or unclassified means it is not finished.
5. Add the case to `gallery/rules/index.jsx` if it is a new ground, and to `gallery/rules-map/index.jsx` if it is a new nesting.
6. Record it in the commit message.

A new exception follows the same path and needs a reason a reader can check. "It looks better" is not a reason.

## 14. Gallery check

The gallery is the canon the app follows, and the check reads it rendered, in Mocha and in Latte, as `gallery/README.md` lays out.

- **A frozen state cell** carries `data-contract`, `data-state` and `data-host`, one for each component, state and host in the file. A row with no cell on any page fails. So does a cell whose ink is not the row's token, and a cell below the row's grade.
- **Everything else on a gallery page** is measured too: text at 4.5, glyphs at 3. Opacity is composited into the ink. It never excludes anything.
- **Ground scope.** A specimen names a role, such as `text-muted`, and sits on a ground. `gallery/parts/specimen.css` re-points the role tokens inside a `surface-raised`, `surface-active`, `surface-hover` or hover-wash fill to the [matrix](#6-matrix) cell for that ground. It mirrors the matrix, it does not widen it. The app has no scope: it reads the cell directly. Frozen state cells are outside the scope, they read the row token.
- **`data-audit-exempt="<id>"`** skips one subtree. The id is the Gallery id in [section 12](#12-exceptions). No other value passes, and the check lists every use.
- **`data-ink-grade="none" data-ink-why="disabled|ornament"`** marks a disabled ink or an ornament outside a state cell. These are not exceptions: [section 12](#12-exceptions) says their grade is none. The check still confirms a disabled ink is `text-disabled` or a token whose role has no grade.

## 15. Site pages

The site's landing, guide and design pages use the same grounds, roles and table as the app. `site` in `tokens/ground-ink-rules.json` holds the same content as this section, with a selector on every row. A place not listed here takes its cell from [the table](#6-ground-by-role). This applies to Mocha and Latte only.

**Grades.** Text 4.5. Display text, at 24px and over or 18.66px bold and over, may use 3, because the site is not capped at 14px. No place relies on it. Non-text 3.

**How to read a ground.** Page: `base`. Header, footer, table head: `mantle`. Sidebar: `base`, `mantle` in the drawer below 900px. These are the app's grounds, with the app's cells. Translucency that lets page content under an ink is not used: the header is opaque.

**The brand on a page.**

- The mark keeps its colors, through `brand-melon-*`. Exception id `brand`. The wordmark dot is the mark, not text: the word reads without it.
- `brand-ink` is the brand hue as text or a glyph. It is the flesh in Mocha and `color-melon-flesh-deep` in Latte: the same hue, deepened without going through black, so it reads as melon and not brick. It holds 4.5 on `crust`, `mantle` and `base`. On `raised` it holds 3, for a glyph only.
- The call to action keeps the flesh as its ground in both themes, and its label is the seed: `brand-on-fill`, as in the mark. Hover and press are tints of the same flesh. Rind is not a hover ground, the label reads 3.66 on it.
- A gradient has two ends. Measure the ink at both, take the lower. The closing band is the only one painted. The glow behind the landing window is covered by the window and is not a ground.

**Code blocks.** One dark palette in both themes, from `code-fixed-*`. A comment is read to act, so it takes `site-code-comment` and a grade. The other highlighter inks stay under the `code-highlight` exception.

**Inline code.** A chip reads `site-inline-code`, with a 1px `border-default` edge. Mocha keeps `raised`. In Latte `raised` is darker than a page of running text wants, so the chip steps back to `mantle`.

**Figures of the app.** A terminal figure or window mock on a page is drawn by the page, not by a program, so the `ansi-content` exception does not cover it. Its lines read the text cells for `term` and `base`.

**Links.** A link reads `accent-primary-raised`. In running text it also takes an underline at rest, because in Latte that ink is too close to body text to tell apart by lightness. In a note it takes body ink and the underline, because a second hue on a tint is forbidden.

**Notes.** The guide's translation notice is a `.note`: warning tint when a translation is stale, primary tint with `.note--untranslated` when there is none. It has no lead word and no hue edge. A link in it takes body ink and an underline.

**Skip link.** Hidden until keyboard focus. Then it sits at the top left over the header, on its own `base` fill with a 1px edge and the link ink, and the focus ring goes around that.

**Tables.** Every table in a guide page sits in `.table-wrap`: the 1px frame, the `mantle` head and the sideways scroll on a narrow screen.

**Guideline documents.** A card at `guidelines/*.html` is a document of its own markup, so it has no row here and reads the table by its grounds. A level or a button in a card takes the ink of that ground, not the ink of the page. A terminal in a card reads `surface-terminal-focused-bg`, black in Mocha and white in Latte, and the `term` cells. A word in `text-disabled` carries `data-ink-grade="none" data-ink-why="disabled"`.

### Site grounds

| ID | Token | Mocha | Latte | Used for |
|---|---|---|---|---|
| `site-cta` | `site-cta-bg` | #f25d6b | #f25d6b | Primary call to action, guide figure labels. |
| `site-cta+hover` | `site-cta-bg-hover` | #f36a77 | #f36a77 | Pointer over the call to action. |
| `site-cta+press` | `site-cta-bg-press` | #f4707d | #f4707d | Press on the call to action. |
| `site-code` | `site-code-bg` | #24292e | #24292e | Code block. One dark palette in both themes. |
| `site-inline-code` | `site-inline-code-bg` | #313244 | #e6e9ef | Inline code chip. Raised in Mocha, mantle in Latte. |
| `site-quote` | `site-quote-bg` | #2b2232 | #efe8ed | Block quote. |
| `site-tile-hover` | `site-tile-hover-bg` | #2b2232 | #efe8ed | Pointer over a design home tile. |
| `site-card-icon` | `site-card-icon-bg` | #3c2737 | #efdce2 | Icon box on a landing card. |
| `site-band` | `site-band-glow` | #372635 | #efdfe4 | Closing band. A radial glow over base, so it has two ends. values is the strong end. |

### Places

Contrast is the lowest across the row's grounds.

| Place | Selector | Grounds | Role | Token | Mocha · Latte |
|---|---|---|---|---|---|
| Header band: brand and current link | `.brand, .site-nav a[aria-current]` | `mantle` | `text-body` | `text-primary` | 12.14 · 6.57 |
| Version chip | `.brand__version` | `raised` | `text-muted` | `text-muted-raised` | 5.65 · 5.17 |
| Header link | `.site-nav a` | `mantle` | `text-muted` | `text-muted` | 7.89 · 5.14 |
| Header link, pointer over | `.site-nav a:hover` | `raised` | `text-body` | `text-primary` | 8.69 · 5.17 |
| Header icon button | `.icon-btn` | `mantle` | `glyph` | `text-secondary` | 9.91 · 5.14 |
| Header icon button, pointer over | `.icon-btn:hover` | `raised` | `glyph` | `text-secondary-raised` | 7.10 · 5.17 |
| Language switch | `.lang-switch a` | `mantle` | `text-muted` | `text-muted` | 7.89 · 5.14 |
| Language switch, pointer over | `.lang-switch a:hover` | `raised` | `text-body` | `text-primary` | 8.69 · 5.17 |
| Language switch, current | `.lang-switch a[aria-current]` | `solid-hover` | `text-body` | `text-on-active` | 6.31 · 6.43 |
| Search value | `.search input` | `base` | `text-body` | `text-primary` | 11.34 · 7.06 |
| Search placeholder | `.search input::placeholder` | `base` | `text-placeholder` | `text-placeholder` | 7.37 · 5.53 |
| Search field edge | `.search input` | `mantle` | `border-control` | `border-control` | 3.59 · 3.58 |
| Search icon | `.search__icon` | `base` | `glyph-dim` | `glyph-dim` | 3.36 · 4.99 |
| Search result | `.search__results a` | `mantle` | `text-body` | `text-primary` | 12.14 · 6.57 |
| Search result path | `.search__results .r-crumb` | `mantle` | `text-muted` | `text-muted` | 7.89 · 5.14 |
| Search result path, active | `.search__results a[data-active] .r-crumb` | `raised` | `text-muted` | `text-muted-raised` | 5.65 · 5.17 |
| Sidebar group | `.nav-section > summary` | `base`, `mantle` | `text-secondary` | `text-secondary` | 9.26 · 5.14 |
| Sidebar group caret | `.nav-section > summary::before` | `base`, `mantle` | `glyph-dim` | `glyph-dim` | 3.36 · 4.64 |
| Sidebar group caret, pointer over | `.nav-section > summary:hover::before` | `raised` | `glyph-dim` | `glyph-dim-raised` | 3.40 · 3.65 |
| Sidebar link | `.nav-list a` | `base`, `mantle` | `text-muted` | `text-muted` | 7.37 · 5.14 |
| Sidebar link, pointer over | `.nav-list a:hover` | `raised` | `text-body` | `text-primary` | 8.69 · 5.17 |
| Sidebar current item | `.nav-list a[aria-current="page"]` | `tint-primary@base`, `tint-primary@mantle` | `text-primary` | `accent-primary-raised` | 6.18 · 5.86 |
| Sidebar description | `.nav-desc` | `base`, `mantle` | `text-muted` | `text-muted` | 7.37 · 5.14 |
| Sidebar description, pointer over | `.nav-list a:hover .nav-desc` | `raised` | `text-muted` | `text-muted-raised` | 5.65 · 5.17 |
| Sidebar description, current | `.nav-list a[aria-current="page"] .nav-desc` | `tint-primary@base`, `tint-primary@mantle` | `text-muted` | `text-muted-raised` | 5.84 · 5.63 |
| Breadcrumb | `.breadcrumb, .breadcrumb a` | `base` | `text-muted` | `text-muted` | 7.37 · 5.53 |
| Breadcrumb separator | `.breadcrumb .sep` | `base` | `ornament` | `glyph-dim` | no target · no target |
| Page text | `.prose` | `base` | `text-body` | `text-primary` | 11.34 · 7.06 |
| Minor heading | `.prose h4, .prose h5, .prose h6` | `base` | `text-secondary` | `text-secondary` | 9.26 · 5.53 |
| Link, skip link | `a` | `base` | `text-primary` | `accent-primary-raised` | 7.79 · 7.34 |
| Link in a table row under the pointer | `.table-wrap a` | `base+hover` | `text-primary` | `accent-primary-raised` | 6.16 · 6.16 |
| Inline code | `.prose :not(pre) > code` | `site-inline-code` | `text-body` | `text-primary` | 8.69 · 6.57 |
| Inline code in a link | `.prose a > code` | `site-inline-code` | `text-primary` | `accent-primary-raised` | 5.97 · 6.83 |
| Block quote | `.prose blockquote` | `site-quote` | `text-secondary` | `text-secondary` | 8.61 · 5.19 |
| Link in a block quote | `.prose blockquote a` | `site-quote` | `text-primary` | `accent-primary-raised` | 7.24 · 6.89 |
| Table head | `.table-wrap thead th` | `mantle` | `text-secondary` | `text-secondary` | 9.91 · 5.14 |
| Table row, pointer over | `.table-wrap tbody tr:hover` | `base+hover` | `text-body` | `text-primary` | 8.96 · 5.92 |
| Note text and link | `.note, .note a` | `tint-warning@base` | `text-body` | `text-primary` | 8.24 · 6.40 |
| Untranslated note text and link | `.note--untranslated, .note--untranslated a` | `tint-primary@base` | `text-body` | `text-primary` | 9.00 · 6.02 |
| Code text | `pre.astro-code` | `site-code` | `text-body` | `site-code-fg` | 11.50 · 11.50 |
| Code comment | `pre.astro-code span[style*="#6A737D"]` | `site-code` | `text-muted` | `site-code-comment` | 5.34 · 5.34 |
| Previous and next | `.page-nav a` | `base`, `mantle` | `text-body` | `text-primary` | 11.34 · 6.57 |
| Previous and next label | `.page-nav .dir` | `base`, `mantle` | `text-muted` | `text-muted` | 7.37 · 5.14 |
| Edit link | `.edit-link` | `base` | `text-muted` | `text-muted` | 7.37 · 5.53 |
| Contents list | `.toc__title, .toc a` | `base` | `text-muted` | `text-muted` | 7.37 · 5.53 |
| Contents list, current | `.toc a[data-active]` | `base` | `text-primary` | `accent-primary-raised` | 7.79 · 7.34 |
| Contents list bar, current | `.toc a[data-active]` | `base` | `selection-bar` | `accent-primary` | 7.79 · 4.34 |
| Focus ring | `a, button, input` | `base`, `mantle`, `raised` | `focus-ring` | `border-focus` | 5.97 · 3.18 |
| Footer text | `.site-footer h4, .site-footer a, .site-footer__blurb, .site-footer__legal` | `mantle` | `text-muted` | `text-muted` | 7.89 · 5.14 |
| Footer link, pointer over | `.site-footer a:hover` | `mantle` | `text-body` | `text-primary` | 12.14 · 6.57 |
| Wordmark dot | `.wordmark b` | `base`, `mantle` | `mark` | `site-wordmark-dot` | no target · no target |
| Hero release word | `.hero__eyebrow` | `base` | `text-muted` | `text-muted` | 7.37 · 5.53 |
| Hero release dot | `.hero__eyebrow .dot` | `base` | `mark` | `site-eyebrow-dot` | no target · no target |
| Hero accent | `.hero h1 .accent` | `base` | `text-brand` | `brand-ink` | 5.12 · 5.50 |
| Design kicker | `.design-head__kicker` | `base` | `text-brand` | `brand-ink` | 5.12 · 5.50 |
| Primary call to action | `.btn--primary` | `site-cta` | `text-body` | `site-cta-fg` | 5.85 · 5.85 |
| Primary call to action, pointer over | `.btn--primary:hover` | `site-cta+hover` | `text-body` | `site-cta-fg` | 6.37 · 6.37 |
| Primary call to action, press | `.btn--primary:active` | `site-cta+press` | `text-body` | `site-cta-fg` | 6.66 · 6.66 |
| Guide figure label | `.anat::after` | `site-cta` | `text-body` | `site-cta-fg` | 5.85 · 5.85 |
| Card icon | `.card__icon` | `site-card-icon` | `glyph-brand` | `brand-ink` | 4.26 · 4.74 |
| Card arrow | `.card__more` | `base` | `text-brand` | `brand-ink` | 5.12 · 5.50 |
| Card text | `.card > span` | `base` | `text-secondary` | `text-secondary` | 9.26 · 5.53 |
| Platform icon | `.platform svg` | `base` | `glyph-brand` | `brand-ink` | 5.12 · 5.50 |
| Closing band title and ghost buttons | `.cta-band h2, .cta-band .btn--ghost` | `site-band` | `text-body` | `text-primary` | 9.70 · 6.22 |
| Closing band text | `.cta-band p` | `site-band` | `text-secondary` | `text-secondary` | 7.92 · 4.87 |
| Terminal figure bar | `.term__bar` | `mantle` | `text-muted` | `text-muted` | 7.89 · 5.14 |
| Terminal figure text | `.term pre` | `term` | `text-body` | `surface-terminal-focused-fg` | 14.52 · 7.99 |
| Terminal figure $ | `.term .g` | `term` | `text-success` | `accent-success-raised` | 14.12 · 7.58 |
| Window mock path and dim line, focused | `.shell span` | `term` | `text-muted` | `text-muted` | 9.43 · 6.25 |
| Window mock path and dim line, unfocused | `.shell span` | `base` | `text-muted` | `text-muted` | 7.37 · 5.53 |
| Window mock prompt | `.shell span` | `term`, `base` | `text-agent` | `accent-agent-raised` | 8.07 · 6.65 |
| Window mock success | `.shell span` | `term`, `base` | `text-success` | `accent-success-raised` | 11.03 · 6.70 |
| Window mock command | `.shell span` | `term`, `base` | `text-primary` | `accent-primary-raised` | 7.79 · 7.34 |
| Window mock warning word | `.shell span` | `term`, `base` | `text-warning` | `accent-warning-raised` | 12.91 · 7.15 |
| Window mock version | `.shell span` | `term`, `base` | `text-attention` | `accent-attention-raised` | 9.27 · 6.97 |
| Window mock document title | `.shell h2` | `mantle`, `crust` | `text-body` | `text-primary` | 12.14 · 6.04 |
| Window mock section heading | `.shell h3` | `mantle`, `crust` | `text-primary` | `accent-primary-raised` | 8.34 · 6.28 |
| Design pages text | `.design-head__intro, .ds-lede, .ds-card__head p, .ds-card__src` | `base` | `text-muted` | `text-muted` | 7.37 · 5.53 |
| Design source link, pointer over | `.ds-card__src:hover` | `base` | `text-brand` | `brand-ink` | 5.12 · 5.50 |
| Design tile description | `.ds-tiles__desc` | `base`, `site-tile-hover` | `text-muted` | `text-muted` | 6.85 · 5.19 |
| Design tile label | `.ds-tiles__label` | `base`, `site-tile-hover` | `text-body` | `text-primary` | 10.54 · 6.63 |
| Design tile edge and page navigation edge, pointer over | `.ds-tiles a:hover, .page-nav a:hover` | `base` | `border-partition` | `brand-ink` | no target · no target |

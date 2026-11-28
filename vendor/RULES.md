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
| `crust` | `bg-app` | #11111b | #dce0e8 | Window chrome, title bar, sidebar category band, recessed progress track, DAG log. |
| `mantle` | `bg-sidebar` | #181825 | #e6e9ef | Sidebar, unfocused pane’s tab strip, address bars, table header, DAG chrome and detail, code gutter, notice path box. |
| `base` | `bg-panel` | #1e1e2e | #eff1f5 | Panels, active tab with the Fill indicator, dialogs, popups, windows, modifier hint. |
| `raised` | `surface-raised` | #313244 | #ccd0da | Menus, tooltips, toasts, banners, cards, keycaps, Tags, DAG nodes, code blocks, focused pane’s tab strip. |
| `on-raised` | `surface-on-raised` | #45475a | #eff1f5 | A control fill on a raised shell (banner Secondary). |
| `field` | `surface-field` | #313244 | #eff1f5 | Fill of an enterable control: Input, Select, Checkbox box. |
| `solid-hover` | `surface-hover` | #45475a | #bcc0cc | Opaque step above raised. Read only by on-raised in Mocha. |
| `active` | `surface-active` | #585b70 | #acb0be | Selected and keyboard-active rows, special-role row in the modifier hint, neutral Badge. |
| `term` | `surface-terminal-focused-bg` | #000000 | #ffffff | Focused bed: terminal, markdown, empty, explorer file area, DAG canvas, image canvas. |
| `term-unfocused` | `surface-bed-unfocused` | #1e1e2e | #dce0e8 | Unfocused bed of the same surfaces. |
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
| Tint box | `tint-<hue>@<parent>` | Parent is `mantle`, `base` or `raised`. The info, success and danger tints also sit on `crust` in the git diff. |
| Surface focus | `term`, unfocused `term-unfocused` | See [section 4](#4-location-map). Html and plugin surfaces keep their ground and show the focus edge. |
| Unfocused terminal | `term-unfocused` | Default ink `surface-terminal-unfocused-fg`. |
| Dimmed item | the parent | `state-dim-opacity` over an item that is inert and comes back. No target, see section 12. An item the user still reads or selects is not dimmed: a pending cut reads `cut-pending-fg`, a disabled plugin row reads `text-muted`, a route not taken reads `dag-edge-dim`. |
| Under a scrim | `scrim@<parent>` | Inert. Every cell is forbidden. Only the modal frame sits on it. |

**A drop target tint paints under the row.** The order is parent, `explorer-drop-target-bg`, row fill, ink, then the `explorer-drop-target-border` ring. Every `drop-target@*` cell is an ink on the composited ground with no tint over it, and this order is what makes that true. A tint painted over the ink would change the token, so section 2 would not hold. A row with an opaque fill hides the tint and keeps its own cells, and the ring still shows.

Composited values:

| Ground | Mocha | Latte |
|---|---|---|
| `term+hover` | #141414 | #ebebeb |
| `term+press` | #1f1f1f | #e0e0e0 |
| `drop-target@term` | #10161e | #e4edfe |
| `marquee@term` | #10161e | #e4edfe |
| `term-unfocused+hover` | #30303f | #caced5 |
| `term-unfocused+press` | #393947 | #c2c5cc |
| `drop-target@term-unfocused` | #2b3046 | #c5d1ea |
| `marquee@term-unfocused` | #2b3046 | #c5d1ea |
| `match@term-unfocused` | #605955 | #ddc7ab |
| `match-active@term-unfocused` | #b7a788 | #deb783 |
| `match@term-selection` | #888483 | #bba68e |
| `match-active@term-selection` | #c9ba9c | #d5953d |
| `file-drop@term-unfocused` | #2b3046 | #c5d1ea |
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
| `tint-info@crust` | #1f2934 | #c2d9e8 |
| `tint-info@mantle` | #26303d | #cbe1ee |
| `tint-info@base` | #2b3545 | #d3e8f3 |
| `tint-info@raised` | #3c4658 | #b4cbdb |
| `tint-success@crust` | #232a2b | #c9d8d1 |
| `tint-success@mantle` | #293034 | #d2e0d7 |
| `tint-success@base` | #2e363c | #dae7dd |
| `tint-success@raised` | #3f474f | #bbcac5 |
| `tint-warning@mantle` | #333036 | #e5ded6 |
| `tint-warning@base` | #38363d | #ede5db |
| `tint-warning@raised` | #494751 | #cec8c3 |
| `tint-danger@crust` | #2c202c | #dbc7d3 |
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
| Tab bar | `mantle` | 1 | `tab-hover`, `base`, `mantle+hover`, `mantle+press`, `raised` | Unfocused pane’s strip. See Focused tab bar for the focused pane. Active tab with Fill is base. Scroll arrow cell is raised. |
| Focused tab bar | `raised` | 1 | `tab-hover`, `base`, `raised+hover`, `raised+press`, `base+press` | The focused pane’s strip is raised. Tabs are raised by default. The active tab with Fill is base. On hover, the close button draws the active overlay over the tab’s own fill. Close hover is raised+press on inactive tabs and on tabs with Underline or Dot. It is base+press on the active tab with Fill. |
| Pane body | `base` | 1 | `term`, `term-unfocused`, `crust`, `mantle`, `raised` | Holds one surface. See Surface focus for what shows focus on each kind. |
| Surface head and split line | `mantle` | 2 | `field`, `mantle+hover`, `mantle+press`, `raised`, filled controls, tint boxes over `mantle` | Address bar band: mantle. Split lines take border-frame. |
| Terminal surface, focused | `term` | 2 | `term-selection`, `term-cursor`, `match@term-selection`, `match-active@term-selection`, `match@term`, `match-active@term`, `file-drop@term`, `raised` | Banner, toast and search bar float on raised. A default cell, bold or dim, takes text-primary in an ordinary search match. It takes text-on-active in a selection. A selected match cell takes search-match-selected-fg. |
| Terminal surface, unfocused | `term-unfocused` | 2 | `term-selection`, `term-cursor`, `match@term-selection`, `match-active@term-selection`, `match@term-unfocused`, `match-active@term-unfocused`, `raised` | Default ink takes surface-terminal-unfocused-fg. A default cell, bold or dim, takes text-primary in an ordinary search match. It takes text-on-active in a selection. Selection, vi cursor and a link under the pointer read as on a focused surface. A selected match cell takes search-match-selected-fg. |
| Markdown surface, focused | `term` | 2 | `base`, `mantle`, `raised`, `fill-warning`, `fill-primary`, `file-drop@term` | Content typography is library-driven. Colors follow this table. Address band stays mantle. A callout is its hue at tint-fill-alpha over the bed: title accent-<hue>-raised, body text-primary. A find hit is opaque. |
| Markdown surface, unfocused | `term-unfocused` | 2 | `base`, `mantle`, `raised`, `fill-warning`, `fill-primary`, `file-drop@term-unfocused` | Table row and zebra swap fills, so neither is the bed in both themes at once. Address band stays mantle. A callout is its hue at tint-fill-alpha over the bed: title accent-<hue>-raised, body text-primary. A find hit is opaque. |
| HTML surface | `mantle` | 2 | `field`, `raised` | The page is web content, outside these rules. Focus shows on the focus edge above the address band. |
| Image surface | `base` | 1 | `raised`, `term`, `term-unfocused` | The control bar is base. The canvas takes the bed for the focus state, and its empty and load-failed state screens sit on that bed. |
| Empty surface, focused | `term` | 1 | `raised` | Nothing but the bed. Banner and toast float on raised. |
| Empty surface, unfocused | `term-unfocused` | 1 | `raised` | Nothing but the bed. Banner and toast float on raised. |
| Explorer, focused | `term` | 2 | `mantle`, `term+hover`, `term+press`, `mantle+hover`, `mantle+press`, `active`, `active+hover`, `active+press`, `raised`, `field`, `drop-target@term`, `drop-target@mantle`, `marquee@term`, `marquee@mantle`, `file-drop@term`, `file-drop@mantle`, `drop-target@raised`, `track`, `track-raised`, filled controls, tint boxes over `mantle` | The file area takes the bed. Tabs, toolbar, sidebar, header and status line stay as they are. Selected row is active. Drag chip is raised. A drop target tint paints under the row, as section 3 says. |
| Explorer, unfocused | `term-unfocused` | 2 | `mantle`, `term-unfocused+hover`, `term-unfocused+press`, `mantle+hover`, `mantle+press`, `active`, `active+hover`, `active+press`, `raised`, `field`, `drop-target@term-unfocused`, `drop-target@mantle`, `marquee@term-unfocused`, `marquee@mantle`, `file-drop@term-unfocused`, `file-drop@mantle`, `drop-target@raised`, `track`, `track-raised`, filled controls, tint boxes over `mantle` | The file area takes the bed. Selected row is active. Drag chip is raised. A drop target tint paints under the row, as section 3 says. |
| Modal dialog | `base` | 2 | `raised`, `field`, `mantle`, `crust`, `active`, `approval`, `base+hover`, `base+press`, `track`, `track-raised`, filled controls, tint boxes over `base`, `raised` | Sits on scrim. Depth counts from the dialog. |
| Scrim | `scrim@base` | 1 | `base` | Only a modal frame sits on it. |
| Popup | `base` | 2 | `raised`, `field`, `mantle`, `crust`, `tint-info@crust`, `tint-success@crust`, `tint-danger@crust`, `active`, `base+hover`, `base+press`, `track`, `track-raised`, filled controls, tint boxes over `raised` | Port popup, file picker, DAG popup and git viewer share this. The git viewer diff body is crust, see Git diff. |
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
| Capture region select | `crust` | 2 | `mantle`, `raised` | The bed is crust. The band is mantle and its keycap is raised. The picture is not a ground: no ink sits on it, only the dim and the edge. See below. |
| Task DAG, focused | `term` | 2 | `raised`, `raised+hover`, `raised+press`, `mantle`, `crust`, `dag-running`, `dag-failed`, `dag-unknown`, `dag-partial`, `dag-awaiting`, `dag-stalled`, `dag-crashed`, `dag-cycle`, `base`, filled controls | Canvas takes the bed. Chrome and detail are mantle. Log is crust. In a workspace popup the canvas stays base. |
| Task DAG, unfocused | `term-unfocused` | 2 | `raised`, `raised+hover`, `raised+press`, `mantle`, `crust`, `dag-running`, `dag-failed`, `dag-unknown`, `dag-partial`, `dag-awaiting`, `dag-stalled`, `dag-crashed`, `dag-cycle`, `base`, filled controls | Canvas takes the bed. Chrome and detail are mantle. Log is crust. |
| Plugin surface chrome | `base` | 2 | `mantle`, `raised`, `field`, `active`, `active+hover`, `active+press`, `base+hover`, `base+press`, `tint-avatar`, `tint-primary@raised`, `tint-info@raised`, `tint-success@raised`, `tint-warning@raised`, `tint-danger@raised`, `tint-agent@raised`, `track`, filled controls | What the host draws, the focus edge included. |
| Plugin UI through host widgets | `base` | 2 | `mantle`, `raised`, `field`, `active`, `base+hover`, `base+press`, `track`, filled controls, tint boxes over `raised` | Same as any panel. Widgets read by role. |
| Startup and boot error | `crust` | 1 | `base`, `raised` |  |
| Code area | `field` | 1 | `mantle` | Gutter is mantle. |
| Git diff | `crust` | 1 | `tint-info@crust`, `tint-success@crust`, `tint-danger@crust` | The git viewer diff body. Hunk, added and removed lines fill their row with the tint over crust; context rows stay crust. Line ink reads the row's cell. |
| Scrim over crust | `scrim@crust` | 1 | `base` | Only a modal or popup frame sits on it. |
| Scrim over mantle | `scrim@mantle` | 1 | `base` | Only a modal or popup frame sits on it. |
| Scrim over raised | `scrim@raised` | 1 | `base` | Only a modal or popup frame sits on it. |
| Scrim over active | `scrim@active` | 1 | `base` | Only a modal or popup frame sits on it. |
| Scrim over term | `scrim@term` | 1 | `base` | Only a modal or popup frame sits on it. |

Filled controls means the `fill-*` grounds with their hover and press states. The full lists are in the file.

### Capture region select

Where a capture that has no operating system tool picks its area. It fills the window below the title bar, with no popup frame, popup title, scrim or shadow. The gallery has it at `gallery/overlays-windows/capture-region.jsx`.

The picture is a copy of the user's screen, so any color can be under anything drawn on it. Two things follow. All text stays off the picture, on the band, where it has a ground and a grade. What does paint on the picture holds one value in both themes, because the picture does not change with the theme.

The paint order is bed, picture, picture frame, dim, edge.

| Part | Reads | Notes |
|---|---|---|
| Band | `mantle`, `capture-band-height` | Above the picture, never over it. `separator` at its bottom. |
| Hint | `text-primary` on `mantle` | Left. The only band part that gives way: it ellipsizes at its end. |
| Size | `text-primary` on `mantle`, mono | Right, while there is a selection. Picture pixels, `{width} × {height}`. It is the size of the crop. |
| Esc and Cancel | `Kbd` on `mantle`, `text-secondary` | Far right, in every state. A label, not a button. |
| Bed | `crust` | `capture-stage-inset` on every side, so the frame and the edge always have room. |
| Picture frame | `border-frame` on `crust` | 1px, outside the picture. It reads against the bed and has no promise against the picture. |
| Dim | `capture-dim-bg` | Over the picture outside the selection. Over all of it when there is no selection. |
| Edge | `capture-edge-dark` inside, `capture-edge-light` outside | Two strokes of `capture-edge-width`, outside the selection, so the pixels inside are untouched and are what the crop holds. No radius, no motion. |

**The dim is not the scrim.** It has the scrim's value and none of its meaning. A scrim says the content under it is inert. The user reads this picture to choose an area, so `capture-dim-bg` is its own token and can move on its own. Do not read `scrim-bg` here, and do not read `capture-dim-bg` behind a modal.

**Why the edge reads on any picture.** The dim caps every pixel outside the selection at #808080, so `capture-edge-light` holds at least 3.95 against the dim, which is 4.00 with the alpha rounded to n/255. That meets the 3 grade of an edge whatever the picture is. The strokes hold 21 to each other. `capture-edge-dark` has no promise against the selected pixels: on a black picture it is 1.0. It is there so the edge has a dark line on a light picture, where the selected pixels are close to the light stroke. These are computed. How the edge looks to a person on a fine pattern is not a ratio, and the gallery shows that case to be looked at.

**The dim alone does not separate the selection.** On a black picture it changes nothing, at 1.0. The edge is what shows the selection there.

| State | Dim | Edge | Band |
|---|---|---|---|
| Before a drag | The whole picture | None | Idle hint |
| Dragging, both axes at `capture-min-drag` or more | Outside the selection | Yes | Release hint, size |
| Dragging, either axis under `capture-min-drag` | The whole picture | None | Idle hint |

Every way the view ends closes it and raises one result toast in the window that asked. Release with a selection copies and raises the existing screenshot result toast. Esc at any time, or release with no selection, cancels: the clipboard does not change, and the toast is `toast.screenshot_cancelled`, the info Toast. A click and a drag under `capture-min-drag` are both a release with no selection. `capture-min-drag` is in display pixels, because it tells a click from a drag and says nothing about the crop.

The picture keeps its ratio and scales down to fit the bed. It is never scaled above one to one, and a smaller picture is centered. The crop comes from the source picture at its own resolution, however it is displayed.

### Surface focus

The bed shows focus, as the terminal's always has: **`term` focused, `term-unfocused` unfocused**, on every surface whose bed belongs to Tasty. Where the bed belongs to someone else, the host paints the **surface focus edge** instead. Focus means host model key focus: where keys go, not which pane or tab is selected. An inactive OS window keeps its focused look, and with no focused surface nothing looks focused.

| Kind | Bed that follows focus | What stays | Edge |
|---|---|---|---|
| `terminal` | Cell bed, and default ink | Cell content. Motion stays 0ms | No |
| `markdown` | Document bed, table row and zebra | Address band, code fill, table header and grid, body and link ink | No |
| `empty` | The whole surface | - | No |
| `explorer` | File area | Inner tab bar, toolbar, sidebar, header, status line, preview panel | No |
| `dag_graph` | Canvas | Header, nodes, detail panel | No |
| `image` | Canvas, with its empty and load-failed state screens | Control bar, popups, the image, state screen ink | No |
| `html` | None. The page paints itself | Address band, banners, chrome tiles | Yes |
| Plugin, webview | None the host can promise | The plugin's page | Yes |
| Plugin, `egui-mesh` | None the host can promise | The plugin's frame | Yes |

**Why some kinds cannot swap.**

- `html`: author CSS paints the document, and a sandboxed page has scripts off, so a pushed value may not arrive and may not be read.
- Plugin surfaces: the plugin paints them and may ignore the value or declare one color twice. A plugin may follow `term` and `term-unfocused` itself, and the edge still shows.

**Webview chrome tiles.** Loading, failed, no page and boundary tiles stand in for the page. On `markdown` the tile takes the bed for the focus state, so nothing jumps when the document appears. Its no page glyph is `glyph-dim`, because `text-disabled` is 2.99 on the Latte unfocused bed. On `html` and plugin webviews the tile stays `base` under the edge, because the page that follows it will not swap. Their no page glyph is `glyph-dim` as well, so every webview tile draws one glyph ink.

**Image state screens.** Empty and load-failed are the canvas with no picture on it, so they take the same bed and no mark of their own. Sub and reason are `text-muted`. Empty has a `text-muted` glyph and a `text-secondary` title. Missing and decode use `image-error-fg` for glyph and title, and permission uses `accent-warning-raised` for both. Too large has an `image-too-large-fg` glyph and a `text-primary` title. Each ink holds on both beds in both themes.

**Task DAG empty state.** A tab with no DAG is the canvas with nothing on it, so it takes the bed. The workspace popup draws the same widget on `base`. The glyph is `glyph-dim` on all three grounds, because `text-disabled` is 2.99 on the Latte unfocused bed and the glyph has a job: its shape tells a filter from a search from no DAG at all. The widget takes one ink, so nothing changes but the bed on a focus change, and a caller passes no value. Title is `text-secondary` and hint is `text-muted`.

**Explorer rows.** A kind glyph on the file area reads the role `glyph`, so `text-secondary` on the bed and on its hover and press grounds. The name beside it reads the same token at rest, and the kind is told by shape, as [section 7](#7-meaning) says. An image row reads `glyph-info`, as `accent-info-raised`, and under a drop target tint it reads `glyph`, because `glyph-info` is forbidden on `drop-target@*`. The shape still tells the kind. A match run reads the `text-match` cell, as `accent-primary-raised` on these grounds, because its hue is all that tells it from the name at rest. `explorer-match-fg` reads that role on the bed and on its hover and press grounds. It does not read `accent-primary-strong`: in Mocha that sits ΔE 0.058 from `text-secondary`, under the 0.08 of [section 7](#7-meaning), and `accent-primary-raised` sits 0.088 from it.

**Explorer state screens.** An error screen reads `explorer-error-fg` for its glyph and title, on `term` and `term-unfocused`, as the image state screens read `image-error-fg`. A state screen has no hover or press, so the token is not listed on those grounds. The table keeps those cells, because every ground and role has one. If a state screen ever gains a press, it reads the cell: `accent-danger-strong` on `term-unfocused+press`, where `explorer-error-fg` is 4.29 in Latte.

**Key focus, not selection.** A surface is focused while host key focus is in it, a field or control in the surface's own chrome included. Its pane and tab being selected is not enough. This one test is the only meaning of a focused surface. Everything that asks whether a surface is focused asks it, not the selected pane or tab:

- **Paint.** The bed or the edge, as this section says. A hard-occupied bed kind paints unfocused even with key focus, as Rules for the bed says.
- **Attention.** Key focus clears the completion and needs-input highlights on the surface only while the OS window is active and the surface is not hard occupied. These three together are the clearing condition, and "clears on focus", here and on every specimen, means them. The clearing runs on every frame drawn while the condition holds, so a highlight that arrives on such a surface is gone the next frame. Otherwise the highlight stays on the surface. Staying is not the same as showing: the leaf shows one ring, needs input over occupancy over completion. A soft or hard occupancy ring hides a completion that stays, while the tab title can still read completion. Needs input shows over either occupancy.
- **Soft occupancy.** Apart from clearing, and whatever the OS window, key focus in a surface drops a soft occupancy on it whose parent surface is gone. While the surface is hard occupied the drop waits: the hard ring shows over the soft one, and the orphan goes on the first frame after the hard occupancy ends. A soft occupancy with a live parent stays, so its ring can show on a focused surface.
- **Terminal cursor.** A terminal draws its cursor only while its bed paints focused: key focus in it and no hard occupancy. Whatever else hides the cursor, such as the suppression while output arrives, stays as it is. "An unfocused terminal" in [Terminal content](#terminal-content) means a terminal whose bed paints unfocused.
- **What surfaces are told.** The focused value the host gives an `egui-mesh` or webview surface, and the plugin `surface.focused` event. A surface that loses key focus is told it has lost focus, and one that gains it is told it has focus.

Each of these reads key focus in the same frame. Paint and the cursor also read hard occupancy, and clearing reads the OS window and hard occupancy, as their items say. An inactive OS window changes nothing else: the focused paint, cursor and focused value stay, as the start of this section says.

- **Under a popup that holds key focus.** Whatever the popup's scope, with or without a scrim, the surface under it and every other surface are unfocused. A bed kind takes `term-unfocused` and an edge kind its unfocused edge. No highlight clears, a terminal draws no cursor, and its mesh, webview or plugin is told it has lost focus. When the popup's shell border shows focus, it draws `popup-border-focused`, so keys show going to one place. A window-scope popup, a popup shown over the window and a child it opens there keep their own borders in every state, as Popup focus says. While one of them holds key focus, every shell whose border shows focus draws `popup-border-unfocused`. The scrim over the whole window and the popup above it show where keys go.
- **When the popup lets go.** The surface key focus lands in is focused in the same frame. It is told it has focus and paints focused, except that a hard-occupied bed kind keeps its unfocused values and a hard-occupied terminal draws no cursor. An edge kind lights its edge either way. Its highlights clear in that frame if the clearing condition in Attention holds. A popup that closes and gives key focus back to the selected surface does this for that surface. A click into another surface does it for that one, and the popup stays open and draws `popup-border-unfocused` if its border shows focus. For a hard-occupied bed kind, if the popup's border shows focus, its change to `popup-border-unfocused` is the only cue and marks only that the popup let go of key focus.
- **A popup without focus.** A popup that does not take key focus leaves the focused surface focused in every way above. Nothing under it clears early or is told it lost focus. This covers a popup an agent opens, a context menu, a Select or autocomplete list, and a tooltip.
- **The same rules.** The bed and edge rules below hold as they are: one frame, no motion, nothing moves, hard occupied and mirror unchanged.

**Rules for the bed.**

- **No motion.** The color changes in one frame on every kind.
- **Nothing moves.** A focus change never reloads a document, moves its scroll, or changes layout. Only fills change.
- **Unknown focus.** A surface not known to be focused paints unfocused, on its first frame too. With no focused surface, every bed is unfocused.
- **Hard occupied.** A bed kind paints its unfocused values even while it holds focus, as the terminal does. The surface takes no input, and the peach ring says so. On `markdown` the webview covers the ring, so inside the surface a hard-occupied focused document looks like an unfocused one. An edge kind still lights its edge.
- **Mirror.** The side that shows the leaf uses its own focus value, on the first frame and after every change.
- **Keyboard focus.** A field or control keeps its blue ring on any bed.

**Rules for the edge.** `surface-focus-edge-focused` and `surface-focus-edge-unfocused`, `surface-focus-edge-width` 2px, zoom-exempt, across the top of the leaf above any address band. The row stays reserved in both states, and a webview starts below it.

- **Unfocused reads as no mark.** `surface-focus-edge-unfocused` is the chrome tone, `mantle`. On `html` the address band below is `mantle` too, so the unfocused edge runs into it and the band looks 2px taller. That is meant: only the lit edge is a signal. The unfocused value has no grade of its own. It is held only to the pair's ΔE and 3:1 in [section 7](#7-meaning).

- **Paint order.** Unfocused edge, then ring (needs input, occupancy, completion), then lit edge. With a ring on the leaf, the lit edge takes only the lower row, `border-width` tall, and the ring keeps the upper row. Both stay visible, and the content does not move.
- **Ring against edge.** Where the host surface shows on all four sides, a ring has four sides and the edge one, so position tells them apart as well as color. A native webview sits above the host surface and covers the ring, so an `html` or plugin webview leaf shows only the ring's top side, in the edge's own row. An inset on a pane's outer side can show a little more on macOS and Windows. On such a leaf:
  - Focused: the ring's upper row over the lit lower row. They are told apart by row and by hue, ΔE 0.135 or more for needs input and occupancy. Completion meets the lit edge on one leaf only while the OS window is inactive, since it clears otherwise (see Attention above) and occupancy outranks it on a hard-occupied leaf. Then row tells them apart, and hue at ΔE 0.088 in Mocha, the pair named between two leaves below.
  - Unfocused: the ring's top side fills as many rows as it is wide. Occupancy leaves the unfocused edge in the lower row, and a 2px ring covers it.
  - Between two leaves, a completed webview leaf and a focused one both show a bar on top, and hue tells them apart: ΔE 0.088 in Mocha, the closest pair in the group. It clears the 0.08 limit, with little to spare.
  - This reading comes from the stacking order, not from the app. It is unmeasured. Measure it when the edge is built, and send it back to design if a 1px row does not read.
- **`markdown` has no reserved row,** so a native webview covers the ring on all sides, and the ring does not show on a markdown leaf. That is unmeasured too. Measure it when the bed is built, and send it back to design if it does not read.

### Popup focus

A press outside a popup's scope never closes it, whatever the popup declares. The popup stays open and key focus goes to the surface the press lands in. Closing on an outside click, which a popup such as convert surface declares, applies only to a press inside its scope and outside its frame. A popup that covers its scope and does not close keeps or takes back key focus on such a press. So a popup scoped narrower than the window (surface, tab, pane, workspace) stays open while the user types in another surface. Its shell shows focus on its 1px border if the popup can take key focus, appears in its own scope and its border is not its own mark. This includes dialog shells, the plugin popup shell, the search bar, the banner more menu and the collapsed show-button frame. The tokens `popup-focus-edge-focused` and `popup-focus-edge-width` stay defined, but nothing reads them.

- **Focused.** A shell whose border shows focus draws `popup-border-focused` while it holds key focus. The token resolves to `border-frame` (`surface2`). The focus pair replaces the shell's own border token. That token is `border-frame` for a dialog, `border-default` for the plugin popup shell, `search-bar-border` for the search bar and `banner-more-menu-border` for the banner more menu. A focused dialog keeps its look. The focused plugin shell, search bar and banner more menu draw a stronger edge than their own border tokens give them.
- **Unfocused.** A shell whose border shows focus draws `popup-border-unfocused` while it has no key focus. The token resolves to `border-default` (`surface0`). This puts the border two ramp steps closer to the shell's fill, darker in Mocha and lighter in Latte. On the search bar and banner more menu, the unfocused border equals the `raised` fill. The fill against the surface under the shell gives it its outline. Only the border color changes, in the frame focus changes. The border stays 1px, and the fill, shadow, scrim and content stay the same. Nothing moves or dims. A user still reads an unfocused popup ([section 12](#12-exceptions), `dimmed`). The scrim marks the scope the popup covers. A click there still goes to the popup.
- **Shells that keep their own borders.** Window-scope popups, popups shown over the window and children they open there keep their own border tokens in every state. Passive menus and lists that never take key focus do the same. These include the context menu, Select list, autocomplete list and tooltip. In the file picker's remote border mode, the `accent-info` border and 2px info strip mark the remote state in every focus state. These shells draw no unfocused border value and do not take part in the One focus count of borders.
- **Host and plugin alike.** The host draws the shell and its border around a plugin's content, so a plugin cannot drop or recolor the border. The plugin's own focus cues, such as a caret, come on top.
- **One focus.** Key focus is in one place. At most one shell draws `popup-border-focused` or one surface draws its focused bed or edge. Every other shell whose border shows focus draws `popup-border-unfocused`. When a child takes key focus, its parent draws `popup-border-unfocused` if the parent's border shows focus. A parent shown over the window keeps its own border. While a popup holds key focus, every surface paints unfocused, including the one under it. A focused surface bed or edge means no popup holds key focus.
- **Keyboard focus inside the popup.** The control with widget focus draws its keyboard mark on top of the border. A field draws its focus edge. A button draws its keyboard focus ring. The mark appears in the frame the popup takes key focus and updates in the frame widget focus moves inside it, as when Tab moves focus to a button and back or a button press moves focus. The mark is part of the widget's contract and follows the rules above. Because some shells have no control with widget focus, the popup focus pass mark in [section 7](#7-meaning) judges the border pair on its own.
- **Passive.** A popup that an agent opens holds no key focus and draws no ring until the user gives it focus. While it is passive, it draws `popup-border-unfocused` if its border shows focus.
- **Collapsed show button.** The frame uses the popup focus border pair. The button draws its own keyboard focus ring while it holds key focus. The ring uses the `border-focus` and `focus-ring-width` pair for `:focus-visible`, with a width of 2px and an offset of 1px. When the user opens the popup, the ring appears in the first frame. A passive button draws no ring. While the user types in another surface, the frame draws `popup-border-unfocused` and the button draws no ring.
- **Window scope keeps its border.** Every click in the window is in its scope, so while open it holds focus or is passive. A passive popup draws no ring. A window-scope popup keeps its own border in every state and never draws `popup-border-unfocused`. While it holds key focus, every surface paints unfocused and every shell whose border shows focus draws `popup-border-unfocused`. The scrim over the whole window and the popup above it show where keys go.
- **Shown over the window.** A host or plugin popup scoped narrower than the window (surface, tab or pane, whatever the kind) that does not fit its scope first collapses to its show button, and the rest of the window stays usable while it is collapsed. A popup made to shrink to its scope, today only the search bar, is not under this rule: it never collapses and fits itself to its scope's width. Pressed, it expands over the window. Its logical scope, what it acts on, stays its own, but it is shown in window scope: the whole window takes `scrim-bg`, the same value as every scrim, with `shadow-modal`, and nothing else in the window takes a press, the sidebar's workspace rows included. The popup shown over the window and any child it opens there each keep their own border token in every state. Their borders show no focus and draw no unfocused border value. While either holds key focus, every surface paints unfocused and no scoped popup shows focus. The scrim over the whole window and the popup above it show where keys go. The `shrink` button first in its title bar, or Esc, collapses it back to the show button, and Esc never closes it there; a headless popup gets the host title bar with no title for it. Collapsing keeps the popup and its state: only its own controls close it. A child popup it opens, such as a picker, takes its scope and its form: over the window while the parent is, never starting as a show button of its own. No shortcut collapses it: over the window the way back is the shrink button or Esc. Collapsed and over the window are ways of showing one popup and change none of its rules: collapsed, it keeps its scope, its scrim if it covers the scope, its outside-click and Esc rules and its key focus. In a window smaller than the expanded popup, its left and top sit on the window's inner edge and its frame is fitted to the window: the title bar, or the host bar, keeps its buttons whole at its right end, and the content below is cut at the bottom.

### Terminal content

Three layers, three answers:

| Layer | In the rules? | What holds |
|---|---|---|
| ANSI colors, reverse video, reverse screen, bold, dim, hidden (SGR 8), underline, strikethrough, overline, underline color (SGR 58), cell backgrounds | No | The running program picks them. The `ansi-*` tokens are the palette. No pair is promised. |
| Default cell ink and the surface fill | Yes | `surface-terminal-focused-fg` on `term`, `surface-terminal-unfocused-fg` on `term-unfocused`. |
| What the app draws over cells | Yes | Below. |

| Overlay | Ground | Ink | Mocha · Latte |
|---|---|---|---|
| Selection | `term-selection` | `text-on-active` | 4.62 · 5.40 |
| Vi cursor cell | `term-cursor` | `vi-cursor-fg` | 10.48 · 6.60 |
| Link under the pointer | `term-selection` | `text-on-active`, underline `accent-primary-raised` | 4.62 · 5.40, underline 3.17 · 3.84 |
| Search match | `match@term` | `text-primary` | 6.67 · 6.06 |
| Active search match | `match-active@term` | `search-match-active-fg` | 6.23 · 5.03 |
| Search match, unfocused | `match@term-unfocused` | `text-primary` | 4.75 · 4.88 |
| Active match, unfocused | `match-active@term-unfocused` | `search-match-active-unfocused-fg` | 6.95 · 11.21 |
| Selected search match | `match@term-selection` | `search-match-selected-fg` | 5.07 · 8.96 |
| Selected active match | `match-active@term-selection` | `search-match-selected-fg` | 9.81 · 8.20 |
| Block cursor, with or without a selection | The swapped fill | The swapped ink | 14.52 · 7.99, focused only |
| Vi cursor in the active match | `search-match-active-bg` over `term-cursor` | `search-match-selected-fg` | 13.26 · 6.76 |
| Block cursor in the active match | `search-match-active-bg` over the swapped fill | `search-match-selected-fg` | 14.12 · 4.65, focused only |

The selection, vi cursor and link rows hold on both beds. `term-selection` and `term-cursor` are opaque, so the bed under them does not reach the ink. Selection can stay on a surface after focus moves away, and the vi cursor shows there when it moves by keyboard.

The overlay ink applies to default cell ink: any cell with no color of its own, bold or dim included. On `match@term-unfocused` a default cell changes from `surface-terminal-unfocused-fg`, which would be 3.09 · 3.82 there, to `text-primary`. In the file that ink is the role `text-body`, and it is the cell ink that the forbidden cells of a match name. A dim cell is a blend of its ink and its ground, which is 1.81 in both themes on `match@term`, so an ordinary match draws it in `text-primary` on either bed. The match costs the dim step, and the ink does not change on a focus change. Outside a match a dim cell stays the program's blend, and no pair is promised. In a selection a default cell, bold or dim, reads `text-on-active` on either bed. The cell's own ink would be 4.62 · 3.69 focused and 3.00 · 2.89 unfocused, and a dim blend would be 1.26 · 1.10 focused and 1.18 · 1.20 unfocused. A selection is read and copied, so section 12 does not excuse it. Selection ink does not change on a focus change. A selected match has its own ink, in the next paragraph. A cell with its own ANSI color keeps it inside a selection or an ordinary match, dim or not, and that pair is content. A reverse-video cell and a reverse screen keep their ink inside a selection too, and no pair is promised. Only an active match replaces that color, so its ink holds on the stronger fill. A link away from the pointer reads as any other cell. Terminal content never animates.

**A selected cell in a match.** Both layers stay, with the match fill over `term-selection`, so a user still sees what is selected and which words matched. Showing only one of them would hide a selection that lands exactly on a match, or the match a user just moved to. `term-selection` is opaque, so these cells hold on both beds, and neither fill nor ink changes on a focus change.

- **Ordinary match.** A default cell, bold or dim, reads `search-match-selected-fg`. `text-on-active` would be 2.56 · 4.99 on this fill, and `text-primary` 2.56 · 3.41. A cell with its own ANSI color, a reverse-video cell and a reverse screen keep their ink, and no pair is promised, as in either layer alone.
- **Active match.** Every cell reads `search-match-selected-fg`, as an active match replaces every ink. The fill is `search-match-active-selected-bg`, which is 80% in Latte where `search-match-active-bg` is 50%. At 50% the two selected fills sit ΔE 0.040 apart and the active match is lost among the others. At 80% they sit 0.089, and in Mocha 70% gives 0.182. The dark ink is what allows the stronger fill.
- **Vi cursor.** `term-cursor` covers the selection, so the match fill lies over `term-cursor` as usual: 11.59 · 6.53 in an ordinary match, with `vi-cursor-fg`. In a selected active match the fill is `search-match-active-bg` and the ink `search-match-selected-fg`: 13.26 · 6.76.
- **Block cursor.** The cell stays a cursor cell and takes no selection fill. In an ordinary match it keeps the swapped ink over the swapped fill, 15.08 · 5.73. On a selection fill the swapped ink would be 5.68 · 2.34. In a selected active match the fill is `search-match-active-bg` over the swapped fill and the ink `search-match-selected-fg`: 14.12 · 4.65.

**A block cursor in a selection.** Outside a match the cell also stays a cursor cell and takes no selection fill, so a selection never hides where the cursor is. The vi cursor covers a selection in the same way. A default or bold cell keeps the swapped ink over the swapped fill, 14.52 · 7.99, with or without a selection. On a selection fill the swapped ink would be 3.15 · 2.16. A dim or colored cell swaps its own colors, and no pair is promised. An unfocused terminal draws no block cursor, so there the cell reads as any other selected cell.

**Cells a match leaves alone.** The overlay ink stops at these cells, because something else has already set their ink.

- **Reverse screen (DECSCNM).** The program inverts the whole screen, so the match fill lies over the cell's ink color and the glyph takes the bed color. The cell keeps that ink: 15.08 · 5.73 focused, 8.79 · 3.67 unfocused, the values of an SGR 7 cell. It is reverse video, so no pair is promised. `text-primary` would be 1.04 · 1.39 on the focused fill. A dim cell on a reverse screen keeps its blend the same way, and it stays out of the overlay table. In a selected ordinary match the app paints 1.44 · 1.02 focused and 1.55 · 1.12 unfocused. In a selection alone the same blend comes to 1.26 · 1.10 focused. Giving only this cell an ink would make dim read stronger than the default cell beside it: `search-match-selected-fg` would be 5.07 · 8.96 next to 5.68 · 2.34. The active match still replaces its ink, 9.81 · 8.20.
- **Block cursor.** The cell swaps its ink and fill, and the match fill lies over the swapped fill. An ordinary match leaves the swapped ink: 15.08 · 5.73 focused. An active match replaces every ink, so the cell reads `search-match-selected-fg` with or without a selection: 14.12 · 4.65. `search-match-active-fg` would be 12.35 · 1.77. An unfocused terminal draws no block cursor, so this cell does not occur there. A cursor shape a program paints with SGR 7 is a cell value, not this cell.
- **Vi cursor.** The cell keeps `vi-cursor-fg`: 10.48 · 6.60 on `term-cursor`, and 11.59 · 6.53 if an ordinary match fill lies over it. It holds either way. An active match replaces that ink with `search-match-selected-fg`, with or without a selection and on either bed: 13.26 · 6.76. `search-match-active-fg` would be 11.59 · 2.57 focused. A selection does not change a cursor cell, so the same token keeps the cell the same when a selection starts.
- **Link under the pointer.** The cell reads as a selection with a blue underline, in an ordinary match, in the active match and outside any match, on either bed. Neither match fill paints on it, because `text-on-active` would be 2.56 in Mocha over the ordinary fill, and on the active fill it would be 1.82 · 7.36 focused and 1.63 · 6.24 unfocused, with the underline at 1.25 · 5.23 and 1.12 · 4.43. The rest of the match keeps its fill, and the cell returns to the match in one frame when the pointer or the modifier leaves. A cursor cell inside the link stays a cursor cell. `accent-primary` on the words would be 3.17 · 2.27, under the text grade. The underline is the one hue a terminal layer holds, and the shape and fill tell the state.

**Hidden cells (SGR 8).** A hidden cell draws no glyph under any overlay: the block cursor, the vi cursor, a selection, an ordinary or active match, a selected match and a link under the pointer. Each overlay paints its fill as in the table above, on either bed and in both themes, so the cell still shows where the cursor, the selection or the match is, and it keeps its background and width. The program hid the text, and a cursor, a selection or a match passing over it does not show it on screen. A password a program echoes hidden stays hidden while a user drags across it. Search still finds the text and a copy still holds it, so the fill is how a user sees what was found or selected. No ink is drawn, so a hidden cell adds no pair, and the fill values are those of the same cell without the attribute.

- **Link under the pointer.** The cell keeps the selection fill and the blue underline, `accent-primary-raised`, 3.17 · 3.84. A cursor cell inside the link draws the underline in the cursor's ink, as on any cell. The underline marks what a click opens, and that holds whether or not the words show.
- **Other lines.** A hidden cell draws no program underline, strikethrough or overline, inside a link too.
- **Cursor that is not a block.** A bar or underline cursor draws over a hidden cell as over any other.
- **SGR 28.** The glyph shows again in one frame, with the ink the overlay gives it.

### Lines a cell draws

A cell can draw a link underline, a program underline of five kinds, a strikethrough and an overline. They share one thickness, and the color and geometry come from the cell, so they need no token. Only the link underline is in the rules. A program line is in the program layer above, and it holds no grade of its own.

All lengths are device pixels, and every line except the curly one lands on whole rows. `H` is the cell height. `B` is the first row under the baseline the grid uses. `A` is `B` minus the cell top. The font's own line metrics are not read, so a fallback or CJK glyph in a run does not move the line.

`T = max(1, round(H / 16))`, rounding half up. `H` already holds the font size and every zoom, so a line scales with its cell. It is not a zoom-exempt hairline. At the default 14px font and line height 1.0, `H` 14 gives `T` 1, and 200% gives `H` 28 and `T` 2. At line height 1.2, `H` 17 gives `T` 1, 200% gives `H` 34 and `T` 2, and 300% gives `H` 51 and `T` 3.

| Line | Thickness | Top edge | Shape | Color | SGR 58 | Paint step |
|---|---|---|---|---|---|---|
| Link underline | `T` | as single | Solid | `accent-primary-raised` | Ignored | 3 |
| Underline, single | `T` | `U` with `h = T` | Solid | Cell ink | Replaces the color | 3 |
| Underline, double | `T` each | `U` with `h = 3T` | Two solid lines, a gap of `T` | Cell ink | Replaces the color | 3 |
| Underline, curly | `T` | `U` with `h = 3T` | Center at top + `1.5T`, swing `T` each way, period `8T` | Cell ink | Replaces the color | 3 |
| Underline, dotted | `T` | `U` with `h = T` | On `T`, off `T` | Cell ink | Replaces the color | 3 |
| Underline, dashed | `T` | `U` with `h = T` | On `3T`, off `2T` | Cell ink | Replaces the color | 3 |
| Strikethrough | `T` | `B - round(A / 3) - floor(T / 2)` | Solid | Cell ink | Does not apply | 5 |
| Overline | `T` | Cell top | Solid | Cell ink | Does not apply | 6 |

`U = min(B + T, cell bottom - h)`. A line stays inside its cell, because the next row's fill would cover it. A short cell has no room for three rows under the baseline, so a double or curly underline rises: at line height 1.0 its top edge is one row above `B` at 14px and 28px, and two rows above it at 10px. Its top row then lies under the glyph's bottom row, because the underline paints under the glyph. Neither kind has been painted yet, so send it back to design if it does not read. The phase of the dotted, dashed and curly lines runs from the left edge of the grid, so neighbor cells meet with no seam. A line belongs to each cell that has the attribute: a wide glyph draws it across both of its cells and a blank cell draws it too. Bold and italic do not change a line. Hidden cells (SGR 8) draw no program line. A link under the pointer still draws its underline on them, as **Hidden cells** above says. No line moves, fades or animates, and each appears in one frame.

**Cell ink** is the ink the cell draws after every rule above, including dim and reverse. So a line with no SGR 58 needs no pair of its own: it has the value of its glyph. SGR 58 draws through the same palette as cell color, and no pair is promised. It is not blended by dim.

| Cell | Line with no SGR 58 | Focused, Mocha · Latte | Unfocused, Mocha · Latte | Underline with SGR 58 |
|---|---|---|---|---|
| Default cell | `surface-terminal-focused-fg`, `surface-terminal-unfocused-fg` | 14.52 · 7.99 | 7.37 · 4.73 | Stays |
| ANSI color cell | Its color | No pair | No pair | Stays |
| Dim, outside a match | The blend | 3.95 · 2.39, no pair | 2.89 · 1.97, no pair | Stays |
| Reverse cell or reverse screen | The ink the cell draws | No pair | No pair | Stays |
| Selection | `text-on-active` | 4.62 · 5.40 | 4.62 · 5.40 | Stays |
| Ordinary match | `text-primary` | 6.67 · 6.06 | 4.75 · 4.88 | Stays |
| Active match | `search-match-active-fg`, `search-match-active-unfocused-fg` | 6.23 · 5.03 | 6.95 · 11.21 | Gives way |
| Selected search match | `search-match-selected-fg` | 5.07 · 8.96 | 5.07 · 8.96 | Stays |
| Selected active match | `search-match-selected-fg` | 9.81 · 8.20 | 9.81 · 8.20 | Gives way |
| Vi cursor | `vi-cursor-fg`, `search-match-selected-fg` in the active match | 10.48 · 6.60, in the active match 13.26 · 6.76 | 10.48 · 6.60, in the active match 13.26 · 6.76 | Gives way |
| Block cursor | The swapped ink, `search-match-selected-fg` in the active match | 14.52 · 7.99, in an ordinary match 15.08 · 5.73, in the active match 14.12 · 4.65 | Does not occur | Gives way |
| Link under the pointer | `accent-primary-raised` | 3.17 · 3.84 | 3.17 · 3.84 | Gives way |

**A link under the pointer replaces the program underline** in each of its cells, whatever the kind or color, so one row of the cell never holds two underlines. The cell's strikethrough and overline stay, in `text-on-active`, except on a hidden cell, which draws neither. A cursor cell inside the link draws the underline in the cursor's ink, because the blue would be 1.18 · 2.61 on `term-cursor` and 1.46 · 1.04 on a swapped fill. When the pointer leaves, the program underline comes back in one frame.

**Lost attributes.** A row restored from disk scrollback or a replica can lose the kind or SGR 58. It draws what it still has: an unknown kind is single, and no color is cell ink. Nothing marks the change, because nothing in it is for a user to act on.

**Paint order,** bottom to top:

1. Bed and cell background
2. Overlay fill: selection, match or cursor. A cursor fill replaces a selection on the same cell. A match fill lies over a selection or a cursor on the same cell
3. Underline, program or link
4. Glyph, none on a hidden cell
5. Strikethrough
6. Overline
7. A cursor that is not a block: bar or underline

The glyph sits over the underline so a descender stays readable on a line of another color. With cell ink the two steps look the same, so the order shows only for SGR 58 and the link. Send it back to design if the order cannot hold.

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
- **State grounds** are grounds for grading their inks. Grade 3 applies to marks drawn on a ground. Against its parent, a state ground is held to the state ground pass mark in [section 7](#7-meaning), with no required contrast ratio.
- **None** for disabled ink, ornaments and partitions. A partition is not the only thing that identifies its region: the fill and the content do that too.
- A control is identified by its edge only when nothing else does. A field, Select, Checkbox and Switch track can be empty, so they take `border-control`. A Button has a label, a Tag has a word, a Kbd has a key. They take `border-partition`.

## 6. Ground by role

Read as: this role, on these grounds, is this token. The lowest ratio is across those grounds, Mocha · Latte. Every pair of a `grounds` entry and a `roles` entry has one `matrix` cell in the file. Forbidden cells list their reason here.

### `text-body`

| Token | Grounds | Lowest, Mocha · Latte |
|---|---|---|
| `text-primary` | `crust`, `mantle`, `base`, `term-unfocused`, `raised`, `on-raised`, `field`, `term`, `tab-hover`, `dag-unknown`, `dag-partial`, `dag-awaiting`, `dag-stalled`, `dag-cycle`, `approval`, `crust+hover`, `crust+press`, `mantle+hover`, `mantle+press`, `base+hover`, `term-unfocused+hover`, `term+hover`, `base+press`, `term-unfocused+press`, `term+press`, `on-raised+hover`, `tint-primary@mantle`, `tint-primary@base`, `tint-primary@raised`, `tint-info@crust`, `tint-info@mantle`, `tint-info@base`, `tint-info@raised`, `tint-success@crust`, `tint-success@mantle`, `tint-success@base`, `tint-success@raised`, `tint-warning@mantle`, `tint-warning@base`, `tint-warning@raised`, `tint-danger@crust`, `tint-danger@mantle`, `tint-danger@base`, `tint-agent@mantle`, `tint-agent@base`, `drop-target@mantle`, `drop-target@base`, `drop-target@term-unfocused`, `drop-target@term`, `drop-target@raised`, `file-drop@crust`, `file-drop@mantle`, `file-drop@base`, `file-drop@term-unfocused`, `file-drop@term`, `marquee@mantle`, `marquee@base`, `marquee@term-unfocused`, `marquee@term`, `split-zone@crust`, `split-zone@mantle`, `split-zone@base`, `match@term`, `match@base`, `match@term-unfocused` | 4.75 · 4.51 |
| `text-on-active` | `solid-hover`, `active`, `tint-avatar`, `dag-running`, `dag-failed`, `dag-crashed`, `term-selection`, `raised+hover`, `raised+press`, `tint-danger@raised`, `tint-agent@raised` | 4.62 · 5.40 |
| `text-on-accent` | `fill-primary`, `fill-agent`, `fill-danger`, `fill-success`, `fill-primary+hover`, `fill-primary+press`, `fill-agent+hover`, `fill-agent+press`, `fill-danger+hover`, `fill-danger+press` | 8.10 · 4.91 |
| `notify-warning-fg` | `fill-warning` | 14.76 · 5.03 |
| `text-on-window-close` | `fill-close` | 5.66 · 5.66 |
| `vi-cursor-fg` | `term-cursor` | 10.48 · 6.60 |
| `text-on-active-hover` | `on-raised+press`, `active+hover`, `active+press` | 4.97 · 4.74 |
| `search-match-active-fg` | `match-active@term`, `match-active@base` | 6.23 · 4.68 |
| `search-match-active-unfocused-fg` | `match-active@term-unfocused` | 6.95 · 11.21 |
| `search-match-selected-fg` | `match@term-selection`, `match-active@term-selection` | 5.07 · 8.20 |

Forbidden:

- `track`, `track-raised`. A track holds its thumb and nothing else.
- Every `scrim@*` ground. Inert layer. Content under a scrim has no target, and nothing new is drawn on it.

### `text-secondary`

| Token | Grounds | Lowest, Mocha · Latte |
|---|---|---|
| `text-secondary` | `crust`, `mantle`, `base`, `term-unfocused`, `on-raised`, `field`, `term`, `tab-hover`, `dag-cycle`, `approval`, `tint-primary@base`, `tint-info@mantle`, `tint-info@base`, `tint-success@mantle`, `tint-success@base`, `tint-warning@mantle`, `tint-warning@base`, `tint-danger@base`, `tint-agent@base`, `drop-target@base`, `drop-target@term`, `file-drop@base`, `file-drop@term`, `marquee@base`, `marquee@term` | 5.15 · 4.54 |
| `text-secondary-raised` | `raised`, `dag-unknown`, `dag-partial`, `dag-awaiting`, `dag-stalled`, `crust+hover`, `crust+press`, `mantle+hover`, `mantle+press`, `base+hover`, `term-unfocused+hover`, `term+hover`, `base+press`, `term-unfocused+press`, `term+press`, `tint-primary@mantle`, `tint-primary@raised`, `tint-info@raised`, `tint-success@raised`, `tint-warning@raised`, `tint-danger@crust`, `tint-danger@mantle`, `tint-agent@mantle`, `drop-target@mantle`, `drop-target@raised`, `file-drop@crust`, `file-drop@mantle`, `marquee@mantle`, `split-zone@crust`, `split-zone@mantle`, `split-zone@base`, `drop-target@term-unfocused`, `marquee@term-unfocused`, `file-drop@term-unfocused`, `tint-info@crust`, `tint-success@crust` | 5.15 · 4.51 |
| `text-on-active` | `solid-hover`, `active`, `tint-avatar`, `dag-running`, `dag-failed`, `dag-crashed`, `raised+hover`, `raised+press`, `tint-danger@raised`, `tint-agent@raised` | 4.62 · 5.40 |
| `text-on-accent` | `fill-primary`, `fill-agent`, `fill-danger`, `fill-success`, `fill-primary+hover`, `fill-primary+press`, `fill-agent+hover`, `fill-agent+press`, `fill-danger+hover`, `fill-danger+press` | 8.10 · 4.91 |
| `notify-warning-fg` | `fill-warning` | 14.76 · 5.03 |
| `text-on-window-close` | `fill-close` | 5.66 · 5.66 |
| `text-primary` | `on-raised+hover` | 5.00 · 5.92 |
| `text-on-active-hover` | `on-raised+press`, `active+hover`, `active+press` | 4.97 · 4.74 |

Forbidden:

- `track`, `track-raised`. A track holds its thumb and nothing else.
- `term-selection`, `term-cursor`. A terminal layer holds the cell ink only.
- `match@term`, `match@base`, `match@term-unfocused`, `match-active@term`, `match-active@base`, `match-active@term-unfocused`, `match@term-selection`, `match-active@term-selection`. Only the terminal cell ink sits in a search match.
- Every `scrim@*` ground. Inert layer. Content under a scrim has no target, and nothing new is drawn on it.

### `text-muted`

| Token | Grounds | Lowest, Mocha · Latte |
|---|---|---|
| `text-muted` | `crust`, `mantle`, `base`, `term-unfocused`, `field`, `term`, `tab-hover`, `dag-cycle`, `approval`, `base+hover`, `term+hover`, `tint-primary@base`, `tint-info@mantle`, `tint-info@base`, `tint-success@mantle`, `tint-success@base`, `tint-warning@mantle`, `tint-warning@base`, `tint-danger@base`, `tint-agent@base`, `drop-target@base`, `drop-target@term`, `file-drop@base`, `file-drop@term`, `marquee@base`, `marquee@term` | 5.08 · 4.54 |
| `text-muted-raised` | `raised`, `crust+hover`, `crust+press`, `mantle+hover`, `mantle+press`, `base+press`, `term-unfocused+press`, `term+press`, `tint-primary@mantle`, `tint-danger@crust`, `tint-danger@mantle`, `tint-agent@mantle`, `drop-target@mantle`, `file-drop@crust`, `file-drop@mantle`, `marquee@mantle`, `split-zone@crust`, `split-zone@mantle`, `split-zone@base`, `term-unfocused+hover`, `drop-target@term-unfocused`, `marquee@term-unfocused`, `file-drop@term-unfocused`, `tint-info@crust`, `tint-success@crust` | 4.67 · 4.59 |
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
- `match@term`, `match@base`, `match@term-unfocused`, `match-active@term`, `match-active@base`, `match-active@term-unfocused`, `match@term-selection`, `match-active@term-selection`. Only the terminal cell ink sits in a search match.
- Every `scrim@*` ground. Inert layer. Content under a scrim has no target, and nothing new is drawn on it.

### `text-placeholder`

| Token | Grounds | Lowest, Mocha · Latte |
|---|---|---|
| `text-placeholder` | `base`, `term-unfocused`, `field` | 5.65 · 4.73 |

Forbidden:

- `crust`, `mantle`, `raised`, `on-raised`, `solid-hover`, `active`, `term`, `tab-hover`, `tint-avatar`, `dag-running`, `dag-failed`, `dag-unknown`, `dag-partial`, `dag-awaiting`, `dag-stalled`, `dag-crashed`, `dag-cycle`, `approval`, `crust+hover`, `crust+press`, `mantle+hover`, `mantle+press`, `base+hover`, `term-unfocused+hover`, `term+hover`, `base+press`, `term-unfocused+press`, `term+press`, `raised+hover`, `raised+press`, `on-raised+hover`, `on-raised+press`, `active+hover`, `active+press`, `tint-primary@mantle`, `tint-primary@base`, `tint-primary@raised`, `tint-info@crust`, `tint-info@mantle`, `tint-info@base`, `tint-info@raised`, `tint-success@crust`, `tint-success@mantle`, `tint-success@base`, `tint-success@raised`, `tint-warning@mantle`, `tint-warning@base`, `tint-warning@raised`, `tint-danger@crust`, `tint-danger@mantle`, `tint-danger@base`, `tint-danger@raised`, `tint-agent@mantle`, `tint-agent@base`, `tint-agent@raised`, `drop-target@mantle`, `drop-target@base`, `drop-target@term-unfocused`, `drop-target@term`, `drop-target@raised`, `file-drop@crust`, `file-drop@mantle`, `file-drop@base`, `file-drop@term-unfocused`, `file-drop@term`, `marquee@mantle`, `marquee@base`, `marquee@term-unfocused`, `marquee@term`, `split-zone@crust`, `split-zone@mantle`, `split-zone@base`. A placeholder sits only in a field.
- `fill-primary`, `fill-agent`, `fill-danger`, `fill-success`, `fill-warning`, `fill-close`, `fill-primary+hover`, `fill-primary+press`, `fill-agent+hover`, `fill-agent+press`, `fill-danger+hover`, `fill-danger+press`. A filled control carries one ink pair. Hue or neutral steps on it would read as a second state.
- `track`, `track-raised`. A track holds its thumb and nothing else.
- `term-selection`, `term-cursor`. A terminal layer holds the cell ink only.
- `match@term`, `match@base`, `match@term-unfocused`, `match-active@term`, `match-active@base`, `match-active@term-unfocused`, `match@term-selection`, `match-active@term-selection`. Only the terminal cell ink sits in a search match.
- Every `scrim@*` ground. Inert layer. Content under a scrim has no target, and nothing new is drawn on it.

### `text-disabled`

| Token | Grounds | Lowest, Mocha · Latte |
|---|---|---|
| `text-disabled` | `crust`, `mantle`, `base`, `term-unfocused`, `raised`, `on-raised`, `field`, `solid-hover`, `active`, `term`, `tab-hover` | no target |

Forbidden:

- `fill-primary`, `fill-agent`, `fill-danger`, `fill-success`, `fill-warning`, `fill-close`, `tint-avatar`, `dag-running`, `dag-failed`, `dag-unknown`, `dag-partial`, `dag-awaiting`, `dag-stalled`, `dag-crashed`, `dag-cycle`, `approval`, `fill-primary+hover`, `fill-primary+press`, `fill-agent+hover`, `fill-agent+press`, `fill-danger+hover`, `fill-danger+press`, `tint-primary@mantle`, `tint-primary@base`, `tint-primary@raised`, `tint-info@crust`, `tint-info@mantle`, `tint-info@base`, `tint-info@raised`, `tint-success@crust`, `tint-success@mantle`, `tint-success@base`, `tint-success@raised`, `tint-warning@mantle`, `tint-warning@base`, `tint-warning@raised`, `tint-danger@crust`, `tint-danger@mantle`, `tint-danger@base`, `tint-danger@raised`, `tint-agent@mantle`, `tint-agent@base`, `tint-agent@raised`, `drop-target@mantle`, `drop-target@base`, `drop-target@term-unfocused`, `drop-target@term`, `drop-target@raised`, `file-drop@crust`, `file-drop@mantle`, `file-drop@base`, `file-drop@term-unfocused`, `file-drop@term`, `marquee@mantle`, `marquee@base`, `marquee@term-unfocused`, `marquee@term`, `split-zone@crust`, `split-zone@mantle`, `split-zone@base`. Disabled drops the fill first, then the ink. Disabled ink never sits on an accent or a tint.
- `track`, `track-raised`. A track holds its thumb and nothing else.
- `term-selection`, `term-cursor`. A terminal layer holds the cell ink only.
- `crust+hover`, `crust+press`, `mantle+hover`, `mantle+press`, `base+hover`, `term-unfocused+hover`, `term+hover`, `base+press`, `term-unfocused+press`, `term+press`, `raised+hover`, `raised+press`, `on-raised+hover`, `on-raised+press`, `active+hover`, `active+press`. A disabled item takes no hover or press.
- `match@term`, `match@base`, `match@term-unfocused`, `match-active@term`, `match-active@base`, `match-active@term-unfocused`, `match@term-selection`, `match-active@term-selection`. Only the terminal cell ink sits in a search match.
- Every `scrim@*` ground. Inert layer. Content under a scrim has no target, and nothing new is drawn on it.

### `text-match`

| Token | Grounds | Lowest, Mocha · Latte |
|---|---|---|
| `accent-primary-raised` | `crust`, `mantle`, `base`, `term-unfocused`, `raised`, `field`, `term`, `tab-hover`, `dag-unknown`, `dag-partial`, `dag-stalled`, `dag-cycle`, `approval`, `crust+hover`, `crust+press`, `mantle+hover`, `mantle+press`, `base+hover`, `term-unfocused+hover`, `term+hover`, `base+press`, `term-unfocused+press`, `term+press`, `raised+hover`, `tint-primary@mantle`, `tint-primary@base`, `tint-primary@raised`, `tint-info@crust`, `tint-info@mantle`, `tint-info@base`, `tint-success@crust`, `tint-success@mantle`, `tint-success@base`, `tint-warning@mantle`, `tint-warning@base`, `tint-danger@crust`, `tint-danger@mantle`, `tint-danger@base`, `tint-agent@mantle`, `tint-agent@base`, `tint-agent@raised`, `drop-target@mantle`, `drop-target@base`, `drop-target@term-unfocused`, `drop-target@term`, `drop-target@raised`, `file-drop@crust`, `file-drop@mantle`, `file-drop@base`, `file-drop@term-unfocused`, `file-drop@term`, `marquee@mantle`, `marquee@base`, `marquee@term-unfocused`, `marquee@term`, `split-zone@crust`, `split-zone@mantle`, `split-zone@base` | 4.55 · 4.52 |
| `accent-primary-strong` | `on-raised`, `solid-hover`, `tint-avatar`, `dag-running`, `dag-failed`, `dag-awaiting`, `dag-crashed`, `raised+press`, `tint-info@raised`, `tint-success@raised`, `tint-warning@raised`, `tint-danger@raised` | 4.60 · 4.54 |
| `text-on-active` | `active` | 4.62 · 5.40 |
| `text-on-active-hover` | `active+hover`, `active+press` | 4.97 · 4.74 |
| `text-on-active` + underline | `active` | 4.62 · 5.40 |
| `text-on-active-hover` + underline | `active+hover`, `active+press` | 4.97 · 4.74 |

Forbidden:

- `fill-primary`, `fill-agent`, `fill-danger`, `fill-success`, `fill-warning`, `fill-close`, `fill-primary+hover`, `fill-primary+press`, `fill-agent+hover`, `fill-agent+press`, `fill-danger+hover`, `fill-danger+press`. A filled control carries one ink pair. Hue or neutral steps on it would read as a second state.
- `track`, `track-raised`. A track holds its thumb and nothing else.
- `term-selection`, `term-cursor`. A terminal layer holds the cell ink only.
- `on-raised+hover`, `on-raised+press`. No token holds the grade here in both themes, and no component needs this pair.
- `match@term`, `match@base`, `match@term-unfocused`, `match-active@term`, `match-active@base`, `match-active@term-unfocused`, `match@term-selection`, `match-active@term-selection`. Only the terminal cell ink sits in a search match.
- Every `scrim@*` ground. Inert layer. Content under a scrim has no target, and nothing new is drawn on it.

### `text-primary`

| Token | Grounds | Lowest, Mocha · Latte |
|---|---|---|
| `accent-primary-raised` | `crust`, `mantle`, `base`, `term-unfocused`, `raised`, `field`, `term`, `tab-hover`, `crust+hover`, `crust+press`, `mantle+hover`, `mantle+press`, `base+hover`, `term-unfocused+hover`, `term+hover`, `base+press`, `term-unfocused+press`, `term+press`, `raised+hover`, `tint-primary@mantle`, `tint-primary@base`, `tint-primary@raised`, `drop-target@mantle`, `drop-target@base`, `drop-target@term-unfocused`, `drop-target@term`, `drop-target@raised`, `file-drop@crust`, `file-drop@mantle`, `file-drop@base`, `file-drop@term-unfocused`, `file-drop@term`, `marquee@mantle`, `marquee@base`, `marquee@term-unfocused`, `marquee@term`, `split-zone@crust`, `split-zone@mantle`, `split-zone@base` | 4.68 · 4.52 |
| `accent-primary-strong` | `on-raised`, `solid-hover`, `tint-avatar`, `dag-running`, `raised+press` | 4.60 · 4.54 |

Forbidden:

- `active`, `active+hover`, `active+press`. No hue reaches 4.5:1 on this fill and still differs from the row ink. Use the row ink, with a hue glyph beside it.
- `fill-primary`, `fill-agent`, `fill-danger`, `fill-success`, `fill-warning`, `fill-close`, `fill-primary+hover`, `fill-primary+press`, `fill-agent+hover`, `fill-agent+press`, `fill-danger+hover`, `fill-danger+press`. A filled control carries one ink pair. Hue or neutral steps on it would read as a second state.
- `dag-failed`, `dag-unknown`, `dag-partial`, `dag-awaiting`, `dag-stalled`, `dag-crashed`, `dag-cycle`, `approval`, `tint-info@crust`, `tint-info@mantle`, `tint-info@base`, `tint-info@raised`, `tint-success@crust`, `tint-success@mantle`, `tint-success@base`, `tint-success@raised`, `tint-warning@mantle`, `tint-warning@base`, `tint-warning@raised`, `tint-danger@crust`, `tint-danger@mantle`, `tint-danger@base`, `tint-danger@raised`, `tint-agent@mantle`, `tint-agent@base`, `tint-agent@raised`. A tint carries its own hue and neutrals. A second hue reads as a conflict.
- `track`, `track-raised`. A track holds its thumb and nothing else.
- `term-selection`, `term-cursor`. A terminal layer holds the cell ink only.
- `on-raised+hover`, `on-raised+press`. No token holds the grade here in both themes, and no component needs this pair.
- `match@term`, `match@base`, `match@term-unfocused`, `match-active@term`, `match-active@base`, `match-active@term-unfocused`, `match@term-selection`, `match-active@term-selection`. Only the terminal cell ink sits in a search match.
- Every `scrim@*` ground. Inert layer. Content under a scrim has no target, and nothing new is drawn on it.

### `text-info`

| Token | Grounds | Lowest, Mocha · Latte |
|---|---|---|
| `accent-info-raised` | `crust`, `mantle`, `base`, `term-unfocused`, `raised`, `on-raised`, `field`, `term`, `tab-hover`, `crust+hover`, `mantle+hover`, `mantle+press`, `base+hover`, `term-unfocused+hover`, `term+hover`, `base+press`, `term+press`, `on-raised+hover`, `tint-info@crust`, `tint-info@mantle`, `tint-info@base` | 4.65 · 4.70 |
| `accent-info-strong` | `solid-hover`, `crust+press`, `raised+hover`, `raised+press`, `tint-info@raised`, `term-unfocused+press` | 5.52 · 4.81 |

Forbidden:

- `active`, `active+hover`, `active+press`. No hue reaches 4.5:1 on this fill and still differs from the row ink. Use the row ink, with a hue glyph beside it.
- `fill-primary`, `fill-agent`, `fill-danger`, `fill-success`, `fill-warning`, `fill-close`, `fill-primary+hover`, `fill-primary+press`, `fill-agent+hover`, `fill-agent+press`, `fill-danger+hover`, `fill-danger+press`. A filled control carries one ink pair. Hue or neutral steps on it would read as a second state.
- `tint-avatar`, `dag-running`, `dag-failed`, `dag-unknown`, `dag-partial`, `dag-awaiting`, `dag-stalled`, `dag-crashed`, `dag-cycle`, `approval`, `tint-primary@mantle`, `tint-primary@base`, `tint-primary@raised`, `tint-success@crust`, `tint-success@mantle`, `tint-success@base`, `tint-success@raised`, `tint-warning@mantle`, `tint-warning@base`, `tint-warning@raised`, `tint-danger@crust`, `tint-danger@mantle`, `tint-danger@base`, `tint-danger@raised`, `tint-agent@mantle`, `tint-agent@base`, `tint-agent@raised`, `drop-target@mantle`, `drop-target@base`, `drop-target@term-unfocused`, `drop-target@term`, `drop-target@raised`, `file-drop@crust`, `file-drop@mantle`, `file-drop@base`, `file-drop@term-unfocused`, `file-drop@term`, `marquee@mantle`, `marquee@base`, `marquee@term-unfocused`, `marquee@term`, `split-zone@crust`, `split-zone@mantle`, `split-zone@base`. A tint carries its own hue and neutrals. A second hue reads as a conflict.
- `track`, `track-raised`. A track holds its thumb and nothing else.
- `term-selection`, `term-cursor`. A terminal layer holds the cell ink only.
- `on-raised+press`. No token holds the grade here in both themes, and no component needs this pair.
- `match@term`, `match@base`, `match@term-unfocused`, `match-active@term`, `match-active@base`, `match-active@term-unfocused`, `match@term-selection`, `match-active@term-selection`. Only the terminal cell ink sits in a search match.
- Every `scrim@*` ground. Inert layer. Content under a scrim has no target, and nothing new is drawn on it.

### `text-success`

| Token | Grounds | Lowest, Mocha · Latte |
|---|---|---|
| `accent-success-raised` | `crust`, `mantle`, `base`, `term-unfocused`, `raised`, `on-raised`, `field`, `term`, `tab-hover`, `crust+hover`, `mantle+hover`, `mantle+press`, `base+hover`, `term-unfocused+hover`, `term+hover`, `base+press`, `term+press`, `on-raised+hover`, `tint-success@crust`, `tint-success@mantle`, `tint-success@base` | 4.86 · 4.76 |
| `accent-success-strong` | `solid-hover`, `crust+press`, `raised+hover`, `raised+press`, `tint-success@raised`, `term-unfocused+press` | 5.78 · 4.72 |

Forbidden:

- `active`, `active+hover`, `active+press`. No hue reaches 4.5:1 on this fill and still differs from the row ink. Use the row ink, with a hue glyph beside it.
- `fill-primary`, `fill-agent`, `fill-danger`, `fill-success`, `fill-warning`, `fill-close`, `fill-primary+hover`, `fill-primary+press`, `fill-agent+hover`, `fill-agent+press`, `fill-danger+hover`, `fill-danger+press`. A filled control carries one ink pair. Hue or neutral steps on it would read as a second state.
- `tint-avatar`, `dag-running`, `dag-failed`, `dag-unknown`, `dag-partial`, `dag-awaiting`, `dag-stalled`, `dag-crashed`, `dag-cycle`, `approval`, `tint-primary@mantle`, `tint-primary@base`, `tint-primary@raised`, `tint-info@crust`, `tint-info@mantle`, `tint-info@base`, `tint-info@raised`, `tint-warning@mantle`, `tint-warning@base`, `tint-warning@raised`, `tint-danger@crust`, `tint-danger@mantle`, `tint-danger@base`, `tint-danger@raised`, `tint-agent@mantle`, `tint-agent@base`, `tint-agent@raised`, `drop-target@mantle`, `drop-target@base`, `drop-target@term-unfocused`, `drop-target@term`, `drop-target@raised`, `file-drop@crust`, `file-drop@mantle`, `file-drop@base`, `file-drop@term-unfocused`, `file-drop@term`, `marquee@mantle`, `marquee@base`, `marquee@term-unfocused`, `marquee@term`, `split-zone@crust`, `split-zone@mantle`, `split-zone@base`. A tint carries its own hue and neutrals. A second hue reads as a conflict.
- `track`, `track-raised`. A track holds its thumb and nothing else.
- `term-selection`, `term-cursor`. A terminal layer holds the cell ink only.
- `on-raised+press`. No token holds the grade here in both themes, and no component needs this pair.
- `match@term`, `match@base`, `match@term-unfocused`, `match-active@term`, `match-active@base`, `match-active@term-unfocused`, `match@term-selection`, `match-active@term-selection`. Only the terminal cell ink sits in a search match.
- Every `scrim@*` ground. Inert layer. Content under a scrim has no target, and nothing new is drawn on it.

### `text-warning`

| Token | Grounds | Lowest, Mocha · Latte |
|---|---|---|
| `accent-warning-raised` | `crust`, `mantle`, `base`, `term-unfocused`, `raised`, `on-raised`, `field`, `term`, `tab-hover`, `dag-unknown`, `dag-awaiting`, `dag-stalled`, `dag-cycle`, `crust+hover`, `crust+press`, `mantle+hover`, `mantle+press`, `base+hover`, `term-unfocused+hover`, `term+hover`, `base+press`, `term-unfocused+press`, `term+press`, `on-raised+hover`, `on-raised+press`, `tint-warning@mantle`, `tint-warning@base`, `tint-warning@raised` | 5.11 · 4.68 |
| `accent-warning-strong` | `solid-hover`, `raised+hover`, `raised+press` | 6.76 · 4.59 |

Forbidden:

- `active`, `active+hover`, `active+press`. No hue reaches 4.5:1 on this fill and still differs from the row ink. Use the row ink, with a hue glyph beside it.
- `fill-primary`, `fill-agent`, `fill-danger`, `fill-success`, `fill-warning`, `fill-close`, `fill-primary+hover`, `fill-primary+press`, `fill-agent+hover`, `fill-agent+press`, `fill-danger+hover`, `fill-danger+press`. A filled control carries one ink pair. Hue or neutral steps on it would read as a second state.
- `tint-avatar`, `dag-running`, `dag-failed`, `dag-partial`, `dag-crashed`, `approval`, `tint-primary@mantle`, `tint-primary@base`, `tint-primary@raised`, `tint-info@crust`, `tint-info@mantle`, `tint-info@base`, `tint-info@raised`, `tint-success@crust`, `tint-success@mantle`, `tint-success@base`, `tint-success@raised`, `tint-danger@crust`, `tint-danger@mantle`, `tint-danger@base`, `tint-danger@raised`, `tint-agent@mantle`, `tint-agent@base`, `tint-agent@raised`, `drop-target@mantle`, `drop-target@base`, `drop-target@term-unfocused`, `drop-target@term`, `drop-target@raised`, `file-drop@crust`, `file-drop@mantle`, `file-drop@base`, `file-drop@term-unfocused`, `file-drop@term`, `marquee@mantle`, `marquee@base`, `marquee@term-unfocused`, `marquee@term`, `split-zone@crust`, `split-zone@mantle`, `split-zone@base`. A tint carries its own hue and neutrals. A second hue reads as a conflict.
- `track`, `track-raised`. A track holds its thumb and nothing else.
- `term-selection`, `term-cursor`. A terminal layer holds the cell ink only.
- `match@term`, `match@base`, `match@term-unfocused`, `match-active@term`, `match-active@base`, `match-active@term-unfocused`, `match@term-selection`, `match-active@term-selection`. Only the terminal cell ink sits in a search match.
- Every `scrim@*` ground. Inert layer. Content under a scrim has no target, and nothing new is drawn on it.

### `text-attention`

| Token | Grounds | Lowest, Mocha · Latte |
|---|---|---|
| `accent-attention-raised` | `crust`, `mantle`, `base`, `term-unfocused`, `raised`, `on-raised`, `field`, `term`, `tab-hover`, `dag-partial`, `crust+hover`, `crust+press`, `mantle+hover`, `mantle+press`, `base+hover`, `term-unfocused+hover`, `term+hover`, `base+press`, `term-unfocused+press`, `term+press` | 5.15 · 4.56 |
| `accent-attention-strong` | `solid-hover`, `raised+hover`, `raised+press` | 4.85 · 5.00 |

Forbidden:

- `active`, `active+hover`, `active+press`. No hue reaches 4.5:1 on this fill and still differs from the row ink. Use the row ink, with a hue glyph beside it.
- `fill-primary`, `fill-agent`, `fill-danger`, `fill-success`, `fill-warning`, `fill-close`, `fill-primary+hover`, `fill-primary+press`, `fill-agent+hover`, `fill-agent+press`, `fill-danger+hover`, `fill-danger+press`. A filled control carries one ink pair. Hue or neutral steps on it would read as a second state.
- `tint-avatar`, `dag-running`, `dag-failed`, `dag-unknown`, `dag-awaiting`, `dag-stalled`, `dag-crashed`, `dag-cycle`, `approval`, `tint-primary@mantle`, `tint-primary@base`, `tint-primary@raised`, `tint-info@crust`, `tint-info@mantle`, `tint-info@base`, `tint-info@raised`, `tint-success@crust`, `tint-success@mantle`, `tint-success@base`, `tint-success@raised`, `tint-warning@mantle`, `tint-warning@base`, `tint-warning@raised`, `tint-danger@crust`, `tint-danger@mantle`, `tint-danger@base`, `tint-danger@raised`, `tint-agent@mantle`, `tint-agent@base`, `tint-agent@raised`, `drop-target@mantle`, `drop-target@base`, `drop-target@term-unfocused`, `drop-target@term`, `drop-target@raised`, `file-drop@crust`, `file-drop@mantle`, `file-drop@base`, `file-drop@term-unfocused`, `file-drop@term`, `marquee@mantle`, `marquee@base`, `marquee@term-unfocused`, `marquee@term`, `split-zone@crust`, `split-zone@mantle`, `split-zone@base`. A tint carries its own hue and neutrals. A second hue reads as a conflict.
- `track`, `track-raised`. A track holds its thumb and nothing else.
- `term-selection`, `term-cursor`. A terminal layer holds the cell ink only.
- `on-raised+hover`, `on-raised+press`. No token holds the grade here in both themes, and no component needs this pair.
- `match@term`, `match@base`, `match@term-unfocused`, `match-active@term`, `match-active@base`, `match-active@term-unfocused`, `match@term-selection`, `match-active@term-selection`. Only the terminal cell ink sits in a search match.
- Every `scrim@*` ground. Inert layer. Content under a scrim has no target, and nothing new is drawn on it.

### `text-danger`

| Token | Grounds | Lowest, Mocha · Latte |
|---|---|---|
| `accent-danger-raised` | `crust`, `mantle`, `base`, `term-unfocused`, `raised`, `field`, `term`, `tab-hover`, `approval`, `crust+hover`, `mantle+hover`, `mantle+press`, `base+hover`, `term-unfocused+hover`, `term+hover`, `base+press`, `term+press`, `tint-danger@crust`, `tint-danger@mantle`, `tint-danger@base` | 4.90 · 4.63 |
| `accent-danger-strong` | `on-raised`, `solid-hover`, `dag-failed`, `dag-crashed`, `crust+press`, `raised+hover`, `raised+press`, `tint-danger@raised`, `term-unfocused+press` | 4.61 · 4.52 |

Forbidden:

- `active`, `active+hover`, `active+press`. No hue reaches 4.5:1 on this fill and still differs from the row ink. Use the row ink, with a hue glyph beside it.
- `fill-primary`, `fill-agent`, `fill-danger`, `fill-success`, `fill-warning`, `fill-close`, `fill-primary+hover`, `fill-primary+press`, `fill-agent+hover`, `fill-agent+press`, `fill-danger+hover`, `fill-danger+press`. A filled control carries one ink pair. Hue or neutral steps on it would read as a second state.
- `tint-avatar`, `dag-running`, `dag-unknown`, `dag-partial`, `dag-awaiting`, `dag-stalled`, `dag-cycle`, `tint-primary@mantle`, `tint-primary@base`, `tint-primary@raised`, `tint-info@crust`, `tint-info@mantle`, `tint-info@base`, `tint-info@raised`, `tint-success@crust`, `tint-success@mantle`, `tint-success@base`, `tint-success@raised`, `tint-warning@mantle`, `tint-warning@base`, `tint-warning@raised`, `tint-agent@mantle`, `tint-agent@base`, `tint-agent@raised`, `drop-target@mantle`, `drop-target@base`, `drop-target@term-unfocused`, `drop-target@term`, `drop-target@raised`, `file-drop@crust`, `file-drop@mantle`, `file-drop@base`, `file-drop@term-unfocused`, `file-drop@term`, `marquee@mantle`, `marquee@base`, `marquee@term-unfocused`, `marquee@term`, `split-zone@crust`, `split-zone@mantle`, `split-zone@base`. A tint carries its own hue and neutrals. A second hue reads as a conflict.
- `track`, `track-raised`. A track holds its thumb and nothing else.
- `term-selection`, `term-cursor`. A terminal layer holds the cell ink only.
- `on-raised+hover`, `on-raised+press`. No token holds the grade here in both themes, and no component needs this pair.
- `match@term`, `match@base`, `match@term-unfocused`, `match-active@term`, `match-active@base`, `match-active@term-unfocused`, `match@term-selection`, `match-active@term-selection`. Only the terminal cell ink sits in a search match.
- Every `scrim@*` ground. Inert layer. Content under a scrim has no target, and nothing new is drawn on it.

### `text-agent`

| Token | Grounds | Lowest, Mocha · Latte |
|---|---|---|
| `accent-agent-raised` | `crust`, `mantle`, `base`, `term-unfocused`, `raised`, `field`, `term`, `tab-hover`, `crust+hover`, `mantle+hover`, `mantle+press`, `base+hover`, `term-unfocused+hover`, `term+hover`, `base+press`, `term+press`, `tint-agent@mantle`, `tint-agent@base` | 5.59 · 4.72 |
| `accent-agent-strong` | `on-raised`, `solid-hover`, `crust+press`, `raised+hover`, `raised+press`, `tint-agent@raised`, `term-unfocused+press` | 4.57 · 4.87 |

Forbidden:

- `active`, `active+hover`, `active+press`. No hue reaches 4.5:1 on this fill and still differs from the row ink. Use the row ink, with a hue glyph beside it.
- `fill-primary`, `fill-agent`, `fill-danger`, `fill-success`, `fill-warning`, `fill-close`, `fill-primary+hover`, `fill-primary+press`, `fill-agent+hover`, `fill-agent+press`, `fill-danger+hover`, `fill-danger+press`. A filled control carries one ink pair. Hue or neutral steps on it would read as a second state.
- `tint-avatar`, `dag-running`, `dag-failed`, `dag-unknown`, `dag-partial`, `dag-awaiting`, `dag-stalled`, `dag-crashed`, `dag-cycle`, `approval`, `tint-primary@mantle`, `tint-primary@base`, `tint-primary@raised`, `tint-info@crust`, `tint-info@mantle`, `tint-info@base`, `tint-info@raised`, `tint-success@crust`, `tint-success@mantle`, `tint-success@base`, `tint-success@raised`, `tint-warning@mantle`, `tint-warning@base`, `tint-warning@raised`, `tint-danger@crust`, `tint-danger@mantle`, `tint-danger@base`, `tint-danger@raised`, `drop-target@mantle`, `drop-target@base`, `drop-target@term-unfocused`, `drop-target@term`, `drop-target@raised`, `file-drop@crust`, `file-drop@mantle`, `file-drop@base`, `file-drop@term-unfocused`, `file-drop@term`, `marquee@mantle`, `marquee@base`, `marquee@term-unfocused`, `marquee@term`, `split-zone@crust`, `split-zone@mantle`, `split-zone@base`. A tint carries its own hue and neutrals. A second hue reads as a conflict.
- `track`, `track-raised`. A track holds its thumb and nothing else.
- `term-selection`, `term-cursor`. A terminal layer holds the cell ink only.
- `on-raised+hover`, `on-raised+press`. No token holds the grade here in both themes, and no component needs this pair.
- `match@term`, `match@base`, `match@term-unfocused`, `match-active@term`, `match-active@base`, `match-active@term-unfocused`, `match@term-selection`, `match-active@term-selection`. Only the terminal cell ink sits in a search match.
- Every `scrim@*` ground. Inert layer. Content under a scrim has no target, and nothing new is drawn on it.

### `text-remote`

| Token | Grounds | Lowest, Mocha · Latte |
|---|---|---|
| `accent-remote-raised` | `crust`, `mantle`, `base`, `term-unfocused`, `raised`, `on-raised`, `field`, `term`, `tab-hover`, `crust+hover`, `mantle+hover`, `mantle+press`, `base+hover`, `term-unfocused+hover`, `term+hover`, `base+press`, `term+press`, `on-raised+hover`, `tint-info@crust`, `tint-info@mantle`, `tint-info@base` | 4.65 · 4.70 |
| `accent-remote-strong` | `solid-hover`, `crust+press`, `raised+hover`, `raised+press`, `tint-info@raised`, `term-unfocused+press` | 5.52 · 4.81 |

Forbidden:

- `active`, `active+hover`, `active+press`. No hue reaches 4.5:1 on this fill and still differs from the row ink. Use the row ink, with a hue glyph beside it.
- `fill-primary`, `fill-agent`, `fill-danger`, `fill-success`, `fill-warning`, `fill-close`, `fill-primary+hover`, `fill-primary+press`, `fill-agent+hover`, `fill-agent+press`, `fill-danger+hover`, `fill-danger+press`. A filled control carries one ink pair. Hue or neutral steps on it would read as a second state.
- `tint-avatar`, `dag-running`, `dag-failed`, `dag-unknown`, `dag-partial`, `dag-awaiting`, `dag-stalled`, `dag-crashed`, `dag-cycle`, `approval`, `tint-primary@mantle`, `tint-primary@base`, `tint-primary@raised`, `tint-success@crust`, `tint-success@mantle`, `tint-success@base`, `tint-success@raised`, `tint-warning@mantle`, `tint-warning@base`, `tint-warning@raised`, `tint-danger@crust`, `tint-danger@mantle`, `tint-danger@base`, `tint-danger@raised`, `tint-agent@mantle`, `tint-agent@base`, `tint-agent@raised`, `drop-target@mantle`, `drop-target@base`, `drop-target@term-unfocused`, `drop-target@term`, `drop-target@raised`, `file-drop@crust`, `file-drop@mantle`, `file-drop@base`, `file-drop@term-unfocused`, `file-drop@term`, `marquee@mantle`, `marquee@base`, `marquee@term-unfocused`, `marquee@term`, `split-zone@crust`, `split-zone@mantle`, `split-zone@base`. A tint carries its own hue and neutrals. A second hue reads as a conflict.
- `track`, `track-raised`. A track holds its thumb and nothing else.
- `term-selection`, `term-cursor`. A terminal layer holds the cell ink only.
- `on-raised+press`. No token holds the grade here in both themes, and no component needs this pair.
- `match@term`, `match@base`, `match@term-unfocused`, `match-active@term`, `match-active@base`, `match-active@term-unfocused`, `match@term-selection`, `match-active@term-selection`. Only the terminal cell ink sits in a search match.
- Every `scrim@*` ground. Inert layer. Content under a scrim has no target, and nothing new is drawn on it.

### `text-attached`

| Token | Grounds | Lowest, Mocha · Latte |
|---|---|---|
| `accent-attached-raised` | `crust`, `mantle`, `base`, `term-unfocused`, `raised`, `on-raised`, `field`, `solid-hover`, `term`, `tab-hover`, `crust+hover`, `crust+press`, `mantle+hover`, `mantle+press`, `base+hover`, `term-unfocused+hover`, `term+hover`, `base+press`, `term-unfocused+press`, `term+press` | 5.10 · 4.51 |
| `accent-attached-strong` | `raised+hover`, `raised+press` | 4.80 · 4.54 |

Forbidden:

- `active`, `active+hover`, `active+press`. No hue reaches 4.5:1 on this fill and still differs from the row ink. Use the row ink, with a hue glyph beside it.
- `fill-primary`, `fill-agent`, `fill-danger`, `fill-success`, `fill-warning`, `fill-close`, `fill-primary+hover`, `fill-primary+press`, `fill-agent+hover`, `fill-agent+press`, `fill-danger+hover`, `fill-danger+press`. A filled control carries one ink pair. Hue or neutral steps on it would read as a second state.
- `tint-avatar`, `dag-running`, `dag-failed`, `dag-unknown`, `dag-partial`, `dag-awaiting`, `dag-stalled`, `dag-crashed`, `dag-cycle`, `approval`, `tint-primary@mantle`, `tint-primary@base`, `tint-primary@raised`, `tint-info@crust`, `tint-info@mantle`, `tint-info@base`, `tint-info@raised`, `tint-success@crust`, `tint-success@mantle`, `tint-success@base`, `tint-success@raised`, `tint-warning@mantle`, `tint-warning@base`, `tint-warning@raised`, `tint-danger@crust`, `tint-danger@mantle`, `tint-danger@base`, `tint-danger@raised`, `tint-agent@mantle`, `tint-agent@base`, `tint-agent@raised`, `drop-target@mantle`, `drop-target@base`, `drop-target@term-unfocused`, `drop-target@term`, `drop-target@raised`, `file-drop@crust`, `file-drop@mantle`, `file-drop@base`, `file-drop@term-unfocused`, `file-drop@term`, `marquee@mantle`, `marquee@base`, `marquee@term-unfocused`, `marquee@term`, `split-zone@crust`, `split-zone@mantle`, `split-zone@base`. A tint carries its own hue and neutrals. A second hue reads as a conflict.
- `track`, `track-raised`. A track holds its thumb and nothing else.
- `term-selection`, `term-cursor`. A terminal layer holds the cell ink only.
- `on-raised+hover`, `on-raised+press`. No token holds the grade here in both themes, and no component needs this pair.
- `match@term`, `match@base`, `match@term-unfocused`, `match-active@term`, `match-active@base`, `match-active@term-unfocused`, `match@term-selection`, `match-active@term-selection`. Only the terminal cell ink sits in a search match.
- Every `scrim@*` ground. Inert layer. Content under a scrim has no target, and nothing new is drawn on it.

### `glyph`

| Token | Grounds | Lowest, Mocha · Latte |
|---|---|---|
| `text-secondary` | `crust`, `mantle`, `base`, `term-unfocused`, `raised`, `on-raised`, `field`, `solid-hover`, `term`, `tab-hover`, `tint-avatar`, `dag-running`, `dag-failed`, `dag-unknown`, `dag-partial`, `dag-awaiting`, `dag-stalled`, `dag-crashed`, `dag-cycle`, `approval`, `crust+hover`, `crust+press`, `mantle+hover`, `mantle+press`, `base+hover`, `term-unfocused+hover`, `term+hover`, `base+press`, `term-unfocused+press`, `term+press`, `raised+hover`, `raised+press`, `on-raised+hover`, `on-raised+press`, `tint-primary@mantle`, `tint-primary@base`, `tint-primary@raised`, `tint-info@crust`, `tint-info@mantle`, `tint-info@base`, `tint-info@raised`, `tint-success@crust`, `tint-success@mantle`, `tint-success@base`, `tint-success@raised`, `tint-warning@mantle`, `tint-warning@base`, `tint-warning@raised`, `tint-danger@crust`, `tint-danger@mantle`, `tint-danger@base`, `tint-danger@raised`, `tint-agent@mantle`, `tint-agent@base`, `tint-agent@raised`, `drop-target@mantle`, `drop-target@base`, `drop-target@term-unfocused`, `drop-target@term`, `drop-target@raised`, `file-drop@crust`, `file-drop@mantle`, `file-drop@base`, `file-drop@term-unfocused`, `file-drop@term`, `marquee@mantle`, `marquee@base`, `marquee@term-unfocused`, `marquee@term`, `split-zone@crust`, `split-zone@mantle`, `split-zone@base` | 3.67 · 3.12 |
| `text-on-active` | `active`, `active+hover`, `active+press` | 3.43 · 4.21 |
| `text-on-accent` | `fill-primary`, `fill-agent`, `fill-danger`, `fill-success`, `fill-close`, `fill-primary+hover`, `fill-primary+press`, `fill-agent+hover`, `fill-agent+press`, `fill-danger+hover`, `fill-danger+press` | 3.31 · 4.91 |
| `notify-warning-fg` | `fill-warning` | 14.76 · 5.03 |
| `control-thumb` | `track` | 3.38 · 4.35 |
| `control-thumb-raised` | `track-raised` | 3.70 · 5.64 |

Forbidden:

- `term-selection`, `term-cursor`. A terminal layer holds the cell ink only.
- `match@term`, `match@base`, `match@term-unfocused`, `match-active@term`, `match-active@base`, `match-active@term-unfocused`, `match@term-selection`, `match-active@term-selection`. Only the terminal cell ink sits in a search match.
- Every `scrim@*` ground. Inert layer. Content under a scrim has no target, and nothing new is drawn on it.

### `glyph-dim`

| Token | Grounds | Lowest, Mocha · Latte |
|---|---|---|
| `glyph-dim` | `crust`, `mantle`, `base`, `term-unfocused`, `term`, `tab-hover`, `crust+hover`, `file-drop@crust`, `file-drop@term` | 3.12 · 3.57 |
| `glyph-dim-raised` | `raised`, `field`, `dag-cycle`, `approval`, `crust+press`, `mantle+hover`, `mantle+press`, `base+hover`, `term-unfocused+hover`, `term+hover`, `base+press`, `term-unfocused+press`, `term+press`, `tint-primary@mantle`, `tint-primary@base`, `tint-info@crust`, `tint-info@mantle`, `tint-info@base`, `tint-success@crust`, `tint-success@mantle`, `tint-success@base`, `tint-warning@mantle`, `tint-warning@base`, `tint-danger@crust`, `tint-danger@mantle`, `tint-danger@base`, `tint-agent@mantle`, `tint-agent@base`, `drop-target@mantle`, `drop-target@base`, `drop-target@term-unfocused`, `drop-target@term`, `file-drop@mantle`, `file-drop@base`, `file-drop@term-unfocused`, `marquee@mantle`, `marquee@base`, `marquee@term-unfocused`, `marquee@term`, `split-zone@crust`, `split-zone@mantle` | 3.05 · 3.25 |
| `text-muted-raised` | `on-raised`, `solid-hover`, `tint-avatar`, `dag-running`, `dag-failed`, `dag-unknown`, `dag-partial`, `dag-awaiting`, `dag-stalled`, `dag-crashed`, `raised+hover`, `raised+press`, `on-raised+hover`, `tint-primary@raised`, `tint-info@raised`, `tint-success@raised`, `tint-warning@raised`, `tint-danger@raised`, `tint-agent@raised`, `drop-target@raised`, `split-zone@base` | 3.25 · 3.98 |
| `text-on-active` | `active`, `on-raised+press`, `active+hover`, `active+press` | 3.43 · 4.21 |

Forbidden:

- `fill-primary`, `fill-agent`, `fill-danger`, `fill-success`, `fill-warning`, `fill-close`, `fill-primary+hover`, `fill-primary+press`, `fill-agent+hover`, `fill-agent+press`, `fill-danger+hover`, `fill-danger+press`. A filled control carries one ink pair. Hue or neutral steps on it would read as a second state.
- `track`, `track-raised`. A track holds its thumb and nothing else.
- `term-selection`, `term-cursor`. A terminal layer holds the cell ink only.
- `match@term`, `match@base`, `match@term-unfocused`, `match-active@term`, `match-active@base`, `match-active@term-unfocused`, `match@term-selection`, `match-active@term-selection`. Only the terminal cell ink sits in a search match.
- Every `scrim@*` ground. Inert layer. Content under a scrim has no target, and nothing new is drawn on it.

### `glyph-decorative`

| Token | Grounds | Lowest, Mocha · Latte |
|---|---|---|
| `accent-decorative` | `crust`, `mantle`, `base`, `term-unfocused`, `raised`, `on-raised`, `field`, `solid-hover`, `term`, `tab-hover` | no target |

Forbidden:

- `active`, `tint-avatar`, `dag-running`, `dag-failed`, `dag-unknown`, `dag-partial`, `dag-awaiting`, `dag-stalled`, `dag-crashed`, `dag-cycle`, `approval`, `crust+hover`, `crust+press`, `mantle+hover`, `mantle+press`, `base+hover`, `term-unfocused+hover`, `term+hover`, `base+press`, `term-unfocused+press`, `term+press`, `raised+hover`, `raised+press`, `on-raised+hover`, `on-raised+press`, `active+hover`, `active+press`, `tint-primary@mantle`, `tint-primary@base`, `tint-primary@raised`, `tint-info@crust`, `tint-info@mantle`, `tint-info@base`, `tint-info@raised`, `tint-success@crust`, `tint-success@mantle`, `tint-success@base`, `tint-success@raised`, `tint-warning@mantle`, `tint-warning@base`, `tint-warning@raised`, `tint-danger@crust`, `tint-danger@mantle`, `tint-danger@base`, `tint-danger@raised`, `tint-agent@mantle`, `tint-agent@base`, `tint-agent@raised`, `drop-target@mantle`, `drop-target@base`, `drop-target@term-unfocused`, `drop-target@term`, `drop-target@raised`, `file-drop@crust`, `file-drop@mantle`, `file-drop@base`, `file-drop@term-unfocused`, `file-drop@term`, `marquee@mantle`, `marquee@base`, `marquee@term-unfocused`, `marquee@term`, `split-zone@crust`, `split-zone@mantle`, `split-zone@base`. An ornament stays on a resting neutral ground.
- `fill-primary`, `fill-agent`, `fill-danger`, `fill-success`, `fill-warning`, `fill-close`, `fill-primary+hover`, `fill-primary+press`, `fill-agent+hover`, `fill-agent+press`, `fill-danger+hover`, `fill-danger+press`. A filled control carries one ink pair. Hue or neutral steps on it would read as a second state.
- `track`, `track-raised`. A track holds its thumb and nothing else.
- `term-selection`, `term-cursor`. A terminal layer holds the cell ink only.
- `match@term`, `match@base`, `match@term-unfocused`, `match-active@term`, `match-active@base`, `match-active@term-unfocused`, `match@term-selection`, `match-active@term-selection`. Only the terminal cell ink sits in a search match.
- Every `scrim@*` ground. Inert layer. Content under a scrim has no target, and nothing new is drawn on it.

### `glyph-primary`

| Token | Grounds | Lowest, Mocha · Latte |
|---|---|---|
| `accent-primary` | `crust`, `mantle`, `base`, `term-unfocused`, `raised`, `on-raised`, `field`, `term`, `tab-hover`, `crust+hover`, `mantle+hover`, `mantle+press`, `base+hover`, `term-unfocused+hover`, `term+hover`, `base+press`, `term+press`, `on-raised+hover`, `on-raised+press`, `tint-primary@mantle`, `tint-primary@base`, `drop-target@mantle`, `drop-target@base`, `drop-target@term-unfocused`, `drop-target@term`, `file-drop@crust`, `file-drop@mantle`, `file-drop@base`, `file-drop@term-unfocused`, `file-drop@term`, `marquee@mantle`, `marquee@base`, `marquee@term-unfocused`, `marquee@term`, `split-zone@mantle`, `split-zone@base` | 3.08 · 3.04 |
| `accent-primary-raised` | `solid-hover`, `tint-avatar`, `dag-running`, `crust+press`, `raised+hover`, `raised+press`, `tint-primary@raised`, `drop-target@raised`, `split-zone@crust`, `term-unfocused+press`, `term-selection` | 3.17 · 3.84 |
| `accent-primary-on-active` | `active`, `active+hover`, `active+press` | 3.10 · 3.27 |

Forbidden:

- `fill-primary`, `fill-agent`, `fill-danger`, `fill-success`, `fill-warning`, `fill-close`, `fill-primary+hover`, `fill-primary+press`, `fill-agent+hover`, `fill-agent+press`, `fill-danger+hover`, `fill-danger+press`. A filled control carries one ink pair. Hue or neutral steps on it would read as a second state.
- `dag-failed`, `dag-unknown`, `dag-partial`, `dag-awaiting`, `dag-stalled`, `dag-crashed`, `dag-cycle`, `approval`, `tint-info@crust`, `tint-info@mantle`, `tint-info@base`, `tint-info@raised`, `tint-success@crust`, `tint-success@mantle`, `tint-success@base`, `tint-success@raised`, `tint-warning@mantle`, `tint-warning@base`, `tint-warning@raised`, `tint-danger@crust`, `tint-danger@mantle`, `tint-danger@base`, `tint-danger@raised`, `tint-agent@mantle`, `tint-agent@base`, `tint-agent@raised`. A tint carries its own hue and neutrals. A second hue reads as a conflict.
- `track`, `track-raised`. A track holds its thumb and nothing else.
- `term-cursor`. A terminal layer holds the cell ink only.
- `match@term`, `match@base`, `match@term-unfocused`, `match-active@term`, `match-active@base`, `match-active@term-unfocused`, `match@term-selection`, `match-active@term-selection`. Only the terminal cell ink sits in a search match.
- Every `scrim@*` ground. Inert layer. Content under a scrim has no target, and nothing new is drawn on it.

### `glyph-info`

| Token | Grounds | Lowest, Mocha · Latte |
|---|---|---|
| `accent-info-raised` | `crust`, `mantle`, `base`, `term-unfocused`, `raised`, `on-raised`, `field`, `solid-hover`, `term`, `tab-hover`, `crust+hover`, `crust+press`, `mantle+hover`, `mantle+press`, `base+hover`, `term-unfocused+hover`, `term+hover`, `base+press`, `term-unfocused+press`, `term+press`, `raised+hover`, `raised+press`, `on-raised+hover`, `on-raised+press`, `tint-info@crust`, `tint-info@mantle`, `tint-info@base`, `tint-info@raised` | 4.17 · 3.74 |
| `accent-info-on-active` | `active`, `active+hover`, `active+press` | 3.19 · 3.04 |

Forbidden:

- `fill-primary`, `fill-agent`, `fill-danger`, `fill-success`, `fill-warning`, `fill-close`, `fill-primary+hover`, `fill-primary+press`, `fill-agent+hover`, `fill-agent+press`, `fill-danger+hover`, `fill-danger+press`. A filled control carries one ink pair. Hue or neutral steps on it would read as a second state.
- `tint-avatar`, `dag-running`, `dag-failed`, `dag-unknown`, `dag-partial`, `dag-awaiting`, `dag-stalled`, `dag-crashed`, `dag-cycle`, `approval`, `tint-primary@mantle`, `tint-primary@base`, `tint-primary@raised`, `tint-success@crust`, `tint-success@mantle`, `tint-success@base`, `tint-success@raised`, `tint-warning@mantle`, `tint-warning@base`, `tint-warning@raised`, `tint-danger@crust`, `tint-danger@mantle`, `tint-danger@base`, `tint-danger@raised`, `tint-agent@mantle`, `tint-agent@base`, `tint-agent@raised`, `drop-target@mantle`, `drop-target@base`, `drop-target@term-unfocused`, `drop-target@term`, `drop-target@raised`, `file-drop@crust`, `file-drop@mantle`, `file-drop@base`, `file-drop@term-unfocused`, `file-drop@term`, `marquee@mantle`, `marquee@base`, `marquee@term-unfocused`, `marquee@term`, `split-zone@crust`, `split-zone@mantle`, `split-zone@base`. A tint carries its own hue and neutrals. A second hue reads as a conflict.
- `track`, `track-raised`. A track holds its thumb and nothing else.
- `term-selection`, `term-cursor`. A terminal layer holds the cell ink only.
- `match@term`, `match@base`, `match@term-unfocused`, `match-active@term`, `match-active@base`, `match-active@term-unfocused`, `match@term-selection`, `match-active@term-selection`. Only the terminal cell ink sits in a search match.
- Every `scrim@*` ground. Inert layer. Content under a scrim has no target, and nothing new is drawn on it.

### `glyph-success`

| Token | Grounds | Lowest, Mocha · Latte |
|---|---|---|
| `accent-success-raised` | `crust`, `mantle`, `base`, `term-unfocused`, `raised`, `on-raised`, `field`, `solid-hover`, `tab-hover`, `crust+hover`, `crust+press`, `mantle+hover`, `mantle+press`, `base+hover`, `term-unfocused+hover`, `term+hover`, `base+press`, `term-unfocused+press`, `term+press`, `raised+hover`, `raised+press`, `on-raised+hover`, `on-raised+press`, `tint-success@crust`, `tint-success@mantle`, `tint-success@base`, `tint-success@raised` | 4.36 · 3.78 |
| `accent-success-on-active` | `active`, `active+hover`, `active+press` | 3.34 · 3.05 |
| `accent-success` | `term` | 14.12 · 3.34 |

Forbidden:

- `fill-primary`, `fill-agent`, `fill-danger`, `fill-success`, `fill-warning`, `fill-close`, `fill-primary+hover`, `fill-primary+press`, `fill-agent+hover`, `fill-agent+press`, `fill-danger+hover`, `fill-danger+press`. A filled control carries one ink pair. Hue or neutral steps on it would read as a second state.
- `tint-avatar`, `dag-running`, `dag-failed`, `dag-unknown`, `dag-partial`, `dag-awaiting`, `dag-stalled`, `dag-crashed`, `dag-cycle`, `approval`, `tint-primary@mantle`, `tint-primary@base`, `tint-primary@raised`, `tint-info@crust`, `tint-info@mantle`, `tint-info@base`, `tint-info@raised`, `tint-warning@mantle`, `tint-warning@base`, `tint-warning@raised`, `tint-danger@crust`, `tint-danger@mantle`, `tint-danger@base`, `tint-danger@raised`, `tint-agent@mantle`, `tint-agent@base`, `tint-agent@raised`, `drop-target@mantle`, `drop-target@base`, `drop-target@term-unfocused`, `drop-target@term`, `drop-target@raised`, `file-drop@crust`, `file-drop@mantle`, `file-drop@base`, `file-drop@term-unfocused`, `file-drop@term`, `marquee@mantle`, `marquee@base`, `marquee@term-unfocused`, `marquee@term`, `split-zone@crust`, `split-zone@mantle`, `split-zone@base`. A tint carries its own hue and neutrals. A second hue reads as a conflict.
- `track`, `track-raised`. A track holds its thumb and nothing else.
- `term-selection`, `term-cursor`. A terminal layer holds the cell ink only.
- `match@term`, `match@base`, `match@term-unfocused`, `match-active@term`, `match-active@base`, `match-active@term-unfocused`, `match@term-selection`, `match-active@term-selection`. Only the terminal cell ink sits in a search match.
- Every `scrim@*` ground. Inert layer. Content under a scrim has no target, and nothing new is drawn on it.

### `glyph-warning`

| Token | Grounds | Lowest, Mocha · Latte |
|---|---|---|
| `accent-warning-glyph` | `crust`, `mantle`, `base`, `term-unfocused`, `on-raised`, `field`, `term`, `tab-hover`, `dag-cycle`, `mantle+hover`, `base+hover`, `term+hover`, `base+press`, `term+press`, `on-raised+hover`, `on-raised+press`, `tint-warning@mantle`, `tint-warning@base` | 5.11 · 3.04 |
| `accent-warning-raised` | `raised`, `solid-hover`, `dag-unknown`, `dag-awaiting`, `dag-stalled`, `crust+hover`, `crust+press`, `mantle+press`, `raised+hover`, `raised+press`, `tint-warning@raised`, `term-unfocused+hover`, `term-unfocused+press` | 6.76 · 4.03 |
| `accent-warning-on-active` | `active`, `active+hover`, `active+press` | 3.91 · 3.32 |

Forbidden:

- `fill-primary`, `fill-agent`, `fill-danger`, `fill-success`, `fill-warning`, `fill-close`, `fill-primary+hover`, `fill-primary+press`, `fill-agent+hover`, `fill-agent+press`, `fill-danger+hover`, `fill-danger+press`. A filled control carries one ink pair. Hue or neutral steps on it would read as a second state.
- `tint-avatar`, `dag-running`, `dag-failed`, `dag-partial`, `dag-crashed`, `approval`, `tint-primary@mantle`, `tint-primary@base`, `tint-primary@raised`, `tint-info@crust`, `tint-info@mantle`, `tint-info@base`, `tint-info@raised`, `tint-success@crust`, `tint-success@mantle`, `tint-success@base`, `tint-success@raised`, `tint-danger@crust`, `tint-danger@mantle`, `tint-danger@base`, `tint-danger@raised`, `tint-agent@mantle`, `tint-agent@base`, `tint-agent@raised`, `drop-target@mantle`, `drop-target@base`, `drop-target@term-unfocused`, `drop-target@term`, `drop-target@raised`, `file-drop@crust`, `file-drop@mantle`, `file-drop@base`, `file-drop@term-unfocused`, `file-drop@term`, `marquee@mantle`, `marquee@base`, `marquee@term-unfocused`, `marquee@term`, `split-zone@crust`, `split-zone@mantle`, `split-zone@base`. A tint carries its own hue and neutrals. A second hue reads as a conflict.
- `track`, `track-raised`. A track holds its thumb and nothing else.
- `term-selection`, `term-cursor`. A terminal layer holds the cell ink only.
- `match@term`, `match@base`, `match@term-unfocused`, `match-active@term`, `match-active@base`, `match-active@term-unfocused`, `match@term-selection`, `match-active@term-selection`. Only the terminal cell ink sits in a search match.
- Every `scrim@*` ground. Inert layer. Content under a scrim has no target, and nothing new is drawn on it.

### `glyph-attention`

| Token | Grounds | Lowest, Mocha · Latte |
|---|---|---|
| `accent-attention-raised` | `crust`, `mantle`, `base`, `term-unfocused`, `raised`, `on-raised`, `field`, `solid-hover`, `term`, `tab-hover`, `dag-partial`, `crust+hover`, `crust+press`, `mantle+hover`, `mantle+press`, `base+hover`, `term-unfocused+hover`, `term+hover`, `base+press`, `term-unfocused+press`, `term+press`, `raised+hover`, `raised+press`, `on-raised+hover`, `on-raised+press` | 3.67 · 3.93 |
| `accent-attention-on-active` | `active`, `active+hover`, `active+press` | 3.06 · 3.20 |

Forbidden:

- `fill-primary`, `fill-agent`, `fill-danger`, `fill-success`, `fill-warning`, `fill-close`, `fill-primary+hover`, `fill-primary+press`, `fill-agent+hover`, `fill-agent+press`, `fill-danger+hover`, `fill-danger+press`. A filled control carries one ink pair. Hue or neutral steps on it would read as a second state.
- `tint-avatar`, `dag-running`, `dag-failed`, `dag-unknown`, `dag-awaiting`, `dag-stalled`, `dag-crashed`, `dag-cycle`, `approval`, `tint-primary@mantle`, `tint-primary@base`, `tint-primary@raised`, `tint-info@crust`, `tint-info@mantle`, `tint-info@base`, `tint-info@raised`, `tint-success@crust`, `tint-success@mantle`, `tint-success@base`, `tint-success@raised`, `tint-warning@mantle`, `tint-warning@base`, `tint-warning@raised`, `tint-danger@crust`, `tint-danger@mantle`, `tint-danger@base`, `tint-danger@raised`, `tint-agent@mantle`, `tint-agent@base`, `tint-agent@raised`, `drop-target@mantle`, `drop-target@base`, `drop-target@term-unfocused`, `drop-target@term`, `drop-target@raised`, `file-drop@crust`, `file-drop@mantle`, `file-drop@base`, `file-drop@term-unfocused`, `file-drop@term`, `marquee@mantle`, `marquee@base`, `marquee@term-unfocused`, `marquee@term`, `split-zone@crust`, `split-zone@mantle`, `split-zone@base`. A tint carries its own hue and neutrals. A second hue reads as a conflict.
- `track`, `track-raised`. A track holds its thumb and nothing else.
- `term-selection`, `term-cursor`. A terminal layer holds the cell ink only.
- `match@term`, `match@base`, `match@term-unfocused`, `match-active@term`, `match-active@base`, `match-active@term-unfocused`, `match@term-selection`, `match-active@term-selection`. Only the terminal cell ink sits in a search match.
- Every `scrim@*` ground. Inert layer. Content under a scrim has no target, and nothing new is drawn on it.

### `glyph-danger`

| Token | Grounds | Lowest, Mocha · Latte |
|---|---|---|
| `accent-danger` | `crust`, `mantle`, `base`, `term-unfocused`, `raised`, `on-raised`, `field`, `term`, `tab-hover`, `approval`, `crust+hover`, `crust+press`, `mantle+hover`, `mantle+press`, `base+hover`, `term-unfocused+hover`, `term+hover`, `base+press`, `term-unfocused+press`, `term+press`, `on-raised+hover`, `tint-danger@crust`, `tint-danger@mantle`, `tint-danger@base` | 3.12 · 3.14 |
| `accent-danger-raised` | `solid-hover`, `dag-failed`, `dag-crashed`, `raised+hover`, `raised+press`, `tint-danger@raised` | 3.71 · 3.69 |
| `accent-danger-on-active` | `active`, `active+hover`, `active+press` | 3.03 · 3.26 |
| `accent-danger-strong` | `on-raised+press` | 3.48 · 6.10 |

Forbidden:

- `fill-primary`, `fill-agent`, `fill-danger`, `fill-success`, `fill-warning`, `fill-close`, `fill-primary+hover`, `fill-primary+press`, `fill-agent+hover`, `fill-agent+press`, `fill-danger+hover`, `fill-danger+press`. A filled control carries one ink pair. Hue or neutral steps on it would read as a second state.
- `tint-avatar`, `dag-running`, `dag-unknown`, `dag-partial`, `dag-awaiting`, `dag-stalled`, `dag-cycle`, `tint-primary@mantle`, `tint-primary@base`, `tint-primary@raised`, `tint-info@crust`, `tint-info@mantle`, `tint-info@base`, `tint-info@raised`, `tint-success@crust`, `tint-success@mantle`, `tint-success@base`, `tint-success@raised`, `tint-warning@mantle`, `tint-warning@base`, `tint-warning@raised`, `tint-agent@mantle`, `tint-agent@base`, `tint-agent@raised`, `drop-target@mantle`, `drop-target@base`, `drop-target@term-unfocused`, `drop-target@term`, `drop-target@raised`, `file-drop@crust`, `file-drop@mantle`, `file-drop@base`, `file-drop@term-unfocused`, `file-drop@term`, `marquee@mantle`, `marquee@base`, `marquee@term-unfocused`, `marquee@term`, `split-zone@crust`, `split-zone@mantle`, `split-zone@base`. A tint carries its own hue and neutrals. A second hue reads as a conflict.
- `track`, `track-raised`. A track holds its thumb and nothing else.
- `term-selection`, `term-cursor`. A terminal layer holds the cell ink only.
- `match@term`, `match@base`, `match@term-unfocused`, `match-active@term`, `match-active@base`, `match-active@term-unfocused`, `match@term-selection`, `match-active@term-selection`. Only the terminal cell ink sits in a search match.
- Every `scrim@*` ground. Inert layer. Content under a scrim has no target, and nothing new is drawn on it.

### `glyph-agent`

| Token | Grounds | Lowest, Mocha · Latte |
|---|---|---|
| `accent-agent` | `crust`, `mantle`, `base`, `term-unfocused`, `raised`, `on-raised`, `field`, `term`, `tab-hover`, `crust+hover`, `crust+press`, `mantle+hover`, `mantle+press`, `base+hover`, `term-unfocused+hover`, `term+hover`, `base+press`, `term-unfocused+press`, `term+press`, `on-raised+hover`, `on-raised+press`, `tint-agent@mantle`, `tint-agent@base`, `tint-agent@raised` | 3.19 · 3.03 |
| `accent-agent-raised` | `solid-hover`, `raised+hover`, `raised+press` | 4.23 · 3.75 |
| `accent-agent-on-active` | `active`, `active+hover`, `active+press` | 3.08 · 3.22 |

Forbidden:

- `fill-primary`, `fill-agent`, `fill-danger`, `fill-success`, `fill-warning`, `fill-close`, `fill-primary+hover`, `fill-primary+press`, `fill-agent+hover`, `fill-agent+press`, `fill-danger+hover`, `fill-danger+press`. A filled control carries one ink pair. Hue or neutral steps on it would read as a second state.
- `tint-avatar`, `dag-running`, `dag-failed`, `dag-unknown`, `dag-partial`, `dag-awaiting`, `dag-stalled`, `dag-crashed`, `dag-cycle`, `approval`, `tint-primary@mantle`, `tint-primary@base`, `tint-primary@raised`, `tint-info@crust`, `tint-info@mantle`, `tint-info@base`, `tint-info@raised`, `tint-success@crust`, `tint-success@mantle`, `tint-success@base`, `tint-success@raised`, `tint-warning@mantle`, `tint-warning@base`, `tint-warning@raised`, `tint-danger@crust`, `tint-danger@mantle`, `tint-danger@base`, `tint-danger@raised`, `drop-target@mantle`, `drop-target@base`, `drop-target@term-unfocused`, `drop-target@term`, `drop-target@raised`, `file-drop@crust`, `file-drop@mantle`, `file-drop@base`, `file-drop@term-unfocused`, `file-drop@term`, `marquee@mantle`, `marquee@base`, `marquee@term-unfocused`, `marquee@term`, `split-zone@crust`, `split-zone@mantle`, `split-zone@base`. A tint carries its own hue and neutrals. A second hue reads as a conflict.
- `track`, `track-raised`. A track holds its thumb and nothing else.
- `term-selection`, `term-cursor`. A terminal layer holds the cell ink only.
- `match@term`, `match@base`, `match@term-unfocused`, `match-active@term`, `match-active@base`, `match-active@term-unfocused`, `match@term-selection`, `match-active@term-selection`. Only the terminal cell ink sits in a search match.
- Every `scrim@*` ground. Inert layer. Content under a scrim has no target, and nothing new is drawn on it.

### `glyph-remote`

| Token | Grounds | Lowest, Mocha · Latte |
|---|---|---|
| `accent-remote-raised` | `crust`, `mantle`, `base`, `term-unfocused`, `raised`, `on-raised`, `field`, `solid-hover`, `term`, `tab-hover`, `crust+hover`, `crust+press`, `mantle+hover`, `mantle+press`, `base+hover`, `term-unfocused+hover`, `term+hover`, `base+press`, `term-unfocused+press`, `term+press`, `raised+hover`, `raised+press`, `on-raised+hover`, `on-raised+press`, `tint-info@crust`, `tint-info@mantle`, `tint-info@base`, `tint-info@raised` | 4.17 · 3.74 |
| `accent-remote-on-active` | `active`, `active+hover`, `active+press` | 3.19 · 3.04 |

Forbidden:

- `fill-primary`, `fill-agent`, `fill-danger`, `fill-success`, `fill-warning`, `fill-close`, `fill-primary+hover`, `fill-primary+press`, `fill-agent+hover`, `fill-agent+press`, `fill-danger+hover`, `fill-danger+press`. A filled control carries one ink pair. Hue or neutral steps on it would read as a second state.
- `tint-avatar`, `dag-running`, `dag-failed`, `dag-unknown`, `dag-partial`, `dag-awaiting`, `dag-stalled`, `dag-crashed`, `dag-cycle`, `approval`, `tint-primary@mantle`, `tint-primary@base`, `tint-primary@raised`, `tint-success@crust`, `tint-success@mantle`, `tint-success@base`, `tint-success@raised`, `tint-warning@mantle`, `tint-warning@base`, `tint-warning@raised`, `tint-danger@crust`, `tint-danger@mantle`, `tint-danger@base`, `tint-danger@raised`, `tint-agent@mantle`, `tint-agent@base`, `tint-agent@raised`, `drop-target@mantle`, `drop-target@base`, `drop-target@term-unfocused`, `drop-target@term`, `drop-target@raised`, `file-drop@crust`, `file-drop@mantle`, `file-drop@base`, `file-drop@term-unfocused`, `file-drop@term`, `marquee@mantle`, `marquee@base`, `marquee@term-unfocused`, `marquee@term`, `split-zone@crust`, `split-zone@mantle`, `split-zone@base`. A tint carries its own hue and neutrals. A second hue reads as a conflict.
- `track`, `track-raised`. A track holds its thumb and nothing else.
- `term-selection`, `term-cursor`. A terminal layer holds the cell ink only.
- `match@term`, `match@base`, `match@term-unfocused`, `match-active@term`, `match-active@base`, `match-active@term-unfocused`, `match@term-selection`, `match-active@term-selection`. Only the terminal cell ink sits in a search match.
- Every `scrim@*` ground. Inert layer. Content under a scrim has no target, and nothing new is drawn on it.

### `glyph-attached`

| Token | Grounds | Lowest, Mocha · Latte |
|---|---|---|
| `accent-attached-raised` | `crust`, `mantle`, `base`, `term-unfocused`, `raised`, `on-raised`, `field`, `solid-hover`, `tab-hover`, `crust+hover`, `crust+press`, `mantle+hover`, `mantle+press`, `base+hover`, `term-unfocused+hover`, `term+hover`, `base+press`, `term-unfocused+press`, `term+press`, `raised+hover`, `raised+press`, `on-raised+hover`, `on-raised+press` | 3.63 · 4.09 |
| `accent-attached-on-active` | `active`, `active+hover`, `active+press` | 3.05 · 3.28 |
| `accent-attached` | `term` | 11.74 · 3.18 |

Forbidden:

- `fill-primary`, `fill-agent`, `fill-danger`, `fill-success`, `fill-warning`, `fill-close`, `fill-primary+hover`, `fill-primary+press`, `fill-agent+hover`, `fill-agent+press`, `fill-danger+hover`, `fill-danger+press`. A filled control carries one ink pair. Hue or neutral steps on it would read as a second state.
- `tint-avatar`, `dag-running`, `dag-failed`, `dag-unknown`, `dag-partial`, `dag-awaiting`, `dag-stalled`, `dag-crashed`, `dag-cycle`, `approval`, `tint-primary@mantle`, `tint-primary@base`, `tint-primary@raised`, `tint-info@crust`, `tint-info@mantle`, `tint-info@base`, `tint-info@raised`, `tint-success@crust`, `tint-success@mantle`, `tint-success@base`, `tint-success@raised`, `tint-warning@mantle`, `tint-warning@base`, `tint-warning@raised`, `tint-danger@crust`, `tint-danger@mantle`, `tint-danger@base`, `tint-danger@raised`, `tint-agent@mantle`, `tint-agent@base`, `tint-agent@raised`, `drop-target@mantle`, `drop-target@base`, `drop-target@term-unfocused`, `drop-target@term`, `drop-target@raised`, `file-drop@crust`, `file-drop@mantle`, `file-drop@base`, `file-drop@term-unfocused`, `file-drop@term`, `marquee@mantle`, `marquee@base`, `marquee@term-unfocused`, `marquee@term`, `split-zone@crust`, `split-zone@mantle`, `split-zone@base`. A tint carries its own hue and neutrals. A second hue reads as a conflict.
- `track`, `track-raised`. A track holds its thumb and nothing else.
- `term-selection`, `term-cursor`. A terminal layer holds the cell ink only.
- `match@term`, `match@base`, `match@term-unfocused`, `match-active@term`, `match-active@base`, `match-active@term-unfocused`, `match@term-selection`, `match-active@term-selection`. Only the terminal cell ink sits in a search match.
- Every `scrim@*` ground. Inert layer. Content under a scrim has no target, and nothing new is drawn on it.

### `glyph-move`

| Token | Grounds | Lowest, Mocha · Latte |
|---|---|---|
| `accent-move-raised` | `crust`, `mantle`, `base`, `term-unfocused`, `raised`, `on-raised`, `field`, `solid-hover`, `term`, `tab-hover`, `crust+hover`, `crust+press`, `mantle+hover`, `mantle+press`, `base+hover`, `term-unfocused+hover`, `term+hover`, `base+press`, `term-unfocused+press`, `term+press`, `raised+hover`, `raised+press`, `on-raised+hover`, `on-raised+press` | 4.25 · 3.58 |
| `accent-move-on-active` | `active`, `active+hover`, `active+press` | 3.25 · 3.34 |

Forbidden:

- `fill-primary`, `fill-agent`, `fill-danger`, `fill-success`, `fill-warning`, `fill-close`, `fill-primary+hover`, `fill-primary+press`, `fill-agent+hover`, `fill-agent+press`, `fill-danger+hover`, `fill-danger+press`. A filled control carries one ink pair. Hue or neutral steps on it would read as a second state.
- `tint-avatar`, `dag-running`, `dag-failed`, `dag-unknown`, `dag-partial`, `dag-awaiting`, `dag-stalled`, `dag-crashed`, `dag-cycle`, `approval`, `tint-primary@mantle`, `tint-primary@base`, `tint-primary@raised`, `tint-info@crust`, `tint-info@mantle`, `tint-info@base`, `tint-info@raised`, `tint-success@crust`, `tint-success@mantle`, `tint-success@base`, `tint-success@raised`, `tint-warning@mantle`, `tint-warning@base`, `tint-warning@raised`, `tint-danger@crust`, `tint-danger@mantle`, `tint-danger@base`, `tint-danger@raised`, `tint-agent@mantle`, `tint-agent@base`, `tint-agent@raised`, `drop-target@mantle`, `drop-target@base`, `drop-target@term-unfocused`, `drop-target@term`, `drop-target@raised`, `file-drop@crust`, `file-drop@mantle`, `file-drop@base`, `file-drop@term-unfocused`, `file-drop@term`, `marquee@mantle`, `marquee@base`, `marquee@term-unfocused`, `marquee@term`, `split-zone@crust`, `split-zone@mantle`, `split-zone@base`. A tint carries its own hue and neutrals. A second hue reads as a conflict.
- `track`, `track-raised`. A track holds its thumb and nothing else.
- `term-selection`, `term-cursor`. A terminal layer holds the cell ink only.
- `match@term`, `match@base`, `match@term-unfocused`, `match-active@term`, `match-active@base`, `match-active@term-unfocused`, `match@term-selection`, `match-active@term-selection`. Only the terminal cell ink sits in a search match.
- Every `scrim@*` ground. Inert layer. Content under a scrim has no target, and nothing new is drawn on it.

### `glyph-data`

| Token | Grounds | Lowest, Mocha · Latte |
|---|---|---|
| `accent-data-strong` | `base`, `term`, `term-unfocused` | 11.01 · 3.75 |

Forbidden:

- `crust`, `mantle`, `raised`, `on-raised`, `field`, `solid-hover`, `active`, `tab-hover`, `crust+hover`, `crust+press`, `mantle+hover`, `mantle+press`, `base+hover`, `term-unfocused+hover`, `term+hover`, `base+press`, `term-unfocused+press`, `term+press`, `raised+hover`, `raised+press`, `on-raised+hover`, `on-raised+press`, `active+hover`, `active+press`. A data edge lives on the DAG canvas only.
- `fill-primary`, `fill-agent`, `fill-danger`, `fill-success`, `fill-warning`, `fill-close`, `fill-primary+hover`, `fill-primary+press`, `fill-agent+hover`, `fill-agent+press`, `fill-danger+hover`, `fill-danger+press`. A filled control carries one ink pair. Hue or neutral steps on it would read as a second state.
- `tint-avatar`, `dag-running`, `dag-failed`, `dag-unknown`, `dag-partial`, `dag-awaiting`, `dag-stalled`, `dag-crashed`, `dag-cycle`, `approval`, `tint-primary@mantle`, `tint-primary@base`, `tint-primary@raised`, `tint-info@crust`, `tint-info@mantle`, `tint-info@base`, `tint-info@raised`, `tint-success@crust`, `tint-success@mantle`, `tint-success@base`, `tint-success@raised`, `tint-warning@mantle`, `tint-warning@base`, `tint-warning@raised`, `tint-danger@crust`, `tint-danger@mantle`, `tint-danger@base`, `tint-danger@raised`, `tint-agent@mantle`, `tint-agent@base`, `tint-agent@raised`, `drop-target@mantle`, `drop-target@base`, `drop-target@term-unfocused`, `drop-target@term`, `drop-target@raised`, `file-drop@crust`, `file-drop@mantle`, `file-drop@base`, `file-drop@term-unfocused`, `file-drop@term`, `marquee@mantle`, `marquee@base`, `marquee@term-unfocused`, `marquee@term`, `split-zone@crust`, `split-zone@mantle`, `split-zone@base`. A tint carries its own hue and neutrals. A second hue reads as a conflict.
- `track`, `track-raised`. A track holds its thumb and nothing else.
- `term-selection`, `term-cursor`. A terminal layer holds the cell ink only.
- `match@term`, `match@base`, `match@term-unfocused`, `match-active@term`, `match-active@base`, `match-active@term-unfocused`, `match@term-selection`, `match-active@term-selection`. Only the terminal cell ink sits in a search match.
- Every `scrim@*` ground. Inert layer. Content under a scrim has no target, and nothing new is drawn on it.

### `glyph-route`

| Token | Grounds | Lowest, Mocha · Latte |
|---|---|---|
| `accent-route-raised` | `crust`, `mantle`, `base`, `term-unfocused`, `raised`, `on-raised`, `field`, `solid-hover`, `tab-hover`, `crust+hover`, `crust+press`, `mantle+hover`, `mantle+press`, `base+hover`, `term-unfocused+hover`, `term+hover`, `base+press`, `term-unfocused+press`, `term+press`, `raised+hover`, `raised+press`, `on-raised+hover`, `on-raised+press` | 3.63 · 4.09 |
| `accent-route-on-active` | `active`, `active+hover`, `active+press` | 3.05 · 3.28 |
| `accent-route` | `term` | 11.74 · 3.18 |

Forbidden:

- `fill-primary`, `fill-agent`, `fill-danger`, `fill-success`, `fill-warning`, `fill-close`, `fill-primary+hover`, `fill-primary+press`, `fill-agent+hover`, `fill-agent+press`, `fill-danger+hover`, `fill-danger+press`. A filled control carries one ink pair. Hue or neutral steps on it would read as a second state.
- `tint-avatar`, `dag-running`, `dag-failed`, `dag-unknown`, `dag-partial`, `dag-awaiting`, `dag-stalled`, `dag-crashed`, `dag-cycle`, `approval`, `tint-primary@mantle`, `tint-primary@base`, `tint-primary@raised`, `tint-info@crust`, `tint-info@mantle`, `tint-info@base`, `tint-info@raised`, `tint-success@crust`, `tint-success@mantle`, `tint-success@base`, `tint-success@raised`, `tint-warning@mantle`, `tint-warning@base`, `tint-warning@raised`, `tint-danger@crust`, `tint-danger@mantle`, `tint-danger@base`, `tint-danger@raised`, `tint-agent@mantle`, `tint-agent@base`, `tint-agent@raised`, `drop-target@mantle`, `drop-target@base`, `drop-target@term-unfocused`, `drop-target@term`, `drop-target@raised`, `file-drop@crust`, `file-drop@mantle`, `file-drop@base`, `file-drop@term-unfocused`, `file-drop@term`, `marquee@mantle`, `marquee@base`, `marquee@term-unfocused`, `marquee@term`, `split-zone@crust`, `split-zone@mantle`, `split-zone@base`. A tint carries its own hue and neutrals. A second hue reads as a conflict.
- `track`, `track-raised`. A track holds its thumb and nothing else.
- `term-selection`, `term-cursor`. A terminal layer holds the cell ink only.
- `match@term`, `match@base`, `match@term-unfocused`, `match-active@term`, `match-active@base`, `match-active@term-unfocused`, `match@term-selection`, `match-active@term-selection`. Only the terminal cell ink sits in a search match.
- Every `scrim@*` ground. Inert layer. Content under a scrim has no target, and nothing new is drawn on it.

### `dot-idle`

| Token | Grounds | Lowest, Mocha · Latte |
|---|---|---|
| `status-idle` | `crust`, `mantle`, `base`, `term-unfocused`, `term`, `tab-hover`, `crust+hover`, `file-drop@crust`, `file-drop@term` | 3.12 · 3.57 |
| `glyph-dim-raised` | `raised`, `field`, `dag-cycle`, `approval`, `crust+press`, `mantle+hover`, `mantle+press`, `base+hover`, `term-unfocused+hover`, `term+hover`, `base+press`, `term-unfocused+press`, `term+press`, `tint-primary@mantle`, `tint-primary@base`, `tint-info@crust`, `tint-info@mantle`, `tint-info@base`, `tint-success@crust`, `tint-success@mantle`, `tint-success@base`, `tint-warning@mantle`, `tint-warning@base`, `tint-danger@crust`, `tint-danger@mantle`, `tint-danger@base`, `tint-agent@mantle`, `tint-agent@base`, `drop-target@mantle`, `drop-target@base`, `drop-target@term-unfocused`, `drop-target@term`, `file-drop@mantle`, `file-drop@base`, `file-drop@term-unfocused`, `marquee@mantle`, `marquee@base`, `marquee@term-unfocused`, `marquee@term`, `split-zone@crust`, `split-zone@mantle` | 3.05 · 3.25 |
| `text-muted-raised` | `on-raised`, `solid-hover`, `tint-avatar`, `dag-running`, `dag-failed`, `dag-unknown`, `dag-partial`, `dag-awaiting`, `dag-stalled`, `dag-crashed`, `raised+hover`, `raised+press`, `on-raised+hover`, `tint-primary@raised`, `tint-info@raised`, `tint-success@raised`, `tint-warning@raised`, `tint-danger@raised`, `tint-agent@raised`, `drop-target@raised`, `split-zone@base` | 3.25 · 3.98 |
| `text-on-active` | `active`, `on-raised+press`, `active+hover`, `active+press` | 3.43 · 4.21 |

Forbidden:

- `fill-primary`, `fill-agent`, `fill-danger`, `fill-success`, `fill-warning`, `fill-close`, `fill-primary+hover`, `fill-primary+press`, `fill-agent+hover`, `fill-agent+press`, `fill-danger+hover`, `fill-danger+press`. A filled control carries one ink pair. Hue or neutral steps on it would read as a second state.
- `track`, `track-raised`. A track holds its thumb and nothing else.
- `term-selection`, `term-cursor`. A terminal layer holds the cell ink only.
- `match@term`, `match@base`, `match@term-unfocused`, `match-active@term`, `match-active@base`, `match-active@term-unfocused`, `match@term-selection`, `match-active@term-selection`. Only the terminal cell ink sits in a search match.
- Every `scrim@*` ground. Inert layer. Content under a scrim has no target, and nothing new is drawn on it.

### `border-control`

| Token | Grounds | Lowest, Mocha · Latte |
|---|---|---|
| `border-control` | `crust`, `mantle`, `base`, `term-unfocused`, `term`, `tab-hover` | 3.36 · 3.29 |
| `border-control-raised` | `raised`, `field`, `crust+hover`, `crust+press`, `mantle+hover`, `mantle+press`, `base+hover`, `term-unfocused+hover`, `term+hover`, `base+press`, `term-unfocused+press`, `term+press` | 3.07 · 3.26 |
| `text-muted-raised` | `on-raised`, `solid-hover`, `raised+hover`, `raised+press`, `on-raised+hover` | 3.25 · 3.98 |
| `text-on-active` | `active`, `on-raised+press`, `active+hover`, `active+press` | 3.43 · 4.21 |

Forbidden:

- `fill-primary`, `fill-agent`, `fill-danger`, `fill-success`, `fill-warning`, `fill-close`, `fill-primary+hover`, `fill-primary+press`, `fill-agent+hover`, `fill-agent+press`, `fill-danger+hover`, `fill-danger+press`. A filled control carries one ink pair. Hue or neutral steps on it would read as a second state.
- `tint-avatar`, `dag-running`, `dag-failed`, `dag-unknown`, `dag-partial`, `dag-awaiting`, `dag-stalled`, `dag-crashed`, `dag-cycle`, `approval`, `tint-primary@mantle`, `tint-primary@base`, `tint-primary@raised`, `tint-info@crust`, `tint-info@mantle`, `tint-info@base`, `tint-info@raised`, `tint-success@crust`, `tint-success@mantle`, `tint-success@base`, `tint-success@raised`, `tint-warning@mantle`, `tint-warning@base`, `tint-warning@raised`, `tint-danger@crust`, `tint-danger@mantle`, `tint-danger@base`, `tint-danger@raised`, `tint-agent@mantle`, `tint-agent@base`, `tint-agent@raised`, `drop-target@mantle`, `drop-target@base`, `drop-target@term-unfocused`, `drop-target@term`, `drop-target@raised`, `file-drop@crust`, `file-drop@mantle`, `file-drop@base`, `file-drop@term-unfocused`, `file-drop@term`, `marquee@mantle`, `marquee@base`, `marquee@term-unfocused`, `marquee@term`, `split-zone@crust`, `split-zone@mantle`, `split-zone@base`. Controls do not sit on a tint. Put them on a neutral ground beside it.
- `track`, `track-raised`. A track holds its thumb and nothing else.
- `term-selection`, `term-cursor`. A terminal layer holds the cell ink only.
- `match@term`, `match@base`, `match@term-unfocused`, `match-active@term`, `match-active@base`, `match-active@term-unfocused`, `match@term-selection`, `match-active@term-selection`. Only the terminal cell ink sits in a search match.
- Every `scrim@*` ground. Inert layer. Content under a scrim has no target, and nothing new is drawn on it.

### `border-partition`

| Token | Grounds | Lowest, Mocha · Latte |
|---|---|---|
| `border-default` | `crust`, `mantle`, `base`, `term-unfocused`, `field`, `term`, `tab-hover`, `crust+hover`, `crust+press`, `mantle+hover`, `mantle+press`, `base+hover`, `term-unfocused+hover`, `term+hover`, `base+press`, `term-unfocused+press`, `term+press` | no target |
| `border-strong` | `raised`, `raised+hover`, `raised+press` | no target |
| `border-frame` | `on-raised`, `solid-hover`, `active`, `on-raised+hover`, `on-raised+press`, `active+hover`, `active+press` | no target |

Forbidden:

- `fill-primary`, `fill-agent`, `fill-danger`, `fill-success`, `fill-warning`, `fill-close`, `fill-primary+hover`, `fill-primary+press`, `fill-agent+hover`, `fill-agent+press`, `fill-danger+hover`, `fill-danger+press`. A filled control carries one ink pair. Hue or neutral steps on it would read as a second state.
- `tint-avatar`, `dag-running`, `dag-failed`, `dag-unknown`, `dag-partial`, `dag-awaiting`, `dag-stalled`, `dag-crashed`, `dag-cycle`, `approval`, `tint-primary@mantle`, `tint-primary@base`, `tint-primary@raised`, `tint-info@crust`, `tint-info@mantle`, `tint-info@base`, `tint-info@raised`, `tint-success@crust`, `tint-success@mantle`, `tint-success@base`, `tint-success@raised`, `tint-warning@mantle`, `tint-warning@base`, `tint-warning@raised`, `tint-danger@crust`, `tint-danger@mantle`, `tint-danger@base`, `tint-danger@raised`, `tint-agent@mantle`, `tint-agent@base`, `tint-agent@raised`, `drop-target@mantle`, `drop-target@base`, `drop-target@term-unfocused`, `drop-target@term`, `drop-target@raised`, `file-drop@crust`, `file-drop@mantle`, `file-drop@base`, `file-drop@term-unfocused`, `file-drop@term`, `marquee@mantle`, `marquee@base`, `marquee@term-unfocused`, `marquee@term`, `split-zone@crust`, `split-zone@mantle`, `split-zone@base`. Controls do not sit on a tint. Put them on a neutral ground beside it.
- `track`, `track-raised`. A track holds its thumb and nothing else.
- `term-selection`, `term-cursor`. A terminal layer holds the cell ink only.
- `match@term`, `match@base`, `match@term-unfocused`, `match-active@term`, `match-active@base`, `match-active@term-unfocused`, `match@term-selection`, `match-active@term-selection`. Only the terminal cell ink sits in a search match.
- Every `scrim@*` ground. Inert layer. Content under a scrim has no target, and nothing new is drawn on it.

### `border-frame`

| Token | Grounds | Lowest, Mocha · Latte |
|---|---|---|
| `border-frame` | `crust`, `mantle`, `base`, `term-unfocused`, `raised`, `on-raised`, `field`, `solid-hover`, `active`, `term`, `tab-hover` | no target |

Component tokens that read this role: `popup-border-focused` and `popup-border-unfocused`, the popup focus pair, on `base` (dialog fill) and `raised` (search bar and banner more menu fill). See [Popup focus](#popup-focus).

Forbidden:

- `fill-primary`, `fill-agent`, `fill-danger`, `fill-success`, `fill-warning`, `fill-close`, `fill-primary+hover`, `fill-primary+press`, `fill-agent+hover`, `fill-agent+press`, `fill-danger+hover`, `fill-danger+press`. A filled control carries one ink pair. Hue or neutral steps on it would read as a second state.
- `tint-avatar`, `dag-running`, `dag-failed`, `dag-unknown`, `dag-partial`, `dag-awaiting`, `dag-stalled`, `dag-crashed`, `dag-cycle`, `approval`, `tint-primary@mantle`, `tint-primary@base`, `tint-primary@raised`, `tint-info@crust`, `tint-info@mantle`, `tint-info@base`, `tint-info@raised`, `tint-success@crust`, `tint-success@mantle`, `tint-success@base`, `tint-success@raised`, `tint-warning@mantle`, `tint-warning@base`, `tint-warning@raised`, `tint-danger@crust`, `tint-danger@mantle`, `tint-danger@base`, `tint-danger@raised`, `tint-agent@mantle`, `tint-agent@base`, `tint-agent@raised`, `drop-target@mantle`, `drop-target@base`, `drop-target@term-unfocused`, `drop-target@term`, `drop-target@raised`, `file-drop@crust`, `file-drop@mantle`, `file-drop@base`, `file-drop@term-unfocused`, `file-drop@term`, `marquee@mantle`, `marquee@base`, `marquee@term-unfocused`, `marquee@term`, `split-zone@crust`, `split-zone@mantle`, `split-zone@base`. Controls do not sit on a tint. Put them on a neutral ground beside it.
- `track`, `track-raised`. A track holds its thumb and nothing else.
- `term-selection`, `term-cursor`. A terminal layer holds the cell ink only.
- `crust+hover`, `crust+press`, `mantle+hover`, `mantle+press`, `base+hover`, `term-unfocused+hover`, `term+hover`, `base+press`, `term-unfocused+press`, `term+press`, `raised+hover`, `raised+press`, `on-raised+hover`, `on-raised+press`, `active+hover`, `active+press`. A frame edge is drawn between resting neutral grounds only.
- `match@term`, `match@base`, `match@term-unfocused`, `match-active@term`, `match-active@base`, `match-active@term-unfocused`, `match@term-selection`, `match-active@term-selection`. Only the terminal cell ink sits in a search match.
- Every `scrim@*` ground. Inert layer. Content under a scrim has no target, and nothing new is drawn on it.

### `separator`

| Token | Grounds | Lowest, Mocha · Latte |
|---|---|---|
| `separator` | `crust`, `mantle`, `base`, `term-unfocused`, `on-raised`, `field`, `solid-hover`, `active`, `term`, `tab-hover`, `crust+hover`, `crust+press`, `mantle+hover`, `mantle+press`, `base+hover`, `term-unfocused+hover`, `term+hover`, `base+press`, `term-unfocused+press`, `term+press`, `on-raised+hover`, `on-raised+press`, `active+hover`, `active+press` | no target |
| `border-strong` | `raised`, `raised+hover`, `raised+press` | no target |

Forbidden:

- `fill-primary`, `fill-agent`, `fill-danger`, `fill-success`, `fill-warning`, `fill-close`, `fill-primary+hover`, `fill-primary+press`, `fill-agent+hover`, `fill-agent+press`, `fill-danger+hover`, `fill-danger+press`. A filled control carries one ink pair. Hue or neutral steps on it would read as a second state.
- `tint-avatar`, `dag-running`, `dag-failed`, `dag-unknown`, `dag-partial`, `dag-awaiting`, `dag-stalled`, `dag-crashed`, `dag-cycle`, `approval`, `tint-primary@mantle`, `tint-primary@base`, `tint-primary@raised`, `tint-info@crust`, `tint-info@mantle`, `tint-info@base`, `tint-info@raised`, `tint-success@crust`, `tint-success@mantle`, `tint-success@base`, `tint-success@raised`, `tint-warning@mantle`, `tint-warning@base`, `tint-warning@raised`, `tint-danger@crust`, `tint-danger@mantle`, `tint-danger@base`, `tint-danger@raised`, `tint-agent@mantle`, `tint-agent@base`, `tint-agent@raised`, `drop-target@mantle`, `drop-target@base`, `drop-target@term-unfocused`, `drop-target@term`, `drop-target@raised`, `file-drop@crust`, `file-drop@mantle`, `file-drop@base`, `file-drop@term-unfocused`, `file-drop@term`, `marquee@mantle`, `marquee@base`, `marquee@term-unfocused`, `marquee@term`, `split-zone@crust`, `split-zone@mantle`, `split-zone@base`. Controls do not sit on a tint. Put them on a neutral ground beside it.
- `track`, `track-raised`. A track holds its thumb and nothing else.
- `term-selection`, `term-cursor`. A terminal layer holds the cell ink only.
- `match@term`, `match@base`, `match@term-unfocused`, `match-active@term`, `match-active@base`, `match-active@term-unfocused`, `match@term-selection`, `match-active@term-selection`. Only the terminal cell ink sits in a search match.
- Every `scrim@*` ground. Inert layer. Content under a scrim has no target, and nothing new is drawn on it.

### `focus-ring`

| Token | Grounds | Lowest, Mocha · Latte |
|---|---|---|
| `border-focus` | `crust`, `mantle`, `base`, `term-unfocused`, `raised`, `on-raised`, `field`, `term`, `tab-hover`, `crust+hover`, `mantle+hover`, `mantle+press`, `base+hover`, `term-unfocused+hover`, `term+hover`, `base+press`, `term+press`, `on-raised+hover`, `on-raised+press` | 3.08 · 3.08 |
| `accent-primary-raised` | `solid-hover`, `active`, `crust+press`, `raised+hover`, `raised+press`, `term-unfocused+press` | 3.17 · 3.84 |
| `accent-primary-on-active` | `active+hover`, `active+press` | 3.10 · 3.27 |

Forbidden:

- `fill-primary`, `fill-agent`, `fill-danger`, `fill-success`, `fill-warning`, `fill-close`, `fill-primary+hover`, `fill-primary+press`, `fill-agent+hover`, `fill-agent+press`, `fill-danger+hover`, `fill-danger+press`. A filled control carries one ink pair. Hue or neutral steps on it would read as a second state.
- `tint-avatar`, `dag-running`, `dag-failed`, `dag-unknown`, `dag-partial`, `dag-awaiting`, `dag-stalled`, `dag-crashed`, `dag-cycle`, `approval`, `tint-primary@mantle`, `tint-primary@base`, `tint-primary@raised`, `tint-info@crust`, `tint-info@mantle`, `tint-info@base`, `tint-info@raised`, `tint-success@crust`, `tint-success@mantle`, `tint-success@base`, `tint-success@raised`, `tint-warning@mantle`, `tint-warning@base`, `tint-warning@raised`, `tint-danger@crust`, `tint-danger@mantle`, `tint-danger@base`, `tint-danger@raised`, `tint-agent@mantle`, `tint-agent@base`, `tint-agent@raised`, `drop-target@mantle`, `drop-target@base`, `drop-target@term-unfocused`, `drop-target@term`, `drop-target@raised`, `file-drop@crust`, `file-drop@mantle`, `file-drop@base`, `file-drop@term-unfocused`, `file-drop@term`, `marquee@mantle`, `marquee@base`, `marquee@term-unfocused`, `marquee@term`, `split-zone@crust`, `split-zone@mantle`, `split-zone@base`. Controls do not sit on a tint. Put them on a neutral ground beside it.
- `track`, `track-raised`. A track holds its thumb and nothing else.
- `term-selection`, `term-cursor`. A terminal layer holds the cell ink only.
- `match@term`, `match@base`, `match@term-unfocused`, `match-active@term`, `match-active@base`, `match-active@term-unfocused`, `match@term-selection`, `match-active@term-selection`. Only the terminal cell ink sits in a search match.
- Every `scrim@*` ground. Inert layer. Content under a scrim has no target, and nothing new is drawn on it.

### `selection-bar`

| Token | Grounds | Lowest, Mocha · Latte |
|---|---|---|
| `accent-primary` | `crust`, `mantle`, `base`, `term-unfocused`, `raised`, `on-raised`, `field`, `term`, `tab-hover` | 4.33 · 3.18 |
| `accent-primary-raised` | `solid-hover` | 4.33 · 4.57 |
| `accent-primary-on-active` | `active`, `active+hover`, `active+press` | 3.10 · 3.27 |

Forbidden:

- `fill-primary`, `fill-agent`, `fill-danger`, `fill-success`, `fill-warning`, `fill-close`, `fill-primary+hover`, `fill-primary+press`, `fill-agent+hover`, `fill-agent+press`, `fill-danger+hover`, `fill-danger+press`. A filled control carries one ink pair. Hue or neutral steps on it would read as a second state.
- `tint-avatar`, `dag-running`, `dag-failed`, `dag-unknown`, `dag-partial`, `dag-awaiting`, `dag-stalled`, `dag-crashed`, `dag-cycle`, `approval`, `tint-primary@mantle`, `tint-primary@base`, `tint-primary@raised`, `tint-info@crust`, `tint-info@mantle`, `tint-info@base`, `tint-info@raised`, `tint-success@crust`, `tint-success@mantle`, `tint-success@base`, `tint-success@raised`, `tint-warning@mantle`, `tint-warning@base`, `tint-warning@raised`, `tint-danger@crust`, `tint-danger@mantle`, `tint-danger@base`, `tint-danger@raised`, `tint-agent@mantle`, `tint-agent@base`, `tint-agent@raised`, `drop-target@mantle`, `drop-target@base`, `drop-target@term-unfocused`, `drop-target@term`, `drop-target@raised`, `file-drop@crust`, `file-drop@mantle`, `file-drop@base`, `file-drop@term-unfocused`, `file-drop@term`, `marquee@mantle`, `marquee@base`, `marquee@term-unfocused`, `marquee@term`, `split-zone@crust`, `split-zone@mantle`, `split-zone@base`. Controls do not sit on a tint. Put them on a neutral ground beside it.
- `track`, `track-raised`. A track holds its thumb and nothing else.
- `term-selection`, `term-cursor`. A terminal layer holds the cell ink only.
- `crust+hover`, `crust+press`, `mantle+hover`, `mantle+press`, `base+hover`, `term-unfocused+hover`, `term+hover`, `base+press`, `term-unfocused+press`, `term+press`, `raised+hover`, `raised+press`, `on-raised+hover`, `on-raised+press`. A progress or selection mark takes no hover state of its own.
- `match@term`, `match@base`, `match@term-unfocused`, `match-active@term`, `match-active@base`, `match-active@term-unfocused`, `match@term-selection`, `match-active@term-selection`. Only the terminal cell ink sits in a search match.
- Every `scrim@*` ground. Inert layer. Content under a scrim has no target, and nothing new is drawn on it.

### `scrollbar-thumb`

| Token | Grounds | Lowest, Mocha · Latte |
|---|---|---|
| `scrollbar-thumb` | `crust`, `mantle`, `base`, `term-unfocused`, `term`, `tab-hover` | 3.36 · 3.29 |
| `scrollbar-thumb-raised` | `raised`, `field` | 3.40 · 3.65 |
| `scrollbar-thumb-hover` | `on-raised`, `solid-hover` | 4.10 · 4.39 |

Forbidden:

- `active`, `crust+hover`, `crust+press`, `mantle+hover`, `mantle+press`, `base+hover`, `term-unfocused+hover`, `term+hover`, `base+press`, `term-unfocused+press`, `term+press`, `raised+hover`, `raised+press`, `on-raised+hover`, `on-raised+press`, `active+hover`, `active+press`. A row does not own a scrollbar.
- `fill-primary`, `fill-agent`, `fill-danger`, `fill-success`, `fill-warning`, `fill-close`, `fill-primary+hover`, `fill-primary+press`, `fill-agent+hover`, `fill-agent+press`, `fill-danger+hover`, `fill-danger+press`. A filled control carries one ink pair. Hue or neutral steps on it would read as a second state.
- `tint-avatar`, `dag-running`, `dag-failed`, `dag-unknown`, `dag-partial`, `dag-awaiting`, `dag-stalled`, `dag-crashed`, `dag-cycle`, `approval`, `tint-primary@mantle`, `tint-primary@base`, `tint-primary@raised`, `tint-info@crust`, `tint-info@mantle`, `tint-info@base`, `tint-info@raised`, `tint-success@crust`, `tint-success@mantle`, `tint-success@base`, `tint-success@raised`, `tint-warning@mantle`, `tint-warning@base`, `tint-warning@raised`, `tint-danger@crust`, `tint-danger@mantle`, `tint-danger@base`, `tint-danger@raised`, `tint-agent@mantle`, `tint-agent@base`, `tint-agent@raised`, `drop-target@mantle`, `drop-target@base`, `drop-target@term-unfocused`, `drop-target@term`, `drop-target@raised`, `file-drop@crust`, `file-drop@mantle`, `file-drop@base`, `file-drop@term-unfocused`, `file-drop@term`, `marquee@mantle`, `marquee@base`, `marquee@term-unfocused`, `marquee@term`, `split-zone@crust`, `split-zone@mantle`, `split-zone@base`. Controls do not sit on a tint. Put them on a neutral ground beside it.
- `track`, `track-raised`. A track holds its thumb and nothing else.
- `term-selection`, `term-cursor`. A terminal layer holds the cell ink only.
- `match@term`, `match@base`, `match@term-unfocused`, `match-active@term`, `match-active@base`, `match-active@term-unfocused`, `match@term-selection`, `match-active@term-selection`. Only the terminal cell ink sits in a search match.
- Every `scrim@*` ground. Inert layer. Content under a scrim has no target, and nothing new is drawn on it.

### `progress-fill`

| Token | Grounds | Lowest, Mocha · Latte |
|---|---|---|
| `accent-primary` | `crust`, `mantle`, `base`, `term-unfocused`, `raised`, `on-raised`, `field`, `term`, `tab-hover` | 4.33 · 3.18 |
| `accent-primary-raised` | `solid-hover`, `active` | 3.17 · 3.84 |

Forbidden:

- `fill-primary`, `fill-agent`, `fill-danger`, `fill-success`, `fill-warning`, `fill-close`, `fill-primary+hover`, `fill-primary+press`, `fill-agent+hover`, `fill-agent+press`, `fill-danger+hover`, `fill-danger+press`. A filled control carries one ink pair. Hue or neutral steps on it would read as a second state.
- `tint-avatar`, `dag-running`, `dag-failed`, `dag-unknown`, `dag-partial`, `dag-awaiting`, `dag-stalled`, `dag-crashed`, `dag-cycle`, `approval`, `tint-primary@mantle`, `tint-primary@base`, `tint-primary@raised`, `tint-info@crust`, `tint-info@mantle`, `tint-info@base`, `tint-info@raised`, `tint-success@crust`, `tint-success@mantle`, `tint-success@base`, `tint-success@raised`, `tint-warning@mantle`, `tint-warning@base`, `tint-warning@raised`, `tint-danger@crust`, `tint-danger@mantle`, `tint-danger@base`, `tint-danger@raised`, `tint-agent@mantle`, `tint-agent@base`, `tint-agent@raised`, `drop-target@mantle`, `drop-target@base`, `drop-target@term-unfocused`, `drop-target@term`, `drop-target@raised`, `file-drop@crust`, `file-drop@mantle`, `file-drop@base`, `file-drop@term-unfocused`, `file-drop@term`, `marquee@mantle`, `marquee@base`, `marquee@term-unfocused`, `marquee@term`, `split-zone@crust`, `split-zone@mantle`, `split-zone@base`. Controls do not sit on a tint. Put them on a neutral ground beside it.
- `track`, `track-raised`. A track holds its thumb and nothing else.
- `term-selection`, `term-cursor`. A terminal layer holds the cell ink only.
- `crust+hover`, `crust+press`, `mantle+hover`, `mantle+press`, `base+hover`, `term-unfocused+hover`, `term+hover`, `base+press`, `term-unfocused+press`, `term+press`, `raised+hover`, `raised+press`, `on-raised+hover`, `on-raised+press`, `active+hover`, `active+press`. A progress or selection mark takes no hover state of its own.
- `match@term`, `match@base`, `match@term-unfocused`, `match-active@term`, `match-active@base`, `match-active@term-unfocused`, `match@term-selection`, `match-active@term-selection`. Only the terminal cell ink sits in a search match.
- Every `scrim@*` ground. Inert layer. Content under a scrim has no target, and nothing new is drawn on it.

## 7. Meaning

**Hue or shape.** Ask what carries the meaning.

- **Hue:** favorite star, plugin dot, mirror glyph, status dots, attached ring. The glyph keeps its hue through the `-on-active` token on a selected row.
- **Shape:** file kinds, chevrons, close, the unregistered star. The glyph takes the row ink on a selected row.
- **Selection mark:** check, selection bar. It takes `accent-primary-on-active`.
- **Text hue on a selected row:** forbidden. No hue reaches 4.5:1 there and still differs from the row ink. Use the row ink, with a hue glyph or a Tag beside it.
- **Match run on a selected row:** row ink with an underline, `autocomplete-match-underline-*`.

**Never color alone.** Each state also has a word, a glyph, a dash pattern, a position or a fill. A dot alone must also have a tooltip or a label. The popup focus border is the only exception, as set out in the popup focus pass mark below.

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
| surface bed | mocha | `surface-bed-focused`, `surface-bed-unfocused` | 0.245 | not needed |
| surface bed | latte | `surface-bed-focused`, `surface-bed-unfocused` | 0.095 | not needed |
| surface focus edge | mocha | `surface-focus-edge-focused`, `surface-focus-edge-unfocused` | 0.602 | not needed |
| surface focus edge | latte | `surface-focus-edge-focused`, `surface-focus-edge-unfocused` | 0.442 | not needed |
| surface focus edge and rings | mocha | `surface-focus-edge-focused`, `surface-highlight-done-border` | 0.088 | not needed |
| surface focus edge and rings | latte | `surface-focus-edge-focused`, `surface-highlight-input-border` | 0.135 | not needed |
| state ground on its parent | mocha | `surface-active`, `surface-raised` | 0.153 | not needed |
| state ground on its parent | latte | `surface-active`, `surface-raised` | 0.099 | not needed |
| keyboard-active and hover rows | mocha | `surface-active`, `raised+hover` | 0.092 | not needed |
| keyboard-active and hover rows | latte | `surface-active`, `raised+hover` | 0.047 | The hover row is the row under the pointer. |
| popup focus border | mocha | `popup-border-focused`, `popup-border-unfocused` | 0.153 | not needed |
| popup focus border | latte | `popup-border-focused`, `popup-border-unfocused` | 0.099 | not needed |

**`not needed`.** In the Second channel column, this means the pair reaches OKLab ΔE 0.08 or more, so color tells the pair apart. Never color alone still applies to each state on its own, with the popup focus border as the only exception.

**Surface focus pass mark.** Binds the built-in themes only, Mocha and Latte.

- The pair `surface-bed-focused`, `surface-bed-unfocused` must hold OKLab ΔE 0.08 or more. Two grounds are not held to a contrast ratio, as text and a border are. `surface-terminal-focused-bg`, `surface-terminal-unfocused-bg` and `surface-markdown-focused-bg`, `surface-markdown-unfocused-bg` must equal that pair.
- The pair `surface-focus-edge-focused`, `surface-focus-edge-unfocused` must hold ΔE 0.08 or more and contrast 3:1 or more, and `surface-focus-edge-focused` must hold 3:1 on `crust`, `mantle`, `base`, `raised` and `term`. The contrast is on top of the ΔE because the two states meet in one thin bar with no word or glyph.
- All these values are opaque. A translucent value composites over its neighbor first, in 8 bits.
- The built-in theme files repeat the tokens: `[surfaces.terminal]` and `[surfaces.markdown]` hold `surface-*-focused-fg` and `surface-*-unfocused-fg` as these tokens resolve. Where the two differ, the token is right. The unfocused ink is `text-muted`, so it is subtext0 in Mocha and subtext1 in Latte, where subtext0 is 4.26 on crust.
- The two default inks are not a pair that must be told apart. The beds carry focus. The inks only keep to the same direction: Latte 7.99 focused against 4.73 unfocused, ΔE 0.057 between the inks. Mocha 14.52 against 7.37, ΔE 0.128.

**Rings among themselves.** The group `surface focus edge and rings` compares the lit edge with each ring and holds no ring pair. The closest ring pair is `surface-occupied-hard-border`, `surface-highlight-input-border` in Latte at ΔE 0.062. Width separates them, 1px against 2px, except on a focused `html` or plugin webview leaf, where the top side of either one is a single 1px row. Only hue is left there. That case is unmeasured, and it goes back to design if it does not read in the app.

**Popup focus pass mark.** Binds the built-in themes only, Mocha and Latte.

- **Identification grade.** Both border values use the `border-frame` role for the popup frame outline, grade none, on `base` and `raised` ([section 5](#5-roles-and-grades)). The fill, shadow and content identify the popup. Neither border value has a contrast target against the fill.
- **State condition.** The two border values must differ by at least OKLab ΔE 0.08, as the surface bed pair does. Contrast ratio does not set this threshold. Both values are steps on the surface ramp from `crust` to `surface2`. No step on that ramp reaches 3:1 against `border-frame`. On `crust`, contrast is 2.81 · 1.63. Grounds outside the ramp can reach 3:1. `term` gives 3.15 in Mocha and the `text` step gives 3.69 in Latte. These grounds are outside the set of border values.
- **Measurements.** `popup-border-focused` and `popup-border-unfocused` differ by OKLab ΔE 0.153 · 0.099. Contrast between them is 1.88 · 1.40. Against the dialog fill `base`, contrast is 2.46 · 1.91 when focused and 1.30 · 1.37 when unfocused. Against the `raised` fill of the search bar and banner more menu, contrast is 1.88 · 1.40 when focused and 1.00 · 1.00 when unfocused. The unfocused border equals `raised`, so the fill against what is under the shell gives it its outline. Measurements use 8-bit values and WCAG 2 contrast. Values are in Mocha · Latte order.
- **Exception to Never color alone.** The popup focus border is the one exception. The user chose the shell border in place of the top bar, with the border color closer to the fill while the popup has no key focus. As with the surface bed, the pair is judged by OKLab ΔE alone, at 0.08 or more. This pass mark judges the border pair on its own and does not count on marks inside the popup. That limit is for this judgment only: a control with widget focus still draws its focus edge or keyboard focus ring in the frames set in Popup focus. Border color alone shows where key focus is, including which of two scoped popups in one window holds it, when no control in the focused popup has widget focus and no row is keyboard-active. The parent and child picker frame on the Dialogs page shows this state with key focus on the child picker. The banner more menu for an unknown program also shows this state, with both rows disabled and widget focus on the menu. When key focus returns to a hard-occupied bed kind, the bed stays unfocused, any terminal cursor stays hidden, and every eligible popup border draws `popup-border-unfocused`, showing only that the scoped popup let go of key focus. The app's key handling stays the same.

**State ground pass mark.** Binds the built-in themes only, Mocha and Latte.

- As for the surface bed, the pass mark is OKLab ΔE alone, at 0.08 or more between `surface-active` and each parent it sits on in the location map. The lowest values are on `raised`, 0.153 in Mocha and 0.099 in Latte.
- The lowest OKLab ΔE values between `active` and `<parent>+hover` on the same parent are on `raised`, 0.092 in Mocha and 0.047 in Latte. Latte falls below 0.08.
- Position under the pointer is the second channel that identifies the hover row in this pair. Keyboard-active outranks hover on the same row.
- A translucent state ground composites over its parent first, in 8 bits.

**Tint rule.** A tint holds its own hue and neutrals. A second hue on it reads as a conflict, so it is forbidden.

## 8. Hierarchy

Contrast sets the floor, so the ink steps can merge. In Latte `text-secondary` and `text-muted` are one ink, and on `raised` body, secondary and muted are one ink. On `active` every neutral is one ink. This is by design. Order holds through these, in this order:

1. **Size.** Body 13, caption 11, micro 10. A supporting line is one step smaller than the line it supports.
2. **Weight.** A title is 13 at 600. An unread item is semibold. D2Coding, the UI face, ships two weights: 400 and 500 draw Regular, 600 and 700 draw Bold. So 600 is the step that reads, and medium does not separate from normal.
3. **Family.** Paths, IDs, times and process names are mono. Words from the translation catalog drawn as a small label read `font-label`.
4. **Position.** The line under a label is its detail, `label-detail-gap` away.
5. **Ink step,** where one exists.

Do not add a fainter ink to get order back. An ink under grade is a failure, whatever it does for the order.

**Label family.** A small label that draws words from the translation catalog reads `font-label`: section headings, column headings, Tags, status words and counters with a word in them. Its value depends on the UI language, not on the string.

| UI language | `font-ui` | `font-label` | Catalog strings with Han, kana or CJK punctuation |
|---|---|---|---|
| en | `font-family-ui` | `font-mono` | 0 of 3892 |
| ko | `font-family-ui` | `font-mono` | 0 of 3822 |
| ja | `font-family-ui-ja` | `font-ui` | 3768 of 3822 |
| zh-Hans | `font-family-ui-zh-hans` | `font-ui` | 3773 of 3822 |

- **Why.** A label reads the family of the words around it. In en and ko D2Coding holds every letter of the catalog, and `font-ui` and `font-mono` both draw it. In ja and zh-Hans D2Coding holds kana and 4620 Han in Korean forms but not the rest, so with D2Coding first Han from D2Coding and Han from the system font met in 1746 of 3822 ja strings and 3307 of 3822 zh-Hans strings, sometimes inside one word. So in these two languages `font-ui` starts with D2Coding under a range that leaves out Han, kana, CJK punctuation and full-width forms (the CJK ranges below), and the language's own CJK font draws them. Every Han in a string then comes from one face, in the language's forms. `font-mono` keeps the whole of D2Coding, so a label reading it would still draw Korean-form Han: the label reads `font-ui`.
- **By language, not by string.** Choosing per string would set neighbouring labels in different faces, and having the letter says nothing about its form.
- **What stays.** Size, weight, ink, tracking and uppercase stay as the label has them. Uppercase does not touch Han or kana. The label keeps its truncation.
- **Row height and baseline.** The row height is exact, down to a fraction of a pixel. Where `font-label` reads `font-ui`, the label takes the line height and the baseline that `font-mono` has at the same size, so changing the language moves no layout and a label shares one baseline with a mono count in its row. Both follow the mono metrics. They are not a stored offset. An icon stays centred in its row. Body text in `font-ui` does not move.
- **Latin in a `font-ui` label.** Latin draws in D2Coding, the face it has in an en or ko label. No second face, synthetic bold or brighter ink is added.
- **CJK ranges.** In ja and zh-Hans, D2Coding draws nothing in U+2E80–2FFF, U+3000–303F, U+3040–30FF, U+3100–312F, U+3190–31FF, U+3400–4DBF, U+4E00–9FFF, U+F900–FAFF, U+FE10–FE1F, U+FE30–FE4F, U+FE50–FE6F, U+FF00–FF9F, U+FFE0–FFE6, U+1AFF0–1B16F and U+20000–3FFFF: radicals, CJK punctuation, kana, Han and its extensions, compatibility ideographs, vertical forms, small form variants, full-width and half-width forms and kana supplements. Those characters take the language's CJK font, then the system sans. Latin, digits, Hangul (Hangul compatibility jamo and half-width Hangul included), general punctuation such as … — “ ”, symbols, box drawing, and the enclosed and squared CJK letters (U+3200–33FF, which hold Hangul and units) stay in D2Coding. CJK punctuation and full-width forms leave with the Han: their place in the em differs by language, and in the catalog they sit between Han (、。「」（）：？ in ja, 、。，：；？（） in zh-Hans).
- **Where this is judged.** The browser gallery draws D2Coding for both families, but the CJK font after it is the browser's system font, not the app's. Which face draws each character can be read in the browser. The row height and baseline above, and how the app's CJK font sits beside D2Coding, are measured in the app. The specimen shows the arrangement.
- **One run, one family.** A value inside a translated string takes the label family with the words. Where the value has to be mono, it is its own run.
- **Stays mono in every language.** Terminal cells, code and commands, paths, IDs, permissions, surface kinds, versions, ports, sizes, times, counts with no word, keycaps, the wordmark, and Tags that hold one of these (`Tag mono`).

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
| label.danger | `menu-item-part-fg-active` | keyboard-active | `active` | 4.62 · 5.40 |
| icon.danger | `menu-item-part-fg-active` | keyboard-active | `active` | 4.62 · 5.40 |
| label.chosen | `menu-item-selected-fg` | rest | `raised` | 8.69 · 7.57 |
| label.chosen | `menu-item-fg-hover` | hover, press | `raised+hover` | 6.82 · 6.36 |
| label.chosen | `menu-item-fg-hover` | keyboard-active | `active` | 4.62 · 5.40 |
| fill, fill.danger, fill.chosen | `surface-active` (state ground `active`, no role) | keyboard-active | `raised` | ΔE 0.153 · 0.099 ([section 7](#7-meaning)) |
| label | `text-disabled` | disabled | `raised` | no target |
| icon | `text-disabled` | disabled | `raised` | no target |
| shortcut | `text-disabled` | disabled | `raised` | no target |
| check | `text-disabled` | disabled | `raised` | no target |
| label.chosen | `text-disabled` | disabled | `raised` | no target |

The roleless state-ground checks `fill`, `fill.danger` and `fill.chosen` match only the `surface-active` token for the `active` state ground (section 3, State grounds) on the keyboard-active plain row, danger row and selected option, respectively, so substituting the hover tint fails as a wrong fill. These fills are state grounds held to the state ground pass mark in [section 7](#7-meaning), and the contrast grades in [section 5](#5-roles-and-grades) apply only to the inks drawn on them. Against `raised`, the fills measure 1.88 / 1.40 in contrast and 0.153 / 0.099 in OKLab ΔE, Mocha then Latte. A keyboard-active danger row uses the row ink `menu-item-part-fg-active` for its label and icon because no danger hue reaches 4.5:1 on `surface-active`.

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

Sits on: `mantle`, `raised`

An inactive tab keeps its strip’s fill, mantle on an unfocused pane and raised on the focused pane. On raised, its label uses `tab-fg-raised` because `tab-fg` provides 4.05:1 contrast in Latte, below the 4.5:1 text target.

| Part | Token | States | Ground | Lowest, Mocha · Latte |
|---|---|---|---|---|
| label | `tab-fg` | rest | `mantle` | 7.89 · 5.14 |
| label | `tab-fg-raised` | rest | `raised` | 5.65 · 5.17 |
| label.needs-input | `tab-fg-needs-input` | rest | `mantle`, `raised` | 9.89 · 5.24 |
| label.completion | `tab-fg-completion` | rest | `mantle`, `raised` | 5.97 · 5.38 |
| icon | `text-secondary` | rest | `mantle`, `raised` | 7.10 · 4.05 |
| close | `text-secondary` | rest | `mantle`, `raised` | 7.10 · 4.05 |
| dot | `accent-success-raised` | rest | `mantle`, `raised` | 8.46 · 4.91 |
| separator | `tab-separator` | rest | `mantle`, `raised` | no target |

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

Sits on: `mantle`, `raised`

With Underline (the default) or Dot, the active tab keeps the strip’s fill (mantle on an unfocused pane, raised on the focused pane). The `indicator` is the top bar or the dot.

| Part | Token | States | Ground | Lowest, Mocha · Latte |
|---|---|---|---|---|
| label | `tab-fg-active` | rest | `mantle`, `raised` | 8.69 · 5.17 |
| label.needs-input | `tab-fg-needs-input` | rest | `mantle`, `raised` | 9.89 · 5.24 |
| label.completion | `tab-fg-completion` | rest | `mantle`, `raised` | 5.97 · 5.38 |
| icon | `text-secondary` | rest | `mantle`, `raised` | 7.10 · 4.05 |
| close | `text-secondary` | rest | `mantle`, `raised` | 7.10 · 4.05 |
| dot | `accent-success-raised` | rest | `mantle`, `raised` | 8.46 · 4.91 |
| indicator | `tab-indicator` | rest | `mantle`, `raised` | 5.97 · 3.18 |

### Tab.active (fill)

Sits on: `base`

The active tab with the Fill indicator. It takes `tab-bg-active` and draws no mark.

| Part | Token | States | Ground | Lowest, Mocha · Latte |
|---|---|---|---|---|
| label | `tab-fg-active` | rest | `base` | 11.34 · 7.06 |
| label.needs-input | `tab-fg-needs-input` | rest | `base` | 12.91 · 7.15 |
| label.completion | `tab-fg-completion` | rest | `base` | 7.79 · 7.34 |
| icon | `text-secondary` | rest | `base` | 9.26 · 5.53 |
| close | `text-secondary` | rest | `base` | 9.26 · 5.53 |
| dot | `accent-success-raised` | rest | `base` | 11.03 · 6.70 |

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

Sits on: `crust`, `mantle`, `base`, `raised`, `term`, `term-unfocused`

| Part | Token | States | Ground | Lowest, Mocha · Latte |
|---|---|---|---|---|
| indicator | `spinner-indicator` | rest | `crust`, `mantle`, `base`, `raised`, `term`, `term-unfocused` | 7.86 · 5.89 |

**Track.** The arc and its motion say the work is running, and the arc holds 3:1. The track is an ornament with no grade: arc ink at 22%, 1.44 to 1.73 in Mocha and 1.33 to 1.47 in Latte. It carries the mark `data-ink-grade="none" data-ink-why="ornament"`, and `noGradeParts` in the file records it. It goes wherever the arc goes, `solid-hover` and `active` included. The `glyph-decorative` ban on `active` is about a separate ornament that reads as a second state. The track is inside the arc, in the arc's hue, so it adds none. Nothing else may lean on this.

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

`button` is a Windows caption button. `window button` is a round Linux window button drawn by Tasty, on the main window and the settings window. Its glyph keeps the title ink at rest, hover and press, and only the hover or press fill changes. The Linux close button under the pointer is the Window close button.

| Part | Token | States | Ground | Lowest, Mocha · Latte |
|---|---|---|---|---|
| title | `titlebar-fg` | rest | `crust` | 10.59 · 4.73 |
| button | `titlebar-button-fg` | rest | `crust` | 8.42 · 4.73 |
| button | `titlebar-button-fg-hover` | hover, press | `crust+hover`, `crust+press` | 9.31 · 4.62 |
| window button | `titlebar-fg` | rest | `crust` | 10.59 · 4.73 |
| window button | `titlebar-fg` | hover, press | `crust+hover`, `crust+press` | 7.60 · 3.62 |

### Title bar (inactive)

Sits on: `mantle`

| Part | Token | States | Ground | Lowest, Mocha · Latte |
|---|---|---|---|---|
| title | `titlebar-fg-inactive` | rest | `mantle` | 7.89 · 5.14 |
| button | `titlebar-fg-inactive` | rest | `mantle` | 7.89 · 5.14 |
| button | `titlebar-button-fg-hover` | hover, press | `mantle+hover`, `mantle+press` | 8.50 · 5.01 |
| window button | `titlebar-fg-inactive` | rest | `mantle` | 7.89 · 5.14 |
| window button | `titlebar-fg-inactive` | hover, press | `mantle+hover`, `mantle+press` | 5.52 · 3.92 |

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
| count | `text-muted` | rest | `mantle` | 7.89 · 5.14 |
| count | `text-muted-raised` | hover, press | `mantle+hover`, `mantle+press` | 5.52 · 5.01 |
| count | `text-on-active` | selected | `active` | 4.62 · 5.40 |
| count | `text-on-active-hover` | selected+hover, selected+press | `active+hover`, `active+press` | 4.97 · 4.74 |
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
| remote | `statusbar-remote-fg` | rest | `crust`, `mantle` | 11.29 · 5.67 |

The remote part is the glyph and host label a mirror surface shows. While the connection is reconnecting, the same item reads the label and glyph rows above.

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

### DAG empty state

Sits on: `term`, `term-unfocused`, `base`

| Part | Token | States | Ground | Lowest, Mocha · Latte |
|---|---|---|---|---|
| glyph | `glyph-dim` | rest | `term`, `term-unfocused`, `base` | 3.36 · 4.26 |
| title | `text-secondary` | rest | `term`, `term-unfocused`, `base` | 9.26 · 4.73 |
| hint | `text-muted` | rest | `term`, `term-unfocused`, `base` | 7.37 · 4.73 |

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
| search match | `text-primary` | rest | `match@term` | 6.67 · 6.06 |
| search match, dim cell | `text-primary` | rest | `match@term` | 6.67 · 6.06 |
| selection | `text-on-active` | rest | `term-selection` | 4.62 · 5.40 |
| selection, dim cell | `text-on-active` | rest | `term-selection` | 4.62 · 5.40 |
| selection and search match | `search-match-selected-fg` | rest | `match@term-selection` | 5.07 · 8.96 |
| selection and search match, dim cell | `search-match-selected-fg` | rest | `match@term-selection` | 5.07 · 8.96 |
| selection and active match | `search-match-selected-fg` | rest | `match-active@term-selection` | 9.81 · 8.20 |
| vi cursor cell | `vi-cursor-fg` | rest | `term-cursor` | 10.48 · 6.60 |
| link under the pointer | `text-on-active` | rest | `term-selection` | 4.62 · 5.40 |
| link underline | `accent-primary-raised` | rest | `term-selection` | 3.17 · 3.84 |

### Terminal (unfocused)

Sits on: `term-unfocused`

| Part | Token | States | Ground | Lowest, Mocha · Latte |
|---|---|---|---|---|
| default ink | `surface-terminal-unfocused-fg` | rest | `term-unfocused` | 7.37 · 4.73 |
| search match | `text-primary` | rest | `match@term-unfocused` | 4.75 · 4.88 |
| search match, dim cell | `text-primary` | rest | `match@term-unfocused` | 4.75 · 4.88 |
| selection | `text-on-active` | rest | `term-selection` | 4.62 · 5.40 |
| selection, dim cell | `text-on-active` | rest | `term-selection` | 4.62 · 5.40 |
| selection and search match | `search-match-selected-fg` | rest | `match@term-selection` | 5.07 · 8.96 |
| selection and search match, dim cell | `search-match-selected-fg` | rest | `match@term-selection` | 5.07 · 8.96 |
| selection and active match | `search-match-selected-fg` | rest | `match-active@term-selection` | 9.81 · 8.20 |
| vi cursor cell | `vi-cursor-fg` | rest | `term-cursor` | 10.48 · 6.60 |
| link under the pointer | `text-on-active` | rest | `term-selection` | 4.62 · 5.40 |
| link underline | `accent-primary-raised` | rest | `term-selection` | 3.17 · 3.84 |

### Surface focus edge

Sits on: `crust`, `mantle`, `base`, `term`

| Part | Token | States | Ground | Lowest, Mocha · Latte |
|---|---|---|---|---|
| edge | `surface-focus-edge-unfocused` | rest | `crust`, `mantle`, `base`, `term` | no target |
| edge | `surface-focus-edge-focused` | focus | `crust`, `mantle`, `base`, `term` | 9.26 · 4.73 |

In this contract `rest` is unfocused and `focus` is focused. Html and plugin surfaces take it.

### Markdown document

Sits on: `term`, `term-unfocused`

| Part | Token | States | Ground | Lowest, Mocha · Latte |
|---|---|---|---|---|
| body | `md-doc-fg` | rest | `term`, `term-unfocused` | 9.26 · 4.73 |
| quote | `md-quote-fg` | rest | `term`, `term-unfocused` | 7.37 · 4.73 |
| find hit | `md-find-hit-fg` | rest | `fill-warning` | 14.76 · 5.03 |
| find current | `md-find-current-fg` | rest | `fill-primary` | 8.91 · 4.91 |

A quote reads `md-quote-fg` and takes no opacity, at any nesting. In Latte that is the body ink, and the bar and the indent mark the quote (see [Hierarchy](#8-hierarchy)).

A find hit fills with `md-find-hit-bg` and the current hit with `md-find-current-bg`. Both are opaque, because a hit can land on the bed, a table row, a table header, code or a callout. Each takes its own ink over whatever ink was under it, link and highlight hues included. A focus change touches neither.

### Markdown table

Sits on: `term`, `term-unfocused`

| Part | Token | States | Ground | Lowest, Mocha · Latte |
|---|---|---|---|---|
| cell | `md-table-cell-fg` | rest | `base`, `mantle` | 9.26 · 5.14 |

The grid and the outer edge read `md-table-border`, a partition with no grade. A line sits on a row fill (`base`, `mantle`), on the header (`raised`), or on the bed (`term`, `term-unfocused`) where a row has no fill and at the table's outer edge. The file lists all six grounds for this token.

### Markdown table header

Sits on: `term`, `term-unfocused`

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
| Capture band | `capture-band-height` 32px | `space-sm` 8px | - | Body, size mono | Hint left, size and Esc right | Hint ellipsis, right end |
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
| File picker row | `tree-row-height` 22px | `fp-inset-start` 12px | `icon-size-md` 16px | Body, mono micro meta | Left, size and date right | Ellipsis |
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
| `surfaces` | Each surface kind has four keys. `focused_bg` and `unfocused_bg` set the background color with and without focus, respectively. `focused_fg` and `unfocused_fg` set the text color with and without focus, respectively. The surface focus edge has no key here: it follows `subtext1` and `mantle`, and no manifest color reaches it. The two `markdown` bed fields also supply the beds of the `Markdown document` rows under **Terminal layers**. |

The keys in the table are the color fields a theme file can set. `label` and `is_light` are theme file keys outside the table. A field supplies its corresponding token if it has one. The names can differ. `search_match_active_fg` supplies `search-match-active-fg`. `text` supplies `text-primary`. `crust` supplies `bg-app`. Each cell names the same token in every theme. Tasty applies a user theme without a limit, warning, block or separate contrast check. A theme with every color set to white applies like any other.

**Resolution order.** Tasty resolves a user theme in five steps.

1. Tasty merges the theme file and the override.
2. The source of each field determines whether it is set or unset. A field is set if the theme file or override sets it. It is also set if its value carries over from a theme that set it explicitly. Otherwise it is unset.
3. Set fields keep their step 2 values. Tasty fills each unset field. For an unset `surfaces` field of a kind a plugin has successfully registered, Tasty first uses the default color the plugin's manifest declares for that field of that kind. This also applies to kinds with corresponding tokens, such as `markdown`. A manifest can omit the whole default color table or any field in it. An unset field with no manifest value uses its own derivation if it has one. An unset `search_match_active_fg` uses the derivation under **Unset active match ink**. An unset field with neither a manifest value nor its own derivation uses its corresponding token's formula if it has one. An unset `surfaces.terminal.unfocused_fg` takes `text-muted`. An unset surface field with none of these takes Tasty's general default color for that surface field. A manifest value or a general default is the field's canonical value before fitting. The filled field stays unset. Tokens with no field evaluate their formulas using these values. The results are the user theme's canonical values before fitting.
4. Tasty classifies each ink token under **Fitted by R1**. Only a set field from step 2 can be the endpoint for keeping an ink as given. A token with a set field keeps that value independently of its formula. When `surfaces.terminal.unfocused_fg` is set, `surface-terminal-unfocused-fg` keeps that value independently of `text-muted`. An ink filled by its own unset derivation is a derived ink. An ink token whose step 3 value comes from a plugin manifest is a derived ink. R1 starts from that step 3 value. For example, an unset `surfaces.markdown.focused_fg` that takes a manifest value such as `#cdd6f4` makes `surface-markdown-focused-fg` a derived ink. Its formula reads `text-primary`. Its value is independent of the theme's `text`, and it stays outside the `text-primary` pool. No row in the current file measures `surface-markdown-focused-fg` or `surface-markdown-unfocused-fg` as ink. R1 has no constraint for either ink and keeps its step 3 value. If an ink token is a pure alias of another ink as defined under **Fitted by R1**, the alias is kept as given when its source is kept as given. If the source is a derived ink, the alias shares that ink's fitted value and pools its allowed cells with it. `switch-thumb-raised-bg` does this with `control-thumb-raised`. When `surfaces.terminal.unfocused_fg` is unset, `surface-terminal-unfocused-fg` shares the result of `text-muted` as a pure alias.
5. R1 fits each derived ink starting from its step 3 value. A pure alias used as ink reads its source's fitted value. Grounds read step 3 values. A pure alias that paints a ground also reads step 3 values. Every other formula reads step 3 values, including band roles. In a dark band with `search_match_active_fg` unset, `search-match-active-unfocused-fg` reads the derived step 3 value of `search-match-active-fg`. The built-in dark formula for `search-match-active-fg` reads `base`. R1 fits `search-match-active-unfocused-fg` on its own constraints.

- **Kept as given.** Tasty keeps the value of every field under `palette`, `accent`, `terminal`, `ansi` and `surfaces` that counts as set in step 2 of **Resolution order**. Tasty also keeps that value for every pure alias of such a field, using the definition under **Fitted by R1**. These values supply fills, borders and body text. A field keeps its given value when used as ink too, as with `search-match-active-fg`.
- **Fitted by R1.** Step 4 of **Resolution order** uses the classes below. An ink is kept as given only if it resolves to a set field in every band, directly or through pure aliases. Every other ink token is a derived ink. R1 fits derived inks. A `color-mix` is a derived ink. A band role that picks a field, a token or a fixed color by band is a derived ink. A token that reads the same fixed color in every band is a derived ink. `control-thumb-raised` reads white in both bands. An ink the app computes from `base` and `text` because its field is unset is a derived ink, as with unset `search-match-active-fg`. Tokens with the same suffix can fall in different classes. This applies to suffixes such as `-raised`, `-strong`, `-on-active`, `-ink`, `-fill` and `-glyph`. A band role is its own derived ink even in a band where it returns a field or another token. `search-match-active-unfocused-fg` reads `search-match-active-fg` in a dark band. It reads a fixed color in a light band. For these classes, only a token that takes its step 3 value from its token formula can be a pure alias. A pure alias points to the same source in every band without making a band choice. A pure alias of a set field is kept as given. Equal RGB alone joins neither a set field nor another band role.

**Constraints.** In `tokens/ground-ink-rules.json`, take `matrix` cells whose `result` names the ink or a joined alias, skipping `forbidden`. Take `components` contract rows whose `token` names that ink or alias. Each row supplies its `ground` and its own grade from `roles[].grade`, looked up by `role`. A token can have both 4.5 and 3 rows. A null grade or null `role` adds no constraint. The `site` table and the use exceptions in [section 12](#12-exceptions) add none.

**Resolve the ground.** Build the stack from the ground and its `parents` chain. Resolve each bed layer's color under **Terminal layers**. Every other layer reads its own `token` in the current theme. For the `Markdown document` body and quote rows, the `host` equals the `ground`, so the ground itself reads the bed color. Composite from the bottom up in paint order. `grounds[].values` records the built-in colors. Use only the rules below to find the backing.

- **Component backing.** For a `components` row, put the row's `host` under the ground's stack unless the stack already holds that `host`. This includes a `host` equal to the row's `ground`. It also includes a `host` at the root of the chain, such as `base` under `base+hover`. A `host` has no `parents`. For `Button.primary`, `fill-primary` has no `parents`. Its `#00000080` fill gives `#000000` on a black host and `#7f7f7f` on a white host.
- **Matrix backing.** A `matrix` cell has no `host`. Measure the ground on its own stack. This also applies to a ground that sits elsewhere, such as `base` as a modal frame over a scrim. Each ground ID enters a stack once.
- **Terminal layers.** `term-selection` and `term-cursor` have no `parents`. They always sit on a terminal bed. A `components` row with `term` or `term-unfocused` as its `host` uses that `host` as its only bed ID. Place the `host` by **Component backing**. Each ground ID enters the stack once. This includes a `host` equal to the `ground`. Measure the row once on that bed. Measure a stack rooted at `term-selection` or `term-cursor` twice only for a `matrix` cell with no `host`. Measure it once over each terminal bed. Each measurement adds a constraint row at the cell's grade. The stack's use determines which color the bed reads. Tasty uses only the row's stack and the ink name written in that row to decide whether it measures terminal cells. The ink name comes from `components[].token` or `matrix[].result`. A row measures terminal cells when its stack holds a terminal bed under `term-selection`, `term-cursor` or a match ground. A row also measures terminal cells when its own ink name is a `surfaces.terminal` ink token, as in a default cell ink row. A joined alias pool receives each row's constraint as resolved by this rule. In the current file, these are exactly the `Terminal` and `Terminal (unfocused)` contract rows and the `matrix` cells over a terminal layer. A stack that measures terminal cells reads the step 3 bed value from `surfaces.terminal`. Otherwise, a `Markdown document` contract row reads the step 3 bed value from `surfaces.markdown`. Use the original `components` row before alias pooling. Its `component` is `Markdown document` and its `host` is `term` or `term-unfocused`. In the current file, body, quote, find hit and find current each have a row on both beds. In either lookup, `term` reads `focused_bg` and `term-unfocused` reads `unfocused_bg`. Every other stack reads the ground's own `token` for `term` or `term-unfocused`, whether the ID appears as the `host` or as the ground. The `token` for `term` is `surface-terminal-focused-bg`. The `token` for `term-unfocused` is `surface-bed-unfocused`. Markdown, explorer and the DAG canvas share the `term` and `term-unfocused` ground IDs. The `Markdown table` and `Markdown table header` rows carry `md-` inks and use those same IDs, reading the ground's own `token` for the bed color just as explorer and the DAG empty state glyph do. Only `Markdown document` rows read `surfaces.markdown` for the bed color, regardless of the `md-` prefix. A `Markdown document` find row composites its own ground over its bed. `match@base` and `match-active@base` sit on `base` without a terminal bed. Composite grounds in the paint order of [section 4](#4-location-map). A cursor fill replaces the selection on the same cell. `term-cursor` composites over the bed. A match fill composites over the selection or the cursor. The bed under `term-selection` or `term-cursor` stays out of the ink measurement only while that fill is opaque, as it is in Mocha and Latte. An overlap with no row of its own in `matrix` or `components` adds no constraint. The vi cursor under the active match is one such overlap. Its contrast in a user theme is outside the guarantee. Cell grounds the running program picks are also outside the guarantee.
- **Bottom layer.** After building the stack, treat a translucent bottom layer as opaque for the reference color. Use its RGB at full alpha. This covers a translucent `host` and a translucent `matrix` root that sits on more than one surface. This covers a `#RRGGBBAA` root in a user's TOML and window background opacity. The contrast on screen in those cases is outside the guarantee. No other rule adds a backing.

**Unset active match ink.** Step 3 of **Resolution order** uses this derivation for an unset `search_match_active_fg`. Use the 8-bit rule at the top of this page. Settle the step 3 values of `search-match-active-bg`, `base` and `text` before the first composite. Use those values for the reference color and both candidates. Composite the current `search-match-active-bg` over `base`. If `base` is translucent, apply the bottom layer rule under **Resolve the ground.** The composite is the reference color. Composite each candidate, `base` and `text`, over the reference color. Use each candidate's alpha as its token gives it. Measure each composite against the reference color. Choose the candidate with the larger contrast. On a tie, choose `base`. Keep the chosen candidate with its alpha. The chosen candidate is the canonical value before fitting for `search-match-active-fg`.

**R1.** Start with `v`, the ink's canonical value before fitting. In a user theme, this is the step 3 value under **Resolution order**. R1 uses the already resolved `v` unchanged as its starting value. R1 measures contrast with the 8-bit rule at the top of this page.

Keep `v` if all its constraints pass or it has none. Otherwise move its lightness toward the band's first pole. The resolved theme's `is_light` sets the first pole after the theme file and override are merged. The pole is `primitive.color-white` (`#ffffff`) when `is_light` is false. It is `primitive.color-black` (`#000000`) when `is_light` is true.

1. Try each integer `t` from 1 to 100. Mix each sRGB channel of `v` with the pole channel at `t` percent and keep `v`'s alpha. For opaque ink this is the existing `color-mix`. Composite translucent ink over the resolved ground before measuring. Use the 8-bit rule at the top of this page and take the smallest `t` that passes every row at its own grade.
2. If no candidate passes, repeat from `v` toward the opposite pole. If that search also fails, keep `v`.

**Order.** Grounds and other token formulas read canonical values. In a user theme, these are the step 3 values under **Resolution order**. The DAG success block fill mixes the canonical `accent-success-raised`. An off switch paints `switch-track-bg` from canonical `border-control`. It judges `control-thumb` on that track. `switch-track-raised-bg` and `border-control-raised` work the same way. Once step 3 values are settled, grounds stay fixed and the order of R1 fitting makes no difference. R1 adds no constant or token.

**Limits.** One fitted ink value serves all its allowed grounds. The hardest ground can move the ink further than the others need. This is over-fitting. If `text-on-accent` has no value that passes on all its user fills, R1 keeps its canonical value. Tints made with opacity at the place of use and outside composite surfaces are outside R1.

**Open boundaries.** Implementers ask for a ruling here before implementing any user theme case this page leaves open.

**Built-in record and checks.** R1 uses the existing numeric grades. R1 must preserve every value in Mocha and Latte. An app test must prove this. The recorded tables and the gallery and site checks stay on Mocha and Latte. In section 4, the selection, vi cursor and link rows hold on both beds for Mocha and Latte. The selected ordinary match and selected active match cells also hold on both beds in those themes. Section 4 describes `term-selection` and `term-cursor` as opaque in those themes. A user theme follows **Terminal layers**. In Mocha and Latte the `surfaces.markdown` beds equal the ground token values, so the recorded `Markdown document` values stay the same. The section 4 webview chrome tile on `markdown` reads the common bed. The document reads `surfaces.markdown`. Both follow focus. They match in Mocha and Latte. In a user theme they match only when the two lookups give the same color. The `surfaces.markdown` bed rule covers only the `Markdown document` contract rows. The table row and zebra, the host tile and the focus display follow section 4. The no-exception failure for below-grade ink in [section 2](#2-how-strong-the-rules-are), the grades in [section 5](#5-roles-and-grades) and the below-grade failure in [section 8](#8-hierarchy) apply to Mocha and Latte. They give no guarantee for every color in a user theme. Given fields and their pure aliases are outside the guarantee. Derived inks follow R1, including its fallback to `v`.

In [section 7](#7-meaning), the surface focus, popup focus and state ground pass marks and **Colors told apart** (OKLab ΔE 0.08 or a second channel) belong to the built-in record and checks. R1 covers only contrast between a graded derived ink, such as text or a glyph, and its ground. Telling colors apart is outside R1.

The measurement rule for text a user reads to act belongs to the built-in checks. The use exceptions in [section 12](#12-exceptions) apply to the same uses in a user theme.

**Plugins.** Nothing in the SDK enforces token use. An `egui-mesh` plugin drives egui in its own process and sends the tessellated result to the host, so it can technically paint raw colors. Taking colors and spacing from the Theme tokens the host passes is a documented promise. So the rules split by who can keep the promise:

| What is drawn | Status | How it holds |
|---|---|---|
| Host chrome around a plugin: tab, address bar, frame, banner, menu, surface focus edge | In the rules | The host draws it. |
| Bundled `egui-mesh` plugin UI | In the rules, by promise | Not enforced at run time. Bundled sources have no raw color call today (`Color32::from_*`, `from_rgb`, tests excluded). A source check can hold that. |
| Bed on a plugin surface | Offered, not promised | The host offers the two bed values to any plugin. A plugin that follows the two bed values matches the host's common bed. In Mocha and Latte the common bed also equals the terminal's. In a user theme the terminal's unfocused bed can differ. The bed values for a kind's own `surfaces` entry come from step 3 of **Resolution order**. The host edge shows either way. |
| Third-party `egui-mesh` plugin pixels | Exception | The host cannot check them. A plugin that takes its colors from the host's Theme tokens follows the table, and one that does not is content. |
| `html` page | Exception | Webview content, like a web page. |
| `markdown` document | In the rules, except code highlight | Rendered in a webview. The table covers its `md-*` tokens. The `Markdown document` rows take their bed from **Terminal layers**. The frame around it is host chrome. |
| `tag-*` source chip, plugin avatar, plugin dots | In the rules | They read their normal contracts. |

## 12. Exceptions

| Target | Gallery id | Why |
|---|---|---|
| `ansi-*` | `ansi-content` | Terminal content. The running program picks the color. |
| `terminal cell attributes` | `terminal-attributes` | Reverse video, bold, dim, underline, strikethrough, overline and SGR colors come from the program. |
| `html page content` | `html-page` | A web page paints itself. |
| `plugin webview content` | `plugin-webview` | Same as a web page. Host chrome around it stays in the rules. |
| `third-party egui-mesh plugin pixels` | `third-party-plugin` | The plugin tessellates in its own process, so the host cannot check its colors. Using the host Theme tokens is a documented promise. Bundled plugins stay in the rules. |
| `image surface content` | `image-content` | The file is the content. |
| `capture picture, capture-dim-bg, capture-edge-*` | `capture-picture` | A copy of the user's screen. Tasty picks none of its colors and draws no text on it. The dim and the edge read on any picture, as section 4 computes. |
| `markdown code highlight` | `code-highlight` | Content colors from the highlighter. The block fill stays in the rules. |
| `brand-melon-*` | `brand` | Logo artwork. |
| `titlebar-traffic-*, accent-macos-*` | `os-window-controls` | OS window controls keep OS colors. |
| `state-dim-opacity, banner-recessed-opacity` | `dimmed` | A list behind an open editor or a banner behind another banner is inert and comes back. Anything a user still reads or selects takes an ink with a grade, not opacity. |
| `content under scrim` | `under-scrim` | Inert while the modal is open. |
| `dag-canvas-dot` | `decorative-grid` | Decorative grid. The canvas reads without it. |
| `titlebar-csd-radius` | not contrast | Window corner follows the OS window shape, 8px. |
| `font-size-brand-*, font-size-prose-h1, font-size-term*` | not contrast | Brand, rendered content and terminal cell are outside the 14px UI cap. |
| `control-height-tree 22` | not contrast | The tree row is the one off-grid height. It is the system constant. |

Every token has one class, ground, foreground, border, exception or non-color, in the `tokens` list of the file. That list is the count; this page does not repeat it. Exceptions include the primitive color values, which UI never reads.

Disabled ink and ornaments are not exceptions. Their grade is none.

Before an exception or a no-grade mark goes on anything, ask: is this inert, decorative or program output, or does a user read it to act? Text a user reads to act is measured, including a command to approve, a file name, a reason, a progress word and a value in effect.

## 13. Changing the rules

When a new UI needs a cell that is forbidden or missing:

1. Do not pick a value in the widget. Ask for the change with a design request.
2. The designer adds the ground, role or cell. New values are new tokens. A token is never renamed or removed.
3. The designer updates `ground-ink-rules.json` in the same commit as the tokens. Every new token gets a class. Run `scripts/design-tokens/verify_ground_ink_tokens.py` to check the rules' token list against the token CSS.
4. Recompute every cell in both themes. Below grade or unclassified means it is not finished.
5. Add the case to `gallery/rules/index.jsx` if it is a new ground, and to `gallery/rules-map/index.jsx` if it is a new nesting.
6. Record it in the commit message.

A new exception follows the same path and needs a reason a reader can check. "It looks better" is not a reason.

## 14. Gallery check

The gallery is the canon the app follows, and the check reads it rendered, in Mocha and in Latte, as `gallery/README.md` lays out.

- **A frozen state cell** identifies its contract with `data-contract`, `data-state` and `data-host`. It can use `data-parts` to cover selected parts. The gallery check verifies row coverage and measures each selected part against its token and grade. See `measureGallery()` in [`scripts/contrast-gallery.mjs`](../scripts/contrast-gallery.mjs), `run()` in [`scripts/check-contrast.mjs`](../scripts/check-contrast.mjs) and `selectParts()`, `validateParts()` and `expectedTheme()` in [`scripts/contrast-page.mjs`](../scripts/contrast-page.mjs).
- **Everything else on a gallery page** is measured too: text at 4.5, glyphs at 3. Opacity is composited into the ink. It never excludes anything. Individual below-grade and wrong-ink records for site rows in the shared UI also fail the gallery check (see `chromeFailures()` in [`scripts/contrast-site.mjs`](../scripts/contrast-site.mjs) and its tests in [`scripts/contrast-page.test.mjs`](../scripts/contrast-page.test.mjs)).
- **Ground scope.** A specimen names a role, such as `text-muted`, and sits on a ground. `gallery/parts/specimen.css` re-points the role tokens inside a `surface-raised`, `surface-active`, `surface-hover` or hover-wash fill to the [matrix](#6-matrix) cell for that ground. It mirrors the matrix, it does not widen it. The app has no scope: it reads the cell directly. Frozen state cells are outside the scope, they read the row token.
- **Tier 1 specimens.** `gallery/foundations` and `gallery/tokens` paint primitive color tokens where the primitives themselves are the subject, in a chip with no ink on it. This documents the tier and does not widen it: UI reads no primitive. Text beside a chip is measured as usual.
- **Annotation marks.** A dashed outline that a specimen draws only to explain it, such as an implementer's box or a scope rectangle, is not app UI and the app draws none. It has no fill, so its edge alone shows it, and a reader needs it to read the specimen. It reads `specimen-annotation-border`. One mark can cross several grounds, so the token takes the `border-control` cell of `raised`, which holds 3:1 on `raised` and on every lower ground. On `active` the ground scope re-points it to that ground's `border-control` cell. A mark keeps off a scrim, where nothing is drawn, and is placed so that it does not cross an `active` ground from outside its scope. A reserved, empty swatch is a swatch, not an annotation: it reads `swatch-border` dashed.
- **Terminal content in a specimen.** The gallery shows the app, so terminal content in a specimen represents what the running program prints in the colors it picks. Each ANSI-colored span reads an `ansi-*` token and carries `ansi-content`. That id allows only `ansi-*` tokens and excludes Tasty accents and roles. The default cell ink and what the app draws over cells keep their grades and are measured as specified in [Terminal content](#terminal-content) in section 4.
- **`data-audit-exempt="<id>"`** skips one subtree. The id is the Gallery id in [section 12](#12-exceptions). No other value passes, and the check lists every use.
- **`data-ink-grade="none" data-ink-why="disabled|ornament"`** marks a disabled ink or an ornament outside a state cell. These are not exceptions: [section 12](#12-exceptions) says their grade is none. The check still confirms a disabled ink is `text-disabled` or a token whose role has no grade.

## 15. Site pages

The site's landing, guide and design pages use the same grounds, roles and table as the app. `site` in `tokens/ground-ink-rules.json` holds the same content as this section, with a selector on every row. A place not listed here takes its cell from [the table](#6-ground-by-role). This applies to Mocha and Latte only.

**Grades.** Text 4.5. Display text, at 24px and over or 18.66px bold and over, may use 3, because the site is not capped at 14px. No place relies on it. Non-text 3.

**How to read a ground.** Page: `base`. Header, footer, table head: `mantle`. Sidebar: `base`, `mantle` in the drawer below 900px. The drawer opens from the menu button and starts with the site links, on pages with no sidebar too. These are the app's grounds, with the app's cells. Translucency that lets page content under an ink is not used: the header is opaque.

**The brand on a page.**

- The mark keeps its colors, through `brand-melon-*`. Exception id `brand`. The wordmark dot is the mark, not text: the word reads without it.
- `brand-ink` is the brand hue as text or a glyph. It is the flesh in Mocha and `color-melon-flesh-deep` in Latte: the same hue, deepened without going through black, so it reads as melon and not brick. It holds 4.5 on `crust`, `mantle` and `base`. On `raised` it holds 3, for a glyph only.
- The call to action keeps the flesh as its ground in both themes, and its label is the seed: `brand-on-fill`, as in the mark. Hover and press are tints of the same flesh. Rind is not a hover ground, the label reads 3.66 on it.
- A gradient has two ends. Measure the ink at both, take the lower. The closing band is the only one painted. The glow behind the landing window is covered by the window and is not a ground.

**Code blocks.** One dark palette in both themes, from `code-fixed-*`. A comment is read to act, so it takes `site-code-comment` and a grade. The other highlighter inks stay under the `code-highlight` exception.

**Inline code.** A chip reads `site-inline-code`, with a 1px `border-default` edge. Mocha keeps `raised`. In Latte `raised` is darker than a page of running text wants, so the chip steps back to `mantle`.

**Figures of the app.** The site draws the app window and CLI terminal on the landing page, the window diagrams in the guide, and the terminal panes in workflow diagrams. The `ansi-content` exception does not cover figures drawn by the site. The workflow terminal panes and the unfocused pane of the landing page's app window sit on `term-unfocused`. Their lines read the text cells for `term-unfocused`. The CLI terminal on the landing page and every focused pane in the app window and the guide's window diagrams sit on `term`. Their lines read the text cells for `term`. The remaining lines read the text cells for `base`. See [section 14](#14-gallery-check) for gallery specimens.

**Links.** A link reads `accent-primary-raised`. In running text it also takes an underline at rest, because in Latte that ink is too close to body text to tell apart by lightness. In a note it takes body ink and the underline, because a second hue on a tint is forbidden.

**Notes.** The guide's translation notice is a `.note`: warning tint when a translation is stale, primary tint with `.note--untranslated` when there is none. It has no lead word and no hue edge. A link in it takes body ink and an underline. The design home's English-only notice uses the same primary tint.

**Skip link.** Hidden until keyboard focus. Then it sits at the top left over the header, on its own `base` fill with a 1px edge and the link ink, and the focus ring goes around that.

**Language switch.** One button and one list of links at every width, opened by a `details` element so it works without the site script. Each language is named in its own language and script, in that language's font on every page, because the reader who needs the switch may not read the page. Simplified Chinese is written `简体中文`, not `中文`, so the name says which script exists. The button shows the globe, the current name and a chevron above 900px, and the globe alone at or below it, where it is the size of the other header buttons. The current row takes the tint, the weight and the check mark. The ring on a row sits outside the row, on the panel. A row is 36px tall, and 44px at or below 900px or on a coarse pointer.

**Tables.** Every table in a guide page sits in `.table-wrap`: the 1px frame, the `mantle` head and the sideways scroll on a narrow screen. Inline code in a table wraps only where its own text allows, such as at a space or a hyphen, and a token wider than the room scrolls the table instead of splitting. File names, plugin IDs and environment variables follow the same rule. Japanese and Chinese cells keep a `10em` floor, because their prose can break after any character and the column would otherwise collapse. Inline code outside a table may still split inside a token, so a long one cannot push the page wider.

**Scroll frames.** On the site's own pages, `.table-wrap`, `.anat-window`, `.anat-settings` and `pre.astro-code` take focus with Tab (`tabindex="0"`). This lets keyboard readers scroll sideways when the content is wider than the frame. They get the same 2px solid `border-focus` outline as links and buttons, 2px outside the frame on `base`.

### Site grounds

| ID | Token | Mocha | Latte | Used for |
|---|---|---|---|---|
| `site-cta` | `site-cta-bg` | #f25d6b | #f25d6b | Primary call to action, guide figure labels. |
| `site-cta+hover` | `site-cta-bg-hover` | #f36a77 | #f36a77 | Pointer over the call to action. |
| `site-cta+press` | `site-cta-bg-press` | #f4707d | #f4707d | Press on the call to action. |
| `site-code` | `site-code-bg` | #24292e | #24292e | Code block. One dark palette in both themes. |
| `site-inline-code` | `site-inline-code-bg` | #313244 | #e6e9ef | Inline code chip. Raised in Mocha, mantle in Latte. |
| `site-quote` | `site-quote-bg` | #2b2232 | #efe8ed | Block quote. |
| `site-tile-hover` | `site-tile-hover-bg` | #2b2232 | #efe8ed | Former design home tile hover ground. No page uses it. |
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
| Language button | `.lang-switch__toggle` | `mantle` | `text-secondary` | `text-secondary` | 9.91 · 5.14 |
| Language button, pointer over | `.lang-switch__toggle:hover` | `raised` | `text-secondary` | `text-secondary-raised` | 7.10 · 5.17 |
| Language button, press | `.lang-switch > .lang-switch__toggle:active` | `solid-hover` | `text-body` | `text-on-active` | 6.31 · 6.43 |
| Language button, list open | `.lang-switch[open] > .lang-switch__toggle` | `raised` | `text-body` | `text-primary` | 8.69 · 5.17 |
| Language list row | `.lang-switch__menu a` | `mantle` | `text-body` | `text-primary` | 12.14 · 6.57 |
| Language list row, pointer over | `.lang-switch__menu a:hover` | `raised` | `text-body` | `text-primary` | 8.69 · 5.17 |
| Language list row, press | `.lang-switch__menu a:active` | `solid-hover` | `text-body` | `text-on-active` | 6.31 · 6.43 |
| Language list row, current | `.lang-switch__menu a[aria-current]` | `tint-primary@mantle` | `text-primary` | `accent-primary-raised` | 6.65 · 5.86 |
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
| Menu button, drawer open | `.menu-btn[aria-expanded="true"]` | `raised` | `glyph` | `text-secondary-raised` | 7.10 · 5.17 |
| Drawer site link | `.site-menu a` | `mantle` | `text-muted` | `text-muted` | 7.89 · 5.14 |
| Drawer site link, pointer over | `.site-menu a:hover` | `raised` | `text-body` | `text-primary` | 8.69 · 5.17 |
| Drawer site link, current | `.site-menu a[aria-current]` | `tint-primary@mantle` | `text-primary` | `accent-primary-raised` | 6.65 · 5.86 |
| Sidebar current item | `.nav-list a[aria-current="page"]` | `tint-primary@base`, `tint-primary@mantle` | `text-primary` | `accent-primary-raised` | 6.18 · 5.86 |
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
| Focus ring | `a, button, input, summary, .table-wrap, .anat-window, .anat-settings, pre.astro-code` | `base`, `mantle`, `raised` | `focus-ring` | `border-focus` | 5.97 · 3.18 |
| Footer text | `.site-footer h4, .site-footer a, .site-footer__blurb, .site-footer__legal` | `mantle` | `text-muted` | `text-muted` | 7.89 · 5.14 |
| Footer link, pointer over | `.site-footer a:hover` | `mantle` | `text-body` | `text-primary` | 12.14 · 6.57 |
| Hero release word | `.hero__eyebrow` | `base` | `text-muted` | `text-muted` | 7.37 · 5.53 |
| Hero release dot | `.hero__eyebrow .dot` | `base` | `mark` | `site-eyebrow-dot` | no target · no target |
| Hero accent | `.hero h1 .accent` | `base` | `text-brand` | `brand-ink` | 5.12 · 5.50 |
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
| Window mock path and dim line, unfocused | `.shell span` | `term-unfocused` | `text-muted` | `text-muted` | 7.37 · 4.73 |
| Window mock prompt | `.shell span` | `term`, `term-unfocused` | `text-agent` | `accent-agent-raised` | 8.07 · 5.68 |
| Window mock success | `.shell span` | `term`, `term-unfocused` | `text-success` | `accent-success-raised` | 11.03 · 5.73 |
| Window mock command | `.shell span` | `term`, `term-unfocused` | `text-primary` | `accent-primary-raised` | 7.79 · 6.28 |
| Window mock warning word | `.shell span` | `term`, `term-unfocused` | `text-warning` | `accent-warning-raised` | 12.91 · 6.11 |
| Window mock version | `.shell span` | `term`, `term-unfocused` | `text-attention` | `accent-attention-raised` | 9.27 · 5.96 |
| Window mock document title | `.shell h2` | `term`, `term-unfocused` | `text-body` | `text-primary` | 11.34 · 6.04 |
| Window mock section heading | `.shell h3` | `term`, `term-unfocused` | `text-primary` | `accent-primary-raised` | 7.79 · 6.28 |
| Design pages text | `.ds-lede` | `base` | `text-muted` | `text-muted` | 7.37 · 5.53 |
| Page navigation edge, pointer over | `.page-nav a:hover` | `base` | `border-partition` | `brand-ink` | no target · no target |

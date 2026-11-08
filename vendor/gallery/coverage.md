# Gallery coverage

Every component contract and location of `tokens/ground-ink-rules.json` against its specimen. Owner is `page#section`. Source of truth for the list is the file, so a row added there must appear here and on a page.

How this was checked: specimens were matched by reading the sources for each contract's tokens and component names, on 2026-11-05. It is not a rendered inventory. The rendered check in `gallery/README.md` replaces this table's last column once frozen cells exist.

## Summary

| Measure | Count | Missing before this change | Missing now |
|---|---|---|---|
| Contracts | 84 | 4 | 0 |
| Locations | 37 | 5 | 0 |
| Frozen cells (component, state, host) with `data-contract` | 422 | 414 | 0 |

The 4 contracts and 5 locations had no gallery specimen and now have one. Each page's `states.jsx` names the contracts it owns, and `parts/contract-cells.jsx` draws their cells.

## Contracts

| Contract | Owner | Renders through | Cells | States | Hosts | Specimen |
|---|---|---|---:|---|---|---|
| Button.secondary | `components#buttons` | Button | 15 | rest, hover, press, focus, disabled | `crust`, `mantle`, `base` | demo and states |
| Button.secondary (on raised) | `components#buttons` | Button, also overlays-banners#bodyink | 5 | rest, hover, press, focus, disabled | `raised` | demo and states |
| Button.primary | `components#buttons` | Button | 16 | rest, hover, press, focus | `crust`, `mantle`, `base`, `raised` | demo and states |
| Button.agent | `components#buttons` | Button | 16 | rest, hover, press, focus | `crust`, `mantle`, `base`, `raised` | demo and states |
| Button.danger | `components#buttons` | Button | 16 | rest, hover, press, focus | `crust`, `mantle`, `base`, `raised` | demo and states |
| Button.ghost | `components#buttons` | Button | 25 | rest, hover, press, focus, disabled | `crust`, `mantle`, `base`, `raised`, `active` | demo and states |
| IconButton | `components#buttons` | IconButton | 25 | rest, hover, press, focus, disabled | `crust`, `mantle`, `base`, `raised`, `active` | demo and states |
| Badge.default | `components#chips` | Badge | 5 | rest | `crust`, `mantle`, `base`, `raised`, `active` | demo and states |
| Badge.danger | `components#chips` | Badge | 5 | rest | `crust`, `mantle`, `base`, `raised`, `active` | demo and states |
| Badge.primary | `components#chips` | Badge | 5 | rest | `crust`, `mantle`, `base`, `raised`, `active` | demo and states |
| Badge.warning | `components#chips` | Badge | 5 | rest | `crust`, `mantle`, `base`, `raised`, `active` | demo and states |
| Badge.agent | `components#chips` | Badge | 5 | rest | `crust`, `mantle`, `base`, `raised`, `active` | demo and states |
| Badge.success | `components#chips` | Badge | 5 | rest | `crust`, `mantle`, `base`, `raised`, `active` | demo and states |
| Badge.neutral | `components#chips` | Badge | 5 | rest | `crust`, `mantle`, `base`, `raised`, `active` | demo and states |
| Tag | `components#chips` | Tag | 10 | rest, disabled | `crust`, `mantle`, `base`, `raised`, `active` | demo and states |
| Kbd | `components#chips` | Kbd | 5 | rest | `crust`, `mantle`, `base`, `raised`, `active` | demo and states |
| Input | `components#forms` | Input | 15 | rest, hover, focus, invalid, readonly | `crust`, `mantle`, `base` | demo and states |
| Input (on raised) | `components#forms` | Input | 5 | rest, hover, focus, invalid, readonly | `raised` | demo and states |
| Select trigger | `components#forms` | Select | 9 | rest, hover, focus | `crust`, `mantle`, `base` | demo and states |
| Select trigger (on raised) | `components#forms` | Select | 3 | rest, hover, focus | `raised` | demo and states |
| MenuItem | `components#nav` | MenuItem | 5 | rest, hover, press, keyboard-active, disabled | `raised` | demo and states |
| AutoComplete row | `components#forms` | AutoComplete | 3 | rest, hover, keyboard-active | `raised` | demo and states |
| MultiSelect row | `components#forms` | MultiSelect | 3 | rest, hover, keyboard-active | `raised` | demo and states |
| SearchableSelect status row | `components#searchable-select` | SearchableSelect | 1 | rest | `raised` | demo and states |
| Checkbox.off | `components#forms` | Checkbox | 15 | rest, focus, disabled | `crust`, `mantle`, `base`, `raised`, `active` | demo and states |
| Checkbox.on | `components#forms` | Checkbox | 8 | rest, focus | `crust`, `mantle`, `base`, `raised` | demo and states |
| Switch.off | `components#forms` | Switch | 6 | rest, focus | `crust`, `mantle`, `base` | demo and states |
| Switch.off (on raised) | `components#forms` | Switch | 2 | rest, focus | `raised` | demo and states |
| Switch.on | `components#forms` | Switch | 8 | rest, focus | `crust`, `mantle`, `base`, `raised` | demo and states |
| Tab.inactive | `components#nav` | Tab | 1 | rest | `mantle` | demo and states |
| Tab.hover | `components#nav` | Tab | 1 | rest | `tab-hover` | demo and states |
| Tab.active | `components#nav` | Tab | 1 | rest | `base` | demo and states |
| TreeRow | `components#nav` | TreeRow | 12 | rest, hover, press, selected, selected+hover, selected+press | `mantle`, `base` | demo and states |
| ListCtrl row | `components#listctrl` | ListCtrl | 16 | rest, hover, press, selected, selected+hover, selected+press, keyboard-active, disabled | `base`, `mantle` | demo and states |
| Table row | `components#data` | Table | 12 | rest, hover, press, selected, selected+hover, selected+press | `base`, `mantle` | demo and states |
| Table header | `components#data` | Table | 1 | rest | `mantle` | demo and states |
| Toast | `components#feedback` | Toast | 4 | rest | `crust`, `mantle`, `base`, `term` | demo and states |
| Tooltip | `components#helphint` | Tooltip | 5 | rest | `crust`, `mantle`, `base`, `raised`, `term` | demo and states |
| HelpHint | `components#helphint` | HelpHint | 4 | rest | `crust`, `mantle`, `base`, `raised` | demo and states |
| Banner | `overlays-banners#banner` | gallery part | 4 | rest | `crust`, `mantle`, `base`, `term` | demo and states |
| StatusDot | `components#feedback` | StatusDot | 5 | rest | `crust`, `mantle`, `base`, `raised`, `active` | demo and states |
| Spinner | `components#feedback` | Spinner | 4 | rest | `crust`, `mantle`, `base`, `raised` | demo and states |
| Progress | `overlays-dialogs#transfer` | gallery part | 1 | rest | `base` | demo and states |
| NotificationBadge.error | `layouts#notifsummary` | NotificationBadge | 5 | rest | `crust`, `mantle`, `base`, `raised`, `active` | demo and states |
| NotificationBadge.warning | `layouts#notifsummary` | NotificationBadge | 5 | rest | `crust`, `mantle`, `base`, `raised`, `active` | demo and states |
| NotificationBadge.info | `layouts#notifsummary` | NotificationBadge | 5 | rest | `crust`, `mantle`, `base`, `raised`, `active` | demo and states |
| NotificationItem | `overlays-windows#notifications` | NotificationItem | 5 | rest, hover, selected, selected+hover, selected+press | `base` | demo and states |
| NotificationSummary | `layouts#notifsummary` | kit notification_summary | 3 | rest, hover, press | `mantle` | demo and states |
| PendingIndicator | `layouts#loading-wait` | PendingIndicator | 4 | rest | `crust`, `mantle`, `base`, `term` | demo and states |
| CenterState | `components#centerstate` | CenterState | 3 | rest | `crust`, `mantle`, `base` | demo and states |
| CodeArea | `overlays-windows#settings` | CodeArea | 3 | rest | `crust`, `mantle`, `base` | demo and states |
| CodeArea gutter | `overlays-windows#settings` | CodeArea | 1 | rest | `field` | demo and states |
| DrillDown back bar | `layouts#drilldown` | DrillDown | 3 | rest | `crust`, `mantle`, `base` | demo and states |
| Title bar | `layouts#titlebar` | layouts-titlebar.jsx | 3 | rest, hover, press | `crust` | demo and states |
| Title bar (inactive) | `layouts#titlebar` | layouts-titlebar.jsx | 3 | rest, hover, press | `mantle` | demo and states |
| Window close button | `layouts#titlebar` | layouts-titlebar.jsx | 2 | rest | `crust`, `mantle` | demo and states |
| Sidebar category band | `layouts#sidebar` | gallery part | 1 | rest | `mantle` | demo and states |
| Workspace row | `layouts#sidebar` | gallery part | 6 | rest, hover, press, selected, selected+hover, selected+press | `mantle` | demo and states |
| Status bar | `layouts#statusbar` | gallery part | 2 | rest | `crust`, `mantle` | demo and states |
| Address bar | `plugins#markdown` | plugins-md-address.jsx, plugins html | 1 | rest | `mantle` | demo and states |
| Modifier hint row | `overlays-popups#modhint` | overlays-shared | 1 | rest | `base` | demo and states |
| Modifier hint role row | `overlays-popups#modhint` | overlays-shared | 1 | rest | `base` | demo and states |
| DAG node | `dag#node` | dag part | 2 | rest, hover | `base` | demo and states |
| DAG node.running | `dag#node` | dag part | 1 | rest | `base` | demo and states |
| DAG node.failed | `dag#node` | dag part | 1 | rest | `base` | demo and states |
| DAG node.unknown | `dag#phase` | dag part | 1 | rest | `base` | demo and states |
| DAG node.partially-failed | `dag#node` | dag part | 1 | rest | `base` | demo and states |
| DAG node.awaiting | `dag#phase` | dag part | 1 | rest | `base` | demo and states |
| DAG runner badge.stalled | `dag#runner` | dag part | 1 | rest | `base` | demo and states |
| DAG runner badge.crashed | `dag#runner` | dag part | 1 | rest | `base` | demo and states |
| DAG cycle notice | `dag#states` | dag part | 1 | rest | `base` | demo and states |
| Approval danger box | `overlays-dialogs#approval` | overlays-shared | 1 | rest | `base` | demo and states |
| Plugin avatar | `overlays-windows#pluginswindow` | gallery part | 2 | rest | `base`, `mantle` | demo and states |
| Tint box.success | `foundations#rolegaps` | gallery part | 3 | rest | `mantle`, `base`, `raised` | demo and states |
| Tint box.warning | `foundations#rolegaps` | gallery part | 3 | rest | `mantle`, `base`, `raised` | demo and states |
| Tint box.danger | `foundations#rolegaps` | gallery part | 3 | rest | `mantle`, `base`, `raised` | demo and states |
| Tint box.info | `foundations#rolegaps` | gallery part | 3 | rest | `mantle`, `base`, `raised` | demo and states |
| Terminal | `layouts#surfaces` | gallery part | 1 | rest | `term` | demo and states |
| Terminal (unfocused) | `layouts#surfaces` | gallery part | 1 | rest | `base` | demo and states |
| Surface focus edge | `layouts#surfaces` | gallery part | 8 | rest, focus | `crust`, `mantle`, `base`, `term` | demo and states |
| Markdown document | `plugins#markdown` | gallery part | 1 | rest | `crust` | demo and states |
| Markdown table | `plugins#markdown` | gallery part | 1 | rest | `crust` | demo and states |
| Markdown table header | `plugins#markdown` | gallery part | 1 | rest | `crust` | demo and states |
| Scrollbar | `components#scrollbar` | components-scrollbar.jsx | 5 | rest | `crust`, `mantle`, `base`, `raised`, `term` | demo and states |

## Locations

| Location | Ground | Owner | Specimen |
|---|---|---|---|
| Title bar | `crust` | `layouts#titlebar` | demo and states |
| Collapsed rail | `mantle` | `layouts#sidebar` | exists |
| Sidebar | `mantle` | `layouts#sidebar` | exists |
| Workspace status bar | `crust` | `layouts#statusbar` | exists |
| Tab bar | `mantle` | `layouts#tabbar` | exists |
| Pane body | `base` | `layouts#multitab` | exists |
| Surface head and split line | `mantle` | `layouts#surfaces` | exists |
| Terminal surface, focused | `term` | `layouts#surfaces` | exists; overlay layers only in foundations#terminal |
| Terminal surface, unfocused | `base` | `layouts#surfaces` | exists |
| Markdown surface | `crust` | `plugins#markdown` | exists |
| HTML surface | `mantle` | `plugins#html` | exists |
| Image surface | `base` | `plugins#image` | exists |
| Empty surface | `crust` | `layouts#surfaces` | exists |
| Explorer | `base` | `plugins#explorer` | exists |
| Modal dialog | `base` | `overlays-dialogs#scrim` | exists |
| Scrim | `scrim@base` | `overlays-dialogs#scrim` | exists |
| Popup | `base` | `overlays-windows#ports` | exists |
| Menu | `raised` | `overlays-popups#tools` | exists |
| Tooltip | `raised` | `components#helphint` | exists |
| Toast | `raised` | `components#feedback` | exists |
| Banner | `raised` | `overlays-banners#banner` | exists |
| Modifier hint | `base` | `overlays-popups#modhint` | exists |
| Settings window | `base` | `overlays-windows#settings` | exists |
| Listening ports popup | `base` | `overlays-windows#ports` | exists |
| File picker | `base` | `overlays-windows#filepicker` | exists |
| Remote connections | `base` | `overlays-windows#remote` | exists |
| Preset editor | `base` | `overlays-windows#preseteditor` | exists |
| Task DAG | `base` | `dag#surfaces` | exists |
| Plugin surface chrome | `base` | `plugins#explorer` | exists |
| Plugin UI through host widgets | `base` | `plugins#explorer` | exists, through the bundled surfaces |
| Startup and boot error | `crust` | `loading#default` | exists |
| Code area | `field` | `overlays-windows#settings` | exists |
| Scrim over crust | `scrim@crust` | `overlays-dialogs#scrimgrounds` | demo and states |
| Scrim over mantle | `scrim@mantle` | `overlays-dialogs#scrimgrounds` | demo and states |
| Scrim over raised | `scrim@raised` | `overlays-dialogs#scrimgrounds` | demo and states |
| Scrim over active | `scrim@active` | `overlays-dialogs#scrimgrounds` | demo and states |
| Scrim over term | `scrim@term` | `overlays-dialogs#scrimgrounds` | exists in #scrim; also added here |

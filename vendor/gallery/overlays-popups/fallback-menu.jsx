import React from "react";
import { Icon, Kbd } from "../../components/index.js";
import { Section, Spec, Stage, Meta, Note, Dont, Views, View } from "../parts/specimen.jsx";
import { FallbackMenu } from "../../ui_kits/terminal/overlays/fallback_menu.jsx";

// Tasty Gallery — Popups and menus › Fallback context menu (2026-11-11).
// Labels are the app's en strings (lang/en.toml [explorer.context_menu], [explorer.menu]). FILE_MENU is the app's
// Explorer menu for one local file: rows and separators in the app's order, shortcuts as the app shows them with the
// default Linux / Windows keymap (each row shows its first binding; Properties has none, so it shows no shortcut).
// Icons stand in for the SVG the item model carries (the app's Open in system icon is an external-link glyph that
// vendor/icons does not have).

const FILE_MENU = [
  { label: "Copy Path", shortcut: "Alt+Shift+C" },
  { label: "Copy", shortcut: "Ctrl+C" },
  { label: "Cut", shortcut: "Ctrl+X" },
  { label: "Rename", shortcut: "F2" },
  { separator: true },
  { label: "Move to Trash", shortcut: "Del" },
  { separator: true },
  { label: "Open in system", icon: <Icon name="file" /> },
  { label: "Show in File Manager", icon: <Icon name="folderOpen" /> },
  { separator: true },
  { label: "Properties" },
];
const MORE_MENU = [
  { label: "Undo", shortcut: "Ctrl+Z", enabled: false, tooltip: "Wait until the file operation in progress finishes" },
  { label: "Redo", shortcut: "Ctrl+Shift+Z", enabled: false, tooltip: "Wait until the file operation in progress finishes" },
  { separator: true },
  { label: "Show in enclosing folder" },
];
const at = (items, label) => items.findIndex((it) => it.label === label);

// A faux window: the menu is placed inside this rect, kept var(--tasty-fallback-menu-edge-margin) from each edge.
// The dot marks the click point; it is a gallery annotation, not part of the menu.
function FallbackWindow({ w, h, click, caption, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--tasty-space-xs)" }}>
      <span style={{ fontFamily: "var(--tasty-font-mono)", fontSize: "var(--tasty-font-size-micro)", color: "var(--tasty-text-muted)" }}>{caption}</span>
      <div data-fallback-window="" style={{ position: "relative", width: w, height: h, overflow: "hidden", borderRadius: "var(--tasty-radius)",
        border: "var(--tasty-border-width) solid var(--tasty-border-default)", background: "var(--tasty-bg-panel)" }}>
        {click && <span aria-hidden="true" style={{ position: "absolute", left: click.x - 2, top: click.y - 2, width: "var(--tasty-space-xs)", height: "var(--tasty-space-xs)",
          borderRadius: "var(--tasty-radius-full)", background: "var(--tasty-border-focus)" }} />}
        {children}
      </div>
    </div>
  );
}

// Live demo: right-click inside the window. Arrow keys move the active row and skip disabled rows and separators,
// wrapping at the ends; the pointer moving onto a row makes it the active row, so one row is lit. Enter runs it,
// Esc or a click outside closes.
function FallbackMenuDemo() {
  const [click, setClick] = React.useState(null);
  const [active, setActive] = React.useState(-1);
  const ref = React.useRef(null);
  const items = FILE_MENU;
  const enabled = items.map((it, i) => (!it.separator && it.enabled !== false ? i : -1)).filter((i) => i >= 0);
  const onKey = (e) => {
    if (!click) return;
    if (e.key === "Escape" || e.key === "Enter") { setClick(null); setActive(-1); e.preventDefault(); return; }
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    e.preventDefault();
    const k = enabled.indexOf(active);
    const n = e.key === "ArrowDown" ? (k < 0 ? 0 : (k + 1) % enabled.length) : (k < 0 ? enabled.length - 1 : (k - 1 + enabled.length) % enabled.length);
    setActive(enabled[n]);
  };
  return (
    <div ref={ref} tabIndex={0} onKeyDown={onKey} style={{ outline: "none" }}
      onContextMenu={(e) => { e.preventDefault(); const r = ref.current.firstChild.lastChild.getBoundingClientRect(); setClick({ x: Math.round(e.clientX - r.left), y: Math.round(e.clientY - r.top) }); setActive(-1); ref.current.focus(); }}
      onClick={() => { setClick(null); setActive(-1); }}>
      <FallbackWindow w={520} h={320} click={click} caption="right-click anywhere · ↑ ↓ · Enter · Esc">
        {click && <FallbackMenu key={`${click.x},${click.y}`} items={items} click={click} active={active} scrollTo={active} onPointerRow={setActive} />}
      </FallbackWindow>
    </div>
  );
}

export function FallbackMenuSection() {
  return (
    <Section id="fallback" title="Fallback context menu">
      <Spec id="fallback-context-menu" title="Fallback context menu — only where the native menu cannot open"
        when={<>Every context menu is the <b>OS menu</b>. Tasty draws this menu <b>only where the native menu cannot be opened</b>: on Linux under the display backend causes 1 (native Wayland, no XWayland), 1b (the X server in <code>DISPLAY</code> unreachable) and 2 (<code>GDK_BACKEND=wayland</code>). It is never a setting and never shown beside an OS menu, so on X11, macOS and Windows nothing changes. It draws the <b>same item model, row for row</b> (label, enabled, reason, shortcut, icon, separator) at all 13 places that open a context menu, and adds nothing: no title, no fallback marker, no extra row, no toast. No submenu, no check mark. It is an anchored popup in the visual language of the Tools menu: no scrim, it closes on a click outside, <Kbd keys="Esc" />, focus loss or running a row.</>}>
        <Stage variant="solo" style={{ padding: "var(--tasty-space-lg)", background: "var(--tasty-bg-app)", gap: "var(--tasty-space-lg)", flexWrap: "wrap", alignItems: "flex-start" }}>
          <FallbackMenuDemo />
          <FallbackWindow w={480} h={200} click={{ x: 24, y: 24 }} caption="Explorer more menu · disabled rows · reason on hover">
            <FallbackMenu items={MORE_MENU} click={{ x: 24, y: 24 }} tip={0} />
          </FallbackWindow>
        </Stage>
        <Views>
          <View name="fallback-menu-open" label="Explorer file menu, opened at the click point">
            <FallbackWindow w={300} h={300} click={{ x: 16, y: 16 }} caption="below and right of the point">
              <FallbackMenu items={FILE_MENU} click={{ x: 16, y: 16 }} />
            </FallbackWindow>
          </View>
          <View name="fallback-menu-keyboard-active" label="Keyboard-active row (↑ ↓), shortcut and icon rows">
            <FallbackWindow w={300} h={300} click={{ x: 16, y: 16 }} caption="active: Show in File Manager">
              <FallbackMenu items={FILE_MENU} click={{ x: 16, y: 16 }} active={at(FILE_MENU, "Show in File Manager")} />
            </FallbackWindow>
          </View>
          <View name="fallback-menu-disabled-reason" label="Disabled row with its reason, tooltip right of the menu">
            <FallbackWindow w={480} h={200} click={{ x: 24, y: 24 }} caption="pointer on Undo">
              <FallbackMenu items={MORE_MENU} click={{ x: 24, y: 24 }} tip={0} />
            </FallbackWindow>
          </View>
          <View name="fallback-menu-reason-flips-left" label="Reason tooltip flips left when the right side has no room">
            <FallbackWindow w={480} h={200} click={{ x: 456, y: 24 }} caption="click near the right edge">
              <FallbackMenu items={MORE_MENU} click={{ x: 456, y: 24 }} tip={0} />
            </FallbackWindow>
          </View>
          <View name="fallback-menu-flip-left" label="Too little room on the right: opens left of the point">
            <FallbackWindow w={300} h={300} click={{ x: 284, y: 16 }} caption="right edge">
              <FallbackMenu items={FILE_MENU} click={{ x: 284, y: 16 }} />
            </FallbackWindow>
          </View>
          <View name="fallback-menu-flip-up" label="Too little room below: opens above the point">
            <FallbackWindow w={300} h={300} click={{ x: 16, y: 284 }} caption="bottom edge">
              <FallbackMenu items={FILE_MENU} click={{ x: 16, y: 284 }} />
            </FallbackWindow>
          </View>
          <View name="fallback-menu-flip-corner" label="Bottom-right corner: opens above and left">
            <FallbackWindow w={300} h={300} click={{ x: 284, y: 284 }} caption="bottom-right corner">
              <FallbackMenu items={FILE_MENU} click={{ x: 284, y: 284 }} />
            </FallbackWindow>
          </View>
          <View name="fallback-menu-taller-than-window" label="Taller than the window: capped, kept 8 from both edges, rows scroll">
            <FallbackWindow w={240} h={200} click={{ x: 16, y: 120 }} caption="window 200 high · active row kept in view">
              <FallbackMenu items={FILE_MENU} click={{ x: 16, y: 120 }} active={at(FILE_MENU, "Properties")} scrollTo={at(FILE_MENU, "Properties")} />
            </FallbackWindow>
          </View>
          <View name="fallback-menu-latte" label="Latte — keyboard-active row and a disabled row's reason">
            <div data-theme="latte" style={{ display: "flex", flexWrap: "wrap", gap: "var(--tasty-space-lg)", padding: "var(--tasty-space-sm)", background: "var(--tasty-bg-app)", borderRadius: "var(--tasty-radius)" }}>
              <FallbackWindow w={300} h={300} click={{ x: 16, y: 16 }} caption="Latte · active">
                <FallbackMenu items={FILE_MENU} click={{ x: 16, y: 16 }} active={at(FILE_MENU, "Cut")} />
              </FallbackWindow>
              <FallbackWindow w={480} h={200} click={{ x: 24, y: 24 }} caption="Latte · reason">
                <FallbackMenu items={MORE_MENU} click={{ x: 24, y: 24 }} tip={0} />
              </FallbackWindow>
            </div>
          </View>
        </Views>
        <Meta
          specs={[
            ["where", "only where the native menu cannot open: Linux, display backend causes 1, 1b, 2 · OS menu everywhere else"],
            ["items", "the native menu's item model, unchanged: label · enabled · tooltip (reason) · shortcut · icon · separator · no submenu, check or danger ink · no fallback marker"],
            ["container", "anchored popup, no scrim · menu-bg · menu-border 1px · menu-radius · popup-content-margin 4 ring · shadow-popover"],
            ["rows", "MenuItem 28 · label wraps (fixed copy) past the max width, never ellipsizes · shortcut = Kbd at the right end"],
            ["icon slot", "if any row has an icon, every row keeps the 16 icon slot so labels share one left edge; a menu with no icon has no slot"],
            ["width", "fit to the longest row · min 160 · max 320"],
            ["disabled", "MenuItem disabled · no hover fill · skipped by the arrow keys · its reason shows as the shared Tooltip on pointer hover, after the tooltip delay"],
            ["reason", "Tooltip centred on the row, tooltip-offset gap from the menu edge · right if tooltip-max-width + tooltip-offset <= the room between the menu and the edge margin on the right, else left if that fits on the left, else the side with more room · a disabled row with no reason shows none"],
            ["keyboard", "no active row on open · ↓ first enabled row, ↑ last · skips disabled rows and separators · wraps at the ends · Enter runs · Esc closes · active = MenuItem active (surface-active)"],
            ["pointer", "hover = MenuItem hover · moving onto a row moves the active row there, so one row is lit"],
            ["anchor", "top-left corner at the click point (logical) · no offset"],
            ["flip", "each axis alone: right of / below the point; if that side does not fit within the edge margin, left of / above; the result is always clamped to [margin, window - margin - menu], so a click inside the margin (even at 0) keeps the 8 gap"],
            ["tall", "max height = window height - 2 x edge margin (8) · the rows scroll inside the ring with the standard scrollbar (tasty-scroll) · the active row scrolls into view"],
            ["dismiss", "click outside · Esc · focus loss · running a row"],
          ]}
          tokens={[
            { tok: "--tasty-menu-bg", use: "menu fill", color: "var(--tasty-menu-bg)" },
            { tok: "--tasty-menu-border", use: "1px edge", color: "var(--tasty-menu-border)" },
            { tok: "--tasty-popup-content-margin", use: "inner ring 4" },
            { tok: "--tasty-shadow-popover", use: "lift" },
            { tok: "--tasty-fallback-menu-min-width", use: "→ size-160" },
            { tok: "--tasty-fallback-menu-max-width", use: "→ size-320" },
            { tok: "--tasty-fallback-menu-edge-margin", use: "→ space-sm 8 · window gap and height cap" },
            { tok: "--tasty-surface-active", use: "keyboard-active row", color: "var(--tasty-surface-active)" },
            { tok: "--tasty-tooltip-bg", use: "reason bubble", color: "var(--tasty-tooltip-bg)" },
          ]} />
        <Note>The menus here are Explorer's file menu and its more menu, with the app's labels. The same shape draws every menu the app opens with the OS menu: tab, pane, workspace, category header, sidebar background, the new workspace and new tab buttons, terminal, terminal link, other surfaces, Explorer items, favorites and more. There is no indicator that this is a fallback: in these environments it is the only menu the user sees, and the cause is already named where it matters (page notices, clipboard toasts).</Note>
        <Dont><b>Don't</b> draw this menu where the OS menu opens, offer it as a preference, or give it rows, order or wording the native menu does not have.</Dont>
      </Spec>
    </Section>
  );
}

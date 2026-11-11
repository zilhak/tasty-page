import React from "react";
import { MenuItem } from "../../../components/navigation/MenuItem.jsx";
import { Tooltip } from "../../../components/feedback/Tooltip.jsx";
import { Kbd } from "../../../components/core/Kbd.jsx";

// Tasty UI kit — fallback context menu (2026-11-11).
// Rule: Tasty draws this menu ONLY where the native (OS) context menu cannot be opened: Linux with the display
// backend causes 1 (native Wayland, no XWayland), 1b (the X server in DISPLAY unreachable) and 2
// (GDK_BACKEND=wayland). Everywhere else every context menu stays the OS menu. It is never offered as a choice and
// never shown next to an OS menu.
// It draws the same item model as the native menu, row for row: label, enabled, tooltip (the reason a row is off),
// shortcut, icon, separator. No submenu, no check mark, no danger ink (the model has none), and nothing of its own:
// no title, no "fallback" marker, no extra row.
// Visual language = the anchored menus (tools_menu.jsx, sidebar_context_menu.jsx): menu-* container tokens, the
// popup-content-margin ring, shadow-popover, no scrim, 28px MenuItem rows.
//
// items: [{ label, shortcut?, icon?, enabled = true, tooltip? } | { separator: true }]
// active: index of the keyboard-active row · scrollTo: a row kept in view (the active row in the app)
// tip: index of a disabled row whose reason is showing (gallery freezes it; the app shows it on pointer hover)
// onPointerRow(i): the pointer moved onto enabled row i; the caller makes it the active row.
// One highlight: the active row. pointerHeld (set by the caller after an arrow key) turns the rows' pointer hover
// off until the pointer moves again (onPointerMove), so a row left under a still pointer is not lit as well.

// A menu where any row has an icon gives every row the icon slot, so the labels share one left edge.
function IconSlot() {
  return <span aria-hidden="true" style={{ display: "inline-block", width: "var(--tasty-icon-size-md)", height: "var(--tasty-icon-size-md)" }} />;
}

// Position from the click point (top-left corner at the point). Each axis on its own:
// right of / below the point; if that side does not fit, left of / above it; then the result is always clamped
// to [margin, window - margin - size], so a click inside the margin (x or y below 8, even 0) still keeps the gap.
// Both sizes are capped first at window - 2 margins (the width also at fallback-menu-max-width, in the style below;
// in a window narrower than min-width + 2 margins the cap wins over min-width), so the clamp range is never empty.
function placeFallbackMenu(click, size, win, margin) {
  const axis = (p, s, w) => {
    const c = p + s <= w - margin ? p : p - s >= margin ? p - s : p;
    return Math.max(margin, Math.min(c, w - margin - s));
  };
  const w = Math.min(size.w, win.w - 2 * margin);
  const h = Math.min(size.h, win.h - 2 * margin);
  return { left: axis(click.x, w, win.w), top: axis(click.y, h, win.h) };
}

function readPx(el, name, fallback) {
  const v = parseFloat(getComputedStyle(el).getPropertyValue(name));
  return Number.isFinite(v) ? v : fallback;
}

function FallbackMenu({ items, click, active = -1, tip = -1, scrollTo = -1, onPointerRow = null, pointerHeld = false, onPointerMove = null }) {
  const panelRef = React.useRef(null);
  const listRef = React.useRef(null);
  const rowRefs = React.useRef([]);
  const [pos, setPos] = React.useState(null);
  const [tipAt, setTipAt] = React.useState(null);
  const hasIcon = items.some((it) => it.icon);
  React.useLayoutEffect(() => {
    const panel = panelRef.current;
    if (!panel || !panel.parentElement) return;
    const host = panel.parentElement;
    const win = { width: host.clientWidth, height: host.clientHeight }; // the window's inner rect, the menu's containing block
    const margin = readPx(panel, "--tasty-fallback-menu-edge-margin", 8);
    const r = panel.getBoundingClientRect();
    const next = placeFallbackMenu(click, { w: r.width, h: r.height }, { w: win.width, h: win.height }, margin);
    if (!pos || pos.left !== next.left || pos.top !== next.top) setPos(next);
    const row = rowRefs.current[scrollTo];
    if (row) row.scrollIntoView({ block: "nearest" });
    const t = rowRefs.current[tip];
    const list = listRef.current;
    if (t && list) {
      const roomRight = win.width - (next.left + r.width) - margin;
      const roomLeft = next.left - margin;
      // the bubble needs its max width plus the tooltip-offset gap: right if tipW + offset <= room on the right,
      // else left if it fits there, else the side with more room
      const need = readPx(panel, "--tasty-tooltip-max-width", 240) + readPx(panel, "--tasty-tooltip-offset", 4);
      const y = list.offsetTop + t.offsetTop - list.scrollTop + t.offsetHeight / 2;
      const side = roomRight >= need ? "right" : roomLeft >= need ? "left" : roomRight >= roomLeft ? "right" : "left";
      if (!tipAt || tipAt.y !== y || tipAt.side !== side) setTipAt({ y, side });
    }
  });
  return (
    <div ref={panelRef} role="menu" data-fallback-menu="" onMouseMove={onPointerMove || undefined} style={{
      position: "absolute", left: pos ? pos.left : click.x, top: pos ? pos.top : click.y, visibility: pos ? "visible" : "hidden",
      width: "max-content",
      minWidth: "min(var(--tasty-fallback-menu-min-width), calc(100% - 2 * var(--tasty-fallback-menu-edge-margin)))",
      maxWidth: "min(var(--tasty-fallback-menu-max-width), calc(100% - 2 * var(--tasty-fallback-menu-edge-margin)))",
      maxHeight: "calc(100% - 2 * var(--tasty-fallback-menu-edge-margin))", boxSizing: "border-box", display: "flex", flexDirection: "column",
      background: "var(--tasty-menu-bg)", border: "var(--tasty-border-width) solid var(--tasty-menu-border)",
      borderRadius: "var(--tasty-menu-radius)", padding: "var(--tasty-popup-content-margin)", boxShadow: "var(--tasty-shadow-popover)" }}>
      <div ref={listRef} className="tasty-scroll" style={{ overflowY: "auto", minHeight: 0, position: "relative", pointerEvents: pointerHeld ? "none" : undefined }}>
        {items.map((it, i) => it.separator
          ? <MenuItem key={i} separator />
          : <div key={i} ref={(el) => { rowRefs.current[i] = el; }}
              onMouseEnter={onPointerRow && it.enabled !== false ? () => onPointerRow(i) : undefined}>
              <MenuItem wrap label={it.label} disabled={it.enabled === false} active={i === active}
                icon={it.icon || (hasIcon ? <IconSlot /> : null)}
                shortcut={it.shortcut ? <Kbd keys={it.shortcut} /> : null} />
            </div>)}
      </div>
      {tipAt && items[tip] && items[tip].tooltip && (
        <span style={{ position: "absolute", top: tipAt.y, ...(tipAt.side === "right" ? { left: "100%" } : { right: "100%" }) }}>
          <Tooltip open placement={tipAt.side} content={items[tip].tooltip}><span style={{ display: "block", width: 0, height: 0 }} /></Tooltip>
        </span>
      )}
    </div>
  );
}

export { FallbackMenu, placeFallbackMenu };

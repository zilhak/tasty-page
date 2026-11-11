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

// A menu where any row has an icon gives every row the icon slot, so the labels share one left edge.
function IconSlot() {
  return <span aria-hidden="true" style={{ display: "inline-block", width: "var(--tasty-icon-size-md)", height: "var(--tasty-icon-size-md)" }} />;
}

// Position from the click point (top-left corner at the point). Each axis on its own:
// right of / below the point; if that side does not fit, left of / above it; if neither fits, clamp to the margin.
// The height is capped first (window - 2 margins), so on the vertical axis the clamp always fits.
function placeFallbackMenu(click, size, win, margin) {
  const axis = (p, s, w) => {
    if (p + s <= w - margin) return p;
    if (p - s >= margin) return p - s;
    return Math.max(margin, Math.min(p, w - margin - s));
  };
  const h = Math.min(size.h, win.h - 2 * margin);
  return { left: axis(click.x, size.w, win.w), top: axis(click.y, h, win.h) };
}

function readPx(el, name, fallback) {
  const v = parseFloat(getComputedStyle(el).getPropertyValue(name));
  return Number.isFinite(v) ? v : fallback;
}

function FallbackMenu({ items, click, active = -1, tip = -1, scrollTo = -1 }) {
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
    if (row && listRef.current) row.scrollIntoView({ block: "nearest" });
    const t = rowRefs.current[tip];
    if (t) {
      const roomRight = win.width - (next.left + r.width) - margin;
      const tipW = readPx(panel, "--tasty-tooltip-max-width", 240);
      const y = t.offsetTop - (listRef.current ? listRef.current.scrollTop : 0) + t.offsetHeight / 2 + listRef.current.offsetTop;
      const roomLeft = next.left - margin;
      // right if it fits, else left if it fits, else the side with more room
      const side = roomRight >= tipW ? "right" : roomLeft >= tipW ? "left" : roomRight >= roomLeft ? "right" : "left";
      if (!tipAt || tipAt.y !== y || tipAt.side !== side) setTipAt({ y, side });
    }
  });
  return (
    <div ref={panelRef} role="menu" data-fallback-menu="" style={{
      position: "absolute", left: pos ? pos.left : click.x, top: pos ? pos.top : click.y, visibility: pos ? "visible" : "hidden",
      width: "max-content", minWidth: "var(--tasty-fallback-menu-min-width)", maxWidth: "var(--tasty-fallback-menu-max-width)",
      maxHeight: "calc(100% - 2 * var(--tasty-fallback-menu-edge-margin))", boxSizing: "border-box", display: "flex", flexDirection: "column",
      background: "var(--tasty-menu-bg)", border: "var(--tasty-border-width) solid var(--tasty-menu-border)",
      borderRadius: "var(--tasty-menu-radius)", padding: "var(--tasty-popup-content-margin)", boxShadow: "var(--tasty-shadow-popover)" }}>
      <div ref={listRef} className="tasty-scroll" style={{ overflowY: "auto", minHeight: 0, position: "relative" }}>
        {items.map((it, i) => it.separator
          ? <MenuItem key={i} separator />
          : <div key={i} ref={(el) => { rowRefs.current[i] = el; }}>
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

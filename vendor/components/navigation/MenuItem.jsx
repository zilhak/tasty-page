import React from "react";
import { Icon } from "../core/Icon";

/**
 * Tasty MenuItem — a row in a context menu, command palette, or tools
 * menu. 28px tall, icon + label + optional trailing shortcut. Supports
 * a danger treatment and a separator variant.
 */

const CSS = `
.tasty-menuitem {
  display: flex;
  align-items: center;
  gap: var(--tasty-space-sm);
  height: var(--tasty-control-height);
  padding: 0 var(--tasty-space-md);
  border-radius: var(--tasty-radius-sm);
  color: var(--tasty-menu-item-fg); /* 2026-10-07 — token is canonical: resting text-secondary, hover/active text-primary */
  font-family: var(--tasty-font-ui);
  font-size: var(--tasty-font-size-body);
  cursor: pointer;
  user-select: none;
  white-space: nowrap;
}
/* The fill eases in only on pointer hover. A transition runs by the style a row changes to, so the rest row has
   none: a row the keyboard leaves drops its active fill at once, with its ink, and a row the pointer leaves drops
   its tint at once (the app draws no fade either way). A row the keyboard leaves while the pointer is still on it
   changes to the hover style, which would ease from the active fill; MenuItem settles that one change under
   data-snap so the row draws the hover tint in the same frame (see the component below). */
.tasty-menuitem:hover { background: var(--tasty-menu-item-bg-hover); color: var(--tasty-menu-item-fg-hover); transition: background var(--tasty-motion-ui-fast) var(--tasty-ease-ui); }
.tasty-menuitem--active { background: var(--tasty-surface-active); color: var(--tasty-menu-item-fg-hover); }
/* keyboard-active outranks hover, as the app's menu_item picks active before hover: the pointer over the active row
   leaves its fill and inks as they are, and the active fill comes and goes at once, pointer or not */
.tasty-menuitem--active:hover { background: var(--tasty-surface-active); color: var(--tasty-menu-item-fg-hover); transition: none; }
.tasty-menuitem[data-snap], .tasty-menuitem[data-snap]:hover { transition: none; }
.tasty-menuitem--danger:hover { color: var(--tasty-accent-danger-strong); }
.tasty-menuitem--danger { color: var(--tasty-accent-danger-raised); }
.tasty-menuitem--active .tasty-kbd__plus { color: var(--tasty-kbd-plus-fg-active); }
.tasty-menuitem__icon { flex: none; display: inline-flex; color: var(--tasty-text-secondary); }
.tasty-menuitem--danger .tasty-menuitem__icon { color: var(--tasty-accent-danger-strong); }
.tasty-menuitem__icon svg { width: var(--tasty-icon-size-md); height: var(--tasty-icon-size-md); display: block; }
.tasty-menuitem__label { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; }
/* 2026-10-08 (batch 8) — selected option (the current value of a Select-style list): ink + trailing check, no fill */
.tasty-menuitem--selected { color: var(--tasty-menu-item-selected-fg); }
.tasty-menuitem__check { flex: none; display: inline-flex; color: var(--tasty-menu-item-check-fg); }
.tasty-menuitem__check svg { width: var(--tasty-menu-item-check-size); height: var(--tasty-menu-item-check-size); display: block; }
/* wrap — the label wraps instead of ellipsising (fixed copy wider than the menu's max width); row grows */
.tasty-menuitem--wrap { height: auto; min-height: var(--tasty-menu-item-height); padding-top: var(--tasty-menu-item-wrap-padding-y); padding-bottom: var(--tasty-menu-item-wrap-padding-y); white-space: normal; line-height: var(--tasty-line-height-ui); }
.tasty-menuitem--wrap .tasty-menuitem__label { overflow: visible; }
.tasty-menuitem__shortcut { flex: none; font-family: var(--tasty-font-mono); font-size: var(--tasty-menu-item-shortcut-font-size); color: var(--tasty-text-muted-raised); }
.tasty-menuitem:hover .tasty-menuitem__shortcut { color: var(--tasty-text-on-active); }
.tasty-menuitem:hover .tasty-menuitem__check { color: var(--tasty-accent-primary-raised); }
/* 2026-11-05 — a keyboard-active row: one ink for every part, danger included (the row's fill is surface-active) */
.tasty-menuitem--active .tasty-menuitem__icon, .tasty-menuitem--active .tasty-menuitem__shortcut, .tasty-menuitem--danger.tasty-menuitem--active, .tasty-menuitem--danger.tasty-menuitem--active .tasty-menuitem__icon { color: var(--tasty-menu-item-part-fg-active); }
.tasty-menuitem--active:hover .tasty-menuitem__shortcut, .tasty-menuitem--danger.tasty-menuitem--active:hover { color: var(--tasty-menu-item-part-fg-active); }
.tasty-menuitem--active:hover .tasty-menuitem__check { color: var(--tasty-menu-item-check-fg); }
/* held — a menu's keys hold the highlight (a fallback menu after an arrow key, until the pointer moves): the pointer's
   tint is off, so a row under a still pointer draws as at rest and only the keyboard-active row is lit. The browser keeps
   :hover on that row until the pointer moves, so the hold is drawn here and not by taking the pointer away. */
.tasty-menuitem--held:not(.tasty-menuitem--active):hover { background: none; color: var(--tasty-menu-item-fg); transition: none; }
.tasty-menuitem--held.tasty-menuitem--selected:not(.tasty-menuitem--active):hover { color: var(--tasty-menu-item-selected-fg); }
.tasty-menuitem--held.tasty-menuitem--danger:not(.tasty-menuitem--active):hover { color: var(--tasty-accent-danger-raised); }
.tasty-menuitem--held:not(.tasty-menuitem--active):hover .tasty-menuitem__shortcut { color: var(--tasty-text-muted-raised); }
.tasty-menuitem--held:not(.tasty-menuitem--active):hover .tasty-menuitem__check { color: var(--tasty-menu-item-check-fg); }
.tasty-menuitem[data-disabled="true"] { pointer-events: none; }
.tasty-menuitem[data-disabled="true"], .tasty-menuitem[data-disabled="true"] * { color: var(--tasty-state-disabled-fg); }
.tasty-menu-sep { height: var(--tasty-border-width); margin: var(--tasty-space-xs) 0; background: var(--tasty-menu-separator); }
`;

// The layout effect runs only in the browser; a server render (the site's static pages) takes the plain effect.
const useBeforePaint = typeof window === "undefined" ? React.useEffect : React.useLayoutEffect;

let injected = false;
function ensureCss() {
  if (injected || typeof document === "undefined") return;
  const el = document.createElement("style");
  el.id = "tasty-menuitem-css";
  el.textContent = CSS;
  document.head.appendChild(el);
  injected = true;
}

export function MenuItem({
  label,
  icon = null,
  shortcut = null,
  danger = false,
  active = false,
  selected = false,
  wrap = false,
  held = false,
  disabled = false,
  separator = false,
  className = "",
  ...rest
}) {
  ensureCss();
  // Leaving keyboard-active is drawn at once, pointer or not. In the commit that drops the class, before the browser
  // paints, the row takes data-snap, its style is resolved once (reading a computed value makes the browser settle
  // the change now, under transition: none), and the mark goes again. So only that one change runs with no
  // transition: nothing is scheduled, nothing outlives the commit or the row, and the hover tint's ease stays for
  // every later pointer entry. Dropping the mark changes no value, so it starts nothing.
  const rowRef = React.useRef(null);
  const wasActive = React.useRef(active);
  useBeforePaint(() => {
    const el = rowRef.current;
    if (wasActive.current && !active && el) {
      el.setAttribute("data-snap", "");
      void getComputedStyle(el).backgroundColor;
      el.removeAttribute("data-snap");
    }
    wasActive.current = active;
  }, [active]);
  if (separator) return <div className="tasty-menu-sep" role="separator" />;
  const cls = [
    "tasty-menuitem",
    danger ? "tasty-menuitem--danger" : "",
    active ? "tasty-menuitem--active" : "",
    selected ? "tasty-menuitem--selected" : "",
    wrap ? "tasty-menuitem--wrap" : "",
    held ? "tasty-menuitem--held" : "",
    className,
  ].filter(Boolean).join(" ");
  return (
    <div ref={rowRef} className={cls} data-disabled={disabled} aria-disabled={disabled || undefined} role={selected ? "menuitemradio" : "menuitem"} aria-checked={selected || undefined} {...rest}>
      {icon && <span className="tasty-menuitem__icon">{icon}</span>}
      <span className="tasty-menuitem__label">{label}</span>
      {shortcut != null && <span className="tasty-menuitem__shortcut">{shortcut}</span>}
      {selected && <span className="tasty-menuitem__check"><Icon name="check" /></span>}
    </div>
  );
}

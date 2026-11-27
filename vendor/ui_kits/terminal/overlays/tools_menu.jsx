import React from "react";
import { MenuItem } from "../../../components/navigation/MenuItem.jsx";
import { gt } from "./graph_copy.js";

// Tasty UI kit — tools menu popup (sidebar "Tools" button).
// Mirrors zilhak/tasty → src/adapters/ui/tools_menu.rs (+ sidebar/tools.rs anchor math).
//   PopupDef: id "tools_menu", 160px wide, headless, close_on_outside_click.


// ── Tools menu — mirrors src/adapters/ui/tools_menu.rs ──────────────────
// 160px popup anchored ABOVE the sidebar Tools button, left-aligned with it
// (pos = btn.min.x, btn.min.y - menu_height), then kept inside the room it may take (placeToolsMenu below).
// 28px rows, no icons, no scrim.
// Built-in entries first, then a separator, then plugin-contributed tools
// (clipboard-viewer contributes "Clipboard Viewer"; git-viewer contributes "Git").
// Built-in order mirrors src/adapters/ui/tools_menu.rs:48-69 — Remote connections…
// is the 3rd entry, between Listening ports… and Presets. Eight built-ins (2026-11-10: Open child graph after Task DAGs; seven since 2026-10-07,
// = BUILTIN_TOOLS); every label that opens a window ends in the ellipsis character.
const TOOLS_BUILTIN = [
  { id: "palette", label: "Command palette…" },
  { id: "ports", label: "Listening ports…" },
  { id: "remote", label: "Remote connections…" },
  { id: "presets", label: "Presets" },
  { id: "tutorial", label: "Tutorial…" },
  { id: "dags", label: "Task DAGs" },
  { id: "child_graph", label: gt("child_graph.tools_menu_item") }, // 2026-11-10 — child graph popup; default shortcut Alt+G (macOS ⌘G), user decision 4-1. Task DAGs: Alt+Y
  { id: "open", label: "Open File…" },
];
const TOOLS_PLUGIN = [
  { id: "clipboard", label: "Clipboard Viewer" },
  { id: "git", label: "Git" },
];

// Keys (the canon; the app does not follow it yet). The menu takes the keys when it opens, with no row marked. Down
// or Tab marks the first row and Up or Shift+Tab the last; each next press moves one row and stops at the ends. Enter
// or Space runs the marked row and does nothing while no row is marked. Esc closes the menu, and the keys stay in it
// until it closes. The marked row draws MenuItem's keyboard-active state and no ring; the pointer only tints.
// Only rows that can run take part: a row with disabled set (the app draws a plugin tool it cannot run as a disabled
// row) is never marked, the first and last rows and each move count runnable rows only, and Enter or Space run a row
// only when it can run, the same test a click passes. The keys are read only while the menu holds them.
// Enter and Space belong to the menu: neither does the browser's own thing (Space scrolling the list), whether or not
// a row is marked. The wheel scrolls the rows and never moves the mark, so the marked row can end up scrolled out of
// view. Enter or Space on a marked row with no part in view runs nothing: the menu scrolls the least that shows the
// whole row, as a key move does, and the next Enter or Space runs it. A marked row with some part in view runs at once.
// So a key runs only a row the user can see marked, and a press is never lost: it either runs or shows what it would run.
// The app's tools_menu popup takes the keys on open (focus_on_open) but its rows are plain egui click widgets: egui
// moves between them only from a focused one, so the first Down, Up, Enter and Space do nothing and Tab must reach a
// row first, and Shift+Tab lands on egui's last candidate, not surely the last row. The app is to take this contract.
// Placement, as the app's (sidebar/tools.rs open_tools_menu, then popup clamp_to_screen): the menu opens above the
// Tools button, left-aligned with it, at its own size; then it is cut down to the room it may take and moved inside
// it, each axis on its own (top in [room.top, room.bottom - height], left in [room.left, room.right - width]). A menu
// taller than the room takes the room's height and its rows scroll, and one wider than the room takes the room's width
// (its labels ellipsize): the cut size is the size it is drawn at, as clamp_to_screen sets the popup's size.
// The anchor is the one the menu opened at. The menu keeps its own size (measured when it opens) apart from the size
// it is cut to, and fits that own size into the current room again whenever the window is resized, as the app clamps
// the popup to the current scope bounds every frame: a menu cut by a smaller window grows back when it grows. A row a
// key marked stays shown through a refit: the menu scrolls the least that shows it in the new height.
// anchor: the button's client rect (Sidebar's onTools(rect, button)). bounds: the room, a client rect
// { top, right, bottom, left }, or a function that returns one; a host that covers part of the window with its own
// fixed chrome (the site's header) passes the part left over. A function is read when the menu opens and on every
// window resize, so a room that follows the window (or the chrome's current edge) stays current; a rect is fixed.
// Without bounds the room is the window, read the same way.
function placeToolsMenu(anchor, size, room) {
  const h = Math.min(size.h, room.bottom - room.top);
  const w = Math.min(size.w, room.right - room.left);
  const top = Math.max(room.top, Math.min(anchor.top - TOOLS_MENU_GAP - h, room.bottom - h));
  const left = Math.max(room.left, Math.min(anchor.left, room.right - w));
  return { top, left, width: w, maxHeight: h };
}
// The kit's gap between the menu and the button it opens from (kept from the menu's first drawing).
const TOOLS_MENU_GAP = 2;
// The layout effect runs only in the browser; a server render (the gallery's static frames) takes the plain effect.
const useBeforePaint = typeof window === "undefined" ? React.useEffect : React.useLayoutEffect;

// Rows the host can run: hostRuns lists the ids its onAction runs. A row not in it draws as a disabled row and so
// takes no key and no click, the same way the app draws a plugin tool it cannot run. Without hostRuns every row runs,
// as in the app. The kit demos and the landing pass their own lists, since they have no window for some tools.
function ToolsMenu({ anchor, bounds = null, hostRuns = null, onClose, onAction }) {
  React.useEffect(() => {
    const h = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);
  const can = (r) => !r.disabled && (!hostRuns || hostRuns.includes(r.id));
  const items = [...TOOLS_BUILTIN, null, ...TOOLS_PLUGIN].map((r) => (r && !can(r) ? { ...r, disabled: true } : r));
  const rows = items.filter(Boolean);
  const menuRef = React.useRef(null);
  const [kb, setKb] = React.useState(-1);
  const [place, setPlace] = React.useState(null);
  // The menu takes the keys once it is placed: until then it is hidden, and a hidden element takes no focus.
  React.useEffect(() => { if (place && menuRef.current) menuRef.current.focus({ preventScroll: true }); }, [!!place]);
  // The menu's own size, measured once while it is drawn uncut and hidden, before the first place.
  const need = React.useRef(null);
  useBeforePaint(() => {
    const el = menuRef.current;
    if (!el) return;
    const roomOf = () => (typeof bounds === "function" ? bounds()
      : bounds || { top: 0, left: 0, right: window.innerWidth, bottom: window.innerHeight });
    const r = el.getBoundingClientRect();
    need.current = { w: r.width, h: r.height };
    const fit = () => setPlace(placeToolsMenu(anchor, need.current, roomOf()));
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);
  // A row a key marks is shown inside the menu: the menu scrolls the least that shows the whole row with the menu's
  // padding, and the page does not move (the focus takes no scroll of its own), as the palette shows its selection.
  const rowEl = (i) => menuRef.current && menuRef.current.querySelector(`[data-row="${i}"]`);
  const reveal = (el) => {
    const menu = menuRef.current;
    const pad = parseFloat(getComputedStyle(menu).paddingTop) || 0;
    const top = el.offsetTop - pad;
    const bottom = el.offsetTop + el.offsetHeight + pad;
    if (top < menu.scrollTop) menu.scrollTop = top;
    else if (bottom > menu.scrollTop + menu.clientHeight) menu.scrollTop = bottom - menu.clientHeight;
  };
  // Some part of the row lies inside the menu's scrolled view, so its fill can be seen.
  const shown = (el) => {
    const menu = menuRef.current;
    return el.offsetTop < menu.scrollTop + menu.clientHeight && el.offsetTop + el.offsetHeight > menu.scrollTop;
  };
  const go = (i) => {
    setKb(i);
    const el = rowEl(i);
    if (!el) return;
    el.focus({ preventScroll: true });
    reveal(el);
  };
  // A refit changes the menu's height: the marked row, if any, is shown again in the new height the same way, before
  // the frame is drawn, and keeps the mark and the focus. A menu with no marked row is left where it is scrolled.
  useBeforePaint(() => {
    if (!place || kb < 0) return;
    const el = rowEl(kb);
    if (el) reveal(el);
  }, [place]);
  const runnable = rows.map((r, i) => (r.disabled ? -1 : i)).filter((i) => i >= 0);
  const onKeyDown = (e) => {
    const down = e.key === "ArrowDown" || (e.key === "Tab" && !e.shiftKey);
    const up = e.key === "ArrowUp" || (e.key === "Tab" && e.shiftKey);
    if (down || up) {
      e.preventDefault();
      if (runnable.length === 0) return;
      const at = runnable.indexOf(kb);
      const pos = at < 0 ? (down ? 0 : runnable.length - 1) : Math.max(0, Math.min(runnable.length - 1, at + (down ? 1 : -1)));
      go(runnable[pos]);
    } else if (e.key === "Enter" || e.key === " ") {
      // The menu holds these keys, so neither scrolls it the browser's way, marked row or not.
      e.preventDefault();
      if (kb < 0 || rows[kb].disabled) return;
      const el = rowEl(kb);
      if (el && !shown(el)) { reveal(el); return; }
      onAction(rows[kb].id);
    }
  };
  let n = -1;
  return (
    <div onClick={onClose} onContextMenu={(e) => { e.preventDefault(); onClose(); }}
      style={{ position: "absolute", inset: 0, zIndex: 55 }}>
      {/* MenuItem draws every row state, keyboard-active included; the menu only drops the focus ring the fill replaces */}
      <style>{`.tasty-toolsmenu-item:focus-visible,.tasty-toolsmenu:focus-visible{outline:none}`}</style>
      <div ref={menuRef} tabIndex={-1} className="tasty-toolsmenu tasty-scroll" onKeyDown={onKeyDown} onClick={(e) => e.stopPropagation()} role="menu" aria-label="Tools"
        style={{ position: "absolute", left: place ? place.left : anchor.left, top: place ? place.top : 0,
          visibility: place ? "visible" : "hidden", maxHeight: place ? place.maxHeight : undefined,
          overflowY: place ? "auto" : undefined, boxSizing: "border-box", width: place ? place.width : 160,
          background: "var(--tasty-menu-bg)", border: "var(--tasty-border-width) solid var(--tasty-menu-border)",
          borderRadius: "var(--tasty-menu-radius)", padding: "var(--tasty-popup-content-margin)",
          boxShadow: "var(--tasty-shadow-popover)" }}>
        {items.map((item, k) => {
          if (!item) return <MenuItem key={"sep" + k} separator />;
          const i = ++n;
          return (
            <MenuItem key={item.id} label={item.label} active={i === kb} disabled={!!item.disabled} tabIndex={-1}
              onClick={() => { if (!item.disabled) onAction(item.id); }} onBlur={() => setKb((v) => (v === i ? -1 : v))}
              data-row={i} className="tasty-toolsmenu-item" />
          );
        })}
      </div>
    </div>
  );
}

export { ToolsMenu, placeToolsMenu };

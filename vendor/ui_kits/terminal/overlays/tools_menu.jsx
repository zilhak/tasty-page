import React from "react";
import { MenuItem } from "../../../components/navigation/MenuItem.jsx";
import { gt } from "./graph_copy.js";

// Tasty UI kit — tools menu popup (sidebar "Tools" button).
// Mirrors zilhak/tasty → src/adapters/ui/tools_menu.rs (+ sidebar/tools.rs anchor math).
//   PopupDef: id "tools_menu", 160px wide, headless, close_on_outside_click.


// ── Tools menu — mirrors src/adapters/ui/tools_menu.rs ──────────────────
// 160px popup anchored ABOVE the sidebar Tools button, left-aligned with it
// (pos = btn.min.x, btn.min.y - menu_height). 28px rows, no icons, no scrim.
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

// Keys, as the app's tools_menu popup: it opens with the keys (focus_on_open) but no row focused, and its rows are
// egui click widgets, which Tab and Shift+Tab, Up and Down move focus between and Enter or Space press (egui
// memory and context). So the menu takes focus when it opens and no row is marked; Down or Tab then goes to the first
// row and Up or Shift+Tab to the last, each next press moves one row and stops at the ends, Enter or Space runs the
// row, and Esc closes the menu. The row the keys are on draws MenuItem's keyboard-active state (surface-active, the
// contract's keyboard-active row) and no ring; the pointer only tints, as before. The keys stay in the menu until it
// closes.
function ToolsMenu({ anchor, onClose, onAction }) {
  React.useEffect(() => {
    const h = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);
  const items = [...TOOLS_BUILTIN, null, ...TOOLS_PLUGIN];
  const rows = items.filter(Boolean);
  const menuRef = React.useRef(null);
  const [kb, setKb] = React.useState(-1);
  React.useEffect(() => { if (menuRef.current) menuRef.current.focus({ preventScroll: true }); }, []);
  const go = (i) => { setKb(i); const el = menuRef.current && menuRef.current.querySelector(`[data-row="${i}"]`); if (el) el.focus({ preventScroll: true }); };
  const onKeyDown = (e) => {
    const last = rows.length - 1;
    const down = e.key === "ArrowDown" || (e.key === "Tab" && !e.shiftKey);
    const up = e.key === "ArrowUp" || (e.key === "Tab" && e.shiftKey);
    if (down || up) {
      e.preventDefault();
      go(kb < 0 ? (down ? 0 : last) : Math.max(0, Math.min(last, kb + (down ? 1 : -1))));
    } else if ((e.key === "Enter" || e.key === " ") && kb >= 0) {
      e.preventDefault();
      onAction(rows[kb].id);
    }
  };
  let n = -1;
  return (
    <div onClick={onClose} onContextMenu={(e) => { e.preventDefault(); onClose(); }}
      style={{ position: "absolute", inset: 0, zIndex: 55 }}>
      <style>{`.tasty-toolsmenu-item{color:var(--tasty-menu-item-fg)}
.tasty-toolsmenu-item:hover{color:var(--tasty-menu-item-fg-hover)}
.tasty-toolsmenu-item:focus-visible,.tasty-toolsmenu:focus-visible{outline:none}`}</style>
      <div ref={menuRef} tabIndex={-1} className="tasty-toolsmenu" onKeyDown={onKeyDown} onClick={(e) => e.stopPropagation()} role="menu" aria-label="Tools"
        style={{ position: "absolute", left: anchor.left,
          bottom: window.innerHeight - anchor.top + 2, width: 160,
          background: "var(--tasty-menu-bg)", border: "var(--tasty-border-width) solid var(--tasty-menu-border)",
          borderRadius: "var(--tasty-menu-radius)", padding: "var(--tasty-popup-content-margin)",
          boxShadow: "var(--tasty-shadow-popover)" }}>
        {items.map((item, k) => {
          if (!item) return <MenuItem key={"sep" + k} separator />;
          const i = ++n;
          return (
            <MenuItem key={item.id} label={item.label} active={i === kb} tabIndex={-1}
              onClick={() => onAction(item.id)} onBlur={() => setKb((v) => (v === i ? -1 : v))}
              data-row={i} style={{ color: undefined }} className="tasty-toolsmenu-item" />
          );
        })}
      </div>
    </div>
  );
}

export { ToolsMenu };

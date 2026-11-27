import React from "react";
import { Kbd } from "../../../components/core/Kbd.jsx";
import { Input } from "../../../components/forms/Input.jsx";
import { MenuItem } from "../../../components/navigation/MenuItem.jsx";
import { ic, Icon } from "../chrome.jsx";
import { Scrim } from "./shared.jsx";

// Tasty UI kit — command palette popup (⌘K / Ctrl+K, also Tools › Command palette…).
// Mirrors zilhak/tasty → src/adapters/ui/popup/command_palette.rs
//   Popup: id "command_palette", CenteredFocused, sticky_focus.
//   Size = --tasty-palette-width (540) wide; list CONTENT cap = --tasty-palette-list-max-height (320, on-scale);
//   the list box adds space-sm top + bottom, so its border-box maxHeight = 320 + 2 × space-sm (2026-10-06).
//   List padding space-sm on all four sides — no separate list↔footer gap (the host's 6 is retired). Search padding space-md is canonical. Source now matches:
//   defs.rs:136 = 540×360 and command_palette.rs:154 list ScrollArea
//   max_height 320 — reconcile complete.
//
// ICON SCOPE (design canonical): commands are generated dynamically from ~47
// binding fields in the real app. Only the 6 commands that map to a real
// binding field carry a SPECIFIC icon (new workspace / new terminal / new
// markdown / split pane / clipboard history / settings); every other dynamic
// command falls back to `ic.command`. The 2 rows here without a binding field
// (Toggle Theme / Listening ports…) are ILLUSTRATIVE only
// — they won't appear in the live palette; they show intended iconography.



// fallback glyph for any command without a specific icon (the ~41 other fields)
const icCommand = <Icon name="command" />;

// The layout effect runs only in the browser; a server render (the gallery's static frames) takes the plain effect.
const useBeforePaint = typeof window === "undefined" ? React.useEffect : React.useLayoutEffect;

const PALETTE_COMMANDS = [
  { label: "New Workspace", sc: "Ctrl+Shift+N", icon: ic.plus, bound: true },
  { label: "New Terminal", sc: "Ctrl+T", icon: ic.term, bound: true },
  { label: "New Markdown…", sc: "Ctrl+Shift+M", icon: ic.md, bound: true },
  { label: "Split Pane Vertical", sc: "Ctrl+D", icon: ic.split, bound: true },
  { label: "Clipboard History", sc: "Ctrl+Shift+V", icon: <Icon name="copy" />, bound: true },
  { label: "Settings", sc: "Ctrl+,", icon: ic.settings, bound: true },
  // illustrative-only (no binding field — not in the live palette):
  { label: "Toggle Theme (Mocha / Latte)", sc: "", icon: <Icon name="theme" />, bound: false },
  { label: "Listening ports…", sc: "", icon: <Icon name="port" />, bound: false },
  // example of a dynamic command with no specific icon → fallback glyph:
  { label: "Toggle Clipboard Viewer", sc: "", icon: icCommand, bound: true },
];

// The card alone, so the gallery can set it in a room of a chosen height (ScrimRoom) and show the same layout.
// Keys, as the app's (command_palette.rs draw_command_palette_view): the search field holds them; Down and Up move the
// selection one row, stopping at the ends, and Enter runs the selected row. Each query change puts the selection back
// on the first match, and it never runs past the last one. A row is highlighted only while the query has text, so with
// an empty query every row is drawn, the selected one with no highlight, the arrows move that selection and Enter runs
// it. The pointer tints the row under it and a click runs that row; neither moves the selection. commands: the rows
// ({ label, sc, icon }), the kit's illustrative list unless a host passes its own (the gallery's short-screen frame
// passes the app's first rows).
// The list keeps the selected row in view: each time the selection moves, the list scrolls the least that shows the
// whole row, and each query change shows the list from its top, where the first match is. The wheel scrolls the rows
// and never moves the selection, so the selected row can end up scrolled out of view. Enter on a selected row with no
// part in view runs nothing: the list scrolls the least that shows the whole row, as a selection move does, and the
// next Enter runs it. A selected row with some part in view runs at once. So Enter never runs a row the list hides,
// and a press is never lost. Only a new press of Enter acts: the repeats of a held Enter are taken and do nothing, so
// holding the Enter that revealed a row does not run it, and the next press looks at the selection and the view again.
// The arrows repeat as before. All of this holds with an empty query too, where the selected row has no highlight but
// Enter runs it.
// initialSelected: the row selected at open (a gallery frame freezes a moved selection with it; the app opens on 0).
function PaletteCard({ query = "", onQuery, onRun, autoFocus = false, commands = PALETTE_COMMANDS, initialSelected = 0 }) {
  const items = commands.filter((i) => i.label.toLowerCase().includes(query.toLowerCase()));
  const [sel, setSel] = React.useState(initialSelected);
  const selected = Math.min(sel, Math.max(items.length - 1, 0));
  const listRef = React.useRef(null);
  const selectedRow = () => {
    const list = listRef.current;
    return list && list.querySelector(`[data-palette-row="${selected}"]`);
  };
  // Scroll the list the least that shows the whole row. The list's own padding is part of what is shown around the
  // first and last rows.
  const reveal = (row) => {
    const list = listRef.current;
    const pad = parseFloat(getComputedStyle(list).paddingTop) || 0;
    const top = row.offsetTop - pad;
    const bottom = row.offsetTop + row.offsetHeight + pad;
    if (top < list.scrollTop) list.scrollTop = top;
    else if (bottom > list.scrollTop + list.clientHeight) list.scrollTop = bottom - list.clientHeight;
  };
  // Some part of the row lies inside the list's scrolled view.
  const shown = (row) => {
    const list = listRef.current;
    return row.offsetTop < list.scrollTop + list.clientHeight && row.offsetTop + row.offsetHeight > list.scrollTop;
  };
  useBeforePaint(() => {
    const row = selectedRow();
    if (row) reveal(row);
  }, [selected, query]);
  // The physical keys (e.code) the search field saw pressed, each until its release or until the field loses the focus.
  // A character key whose repeats reach the field without its press, such as the Space that ran Tools › Command
  // palette… and is still held, is taken until it is released, so it types nothing; a new press of it types as usual.
  // A key pressed here repeats whatever it types, so Shift+A and then A held after Shift is released types Aaaa.
  const pressed = React.useRef(new Set());
  const keyId = (e) => e.code || e.key;
  const onKeyDown = (e) => {
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      if (!e.repeat) pressed.current.add(keyId(e));
      else if (!pressed.current.has(keyId(e))) { e.preventDefault(); return; }
    }
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (items.length) setSel(e.key === "ArrowDown" ? Math.min(selected + 1, items.length - 1) : Math.max(selected - 1, 0));
    } else if (e.key === "Enter" && !e.nativeEvent.isComposing) {
      e.preventDefault();
      // A held Enter's repeats are taken and do nothing: only a new press runs or reveals.
      if (e.repeat || !items[selected]) return;
      const row = selectedRow();
      if (row && !shown(row)) { reveal(row); return; }
      if (onRun) onRun(items[selected].label);
    }
  };
  return (
    /* A column, as the app lays the card out (command_palette.rs): search, then the footer's height reserved at the
       bottom, then the list takes what is left, at least one row, and scrolls inside. When the screen cuts the card
       (the scrim room's max-height, as clamp_to_screen) the list shrinks first and the footer stays whole. */
    <div style={{ width: "var(--tasty-palette-width)", display: "flex", flexDirection: "column", background: "var(--tasty-surface-raised)", border: "var(--tasty-border-width) solid var(--tasty-border-frame)",
      borderRadius: "var(--tasty-radius)", overflow: "hidden", boxShadow: "var(--tasty-shadow-modal)" }}>
      <div style={{ flex: "none", padding: "var(--tasty-space-md)", borderBottom: "var(--tasty-border-width) solid var(--tasty-border-strong)" }}>
        <Input block ground="raised" autoFocus={autoFocus} icon={ic.search} placeholder="Type to search commands…"
          value={query} onKeyDown={onKeyDown} onKeyUp={(e) => pressed.current.delete(keyId(e))} onBlur={() => pressed.current.clear()} onChange={(e) => { setSel(0); onQuery && onQuery(e.target.value); }} />
      </div>
      <div ref={listRef} className="tasty-scroll" style={{ flex: "0 1 auto", position: "relative", padding: "var(--tasty-space-sm)", maxHeight: "calc(1 * var(--tasty-palette-list-max-height) + 2 * var(--tasty-space-sm))",
        minHeight: "calc(1 * var(--tasty-menu-item-height) + 2 * var(--tasty-space-sm))", overflow: "auto" }}>
        {/* as the app's empty list (command_palette.rs): one label inside the list's space-sm padding with none of its own,
            text-muted-raised on the raised card and slanted as a note for absent content */}
        {items.length === 0 && <div style={{ fontSize: "var(--tasty-font-size-body)", fontStyle: "var(--tasty-font-style-absent)", color: "var(--tasty-text-muted-raised)" }}>No matching commands</div>}
        {/* each row sits in its own box, the unit the selection scrolls into view (and a gallery contract cell holds) */}
        {items.map((i, n) => (
          <div key={i.label} data-palette-row={n}>
            <MenuItem label={i.label} icon={i.icon}
              shortcut={i.sc ? <Kbd keys={i.sc} /> : null} active={n === selected && query !== ""}
              onClick={() => onRun && onRun(i.label)} />
          </div>
        ))}
      </div>
      {/* the app's footer: padding space-sm × space-md, hints in label_font at font_size_caption, PALETTE_HINT_GAP_X apart */}
      <div style={{ flex: "none", display: "flex", gap: "var(--tasty-palette-hint-gap)", padding: "var(--tasty-space-sm) var(--tasty-space-md)", borderTop: "var(--tasty-border-width) solid var(--tasty-border-strong)",
        fontFamily: "var(--tasty-font-label)", fontSize: "var(--tasty-font-size-caption)", color: "var(--tasty-text-muted-raised)" }}>
        <span>↑↓ navigate</span><span>↵ run</span><span>esc close</span>
      </div>
    </div>
  );
}

function CommandPalette({ onClose, onRun }) {
  const [q, setQ] = React.useState("");
  return (
    <Scrim onClose={onClose} align="top">
      <PaletteCard query={q} onQuery={setQ} onRun={onRun} autoFocus />
    </Scrim>
  );
}

export { CommandPalette, PaletteCard };

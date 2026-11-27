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
function PaletteCard({ query = "", onQuery, onRun, autoFocus = false }) {
  const items = PALETTE_COMMANDS.filter((i) => i.label.toLowerCase().includes(query.toLowerCase()));
  return (
    /* A column, as the app lays the card out (command_palette.rs): search, then the footer's height reserved at the
       bottom, then the list takes what is left, at least one row, and scrolls inside. When the screen cuts the card
       (the scrim room's max-height, as clamp_to_screen) the list shrinks first and the footer stays whole. */
    <div style={{ width: "var(--tasty-palette-width)", display: "flex", flexDirection: "column", background: "var(--tasty-surface-raised)", border: "var(--tasty-border-width) solid var(--tasty-border-frame)",
      borderRadius: "var(--tasty-radius)", overflow: "hidden", boxShadow: "var(--tasty-shadow-modal)" }}>
      <div style={{ flex: "none", padding: "var(--tasty-space-md)", borderBottom: "var(--tasty-border-width) solid var(--tasty-border-strong)" }}>
        <Input block ground="raised" autoFocus={autoFocus} icon={ic.search} placeholder="Type to search commands…"
          value={query} onChange={(e) => onQuery && onQuery(e.target.value)} />
      </div>
      <div className="tasty-scroll" style={{ flex: "0 1 auto", padding: "var(--tasty-space-sm)", maxHeight: "calc(1 * var(--tasty-palette-list-max-height) + 2 * var(--tasty-space-sm))",
        minHeight: "calc(1 * var(--tasty-menu-item-height) + 2 * var(--tasty-space-sm))", overflow: "auto" }}>
        {items.length === 0 && <div style={{ padding: 14, fontSize: 13, color: "var(--tasty-text-muted)" }}>No matching commands</div>}
        {items.map((i, n) => (
          <MenuItem key={i.label} label={i.label} icon={i.icon}
            shortcut={i.sc ? <Kbd keys={i.sc} /> : null} active={n === 0 && query !== ""}
            onClick={() => onRun && onRun(i.label)} />
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

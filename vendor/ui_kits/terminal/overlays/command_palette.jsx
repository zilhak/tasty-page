import React from "react";
import { Kbd } from "../../../components/core/Kbd.jsx";
import { Input } from "../../../components/forms/Input.jsx";
import { MenuItem } from "../../../components/navigation/MenuItem.jsx";
import { Tooltip } from "../../../components/feedback/Tooltip.jsx";
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
// initialSelected: the row selected at open (a gallery frame freezes a moved selection with it; the app opens on the
// first row that can run).
// Rows that cannot run, as the app's (a plugin command that needs a target surface, while the command has none, the
// same test as the Tools menu's): a command with unavailable set, or, as the Tools menu's hostRuns, one whose label is
// not in hostRuns (the labels the host's onRun runs; without hostRuns every row runs). Such a row stays in the list in
// its place, drawn as a MenuItem disabled: disabled ink, no hover fill and no keyboard-active fill, since disabled
// outranks every other state. It is never selected. The selection, the arrows and Enter count only the rows that can
// run: the selection at open and after each query change is the first match that can run, the arrows stop at the first
// and the last of them, and with no match that can run nothing is selected, nothing is highlighted and Enter does
// nothing. A click on such a row runs nothing and the palette stays open. Each query change shows the list from its
// top, so a match that cannot run above the selection is seen, and then the least scroll that shows the selected row.
// The pointer resting on such a row for the tooltip delay opens its reason (reason, here the copy key
// command_palette.unavailable_no_surface) as the shared Tooltip beside the card, level with the row: right of the card
// when the bubble's max width fits there in the room the card sits in, else left if it fits there. When it fits on
// neither side (the card fills its room, as on a narrow screen) it opens over the card, centred on it: below the row
// when the row sits in the upper half of the list, above it otherwise. It closes when the pointer leaves the row, the
// list scrolls, the query changes, the window is resized, or the row leaves the list, can run or changes its reason; a
// bubble that would cross the room's edge is shifted the least that keeps it whole (its left and top edges first when
// it cannot fit), and in a room narrower than its max width it takes the room's width and wraps. A row the host leaves
// out of hostRuns and that carries no reason opens none. Pressing such a row keeps the focus in the search field, so
// the keys go on working. The keyboard selection stays where it was. The held-key rules above are unchanged: a key
// whose press the field did not see types nothing, and an Enter that ends an IME composition runs nothing.
function PaletteCard({ query = "", onQuery, onRun, autoFocus = false, commands = PALETTE_COMMANDS, initialSelected = 0, hostRuns = null }) {
  const can = (c) => !c.unavailable && (!hostRuns || hostRuns.includes(c.label));
  const items = commands.filter((i) => i.label.toLowerCase().includes(query.toLowerCase())).map((i) => (can(i) ? i : { ...i, unavailable: true }));
  const runnable = items.map((r, n) => (r.unavailable ? -1 : n)).filter((n) => n >= 0);
  // The row a selection index lands on: itself if it can run, else the next row that can, else the last one before it.
  const land = (n) => runnable.find((r) => r >= n) ?? (runnable.length ? runnable[runnable.length - 1] : -1);
  // The selection belongs to the query it was made under: initialSelected for the query at open, then each move. A new
  // query, typed or passed in, starts again from row 0, which lands on its first row that can run.
  const [selAt, setSelAt] = React.useState({ query, n: initialSelected });
  const setSel = (n) => setSelAt({ query, n });
  const sel = selAt.query === query ? selAt.n : 0;
  const selected = land(Math.min(sel, Math.max(items.length - 1, 0)));
  const listRef = React.useRef(null);
  const wrapRef = React.useRef(null);
  // tip: the reason showing, for the row (by label) the pointer rests on; fit: the shift that keeps its bubble inside
  // the room.
  const [tip, setTip] = React.useState(null);
  const [fit, setFit] = React.useState({ dx: 0, dy: 0 });
  const tipTimer = React.useRef(null);
  const lastQuery = React.useRef(query);
  const itemsNow = React.useRef(items);
  itemsNow.current = items;
  // pending: the row (label and reason) whose reason waits for the tooltip delay.
  const pending = React.useRef(null);
  const closeTip = () => { clearTimeout(tipTimer.current); tipTimer.current = null; pending.current = null; setTip(null); setFit({ dx: 0, dy: 0 }); };
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
    if (lastQuery.current !== query) {
      lastQuery.current = query;
      // The new query keeps its own start, so typing back an earlier query does not bring back its old selection.
      if (selAt.query !== query) setSelAt({ query, n: 0 });
      if (listRef.current) listRef.current.scrollTop = 0;
      closeTip();
    }
    const row = selectedRow();
    if (row) reveal(row);
  }, [selected, query]);
  // The reason of a row that cannot run, after the pointer has rested on it for the tooltip delay.
  const readMs = (name, fallback) => {
    const v = getComputedStyle(wrapRef.current).getPropertyValue(name).trim();
    const n = parseFloat(v);
    return Number.isFinite(n) ? (v.endsWith("ms") ? n : v.endsWith("s") ? n * 1000 : n) : fallback;
  };
  const readPx = (name, fallback) => {
    const n = parseFloat(getComputedStyle(wrapRef.current).getPropertyValue(name));
    return Number.isFinite(n) ? n : fallback;
  };
  React.useEffect(() => () => clearTimeout(tipTimer.current), []);
  // A resized window moves the room under the bubble: the reason closes, and the next rest of the pointer opens it.
  React.useEffect(() => {
    window.addEventListener("resize", closeTip);
    return () => window.removeEventListener("resize", closeTip);
  }, []);
  // The reason belongs to its row: it closes when that row leaves the list, can run, or changes its reason.
  const stillOff = (label, reason) => itemsNow.current.some((i) => i.label === label && i.unavailable && i.reason === reason);
  React.useEffect(() => {
    const p = pending.current;
    if ((tip && !stillOff(tip.label, tip.reason)) || (p && !stillOff(p.label, p.reason))) closeTip();
  });
  const openTip = (label, reason) => {
    closeTip();
    if (!reason) return;
    pending.current = { label, reason };
    tipTimer.current = setTimeout(() => {
      tipTimer.current = null;
      pending.current = null;
      const wrap = wrapRef.current;
      const list = listRef.current;
      const n = itemsNow.current.findIndex((i) => i.label === label);
      const row = list && n >= 0 && list.querySelector(`[data-palette-row="${n}"]`);
      if (!wrap || !row || !stillOff(label, reason)) return;
      const top = list.offsetTop + row.offsetTop - list.scrollTop;
      const r = wrap.getBoundingClientRect();
      const roomBox = wrap.parentElement ? wrap.parentElement.getBoundingClientRect() : { left: 0, right: window.innerWidth };
      const need = readPx("--tasty-tooltip-max-width", 240) + readPx("--tasty-tooltip-offset", 4);
      const roomRight = roomBox.right - r.right;
      const roomLeft = r.left - roomBox.left;
      // Beside the card when the bubble's max width fits on a side; otherwise (the card fills its room) over the card,
      // centred on it, below the row when the row sits in the upper half of the list and above it otherwise.
      if (roomRight >= need || roomLeft >= need) {
        setTip({ label, reason, y: top + row.offsetHeight / 2, side: roomRight >= need ? "right" : "left" });
      } else {
        const upper = row.offsetTop - list.scrollTop + row.offsetHeight / 2 <= list.clientHeight / 2;
        setTip({ label, reason, y: upper ? top + row.offsetHeight : top, side: upper ? "bottom" : "top" });
      }
    }, readMs("--tasty-tooltip-delay", 150));
  };
  // Once drawn, the bubble is kept whole inside the room (the box the card sits in, or the window): shifted the least
  // along each axis, its side and its direction kept.
  const tipRef = React.useRef(null);
  useBeforePaint(() => {
    const anchor = tipRef.current;
    const wrap = wrapRef.current;
    if (!tip || !anchor || !wrap) return;
    const bubble = anchor.querySelector(".tasty-tooltip__bubble");
    if (!bubble) return;
    const room = wrap.parentElement ? wrap.parentElement.getBoundingClientRect() : { left: 0, top: 0, right: window.innerWidth, bottom: window.innerHeight };
    // A room narrower than the bubble's max width narrows the bubble to the room, and its text wraps.
    const roomW = Math.floor(room.right - room.left);
    if (roomW < readPx("--tasty-tooltip-max-width", 240) && anchor.style.getPropertyValue("--tasty-tooltip-max-width") !== `${roomW}px`) {
      anchor.style.setProperty("--tasty-tooltip-max-width", `${roomW}px`);
    }
    const b = bubble.getBoundingClientRect();
    const x0 = b.left - fit.dx, y0 = b.top - fit.dy;
    const dx = Math.max(room.left - x0, Math.min(0, room.right - (x0 + b.width)));
    const dy = Math.max(room.top - y0, Math.min(0, room.bottom - (y0 + b.height)));
    if (dx !== fit.dx || dy !== fit.dy) setFit({ dx, dy });
  }, [tip, fit]);
  // The physical keys (e.code) the search field saw pressed, each until its release or until the field loses the focus.
  // A character key whose repeats reach the field without its press, such as the Space that ran Tools › Command
  // palette… and is still held, is taken until it is released, so it types nothing; a new press of it types as usual.
  // A key pressed here repeats whatever it types, so Shift+A and then A held after Shift is released types Aaaa. Every
  // press the field sees counts, with a modifier or without, so Ctrl+A and then A held after Ctrl is released types aaa.
  const pressed = React.useRef(new Set());
  const keyId = (e) => e.code || e.key;
  const onKeyDown = (e) => {
    if (!e.repeat) pressed.current.add(keyId(e));
    else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey && !pressed.current.has(keyId(e))) { e.preventDefault(); return; }
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      // Only the rows that can run count: each press moves to the next or the previous one and stops at the ends.
      const at = runnable.indexOf(selected);
      if (at >= 0) setSel(runnable[e.key === "ArrowDown" ? Math.min(at + 1, runnable.length - 1) : Math.max(at - 1, 0)]);
    } else if (e.key === "Enter" && !e.nativeEvent.isComposing) {
      e.preventDefault();
      // A held Enter's repeats are taken and do nothing: only a new press runs or reveals. With no row that can run
      // there is no selection, and Enter does nothing.
      if (e.repeat || selected < 0 || !items[selected]) return;
      const row = selectedRow();
      if (row && !shown(row)) { reveal(row); return; }
      if (onRun) onRun(items[selected].label);
    }
  };
  return (
    /* The box the reason tooltip is placed in: the card's own size, a column like the card, so the room's max-height
       (as clamp_to_screen) reaches the card through it. */
    <div ref={wrapRef} style={{ position: "relative", width: "var(--tasty-palette-width)", display: "flex", flexDirection: "column" }}>
    {/* A column, as the app lays the card out (command_palette.rs): search, then the footer's height reserved at the
       bottom, then the list takes what is left, at least one row, and scrolls inside. When the screen cuts the card
       (the scrim room's max-height, as clamp_to_screen) the list shrinks first and the footer stays whole. */}
    <div style={{ width: "100%", minHeight: 0, flex: "0 1 auto", display: "flex", flexDirection: "column", background: "var(--tasty-surface-raised)", border: "var(--tasty-border-width) solid var(--tasty-border-frame)",
      borderRadius: "var(--tasty-radius)", overflow: "hidden", boxShadow: "var(--tasty-shadow-modal)" }}>
      <div style={{ flex: "none", padding: "var(--tasty-space-md)", borderBottom: "var(--tasty-border-width) solid var(--tasty-border-strong)" }}>
        <Input block ground="raised" autoFocus={autoFocus} icon={ic.search} placeholder="Type to search commands…"
          value={query} onKeyDown={onKeyDown} onKeyUp={(e) => pressed.current.delete(keyId(e))} onBlur={() => pressed.current.clear()} onChange={(e) => { onQuery && onQuery(e.target.value); }} />
      </div>
      <div ref={listRef} className="tasty-scroll" onScroll={closeTip} style={{ flex: "0 1 auto", position: "relative", padding: "var(--tasty-space-sm)", maxHeight: "calc(1 * var(--tasty-palette-list-max-height) + 2 * var(--tasty-space-sm))",
        minHeight: "calc(1 * var(--tasty-menu-item-height) + 2 * var(--tasty-space-sm))", overflow: "auto" }}>
        {/* as the app's empty list (command_palette.rs): one label inside the list's space-sm padding with none of its own,
            text-muted-raised on the raised card and slanted as a note for absent content */}
        {items.length === 0 && <div style={{ fontSize: "var(--tasty-font-size-body)", fontStyle: "var(--tasty-font-style-absent)", color: "var(--tasty-text-muted-raised)" }}>No matching commands</div>}
        {/* each row sits in its own box, the unit the selection scrolls into view (and a gallery contract cell holds) */}
        {/* a row that cannot run takes no pointer (MenuItem disabled), so its box hears the pointer for the reason */}
        {items.map((i, n) => (
          <div key={i.label} data-palette-row={n}
            onMouseEnter={i.unavailable ? () => openTip(i.label, i.reason) : undefined} onMouseLeave={i.unavailable ? closeTip : undefined}
            onMouseDown={i.unavailable ? (e) => e.preventDefault() : undefined}>
            <MenuItem label={i.label} icon={i.icon} disabled={!!i.unavailable}
              shortcut={i.sc ? <Kbd keys={i.sc} /> : null} active={n === selected && query !== ""}
              onClick={i.unavailable ? undefined : () => onRun && onRun(i.label)} />
          </div>
        ))}
      </div>
      {/* the app's footer: padding space-sm × space-md, hints in label_font at font_size_caption, PALETTE_HINT_GAP_X apart */}
      <div style={{ flex: "none", display: "flex", gap: "var(--tasty-palette-hint-gap)", padding: "var(--tasty-space-sm) var(--tasty-space-md)", borderTop: "var(--tasty-border-width) solid var(--tasty-border-strong)",
        fontFamily: "var(--tasty-font-label)", fontSize: "var(--tasty-font-size-caption)", color: "var(--tasty-text-muted-raised)" }}>
        <span>↑↓ navigate</span><span>↵ run</span><span>esc close</span>
      </div>
    </div>
    {tip && (
      <span ref={tipRef} style={{ position: "absolute", top: tip.y, transform: `translate(${fit.dx}px, ${fit.dy}px)`, ...(tip.side === "right" ? { left: "100%" } : tip.side === "left" ? { right: "100%" } : { left: "50%" }) }}>
        <Tooltip open placement={tip.side} content={tip.reason}><span style={{ display: "block", width: 0, height: 0 }} /></Tooltip>
      </span>
    )}
    </div>
  );
}

// hostRuns: as PaletteCard's, the labels the host's onRun runs; the others draw as rows that cannot run.
function CommandPalette({ onClose, onRun, commands, hostRuns = null }) {
  const [q, setQ] = React.useState("");
  return (
    <Scrim onClose={onClose} align="top">
      <PaletteCard query={q} onQuery={setQ} onRun={onRun} autoFocus commands={commands} hostRuns={hostRuns} />
    </Scrim>
  );
}

export { CommandPalette, PaletteCard };

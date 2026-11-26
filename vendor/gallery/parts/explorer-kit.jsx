import React from "react";
import { Icon, IconButton, AutoComplete, Button, Input, Spinner, TreeRow } from "../../components/index.js";
import { GIcon } from "./specimen.jsx";

const ic = {
  folder: <GIcon d={<path d="M4 20h16a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1h-7l-2-2H4a1 1 0 0 0-1 1v13a1 1 0 0 0 1 1z" />} />,
  file: <GIcon d={<><path d="M14 3v4a1 1 0 0 0 1 1h4" /><path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z" /></>} />,
  x: <GIcon d={<path d="M18 6 6 18M6 6l12 12" />} size={12} />,
  plus: <GIcon d={<path d="M12 5v14M5 12h14" />} />,
  back: <GIcon d={<path d="m15 18-6-6 6-6" />} />,
  fwd: <GIcon d={<path d="m9 18 6-6-6-6" />} />,
  up: <GIcon d={<path d="M12 19V5M5 12l7-7 7 7" />} />,
  refresh: <GIcon d={<path d="M21 12a9 9 0 1 1-2.6-6.4M21 3v6h-6" />} />,
  grid: <GIcon d={<><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>} />,
  list: <GIcon d={<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />} />,
  detail: <GIcon d={<path d="M3 5h18M3 12h18M3 19h18M3 5v14" />} />,
  star: <GIcon d={<path d="m12 3 2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 18l-5.8 3 1.1-6.5L2.6 9.8l6.5-.9z" />} />,
  image: <GIcon d={<><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-5-5L5 21" /></>} />,
  copy: <GIcon d={<><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h8" /></>} />,
  scissors: <GIcon d={<><circle cx="6" cy="6" r="3" /><circle cx="6" cy="18" r="3" /><path d="M20 4 8.1 15.9M14.5 12.5 20 20M8.1 8.1 12 12" /></>} />,
  paste: <GIcon d={<><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><rect x="8" y="2" width="8" height="4" rx="1" /></>} />,
  trash: <GIcon d={<path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />} />,
  rename: <GIcon d={<path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z" />} />,
  external: <GIcon d={<path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />} />,
  link: <GIcon d={<path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1.5 1.5M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1.5-1.5" />} />,
  lock: <GIcon d={<><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></>} />,
  folderOpen: <GIcon d={<path d="M3 8a1 1 0 0 1 1-1h5l2 2h7a1 1 0 0 1 1 1v1H3z M3 11h18l-1.5 8a1 1 0 0 1-1 1H5.5a1 1 0 0 1-1-1z" />} />,
  globe: <GIcon d={<><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" /></>} />,
  alert: <GIcon d={<><circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16h.01" /></>} />,
};

// ════════════════════════════════════════════════════════════
//  SHARED — editable path field (Explorer + Markdown address bars)
// ════════════════════════════════════════════════════════════
// One component both surfaces share. Display: mono path (ellipsis, secondary)
// behind a per-surface leading icon, trailing Go (arrow-right). Click → edit
// (focus ring + caret, text-primary); ↵/Go navigate, Esc reverts. Field tokens
// align to forms/Input (--tasty-input-*). The ONLY per-surface parameter is the
// leading `icon` (Explorer=folderOpen, Markdown=file); the outer bar is not part
// of this component. Real-side home: crates/tasty-ui-widgets (Input + IconPainter).
const goGlyph = <GIcon d={<path d="M5 12h14M13 6l6 6-6 6" />} />;
function PathField({ icon, path, editing = false, candidates = null, open = false, activeIndex = 0, query, maxDropdownHeight = 220 }) {
  // Editing WITH candidates → the shared AutoComplete dropdown (typeahead of
  // recent paths). Same trigger tokens as the idle field below; Explorer feeds
  // recent directories, Markdown recent files. The component emits the path.
  if (editing && candidates) {
    return (
      <AutoComplete block mono withGo icon={icon} rowIcon={icon}
        open={open} activeIndex={activeIndex} query={query != null ? query : path}
        items={candidates} maxDropdownHeight={maxDropdownHeight} emptyLabel="No matching path" />
    );
  }
  return (
    <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 6 }}>
      <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 6, height: 28, padding: "0 8px",
        background: "var(--tasty-input-bg)", borderRadius: "var(--tasty-radius)",
        border: "1px solid " + (editing ? "var(--tasty-input-border-focus)" : "var(--tasty-input-border)"),
        boxShadow: editing ? "0 0 0 var(--tasty-border-width) var(--tasty-input-border-focus)" : "none" }}>
        <span style={{ display: "inline-flex", flex: "none", color: "var(--tasty-input-icon-fg)" }}>{icon}</span>
        <span style={{ flex: 1, minWidth: 0, fontFamily: "var(--tasty-font-mono)", fontSize: 12,
          color: editing ? "var(--tasty-text-primary)" : "var(--tasty-text-secondary)",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {path}
          {editing && <span style={{ display: "inline-block", width: 1, height: 13, background: "var(--tasty-accent-primary)", marginLeft: 1, verticalAlign: "text-bottom", animation: "tasty-blink 1.1s step-end infinite" }} />}
        </span>
      </div>
      <IconButton size="sm" aria-label="Go">{goGlyph}</IconButton>
    </div>
  );
}

// Explorer view toggle — a SEGMENT (picks a value: how the same listing is drawn), so it
// takes the R1 segment recipe: accent fill + on-accent ink. Never surface-active (row-selection only).
function SegToggle({ value = "detail", hover = null }) {
  const items = [["grid", ic.grid], ["list", ic.list], ["detail", ic.detail]];
  return (
    <div style={{ display: "flex", alignItems: "center", flex: "none", height: 28, padding: "var(--tasty-space-xs)", gap: "var(--tasty-space-xs)", boxSizing: "border-box",
      background: "var(--tasty-surface-raised)", border: "1px solid var(--tasty-border-strong)", borderRadius: "var(--tasty-radius)" }}>
      {items.map(([k, glyph]) => {
        const active = k === value;
        const hov = k === hover && !active;
        return (
          <span key={k} aria-label={k} title={k} style={{ width: "var(--tasty-size-24)", height: "var(--tasty-size-20)", display: "inline-flex", alignItems: "center", justifyContent: "center",
            borderRadius: "var(--tasty-radius-sm)", color: active ? "var(--tasty-segtoggle-on-fg)" : "var(--tasty-text-muted)",
            background: active ? "var(--tasty-segtoggle-on-bg)" : hov ? "var(--tasty-overlay-hover)" : "transparent" }}>{glyph}</span>
        );
      })}
    </div>
  );
}

// The sidebar rows follow the app's explorer sidebar. Caption (sidebar_caption): space-xs above and below, the label
// space-sm in, micro caps in text-muted. Tree and favorite rows are the app's tree_row, so they are the shared TreeRow
// (components/navigation/TreeRow): its height, indent, chevron slot (kept empty on a leaf and on a favorite), glyph
// slot, inks, selected fill and label ellipsis. The rows stack with no gap and no side inset, as the app's sidebar
// sets item spacing y to 0.

function SideHead({ children, trailing }) {
  return (
    <div style={{ display: "flex", alignItems: "center", padding: "var(--tasty-space-xs) var(--tasty-space-sm)" }}>
      <span style={{ flex: 1, fontFamily: "var(--tasty-font-label)", fontSize: "var(--tasty-font-size-micro)", textTransform: "uppercase", letterSpacing: "var(--tasty-letter-spacing-caps-wide)", color: "var(--tasty-text-muted)" }}>{children}</span>
      {trailing}
    </div>
  );
}

// Each row passes its glyph's ink with the glyph, as the app's explorer paints its own folder and star (RULES section 7,
// Meaning). The folder is a shape glyph: TreeRow's icon ink at rest and the row ink (text-on-active) on the selected
// row, where TreeRow's own icon ink would be the selection-mark accent.
function TreeNode({ label, depth = 0, open, leaf, active }) {
  const folder = active ? <span style={{ display: "inline-flex", color: "var(--tasty-text-on-active)" }}><Icon name="folder" /></span> : <Icon name="folder" />;
  return <TreeRow label={label} level={depth} expandable={!leaf} open={!!open} selected={!!active} icon={folder} />;
}

// The favorite star is a hue glyph: accent-warning-glyph on the sidebar and accent-warning-on-active on the selected
// row, which holds 3:1 under hover and press.
function FavRow({ name, active }) {
  const star = active ? "var(--tasty-accent-warning-on-active)" : "var(--tasty-accent-warning-glyph)";
  return <TreeRow label={name} selected={!!active} icon={<span style={{ display: "inline-flex", color: star }}><Icon name="starFill" /></span>} />;
}

// Detail columns, one track list for the header and every row, as the app's Detail table draws them. Size, Date
// modified and Type are fixed (the app's table is not resizable). Name takes what is left and stops at
// explorer-detail-name-col-min-width (140); a narrower pane clips the table on the right, with no horizontal
// scroll. Header labels and row names still end in an ellipsis inside their cell.
const DETAIL_COLUMNS = "minmax(0, 1fr) var(--tasty-explorer-detail-size-col-width) var(--tasty-explorer-detail-date-col-width) var(--tasty-explorer-detail-type-col-width)";
// The Name floor is held by the line's width, not by the track: the grid is never narrower than the four columns
// at their floor (plus the side inset). A width with a percentage counts as auto when an ancestor sizes to its
// content, so the floor never widens the pane, a card or a stage around the table: they keep the width the table's
// content gives them. DetailLine wraps each grid in a box that takes the pane's width and clips the overflow
// on the right only (overflow-x clip), so a focus ring inside a row still shows above and below. A row name
// still ends in an ellipsis at that clip edge (DetailName).
const DETAIL_MIN_WIDTH = "calc(var(--tasty-explorer-detail-name-col-min-width) + var(--tasty-explorer-detail-size-col-width) + var(--tasty-explorer-detail-date-col-width) + var(--tasty-explorer-detail-type-col-width) + 2 * var(--tasty-explorer-detail-padding-x))";
const DetailClip = React.createContext(null);
function DetailLine({ style, children }) {
  const clip = React.useRef(null);
  return (
    <div ref={clip} style={{ minWidth: 0, overflowX: "clip" }}>
      <DetailClip.Provider value={clip}>
        <div style={{ display: "grid", gridTemplateColumns: DETAIL_COLUMNS, width: `max(100%, ${DETAIL_MIN_WIDTH})`, alignItems: "center", height: "var(--tasty-table-cell-height)", padding: "0 var(--tasty-explorer-detail-padding-x)", ...style }}>{children}</div>
      </DetailClip.Provider>
    </div>
  );
}
// A row name ends in an ellipsis at whichever comes first: its Name cell's end or the line's clip edge. The app
// measures the room the same way, from the name's left to the table's clip end (explorer detail_view, room =
// clip right - cursor left). A narrow pane hides the Name cell's end, so without this the name was cut at the
// pane edge with no ellipsis. Only a name that crosses the clip edge gets a max width; nothing else moves.
function DetailName({ style, children }) {
  const clip = React.useContext(DetailClip);
  const ref = React.useRef(null);
  React.useEffect(() => {
    const el = ref.current;
    const box = clip && clip.current;
    if (!el || !box) return undefined;
    const fit = () => {
      el.style.maxWidth = "";
      const edge = box.getBoundingClientRect().right;
      const r = el.getBoundingClientRect();
      if (r.right > edge + 0.5) el.style.maxWidth = `${Math.max(0, edge - r.left)}px`;
    };
    fit();
    if (typeof ResizeObserver === "undefined") return undefined;
    const ro = new ResizeObserver(fit);
    ro.observe(box);
    return () => ro.disconnect();
  }, [clip]);
  return <span ref={ref} style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", ...style }}>{children}</span>;
}

function DetailRow({ glyph, name, size, date, type, state, glyphColor }) {
  const bg = state === "selected" ? "var(--tasty-surface-active)" : state === "hover" ? "var(--tasty-overlay-hover)" : "transparent";
  return (
    <DetailLine style={{ fontSize: 13, background: bg, cursor: "default",
      color: state === "selected" ? "var(--tasty-text-on-active)" : state === "cut" ? "var(--tasty-cut-pending-fg)" : "var(--tasty-text-secondary)" }}>
      <span style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
        <span style={{ display: "inline-flex", flex: "none", color: state === "selected" ? "var(--tasty-text-on-active)" : glyphColor || "var(--tasty-text-secondary)" }}>{glyph}</span>
        <DetailName style={{ fontStyle: state === "cut" ? "var(--tasty-cut-pending-font-style)" : undefined }}>{name}</DetailName>
      </span>
      <span style={{ fontFamily: "var(--tasty-font-mono)", fontSize: 11, color: state === "selected" ? "var(--tasty-text-on-active)" : "var(--tasty-text-muted)", textAlign: "right", paddingRight: 8 }}>{size}</span>
      <span style={{ fontFamily: "var(--tasty-font-mono)", fontSize: 11, color: state === "selected" ? "var(--tasty-text-on-active)" : "var(--tasty-text-muted)" }}>{date}</span>
      <span style={{ fontSize: 12, color: state === "selected" ? "var(--tasty-text-on-active)" : "var(--tasty-text-muted)" }}>{type}</span>
    </DetailLine>
  );
}

function DetailHeader() {
  const cols = [["Name", true], ["Size", false], ["Date modified", false], ["Type", false]];
  return (
    <DetailLine style={{ background: "var(--tasty-table-header-bg)", borderBottom: "1px solid var(--tasty-separator)",
      fontFamily: "var(--tasty-font-ui)", fontSize: "var(--tasty-table-header-font-size)", fontWeight: "var(--tasty-table-header-font-weight)", textTransform: "uppercase", letterSpacing: "var(--tasty-table-header-tracking)", color: "var(--tasty-table-header-fg)" }}>
      {cols.map(([c, sorted], i) => (
        <span key={c} style={{ display: "flex", alignItems: "center", gap: 3, justifyContent: i === 1 ? "flex-end" : "flex-start", minWidth: 0, overflow: "hidden",
          paddingRight: i === 1 ? 8 : 0, color: sorted ? "var(--tasty-text-secondary)" : "var(--tasty-text-muted)" }}>
          <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c}</span>{sorted && <span style={{ flex: "none", fontSize: 9 }}>▲</span>}
        </span>
      ))}
    </DetailLine>
  );
}

// GridCell — icon-view file cell. Design SoT for the Rust grid_cell().
//   icon   : icon_glyph_size_md (16), down from item_height_interactive (28)
//   label  : font_size_caption (11), 3-line wrap-to-width + '…' overflow (LayoutJob
//            wrap.max_rows=3 · overflow_character='…' on the real side)
//   width  : CELL_W = 80 (unchanged)
//   height : FIXED 3-line — the label reserves 3 lines always, so short names keep
//            grid rows uniform (stable horizontal_wrapped alignment). Label is
//            top-aligned within the reserved block.
//   gaps   : spacing_sm (8) top/bottom · spacing_xs (4) icon→label
const GRID_CELL_W = "var(--tasty-explorer-grid-cell-width)";
const GRID_LABEL_LINES = 3;
const GRID_LABEL_LINE_H = "var(--tasty-explorer-grid-label-line-height)"; // round(font_size_caption 11 × 1.3)
function GridCell({ glyph, name, state, glyphColor }) {
  const bg = state === "selected" ? "var(--tasty-surface-active)" : state === "hover" ? "var(--tasty-overlay-hover)" : "transparent";
  return (
    <div style={{ width: GRID_CELL_W, display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--tasty-space-xs)", padding: "var(--tasty-space-sm) var(--tasty-space-xs)",
      borderRadius: "var(--tasty-radius)", background: bg, cursor: "default" }}>
      <span style={{ display: "inline-flex", color: state === "selected" ? "var(--tasty-text-on-active)" : glyphColor || "var(--tasty-text-secondary)", height: 16, alignItems: "center" }}>{glyph}</span>
      <span style={{ fontSize: "var(--tasty-font-size-caption)", textAlign: "center", lineHeight: GRID_LABEL_LINE_H, height: `calc(${GRID_LABEL_LINES} * ${GRID_LABEL_LINE_H})`,
        color: state === "selected" ? "var(--tasty-text-on-active)" : state === "cut" ? "var(--tasty-cut-pending-fg)" : "var(--tasty-text-secondary)", fontStyle: state === "cut" ? "var(--tasty-cut-pending-font-style)" : undefined, wordBreak: "break-word",
        display: "-webkit-box", WebkitLineClamp: GRID_LABEL_LINES, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{name}</span>
    </div>
  );
}

function CtxMenu({ title, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div className="g-cap" style={{ fontSize: 11, color: "var(--tasty-text-muted)" }}>{title}</div>
      <div style={{ width: 220, background: "var(--tasty-menu-bg)", border: "1px solid var(--tasty-menu-border)",
        borderRadius: "var(--tasty-menu-radius)", padding: 6, boxShadow: "var(--tasty-shadow-popover)" }}>
        {children}
      </div>
    </div>
  );
}

// 2026-10-07 batch 4 — compact: content body under --tasty-explorer-state-compact-below (120) → one row:
// glyph (unscaled 16) · title (ellipsis; reason / sub move to its tooltip) · actions. Retry / Go up stay.
function ExpState({ glyph, glyphColor, title, sub, reason, actions, compact, bodyHeight, bg }) {
  // b11 (image-too-large-title-tone): refused-by-limit states colour only the glyph; the title is text-primary.
  const titleFg = glyphColor === "var(--tasty-image-too-large-fg)" ? "var(--tasty-text-primary)" : glyphColor === "var(--tasty-accent-warning-raised)" || glyphColor === "var(--tasty-explorer-error-fg)" || glyphColor === "var(--tasty-image-error-fg)" ? glyphColor : "var(--tasty-text-secondary)";
  if (compact) return (
    <div style={{ flex: 1, minWidth: 0, height: bodyHeight || 62, display: "flex", alignItems: "center", justifyContent: "center", boxSizing: "border-box",
      background: bg || "var(--tasty-bg-panel)", border: "1px solid var(--tasty-separator)", borderRadius: "var(--tasty-radius)", padding: "0 var(--tasty-space-sm)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "var(--tasty-space-sm)", minWidth: 0, maxWidth: "100%" }}>
        <span style={{ display: "inline-flex", flex: "none", color: glyphColor || "var(--tasty-text-muted)" }}>{glyph}</span>
        <span title={reason || sub} style={{ minWidth: 0, fontSize: 13, color: titleFg, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</span>
        {actions && <div style={{ display: "flex", flex: "none", gap: "var(--tasty-space-xs)" }}>{actions}</div>}
      </div>
    </div>
  );
  return (
    <div style={{ flex: 1, minWidth: 0, height: 180, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8,
      background: bg || "var(--tasty-bg-panel)", border: "1px solid var(--tasty-separator)", borderRadius: "var(--tasty-radius)", textAlign: "center", padding: 16 }}>
      <span style={{ display: "inline-flex", color: glyphColor || "var(--tasty-text-muted)", transform: "scale(1.6)" }}>{glyph}</span>
      <div style={{ fontSize: 13, color: titleFg, textWrap: "balance" }}>{title}</div>
      {sub && <div style={{ fontSize: 11, color: "var(--tasty-text-muted)", maxWidth: 200, textWrap: "balance" }}>{sub}</div>}
      {reason && <div style={{ fontFamily: "var(--tasty-font-mono)", fontSize: "var(--tasty-font-size-caption)", color: "var(--tasty-text-muted)", maxWidth: 200, overflowWrap: "anywhere" }}>{reason}</div>}
      {actions && <div style={{ display: "flex", gap: "var(--tasty-space-sm)", marginTop: "var(--tasty-space-xs)" }}>{actions}</div>}
    </div>
  );
}

// Explorer Rename popup, shared by Plugin surfaces and Explorer file ops. It has the app's parts and no
// others: title (explorer.popup.rename.title), the field, a validation line under the field when the
// pre-check refuses the name (explorer.name.empty / invalid_char / edge_space / reserved,
// explorer-name-error-fg) with Rename disabled until the name passes, one line slot, Cancel (button.cancel) + Rename
// (explorer.popup.rename.rename). The confirm is the popup's own verb, not button.save (Save / 저장): a button
// names what it does, and the popup renames, it does not save a file. Words are quoted from tasty lang/*.toml in every language. The slot holds
// the remote waiting line (Spinner + explorer.remote.renaming, passed in as waitingText) and stays empty,
// at the same height, while idle, so nothing moves when the popup starts waiting. No hint line and no path
// line: the app draws neither (explorer.popup.rename.path is in the catalog but unused).
const EXPLORER_RENAME_COPY = {
  en: { title: "Rename", cancel: "Cancel", rename: "Rename" },
  ko: { title: "이름 변경", cancel: "취소", rename: "이름 변경" },
  ja: { title: "名前を変更", cancel: "キャンセル", rename: "名前を変更" },
  "zh-Hans": { title: "重命名", cancel: "取消", rename: "重命名" },
};
function ExplorerRenamePopup({ lang = "en", value, error = null, waitingText = null }) {
  const t = EXPLORER_RENAME_COPY[lang] || EXPLORER_RENAME_COPY.en;
  const waiting = waitingText != null;
  return (
    <div lang={lang} style={{ width: "var(--tasty-size-360)", maxWidth: "100%", background: "var(--tasty-dialog-bg)", border: "var(--tasty-border-width) solid var(--tasty-border-frame)", borderRadius: "var(--tasty-radius)", boxShadow: "var(--tasty-shadow-modal)", padding: "var(--tasty-space-md) var(--tasty-explorer-props-padding-x)", display: "flex", flexDirection: "column", gap: "var(--tasty-space-sm)" }}>
      <span style={{ fontSize: "var(--tasty-font-size-max)", fontWeight: "var(--tasty-font-weight-semibold)", color: "var(--tasty-text-primary)" }}>{t.title}</span>
      <Input block readOnly={waiting} invalid={!!error} defaultValue={value} />
      {error && <span role="alert" style={{ fontSize: "var(--tasty-font-size-caption)", color: "var(--tasty-explorer-name-error-fg)" }}>{error}</span>}
      <span style={{ display: "flex", alignItems: "center", gap: "var(--tasty-space-sm)", minHeight: "var(--tasty-icon-size-sm)", fontSize: "var(--tasty-font-size-caption)", color: "var(--tasty-text-muted)" }}>{waiting && <><Spinner size="var(--tasty-icon-size-sm)" />{waitingText}</>}</span>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--tasty-space-sm)" }}><Button variant="ghost" size="sm" disabled={waiting}>{t.cancel}</Button><Button variant="primary" size="sm" disabled={waiting || !!error}>{t.rename}</Button></div>
    </div>
  );
}
export { DetailHeader, DetailLine, DETAIL_COLUMNS, ic, DetailRow, SegToggle, CtxMenu, PathField, GridCell, SideHead, TreeNode, FavRow, ExpState, ExplorerRenamePopup, EXPLORER_RENAME_COPY };

import React from "react";
import { Icon } from "../../../components/core/Icon.jsx";
import { TreeRow } from "../../../components/navigation/TreeRow.jsx";
import { StatusDot } from "../../../components/feedback/StatusDot.jsx";
import { gt } from "./graph_copy.js";

// Tasty UI kit — the child graph surface's base surface picker (user decision R-51 14, 2026-11-10).
// Closed it is the Select trigger (28, field-width-lg). Open it is the SearchableSelect shell (menu popover,
// filter field, separator, scrolling list) holding a tree shaped like the sidebar, across EVERY window:
//
//   window ─ category (sidebar folder) ─ workspace ─ pane ─ tab ─ surface
//
// Source of the levels (tasty, read only): one engine per window holds that window's workspace categories and
// workspaces (docs/architecture/multi-window.md, crates/tasty-model/src/workspace_category.rs); a window closed
// while its sessions run is a parked engine. PaneGroup / SurfaceGroup are split layouts, not containers
// (docs/concepts/ubiquitous-language.md), so they fold away: panes and surfaces list in layout order.
//
// Rows reuse the sidebar's look: the category is the sidebar category band (caps label, count, hairlines),
// the workspace is the sidebar row's status dot + name (remote glyph and host on a mirror); window, pane, tab
// and surface are TreeRow, the sidebar / explorer tree row. Only a surface row picks.
//
// Folding (recommended; the alternative `allLevels` draws every level):
//   - category level only when workspace categories are on; the reserved one reads "Workspaces"; empty ones hide.
//   - pane level only when the workspace has two or more panes.
//   - a tab holding one surface is one row: tab title, the surface's glyph, the surface id as meta.
// Windows: numbered in open order (Window 1, 2, …), the graph's own window marked This window; with one window in the
// app the window level is left out (Q15, tasty recommendation 14-2, awaiting the user).
// Open state: windows and categories open; the path to the current base open and its row selected; the rest closed.
// Filter: surface name, surface id or workspace name; matches show with their path open; none → no_match.

const SURF = (id, name, over) => ({ id, name, ...over });
const ONE = (title, s) => ({ title, surfaces: [s] });

// Mock tree. Ids match the child graph mocks so a pick shows a graph. Windows in open order (Q15, tasty
// recommendation 14-2): Window 1, Window 2, …; the one the graph is in says "This window" wherever it falls.
const PICKER_WINDOWS = [
  { id: "w1", n: 1, categories: [
    { id: 0, reserved: true, workspaces: [
      { id: "ws-notes", name: "notes", status: "idle", panes: [{ tabs: [ONE("zsh", SURF("s_n1", "zsh"))] }] },
    ] },
  ] },
  { id: "w2", n: 2, current: true, categories: [
    { id: 0, reserved: true, workspaces: [
      { id: "ws-tasty", name: "tasty", status: "agent", panes: [
        { tabs: [ONE("conductor", SURF("s_01HX4K", "conductor")), { title: "builder", surfaces: [SURF("s_01HX7Q", "builder"), SURF("s_01HX9A", "test-runner")] }] },
        { tabs: [ONE("reviewer", SURF("s_01HXB2", "reviewer")), ONE("zsh", SURF("s_01HXC0", "zsh"))] },
      ] },
      { id: "ws-page", name: "tasty-page", status: "agent", panes: [
        { tabs: [ONE("conductor-page", SURF("s_c2", "conductor-page")), { title: "copy", surfaces: [SURF("s_w21", "copy-en"), SURF("s_w22", "copy-ko")] }, ONE("designer", SURF("s_w23", "designer"))] },
      ] },
    ] },
    { id: 2, name: "Labs", workspaces: [
      { id: "ws-lab", name: "lab-main", status: "agent", host: "lab-linux", panes: [
        { tabs: [ONE("conductor", SURF("s_m1", "conductor", { remote: true })), { title: "worker-a", surfaces: [SURF("s_m2", "worker-a", { remote: true }), SURF("s_m4", "checker", { remote: true })] }] },
      ] },
    ] },
  ] },
  { id: "p1", n: 1, closed: true, categories: [
    { id: 0, reserved: true, workspaces: [
      { id: "ws-nightly", name: "nightly", status: "running", panes: [{ tabs: [ONE("nightly-build", SURF("s_q1", "nightly-build"))] }] },
    ] },
  ] },
];

function surfacesOf(windows) {
  const out = [];
  windows.forEach((w) => w.categories.forEach((c) => c.workspaces.forEach((ws) => ws.panes.forEach((p) => p.tabs.forEach((t) =>
    t.surfaces.forEach((s) => out.push({ ...s, ws, w })))))));
  return out;
}

// Flatten the tree into rows: { key, kind, level, ... }. `open` is a Set of keys; `match` a Set of surface ids or null.
function rowsOf(windows, { open, match, categoriesOn, allLevels, sel, lang }) {
  const rows = [];
  const keep = (s) => !match || match.has(s.id);
  const wsHas = (ws) => ws.panes.some((p) => p.tabs.some((t) => t.surfaces.some(keep)));
  const isOpen = (k) => (match ? true : open.has(k));
  const shown = windows.filter((w) => w.categories.some((c) => c.workspaces.some(wsHas)));
  const oneWindow = windows.length === 1; // one window in the app: no window level (Q15, recommendation 14-2)
  const wo = oneWindow ? 0 : 1;
  shown.forEach((w) => {
    const cats = w.categories.filter((c) => c.workspaces.some(wsHas));
    const wk = w.id;
    if (!oneWindow) rows.push({ key: wk, kind: "window", level: 0, w, open: isOpen(wk) });
    if (!oneWindow && !isOpen(wk)) return;
    cats.forEach((c) => {
      const band = categoriesOn;
      const ck = `${wk}/c${c.id}`;
      const wss = c.workspaces.filter(wsHas);
      if (band) rows.push({ key: ck, kind: "category", level: wo, c, count: wss.length, open: isOpen(ck) });
      if (band && !isOpen(ck)) return;
      const wl = wo + (band ? 1 : 0);
      wss.forEach((ws) => {
        const wsk = `${ck}/${ws.id}`;
        rows.push({ key: wsk, kind: "workspace", level: wl, ws, open: isOpen(wsk) });
        if (!isOpen(wsk)) return;
        const panes = ws.panes.filter((p) => p.tabs.some((t) => t.surfaces.some(keep)));
        const paneRows = allLevels || panes.length > 1;
        panes.forEach((p, pi) => {
          const pk = `${wsk}/p${pi}`;
          if (paneRows) rows.push({ key: pk, kind: "pane", level: wl + 1, n: ws.panes.indexOf(p) + 1, open: isOpen(pk) });
          if (paneRows && !isOpen(pk)) return;
          const tl = wl + (paneRows ? 2 : 1);
          p.tabs.filter((t) => t.surfaces.some(keep)).forEach((t, ti) => {
            const tk = `${pk}/t${ti}`;
            const ss = t.surfaces.filter(keep);
            if (!allLevels && t.surfaces.length === 1) { rows.push({ key: tk, kind: "surface", level: tl, s: ss[0], ws, w, label: t.title }); return; }
            rows.push({ key: tk, kind: "tab", level: tl, t, open: isOpen(tk) });
            if (!isOpen(tk)) return;
            ss.forEach((s) => rows.push({ key: `${tk}/${s.id}`, kind: "surface", level: tl + 1, s, ws, w, label: s.name }));
          });
        });
      });
    });
  });
  return rows;
}

// keys on the path to a surface, so the base opens in view
function pathKeys(windows, id, categoriesOn) {
  const keys = new Set(windows.map((w) => w.id));
  windows.forEach((w) => w.categories.forEach((c) => {
    keys.add(`${w.id}/c${c.id}`);
    c.workspaces.forEach((ws) => ws.panes.forEach((p, pi) => p.tabs.forEach((t, ti) => {
      if (t.surfaces.some((s) => s.id === id)) {
        const wsk = `${w.id}/c${c.id}/${ws.id}`;
        keys.add(wsk); keys.add(`${wsk}/p${pi}`); keys.add(`${wsk}/p${pi}/t${ti}`);
      }
    })));
  }));
  return keys;
}

const muted = { fontFamily: "var(--tasty-font-ui)", fontSize: "var(--tasty-tree-row-meta-font-size)", color: "var(--tasty-text-muted)" };

// The sidebar category band, sized for the tree (header tokens, caps label, count right).
function CategoryBand({ label, count, open, level, onToggle }) {
  return (
    <div role="button" aria-expanded={open} onClick={onToggle}
      style={{ display: "flex", alignItems: "center", gap: "var(--tasty-space-xs)", cursor: "pointer", boxSizing: "border-box",
        height: "var(--tasty-control-height-tree)", margin: "var(--tasty-space-xs) 0",
        paddingLeft: `calc(var(--tasty-space-xs) + ${level} * var(--tasty-tree-row-indent))`, paddingRight: "var(--tasty-space-sm)",
        background: "var(--tasty-sidebar-category-header-bg)",
        borderTop: "var(--tasty-border-width) solid var(--tasty-sidebar-category-header-border)",
        borderBottom: "var(--tasty-border-width) solid var(--tasty-sidebar-category-header-border)" }}>
      <span style={{ display: "inline-flex", flex: "none", width: "var(--tasty-icon-size-sm)", justifyContent: "center", color: "var(--tasty-sidebar-category-header-fg)",
        transform: open ? "rotate(90deg)" : "none", transition: "transform var(--tasty-motion-ui-fast) var(--tasty-ease-ui)" }}>
        <Icon name="chevronRight" size="var(--tasty-icon-size-xs)" />
      </span>
      <span style={{ flex: 1, minWidth: 0, fontFamily: "var(--tasty-font-label)", fontSize: "var(--tasty-sidebar-section-heading-font-size)", textTransform: "uppercase",
        letterSpacing: "var(--tasty-sidebar-section-heading-tracking)", color: "var(--tasty-sidebar-category-header-fg)", fontWeight: "var(--tasty-sidebar-category-header-weight)",
        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>
      <span aria-hidden style={{ flex: "none", fontFamily: "var(--tasty-font-mono)", fontSize: "var(--tasty-sidebar-category-header-count-font-size)", color: "var(--tasty-sidebar-category-header-count-fg)" }}>{count}</span>
    </div>
  );
}

function PickerTree({ windows = PICKER_WINDOWS, value, onPick, query = "", categoriesOn = true, allLevels = false, lang = "en", initialOpen }) {
  const [open, setOpen] = React.useState(() => initialOpen || pathKeys(windows, value, categoriesOn));
  const q = query.trim().toLowerCase();
  const match = q ? new Set(surfacesOf(windows).filter((s) => [s.name, s.id, s.ws.name].some((v) => String(v).toLowerCase().includes(q))).map((s) => s.id)) : null;
  const rows = rowsOf(windows, { open, match, categoriesOn, allLevels, lang });
  const toggle = (k) => setOpen((o) => { const n = new Set(o); n.has(k) ? n.delete(k) : n.add(k); return n; });
  if (match && !match.size) return <div style={{ ...muted, fontSize: "var(--tasty-select-font-size)", padding: "0 var(--tasty-menu-item-padding-x)", height: "var(--tasty-menu-item-height)", display: "flex", alignItems: "center" }}>{gt("child_graph.picker.no_match", lang)}</div>;
  return (
    <div role="tree" style={{ display: "flex", flexDirection: "column" }}>
      {rows.map((r) => {
        if (r.kind === "category") return <CategoryBand key={r.key} level={r.level} open={r.open} count={r.count} label={r.c.reserved ? "Workspaces" : r.c.name} onToggle={() => toggle(r.key)} />;
        if (r.kind === "window") {
          return <TreeRow key={r.key} role="treeitem" aria-expanded={r.open} level={r.level} expandable open={r.open} onClick={() => toggle(r.key)}
            icon={<Icon name="layoutGrid" />} label={r.w.closed ? gt("child_graph.picker.closed_window", lang, r.w.n) : gt("child_graph.picker.window", lang, r.w.n)}
            meta={r.w.current ? <span style={muted}>{gt("child_graph.picker.this_window", lang)}</span> : null} />;
        }
        if (r.kind === "workspace") {
          return <TreeRow key={r.key} role="treeitem" aria-expanded={r.open} level={r.level} expandable open={r.open} onClick={() => toggle(r.key)}
            icon={<StatusDot status={r.ws.status} />} label={<span style={{ fontWeight: "var(--tasty-font-weight-medium)" }}>{r.ws.name}</span>}
            meta={r.ws.host ? <span style={{ display: "inline-flex", alignItems: "center", gap: "var(--tasty-space-xs)", color: "var(--tasty-accent-remote-raised)" }}><Icon name="remote" size="var(--tasty-icon-size-xs)" />{r.ws.host}</span> : null} />;
        }
        if (r.kind === "pane") return <TreeRow key={r.key} role="treeitem" aria-expanded={r.open} level={r.level} expandable open={r.open} onClick={() => toggle(r.key)} icon={<Icon name="columns" />} label={gt("child_graph.picker.pane", lang, r.n)} />;
        if (r.kind === "tab") return <TreeRow key={r.key} role="treeitem" aria-expanded={r.open} level={r.level} expandable open={r.open} onClick={() => toggle(r.key)} icon={<Icon name="layoutDetail" />} label={r.t.title} />;
        const picked = r.s.id === value;
        return <TreeRow key={r.key} role="treeitem" aria-selected={picked} level={r.level} selected={picked} onClick={() => onPick && onPick(r.s)}
          icon={<span style={{ display: "inline-flex", color: r.s.remote && !picked ? "var(--tasty-accent-remote-raised)" : undefined }}><Icon name={r.s.remote ? "remote" : "terminal"} /></span>}
          label={r.label} meta={r.s.id.slice(0, 8)} title={`${r.ws.name} / ${r.s.name} · ${r.s.id}`} />;
      })}
    </div>
  );
}

// Trigger + popover. `open` / `query` make it a still specimen; `inline` draws the popover in flow (gallery).
// open alone pins the popover (gallery frames); open with onOpenChange is a controlled picker that the
// trigger, an outside click, Esc and a pick still open and close (the surface opens it from its canvas too).
function BasePicker({ windows = PICKER_WINDOWS, value, onChange, lang = "en", block = false, open: openP, onOpenChange, query: queryP, inline = false,
  categoriesOn = true, allLevels = false, style }) {
  const [openS, setOpenS] = React.useState(false);
  const [queryS, setQueryS] = React.useState("");
  const rootRef = React.useRef(null);
  const open = openP !== undefined ? openP : openS;
  const query = queryP !== undefined ? queryP : queryS;
  const live = openP === undefined || !!onOpenChange;
  const setOpen = (v) => { const next = typeof v === "function" ? v(open) : v; if (onOpenChange) onOpenChange(next); else setOpenS(next); if (!next) setQueryS(""); };
  const all = surfacesOf(windows);
  const cur = all.find((s) => s.id === value);
  const disabled = all.length === 0;
  const label = disabled ? gt("child_graph.base_empty", lang) : cur ? `${cur.ws.name} / ${cur.name} · ${cur.id}` : gt("child_graph.empty.pick_base", lang);
  React.useEffect(() => {
    if (!open || !live) return;
    const h = (e) => { if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false); };
    // Esc closes the picker first; it does not reach the graph (which would clear its selection).
    const k = (e) => { if (e.key === "Escape") { e.stopPropagation(); setOpen(false); } };
    document.addEventListener("mousedown", h);
    document.addEventListener("keydown", k);
    return () => { document.removeEventListener("mousedown", h); document.removeEventListener("keydown", k); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, live]);
  const pop = open && (
    <div role="dialog" style={{ position: inline ? "relative" : "absolute", left: 0, top: inline ? "var(--tasty-select-search-menu-gap)" : "calc(100% + var(--tasty-select-search-menu-gap))", zIndex: 40,
      width: "var(--tasty-graph-base-picker-width)", maxWidth: "100vw", maxHeight: "var(--tasty-graph-base-picker-height)", boxSizing: "border-box",
      display: "flex", flexDirection: "column", background: "var(--tasty-menu-bg)", border: "var(--tasty-border-width) solid var(--tasty-menu-border)",
      borderRadius: "var(--tasty-menu-radius)", boxShadow: "var(--tasty-shadow-popover)", padding: "var(--tasty-select-search-inset)", overflow: "hidden" }}>
      <label style={{ flex: "none", display: "flex", alignItems: "center", boxSizing: "border-box", height: "var(--tasty-select-search-field-height)",
        padding: "0 var(--tasty-select-search-field-padding-x)", gap: "var(--tasty-select-search-field-gap)", background: "var(--tasty-select-search-field-bg)",
        border: "var(--tasty-border-width) solid var(--tasty-select-search-field-border-focus)", borderRadius: "var(--tasty-radius)" }}>
        <span style={{ flex: "none", display: "inline-flex", color: "var(--tasty-select-search-icon-fg)" }}><Icon name="search" size="var(--tasty-icon-size-sm)" /></span>
        <input type="text" value={query} placeholder={gt("child_graph.picker.search", lang)} aria-label={gt("child_graph.picker.search", lang)} spellCheck={false} autoComplete="off" autoFocus={live}
          readOnly={queryP !== undefined} onChange={(e) => setQueryS(e.target.value)}
          style={{ all: "unset", flex: 1, minWidth: 0, height: "100%", fontFamily: "var(--tasty-font-ui)", fontSize: "var(--tasty-select-font-size)", color: "var(--tasty-select-search-field-fg)" }} />
      </label>
      <div role="separator" style={{ flex: "none", height: "var(--tasty-border-width)", margin: "var(--tasty-space-xs) 0", background: "var(--tasty-menu-separator)" }} />
      <div className="tasty-scroll" style={{ flex: "1 1 auto", minHeight: 0, overflowY: "auto", overflowX: "hidden" }}>
        <PickerTree windows={windows} value={value} query={query} categoriesOn={categoriesOn} allLevels={allLevels} lang={lang}
          onPick={(s) => { onChange && onChange(s.id); if (live) setOpen(false); }} />
      </div>
    </div>
  );
  return (
    <div ref={rootRef} style={{ position: "relative", display: block ? "flex" : "inline-flex", flexDirection: "column", width: block ? "100%" : "var(--tasty-field-width-lg)", minWidth: 0, ...style }}>
      <button type="button" disabled={disabled} aria-haspopup="dialog" aria-expanded={!!open} onClick={() => setOpen((o) => !o)}
        {...(disabled ? { "data-ink-grade": "none", "data-ink-why": "disabled" } : {})}
        style={{ all: "unset", boxSizing: "border-box", position: "relative", display: "flex", alignItems: "center", width: "100%", height: "var(--tasty-select-height)",
          padding: "0 var(--tasty-select-chevron-room) 0 var(--tasty-select-padding-x)", borderRadius: "var(--tasty-select-radius)", cursor: disabled ? "default" : "pointer",
          border: `var(--tasty-border-width) solid ${disabled ? "var(--tasty-state-disabled-border)" : open ? "var(--tasty-select-border-focus)" : "var(--tasty-select-border)"}`,
          boxShadow: open ? "0 0 0 var(--tasty-border-width) var(--tasty-select-border-focus)" : "none",
          background: disabled ? "var(--tasty-state-disabled-fill)" : "var(--tasty-select-bg)",
          color: disabled ? "var(--tasty-state-disabled-fg)" : cur ? "var(--tasty-select-fg)" : "var(--tasty-select-search-value-placeholder)",
          fontFamily: "var(--tasty-font-ui)", fontSize: "var(--tasty-select-font-size)" }}>
        <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={label}>{label}</span>
        <span style={{ position: "absolute", right: "var(--tasty-select-chevron-offset)", top: "50%", transform: `translateY(-50%)${open ? " rotate(180deg)" : ""}`, display: "inline-flex",
          color: disabled ? "var(--tasty-state-disabled-fg)" : "var(--tasty-select-chevron-fg)" }}><Icon name="chevronDown" size="var(--tasty-icon-size-sm)" /></span>
      </button>
      {pop}
    </div>
  );
}

const PICKER_ONE_WINDOW = [{ ...PICKER_WINDOWS[1], id: "w1", n: 1 }];

export { BasePicker, PickerTree, PICKER_WINDOWS, PICKER_ONE_WINDOW, surfacesOf };

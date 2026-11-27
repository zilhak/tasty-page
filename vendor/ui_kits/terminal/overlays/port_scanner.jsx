import React from "react";
import { Button } from "../../../components/core/Button.jsx";
import { IconButton } from "../../../components/core/IconButton.jsx";
import { Tag } from "../../../components/core/Tag.jsx";
import { Table } from "../../../components/data/Table.jsx";
import { StatusDot } from "../../../components/feedback/StatusDot.jsx";
import { Checkbox } from "../../../components/forms/Checkbox.jsx";
import { Input } from "../../../components/forms/Input.jsx";
import { ic, Icon } from "../chrome.jsx";
import { Scrim, Spinner } from "./shared.jsx";

// 2026-10-06 — table metrics: header AND body rows = --tasty-table-cell-height (28, on-scale); header pad-x =
// --tasty-table-cell-padding-x (12); body scroll min height = one row (table-cell-height). No port-scanner-only sizes.
// Tasty UI kit — Listening ports popup (Tools › Listening ports...).
// Mirrors zilhak/tasty → src/adapters/ui/popup/port_scanner.rs
//   Popup: id "port_scanner", headless, close_on_outside_click.
//   Size = 660×520 (DESIGN CANONICAL — spec §1 marks this "preserve"; the 7-col
//   table needs the width). Source now matches: defs.rs:124 = 660×520.
//
// FAVORITES — resolved open decisions:
//   §6.1 frame stays 660×520. The favorites region is BOUNDED (caption 22 +
//        list capped at --tasty-port-favorites-max-height 112), so the table
//        keeps ≥ ~300px and the popup never grows.
//   §6.2 scroll starts at the 6th favorite (5 × 22px rows = 110 ≤ 112 cap).
//   §6.3 NONE reuses StatusDot status="idle" (--tasty-status-dot-idle, muted)
//        with no pulse — reads as "no connection", clearly apart from
//        LISTEN (green + pulse) and other states (yellow).
//   §6.4 zero favorites → the CAPTION STAYS (matches the Explorer sidebar
//        contract) and a single 22px muted line carries the how-to. Cost: 44px.
//   §6.5 favorites rows are SUMMARY rows, not the 7-col grid — a stopped port
//        has no proc/ws/tab data, and the summary row never needs the table's
//        horizontal scroll. Stars + first text column still align with the
//        table (28px star col + 12px cell padding in both).
//   §6.6 star toggle is LEADING — a tight 28px column before Port, no header
//        label. Adds 28px to the min-width budget; the existing horizontal
//        scroll policy absorbs it.
// 2026-10-08 — Process floor (--tasty-port-process-col-min-width) via Table minWidth; fixed widths are floors.
//        Column budget > 660, so the table body scrolls horizontally at the default size (accepted).



// ── Listening ports — system ports popup, built on the Table component ──
// ws/tab name the Tasty workspace + tab that opened the port; null = an
// external/system process (shown only when "Show all" is on, dashed in-table).
const PORTS = [
  { port: 22,    proto: "tcp",  addr: "0.0.0.0",   proc: "sshd",         pid: 712,   state: "LISTEN",     ws: null,        tab: null },
  { port: 3000,  proto: "tcp",  addr: "127.0.0.1", proc: "node",         pid: 48213, state: "LISTEN",     ws: "Project A", tab: "server" },
  { port: 5173,  proto: "tcp",  addr: "127.0.0.1", proc: "vite",         pid: 48990, state: "LISTEN",     ws: "Project A", tab: "dev" },
  { port: 5432,  proto: "tcp",  addr: "127.0.0.1", proc: "postgres",     pid: 1192,  state: "LISTEN",     ws: null,        tab: null },
  { port: 6379,  proto: "tcp",  addr: "127.0.0.1", proc: "redis-server", pid: 1456,  state: "LISTEN",     ws: null,        tab: null },
  { port: 8080,  proto: "tcp",  addr: "0.0.0.0",   proc: "tasty-agent",  pid: 50321, state: "LISTEN",     ws: "Project B", tab: "agent" },
  { port: 8443,  proto: "tcp6", addr: "::",        proc: "tasty-agent",  pid: 50321, state: "LISTEN",     ws: "Project B", tab: "agent" },
  { port: 9229,  proto: "tcp",  addr: "127.0.0.1", proc: "node",         pid: 48213, state: "CLOSE_WAIT", ws: "Project A", tab: "server" },
  { port: 11434, proto: "tcp",  addr: "127.0.0.1", proc: "ollama",       pid: 3920,  state: "LISTEN",     ws: null,        tab: null },
  { port: 50051, proto: "tcp",  addr: "127.0.0.1", proc: "tasty-host",   pid: 50019, state: "LISTEN",     ws: null,        tab: null },
];

// Favorite identity is (addr, port) — never the PID (it changes per restart).
const favKey = (p) => `${p.addr}:${p.port}`;
const parseFav = (k) => { const i = k.lastIndexOf(":"); return { addr: k.slice(0, i), port: Number(k.slice(i + 1)) }; };

// Default demo set: a Tasty-owned port, a system-owned one (proves the section
// ignores the scope toggle), and one that is not running at all → NONE.
const FAVS_DEFAULT = ["127.0.0.1:5173", "0.0.0.0:8080", "127.0.0.1:5432", "127.0.0.1:9999"];
// Built from PORTS via favKey so demo keys can't drift from the scan data
// (and the IPv6 "::" host keeps its own colons: ":::8443").
const FAVS_MANY = [...FAVS_DEFAULT,
  ...PORTS.filter((p) => [3000, 6379, 11434, 8443].includes(p.port)).map(favKey)];

const Dash = () => <span style={{ color: "var(--tasty-text-muted)" }}>—</span>;

// ── Star toggle — 22×22, gold when registered, muted outline when not ──
// The one WRITING control in this otherwise read-only popup. No confirm step:
// click = immediate register / unregister. Hover/active are the derived
// overlay tokens only.
function PortStar({ on, onToggle, label }) {
  const [hot, setHot] = React.useState(false);
  return (
    <button type="button" aria-label={label} aria-pressed={on} title={label}
      onClick={(e) => { e.stopPropagation(); onToggle(); }}
      onMouseEnter={() => setHot(true)} onMouseLeave={() => setHot(false)}
      style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", flex: "none",
        width: "var(--tasty-control-height-tree)", height: "var(--tasty-control-height-tree)", padding: 0,
        border: "var(--tasty-border-width) solid transparent", borderRadius: "var(--tasty-radius-sm)", cursor: "pointer",
        background: hot ? "var(--tasty-overlay-hover)" : "transparent",
        color: on ? "var(--tasty-port-star-on)" : "var(--tasty-port-star-off)",
        transition: "background var(--tasty-motion-ui-fast) var(--tasty-ease-ui), color var(--tasty-motion-ui-fast) var(--tasty-ease-ui)" }}>
      <Icon name={on ? "starFill" : "star"} size="var(--tasty-icon-size-sm)" />
    </button>
  );
}

// ── Favorites section — always full, never filtered ──────────────────
// Independent of the search box, the scope checkbox and any sort: a favorite
// is judged against the FULL system scan, so a port favorited outside Tasty
// still reads LISTEN while the table is scoped to Tasty.
function FavoritesSection({ favs, onToggle }) {
  const rows = favs.map((k) => {
    const { addr, port } = parseFav(k);
    const hit = PORTS.find((p) => p.addr === addr && p.port === port) || null;
    return { key: k, addr, port, hit };
  });
  return (
    <div style={{ flex: "none", background: "var(--tasty-port-favorites-bg)",
      borderBottom: "var(--tasty-border-width) solid var(--tasty-port-favorites-border)" }}>
      {/* caption — persists at zero favorites so the feature stays discoverable */}
      <div style={{ display: "flex", alignItems: "center", gap: "var(--tasty-space-sm)",
        height: "var(--tasty-control-height-tree)", padding: "0 var(--tasty-ports-pad-x)" }}>
        <span style={{ fontFamily: "var(--tasty-font-label)", fontSize: "var(--tasty-font-size-micro)",
          textTransform: "uppercase", letterSpacing: "var(--tasty-letter-spacing-caps)", color: "var(--tasty-text-muted)" }}>
          Favorites{favs.length > 0 && ` · ${favs.length}`}
        </span>
        <div style={{ flex: 1 }} />
        <span style={{ fontFamily: "var(--tasty-font-label)", fontSize: "var(--tasty-font-size-micro)", color: "var(--tasty-text-placeholder)" }}>
          system-wide
        </span>
      </div>
      {rows.length === 0 ? (
        <div style={{ display: "flex", alignItems: "center", gap: "var(--tasty-space-xs)",
          height: "var(--tasty-control-height-tree)", padding: "0 var(--tasty-ports-pad-x)", color: "var(--tasty-text-muted)" }}>
          {/* the empty line's star recedes as glyph-dim ink, an opaque role, with no opacity on top */}
          <span style={{ display: "inline-flex", flex: "none", color: "var(--tasty-glyph-dim)" }}><Icon name="star" size="var(--tasty-icon-size-sm)" /></span>
          {/* one muted italic label on one line, as the app draws [port_scanner] favorites_empty; a narrow window ends it in an ellipsis */}
          <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: "var(--tasty-font-size-caption)", fontStyle: "var(--tasty-font-style-absent)" }}>No favorites yet — click a star in the list below to pin a port.</span>
        </div>
      ) : (
        <div className="tasty-scroll" style={{ maxHeight: "var(--tasty-port-favorites-max-height)", overflowY: "auto" }}>
          {rows.map((r) => (
            <div key={r.key} style={{ display: "flex", alignItems: "center", height: "var(--tasty-port-favorites-row-height)",
              padding: "0 var(--tasty-ports-pad-x) 0 0" }}>
              {/* star column — same 28px width as the table's, so stars line up */}
              <span style={{ width: "var(--tasty-port-star-col-width)", display: "inline-flex", justifyContent: "center", flex: "none" }}>
                <PortStar on onToggle={() => onToggle(r.key)} label={`Remove ${r.key} from favorites`} />
              </span>
              <span style={{ fontFamily: "var(--tasty-font-mono)", fontSize: "var(--tasty-font-size-caption)",
                color: "var(--tasty-text-primary)", flex: "none" }}>
                {r.addr}:{r.port}
              </span>
              <span style={{ flex: 1, minWidth: "var(--tasty-space-md)", paddingLeft: "var(--tasty-space-md)", overflow: "hidden",
                textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: "var(--tasty-font-size-caption)", color: "var(--tasty-text-muted)" }}>
                {r.hit ? `${r.hit.proc} · ${r.hit.pid}${r.hit.ws ? ` · ${r.hit.ws}` : ""}` : "not running"}
              </span>
              <span style={{ flex: "none", display: "inline-flex", justifyContent: "flex-end", minWidth: "var(--tasty-port-favorites-state-min-width)" }}>
                {r.hit
                  ? <StatusDot status={r.hit.state === "LISTEN" ? "running" : "waiting"} pulse={r.hit.state === "LISTEN"} label={r.hit.state} />
                  : <StatusDot status="idle" label="NONE" />}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Columns chooser — the app's draw_column_chooser (port_scanner.rs) ──
// The Columns IconButton opens a popover under it, at the button's bottom-left with no gap (egui popup_below_widget),
// so it may run past the window's right edge onto the scrim, as the app's popup area does. The kit draws it in the
// scrim, outside the window's clip, at the button's place. The title, then one checkbox per column in table order.
// Port is the identity and default sort column, so it stays shown and its checkbox is disabled.
const PORT_COLUMNS = [["port", "Port"], ["proto", "Proto"], ["addr", "Address"], ["proc", "Process"], ["ws", "Workspace"], ["tab", "Tab"], ["state", "State"]];
function ColumnsMenu({ anchor, hidden, onToggle, onClose }) {
  const ref = React.useRef(null);
  const [pos, setPos] = React.useState(null);
  React.useLayoutEffect(() => {
    const el = ref.current, btn = anchor.current;
    if (!el || !btn || !el.offsetParent) return;
    const a = btn.getBoundingClientRect(), o = el.offsetParent.getBoundingClientRect();
    setPos({ left: a.left - o.left, top: a.bottom - o.top });
  }, [anchor]);
  React.useEffect(() => {
    // Closes on a press outside the menu and its button, as the app's CloseOnClickOutside.
    const down = (e) => { if (!ref.current?.contains(e.target) && !anchor.current?.contains(e.target)) onClose(); };
    document.addEventListener("mousedown", down);
    return () => document.removeEventListener("mousedown", down);
  }, [anchor, onClose]);
  return (
    <div ref={ref} role="dialog" aria-label="Show columns" onClick={(e) => e.stopPropagation()}
      style={{ position: "absolute", left: pos ? pos.left : 0, top: pos ? pos.top : 0, visibility: pos ? "visible" : "hidden", zIndex: 1,
        minWidth: "var(--tasty-port-columns-menu-min-width)", display: "flex", flexDirection: "column", padding: "var(--tasty-popup-content-margin)",
        background: "var(--tasty-menu-bg)", border: "var(--tasty-border-width) solid var(--tasty-menu-border)", borderRadius: "var(--tasty-menu-radius)",
        boxShadow: "var(--tasty-shadow-popover)" }}>
      {/* the menu is raised, so the title reads text-muted-raised (the app draws text_muted: app handoff) */}
      <span style={{ fontFamily: "var(--tasty-font-ui)", fontSize: "var(--tasty-font-size-caption)", color: "var(--tasty-text-muted-raised)" }}>Show columns</span>
      {/* the title's item spacing (space-xs) plus the app's add_space(space-xs), then item spacing between rows */}
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--tasty-space-xs)", marginTop: "var(--tasty-space-sm)" }}>
        {PORT_COLUMNS.map(([key, label]) => (
          <Checkbox key={key} ground="raised" label={label} checked={!hidden.includes(key)} disabled={key === "port"}
            onChange={() => onToggle(key)} />
        ))}
      </div>
    </div>
  );
}

// scanMs: how long the mock scan shows "scanning…". 0 opens on the scanned table, for a gallery frame that must not change.
// columnsOpen: open with the Columns chooser shown, for a gallery frame.
function PortsWindow({ onClose, onFlash, favorites = FAVS_DEFAULT, scanMs = 750, columnsOpen = false }) {
  const [colsOpen, setColsOpen] = React.useState(columnsOpen);
  const [hidden, setHidden] = React.useState([]);
  const colsBtn = React.useRef(null);
  const closeCols = React.useCallback(() => setColsOpen(false), []);
  const toggleCol = React.useCallback((key) => {
    setHidden((list) => (list.includes(key) ? list.filter((k) => k !== key) : [...list, key]));
  }, []);
  const [q, setQ] = React.useState("");
  const [sort, setSort] = React.useState({ key: "port", dir: "asc" });
  const [sel, setSel] = React.useState(null);
  const [showAll, setShowAll] = React.useState(false);
  const [loading, setLoading] = React.useState(scanMs > 0);
  const [favs, setFavs] = React.useState(favorites);
  const timer = React.useRef(null);

  // Kick off a (mock) scan on open and whenever the scope changes / refresh.
  const scan = React.useCallback(() => {
    clearTimeout(timer.current);
    if (scanMs <= 0) { setLoading(false); return; }
    setLoading(true);
    timer.current = setTimeout(() => setLoading(false), scanMs);
  }, [scanMs]);
  React.useEffect(() => { scan(); return () => clearTimeout(timer.current); }, [scan, showAll]);

  const toggleFav = React.useCallback((key) => {
    setFavs((list) => (list.includes(key) ? list.filter((k) => k !== key) : [...list, key]));
  }, []);

  const onSort = (key) =>
    setSort((s) => ({ key, dir: s.key === key && s.dir === "asc" ? "desc" : "asc" }));

  // showAll scope: false → only Tasty-owned ports (ws !== null).
  const scoped = React.useMemo(
    () => (showAll ? PORTS : PORTS.filter((p) => p.ws !== null)), [showAll]);

  const rows = React.useMemo(() => {
    const needle = q.trim().toLowerCase();
    const filtered = scoped.filter((p) => !needle ||
      `${p.port} ${p.proto} ${p.addr} ${p.proc} ${p.pid} ${p.state} ${p.ws ?? ""} ${p.tab ?? ""}`
        .toLowerCase().includes(needle));
    return filtered.slice().sort((a, b) => {
      const av = a[sort.key], bv = b[sort.key];
      // null values (external rows on ws/tab) always sort last, either direction.
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      const c = typeof av === "number" ? av - bv : String(av).localeCompare(String(bv));
      return sort.dir === "asc" ? c : -c;
    });
  }, [q, sort, scoped]);

  const allColumns = [
    { key: "fav", header: "", tight: true, width: "var(--tasty-port-star-col-width)",
      render: (_v, row) => {
        const k = favKey(row);
        const on = favs.includes(k);
        return <PortStar on={on} onToggle={() => toggleFav(k)}
          label={`${on ? "Remove" : "Add"} ${k} ${on ? "from" : "to"} favorites`} />;
      } },
    { key: "port", header: "Port", align: "right", mono: true, sortable: true, width: "var(--tasty-port-port-col-width)" },
    { key: "proto", header: "Proto", mono: true, width: "var(--tasty-port-proto-col-width)" },
    { key: "addr", header: "Address", mono: true, sortable: true, width: "var(--tasty-port-addr-col-min-width)" }, // 2026-10-08 (batch 8) — pinned at 140
    { key: "proc", header: "Process", strong: true, sortable: true, width: "100%", minWidth: "var(--tasty-port-process-col-min-width)", // all spare width
      render: (v, row) => (
        // As the app's ports_process_cell: the PID Tag keeps its width and only the name ellipsises, so the row is bound to the cell.
        <span style={{ display: "flex", alignItems: "center", gap: "var(--tasty-space-sm)", minWidth: 0, maxWidth: "100%" }}>
          <span style={{ flex: "0 1 auto", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" }}>{v}</span>
          <span style={{ flex: "none", display: "inline-flex" }}><Tag mono>{row.pid}</Tag></span>
        </span>
      ) },
    { key: "ws", header: "Workspace", sortable: true, width: "var(--tasty-port-workspace-col-width)",
      render: (v) => v || <Dash /> },
    { key: "tab", header: "Tab", sortable: true, width: "var(--tasty-port-tab-col-width)",
      render: (v) => v || <Dash /> },
    { key: "state", header: "State", width: "var(--tasty-port-state-col-width)",
      render: (v) => <StatusDot status={v === "LISTEN" ? "running" : "waiting"} pulse={v === "LISTEN"} label={v} /> },
  ];
  const columns = allColumns.filter((c) => !hidden.includes(c.key));

  const listening = scoped.filter((p) => p.state === "LISTEN").length;
  const emptyMsg = q ? `No ports match “${q}”`
    : showAll ? "No listening ports on this system."
    : "No listening ports in Tasty.";

  return (
    <Scrim onClose={onClose}>
      <div style={{ width: "var(--tasty-ports-window-width)", maxHeight: "var(--tasty-ports-window-height)", display: "flex", flexDirection: "column", background: "var(--tasty-bg-panel)",
        border: "var(--tasty-border-width) solid var(--tasty-border-frame)", borderRadius: "var(--tasty-radius)", overflow: "hidden",
        boxShadow: "var(--tasty-shadow-modal)" }}>
        {/* header — the right cluster (filter, columns, refresh, close) sits at the right edge and keeps its size, as in the app's
            draw_header_row (port_scanner.rs), which lays it out right to left after the heading: close, refresh, the
            Columns chooser, then the 200 wide filter. When the window is
            narrower than both, the left group (icon, heading, count) takes what is left and is cut at its end. That cut
            is the canon: the app has no clip on the left group yet, so there the filter is drawn over the heading and
            the count (app handoff). */}
        <div style={{ display: "flex", alignItems: "center", gap: "var(--tasty-space-sm)", padding: "var(--tasty-space-md) var(--tasty-ports-pad-x)", flex: "none",
          borderBottom: "var(--tasty-border-width) solid var(--tasty-separator)" }}>
          <div style={{ flex: "1 1 0", minWidth: 0, overflow: "hidden", display: "flex", alignItems: "center", gap: "var(--tasty-space-sm)" }}>
            <span style={{ display: "inline-flex", flex: "none", color: "var(--tasty-text-muted)" }}>
              <Icon name="port" />
            </span>
            <span style={{ flex: "none", whiteSpace: "nowrap", fontSize: "var(--tasty-font-size-max)", fontWeight: "var(--tasty-font-weight-semibold)" }}>Listening ports</span>
            <span style={{ display: "inline-flex", flex: "none" }}><Tag variant="accent">{loading ? "scanning…" : `${listening} listening`}</Tag></span>
          </div>
          <div style={{ flex: "none", display: "flex", alignItems: "center", gap: "var(--tasty-space-sm)" }}>
            <Input icon={ic.search} placeholder="Filter…" value={q} onChange={(e) => setQ(e.target.value)} style={{ width: "var(--tasty-field-width-lg)" }} />
            <span ref={colsBtn} style={{ display: "inline-flex", flex: "none" }}>
              <IconButton aria-label="Columns" aria-expanded={colsOpen} onClick={() => setColsOpen((v) => !v)}>
                <Icon name="columns" />
              </IconButton>
            </span>
            <IconButton aria-label="Refresh" onClick={() => { scan(); onFlash && onFlash("Ports refreshed"); }}>
              <Icon name="refresh" />
            </IconButton>
            <IconButton aria-label="Close" onClick={onClose}>
              <Icon name="close" />
            </IconButton>
          </div>
        </div>
        {/* filters */}
        <div style={{ display: "flex", alignItems: "center", gap: "var(--tasty-space-sm)", padding: "var(--tasty-space-sm) var(--tasty-ports-pad-x)", flex: "none",
          borderBottom: "var(--tasty-border-width) solid var(--tasty-separator)" }}>
          <Checkbox checked={showAll} onChange={(e) => setShowAll(e.target.checked)}
            label="Show all (system-wide)" />
        </div>
        {/* favorites — between the filter row and the table, bounded height */}
        <FavoritesSection favs={favs} onToggle={toggleFav} />
        {/* table */}
        <div className="tasty-scroll" style={{ overflow: "auto", flex: 1, minHeight: 0 }}>
          {loading ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "var(--tasty-space-sm)",
              padding: "calc(var(--tasty-space-xl) * 2) var(--tasty-ports-pad-x)", color: "var(--tasty-text-muted)" }}>
              <Spinner size="var(--tasty-icon-size-md)" />
              <span style={{ fontSize: "var(--tasty-font-size-body)" }}>Collecting…</span>
            </div>
          ) : (
            <Table columns={columns} rows={rows} rowKey="port" sort={sort} onSort={onSort}
              selectedKey={sel} onRowClick={(row) => setSel((k) => (k === row.port ? null : row.port))}
              empty={emptyMsg} />
          )}
        </div>
        {/* footer */}
        <div style={{ display: "flex", alignItems: "center", gap: "var(--tasty-space-md)", padding: "var(--tasty-space-sm) var(--tasty-ports-pad-x)", flex: "none",
          borderTop: "var(--tasty-border-width) solid var(--tasty-separator)" }}>
          <span style={{ fontFamily: "var(--tasty-font-label)", fontSize: "var(--tasty-font-size-caption)", color: "var(--tasty-text-muted)" }}>
            {loading ? "—" : `${rows.length} of ${scoped.length} ports`}
          </span>
          <div style={{ flex: 1 }} />
          <Button variant="ghost" disabled={sel == null}
            onClick={() => { onFlash && onFlash(sel != null ? `Copied :${sel}` : ""); }}>
            Copy address
          </Button>
          <Button variant="secondary" onClick={onClose}>Close</Button>
        </div>
      </div>
      {colsOpen && <ColumnsMenu anchor={colsBtn} hidden={hidden} onToggle={toggleCol} onClose={closeCols} />}
    </Scrim>
  );
}

export { PortsWindow, PortStar, FAVS_DEFAULT, FAVS_MANY };

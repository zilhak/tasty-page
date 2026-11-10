import React from "react";
import { Button } from "../../../components/core/Button.jsx";
import { Icon } from "../../../components/core/Icon.jsx";
import { IconButton } from "../../../components/core/IconButton.jsx";
import { Tag } from "../../../components/core/Tag.jsx";
import { ListCtrl } from "../../../components/data/ListCtrl.jsx";
import { StatusDot } from "../../../components/feedback/StatusDot.jsx";
import { Checkbox } from "../../../components/forms/Checkbox.jsx";
import { Input } from "../../../components/forms/Input.jsx";
import { Select } from "../../../components/forms/Select.jsx";
import { DrillDown } from "../../../components/navigation/DrillDown.jsx";
import { DAG_STATUS, DAG_STATUS_ORDER, DAG_ROLLUP_ORDER, nodeLook, DAG_KIND, DAG_REL, DIM_STATUS, sTok, sLabel, DAG_LIST, dagLayout, elbow, DagNode, RunnerBadge, ZoomCluster, Minimap, CycleBanner, DagEmpty, NODE_W, NODE_H, DAG_BUILD } from "./dag_view.jsx";
import { Scrim } from "./shared.jsx";
import { GraphCanvas, GraphDrawer, DrawerRow, DrawerRows, lodOf } from "./graph_view.jsx";

// Tasty UI kit — Task DAG canvas + the two surfaces that host it.
// Load AFTER dag_view.jsx (parts) and overlays/shared.jsx (Scrim).
//   DagCanvas   pan / zoom / select, orthogonal edges, LOD, minimap, chrome
//   DagDetail   selected-node detail (2026-11-10: the shared drawer laid over the canvas)
//   DagSurface  full-tab surface: header + canvas + detail
//   DagWindow   workspace popup: DrillDown list ⇄ single-DAG detail




// ── Canvas ──────────────────────────────────────────────────────────
// 2026-11-10: the DAG canvas is the shared GraphCanvas (graph_view.jsx) with the DAG's layout,
// edges and card. pan = drag empty canvas (or middle-drag anywhere) · plain wheel = pan ·
// zoom = Ctrl/⌘ + wheel · select = click a node · click empty canvas or Esc clears.
// drawer = (cover) => node: the open node detail, laid over the canvas.
function dagEdges(dag, g, dir) {
  const td = dir !== "lr";
  const out = [];
  for (const n of dag.nodes) {
    for (const [from, rel] of n.deps || []) {
      const a = g.pos[from], b = g.pos[n.id];
      if (!a || !b) continue;
      const s = td ? { x: a.x + NODE_W / 2, y: a.y + NODE_H } : { x: a.x + NODE_W, y: a.y + NODE_H / 2 };
      const t = td ? { x: b.x + NODE_W / 2, y: b.y } : { x: b.x, y: b.y + NODE_H / 2 };
      const src = g.byId[from];
      const dim = DIM_STATUS.has(n.status) || (src && (src.status === "failed" || DIM_STATUS.has(src.status)));
      out.push({ key: `${from}->${n.id}`, from, to: n.id, s, t, td, dim, color: DAG_REL[rel].color, dash: DAG_REL[rel].dash });
    }
  }
  return out;
}
function DagCanvas({ dag, dir = "td", onDirChange, selected, onSelect, minimap = true, chrome = true, drawer = null, banner = null, still, style }) {
  const g = React.useMemo(() => dagLayout(dag, dir), [dag, dir]);
  const edges = React.useMemo(() => dagEdges(dag, g, dir), [dag, g, dir]);
  return (
    <GraphCanvas g={g} nodes={dag.nodes} edges={edges} dir={dir} onDirChange={onDirChange} selected={selected} onSelect={onSelect}
      minimap={minimap} chrome={chrome} drawer={drawer} still={still}
      banner={banner || (dag.cycle ? <CycleBanner ids={dag.cycle} /> : null)} style={style}
      renderNode={(n, lod, sel) => <DagNode node={n} lod={lod} selected={sel} dimmed={DIM_STATUS.has(n.status)} onSelect={onSelect} />} />
  );
}

// ── Node detail ─────────────────────────────────────────────────────
// 2026-11-10: the detail is the shared GraphDrawer (graph_view.jsx) laid over the canvas. Its body
// is unchanged: state, awaiting notice, why unknown, rows, command, dependencies, error and output.
const DetailRow = DrawerRow;

function LogBlock({ label, text, max, onCopy }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--tasty-space-xs)", minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: "var(--tasty-space-sm)" }}>
        <span style={{ flex: 1, fontSize: "var(--tasty-font-size-caption)", color: "var(--tasty-text-muted)" }}>{label}</span>
        <IconButton size="sm" aria-label={`Copy ${label}`} title={`Copy ${label}`} onClick={onCopy}>
          <Icon name="copy" />
        </IconButton>
      </div>
      <pre className="tasty-scroll" style={{ margin: 0, maxHeight: max, overflow: "auto", boxSizing: "border-box",
        padding: "var(--tasty-space-sm)", borderRadius: "var(--tasty-radius-sm)",
        border: "var(--tasty-border-width) solid var(--tasty-border-default)", background: "var(--tasty-dag-detail-log-bg)",
        fontFamily: "var(--tasty-font-mono)", fontSize: "var(--tasty-font-size-caption)",
        lineHeight: "var(--tasty-line-height-term)", color: "var(--tasty-text-secondary)", whiteSpace: "pre" }}>{text}</pre>
    </div>
  );
}

function DagDetail({ dag, id, onClose, onSelect, frame = "drawer", cover = false }) {
  const node = dag.nodes.find((n) => n.id === id);
  if (!node) return null;
  const st = nodeLook(node);
  const kind = DAG_KIND[node.kind] || DAG_KIND.run;
  const awaiting = node.status === "running" && node.phase === "awaiting_input";
  const deps = (node.deps || []).map(([from, rel]) => ({ rel, node: dag.nodes.find((n) => n.id === from) })).filter((d) => d.node);
  const body = (
    <>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--tasty-space-xs)" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: "var(--tasty-space-xs)",
          fontFamily: "var(--tasty-font-label)", fontSize: "var(--tasty-font-size-caption)", color: st.lbl }}>
          <span aria-hidden="true">{st.glyph}</span>{st.label}
        </span>
        <Tag>{kind.label}</Tag>
      </div>
      {/* 2026-10-07 — awaiting_input: say who is waiting on whom, and offer the session. User action only. */}
      {awaiting && (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--tasty-space-sm)", boxSizing: "border-box",
          padding: "var(--tasty-space-sm)", borderRadius: "var(--tasty-radius-sm)",
          border: "var(--tasty-border-width) solid var(--tasty-dag-phase-awaiting)", background: "var(--tasty-dag-phase-awaiting-bg)" }}>
          <span style={{ fontSize: "var(--tasty-font-size-caption)", color: "var(--tasty-text-primary)" }}>
            The {node.provider || "agent"} session is waiting for a person{node.since ? ` \u00b7 ${node.since}` : ""}. The graph continues after you answer it.
          </span>
          <span style={{ display: "flex" }}><Button size="sm" variant="secondary">Open session</Button></span>
        </div>
      )}
      {node.status === "unknown" && node.reason && (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--tasty-space-xs)", minWidth: 0 }}>
          <span style={{ fontSize: "var(--tasty-font-size-caption)", color: "var(--tasty-text-muted)" }}>Why unknown</span>
          <span style={{ fontSize: "var(--tasty-font-size-caption)", color: "var(--tasty-text-secondary)", wordBreak: "break-word" }}>{node.reason}</span>
          <span style={{ fontSize: "var(--tasty-font-size-caption)", color: "var(--tasty-text-muted)" }}>Retry or cancel it to let the graph continue.</span>
        </div>
      )}
      <DrawerRows>
        <DetailRow k="Started" v={node.started || "—"} mono />
        <DetailRow k="Duration" v={node.dur || "—"} mono />
        <DetailRow k="Exit code" v={node.exit == null ? "—" : String(node.exit)} mono />
        <DetailRow k="Task id" v={node.id} mono />
      </DrawerRows>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--tasty-space-xs)", minWidth: 0 }}>
        <span style={{ fontSize: "var(--tasty-font-size-caption)", color: "var(--tasty-text-muted)" }}>Command</span>
        <code style={{ display: "block", boxSizing: "border-box", padding: "var(--tasty-space-sm)", borderRadius: "var(--tasty-radius-sm)",
          border: "var(--tasty-border-width) solid var(--tasty-border-default)", background: "var(--tasty-dag-detail-log-bg)",
          fontFamily: "var(--tasty-font-mono)", fontSize: "var(--tasty-font-size-caption)", color: "var(--tasty-text-secondary)",
          wordBreak: "break-all" }}>{node.cmd}</code>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--tasty-space-xs)" }}>
        <span style={{ fontSize: "var(--tasty-font-size-caption)", color: "var(--tasty-text-muted)" }}>
          Depends on{deps.length ? ` \u00b7 ${deps.length}` : ""}
        </span>
        {deps.length === 0 ? (
          <span style={{ fontSize: "var(--tasty-font-size-caption)", color: "var(--tasty-text-placeholder)" }}>root task — no dependencies</span>
        ) : deps.map((d) => (
          <button key={d.node.id} type="button" onClick={() => onSelect && onSelect(d.node.id)}
            style={{ appearance: "none", cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center",
              gap: "var(--tasty-space-sm)", minWidth: 0, height: "var(--tasty-control-height-tree)", padding: "0 var(--tasty-space-xs)",
              border: "none", borderRadius: "var(--tasty-radius-sm)", background: "transparent",
              fontFamily: "var(--tasty-font-ui)", fontSize: "var(--tasty-font-size-caption)", color: "var(--tasty-text-secondary)" }}>
            <span aria-hidden="true" style={{ flex: "none", width: "var(--tasty-size-12)", fontFamily: "var(--tasty-font-mono)",
              color: sLabel(d.node.status) }}>{DAG_STATUS[d.node.status].glyph}</span>
            <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.node.name}</span>
            <span style={{ flex: "none", fontFamily: "var(--tasty-font-label)", fontSize: "var(--tasty-font-size-micro)",
              color: "var(--tasty-text-muted)" }}>{DAG_REL[d.rel].label}</span>
          </button>
        ))}
      </div>
      {node.err && <LogBlock label="Error" text={node.err} max="var(--tasty-dag-detail-log-max-height)" />}
      {node.status !== "waiting" && node.status !== "ready" && (
        <LogBlock label="Output tail" max="var(--tasty-dag-detail-out-max-height)"
          text={`$ ${node.cmd}\n… ${node.status === "running" ? "streaming" : "last 200 lines retained"}`} />
      )}
    </>
  );
  // frame "panel": the body alone in a fixed-width column, for specimens that compare bodies side by side.
  if (frame === "panel") {
    return (
      <div style={{ position: "relative", flex: "none", width: "var(--tasty-graph-drawer-width)", alignSelf: "stretch", overflow: "hidden" }}>
        <GraphDrawer title={node.name} onClose={onClose}>{body}</GraphDrawer>
      </div>
    );
  }
  return <GraphDrawer title={node.name} onClose={onClose} cover={cover}>{body}</GraphDrawer>;
}

// 2026-10-07 — header count = the list row's counter: "{done}/{total} done" + the same skip suffix.
const DONE_STATUS = new Set(["succeeded", "failed", "cancelled", "skipped"]);
function dagHeaderCount(dag) {
  const done = dag.nodes.filter((n) => DONE_STATUS.has(n.status)).length;
  const skipped = dag.nodes.filter((n) => n.status === "skipped").length;
  const notSelected = dag.nodes.filter((n) => n.status === "skipped" && n.skip === "branch_not_selected").length;
  return `${done} / ${dag.nodes.length} done${dagSkipText({ skipped, notSelected })}`;
}

// ── Full-tab surface ────────────────────────────────────────────────
function DagSurface({ dags = [DAG_BUILD], initialId, initialSelected = null, narrow: forceNarrow, focused, style }) {
  // A tab surface passes focused, and the canvas takes the bed. A workspace popup does not, and keeps the canvas tone.
  const bed = focused === undefined ? "var(--tasty-dag-canvas-bg)" : focused ? "var(--tasty-surface-bed-focused)" : "var(--tasty-surface-bed-unfocused)";
  const [dagId, setDagId] = React.useState(initialId || dags[0]?.id);
  const [dir, setDir] = React.useState("td");
  const [z, setZ] = React.useState(1); // detail-view zoom — lives in the back bar (S2)
  const [sel, setSel] = React.useState(initialSelected);
  const [narrowAuto, setNarrowAuto] = React.useState(false);
  const box = React.useRef(null);
  const dag = dags.find((d) => d.id === dagId) || dags[0];
  const narrow = forceNarrow != null ? forceNarrow : narrowAuto;

  React.useLayoutEffect(() => {
    if (forceNarrow != null) return;
    const el = box.current;
    if (!el) return;
    const isNarrow = el.getBoundingClientRect().width < 640;
    if (isNarrow !== narrowAuto) setNarrowAuto(isNarrow);
  });

  React.useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") setSel(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (dags.length === 0) {
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%", background: bed, ...style }}>
        <DagEmpty variant="surface" />
      </div>
    );
  }

  const header = (
    <div style={{ flex: "none", display: "flex", flexWrap: narrow ? "wrap" : "nowrap", alignItems: "center",
      rowGap: "var(--tasty-space-xs)", columnGap: "var(--tasty-space-sm)", padding: "var(--tasty-space-sm) var(--tasty-space-md)",
      background: "var(--tasty-bg-sidebar)", borderBottom: "var(--tasty-border-width) solid var(--tasty-separator)" }}>
      <span style={{ display: "inline-flex", flex: "none", color: "var(--tasty-text-muted)" }}><Icon name="gitTree" /></span>
      <span style={{ flex: narrow ? "1 0 auto" : "none", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        fontFamily: "var(--tasty-font-ui)", fontSize: "var(--tasty-font-size-body)", fontWeight: "var(--tasty-font-weight-semibold)",
        color: "var(--tasty-text-primary)" }}>{dag.name}</span>
      <span style={{ flex: "none", fontFamily: "var(--tasty-font-label)", fontSize: "var(--tasty-font-size-caption)",
        color: "var(--tasty-dag-header-count-fg)" }}>{dagHeaderCount(dag)}</span>
      {narrow && <span style={{ flexBasis: "100%", height: 0 }} />}
      <span style={{ flex: narrow ? "1 1 auto" : "none", minWidth: 0, width: narrow ? "auto" : "var(--tasty-field-width-lg)", display: "flex" }}>
        <Select block value={dagId} onChange={(e) => { setDagId(e.target.value); setSel(null); }}
          options={dags.map((d) => ({ value: d.id, label: `${d.workspace} / ${d.name}` }))} />
      </span>
      <RunnerBadge runner={dag.runner} hint={!narrow} />
      <div style={{ flex: 1 }} />
      <IconButton aria-label="Refresh" title="Refresh"><Icon name="refresh" /></IconButton>
    </div>
  );

  return (
    <div ref={box} style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0, overflow: "hidden",
      background: "var(--tasty-bg-panel)", ...style }}>
      {header}
      <div style={{ flex: 1, minHeight: 0, display: "flex" }}>
        <DagCanvas dag={dag} dir={dir} onDirChange={setDir} selected={sel} onSelect={setSel} style={{ backgroundColor: bed }}
          drawer={sel ? (cover) => <DagDetail dag={dag} id={sel} cover={cover} onClose={() => setSel(null)} onSelect={setSel} /> : null} />
      </div>
    </div>
  );
}

// ── DAG list row (popup) ────────────────────────────────────────────
// A ListCtrl row + the one new part: a trailing rollup chip and a mono
// done/total counter. Origin (declared vs derived) rides as a Tag.
// "· {n} skipped ({k} not selected)" — only when n > 0; the parenthesis only when k > 0.
function dagSkipText(e) {
  if (!e.skipped) return "";
  return ` \u00b7 ${e.skipped} skipped${e.notSelected ? ` (${e.notSelected} not selected)` : ""}`;
}
function dagRowItems(entries) {
  return entries.map((e) => ({
    id: e.dag.id,
    icon: <Icon name="gitTree" size="var(--tasty-icon-size-sm)" />,
    label: e.dag.name,
    description: `${e.dag.workspace} \u00b7 ${e.dag.updated}`,
    trailing: (
      <span style={{ display: "inline-flex", alignItems: "center", gap: "var(--tasty-dag-row-summary-gap)" }}>
        {e.dag.origin === "derived" && <Tag>derived</Tag>}
        {/* 2026-10-07 — a running DAG stopped on a person says so at DAG level; rollup stays "running" */}
        {e.awaiting > 0 && (
          <span style={{ display: "inline-flex", alignItems: "center", gap: "var(--tasty-space-xs)",
            fontFamily: "var(--tasty-font-label)", fontSize: "var(--tasty-font-size-caption)", color: "var(--tasty-dag-phase-awaiting-label)" }}>
            <span aria-hidden="true">!</span>{e.awaiting} needs input
          </span>
        )}
        <span style={{ display: "inline-flex", alignItems: "center", gap: "var(--tasty-space-xs)",
          fontFamily: "var(--tasty-font-label)", fontSize: "var(--tasty-font-size-caption)", color: sLabel(e.rollup) }}>
          <span aria-hidden="true">{DAG_STATUS[e.rollup].glyph}</span>{DAG_STATUS[e.rollup].label}
        </span>
        <span style={{ fontFamily: "var(--tasty-font-label)", fontSize: "var(--tasty-dag-row-count-font-size)",
          color: "var(--tasty-dag-row-count-fg)" }}>{e.done}/{e.total}{dagSkipText(e)}</span>
      </span>
    ),
  }));
}

// ── Workspace popup ─────────────────────────────────────────────────
function DagWindow({ onClose, entries = DAG_LIST, scope = "tasty", initialOpen = null, initialSelected = null }) {
  const [q, setQ] = React.useState("");
  const [mine, setMine] = React.useState(false);
  const [status, setStatus] = React.useState("all");
  const [openId, setOpenId] = React.useState(initialOpen);
  const [sel, setSel] = React.useState(initialSelected);
  const [dir, setDir] = React.useState("td");
  const [z, setZ] = React.useState(1); // detail-view zoom — lives in the back bar (S2)

  const rows = entries.filter((e) => {
    if (mine && e.dag.workspace !== scope) return false;
    if (status !== "all" && e.rollup !== status) return false;
    const needle = q.trim().toLowerCase();
    return !needle || `${e.dag.name} ${e.dag.workspace}`.toLowerCase().includes(needle);
  });
  const open = entries.find((e) => e.dag.id === openId);

  return (
    <Scrim onClose={onClose}>
      <div style={{ width: "var(--tasty-dag-popup-width)", height: "var(--tasty-dag-popup-height)", display: "flex",
        flexDirection: "column", overflow: "hidden", background: "var(--tasty-bg-panel)", borderRadius: "var(--tasty-radius)",
        border: "var(--tasty-border-width) solid var(--tasty-border-strong)", boxShadow: "var(--tasty-shadow-modal)" }}>
        {/* titlebar — draggable strip; the popup is movable + resizable */}
        <div style={{ flex: "none", display: "flex", alignItems: "center", gap: "var(--tasty-space-sm)", cursor: "move",
          height: "var(--tasty-modhint-header-height)", padding: "0 var(--tasty-space-sm) 0 var(--tasty-space-md)",
          background: "var(--tasty-bg-sidebar)", borderBottom: "var(--tasty-border-width) solid var(--tasty-separator)" }}>
          <span style={{ display: "inline-flex", flex: "none", color: "var(--tasty-text-muted)" }}>
            <Icon name="gitTree" size="var(--tasty-icon-size-sm)" />
          </span>
          <span style={{ flex: 1, minWidth: 0, fontFamily: "var(--tasty-font-ui)", fontSize: "var(--tasty-font-size-body)",
            fontWeight: "var(--tasty-font-weight-semibold)", color: "var(--tasty-text-primary)" }}>Task DAGs</span>
          <IconButton size="sm" aria-label="Close" title="Close" onClick={onClose}><Icon name="close" /></IconButton>
        </div>

        <DrillDown view={open ? "detail" : "list"} title={open ? open.dag.name : ""}
          onBack={() => { setOpenId(null); setSel(null); }}
          /* S2 — the detail view has NO second header. The back bar IS the
             detail's chrome: its actions slot carries the zoom cluster (compact,
             beside the graph it scales) and the runner badge (it describes the
             run this node belongs to). The DAG selector is deliberately absent —
             the back-bar title already names the DAG, and switching DAGs under
             an open node detail has no meaning. */
          actions={open ? (
            <span style={{ display: "inline-flex", alignItems: "center", gap: "var(--tasty-space-sm)" }}>
              <ZoomCluster z={z} onZoom={(d) => setZ((v) => Math.min(2, Math.max(0.5, +(v + d * 0.1).toFixed(2))))}
                onFit={() => setZ(1)} dir={dir} onDir={setDir} compact />
              <RunnerBadge runner={open.dag.runner} hint={false} />
            </span>
          ) : null}
          detail={open ? (
            <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
              <div style={{ flex: 1, minHeight: 0, display: "flex" }}>
                <DagCanvas dag={open.dag} dir={dir} onDirChange={setDir} selected={sel} onSelect={setSel} minimap={false} chrome={false}
                  drawer={sel ? (cover) => <DagDetail dag={open.dag} id={sel} cover={cover} onClose={() => setSel(null)} onSelect={setSel} /> : null} />
              </div>
            </div>
          ) : null}>
          <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
            <div style={{ flex: "none", display: "flex", alignItems: "center", gap: "var(--tasty-space-sm)",
              padding: "var(--tasty-space-sm) var(--tasty-space-md)",
              borderBottom: "var(--tasty-border-width) solid var(--tasty-separator)" }}>
              <span style={{ flex: 1, minWidth: 0, display: "flex" }}>
                <Input block icon={<Icon name="search" />} placeholder="Filter DAGs…" value={q} onChange={(e) => setQ(e.target.value)} />
              </span>
              <span style={{ flex: "none", width: "var(--tasty-field-width-md)", display: "flex" }}>
                <Select block value={status} onChange={(e) => setStatus(e.target.value)}
                  options={[{ value: "all", label: "Any status" }, ...DAG_ROLLUP_ORDER.map((s) => ({ value: s, label: DAG_STATUS[s].label }))]} />
              </span>
            </div>
            <div style={{ flex: "none", display: "flex", alignItems: "center", gap: "var(--tasty-space-sm)",
              padding: "var(--tasty-space-xs) var(--tasty-space-md)",
              borderBottom: "var(--tasty-border-width) solid var(--tasty-separator)" }}>
              <Checkbox checked={mine} onChange={(e) => setMine(e.target.checked)} label="This workspace only" />
            </div>
            <div className="tasty-scroll" style={{ flex: 1, minHeight: 0, overflow: "auto", display: "flex", flexDirection: "column" }}>
              {rows.length === 0
                ? <DagEmpty variant="search" query={q} />
                : <ListCtrl items={dagRowItems(rows)} onSelect={(id) => { setOpenId(id); setSel(null); }} />}
            </div>
            <div style={{ flex: "none", display: "flex", alignItems: "center", gap: "var(--tasty-space-sm)",
              padding: "var(--tasty-space-sm) var(--tasty-space-md)",
              borderTop: "var(--tasty-border-width) solid var(--tasty-separator)" }}>
              <span style={{ flex: 1, fontFamily: "var(--tasty-font-label)", fontSize: "var(--tasty-font-size-caption)",
                color: "var(--tasty-text-muted)" }}>{rows.length} of {entries.length} DAGs</span>
              <Button variant="secondary" onClick={onClose}>Close</Button>
            </div>
          </div>
        </DrillDown>
      </div>
    </Scrim>
  );
}

export { DagCanvas, DagDetail, DagSurface, DagWindow, dagRowItems, lodOf };

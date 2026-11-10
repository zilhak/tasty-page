import React from "react";
import { Button } from "../../../components/core/Button.jsx";
import { Spinner } from "../../../components/feedback/Spinner.jsx";
import { Icon } from "../../../components/core/Icon.jsx";
import { IconButton } from "../../../components/core/IconButton.jsx";
import { ListCtrl } from "../../../components/data/ListCtrl.jsx";
import { Checkbox } from "../../../components/forms/Checkbox.jsx";
import { Switch } from "../../../components/forms/Switch.jsx";
import { DrillDown } from "../../../components/navigation/DrillDown.jsx";
import { DAG_LIST, RunnerBadge, DagEmpty } from "./dag_view.jsx";
import { DagCanvas, DagDetail, dagRowItems } from "./dag_surfaces.jsx";
import { GraphCanvas, GraphDrawer, DrawerRow, DrawerRows, DrawerCaption, GraphStrip, GraphPush, CHILD_STATE, childTone, childColor, childLayout, childEdges, childVisible } from "./graph_view.jsx";
import { gt } from "./graph_copy.js";
import { BasePicker, PICKER_WINDOWS } from "./child_base_picker.jsx";

// Tasty UI kit — the child graph (2026-11-10). One internal view, two frames:
//   ChildGraphView     canvas + drawer (+ status blocks) — the part both frames share
//   ChildGraphWindow   popup: title bar, 36 toolbar (full tree checkbox), base = the surface it opened from
//   ChildGraphSurface  tab surface: header with the base picker (child_base_picker.jsx) and the checkbox, canvas on the surface bed
// Inside either frame a surface that created DAGs pushes to them: child → (list of its DAGs) → DAG graph.
// The back bars are DrillDown's (chevron + title, 36). Coming back restores the child view as it was.

// ── Mock trees (shape is what matters; values are illustrative) ─────
const S = (id, over) => ({ id, kind: "surface", state: "active", confidence: "confirmed", evidence: "pty_busy",
  cwd: "~/work/tasty-project/tasty", lastReport: "10:42:07 · 4s ago", workspace: "tasty", ...over });

// small: base + one parent + two children
const CHILD_SMALL = [
  S("s_01HX4K", { nickname: "conductor", role: "conductor" }),
  S("s_01HX7Q", { parent: "s_01HX4K", nickname: "builder", role: "worker", dags: ["build-and-deploy"] }),
  S("s_01HX9A", { parent: "s_01HX7Q", nickname: "test-runner", role: "tester", state: "idle", evidence: "hook_idle" }),
  S("s_01HXB2", { parent: "s_01HX7Q", nickname: "reviewer", role: "review", state: "needs_input", evidence: "hook_needs_input" }),
];
const CHILD_SMALL_BASE = "s_01HX7Q";

// large: depth 5, six siblings under the base's parent, two more conductors (one on a mirrored remote)
const CHILD_LARGE = [
  S("s_d0", { nickname: "director", role: "director", workspace: "tasty-project" }),
  S("s_c1", { parent: "s_d0", nickname: "conductor-tasty", role: "conductor" }),
  S("s_c11", { parent: "s_c1", nickname: "lane-ui", role: "worker", state: "idle", evidence: "hook_idle" }),
  S("s_c12", { parent: "s_c1", nickname: "lane-ipc", role: "worker", state: "exited", confidence: "reported", evidence: "process_exit" }),
  S("s_c2", { parent: "s_d0", nickname: "conductor-page", role: "conductor", workspace: "tasty-page", dags: ["build-and-deploy", "docs-publish"] }),
  S("s_w21", { parent: "s_c2", nickname: "copy-en", role: "worker", state: "idle", workspace: "tasty-page", evidence: "hook_idle" }),
  S("s_w22", { parent: "s_c2", nickname: "copy-ko", role: "worker", workspace: "tasty-page" }),
  S("s_w23", { parent: "s_c2", nickname: "designer", role: "designer", workspace: "tasty-page", dags: ["index-refresh"] }),
  S("s_w24", { parent: "s_c2", nickname: "gallery", role: "worker", state: "stale", confidence: "heuristic", evidence: "output_and_hook_silent", workspace: "tasty-page" }),
  S("s_w25", { parent: "s_c2", nickname: "contrast", role: "checker", state: "needs_input", evidence: "hook_needs_input", workspace: "tasty-page" }),
  S("s_w26", { parent: "s_c2", nickname: "links", role: "checker", state: "idle", evidence: "hook_idle", workspace: "tasty-page" }),
  S("s_r1", { parent: "s_w23", nickname: "codex-check", role: "crosscheck", workspace: "tasty-page", confidence: "heuristic", evidence: "recent_output" }),
  S("s_x1", { parent: "s_r1", nickname: "subagent", role: "worker", state: "idle", workspace: "tasty-page", evidence: "hook_idle" }),
  S("s_r2", { parent: "s_w23", nickname: "translator", role: "i18n", state: "stale", confidence: "heuristic", evidence: "output_and_hook_silent", workspace: "tasty-page" }),
  S("s_c3", { parent: "s_d0", nickname: "conductor-android", role: "conductor", remote: true, workspace: "android-lab", profile: "lab-mac" }),
  S("s_c31", { parent: "s_c3", nickname: "gradle", role: "worker", state: "idle", remote: true, workspace: "android-lab", profile: "lab-mac", evidence: "hook_idle" }),
];
const CHILD_LARGE_BASE = "s_w23";

// mirror: relations on the remote machine + a read-only ancestor in a remote workspace that is not
// mirrored here (user decision 2026-11-10: one graph across machines, followed to the root)
const R = (id, over) => S(id, { remote: true, workspace: "lab-main", profile: "lab-linux", ...over });
const CHILD_MIRROR = [
  { id: "s_m0", kind: "remote-ancestor", nickname: "orchestrator", workspace: "lab-ops", profile: "lab-linux" },
  R("s_m1", { parent: "s_m0", nickname: "conductor", role: "conductor" }),
  R("s_m2", { parent: "s_m1", nickname: "worker-a", role: "worker" }),
  R("s_m3", { parent: "s_m1", nickname: "worker-b", role: "worker", state: "idle", evidence: "hook_idle" }),
  R("s_m4", { parent: "s_m2", nickname: "checker", role: "checker", state: "needs_input", evidence: "hook_needs_input" }),
];
const CHILD_MIRROR_BASE = "s_m2";
// disconnected: the last graph stays, every remote state reads unknown
const CHILD_MIRROR_LOST = CHILD_MIRROR.map((n) => (n.kind === "surface" ? { ...n, state: "unknown", confidence: "unobserved", evidence: "remote_disconnected" } : n));
// across machines (user decision 4-7 to 4-9): A on this computer → B on a remote → C, one graph, ordinary lines
const CHILD_CROSS = [
  S("s_L1", { nickname: "conductor", role: "conductor", workspace: "tasty" }),
  R("s_R1", { parent: "s_L1", nickname: "linux-build", role: "worker", profile: null, ssh: "dev@10.0.0.12" }),
  R("s_R3", { parent: "s_R1", nickname: "linux-check", role: "checker", state: "needs_input", profile: null, ssh: "dev@10.0.0.12", evidence: "hook_needs_input" }),
  R("s_R2", { parent: "s_L1", nickname: "linux-test", role: "tester", state: "idle", profile: null, ssh: "dev@10.0.0.12", evidence: "hook_idle" }),
];
// external parent (user decision 2026-11-10): its own card at the root, nothing traced beyond the key
const CHILD_EXTERNAL = [
  { id: "codex:019a5c2e-7f3b", kind: "external" },
  S("s_e1", { parent: "codex:019a5c2e-7f3b", parentExternal: "codex:019a5c2e-7f3b", nickname: "helper", role: "worker" }),
  S("s_e2", { parent: "s_e1", nickname: "lint", role: "worker", state: "idle", evidence: "hook_idle" }),
];

const DAG_BY_ID = Object.fromEntries(DAG_LIST.map((e) => [e.dag.id, e]));
const nameOf = (n) => (n.kind === "external" ? n.id : n.nickname || n.role || n.id);

// ── Card ────────────────────────────────────────────────────────────
// The DAG card's box (168 × 48, bar, two rows, LOD tiers, ring, hover wash) with child content:
//   name row  terminal glyph (remote glyph on a mirrored surface) · nickname, else role, else id
//   meta row  state glyph · STATE · surface id (mono, right)
// base: a chip ABOVE the card, outside the box, so it never competes with the state colour or the
// selection ring and survives every LOD tier. external / remote-ancestor: dashed border, no bar.
function ChildNode({ node, lod = "full", selected = false, base = false, hover, lang = "en", onSelect }) {
  const [hotState, setHot] = React.useState(false);
  const hot = hover != null ? hover : hotState;
  const special = node.kind && node.kind !== "surface";
  const st = special ? null : childTone(node.state);
  const accent = special ? "var(--tasty-dag-node-border)" : st.tok;
  const name = nameOf(node);
  const monoName = node.kind === "external" || (!special && !node.nickname && !node.role);
  const icon = node.kind === "external" ? "link" : node.remote || node.kind === "remote-ancestor" ? "remote" : "terminal";
  const iconInk = node.remote || node.kind === "remote-ancestor" ? "var(--tasty-accent-remote-raised)" : special ? "var(--tasty-dag-node-meta-fg)" : "var(--tasty-dag-node-meta-status-fg)";
  const label = special ? (node.kind === "external" ? gt("child_graph.card.external", lang) : node.kind === "remote-ancestor" ? gt("child_graph.card.not_attached", lang) : null) : gt(st.key, lang);
  const tip = [name, label].filter(Boolean).join(" — ");
  const box = {
    position: "absolute", boxSizing: "border-box", textAlign: "left",
    width: "var(--tasty-dag-node-width)", height: "var(--tasty-dag-node-height)",
    display: "flex", alignItems: "stretch", padding: 0, cursor: "pointer",
    borderRadius: "var(--tasty-dag-node-radius)",
    border: `var(--tasty-border-width) ${special ? "dashed" : "solid"} ${special || st.plain ? "var(--tasty-dag-node-border)" : accent}`,
    background: special ? "var(--tasty-dag-node-bg)" : st.bg,
    outline: selected ? "var(--tasty-dag-node-selected-ring-width) solid var(--tasty-dag-node-selected-ring)" : "none",
    outlineOffset: "var(--tasty-size-1)",
    opacity: !special && st.dim ? "var(--tasty-dag-node-dim-opacity)" : 1,
    fontFamily: "var(--tasty-font-ui)", color: "var(--tasty-text-on-active)",
  };
  const chip = base && (
    <span style={{ position: "absolute", left: 0, top: "calc(-1 * (var(--tasty-graph-base-chip-height) + var(--tasty-graph-base-chip-gap)))",
      height: "var(--tasty-graph-base-chip-height)", padding: "0 var(--tasty-graph-base-chip-padding-x)", boxSizing: "border-box",
      display: "inline-flex", alignItems: "center", borderRadius: "var(--tasty-radius-sm)", whiteSpace: "nowrap",
      border: "var(--tasty-border-width) solid var(--tasty-border-strong)", background: "var(--tasty-bg-sidebar)",
      fontFamily: "var(--tasty-font-label)", fontSize: "var(--tasty-font-size-micro)", color: "var(--tasty-text-secondary)" }}>
      {gt("child_graph.base_badge", lang)}
    </span>
  );
  const handlers = { onClick: () => onSelect && onSelect(node.id), onMouseEnter: () => setHot(true), onMouseLeave: () => setHot(false) };
  if (lod === "block") {
    return (
      <span style={{ position: "relative", display: "block" }}>
        {chip}
        <button type="button" aria-label={tip} title={tip} {...handlers}
          style={{ ...box, background: special ? "var(--tasty-dag-node-bg)" : `color-mix(in srgb, ${accent} 55%, var(--tasty-surface-raised))`, borderColor: accent }} />
      </span>
    );
  }
  return (
    <span style={{ position: "relative", display: "block" }}>
      {chip}
      <button type="button" aria-label={tip} title={tip} {...handlers} style={box}>
        <span style={{ flex: "none", width: "var(--tasty-dag-node-bar-width)", background: special ? "transparent" : accent,
          borderTopLeftRadius: "var(--tasty-radius-sm)", borderBottomLeftRadius: "var(--tasty-radius-sm)" }} />
        <span style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", justifyContent: "center",
          gap: "var(--tasty-dag-node-row-gap)", padding: "var(--tasty-dag-node-padding-y) var(--tasty-dag-node-padding-x)",
          background: hot ? "var(--tasty-dag-node-hover-bg)" : "transparent" }}>
          <span style={{ display: "flex", alignItems: "center", gap: "var(--tasty-dag-node-gap)", minWidth: 0 }}>
            <span style={{ flex: "none", display: "inline-flex", color: iconInk }}><Icon name={icon} size="var(--tasty-icon-size-sm)" /></span>
            <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              fontFamily: monoName ? "var(--tasty-font-mono)" : "var(--tasty-font-ui)",
              fontSize: monoName ? "var(--tasty-font-size-caption)" : "var(--tasty-dag-node-name-font-size)",
              fontWeight: monoName ? "var(--tasty-font-weight-regular)" : "var(--tasty-font-weight-medium)",
              color: special ? "var(--tasty-dag-node-fg)" : "inherit" }}>{name}</span>
          </span>
          {lod === "full" && label && (
            <span style={{ display: "flex", alignItems: "center", gap: "var(--tasty-dag-node-gap)", minWidth: 0,
              fontSize: "var(--tasty-dag-node-meta-font-size)", letterSpacing: "var(--tasty-letter-spacing-caps)" }}>
              {!special && <span aria-hidden="true" style={{ flex: "none", color: st.lbl, fontFamily: "var(--tasty-font-mono)" }}>{st.glyph}</span>}
              <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                textTransform: "uppercase", color: special ? "var(--tasty-dag-node-meta-fg)" : st.lbl }}>{label}</span>
              {node.kind !== "external" && (
                <span style={{ flex: "none", fontFamily: "var(--tasty-font-mono)", letterSpacing: "var(--tasty-letter-spacing-ui)",
                  color: special ? "var(--tasty-dag-node-meta-fg)" : "var(--tasty-dag-node-meta-status-fg)" }}>{node.id.replace(/^s_/, "s_").slice(0, 8)}</span>
              )}
            </span>
          )}
        </span>
      </button>
    </span>
  );
}

// ── Drawer body ─────────────────────────────────────────────────────
// Order: state line → actions → who (role, id, workspace, attach profile) → why this state
// (evidence, last report) → where (working directory, wraps). The nickname is the drawer title;
// with no nickname the title is the surface id in mono and the rows start at role.
// DAGs (user decision 2026-11-10): one button; with several DAGs it opens the list of them first.
function ChildDetail({ node, isBase, lang = "en", onViewDags, onSetBase, onClose, cover }) {
  const title = node.kind === "external" ? node.id : node.nickname || node.id;
  const mono = node.kind === "external" || !node.nickname;
  const closeLabel = gt("dag.detail.close", lang);
  if (node.kind === "external") {
    return (
      <GraphDrawer title={title} mono onClose={onClose} closeLabel={closeLabel} cover={cover}>
        <DrawerRows><DrawerRow k={gt("child_graph.drawer.external_key", lang)} v={node.id} mono /></DrawerRows>
        <DrawerCaption>{gt("child_graph.drawer.external_note", lang)}</DrawerCaption>
      </GraphDrawer>
    );
  }
  const ancestor = node.kind === "remote-ancestor";
  const st = ancestor ? null : childTone(node.state);
  const dags = (node.dags || []).map((id) => DAG_BY_ID[id]).filter(Boolean);
  const attach = node.remote || ancestor
    ? (node.profile ? node.profile : <>{node.ssh || "dev@10.0.0.12"} <span style={{ fontFamily: "var(--tasty-font-ui)", color: "var(--tasty-text-muted)" }}>{gt("child_graph.drawer.attach_inline", lang)}</span></>)
    : null;
  return (
    <GraphDrawer title={title} mono={mono} onClose={onClose} closeLabel={closeLabel} cover={cover}>
      {st && (
        <span style={{ display: "inline-flex", alignItems: "center", gap: "var(--tasty-space-xs)", flexWrap: "wrap",
          fontFamily: "var(--tasty-font-label)", fontSize: "var(--tasty-font-size-caption)", color: st.lbl }}>
          <span aria-hidden="true">{st.glyph}</span>{gt(st.key, lang)}
          <span style={{ color: "var(--tasty-text-muted)" }}>{"·"} {gt(`child_graph.confidence.${node.confidence || "unobserved"}`, lang)}</span>
        </span>
      )}
      {ancestor && <DrawerCaption>{gt("child_graph.drawer.read_only_note", lang)}</DrawerCaption>}
      {!ancestor && (dags.length > 0 || !isBase) && (
        <span style={{ display: "flex", flexWrap: "wrap", gap: "var(--tasty-space-sm)" }}>
          {dags.length > 0 && (
            <Button size="sm" variant="secondary" onClick={() => onViewDags && onViewDags(node)}>
              {dags.length === 1 ? gt("child_graph.drawer.view_dag", lang) : gt("child_graph.drawer.view_dags", lang, dags.length)}
            </Button>
          )}
          {!isBase && <Button size="sm" variant="ghost" onClick={() => onSetBase && onSetBase(node.id)}>{gt("child_graph.drawer.set_base", lang)}</Button>}
        </span>
      )}
      <DrawerRows>
        {!mono && node.role && <DrawerRow k={gt("child_graph.drawer.role", lang)} v={node.role} />}
        {mono && node.role && <DrawerRow k={gt("child_graph.drawer.role", lang)} v={node.role} />}
        <DrawerRow k={gt("child_graph.drawer.surface_id", lang)} v={node.id} mono />
        {node.parentExternal && <DrawerRow k={gt("child_graph.drawer.external_key", lang)} v={node.parentExternal} mono />}
        <DrawerRow k={gt("child_graph.drawer.workspace", lang)} v={node.workspace} />
        {attach && <DrawerRow k={gt("child_graph.drawer.attach_profile", lang)} v={attach} mono />}
        {!ancestor && <DrawerRow k={gt("child_graph.drawer.evidence", lang)} v={node.evidence} mono />}
        {!ancestor && <DrawerRow k={gt("child_graph.drawer.last_report", lang)} v={node.lastReport} mono />}
        {!ancestor && <DrawerRow k={gt("child_graph.drawer.cwd", lang)} v={node.cwd} mono wrap />}
      </DrawerRows>
    </GraphDrawer>
  );
}

// ── Shared view ─────────────────────────────────────────────────────
// status: "ready" | "loading" | "empty" | "base-closed" | "unsupported" (remote Tasty too old)
function ChildGraphView({ nodes, baseId, full = false, selected, onSelect, lang = "en", bed, banner, status = "ready",
  onViewDags, onSetBase, onPickBase, host = "lab-linux", still, initialZoom }) {
  const shown = React.useMemo(() => childVisible(nodes, baseId, full), [nodes, baseId, full]);
  const g = React.useMemo(() => childLayout(shown), [shown]);
  const edges = React.useMemo(() => childEdges(shown, g), [shown, g]);
  const wrap = (child) => <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", background: bed || "var(--tasty-dag-canvas-bg)" }}>{banner}{child}</div>;
  if (status === "loading") return wrap(<DagEmpty loading copy={{ title: gt("graph.loading", lang) }} />);
  if (status === "unsupported") return wrap(<DagEmpty copy={{ icon: "remote", title: gt("graph.remote_unsupported", lang), body: gt("graph.remote_unsupported_hint", lang, host) }} />);
  if (status === "base-closed") return wrap(<DagEmpty copy={{ icon: "paneEmpty", title: gt("child_graph.empty.base_closed", lang), body: gt("child_graph.empty.base_closed_hint", lang) }}
    action={<Button size="sm" variant="secondary" onClick={onPickBase}>{gt("child_graph.empty.pick_base", lang)}</Button>} />);
  if (status === "empty" || shown.length <= 1) return wrap(<DagEmpty copy={{ icon: "gitBranch", title: gt("child_graph.empty.none", lang), body: gt("child_graph.empty.none_hint", lang) }} />);
  const sel = shown.find((n) => n.id === selected);
  return (
    <div style={{ flex: 1, minHeight: 0, display: "flex" }}>
      <GraphCanvas g={g} nodes={shown} edges={edges} dir="lr" dirFixed dirTitle={gt("child_graph.zoom.direction_fixed", lang)}
        colorOf={childColor} selected={selected} onSelect={onSelect} banner={banner} still={still} initialZoom={initialZoom}
        style={bed ? { backgroundColor: bed } : undefined}
        renderNode={(n, lod, isSel) => <ChildNode node={n} lod={lod} selected={isSel} base={n.id === baseId} lang={lang} onSelect={onSelect} />}
        drawer={sel ? (cover) => (
          <ChildDetail node={sel} isBase={sel.id === baseId} lang={lang} cover={cover}
            onViewDags={onViewDags} onSetBase={onSetBase} onClose={() => onSelect(null)} />
        ) : null} />
    </div>
  );
}

// ── Mirror banner (user decision 2026-11-10) ────────────────────────
// A graph whose base is a mirrored surface loses it when the mirror is detached (cause "detached",
// neutral) or the connection drops (cause "lost", warning). The surface shows this strip over the
// "pick a base surface" state. Reconnect attaches again with the same profile to the same remote surface:
// state "idle" → Reconnect · "trying" → disabled Reconnecting… with a spinner · "failed" → the failure
// sentence (warning) and Reconnect again. On success the graph comes back with that base.
function MirrorBanner({ cause = "detached", state = "idle", host = "lab-linux", name = "worker-a", profile = "lab-linux", lang = "en", onReconnect }) {
  const text = state === "failed" ? gt("child_graph.reconnect_failed", lang, host)
    : gt(cause === "lost" ? "child_graph.mirror_lost" : "child_graph.mirror_detached", lang, host, name);
  const tip = gt("child_graph.reconnect_tooltip", lang, name, profile);
  const action = state === "trying"
    ? <Button size="sm" variant="secondary" disabled leadingIcon={<Spinner size={12} />}>{gt("child_graph.reconnecting", lang)}</Button>
    : <Button size="sm" variant="secondary" title={tip} onClick={onReconnect}>{gt("child_graph.reconnect", lang)}</Button>;
  return <GraphStrip tone={cause === "lost" || state === "failed" ? "warning" : "info"} action={action}>{text}</GraphStrip>;
}

// ── Push screens shared by both frames ──────────────────────────────
// child → list (only when the surface created several DAGs, user decision) → DAG graph.
function useChildFlow({ nodes, initial = {} }) {
  const [owner, setOwner] = React.useState(initial.owner ? nodes.find((n) => n.id === initial.owner) : null);
  const [dagId, setDagId] = React.useState(initial.dagId || null);
  const [viaList, setViaList] = React.useState(!!initial.viaList);
  const [dagSel, setDagSel] = React.useState(initial.dagSel || null);
  const ownerDags = owner ? (owner.dags || []).map((id) => DAG_BY_ID[id]).filter(Boolean) : [];
  const viewDags = (node) => {
    const ds = (node.dags || []).filter((id) => DAG_BY_ID[id]);
    setOwner(node); setDagSel(null);
    if (ds.length === 1) { setDagId(ds[0]); setViaList(false); } else { setDagId(null); setViaList(true); }
  };
  const back = () => { if (dagId && viaList) { setDagId(null); setDagSel(null); } else { setOwner(null); setDagId(null); setViaList(false); } };
  const step = !owner ? 0 : viaList && !dagId ? 1 : viaList ? 2 : 1;
  return { owner, ownerDags, dagId, viaList, dagSel, setDagSel, setDagId, viewDags, back, step };
}
// Esc clears the selection of the screen in front, as the DAG surface does (dag_surfaces.jsx), and the
// drawer closes with it. On a pushed step with nothing selected it goes back one step. On the child
// graph with nothing selected the popup passes onIdle (close), as its Meta says; the surface stays.
// A frozen gallery frame (still, or a pinned push step) does not listen: one Esc anywhere on the page
// would otherwise step every such frame back to an empty screen.
function useEscDeselect(flow, sel, setSel, onIdle, enabled = true) {
  const ref = React.useRef(null);
  ref.current = () => {
    if (flow.dagId && flow.dagSel) { flow.setDagSel(null); return; }
    if (flow.owner) { flow.back(); return; }
    if (sel) setSel(null); else if (onIdle) onIdle();
  };
  React.useEffect(() => {
    if (!enabled) return undefined;
    const onKey = (e) => { if (e.key === "Escape") ref.current(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enabled]);
}
function FlowScreens({ flow, lang, bed, still }) {
  const { owner, ownerDags, dagId, viaList, dagSel, setDagSel, setDagId, back } = flow;
  const screens = [];
  if (owner && viaList) {
    screens.push(
      <DrillDown key="list" view="detail" title={gt("child_graph.dag_list_title", lang, nameOf(owner))} backLabel={gt("child_graph.back", lang)}
        onBack={() => back()} detail={<ListCtrl items={dagRowItems(ownerDags)} onSelect={(id) => { setDagId(id); setDagSel(null); }} />} />
    );
  }
  const entry = dagId ? DAG_BY_ID[dagId] : null;
  if (owner && entry) {
    screens.push(
      <DrillDown key="dag" view="detail" backLabel={viaList ? gt("dag_list.back", lang) : gt("child_graph.back", lang)} onBack={() => back()}
        title={<>{entry.dag.name}<span style={{ fontWeight: "var(--tasty-font-weight-regular)", color: "var(--tasty-text-muted)" }}> {"·"} {gt("child_graph.from", lang, nameOf(owner))}</span></>}
        actions={<RunnerBadge runner={entry.dag.runner} hint={false} />}
        detail={
          <div style={{ display: "flex", height: "100%", minHeight: 0 }}>
            <DagCanvas dag={entry.dag} dir="td" selected={dagSel} onSelect={setDagSel} still={still} style={bed ? { backgroundColor: bed } : undefined}
              drawer={dagSel ? (cover) => <DagDetail dag={entry.dag} id={dagSel} cover={cover} onClose={() => setDagSel(null)} onSelect={setDagSel} /> : null} />
          </div>
        } />
    );
  }
  return screens;
}

// ── Popup frame ─────────────────────────────────────────────────────
// 600 × 460 (three columns at 100%), min 360 × 280 like the DAG popup. Title bar 28 (drag),
// toolbar 36 with the full tree checkbox — the same height as the back bar it trades places with.
// Base = the surface the popup opened from; the chip on its card says so. No base selector here.
function ChildGraphWindow({ nodes = CHILD_SMALL, baseId = CHILD_SMALL_BASE, lang = "en", width, height, initial = {},
  status = "ready", banner, push, still, onClose }) {
  const [full, setFull] = React.useState(!!initial.full);
  const [sel, setSel] = React.useState(initial.selected || null);
  const [base, setBase] = React.useState(baseId);
  const flow = useChildFlow({ nodes, initial });
  useEscDeselect(flow, sel, setSel, onClose, !still && push == null);
  const screens = FlowScreens({ flow, lang, still });
  return (
    <div style={{ width: width || "var(--tasty-graph-child-popup-width)", height: height || "var(--tasty-graph-child-popup-height)", maxWidth: "100%",
      display: "flex", flexDirection: "column", overflow: "hidden", boxSizing: "border-box", background: "var(--tasty-bg-panel)",
      borderRadius: "var(--tasty-radius)", border: "var(--tasty-border-width) solid var(--tasty-border-strong)", boxShadow: "var(--tasty-shadow-modal)" }}>
      <div style={{ flex: "none", display: "flex", alignItems: "center", gap: "var(--tasty-space-sm)", cursor: "move",
        height: "var(--tasty-modhint-header-height)", padding: "0 var(--tasty-space-sm) 0 var(--tasty-space-md)",
        background: "var(--tasty-bg-sidebar)", borderBottom: "var(--tasty-border-width) solid var(--tasty-separator)" }}>
        <span style={{ display: "inline-flex", flex: "none", color: "var(--tasty-text-muted)" }}><Icon name="gitBranch" size="var(--tasty-icon-size-sm)" /></span>
        <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "var(--tasty-font-ui)",
          fontSize: "var(--tasty-font-size-body)", fontWeight: "var(--tasty-font-weight-semibold)", color: "var(--tasty-text-primary)" }}>{gt("child_graph.title", lang)}</span>
        <IconButton size="sm" aria-label="Close" title="Close" onClick={onClose}><Icon name="close" /></IconButton>
      </div>
      <GraphPush index={push != null ? push : flow.step} still={still}>
        <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
          <div style={{ flex: "none", display: "flex", alignItems: "center", gap: "var(--tasty-space-sm)", boxSizing: "border-box",
            height: "var(--tasty-graph-toolbar-height)", padding: "0 var(--tasty-space-md)", borderBottom: "var(--tasty-border-width) solid var(--tasty-separator)" }}>
            <Checkbox checked={full} onChange={(e) => setFull(e.target.checked)} label={gt("child_graph.show_full_tree", lang)} />
          </div>
          <ChildGraphView nodes={nodes} baseId={base} full={full} selected={sel} onSelect={setSel} lang={lang} status={status} banner={banner}
            onViewDags={flow.viewDags} onSetBase={(id) => { setBase(id); setSel(null); }} still={still} />
        </div>
        {screens}
      </GraphPush>
    </div>
  );
}

// ── Surface frame ───────────────────────────────────────────────────
// Header (bg-sidebar, 8 / 12 padding — the DAG header's recipe): branch glyph · "Base surface" ·
// base picker (field-width-lg; a sidebar-shaped tree of every window, child_base_picker.jsx) · full tree checkbox · refresh. Under 640 it wraps to two rows like the
// DAG header: base above, checkbox + refresh below. The canvas takes the surface bed.
function ChildGraphSurface({ nodes = CHILD_LARGE, baseId = CHILD_LARGE_BASE, lang = "en", focused, narrow = false, initial = {},
  status = "ready", banner, push, still, style, windows = PICKER_WINDOWS, pickerOpen, pickerQuery }) {
  const bed = focused === undefined ? "var(--tasty-dag-canvas-bg)" : focused ? "var(--tasty-surface-bed-focused)" : "var(--tasty-surface-bed-unfocused)";
  const [full, setFull] = React.useState(!!initial.full);
  const [sel, setSel] = React.useState(initial.selected || null);
  const [base, setBase] = React.useState(status === "base-closed" ? "" : baseId);
  const [pickS, setPickS] = React.useState(false);
  // pickerOpen pins the picker open for a gallery frame; otherwise the surface owns it, so the
  // canvas's Select base surface button can open it.
  const pickOpen = pickerOpen !== undefined ? pickerOpen : pickS;
  const flow = useChildFlow({ nodes, initial });
  useEscDeselect(flow, sel, setSel, undefined, !still && push == null);
  const screens = FlowScreens({ flow, lang, bed, still });
  const header = (
    <div style={{ flex: "none", display: "flex", flexWrap: narrow ? "wrap" : "nowrap", alignItems: "center",
      rowGap: "var(--tasty-space-xs)", columnGap: "var(--tasty-space-sm)", padding: "var(--tasty-space-sm) var(--tasty-space-md)",
      background: "var(--tasty-bg-sidebar)", borderBottom: "var(--tasty-border-width) solid var(--tasty-separator)" }}>
      <span style={{ display: "inline-flex", flex: "none", color: "var(--tasty-text-muted)" }}><Icon name="gitBranch" /></span>
      <span style={{ flex: "none", fontFamily: "var(--tasty-font-ui)", fontSize: "var(--tasty-font-size-caption)", color: "var(--tasty-text-muted)" }}>{gt("child_graph.base_label", lang)}</span>
      <span style={{ flex: narrow ? "1 1 auto" : "none", minWidth: 0, width: narrow ? "auto" : "var(--tasty-field-width-lg)", display: "flex" }}>
        <BasePicker block windows={windows} value={base} lang={lang} open={pickOpen} onOpenChange={pickerOpen !== undefined ? undefined : setPickS}
          query={pickerQuery} onChange={(id) => { setBase(id); setSel(null); }} />
      </span>
      {narrow && <span style={{ flexBasis: "100%", height: 0 }} />}
      <Checkbox checked={full} onChange={(e) => setFull(e.target.checked)} label={gt("child_graph.show_full_tree", lang)} />
      <div style={{ flex: 1 }} />
      <IconButton aria-label="Refresh" title="Refresh"><Icon name="refresh" /></IconButton>
    </div>
  );
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0, overflow: "hidden", background: "var(--tasty-bg-panel)", ...style }}>
      <GraphPush index={push != null ? push : flow.step} still={still}>
        <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
          {header}
          <ChildGraphView nodes={nodes} baseId={base} full={full} selected={sel} onSelect={setSel} lang={lang} bed={bed}
            status={status === "base-closed" && base ? "ready" : status} banner={status === "base-closed" && base ? null : banner}
            onViewDags={flow.viewDags} onSetBase={(id) => { setBase(id); setSel(null); }} onPickBase={() => setPickS(true)} still={still} />
        </div>
        {screens}
      </GraphPush>
    </div>
  );
}

// ── Settings › Misc › Child graph ───────────────────────────────────
// One switch row: the initial state of the full tree checkbox in newly opened child graphs.
// Its own L2 section, because the settings filter matches section labels only.
function ChildGraphSettings({ lang = "en", checked = false }) {
  const c = { label: gt("settings.child_graph.show_full_tree", lang), desc: gt("settings.child_graph.show_full_tree_desc", lang) };
  const [on, setOn] = React.useState(checked);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--tasty-settings-row-caption-gap)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "var(--tasty-settings-label-gap)", minHeight: "var(--tasty-settings-row-min-height)" }}>
        <span style={{ width: "var(--tasty-settings-label-width)", flex: "none", fontSize: "var(--tasty-font-size-body)", color: "var(--tasty-text-secondary)",
          lineHeight: "var(--tasty-line-height-ui)" }}>{c.label}</span>
        <Switch checked={on} onChange={(e) => setOn(e.target.checked)} />
      </div>
      <p style={{ margin: 0, fontSize: "var(--tasty-font-size-caption)", lineHeight: "var(--tasty-line-height-ui)", color: "var(--tasty-text-muted)",
        maxWidth: "var(--tasty-measure-md)", textWrap: "pretty" }}>{c.desc}</p>
    </div>
  );
}

export { ChildNode, ChildDetail, ChildGraphView, MirrorBanner, ChildGraphWindow, ChildGraphSurface, ChildGraphSettings, nameOf,
  CHILD_SMALL, CHILD_SMALL_BASE, CHILD_LARGE, CHILD_LARGE_BASE, CHILD_MIRROR, CHILD_MIRROR_BASE, CHILD_MIRROR_LOST,
  CHILD_CROSS, CHILD_EXTERNAL };

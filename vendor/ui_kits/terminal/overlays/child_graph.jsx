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
import { useDraft } from "./settings_draft.jsx";

// Tasty UI kit — the child graph (2026-11-10). One internal view, two frames:
//   ChildGraphView     canvas + drawer (+ status blocks) — the part both frames share
//   ChildGraphWindow   popup: title bar, 36 toolbar (full tree checkbox), base = the surface it opened from
//   ChildGraphSurface  tab surface: header with the base picker (child_base_picker.jsx) and the checkbox, canvas on the surface bed
// Inside either frame a surface that created DAGs pushes to them: child → list of its DAGs → DAG graph.
// The back bars are DrillDown's (chevron + title, 36). Coming back restores the child view as it was.

// ── Mock trees (shape is what matters; values are illustrative) ─────
const S = (id, over) => ({ id, kind: "surface", state: "active", confidence: "confirmed", evidence: "pty_busy",
  cwd: "~/work/tasty", lastReport: "10:42:07 · 4s ago", workspace: "tasty", ...over });

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
  S("s_d0", { nickname: "director", role: "director", workspace: "agents" }),
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
// across machines (user decision 4-7 to 4-9): A on this computer → B on a remote → C, one graph, ordinary lines
const CHILD_CROSS = [
  S("s_L1", { nickname: "conductor", role: "conductor", workspace: "tasty" }),
  R("s_R1", { parent: "s_L1", nickname: "linux-build", role: "worker", profile: "lab-build" }),
  R("s_R3", { parent: "s_R1", nickname: "linux-check", role: "checker", state: "needs_input", profile: "lab-build", evidence: "hook_needs_input" }),
  R("s_R2", { parent: "s_L1", nickname: "linux-test", role: "tester", state: "idle", profile: "lab-build", evidence: "hook_idle" }),
];
// a chain across three machines: A on this computer → B on lab-build (attached from here) → C and D on
// gpu-box, a machine lab-build attached to: their machine name is lab-build's profile name for it, and the
// query reached them through lab-build (via)
const G = (id, over) => S(id, { remote: true, workspace: "train", profile: "gpu-box", via: ["lab-build"], ...over });
const CHILD_CHAIN = [
  S("s_A1", { nickname: "conductor", role: "conductor", workspace: "tasty" }),
  R("s_B1", { parent: "s_A1", nickname: "linux-build", role: "worker", profile: "lab-build", workspace: "ci" }),
  G("s_C1", { parent: "s_B1", nickname: "trainer", role: "worker", state: "idle", evidence: "hook_idle" }),
  G("s_D1", { parent: "s_C1", nickname: "eval", role: "checker", state: "needs_input", evidence: "hook_needs_input" }),
];
// gap nodes (cross-machine chain, 2026-11-24): where a link of the chain cannot be followed, one gap node
// stands for everything beyond it, with the reason. Nothing past it is guessed, and what was seen beyond it
// before the break is dropped, not kept dimmed. host = the machine the broken link leads to (host text rule).
const GAP = (id, reason, over) => ({ id, kind: "gap", reason, ...over });
// the chain above after lab-build's link to gpu-box dropped: C and D are gone, one gap under B
const CHILD_CHAIN_CUT = [
  CHILD_CHAIN[0], CHILD_CHAIN[1],
  GAP("g_C", "disconnected", { parent: "s_B1", host: "gpu-box", via: ["lab-build"], lastReached: "linux-build · s_B1" }),
];
// disconnected (a mirror with a saved row whose transport dropped; the app keeps it and reconnects): the
// mirrored cards stay, since they are still here, with every state unknown. What lay beyond the mirror —
// the read-only ancestor s_m0, reached only by asking lab-linux — cannot be followed now, so it is dropped
// and folded into one gap node above the mirror's top, on a dashed line (the gap rule).
const CHILD_MIRROR_LOST = [
  GAP("g_m0", "disconnected", { host: "lab-linux", lastReached: "conductor · s_m1" }),
  ...CHILD_MIRROR.filter((n) => n.kind === "surface").map((n) => ({ ...n, state: "unknown", confidence: "unobserved", evidence: "remote_disconnected",
    ...(n.parent === "s_m0" ? { parent: "g_m0" } : {}) })),
];
// a gap on each side: the base's parent cannot be verified (ancestor side), and one child does not answer
const CHILD_GAP_SIDES = [
  GAP("g_up", "unverified", { host: "lab-build", lastReached: "linux-build · s_B1" }),
  R("s_B1", { parent: "g_up", nickname: "linux-build", role: "worker", profile: "lab-build", workspace: "ci" }),
  R("s_B2", { parent: "s_B1", nickname: "linux-test", role: "tester", state: "idle", profile: "lab-build", workspace: "ci", evidence: "hook_idle" }),
  GAP("g_dn", "timeout", { parent: "s_B1", host: "gpu-box", via: ["lab-build"], lastReached: "linux-build · s_B1", nextTry: "in 8s" }),
];
// a loop in the parents (diagnostic only): following worker-a's parents comes back to worker-a, so the
// chain is cut with a cycle gap at the top instead of a line back
const CHILD_GAP_CYCLE = [
  GAP("g_loop", "cycle", { host: "lab-linux", pointsBack: "worker-a · s_m2", lastReached: "orchestrator · s_m0" }),
  R("s_m0", { parent: "g_loop", nickname: "orchestrator", role: "director" }),
  R("s_m1", { parent: "s_m0", nickname: "conductor", role: "conductor" }),
  R("s_m2", { parent: "s_m1", nickname: "worker-a", role: "worker" }),
];
// reasons, in the order the specs list them; stale and malformed share one label
const GAP_REASONS = ["disconnected", "timeout", "unsupported", "refused", "limit", "stale", "malformed", "gone", "pending", "cycle"];
const GAP_LOOK = {
  disconnected: { key: "disconnected", glyph: "globeOff" }, timeout: { key: "timeout", glyph: "globeOff" },
  unsupported: { key: "unsupported", glyph: "alertCircle" }, refused: { key: "refused", glyph: "lock" },
  limit: { key: "limit", glyph: "more" }, stale: { key: "unverified", glyph: "helpCircle" }, malformed: { key: "unverified", glyph: "helpCircle" },
  unverified: { key: "unverified", glyph: "helpCircle" }, gone: { key: "gone", glyph: "paneEmpty" }, pending: { key: "pending", glyph: null },
  cycle: { key: "cycle", glyph: "alertTriangle" },
};
const gapLook = (reason) => GAP_LOOK[reason] || GAP_LOOK.disconnected;
// external parent (user decision 2026-11-10): its own card at the root, nothing traced beyond the key
const CHILD_EXTERNAL = [
  { id: "codex:019a5c2e-7f3b", kind: "external" },
  S("s_e1", { parent: "codex:019a5c2e-7f3b", parentExternal: "codex:019a5c2e-7f3b", nickname: "helper", role: "worker" }),
  S("s_e2", { parent: "s_e1", nickname: "lint", role: "worker", state: "idle", evidence: "hook_idle" }),
];

const DAG_BY_ID = Object.fromEntries(DAG_LIST.map((e) => [e.dag.id, e]));
const nameOf = (n) => (n.kind === "external" ? n.id : n.kind === "gap" ? gt(`child_graph.gap.${gapLook(n.reason).key}`) : n.nickname || n.role || n.id);

// ── Card ────────────────────────────────────────────────────────────
// The DAG card's box (168 × 48, bar, two rows, LOD tiers, ring, hover wash) with child content:
//   name row  terminal glyph (remote glyph on a mirrored surface) · nickname, else role, else id
//   meta row  state glyph (mono) · STATE (font-label, a status word) · surface id (mono, right); on a card from another machine the machine's
//             name takes the id's place (the host text: the profile name, else the Remote word in the
//             label font), at most half the row, so B and C of A → B → C read apart at full LOD
// base: a chip ABOVE the card, outside the box, so it never competes with the state colour or the
// selection ring and survives every LOD tier. external / remote-ancestor: dashed border, no bar.
// gap: the same box, dashed like the other cards that are not a surface here, no bar, no state colour.
//   name row  reason glyph (a spinner while pending) · reason label
//   meta row  the machine the broken link leads to (host text), muted
//   compact: name row only · block: the dashed box with the glyph centred. Selectable: its drawer
//   says why and what is around it, and has no actions (user decision 11-24: no Retry).
function GapNode({ node, lod, selected, lang, onSelect }) {
  const look = gapLook(node.reason);
  const label = gt(`child_graph.gap.${look.key}`, lang);
  const host = node.host || gt("attach.mirror_pill_label", lang);
  const ink = "var(--tasty-dag-node-meta-fg)";
  const glyph = look.glyph ? <Icon name={look.glyph} size="var(--tasty-icon-size-sm)" /> : <Spinner size="var(--tasty-icon-size-xs)" label={label} />;
  const tip = `${label} — ${host}`;
  const box = {
    position: "absolute", boxSizing: "border-box", textAlign: "left", cursor: "pointer", fontFamily: "var(--tasty-font-ui)",
    width: "var(--tasty-dag-node-width)", height: "var(--tasty-dag-node-height)", padding: 0,
    display: "flex", alignItems: lod === "block" ? "center" : "stretch", justifyContent: lod === "block" ? "center" : "flex-start",
    borderRadius: "var(--tasty-dag-node-radius)", border: "var(--tasty-border-width) dashed var(--tasty-dag-node-border)",
    background: "var(--tasty-dag-node-bg)", color: "var(--tasty-dag-node-fg)",
    outline: selected ? "var(--tasty-dag-node-selected-ring-width) solid var(--tasty-dag-node-selected-ring)" : "none", outlineOffset: "var(--tasty-dag-node-selected-ring-offset)",
  };
  return (
    <span style={{ position: "relative", display: "block" }}>
      <button type="button" aria-label={tip} title={tip} onClick={() => onSelect && onSelect(node.id)} style={box}>
        {lod === "block" ? (
          <span style={{ display: "inline-flex", alignItems: "center", color: ink }}>{glyph}</span>
        ) : (
          <>
            <span style={{ flex: "none", width: "var(--tasty-dag-node-bar-width)" }} />
            <span style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", justifyContent: "center",
              gap: "var(--tasty-dag-node-row-gap)", padding: "var(--tasty-dag-node-padding-y) var(--tasty-dag-node-padding-x)" }}>
              <span style={{ display: "flex", alignItems: "center", gap: "var(--tasty-dag-node-gap)", minWidth: 0 }}>
                <span style={{ flex: "none", display: "inline-flex", color: ink }}>{glyph}</span>
                <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  fontSize: "var(--tasty-dag-node-name-font-size)", fontWeight: "var(--tasty-font-weight-medium)" }}>{label}</span>
              </span>
              {lod === "full" && (
                <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: ink,
                  fontSize: "var(--tasty-dag-node-meta-font-size)", fontFamily: node.host ? "var(--tasty-font-mono)" : "var(--tasty-font-label)" }}>{host}</span>
              )}
            </span>
          </>
        )}
      </button>
    </span>
  );
}

function ChildNode({ node, lod = "full", selected = false, base = false, hover, lang = "en", onSelect }) {
  const [hotState, setHot] = React.useState(false);
  const hot = hover != null ? hover : hotState;
  if (node.kind === "gap") return <GapNode node={node} lod={lod} selected={selected} lang={lang} onSelect={onSelect} />;
  const special = node.kind && node.kind !== "surface";
  const st = special ? null : childTone(node.state);
  const accent = special ? "var(--tasty-dag-node-border)" : st.tok;
  const name = nameOf(node);
  const monoName = node.kind === "external" || (!special && !node.nickname && !node.role);
  const icon = node.kind === "external" ? "link" : node.remote || node.kind === "remote-ancestor" ? "remote" : "terminal";
  const iconInk = node.remote || node.kind === "remote-ancestor" ? "var(--tasty-accent-remote-raised)" : special ? "var(--tasty-dag-node-meta-fg)" : "var(--tasty-dag-node-meta-status-fg)";
  const label = special ? (node.kind === "external" ? gt("child_graph.card.external", lang) : node.kind === "remote-ancestor" ? gt("child_graph.card.not_attached", lang) : null) : gt(st.key, lang);
  const other = node.remote || node.kind === "remote-ancestor";
  const host = other ? (node.profile || null) : null;
  // On a card from another machine the id leaves the meta row for the machine's name, so the tooltip and the
  // accessible name carry both: name — STATE — machine — id.
  const tip = [name, label, other ? host || gt("attach.mirror_pill_label", lang) : null, other && node.id !== name ? node.id : null].filter(Boolean).join(" — ");
  const box = {
    position: "absolute", boxSizing: "border-box", textAlign: "left",
    width: "var(--tasty-dag-node-width)", height: "var(--tasty-dag-node-height)",
    display: "flex", alignItems: "stretch", padding: 0, cursor: "pointer",
    borderRadius: "var(--tasty-dag-node-radius)",
    border: `var(--tasty-border-width) ${special ? "dashed" : "solid"} ${special || st.plain ? "var(--tasty-dag-node-border)" : accent}`,
    background: special ? "var(--tasty-dag-node-bg)" : st.bg,
    outline: selected ? "var(--tasty-dag-node-selected-ring-width) solid var(--tasty-dag-node-selected-ring)" : "none",
    outlineOffset: "var(--tasty-dag-node-selected-ring-offset)",
    opacity: !special && st.dim ? "var(--tasty-dag-node-dim-opacity)" : 1,
    fontFamily: "var(--tasty-font-ui)", color: "var(--tasty-text-on-active)",
  };
  const chip = base && (
    <span style={{ position: "absolute", left: 0, top: "calc(-1 * (var(--tasty-graph-base-chip-height) + var(--tasty-graph-base-chip-gap)))",
      height: "var(--tasty-graph-base-chip-height)", padding: "0 var(--tasty-graph-base-chip-padding-x)", boxSizing: "border-box",
      display: "inline-flex", alignItems: "center", borderRadius: "var(--tasty-radius-sm)", whiteSpace: "nowrap",
      border: "var(--tasty-border-width) solid var(--tasty-border-default)", background: "var(--tasty-bg-sidebar)",
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
          style={{ ...box, background: special ? "var(--tasty-dag-node-bg)" : st.blk, borderColor: accent }} />
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
                textTransform: "uppercase", fontFamily: "var(--tasty-font-label)", color: special ? "var(--tasty-dag-node-meta-fg)" : st.lbl }}>{label}</span>
              {node.kind !== "external" && !other && (
                <span style={{ flex: "none", fontFamily: "var(--tasty-font-mono)", letterSpacing: "var(--tasty-letter-spacing-ui)",
                  color: special ? "var(--tasty-dag-node-meta-fg)" : "var(--tasty-dag-node-meta-status-fg)" }}>{node.id.replace(/^s_/, "s_").slice(0, 8)}</span>
              )}
              {other && (
                <span style={{ flex: "0 0 auto", maxWidth: "50%", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  textTransform: "none", letterSpacing: host ? "var(--tasty-letter-spacing-ui)" : "normal",
                  fontFamily: host ? "var(--tasty-font-mono)" : "var(--tasty-font-label)",
                  color: special ? "var(--tasty-dag-node-meta-fg)" : "var(--tasty-dag-node-meta-status-fg)" }}>{host || gt("attach.mirror_pill_label", lang)}</span>
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
// DAGs (user decisions 4-5, 10-2 a): one button, and it opens the list of them first, one DAG or several.
function ChildDetail({ node, isBase, lang = "en", onViewDags, onSetBase, onClose, cover }) {
  const title = node.kind === "external" ? node.id : node.nickname || node.id;
  const mono = node.kind === "external" || !node.nickname;
  const closeLabel = gt("dag.detail.close", lang);
  if (node.kind === "gap") {
    const key = gapLook(node.reason).key;
    return (
      <GraphDrawer title={gt(`child_graph.gap.${key}`, lang)} onClose={onClose} closeLabel={closeLabel} cover={cover}>
        <DrawerCaption>{gt(`child_graph.gap.${key}_note`, lang)}</DrawerCaption>
        <DrawerRows>
          {node.lastReached && <DrawerRow k={gt("child_graph.drawer.last_reached", lang)} v={node.lastReached} mono />}
          {node.pointsBack && <DrawerRow k={gt("child_graph.drawer.points_back_to", lang)} v={node.pointsBack} mono />}
          {node.host && <DrawerRow k={gt("child_graph.drawer.attach_profile", lang)} v={node.host} mono />}
          {node.via && node.via.length > 0 && <DrawerRow k={gt("child_graph.drawer.via", lang)} v={node.via.join(" › ")} mono />}
          {node.nextTry && <DrawerRow k={gt("child_graph.drawer.next_try", lang)} v={node.nextTry} mono />}
        </DrawerRows>
      </GraphDrawer>
    );
  }
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
  // the attach profile name (R-57); with no profile name the row is absent (the card's
  // remote glyph says remote); never 127.0.0.1:<port>
  const attach = node.remote || ancestor ? node.profile : null;
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
        {node.via && node.via.length > 0 && <DrawerRow k={gt("child_graph.drawer.via", lang)} v={node.via.join(" › ")} mono />}
        {!ancestor && <DrawerRow k={gt("child_graph.drawer.evidence", lang)} v={node.evidence} mono />}
        {!ancestor && <DrawerRow k={gt("child_graph.drawer.last_report", lang)} v={node.lastReport} mono />}
        {!ancestor && <DrawerRow k={gt("child_graph.drawer.cwd", lang)} v={node.cwd} mono wrap />}
      </DrawerRows>
    </GraphDrawer>
  );
}

// ── Shared view ─────────────────────────────────────────────────────
// status: "ready" | "loading" | "empty" | "base-closed" | "unsupported" (remote Tasty too old)
// base-closed is the surface form's state only (4-4); its Select base surface button opens the picker through
// onPickBase and is drawn disabled when no onPickBase is given, so it never reads as a live button with no action.
// host: the host text rule (attach profile name); empty for an attach with no profile name, which
// takes the _no_host hint (the word Remote is not put in the sentence; never 127.0.0.1:<port>).
// Proposal: the app has no remote strip or hint yet; the _no_host keys go in with them.
function ChildGraphView({ nodes, baseId, full = false, selected, onSelect, lang = "en", bed, banner, status = "ready",
  onViewDags, onSetBase, onPickBase, host = "lab-linux", still, initialZoom }) {
  const shown = React.useMemo(() => childVisible(nodes, baseId, full), [nodes, baseId, full]);
  const g = React.useMemo(() => childLayout(shown), [shown]);
  const edges = React.useMemo(() => childEdges(shown, g), [shown, g]);
  const wrap = (child) => <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", background: bed || "var(--tasty-dag-canvas-bg)" }}>{banner}{child}</div>;
  if (status === "loading") return wrap(<DagEmpty loading copy={{ title: gt("graph.loading", lang) }} />);
  if (status === "unsupported") return wrap(<DagEmpty copy={{ icon: "remote", title: gt("graph.remote_unsupported", lang), body: host ? gt("graph.remote_unsupported_hint", lang, host) : gt("graph.remote_unsupported_hint_no_host", lang) }} />);
  if (status === "base-closed") return wrap(<DagEmpty copy={{ icon: "paneEmpty", title: gt("child_graph.empty.base_closed", lang), body: gt("child_graph.empty.base_closed_hint", lang) }}
    action={<Button size="sm" variant="secondary" disabled={!onPickBase} onClick={onPickBase}>{gt("child_graph.empty.pick_base", lang)}</Button>} />);
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

// ── Mirror banner (user decisions 2026-11-10, 13-2 to 13-5 of 2026-11-11) ──
// The banner is for a base that is GONE here, and only for the two ways the app ends a mirror while
// the base was on it:
//   "detached" — the user closed the mirror or disconnected it (neutral band; the app shows no toast).
//     With a saved row, Reconnect attaches again; with none, it is disabled.
//   "lost" — a mirror with NO saved row ended for a remote reason: transport drop, forced disconnect,
//     a failed resync or a failed resync reattach (warning band; the app also shows the window toast
//     attach.toast.mirror_disconnected). A mirror with a saved row never ends this way — the app keeps
//     it and reconnects — so "lost" always has Reconnect disabled, whatever `saved` says.
// Not this banner: a drop of a mirror with a saved row (the app reconnects with no toast; the graph
// keeps the mirrored cards, state unknown, under the graph.remote_disconnected strip and folds what lay
// beyond the mirror into a disconnected gap node: CHILD_MIRROR_LOST), a resync reattach still in progress
// (nothing of its own; it ends as the graph was or as "lost"), and a workspace the server closed (the
// app's own toast; the base surface is closed, so the surface form shows its base-closed state, 4-4).
// The surface shows this strip over the "pick a base surface" state. Reconnect attaches again through
// the saved remote workspace row (its profile) to the same remote surface:
//   state "idle" → Reconnect · "trying" → disabled Reconnecting… with a spinner ·
//   "failed" → the reason sentence (warning) and Reconnect again (13-4 a). reason:
//   "unreachable" (could not reach Tasty there) · "surface_gone" (closed there, or moved to another
//   workspace there, 13-3 a) · "held" (another client holds it, 13-5 a: the reason only, no force
//   detach button or prompt).
// saved = the mirror belongs to a saved remote workspace row. With none (--ssh, --target-port, a
// hand-installed attach) there is nothing to reattach with — the app's reconnect state is keyed by the
// saved row — so Reconnect stays in place, disabled, its tooltip child_graph.reconnect_unavailable, and
// trying / failed never occur. The row, not the profile name, decides: a hand-installed attach keeps its
// profile name with no saved row (the host is named, Reconnect still disabled), and a row saved with an
// empty name has Reconnect with the no-host sentences.
// host follows the host text rule: the attach profile name; empty (no profile name) takes the
// _no_host sentence, which leaves the host out, and an empty saved profile name takes
// reconnect_tooltip_no_host. Never 127.0.0.1:<port>. A proposal: the app has no banner yet.
function MirrorBanner({ cause = "detached", state = "idle", reason = "unreachable", host = "lab-linux", name = "worker-a", profile = "lab-linux",
  saved = true, lang = "en", onReconnect }) {
  const nh = host ? "" : "_no_host";
  const H = host ? [host] : [];
  const canReconnect = saved && cause !== "lost";
  const failed = canReconnect && state === "failed";
  const text = failed
    ? (reason === "unreachable" ? gt(`child_graph.reconnect_failed.unreachable${nh}`, lang, ...H) : gt(`child_graph.reconnect_failed.${reason}${nh}`, lang, name, ...H))
    : gt((cause === "lost" ? "child_graph.mirror_lost" : "child_graph.mirror_detached") + nh, lang, ...H, name);
  const tip = profile ? gt("child_graph.reconnect_tooltip", lang, name, profile) : gt("child_graph.reconnect_tooltip_no_host", lang, name);
  const action = !canReconnect
    ? <span title={gt("child_graph.reconnect_unavailable", lang)} style={{ display: "inline-flex" }}><Button size="sm" variant="secondary" disabled>{gt("child_graph.reconnect", lang)}</Button></span>
    : state === "trying"
      ? <Button size="sm" variant="secondary" disabled leadingIcon={<Spinner size="var(--tasty-icon-size-xs)" />}>{gt("child_graph.reconnecting", lang)}</Button>
      : <Button size="sm" variant="secondary" title={tip} onClick={onReconnect}>{gt("child_graph.reconnect", lang)}</Button>;
  return <GraphStrip tone={cause === "lost" || failed ? "warning" : "info"} action={action}>{text}</GraphStrip>;
}

// ── Remote restarted notice (user decision 13-2 a) ──────────────────
// Reconnect found Tasty on the remote restarted (another instance) with the same surface id
// restored: the banner goes, the graph comes back on that base, and this info strip takes the
// banner's place at the canvas top, so nothing moves. It stays until dismissed (×), another base
// is picked, or the base is lost again; it is not timed, since the graph under it may have
// changed with the restart and the user should be able to read why.
function RestartNotice({ host = "lab-linux", name = "worker-a", lang = "en", onDismiss }) {
  const text = host ? gt("child_graph.remote_restarted", lang, host, name) : gt("child_graph.remote_restarted_no_host", lang, name);
  const dismiss = gt("child_graph.notice_dismiss", lang);
  return (
    <GraphStrip tone="info" action={<IconButton size="sm" aria-label={dismiss} title={dismiss} onClick={onDismiss}><Icon name="close" /></IconButton>}>{text}</GraphStrip>
  );
}

// ── Push screens shared by both frames ──────────────────────────────
// child → list of the DAGs that surface created → DAG graph (user decisions 4-5 and 10-2 a: the
// list comes first even with one DAG). Back: graph → list → child graph.
function useChildFlow({ nodes, initial = {} }) {
  const [owner, setOwner] = React.useState(initial.owner ? nodes.find((n) => n.id === initial.owner) : null);
  const [dagId, setDagId] = React.useState(initial.dagId || null);
  const [dagSel, setDagSel] = React.useState(initial.dagSel || null);
  const ownerDags = owner ? (owner.dags || []).map((id) => DAG_BY_ID[id]).filter(Boolean) : [];
  const viewDags = (node) => { setOwner(node); setDagId(null); setDagSel(null); };
  const back = () => { if (dagId) { setDagId(null); setDagSel(null); } else { setOwner(null); } };
  const step = !owner ? 0 : !dagId ? 1 : 2;
  return { owner, ownerDags, dagId, viaList: true, dagSel, setDagSel, setDagId, viewDags, back, step };
}
// Esc clears the selection of the screen in front, as the DAG surface does (dag_surfaces.jsx), and the
// drawer closes with it. On a pushed step with nothing selected it goes back one step. On the child
// graph with nothing selected the popup passes onIdle: close when it is fitted in its surface, collapse
// (back to the fit judgement, everything kept) when it is shown over the window; the surface stays.
// A frozen gallery frame (still, or a pinned push step) does not listen: one Esc anywhere on the page
// would otherwise step every such frame back to an empty screen.
// gate (optional): Esc reaches this screen only while gate() is true — the popup passes "holds key focus".
function useEscDeselect(flow, sel, setSel, onIdle, enabled = true, gate) {
  const ref = React.useRef(null);
  ref.current = () => {
    if (gate && !gate()) return;
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
  const { owner, ownerDags, dagId, dagSel, setDagSel, setDagId, back } = flow;
  const screens = [];
  if (owner) {
    screens.push(
      <DrillDown key="list" view="detail" title={gt("child_graph.dag_list_title", lang, nameOf(owner))} backLabel={gt("child_graph.back", lang)}
        onBack={() => back()} detail={<ListCtrl items={dagRowItems(ownerDags)} onSelect={(id) => { setDagId(id); setDagSel(null); }} />} />
    );
  }
  const entry = dagId ? DAG_BY_ID[dagId] : null;
  if (owner && entry) {
    screens.push(
      <DrillDown key="dag" view="detail" backLabel={gt("dag_list.back", lang)} onBack={() => back()}
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
// 600 × 460 (three columns at 100%), min 360 × 280 like the DAG popup. Title bar 28 (drag; its last button
// sits popup-title-edge-inset 4 from the right edge, as every popup title bar),
// toolbar 36 with the full tree checkbox — the same height as the back bar it trades places with.
// Base = the surface the popup opened from; the chip on its card says so. No base selector here.
// The popup is scoped to its base surface (10-3 b): it closes with it, so it has no base-closed state. This is
// the app's common popup rule: before each frame it looks up the popup's target surface and closes a popup whose
// target is gone (TargetGone). Given status="base-closed" the kit stands for that closed popup: it draws nothing
// and hears no key, holds no key focus and tracks none. When its needed size is larger
// than the surface bounds (the rect less min(space-sm, w/2, h/2) on every side) it collapses to the common
// show button (Dialogs › Collapse). collapse = the form shown
// over the window after the show button: the shrink button comes first in the title bar, before close.
// Collapsing and expanding change nothing inside: selection, zoom, pan, drawer and push step stay.
// folded: the popup is collapsed to its show button — nothing of it is drawn and it hears no Esc, but it stays
// mounted, so selection, zoom, pan, drawer and push step are where they were when it is shown again; a push
// in progress ends where it was going, with no motion replayed.
// cut = { w, h }: the frame fitted to a window smaller than the popup (user decision 11-19). The title
// bar takes the fitted width with its buttons whole; the content below keeps the popup's size
// (width × height) and is cut at the right and the bottom, as the app does for every popup.
function ChildGraphWindow({ nodes = CHILD_SMALL, baseId = CHILD_SMALL_BASE, lang = "en", width, height, initial = {},
  status = "ready", banner, push, still, onClose, collapse = false, onCollapse, folded = false, cut = null }) {
  const [full, setFull] = React.useState(!!initial.full);
  const [sel, setSel] = React.useState(initial.selected || null);
  const [base, setBase] = React.useState(baseId);
  const flow = useChildFlow({ nodes, initial });
  // Key focus, as the app routes it: Esc goes only to the popup that holds focus. A press or focus inside the
  // frame gives it focus, one outside takes it away; showing the popup again from its show button moves key
  // focus into it (the button had it), so the next Esc reaches it.
  const rootRef = React.useRef(null);
  const focused = React.useRef(false);
  const gone = status === "base-closed"; // closed with its base surface: no Esc, no focus tracking
  React.useEffect(() => {
    if (gone) focused.current = false;
    if (still || push != null || gone) return undefined;
    const h = (e) => { focused.current = !!(rootRef.current && rootRef.current.contains(e.target)); };
    document.addEventListener("mousedown", h, true);
    document.addEventListener("focusin", h, true);
    return () => { document.removeEventListener("mousedown", h, true); document.removeEventListener("focusin", h, true); };
  }, [still, push, gone]);
  const wasFolded = React.useRef(folded);
  React.useEffect(() => {
    if (wasFolded.current && !folded && rootRef.current) rootRef.current.focus();
    wasFolded.current = folded;
  }, [folded]);
  useEscDeselect(flow, sel, setSel, collapse ? onCollapse : onClose, !still && push == null && !folded && !gone,
    // checked when Esc arrives: the frame must still be on the page, since the effects that drop the listener
    // and the focus flag run only after the commit that removed it
    () => focused.current && !!rootRef.current && rootRef.current.isConnected);
  const screens = FlowScreens({ flow, lang, still });
  if (gone) return null;
  return (
    <div ref={rootRef} tabIndex={-1} lang={lang} style={{ outline: "none", display: folded ? "none" : "flex", width: cut ? cut.w : width || "var(--tasty-graph-child-popup-width)", height: cut ? cut.h : height || "var(--tasty-graph-child-popup-height)", maxWidth: "100%",
      flexDirection: "column", overflow: "hidden", boxSizing: "border-box", background: "var(--tasty-bg-panel)",
      borderRadius: "var(--tasty-radius)", border: "var(--tasty-border-width) solid var(--tasty-border-frame)", boxShadow: "var(--tasty-shadow-modal)" }}>
      <div style={{ flex: "none", display: "flex", alignItems: "center", gap: "var(--tasty-space-sm)", cursor: "move",
        height: "var(--tasty-modhint-header-height)", padding: "0 var(--tasty-popup-title-edge-inset) 0 var(--tasty-space-md)",
        background: "var(--tasty-bg-sidebar)", borderBottom: "var(--tasty-border-width) solid var(--tasty-separator)" }}>
        <span style={{ display: "inline-flex", flex: "none", color: "var(--tasty-text-muted)" }}><Icon name="gitBranch" size="var(--tasty-icon-size-sm)" /></span>
        <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "var(--tasty-font-ui)",
          fontSize: "var(--tasty-font-size-body)", fontWeight: "var(--tasty-font-weight-semibold)", color: "var(--tasty-text-primary)" }}>{gt("child_graph.title", lang)}</span>
        <span style={{ flex: "none", display: "inline-flex", alignItems: "center", gap: "var(--tasty-popup-title-btn-gap)" }}>
          {collapse && <IconButton size="sm" aria-label={gt("popup.collapse_button.label", lang)} title={gt("popup.collapse_button.tooltip", lang)} data-popup-collapse="" onClick={onCollapse}><Icon name="shrink" /></IconButton>}
          <IconButton size="sm" aria-label="Close" title="Close" onClick={onClose}><Icon name="close" /></IconButton>
        </span>
      </div>
      <CutBody cut={cut} width={width} height={height}>
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
      </CutBody>
    </div>
  );
}
// The content under the title bar: as it is, or (cut) laid out at the body size the popup has when it is
// not fitted — its frame (width × height, else the default 600 × 460) less the two borders and the title
// bar — inside a box that cuts it at the fitted frame's right and bottom edges. The app does the same: the
// fitted content rect plus what the frame lost (draw.rs expanded_overflow) is the original body.
const px = (v) => (typeof v === "number" ? `${v}px` : v);
function CutBody({ cut, width, height, children }) {
  if (!cut) return children;
  const frameW = width != null ? px(width) : "var(--tasty-graph-child-popup-width)";
  const frameH = height != null ? px(height) : "var(--tasty-graph-child-popup-height)";
  return (
    <div style={{ flex: 1, minHeight: 0, overflow: "hidden", display: "flex" }}>
      <div style={{ flex: "none", display: "flex", flexDirection: "column", boxSizing: "border-box",
        width: `calc(${frameW} - 2 * var(--tasty-border-width))`,
        height: `calc(${frameH} - var(--tasty-modhint-header-height) - 2 * var(--tasty-border-width))` }}>{children}</div>
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
  const [on, setOn] = useDraft("misc.childGraph.showFullTree", checked);
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

export { ChildNode, ChildDetail, ChildGraphView, MirrorBanner, RestartNotice, ChildGraphWindow, ChildGraphSurface, ChildGraphSettings, nameOf,
  CHILD_SMALL, CHILD_SMALL_BASE, CHILD_LARGE, CHILD_LARGE_BASE, CHILD_MIRROR, CHILD_MIRROR_BASE, CHILD_MIRROR_LOST,
  CHILD_CROSS, CHILD_CHAIN, CHILD_CHAIN_CUT, CHILD_GAP_SIDES, CHILD_GAP_CYCLE, GAP_REASONS, CHILD_EXTERNAL };

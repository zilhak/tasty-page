import React from "react";
import { Section, Spec, Stage, Meta, Note, Do, Dont, Views, View } from "../parts/specimen.jsx";
import { ThemePair } from "../parts/theme-frame.jsx";
import { DagEmpty, DagSurface, DagWindow, DAG_BUILD, DAG_INDEX } from "../../ui_kits/terminal/dag.js";
import { GraphStrip } from "../../ui_kits/terminal/overlays/graph_view.jsx";
import { ChildGraphView, ChildGraphWindow, CHILD_SMALL, CHILD_SMALL_BASE, CHILD_LARGE, CHILD_LARGE_BASE, CHILD_MIRROR_LOST, CHILD_MIRROR_BASE } from "../../ui_kits/terminal/overlays/child_graph.jsx";
import { gt } from "../../ui_kits/terminal/overlays/graph_copy.js";

// Tasty Gallery — Surfaces · Task DAG › Graph view (2026-11-10).
// The child graph and the Task DAG are one graph component (ui_kits/terminal/overlays/graph_view.jsx).
// This file holds what both graphs share: the canvas, the drawer laid over it, the narrow rule and the
// status blocks. The child graph's own specimens are in child-graph.jsx.

const cap = { fontFamily: "var(--tasty-font-mono)", fontSize: "var(--tasty-font-size-micro)", color: "var(--tasty-text-muted)" };

export function Frame({ label, w, h, children, style }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--tasty-space-xs)", minWidth: 0, flex: "none" }}>
      {label && <span style={cap}>{label}</span>}
      <div style={{ position: "relative", width: w, height: h, maxWidth: "100%", display: "flex", flexDirection: "column", overflow: "hidden",
        boxSizing: "border-box", border: "var(--tasty-border-width) solid var(--tasty-border-strong)", borderRadius: "var(--tasty-radius)",
        background: "var(--tasty-bg-panel)", ...style }}>{children}</div>
    </div>
  );
}

// A child view with its own selection, for frames that are not a whole popup or surface.
export function ChildView(props) {
  const [sel, setSel] = React.useState(props.selected || null);
  return <ChildGraphView {...props} selected={sel} onSelect={setSel} />;
}

const row = (children) => (
  <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--tasty-space-lg)", alignItems: "flex-start" }}>{children}</div>
);

export function GraphSharedSection() {
  return (
    <Section id="graph" title="Graph view · shared">
      <Spec id="graph-view-one-component-two-graphs" title="One graph component, two graphs"
        when={<>The child graph and the Task DAG are <b>one component</b>: the same canvas (bed, dot grid, pan, zoom 20–150%, fit capped at 100%), the same elbow edge with a 4px corner and an arrow at the target, the same 168 × 48 card box with its LOD tiers, selection ring and hover wash, the same zoom cluster, minimap and LOD chip, the same drawer, the same status blocks. What differs is passed in: the layout (DAG top-down by dependency layer, child <b>left → right</b> by depth), the card content, the edge colours and the drawer body.</>}>
        <Stage style={{ padding: 16, display: "block" }}>
          {row(<>
            <Frame label="child graph — left → right, direction button disabled" w={560} h={300}><ChildView nodes={CHILD_SMALL} baseId={CHILD_SMALL_BASE} /></Frame>
            <Frame label="Task DAG — top-down, direction button live" w={560} h={300}><DagSurface dags={[DAG_INDEX]} /></Frame>
          </>)}
        </Stage>
        <Meta
          specs={[["shared", "canvas · elbow edge · card box + LOD + ring + hover · zoom cluster · minimap · LOD chip · drawer · status blocks · back bar"], ["per graph", "layout · card content · edge colour · drawer body · header"], ["child layout", "tidy tree: depth = column (168 + 32), leaves take rows (48 + 24), a parent centres on its children"], ["child flow", "fixed left → right (decision 3)"], ["poll", "state repaints, never moves a card — layout reads ids and parents only"]]}
          tokens={[{ tok: "--tasty-dag-layer-gap", use: "32 between columns, both graphs" }, { tok: "--tasty-dag-sibling-gap", use: "24 between rows, both graphs" }, { tok: "--tasty-dag-node-width", use: "168 card, both graphs" }, { tok: "--tasty-dag-canvas-bg", use: "popup canvas", color: "var(--tasty-dag-canvas-bg)" }]} />
        <Note><b>Tokens.</b> The shared parts keep their <code>dag-*</code> names (tokens are never renamed); the child graph reads them as they are. What the shared component gained is new under <code>graph-*</code>: the drawer, the push, the popup toolbar, the child popup size and the base chip. No new colour.</Note>
      </Spec>

      <Spec id="graph-drawer-over-the-canvas" title="Selected node — the drawer over the canvas"
        when={<>Clicking a card selects it and opens a <b>288px drawer from the right edge, over the canvas</b>. The canvas never shrinks or moves its frame. The drawer is a floating surface with no scrim, so it takes <span className="tok">--tasty-shadow-popover</span>; its left edge is the 1px detail border. The head (36) holds the title and the close button and stays put while the body scrolls. Clicking empty canvas, <span className="ic">Esc</span> or the close button clears the selection and closes it; clicking another card swaps the body in place. The zoom cluster and minimap <b>move left of the drawer</b> instead of hiding under it; the minimap follows its 560 rule on the canvas left uncovered. When the drawer opens over the selected card, the view <b>pans just enough</b> to put the card 16px left of the drawer edge — pan only, never zoom, never re-layout. The same drawer holds the DAG task detail, in the surface and in the popup: the bottom sheet and the side panel that split the canvas are gone.</>}>
        <Stage style={{ padding: 16, display: "block" }}>
          {row(<>
            <Frame label="child drawer — the builder card selected" w={720} h={420}><ChildView nodes={CHILD_SMALL} baseId={CHILD_SMALL_BASE} selected="s_01HX7Q" /></Frame>
            <Frame label="DAG drawer — tab surface, a failed task selected" w={720} h={420}><DagSurface dags={[DAG_BUILD]} initialSelected="build_linux" /></Frame>
          </>)}
        </Stage>
        <Views>
          <View name="graph-drawer-themes" label="Mocha and Latte">
            <ThemePair render={() => <Frame w="100%" h={360}><ChildView nodes={CHILD_LARGE} baseId={CHILD_LARGE_BASE} selected="s_w23" /></Frame>} />
          </View>
          <View name="dag-popup-drawer" label="DAG popup — graph step with the drawer">
            <div style={{ position: "relative", height: 520, background: "var(--tasty-bg-app)" }}>
              <DagWindow initialOpen="build-and-deploy" initialSelected="build_linux" />
            </div>
          </View>
        </Views>
        <Meta
          specs={[["width", "288 — graph-drawer-width"], ["height", "the canvas's, top to bottom"], ["head", "36 · title semibold 13 · close IconButton sm · separator below"], ["body", "12 padding · 12 between groups · scrolls"], ["edge", "1px dag-detail-border on the left · shadow-popover"], ["open / close", "slides from the right edge, motion-ui 120 · reduced motion: instant"], ["swap", "another card: body swaps at once, no slide"], ["chrome", "zoom cluster + minimap shift left by 288 · LOD chip stays bottom-left"], ["reveal", "pan so the selected card sits 16 left of the drawer"], ["input", "drawer area is outside canvas pan and select"]]}
          tokens={[{ tok: "--tasty-graph-drawer-width", use: "288 → dag-detail-width" }, { tok: "--tasty-graph-drawer-head-height", use: "36 → back bar height" }, { tok: "--tasty-graph-drawer-motion", use: "120 → motion-ui" }, { tok: "--tasty-graph-reveal-margin", use: "16" }, { tok: "--tasty-dag-detail-bg", use: "drawer fill", color: "var(--tasty-dag-detail-bg)" }, { tok: "--tasty-dag-detail-border", use: "left edge", color: "var(--tasty-dag-detail-border)" }, { tok: "--tasty-shadow-popover", use: "floating, no scrim" }]} />
        <Do>Keep the canvas whole. A drawer that floats over it keeps every card where the user left it; a panel that shrinks the canvas re-frames the graph on every selection.</Do>
        <Dont>Do not dim the canvas under the drawer or add a scrim: the canvas stays live, and clicking another card is how you compare nodes.</Dont>
      </Spec>

      <Spec id="graph-drawer-narrow-and-popup-minimum" title="Narrow canvas — the drawer covers it"
        when={<>Below <b>480px of canvas width</b> a 288 drawer leaves less than one card (168) beside it with 12px on each side, so the drawer <b>covers the whole canvas</b>: same frame, full width, no shadow and no left edge (nothing shows beside it). Close or <span className="ic">Esc</span> returns to the canvas. Between 480 and 560 it stays 288 beside the canvas and the minimap drops. This one rule replaces the old 640 bottom-sheet switch, and it holds at the popup minimum 360 × 280.</>}>
        <Stage style={{ padding: 16, display: "block" }}>
          {row(<>
            <Frame label="canvas 520 — drawer beside, minimap gone" w={520} h={300}><ChildView nodes={CHILD_SMALL} baseId={CHILD_SMALL_BASE} selected="s_01HXB2" /></Frame>
            <Frame label="canvas 420 — drawer covers" w={420} h={300}><ChildView nodes={CHILD_SMALL} baseId={CHILD_SMALL_BASE} selected="s_01HXB2" /></Frame>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--tasty-space-xs)" }}>
              <span style={cap}>child popup at its minimum 360 × 280</span>
              <ChildGraphWindow width={360} height={280} initial={{ selected: "s_01HX9A" }} />
            </div>
          </>)}
        </Stage>
        <Meta
          specs={[["cover below", "480 canvas width — graph-drawer-cover-below"], ["why 480", "288 + 168 + 2 × 12"], ["480 – 560", "288 beside, minimap hidden"], ["≥ 560 uncovered", "minimap back"], ["popup minimum", "360 × 280 (both popups, host constant)"], ["header wrap", "the DAG and child surface headers still wrap under 640 (unchanged, not a token)"]]}
          tokens={[{ tok: "--tasty-graph-drawer-cover-below", use: "480" }, { tok: "--tasty-dag-minimap-min-surface", use: "560, on the uncovered width" }]} />
      </Spec>

      <Spec id="graph-states-loading-error-remote-empty" title="Status — loading, refresh error, remote, empty"
        when={<>Both graphs use one status block (the DAG empty part: glyph, title, hint, centred) and one strip pinned to the canvas top. <b>Loading</b>: a spinner in the glyph slot, so loading → empty never moves the block. <b>Refresh failed</b>: the last graph stays and a warning strip says so (the cycle notice's recipe). <b>Remote disconnected</b>: the last graph stays, every remote card reads <i>unknown</i>, and the strip names the host. <b>Remote Tasty too old</b>: a status block in place of the graph. <b>DAG empty</b> keeps its two branches (no DAG in the workspace, the named DAG is gone); the child graph has its own empty.</>}>
        <Stage variant="grid" style={{ display: "flex", flexWrap: "wrap", gap: 16, padding: 20, alignItems: "flex-start" }}>
          <Frame label="loading" w={320} h={200}><ChildView nodes={CHILD_SMALL} baseId={CHILD_SMALL_BASE} status="loading" /></Frame>
          <Frame label="refresh failed — last graph kept" w={420} h={200}><ChildView nodes={CHILD_SMALL} baseId={CHILD_SMALL_BASE} banner={<GraphStrip>{gt("graph.error_refresh")}</GraphStrip>} /></Frame>
          <Frame label="remote disconnected — states unknown" w={460} h={240}><ChildView nodes={CHILD_MIRROR_LOST} baseId={CHILD_MIRROR_BASE} banner={<GraphStrip>{gt("graph.remote_disconnected", "en", "lab-linux")}</GraphStrip>} /></Frame>
          <Frame label="remote Tasty without graph support" w={320} h={200}><ChildView nodes={CHILD_SMALL} baseId={CHILD_SMALL_BASE} status="unsupported" /></Frame>
          <Frame label="child — no parent or children" w={320} h={200}><ChildView nodes={CHILD_SMALL.slice(0, 1)} baseId="s_01HX4K" /></Frame>
          <Frame label="DAG — none in this workspace" w={320} h={200}><DagEmpty variant="surface" /></Frame>
          <Frame label="DAG — the named DAG is gone" w={320} h={200}><DagEmpty variant="missing" query="nightly-bench" /></Frame>
        </Stage>
        <Views>
          <View name="graph-states-ko" label="ko, ja, zh-Hans — longest strip and hint">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
              {["ko", "ja", "zh-Hans"].map((l) => (
                <Frame key={l} label={l} w={420} h={200}><ChildView nodes={CHILD_MIRROR_LOST} baseId={CHILD_MIRROR_BASE} lang={l} banner={<GraphStrip>{gt("graph.remote_disconnected", l, "lab-linux")}</GraphStrip>} /></Frame>
              ))}
              {["ko", "ja", "zh-Hans"].map((l) => (
                <Frame key={l + "u"} label={l} w={320} h={200}><ChildView nodes={CHILD_SMALL} baseId={CHILD_SMALL_BASE} status="unsupported" lang={l} /></Frame>
              ))}
            </div>
          </View>
        </Views>
        <Meta
          specs={[["block", "DagEmpty — glyph 24 glyph-dim · title 13 semibold · hint 11 · centred both axes"], ["loading", "Spinner 24 in the glyph slot · graph.loading"], ["strip", "28 · pinned to the canvas top · one line, ellipsis · under the drawer"], ["refresh failed", "warning strip · graph.error_refresh · the graph stays"], ["disconnected", "warning strip · graph.remote_disconnected(host) · remote cards → unknown"], ["unsupported", "remote glyph · graph.remote_unsupported + _hint(host)"], ["child empty", "child_graph.empty.none + _hint"], ["DAG empty", "existing: dag.empty.none · dag.empty.missing"]]}
          tokens={[{ tok: "--tasty-dag-cycle-bg", use: "warning strip wash", color: "var(--tasty-dag-cycle-bg)" }, { tok: "--tasty-dag-cycle-fg", use: "warning strip text", color: "var(--tasty-dag-cycle-fg)" }, { tok: "--tasty-glyph-dim", use: "status glyph", color: "var(--tasty-glyph-dim)" }]} />
      </Spec>
    </Section>
  );
}

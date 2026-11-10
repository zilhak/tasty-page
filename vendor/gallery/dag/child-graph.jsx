import React from "react";
import { Section, Spec, Stage, Meta, Note, Do, Dont, Views, View } from "../parts/specimen.jsx";
import { ThemePair } from "../parts/theme-frame.jsx";
import { focusViews } from "../parts/surface-focus-views.jsx";
import { ToolsMenuFrame } from "../parts/overlay-frames.jsx";
import { Kbd, MenuItem, Table, Tab } from "../../components/index.js";
import { DagNode, elbow } from "../../ui_kits/terminal/dag.js";
import { GraphStrip, CHILD_STATE, CHILD_STATE_ORDER } from "../../ui_kits/terminal/overlays/graph_view.jsx";
import { ChildNode, ChildGraphWindow, ChildGraphSurface, ChildGraphSettings, MirrorBanner, CHILD_SMALL, CHILD_SMALL_BASE, CHILD_LARGE, CHILD_LARGE_BASE,
  CHILD_MIRROR, CHILD_MIRROR_BASE, CHILD_CROSS, CHILD_EXTERNAL } from "../../ui_kits/terminal/overlays/child_graph.jsx";
import { GRAPH_COPY, GRAPH_LANGS, gt } from "../../ui_kits/terminal/overlays/graph_copy.js";
import { Frame, ChildView } from "./graph-shared.jsx";
import { BasePicker, PICKER_ONE_WINDOW } from "../../ui_kits/terminal/overlays/child_base_picker.jsx";

// Tasty Gallery — Surfaces · Task DAG › Child graph (2026-11-10).
// Parts: ui_kits/terminal/overlays/child_graph.jsx on the shared graph_view.jsx. This page only catalogues them.
// User decisions of 2026-11-10 (request items 4-1 to 4-9) keep only the chosen expression, tagged "decided".
// Items still open keep the recommended expression, tagged "recommended"; an alternative frame is tagged "alternative".
// A frame that mixes a decided part with parts still open takes both tags, and its label names which part is still open.

const cap = { fontFamily: "var(--tasty-font-mono)", fontSize: "var(--tasty-font-size-micro)", color: "var(--tasty-text-muted)" };
const Badge = ({ tag }) => (
  <span style={{ ...cap, padding: "0 var(--tasty-space-xs)", borderRadius: "var(--tasty-radius-sm)", border: "var(--tasty-border-width) solid var(--tasty-border-strong)",
    color: "var(--tasty-text-secondary)" }}>{tag}</span>
);
const Labelled = ({ label, tag, children }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: "var(--tasty-space-xs)", minWidth: 0 }}>
    <span style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "var(--tasty-space-sm)" }}>{[].concat(tag || []).map((t) => <Badge key={t} tag={t} />)}<span style={cap}>{label}</span></span>
    {children}
  </div>
);
const row = (children) => <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--tasty-space-lg)", alignItems: "flex-start" }}>{children}</div>;
// one card outside the canvas, with room above it for the base chip
const Card = (props) => <div style={{ position: "relative", width: 168, height: 48, marginTop: 20 }}><ChildNode {...props} /></div>;
const S = (state, over) => ({ id: "s_01HX7Q", kind: "surface", nickname: "builder", role: "worker", state, ...over });

function CardGrid({ lang = "en" }) {
  const cols = [["rest", {}], ["selected", { selected: true }]];
  return (
    <div style={{ display: "grid", gridTemplateColumns: `96px repeat(${cols.length}, 168px)`, columnGap: 16, rowGap: 8, alignItems: "end" }}>
      <span />
      {cols.map(([c]) => <span key={c} style={cap}>{c}</span>)}
      {CHILD_STATE_ORDER.map((s) => (
        <React.Fragment key={s}>
          <span style={{ ...cap, alignSelf: "center" }}>{s}</span>
          {cols.map(([c, p]) => (
            <div key={c} style={{ position: "relative", width: 168, height: 48, marginTop: 20 }}>
              <ChildNode node={S(s)} lang={lang} selected={!!p.selected} />
            </div>
          ))}
        </React.Fragment>
      ))}
    </div>
  );
}

function CopyTable() {
  const rows = Object.entries(GRAPH_COPY).map(([key, v]) => ({ key, ...v }));
  return (
    <div className="tasty-scroll" style={{ overflow: "auto", maxHeight: 520 }}>
      <Table dense hover={false} rowKey="key" rows={rows}
        columns={[{ key: "key", header: "Key", mono: true }, ...GRAPH_LANGS.map((l) => ({ key: l, header: l }))]} />
    </div>
  );
}

export function ChildGraphSection() {
  return (
    <Section id="child" title="Child graph">
      <Spec id="child-card-every-state" title="Child card — six states, base, remote, external, read-only ancestor"
        when={<>The DAG card's box with a surface in it. <b>Name row</b>: terminal glyph (the <b>remote</b> glyph in the remote ink on a mirrored surface) and the nickname, else the role, else the surface id in mono. <b>Meta row</b>: state glyph, STATE in caps, surface id in mono on the right; the state label yields first. Each state <b>borrows a DAG state look</b>, so colour, bar, border and contrast are the DAG node's: <code>active</code> ◑ running · <code>idle</code> ❯ ready (the prompt glyph) · <code>needs_input</code> ! awaiting input · <code>stale</code> ◦ waiting (a guess, so neutral, not a warning) · <code>exited</code> − cancelled, dimmed · <code>unknown</code> ? unknown. Claude and Codex are not told apart: no provider glyph (R-01). Confidence is not on the card; the drawer carries it. The <b>base surface</b> gets a chip <b>above</b> the card, outside its box, so it never fights the state colour or the selection ring and still reads at every LOD tier and when the base is selected.</>}>
        <Stage variant="grid" style={{ display: "block", padding: 20 }}>
          <CardGrid />
          <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginTop: 24, alignItems: "flex-end" }}>
            <Labelled label="base"><Card node={S("active")} base /></Labelled>
            <Labelled label="base + selected"><Card node={S("idle")} base selected /></Labelled>
            <Labelled label="mirrored remote surface"><Card node={S("active", { remote: true, nickname: "gradle" })} /></Labelled>
            <Labelled label="no nickname, no role → id"><Card node={S("idle", { nickname: null, role: null })} /></Labelled>
            <Labelled label="external parent (4-6)" tag="decided"><Card node={{ id: "codex:019a5c2e-7f3b", kind: "external" }} /></Labelled>
            <Labelled label="remote ancestor, not mirrored (4-9)" tag="decided"><Card node={{ id: "s_m0", kind: "remote-ancestor", nickname: "orchestrator" }} /></Labelled>
          </div>
        </Stage>
        <Views>
          <View name="child-card-themes" label="Mocha and Latte">
            <ThemePair render={() => <div className="tasty-scroll" style={{ overflow: "auto", background: "var(--tasty-dag-canvas-bg)", padding: 12 }}><CardGrid /></div>} />
          </View>
          <View name="child-card-locales" label="ko, ja, zh-Hans — the longest state labels">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
              {["ko", "ja", "zh-Hans"].map((l) => ["stale", "needs_input", "unknown"].map((s) => (
                <Labelled key={l + s} label={`${l} · ${s}`}><Card node={S(s)} lang={l} base={s === "stale"} /></Labelled>
              )))}
            </div>
          </View>
        </Views>
        <Meta
          specs={[["box", "168 × 48 · the DAG card (dag-node-*)"], ["name", "nickname → role → id (mono 11)"], ["meta", "glyph · STATE caps 10 · id mono right"], ["dimmed", "exited only, dag-node-dim-opacity (the rest column shows it)"], ["base chip", "16 tall · 4 above the card · label micro · text-secondary on bg-sidebar · border-strong"], ["selection", "the DAG ring, 2px accent, 1px offset"], ["hover", "the DAG hover wash — not shown, see the note"], ["external", "dashed border · link glyph · key in mono · no state"], ["read-only ancestor", "dashed border · remote glyph · “Not mirrored”"]]}
          tokens={[{ tok: "--tasty-graph-base-chip-height", use: "16" }, { tok: "--tasty-graph-base-chip-gap", use: "4" }, { tok: "--tasty-dag-status-running", use: "active", color: "var(--tasty-dag-status-running)" }, { tok: "--tasty-dag-status-ready", use: "idle", color: "var(--tasty-dag-status-ready)" }, { tok: "--tasty-dag-phase-awaiting", use: "needs_input", color: "var(--tasty-dag-phase-awaiting)" }, { tok: "--tasty-dag-status-waiting", use: "stale", color: "var(--tasty-dag-status-waiting)" }, { tok: "--tasty-dag-status-cancelled", use: "exited", color: "var(--tasty-dag-status-cancelled)" }, { tok: "--tasty-dag-status-unknown", use: "unknown", color: "var(--tasty-dag-status-unknown)" }, { tok: "--tasty-accent-remote-raised", use: "remote glyph", color: "var(--tasty-accent-remote-raised)" }]} />
        <Note>Hover is the DAG card's <code>dag-node-hover-bg</code> wash, unchanged. Measured over every state it drops the state label below 4.5:1 on active, idle, stale and exited in Mocha and Latte, and the DAG card has the same gap. The grid leaves hover out until that token is settled for both graphs; see the question list.</Note>
        <Dont>Do not mark the base with the accent border or a second ring: the accent border already means <i>active</i> and the ring means <i>selected</i>, and the base can be both.</Dont>
      </Spec>

      <Spec id="child-card-and-dag-card-lod" title="Level of detail — child card and DAG card"
        when={<>Both cards change content, never size, at the same zoom tiers: <b>full</b> (≥ 70%) both rows · <b>compact</b> (≥ 40%) glyph + name · <b>block</b> (&lt; 40%) state fill only. The base chip stays at every tier.</>}>
        <Stage variant="grid" style={{ display: "flex", flexDirection: "column", gap: 16, padding: 20 }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
            {["full", "compact", "block"].map((l) => <Labelled key={l} label={`child · ${l}`}><Card node={S("needs_input", { nickname: "reviewer" })} lod={l} base={l !== "full"} /></Labelled>)}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
            {["full", "compact", "block"].map((l) => (
              <Labelled key={l} label={`DAG · ${l}`}>
                <div style={{ position: "relative", width: 168, height: 48, marginTop: 20 }}>
                  <DagNode node={{ id: "t", name: "build:linux-x86_64", kind: "run", status: "running", dur: "12s" }} lod={l} />
                </div>
              </Labelled>
            ))}
          </div>
        </Stage>
        <Meta specs={[["full", "zoom ≥ 0.7"], ["compact", "0.4 – 0.7"], ["block", "< 0.4"], ["LOD chip", "existing dag.lod.* copy, both graphs"]]}
          tokens={[{ tok: "--tasty-dag-node-width", use: "168 at every tier" }]} />
      </Spec>

      <Spec id="child-tree-small-large-full-tree-off-on" title="Tree — small, large, full tree off and on"
        when={<>Parents left, children right, siblings stacked. <b>Off</b> (default): the base, its ancestors to the root, and <b>every descendant</b> of the base. <b>On</b>: the whole tree from that root — siblings and uncles too. The checkbox only widens the ancestor side. The large tree auto-fits into the compact tier and says so in the LOD chip.</>}>
        <Stage style={{ padding: 16, display: "block" }}>
          {row(<>
            <Frame label="small — base, parent, two children" w={640} h={280}><ChildView nodes={CHILD_SMALL} baseId={CHILD_SMALL_BASE} /></Frame>
            <Frame label="large — full tree off (base: designer)" w={760} h={340}><ChildView nodes={CHILD_LARGE} baseId={CHILD_LARGE_BASE} /></Frame>
            <Frame label="large — full tree on: depth 5, six siblings, a mirrored remote branch" w={760} h={460}><ChildView nodes={CHILD_LARGE} baseId={CHILD_LARGE_BASE} full /></Frame>
          </>)}
        </Stage>
        <Meta specs={[["off", "base + ancestors to the root + all descendants"], ["on", "every node under that root"], ["layout", "column = depth (168 + 32) · row = leaf (48 + 24) · parent centred on its children · 20 top room for the base chip"], ["fit on open", "≤ 100%; a large tree lands in compact or block"]]}
          tokens={[{ tok: "--tasty-dag-layer-gap", use: "32" }, { tok: "--tasty-dag-sibling-gap", use: "24" }]} />
      </Spec>

      <Spec id="child-edges-one-relation" title="Edges — one relation"
        when={<>A child graph has one relation, parent → child, so it takes the DAG's <code>depends_on</code> line: solid, neutral, elbowed with a 4px corner, an arrow at the child. Edges that touch the selected card take the accent, as in the DAG. No dashes, no relation colours. <b>Decided 4-7 to 4-9</b>: a parent and child on different machines are joined by this <b>same line</b> — the relation is the same; the remote glyph on the card already says which machine. Attach occupancy is never a line.</>}>
        <Stage variant="grid" style={{ display: "flex", gap: 32, padding: 20, flexWrap: "wrap" }}>
          {[["parent → child", "var(--tasty-dag-edge-depends)", null, false], ["touching the selection", "var(--tasty-dag-edge-highlight)", null, false], ["between machines (4-7 to 4-9)", "var(--tasty-dag-edge-depends)", null, "decided"]].map(([l, c, d, tag]) => (
            <Labelled key={l} label={l} tag={tag || null}>
              <svg width="120" height="56" viewBox="0 0 120 56" aria-hidden="true">
                <path d={elbow({ x: 8, y: 8 }, { x: 112, y: 48 }, false, 4)} fill="none" stroke={c} strokeWidth="1" style={d ? { strokeDasharray: d } : undefined} />
                <polygon points="105,44 105,52 112,48" fill={c} />
              </svg>
            </Labelled>
          ))}
        </Stage>
        <Meta specs={[["line", "1px solid dag-edge-depends · arrow 8 at the child"], ["selection", "dag-edge-highlight"], ["between machines", "the same line · no own colour or dash"]]}
          tokens={[{ tok: "--tasty-dag-edge-depends", use: "parent → child", color: "var(--tasty-dag-edge-depends)" }, { tok: "--tasty-dag-edge-highlight", use: "selected", color: "var(--tasty-dag-edge-highlight)" }]} />
      </Spec>

      <Spec id="child-graph-popup" title="Popup — the current surface as base"
        when={<>A movable, resizable <b>600 × 460</b> popup (three columns at 100%), minimum 360 × 280 like the DAG popup. Title bar 28, then a <b>36 toolbar</b> with the full tree checkbox — 36 because the back bar of the next screen is 36, so the push never moves the canvas top. The base is the surface it was opened from; its chip says so, and there is no selector. Try it: select <i>builder</i>, then <b>View DAG</b>.</>}>
        <Stage style={{ padding: 20, display: "flex", justifyContent: "center", background: "var(--tasty-bg-app)" }}>
          <ChildGraphWindow />
        </Stage>
        <Views>
          <View name="child-popup-full-tree" label="Full tree on, the parent selected">
            <ChildGraphWindow nodes={CHILD_LARGE} baseId={CHILD_LARGE_BASE} initial={{ full: true, selected: "s_c2" }} />
          </View>
          <View name="child-popup-locales" label="ko, ja, zh-Hans">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
              {["ko", "ja", "zh-Hans"].map((l) => <ChildGraphWindow key={l} lang={l} width={480} height={360} initial={{ selected: "s_01HX7Q" }} />)}
            </div>
          </View>
        </Views>
        <Meta specs={[["frame", "600 × 460 · min 360 × 280 · resizable · title-bar drag"], ["toolbar", "36 · checkbox · separator below"], ["canvas", "dag-canvas-bg (a popup is not a surface)"], ["base", "the surface it opened from · chip only"], ["dismiss", "× · Esc with nothing selected — outside click does not close (pan drags end outside), as the DAG popup"]]}
          tokens={[{ tok: "--tasty-graph-child-popup-width", use: "600" }, { tok: "--tasty-graph-child-popup-height", use: "460 → dag-popup-height" }, { tok: "--tasty-graph-toolbar-height", use: "36 → back bar" }, { tok: "--tasty-shadow-modal", use: "popup lift" }]} />
      </Spec>

      <Spec id="child-graph-surface-header" title="Surface — base picker and checkbox in the header (base picker decided, R-51 14)"
        when={<>A tab of its own kind. The header is the DAG header's recipe (sidebar band, 8 / 12 padding): branch glyph · <b>Base surface</b> · the <b>base picker</b> · the full tree checkbox · refresh. Under 640 the header wraps: base above, checkbox and refresh below. The canvas takes the surface bed. <b>Decided</b>: the picker lists <b>every surface in every window</b>, mirrored remote workspaces included, with no filter by parent or child. Closed it is the Select trigger and reads <code>workspace / name · id</code>. Open it is the searchable list's shell holding a tree shaped like the <b>sidebar</b>: <b>window › category › workspace › pane › tab › surface</b>, and only a surface row picks. Categories are the sidebar's band (the reserved one reads <i>Workspaces</i>), the workspace row is the sidebar's status dot and name with the remote glyph and host on a mirror, and the rest are the sidebar tree row. Split layouts (PaneGroup, SurfaceGroup) are not levels: panes and surfaces list in layout order. <b>Still open</b>, the recommendation drawn and tagged <i>recommended</i>, also inside the decided frames: windows are numbered in the order they were opened (<i>Window 1</i>, <i>Window 2</i>) and the one the graph is in says <i>This window</i>; with <b>one window</b> the window level is left out; a closed window whose sessions still run comes after the open ones as <i>Closed window</i> and keeps its number, so open and closed windows never share one (<i>Closed window 3</i> here); and the folding of levels below.</>}>
        <Stage style={{ padding: 16, display: "flex", gap: 16, flexWrap: "wrap", alignItems: "stretch" }}>
          <Frame label="wide" w={760} h={420}><ChildGraphSurface /></Frame>
          <Frame label="narrow 360" w={360} h={420}><ChildGraphSurface narrow nodes={CHILD_SMALL} baseId={CHILD_SMALL_BASE} /></Frame>
        </Stage>
        <Stage style={{ padding: 16, display: "block" }}>
          {row(<>
            <Labelled label="picker open — path to the base open, base selected · window numbers, This window and the closed window row recommended" tag={["decided", "recommended"]}><div style={{ minHeight: 440, width: "var(--tasty-graph-base-picker-width)" }}><BasePicker value="s_w23" open inline /></div></Labelled>
            <Labelled label="filter “work” — matches with their path · window rows and folding recommended" tag={["decided", "recommended"]}><div style={{ minHeight: 440, width: "var(--tasty-graph-base-picker-width)" }}><BasePicker value="s_w23" open inline query="work" /></div></Labelled>
            <Labelled label="filter with no match" tag="decided"><div style={{ minHeight: 140, width: "var(--tasty-graph-base-picker-width)" }}><BasePicker value="s_w23" open inline query="zzz" /></div></Labelled>
          </>)}
        </Stage>
        <Stage style={{ padding: 16, display: "block" }}>
          {row(<>
            <Labelled label="folding: categories off · one pane: no pane row · one surface per tab: one row" tag="recommended"><div style={{ minHeight: 440, width: "var(--tasty-graph-base-picker-width)" }}><BasePicker value="s_01HX7Q" open inline categoriesOn={false} /></div></Labelled>
            <Labelled label="one window: no window level" tag="recommended"><div style={{ minHeight: 440, width: "var(--tasty-graph-base-picker-width)" }}><BasePicker windows={PICKER_ONE_WINDOW} value="s_w23" open inline /></div></Labelled>
            <Labelled label="every level drawn: pane rows and tab rows always" tag="alternative"><div style={{ minHeight: 440, width: "var(--tasty-graph-base-picker-width)" }}><BasePicker value="s_01HX7Q" open inline allLevels /></div></Labelled>
          </>)}
        </Stage>
        {focusViews("child-graph-surface", (focused) => <div style={{ height: 300, minWidth: 320 }}><ChildGraphSurface nodes={CHILD_SMALL} baseId={CHILD_SMALL_BASE} focused={focused} /></div>)}
        <Views>
          <View name="child-surface-selector-empty" label="No terminal surface in any window — the picker is disabled">
            <Frame w={560} h={200}><ChildGraphSurface nodes={[]} baseId="" status="empty" windows={[]} /></Frame>
          </View>
          <View name="child-surface-picker-locales" label="ko, ja, zh-Hans — the open picker">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
              {["ko", "ja", "zh-Hans"].map((l) => <div key={l} style={{ minHeight: 440, width: "var(--tasty-graph-base-picker-width)" }}><BasePicker lang={l} value="s_m2" open inline /></div>)}
            </div>
          </View>
        </Views>
        <Meta specs={[["header", "bg-sidebar · 8 / 12 · wraps < 640"], ["label", "Base surface · caption muted"], ["trigger", "the Select trigger · field-width-lg · “workspace / name · id” · placeholder child_graph.empty.pick_base"], ["popover", "menu shell · graph-base-picker-width 360 · max graph-base-picker-height 400 · filter field + separator + tree (only the tree scrolls)"], ["levels", "window (TreeRow, child_graph.picker.window / closed_window, meta this_window; recommended: one sequence in open order, a closed window keeps its number, left out with one window) › category (sidebar category band, count) › workspace (status dot + name, remote glyph + host) › pane (child_graph.picker.pane) › tab (title) › surface (terminal or remote glyph · name · id mono)"], ["scope", "every window · mirrors included · no relation filter · closed windows with live sessions after the open ones (recommended)"], ["folding (recommended)", "categories off: no band · one pane: no pane row · one surface in a tab: one row"], ["open state", "windows and categories open · the path to the base open, base selected · the rest closed"], ["filter", "surface name, id or workspace · child_graph.picker.search · none: picker.no_match"], ["disabled", "no surface in any window · child_graph.base_empty"], ["checkbox", "child_graph.show_full_tree"], ["canvas", "surface bed, focused or unfocused"]]}
          tokens={[{ tok: "--tasty-graph-base-picker-width", use: "360" }, { tok: "--tasty-graph-base-picker-height", use: "400" }, { tok: "--tasty-sidebar-category-header-bg", use: "category band", color: "var(--tasty-sidebar-category-header-bg)" }, { tok: "--tasty-tree-row-indent", use: "12 per level" }, { tok: "--tasty-field-width-lg", use: "trigger" }]} />
        <Note>In the app the picker opens as a floating layer over the surface. Here the open picker is drawn on its own beside the frames, because the gallery frame would clip it.</Note>
      </Spec>

      <Spec id="child-to-dag-push-and-back" title="Child graph → DAG — push right, back with the chevron"
        when={<>Selecting a surface that <b>created</b> a DAG shows <b>View DAG</b> in its drawer. It <b>pushes</b> the whole area under the title bar (or the surface) to the left and the DAG screen comes in from the right, in <span className="tok">--tasty-motion-ui</span> (120); with reduced motion it switches at once. The DAG screen's top is a <b>DrillDown back bar</b>: the back chevron at the top left, the DAG name, <i>From builder</i> in muted text, the runner badge on the right. Back slides the other way and <b>restores</b> the child view as it was — zoom, pan, selection, open drawer — because the child graph is where the user was working; the DAG popup's list back still resets, since a list has no view to restore. The DAG screen is the DAG graph unchanged: its own zoom cluster on the canvas and its drawer.</>}>
        <Stage style={{ padding: 16, display: "block", background: "var(--tasty-bg-app)" }}>
          {row(<>
            <Labelled label="1 · before — View DAG in the drawer"><ChildGraphWindow width={480} height={360} still push={0} initial={{ selected: "s_01HX7Q", owner: "s_01HX7Q", dagId: "build-and-deploy" }} /></Labelled>
            <Labelled label="2 · middle frame — half way"><ChildGraphWindow width={480} height={360} still push={0.5} initial={{ selected: "s_01HX7Q", owner: "s_01HX7Q", dagId: "build-and-deploy" }} /></Labelled>
            <Labelled label="3 · after — DAG, back chevron top left"><ChildGraphWindow width={480} height={360} still push={1} initial={{ selected: "s_01HX7Q", owner: "s_01HX7Q", dagId: "build-and-deploy" }} /></Labelled>
          </>)}
        </Stage>
        <Views>
          <View name="child-push-surface" label="Surface frame — the same push, the back bar replaces the header">
            <Frame w={760} h={380}><ChildGraphSurface nodes={CHILD_SMALL} baseId={CHILD_SMALL_BASE} initial={{ selected: "s_01HX7Q", owner: "s_01HX7Q", dagId: "build-and-deploy" }} /></Frame>
          </View>
        </Views>
        <Meta specs={[["trigger", "View DAG — Button secondary sm, only when the surface created a DAG"], ["motion", "translateX of the whole area · motion-ui 120 · ease-ui · reduced motion: 0"], ["back", "DrillDown back bar 36 · chevron-left IconButton · tooltip child_graph.back"], ["title", "DAG name · “From {name}” muted (child_graph.from)"], ["actions", "runner badge, no hint"], ["return", "child view restored as left"], ["Esc on the DAG screen", "clears the DAG selection first, then goes back"]]}
          tokens={[{ tok: "--tasty-graph-push-motion", use: "120 → motion-ui" }, { tok: "--tasty-drilldown-backbar-height", use: "36" }]} />
        <Note>The back control is DrillDown's, so one back affordance serves the app. It draws <code>chevronLeft</code>; the request wrote <code>&lt;-</code>. See the question list if a literal arrow is wanted.</Note>
      </Spec>

      <Spec id="child-several-dags-list-step" title="A surface that created several DAGs (decided 4-5)"
        when={<><b>Decided</b>: the list of DAGs comes first. One button, <b>View DAGs (2)</b>. It pushes to a <b>list step</b> of the DAGs that surface created — the DAG list's own rows — titled <i>DAGs created by conductor-page</i>; picking one pushes to the graph. Three steps, one back bar each: the graph's back returns to the list (<i>Back to list</i>), the list's back returns to the child graph. With one DAG the list step is skipped — still open: whether one DAG also shows the list; the recommended skip is drawn.</>}>
        <Stage style={{ padding: 16, display: "block", background: "var(--tasty-bg-app)" }}>
          {row(<>
            <Labelled label="drawer — View DAGs (2)" tag="decided"><ChildGraphWindow nodes={CHILD_LARGE} baseId="s_c2" width={480} height={380} still push={0} initial={{ selected: "s_c2", owner: "s_c2", viaList: true }} /></Labelled>
            <Labelled label="list step" tag="decided"><ChildGraphWindow nodes={CHILD_LARGE} baseId="s_c2" width={480} height={380} still push={1} initial={{ selected: "s_c2", owner: "s_c2", viaList: true }} /></Labelled>
            <Labelled label="graph step — back to the list" tag="decided"><ChildGraphWindow nodes={CHILD_LARGE} baseId="s_c2" width={480} height={380} still push={2} initial={{ selected: "s_c2", owner: "s_c2", viaList: true, dagId: "docs-publish" }} /></Labelled>
          </>)}
        </Stage>
        <Meta specs={[["button", "child_graph.drawer.view_dag · view_dags({n}) when n > 1"], ["list title", "child_graph.dag_list_title({name})"], ["list rows", "the DAG list row (ListCtrl 36) — rollup + done/total"], ["back from graph", "existing dag_list.back “Back to list”"], ["back from list", "child_graph.back"], ["one DAG", "no list step (recommended; still open)"]]}
          tokens={[{ tok: "--tasty-dag-row-height", use: "36 list row" }]} />
      </Spec>

      <Spec id="child-graph-empty-and-base-closed" title="Empty and base closed (decided 4-4)"
        when={<>A base with no parent and no children shows the child empty block. On the <b>surface</b> form the base can close. <b>Decided</b> (as the DAG surface does for a missing DAG): the canvas says <i>Base surface closed</i> with a <b>Select base surface</b> button that opens the base picker, and the picker shows its placeholder. A base that was a mirrored surface adds a banner with Reconnect (next spec). The <b>popup</b> form is still open; the popup closes with its surface as recommended.</>}>
        <Stage variant="grid" style={{ display: "flex", flexWrap: "wrap", gap: 16, padding: 20, alignItems: "flex-start" }}>
          <Labelled label="child empty — popup"><ChildGraphWindow nodes={CHILD_SMALL.slice(3).map((n) => ({ ...n, parent: undefined }))} baseId="s_01HXB2" width={420} height={280} /></Labelled>
          <Labelled label="base closed — pick another" tag="decided"><Frame w={480} h={300}><ChildGraphSurface status="base-closed" nodes={CHILD_SMALL} /></Frame></Labelled>
        </Stage>
        <Meta specs={[["empty", "child_graph.empty.none + none_hint · gitBranch glyph"], ["base closed", "child_graph.empty.base_closed + _hint · paneEmpty glyph · Button secondary sm pick_base"], ["base picker", "placeholder child_graph.empty.pick_base"]]}
          tokens={[]} />
      </Spec>

      <Spec id="child-graph-mirror-base-detached" title="Base was a mirrored surface — detached or lost, Reconnect (decided)"
        when={<>A child graph surface whose base is a <b>mirrored remote surface</b> loses it when the mirror is <b>detached</b> or the <b>connection is lost</b>. <b>Decided</b>: a banner across the top says which, and the rest is the <b>pick a base surface</b> state of 4-4 (the picker shows its placeholder; the canvas offers <i>Select base surface</i>). The banner ends in <b>Reconnect</b>: it attaches again with the <b>same attach profile</b> to the <b>same remote surface</b> (its tooltip names both). While it tries, the button is disabled with a spinner and reads <i>Reconnecting…</i>; on failure the banner turns to the warning recipe and says so, and Reconnect stays for another try; on success the banner goes and the graph returns with that base. Picking another base also clears the banner. Detached is the user's own act, so it takes the neutral band; a lost connection or a failed try takes the warning band, as the refresh error does.</>}>
        <Stage style={{ padding: 16, display: "block" }}>
          {row(<>
            <Labelled label="mirror detached" tag="decided"><Frame w={560} h={280}><ChildGraphSurface nodes={CHILD_SMALL} status="base-closed" banner={<MirrorBanner cause="detached" />} /></Frame></Labelled>
            <Labelled label="connection lost" tag="decided"><Frame w={560} h={280}><ChildGraphSurface nodes={CHILD_SMALL} status="base-closed" banner={<MirrorBanner cause="lost" />} /></Frame></Labelled>
            <Labelled label="Reconnect — trying" tag="decided"><Frame w={560} h={280}><ChildGraphSurface nodes={CHILD_SMALL} status="base-closed" banner={<MirrorBanner cause="lost" state="trying" />} /></Frame></Labelled>
            <Labelled label="Reconnect — failed, try again" tag="decided"><Frame w={560} h={280}><ChildGraphSurface nodes={CHILD_SMALL} status="base-closed" banner={<MirrorBanner cause="lost" state="failed" />} /></Frame></Labelled>
          </>)}
        </Stage>
        <Views>
          <View name="child-mirror-banner-locales" label="ko, ja, zh-Hans — the longest banner">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
              {["ko", "ja", "zh-Hans"].map((l) => <Frame key={l} label={l} w={560} h={280}><ChildGraphSurface lang={l} nodes={CHILD_SMALL} status="base-closed" banner={<MirrorBanner cause="lost" lang={l} />} /></Frame>)}
            </div>
          </View>
        </Views>
        <Meta specs={[["banner", "GraphStrip 28 · detached: info band · lost / failed: warning band (dag-cycle-*) · text ellipsis, full text as tooltip"], ["text", "child_graph.mirror_detached(host, name) · mirror_lost(host, name) · reconnect_failed(host)"], ["action", "Button secondary sm child_graph.reconnect · tooltip reconnect_tooltip(name, profile)"], ["trying", "disabled · Spinner 12 · child_graph.reconnecting"], ["below", "pick a base surface state (4-4): child_graph.empty.base_closed · pick_base"], ["clears", "reconnected, or another base picked"]]}
          tokens={[{ tok: "--tasty-dag-cycle-bg", use: "warning band", color: "var(--tasty-dag-cycle-bg)" }, { tok: "--tasty-dag-chrome-bg", use: "info band", color: "var(--tasty-dag-chrome-bg)" }, { tok: "--tasty-dag-cycle-height", use: "28" }]} />
      </Spec>

      <Spec id="child-graph-mirror-scope-and-remote-ancestor" title="Across machines — one graph, read-only ancestors (decided 4-7 to 4-9)"
        when={<><b>Decided</b>: parent and child relations that cross machines are <b>one graph</b> — this computer's surface <i>A</i>, its child <i>B</i> on a remote, and <i>B</i>'s child <i>C</i> read A → B → C with ordinary lines. Mirrored surfaces carry the remote glyph; the drawer adds the attach profile, or the SSH target with <i>(no saved profile)</i>. An ancestor in a remote workspace that is not mirrored here is drawn <b>read-only</b>: dashed card, <i>Not mirrored</i>, a drawer with rows and a note and no actions. Ancestors are followed to the root across workspaces and machines. Attach occupancy (which machine mirrors which) is never drawn.</>}>
        <Stage style={{ padding: 16, display: "block" }}>
          {row(<>
            <Labelled label="read-only ancestor in a workspace not mirrored here (drawer open on it)" tag="decided"><Frame w={640} h={320}><ChildView nodes={CHILD_MIRROR} baseId={CHILD_MIRROR_BASE} selected="s_m0" /></Frame></Labelled>
            <Labelled label="a remote surface's drawer — attach profile" tag="decided"><Frame w={640} h={320}><ChildView nodes={CHILD_MIRROR} baseId={CHILD_MIRROR_BASE} selected="s_m2" /></Frame></Labelled>
            <Labelled label="A → B → C: this computer, then a remote child and its child; inline SSH drawer" tag="decided"><Frame w={640} h={320}><ChildView nodes={CHILD_CROSS} baseId="s_L1" selected="s_R1" /></Frame></Labelled>
          </>)}
        </Stage>
        <Meta specs={[["remote card", "remote glyph in accent-remote-raised · state as usual"], ["read-only ancestor", "dashed · Not mirrored · drawer: role, id, workspace, attach profile, read-only note"], ["attach profile", "profile name · or SSH target + child_graph.drawer.attach_inline"], ["disconnected", "see graph-states: warning strip, remote states unknown"], ["across machines", "same parent → child line"], ["attach", "occupancy not drawn"]]}
          tokens={[{ tok: "--tasty-accent-remote-raised", use: "remote glyph", color: "var(--tasty-accent-remote-raised)" }]} />
      </Spec>

      <Spec id="child-graph-external-parent" title="External parent (decided 4-6)"
        when={<>A child whose parent is not a surface — a Codex conversation, <code>codex:&lt;thread&gt;</code> — has only a key string. <b>Decided</b>: the key is an <i>external</i> item — its own dashed card at the root (link glyph, key in mono, <i>External key</i>), and nothing beyond it is traced. With the full tree on, the other children of the same key gather under it. Its drawer shows the key and a note that there is nothing to open; the child's drawer shows the key as a row too.</>}>
        <Stage style={{ padding: 16, display: "block" }}>
          {row(<>
            <Labelled label="external card at the root, its drawer" tag="decided"><Frame w={640} h={260}><ChildView nodes={CHILD_EXTERNAL} baseId="s_e1" selected="codex:019a5c2e-7f3b" /></Frame></Labelled>
            <Labelled label="the child's drawer — the key as a row" tag="decided"><Frame w={640} h={260}><ChildView nodes={CHILD_EXTERNAL} baseId="s_e1" selected="s_e1" /></Frame></Labelled>
          </>)}
        </Stage>
        <Meta specs={[["card", "dashed border-strong · link glyph · key mono 11 · child_graph.card.external"], ["drawer", "title = key (mono) · External key row · external_note"], ["child drawer", "row child_graph.drawer.external_key"], ["beyond the key", "not traced"]]} tokens={[]} />
      </Spec>

      <Spec id="child-graph-drawer-content" title="Child drawer — order and actions"
        when={<>Title: the nickname, else the surface id in mono. Then, in order: the <b>state line</b> (glyph, state, and confidence after a dot — how sure Tasty is), the <b>actions</b> (View DAG when it created one; <b>Set as base</b> on any card but the base), <b>who</b> (role, surface id, workspace, attach profile when remote), <b>why this state</b> (evidence as its identifier in mono, last state report), <b>where</b> (working directory in mono, wrapping, never cut). Opening or focusing the surface is not here: that is a product decision in the question list.</>}>
        <Stage style={{ padding: 16, display: "block" }}>
          {row(<>
            <Frame label="idle, confirmed by hook" w={520} h={360}><ChildView nodes={CHILD_SMALL} baseId={CHILD_SMALL_BASE} selected="s_01HX9A" /></Frame>
            <Frame label="stale, inferred — the base, no Set as base" w={520} h={360}><ChildView nodes={CHILD_LARGE} baseId="s_w24" selected="s_w24" /></Frame>
          </>)}
        </Stage>
        <Meta specs={[["title", "nickname · or id mono"], ["state line", "glyph + state (state ink) · “·” confidence (text-muted)"], ["actions", "View DAG(s) secondary sm · Set as base ghost sm"], ["rows", "Role · Surface ID · Workspace · Attach profile · State evidence · Last state report · Working directory"], ["values", "ids, evidence, times, paths in mono 11 · cwd wraps (break-all)"], ["nickname", "is the title — no separate row"]]}
          tokens={[{ tok: "--tasty-text-muted", use: "row labels", color: "var(--tasty-text-muted)" }, { tok: "--tasty-text-secondary", use: "row values", color: "var(--tasty-text-secondary)" }]} />
      </Spec>

      <Spec id="child-graph-entry-points" title="Entry points and default shortcuts (decided 4-1, 4-2, 4-3)"
        when={<><b>Tools menu</b>: <i>Open child graph</i> right after <i>Task DAGs</i>. <b>Decided 4-1</b>: default shortcuts — the child graph popup <Kbd keys="Alt+G" /> (macOS <Kbd keys={["⌘", "G"]} />), the Task DAGs popup <Kbd keys="Alt+Y" /> (macOS <Kbd keys={["⌘", "Y"]} />). The Task DAGs key is <b>not a new action</b>: it is a binding of Tasty's existing <i>Toggle DAG list</i> action, which today defaults to <Kbd keys="Alt+Shift+G" />, and an action holds a list of bindings. Still open: whether Alt+Y replaces that binding or joins it; the recommended replacement is drawn, so the action shows Alt+Y only. On macOS a binding's Alt reads as Cmd by default and a setting can switch it to Option (R-56); neither key collides with a default binding or the macOS menu bar. Keybindings and the command palette list them by action name. The Tools menu shows no keys, as today. A terminal surface's context menu takes the same label when it is adopted. <b>Decided 4-3</b>: the surface kind is <code>child_graph</code>; it shows as <i>Child graph</i> in its tab and in the convert list. <b>Decided 4-2</b>: no new entry for DAGs — the Task DAGs popup lists them and a pick goes to the graph inside the same popup (the Task DAG page's popup spec).</>}>
        <Stage style={{ padding: 16, display: "block" }}>
          {row(<>
            <Labelled label="Tools menu — the new item" tag="decided"><div style={{ width: 360 }}><ToolsMenuFrame active="Open child graph" height={380} /></div></Labelled>
            <Labelled label="default shortcuts — Windows and Linux (4-1); Toggle DAG list with Alt+Y only is recommended" tag={["decided", "recommended"]}>
              <div style={{ width: 320, padding: "var(--tasty-space-sm)", background: "var(--tasty-menu-bg)", border: "var(--tasty-border-width) solid var(--tasty-menu-border)", borderRadius: "var(--tasty-radius)" }}>
                <MenuItem label={gt("settings.keybindings.toggle_child_graph_label")} shortcut={<Kbd keys={"Alt+G"} />} />
                <MenuItem label={gt("settings.keybindings.toggle_dag_list_label")} shortcut={<Kbd keys={"Alt+Y"} />} />
              </div>
            </Labelled>
            <Labelled label="default shortcuts — macOS (Alt reads as Cmd, R-56); Toggle DAG list with ⌘Y only is recommended" tag={["decided", "recommended"]}>
              <div style={{ width: 320, padding: "var(--tasty-space-sm)", background: "var(--tasty-menu-bg)", border: "var(--tasty-border-width) solid var(--tasty-menu-border)", borderRadius: "var(--tasty-radius)" }}>
                <MenuItem label={gt("settings.keybindings.toggle_child_graph_label")} shortcut={<Kbd keys={["⌘", "G"]} />} />
                <MenuItem label={gt("settings.keybindings.toggle_dag_list_label")} shortcut={<Kbd keys={["⌘", "Y"]} />} />
              </div>
            </Labelled>
            <Labelled label="terminal context menu (when adopted)">
              <div style={{ width: 220, padding: "var(--tasty-popup-content-margin)", background: "var(--tasty-menu-bg)", border: "var(--tasty-border-width) solid var(--tasty-menu-border)", borderRadius: "var(--tasty-menu-radius)", boxShadow: "var(--tasty-shadow-popover)" }}>
                <MenuItem label="Copy" /><MenuItem label="Paste" /><MenuItem separator /><MenuItem label={gt("child_graph.surface_menu_item")} active />
              </div>
            </Labelled>
            <Labelled label="kind child_graph — name in a tab (4-3)" tag="decided">
              <div style={{ display: "flex", background: "var(--tasty-bg-sidebar)", padding: "var(--tasty-space-xs)" }}><Tab label={gt("child_graph.kind_name")} active /><Tab label="zsh" /></div>
            </Labelled>
          </>)}
        </Stage>
        <Meta specs={[["Tools menu", "child_graph.tools_menu_item, after Task DAGs"], ["child graph key", "action toggle_child_graph, label settings.keybindings.toggle_child_graph_label · default binding Alt+G · macOS ⌘G"], ["Task DAGs key", "existing action toggle_dag_list, existing label settings.keybindings.toggle_dag_list_label · default binding Alt+Y · macOS ⌘Y (recommended: replaces Alt+Shift+G; keeping both adds an Alt+Shift+G line)"], ["macOS", "a binding's Alt reads as Cmd by default; Option by setting (R-56)"], ["kind", "child_graph"], ["context menu", "child_graph.surface_menu_item"], ["kind name", "child_graph.kind_name — tab title and convert list"]]} tokens={[]} />
              <Note>Drawn: the recommended replacement, so Toggle DAG list has one default binding, Alt+Y, and Alt+Shift+G is not drawn. If both are kept, the same action only gains one more binding line, Alt+Shift+G (macOS <Kbd keys={["⌘", "⇧", "G"]} />); nothing else changes.</Note>
      </Spec>

      <Spec id="child-graph-settings-default-row" title="Settings — the full tree default"
        when={<>A new <b>Settings › Misc › Child graph</b> section after Anomaly detection, holding one switch row: the initial state of the full tree checkbox in newly opened child graph popups and surfaces, <b>off</b> by default. It is a section of its own because the settings filter matches section labels only, so <i>child</i> or <i>graph</i> finds it. The checkbox in an open graph changes only that graph.</>}>
        <Stage variant="solo" style={{ padding: "var(--tasty-space-lg)", gap: "var(--tasty-space-lg)", flexWrap: "wrap", alignItems: "flex-start", background: "var(--tasty-bg-app)" }}>
          {GRAPH_LANGS.map((l) => (
            <div key={l} style={{ display: "flex", flexDirection: "column", gap: "var(--tasty-space-xs)" }}>
              <span style={cap}>{l} · Misc › {gt("settings.misc.subtab.child_graph", l)}</span>
              <div style={{ width: 520, maxWidth: "100%", boxSizing: "border-box", padding: "var(--tasty-space-lg)", background: "var(--tasty-bg-panel)", border: "var(--tasty-border-width) solid var(--tasty-border-frame)", borderRadius: "var(--tasty-radius)" }}>
                <ChildGraphSettings lang={l} />
              </div>
            </div>
          ))}
        </Stage>
        <Meta specs={[["L2", "Misc · Scripts → Task pipeline → Anomaly detection → Child graph → Tastyrc (Windows)"], ["row", "Switch · settings label column 150 · gap 16 · min-height 32"], ["caption", "11 muted · measure-md · under the row"], ["default", "off"], ["keys", "settings.misc.subtab.child_graph · settings.child_graph.show_full_tree · _desc"]]}
          tokens={[{ tok: "--tasty-settings-label-width", use: "150" }, { tok: "--tasty-settings-row-min-height", use: "row" }]} />
      </Spec>

      <Spec id="child-graph-copy-keys" title="Copy — every key in four languages"
        when={<>The proposed keys and their values. Codex wrote every value; a script checked placeholders, backtick spans, sentence case, the card meta length, zh-Hans spacing, punctuation and glossary terms, and polite Korean UI endings. Existing keys reused as they are (not listed; the kit copies their four values from Tasty): <code>dag.detail.close</code>, <code>dag_list.back</code>, <code>settings.keybindings.toggle_dag_list_label</code>, <code>dag.zoom.*</code>, <code>dag.lod.*</code>, <code>dag.empty.*</code>.</>}>
        <Stage style={{ padding: 0, display: "block" }}><CopyTable /></Stage>
      </Spec>
    </Section>
  );
}

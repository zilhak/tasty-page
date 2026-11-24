import React from "react";
import { Section, Spec, Stage, Meta, Note, Do, Dont, Views, View } from "../parts/specimen.jsx";
import { ThemePair } from "../parts/theme-frame.jsx";
import { focusViews } from "../parts/surface-focus-views.jsx";
import { ToolsMenuFrame, ShellMock } from "../parts/overlay-frames.jsx";
import { Kbd, MenuItem, Table, Tab, Button, Toast } from "../../components/index.js";
import { DagNode, elbow } from "../../ui_kits/terminal/dag.js";
import { GraphStrip, CHILD_STATE, CHILD_STATE_ORDER } from "../../ui_kits/terminal/overlays/graph_view.jsx";
import { ChildNode, ChildGraphWindow, ChildGraphSurface, ChildGraphSettings, MirrorBanner, RestartNotice, CHILD_SMALL, CHILD_SMALL_BASE, CHILD_LARGE, CHILD_LARGE_BASE,
  CHILD_MIRROR, CHILD_MIRROR_BASE, CHILD_MIRROR_LOST, CHILD_CROSS, CHILD_CHAIN, CHILD_CHAIN_CUT, CHILD_GAP_SIDES, CHILD_GAP_CYCLE, GAP_REASONS, CHILD_EXTERNAL } from "../../ui_kits/terminal/overlays/child_graph.jsx";
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

// The child graph popup shown over the window after its show button (Dialogs › Collapse): the window under
// the scrim, the popup centred, or fitted to the window's top left when the window is smaller than the popup.
function OverWindow({ w = 760, h = 560, fitted = false, children }) {
  return (
    <div style={{ position: "relative", width: w, height: h, flex: "none" }}>
      <div data-audit-exempt="under-scrim"><ShellMock size={[w, h]} /></div>
      <div style={{ position: "absolute", inset: 0, background: "var(--tasty-scrim-bg)", borderRadius: "var(--tasty-radius)" }} />
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: fitted ? "flex-start" : "center", justifyContent: fitted ? "flex-start" : "center" }}>{children}</div>
    </div>
  );
}

// A → B and a gap under B for one reason, so each reason's drawer can be drawn (timeout adds the next try).
const gapChain = (reason) => [CHILD_CHAIN[0], CHILD_CHAIN[1], { id: "g_x", kind: "gap", reason, parent: "s_B1", host: "gpu-box", via: ["lab-build"],
  lastReached: "linux-build · s_B1", ...(reason === "timeout" ? { nextTry: "in 8s" } : {}) }];

// The collapse round trip, live: the surface is too small, so the popup stands as the show button; pressing it
// shows the popup over the window, and the shrink button or an Esc the body does not use folds it back. The
// popup stays mounted while folded, so whatever was selected, opened or pushed is there when it is shown again.
// Key focus follows the app: folding hands it to the show button, so Enter shows the popup again, and showing
// hands it to the popup, so Esc reaches it; Esc after a click outside the popup does nothing to it.
function CollapseRoundTrip() {
  const [open, setOpen] = React.useState(false);
  const [closed, setClosed] = React.useState(false);
  const root = React.useRef(null);
  const wasOpen = React.useRef(false);
  React.useEffect(() => {
    if (wasOpen.current && !open && root.current) {
      const b = root.current.querySelector("[data-collapsed-popup] button");
      if (b) b.focus();
    }
    wasOpen.current = open;
  }, [open]);
  if (closed) return <ClosedPopupFrame onReopen={() => { setClosed(false); setOpen(false); }} />;
  return (
    <div ref={root} style={{ position: "relative", width: 760, height: 560 }}>
      {!open && <ShellMock scope="surface" size={[760, 560]} collapsed="label" ring label={gt("popup.collapsed_button.label", "en")} onShow={() => setOpen(true)} />}
      <div style={{ display: open ? "block" : "none" }}>
        <OverWindow><ChildGraphWindow collapse folded={!open} onCollapse={() => setOpen(false)} onClose={() => setClosed(true)} /></OverWindow>
      </div>
    </div>
  );
}
// After × in the live popup: the popup is gone and the window is as it was; the gallery adds a button to start again.
function ClosedPopupFrame({ onReopen }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--tasty-space-sm)", alignItems: "flex-start" }}>
      <ShellMock size={[760, 560]} />
      <Button size="sm" variant="secondary" onClick={onReopen}>Open the popup again</Button>
    </div>
  );
}

// A frame with the app's window toast in its bottom right corner (the toast stack's corner, space-md in),
// standing for the window corner, so the strip and the toast that come together can be read together.
const WithToast = ({ variant, text, children }) => (
  <div style={{ position: "relative", flex: "none", width: "fit-content", alignSelf: "flex-start" }}>
    {children}
    <div style={{ position: "absolute", right: "var(--tasty-space-md)", bottom: "var(--tasty-space-md)", display: "flex" }}><Toast variant={variant}>{text}</Toast></div>
  </div>
);

export function ChildGraphSection() {
  return (
    <Section id="child" title="Child graph">
      <Spec id="child-card-every-state" title="Child card — six states, base, remote, external, read-only ancestor"
        when={<>The DAG card's box with a surface in it. <b>Name row</b>: terminal glyph (the <b>remote</b> glyph in the remote ink on a mirrored surface) and the nickname, else the role, else the surface id in mono. <b>Meta row</b>: state glyph, STATE in caps, surface id in mono on the right; the state label yields first. On a card from <b>another machine</b> (a mirrored surface or a read-only ancestor) the right slot holds that <b>machine's name</b> instead of the id — the host text: the attach profile name in mono, or the word <i>Remote</i> in the label font when there is none — capped at half the row; the id stays in the drawer and the tooltip. A card on this computer shows no machine name: no remote glyph already means here. Each state <b>borrows a DAG state look</b>, so colour, bar, border and contrast are the DAG node's: <code>active</code> ◑ running · <code>idle</code> ❯ ready (the prompt glyph) · <code>needs_input</code> ! awaiting input · <code>stale</code> ◦ waiting (a guess, so neutral, not a warning) · <code>exited</code> − cancelled, dimmed · <code>unknown</code> ? unknown. Claude and Codex are not told apart: no provider glyph (R-01). Confidence is not on the card; the drawer carries it. The <b>base surface</b> gets a chip <b>above</b> the card, outside its box, so it never fights the state colour or the selection ring and still reads at every LOD tier and when the base is selected.</>}>
        <Stage variant="grid" style={{ display: "block", padding: 20 }}>
          <CardGrid />
          <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginTop: 24, alignItems: "flex-end" }}>
            <Labelled label="base"><Card node={S("active")} base /></Labelled>
            <Labelled label="base + selected"><Card node={S("idle")} base selected /></Labelled>
            <Labelled label="mirrored remote surface — machine name in the id's slot"><Card node={S("active", { remote: true, nickname: "gradle", profile: "lab-mac" })} /></Labelled>
            <Labelled label="mirrored, no profile name — Remote in the label font"><Card node={S("idle", { remote: true, nickname: "gradle", profile: "" })} /></Labelled>
            <Labelled label="long profile name — capped at half the row"><Card node={S("needs_input", { remote: true, nickname: "reviewer", profile: "build-farm-eu-west-2" })} /></Labelled>
            <Labelled label="no nickname, no role → id"><Card node={S("idle", { nickname: null, role: null })} /></Labelled>
            <Labelled label="external parent (4-6)" tag="decided"><Card node={{ id: "codex:019a5c2e-7f3b", kind: "external" }} /></Labelled>
            <Labelled label="remote ancestor, not mirrored (4-9)" tag="decided"><Card node={{ id: "s_m0", kind: "remote-ancestor", nickname: "orchestrator", profile: "lab-linux" }} /></Labelled>
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
          specs={[["box", "168 × 48 · the DAG card (dag-node-*)"], ["name", "nickname → role → id (mono 11)"], ["meta", "glyph · STATE caps 10 · id mono right · another machine: its host text in the id's slot (profile name mono, else attach.mirror_pill_label in the label font), max 50% of the row, ellipsis"], ["dimmed", "exited only, dag-node-dim-opacity (the rest column shows it)"], ["base chip", "16 tall · 4 above the card · label micro · text-secondary on bg-sidebar · border-strong"], ["selection", "the DAG ring, 2px accent, 1px offset"], ["hover", "the DAG hover wash — not shown, see the note"], ["external", "dashed border · link glyph · key in mono · no state"], ["read-only ancestor", "dashed border · remote glyph · “Not mirrored” · its machine's host text"], ["this computer", "no machine name — the terminal glyph and the id"]]}
          tokens={[{ tok: "--tasty-graph-base-chip-height", use: "16" }, { tok: "--tasty-graph-base-chip-gap", use: "4" }, { tok: "--tasty-dag-status-running", use: "active", color: "var(--tasty-dag-status-running)" }, { tok: "--tasty-dag-status-ready", use: "idle", color: "var(--tasty-dag-status-ready)" }, { tok: "--tasty-dag-phase-awaiting", use: "needs_input", color: "var(--tasty-dag-phase-awaiting)" }, { tok: "--tasty-dag-status-waiting", use: "stale", color: "var(--tasty-dag-status-waiting)" }, { tok: "--tasty-dag-status-cancelled", use: "exited", color: "var(--tasty-dag-status-cancelled)" }, { tok: "--tasty-dag-status-unknown", use: "unknown", color: "var(--tasty-dag-status-unknown)" }, { tok: "--tasty-accent-remote-raised", use: "remote glyph", color: "var(--tasty-accent-remote-raised)" }]} />
        <Note>Hover is the DAG card's <code>dag-node-hover-bg</code> wash, unchanged. Measured over every state it drops the state label below 4.5:1 on active, idle, stale and exited in Mocha and Latte, and the DAG card has the same gap. The grid leaves hover out until that token is settled for both graphs; see the question list.</Note>
        <Dont>Do not mark the base with the accent border or a second ring: the accent border already means <i>active</i> and the ring means <i>selected</i>, and the base can be both.</Dont>
      </Spec>

      <Spec id="child-card-and-dag-card-lod" title="Level of detail — child card and DAG card"
        when={<>Both cards change content, never size, at the same zoom tiers: <b>full</b> (≥ 70%) both rows · <b>compact</b> (≥ 40%) glyph + name · <b>block</b> (&lt; 40%) state fill only. The base chip stays at every tier. A card from another machine shows the machine's name at <b>full</b> only; at <b>compact</b> the remote glyph says <i>another machine</i>, at <b>block</b> nothing does, and at every tier the tooltip ends with the machine's name and the drawer names it.</>}>
        <Stage variant="grid" style={{ display: "flex", flexDirection: "column", gap: 16, padding: 20 }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
            {["full", "compact", "block"].map((l) => <Labelled key={l} label={`child · ${l}`}><Card node={S("needs_input", { nickname: "reviewer" })} lod={l} base={l !== "full"} /></Labelled>)}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
            {["full", "compact", "block"].map((l) => <Labelled key={l} label={`another machine · ${l}`}><Card node={S("idle", { nickname: "trainer", remote: true, profile: "gpu-box" })} lod={l} /></Labelled>)}
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
        <Meta specs={[["full", "zoom ≥ 0.7"], ["compact", "0.4 – 0.7"], ["block", "< 0.4"], ["machine name", "full only · compact: remote glyph · block: none · tooltip and drawer at every tier"], ["LOD chip", "existing dag.lod.* copy, both graphs"]]}
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
        when={<>A child graph has one relation, parent → child, so it takes the DAG's <code>depends_on</code> line: solid, neutral, elbowed with a 4px corner, an arrow at the child. Edges that touch the selected card take the accent, as in the DAG. No relation colours, and one dash only: the line to or from a <b>gap node</b> (next specs) is dashed in the dashed-edge rule's 4 / 4, because the chain is cut there and what lies beyond is not known; colour and arrow stay. <b>Decided 4-7 to 4-9</b>: a parent and child on different machines are joined by this <b>same line</b> — the relation is the same; the card says which machine (its remote glyph, and at full LOD the machine's name). Attach occupancy is never a line.</>}>
        <Stage variant="grid" style={{ display: "flex", gap: 32, padding: 20, flexWrap: "wrap" }}>
          {[["parent → child", "var(--tasty-dag-edge-depends)", null, false], ["touching the selection", "var(--tasty-dag-edge-highlight)", null, false], ["between machines (4-7 to 4-9)", "var(--tasty-dag-edge-depends)", null, "decided"], ["to or from a gap node — dashed", "var(--tasty-dag-edge-depends)", "var(--tasty-border-dash) var(--tasty-border-dash-gap)", false]].map(([l, c, d, tag]) => (
            <Labelled key={l} label={l} tag={tag || null}>
              <svg width="120" height="56" viewBox="0 0 120 56" aria-hidden="true">
                <path d={elbow({ x: 8, y: 8 }, { x: 112, y: 48 }, false, 4)} fill="none" stroke={c} strokeWidth="1" style={d ? { strokeDasharray: d } : undefined} />
                <polygon points="105,44 105,52 112,48" fill={c} />
              </svg>
            </Labelled>
          ))}
        </Stage>
        <Meta specs={[["line", "1px solid dag-edge-depends · arrow 8 at the child"], ["selection", "dag-edge-highlight"], ["between machines", "the same line · no own colour or dash"], ["gap node", "the same line dashed border-dash / border-dash-gap (4 / 4) · same colour, arrow and selection accent"]]}
          tokens={[{ tok: "--tasty-dag-edge-depends", use: "parent → child", color: "var(--tasty-dag-edge-depends)" }, { tok: "--tasty-dag-edge-highlight", use: "selected", color: "var(--tasty-dag-edge-highlight)" }, { tok: "--tasty-border-dash", use: "4 on, gap line (reused)" }, { tok: "--tasty-border-dash-gap", use: "4 off (reused)" }]} />
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

      <Spec id="child-graph-popup-collapsed" title="Popup on a small surface — collapsed, shown over the window, and back (decided 10-3 b, popup scope)"
        when={<>The popup is <b>scoped to its base surface</b> (10-3 b), so it follows the rule for every popup narrower than the window (Dialogs › Collapse): when the popup's needed size — 600 × 460, or the size the user resized it to — is larger than the <b>surface bounds</b> on either axis, it <b>collapses</b>. The bounds are the surface rect less an inset of min(8, width / 2, height / 2) on every side, so a surface exactly 600 × 460 gives 584 × 444 and the popup collapses there too. Collapsed, it is the common show button in its own frame, with nothing added: no title and no mark of which base it is for. It sits on the base surface, which already says which; a mark would also widen the frame and make it collapse to the icon sooner. Pressing it shows the popup <b>over the window</b>: the same popup, with the <b>shrink</b> button first in its title bar before close, the 36 toolbar, the canvas and the drawer laid over it. When the window is smaller than the popup too, the common rule (11-19) holds with <b>no graph-specific handling</b>: the frame is fitted to the window from its top left, the title bar with its shrink and close buttons stays whole, and the content keeps the popup's size and is <b>cut at the right and the bottom</b>. What lies past the cut — the zoom cluster and minimap at the bottom right, the right part of an open drawer — is cut with it. The canvas still pans by drag and wheel and zooms with Ctrl and the wheel on the part that shows, Esc still closes the drawer and steps back, and a larger window or a smaller popup size brings the rest back. Moving the zoom cluster to a place that is never cut would change where every popup graph keeps it for a window smaller than the popup, which is the special handling of a narrow space that is not done (same rule, no special case). Collapsing and expanding <b>change nothing inside</b>: the selection, zoom, pan, drawer and the push step (child graph, DAG list, DAG graph) are where they were. A push in progress when the popup collapses finishes at once (the collapsed form draws no content), and expanding shows the step it ended on, with no motion replayed. <b>Esc</b> is used by the body first: it clears the selection, then steps back (DAG graph → list → child graph); only an Esc the body does not use collapses the expanded popup; fitted in its surface it closes the popup, as before, and collapsed it drops the popup's focus like its outside click. The base surface closing closes the popup in either form.</>}>
        <Stage style={{ padding: 16, display: "block", background: "var(--tasty-bg-app)" }}>
          <Labelled label="try it — press Show popup; select builder, View DAG, then the shrink button or Esc (with nothing selected on the child graph) and Show popup again: the step and the selection are where they were" tag="decided"><CollapseRoundTrip /></Labelled>
        </Stage>
        <Views>
          <View name="child-popup-collapsed" label="Collapsed — the common show button, label or icon only" wide>
            {row(<>
              <Labelled label="collapsed — the common show button, nothing added" tag="decided"><ShellMock scope="surface" narrow collapsed="label" ring label={gt("popup.collapsed_button.label", "en")} /></Labelled>
              <Labelled label="collapsed, very narrow — icon only" tag="decided"><ShellMock scope="surface" narrow collapsed="icon" ring leftWidth={64} label={gt("popup.collapsed_button.label", "en")} /></Labelled>
            </>)}
          </View>
          <View name="child-popup-over-window" label="Shown over the window — plain, a card selected, the DAG list step, the DAG graph step" wide>
            {row(<>
              <Labelled label="shown over the window — shrink button before close" tag="decided"><OverWindow><ChildGraphWindow collapse /></OverWindow></Labelled>
              <Labelled label="over the window — a card selected, the drawer over the canvas" tag="decided"><OverWindow><ChildGraphWindow collapse initial={{ selected: "s_01HX7Q" }} /></OverWindow></Labelled>
              <Labelled label="over the window — the DAG list step" tag="decided"><OverWindow><ChildGraphWindow collapse still push={1} initial={{ selected: "s_01HX7Q", owner: "s_01HX7Q" }} /></OverWindow></Labelled>
              <Labelled label="over the window — the DAG graph step" tag="decided"><OverWindow><ChildGraphWindow collapse still push={2} initial={{ selected: "s_01HX7Q", owner: "s_01HX7Q", dagId: "build-and-deploy" }} /></OverWindow></Labelled>
            </>)}
          </View>
          <View name="child-popup-fitted" label="Window smaller than the popup — fitted, content cut; with the drawer open" wide>
            {row(<>
              <Labelled label="window smaller than the popup — fitted from the top left, title bar whole, the content cut at the right and bottom (zoom cluster cut)" tag="decided"><OverWindow w={520} h={380} fitted><ChildGraphWindow collapse cut={{ w: 520, h: 380 }} /></OverWindow></Labelled>
              <Labelled label="window smaller, drawer open — the drawer sits at the popup's right edge, so its right part is cut too" tag="decided"><OverWindow w={520} h={380} fitted><ChildGraphWindow collapse cut={{ w: 520, h: 380 }} initial={{ selected: "s_01HX9A" }} /></OverWindow></Labelled>
            </>)}
          </View>
          <View name="child-popup-round-trip-graph" label="Round trip on the DAG graph step — shrink pressed, collapsed, shown again on the same step" wide>
            {row(<>
              <Labelled label="round trip · 1 · on the DAG graph step, shrink pressed" tag="decided"><OverWindow><ChildGraphWindow collapse still push={2} initial={{ selected: "s_01HX7Q", owner: "s_01HX7Q", dagId: "build-and-deploy" }} /></OverWindow></Labelled>
              <Labelled label="round trip · 2 · collapsed — the same button; the step is kept, not drawn" tag="decided"><ShellMock scope="surface" narrow collapsed="label" ring label={gt("popup.collapsed_button.label", "en")} /></Labelled>
              <Labelled label="round trip · 3 · show pressed — the same DAG graph step, no motion" tag="decided"><OverWindow><ChildGraphWindow collapse still push={2} initial={{ selected: "s_01HX7Q", owner: "s_01HX7Q", dagId: "build-and-deploy" }} /></OverWindow></Labelled>
            </>)}
          </View>
          <View name="child-popup-closed" label="After × — the popup is closed, nothing of it stays (the live demo adds a button to start again)" wide>
            <ClosedPopupFrame />
          </View>
          <View name="child-popup-round-trip-list" label="Round trip on the DAG list step — shrink pressed, collapsed, shown again on the same list" wide>
            {row(<>
              <Labelled label="1 · on the DAG list step, shrink pressed"><OverWindow><ChildGraphWindow collapse still push={1} initial={{ selected: "s_01HX7Q", owner: "s_01HX7Q" }} /></OverWindow></Labelled>
              <Labelled label="2 · collapsed — the same button; the step is kept, not drawn"><ShellMock scope="surface" narrow collapsed="label" ring label={gt("popup.collapsed_button.label", "en")} /></Labelled>
              <Labelled label="3 · show pressed — the same list step, no motion"><OverWindow><ChildGraphWindow collapse still push={1} initial={{ selected: "s_01HX7Q", owner: "s_01HX7Q" }} /></OverWindow></Labelled>
            </>)}
          </View>
          <View name="child-popup-round-trip-mid-push" label="Collapsed during a push — the push ends at once, shown again on the step it was going to" wide>
            {row(<>
              <Labelled label="1 · View DAG pressed, the push half way, shrink pressed"><OverWindow><ChildGraphWindow collapse still push={0.5} initial={{ selected: "s_01HX7Q", owner: "s_01HX7Q" }} /></OverWindow></Labelled>
              <Labelled label="2 · collapsed — the push has ended where it was going"><ShellMock scope="surface" narrow collapsed="label" ring label={gt("popup.collapsed_button.label", "en")} /></Labelled>
              <Labelled label="3 · show pressed — the list step, complete, no motion replayed"><OverWindow><ChildGraphWindow collapse still push={1} initial={{ selected: "s_01HX7Q", owner: "s_01HX7Q" }} /></OverWindow></Labelled>
            </>)}
          </View>
          <View name="child-popup-fitted-resized" label="Resized to 640 × 480, window smaller — the content keeps the resized body (638 × 450) and is cut at the right and bottom" wide>
            <OverWindow w={520} h={380} fitted><ChildGraphWindow collapse width={640} height={480} cut={{ w: 520, h: 380 }} /></OverWindow>
          </View>
          <View name="child-popup-collapsed-locales" label="ko, ja, zh-Hans — collapsed, the common show button with its label, and icon only" wide>
            {row(["ko", "ja", "zh-Hans"].map((l) => (
              <React.Fragment key={l}>
                <Labelled label={`${l} · label`}><ShellMock scope="surface" narrow collapsed="label" ring label={gt("popup.collapsed_button.label", l)} /></Labelled>
                <Labelled label={`${l} · icon only`}><ShellMock scope="surface" narrow collapsed="icon" ring leftWidth={64} label={gt("popup.collapsed_button.label", l)} /></Labelled>
              </React.Fragment>
            )))}
          </View>
          <View name="child-popup-over-window-locales" label="ko, ja, zh-Hans — over the window">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
              {["ko", "ja", "zh-Hans"].map((l) => <OverWindow key={l}><ChildGraphWindow collapse lang={l} initial={{ selected: "s_01HX7Q" }} /></OverWindow>)}
            </div>
          </View>
        </Views>
        <Meta specs={[["collapses when", "the popup's needed size (600 × 460, or the user's size) is larger than the base surface's bounds on either axis · bounds = the surface rect less max(0, min(space-sm 8, width / 2, height / 2)) on every side: a 600 × 460 surface gives 584 × 444, so it collapses · the common rule, nothing child-graph specific"], ["collapsed", "the common frame and show button (popup.collapsed_button.label, glyph fit) · label or icon by the common rule · no title, no base mark"], ["over the window", "the common window-scope form: scrim, shadow-modal, centred · the popup's own title bar with the shrink button first (popup.collapse_button.label, glyph shrink, tooltip popup.collapse_button.tooltip), gap popup-title-btn-gap 4, then close, popup-title-edge-inset 4 from the right edge"], ["window smaller", "the common rule (11-19), nothing graph-specific · frame fitted to the window from its top left · title bar with shrink and close whole · content laid out at the popup's size, cut at the right and bottom · the zoom cluster, minimap and a drawer's right part are cut with it · drag, wheel pan, Ctrl+wheel zoom and Esc still work on what shows"], ["kept", "selection · zoom · pan · drawer · push step · full tree checkbox"], ["motion", "collapse and expand are instant · a push in progress finishes at once · no replay on expand"], ["Esc", "1 clear the selection (drawer closes) · 2 step back (DAG graph → list → child graph) · 3 over the window: collapse · fitted in its surface: close (nothing selected, child graph step) · collapsed: drops the popup's focus, as its outside click does (the common collapsed rule)"], ["focus", "the common rule: Esc goes only to the popup that holds key focus (a press or focus outside it takes it away) · collapsing hands key focus to the show button, so Enter or Space shows it again · showing hands key focus back to the popup · the show button is in Tab order"], ["closes", "the base surface closes, in either form (10-3 b) · the × in the title bar"]]}
          tokens={[{ tok: "--tasty-graph-child-popup-width", use: "600 — the needed width" }, { tok: "--tasty-graph-child-popup-height", use: "460 — the needed height" }, { tok: "--tasty-space-sm", use: "8 — the surface bounds inset (at most)" }, { tok: "--tasty-popup-title-btn-gap", use: "4 between shrink and close" }, { tok: "--tasty-popup-title-edge-inset", use: "4, close ↔ right edge" }, { tok: "--tasty-scrim-bg", use: "over the window", color: "var(--tasty-scrim-bg)" }, { tok: "--tasty-shadow-modal", use: "the expanded frame" }]} />
        <Note>The collapsed frames are the common <code>ShellMock</code> of Dialogs › Collapse, because the collapsed child graph popup draws nothing of its own. The DAG list popup is Workspace-scoped (the tab bar and panes), so it collapses only when the window itself is small, by the same rule; it needs no specimen of its own.</Note>
      </Spec>

      <Spec id="child-graph-surface-header" title="Surface — base picker and checkbox in the header (decided R-51 14, Q14, 14-1 to 14-6)"
        when={<>A tab of its own kind. The header is the DAG header's recipe (sidebar band, 8 / 12 padding): branch glyph · <b>Base surface</b> · the <b>base picker</b> · the full tree checkbox · refresh. Under 640 the header wraps: base above, checkbox and refresh below. The canvas takes the surface bed. <b>Decided</b>: the picker lists <b>every terminal surface in every window</b>, mirrored remote workspaces included, with no filter by parent or child. <b>Decided (Q14)</b>: only terminal surfaces are listed; markdown, explorer, html and graph surfaces are left out, because child relations form only between terminals and such a base would always draw an empty graph. Closed it is the Select trigger and reads <code>workspace / name · id</code>. Open it is the searchable list's shell holding a tree shaped like the <b>sidebar</b>: <b>window › category › workspace › pane › tab › surface</b>, and only a surface row picks. Categories are the sidebar's band (the reserved one reads <i>Workspaces</i>), the workspace row is the sidebar's status dot and name with the remote glyph and host on a mirror, and the rest are the sidebar tree row. <b>Decided 14-3</b>: split layouts (PaneGroup, SurfaceGroup) are not levels: panes and surfaces list in layout order. <b>Decided 14-4</b>: a level is drawn even when it holds one item — a workspace with one pane has its pane row, a tab with one surface has its tab row and then its surface row. The only levels left out: the <b>category</b> level when workspace categories are off (14-1) and the <b>window</b> level when the app has one window (14-2). <b>Decided 14-2, 14-2b, 14-6</b>: windows are numbered in the order they were opened (<i>Window 1</i>, <i>Window 2</i>) and listed in that order; the one the graph is in adds <i>· This window</i> after its number, muted, on the same line; a window whose OS window is closed but whose sessions still run (parked) is listed like any other, keeps its number and its place, and has no mark (<i>Window 2</i> here).</>}>
        <Stage style={{ padding: 16, display: "flex", gap: 16, flexWrap: "wrap", alignItems: "stretch" }}>
          <Frame label="wide" w={760} h={420}><ChildGraphSurface /></Frame>
          <Frame label="narrow 360" w={360} h={420}><ChildGraphSurface narrow nodes={CHILD_SMALL} baseId={CHILD_SMALL_BASE} /></Frame>
        </Stage>
        {focusViews("child-graph-surface", (focused) => <div style={{ height: 300, minWidth: 320 }}><ChildGraphSurface nodes={CHILD_SMALL} baseId={CHILD_SMALL_BASE} focused={focused} /></div>)}
        <Views>
          <View name="child-picker-open" label="The open picker — three windows, every row open, categories off" wide>
            {row(<>
              <Labelled label="three windows, categories on · the path to the base open, base selected · Window 3 · This window · Window 2 parked, unmarked" tag="decided"><div style={{ minHeight: 440, width: "var(--tasty-graph-base-picker-width)" }}><BasePicker value="s_w23" open inline /></div></Labelled>
              <Labelled label="every row open — one pane (notes, nightly) and two panes (tasty) · a tab with one surface keeps its tab row" tag="decided"><div style={{ minHeight: 440, width: "var(--tasty-graph-base-picker-width)" }}><BasePicker value="s_w23" open inline openAll /></div></Labelled>
              <Labelled label="categories off — no band, workspaces straight under the window (14-1)" tag="decided"><div style={{ minHeight: 440, width: "var(--tasty-graph-base-picker-width)" }}><BasePicker value="s_01HX7Q" open inline categoriesOn={false} /></div></Labelled>
            </>)}
          </View>
          <View name="child-picker-open-more" label="The open picker — one window, a filter with matches, a filter with none" wide>
            {row(<>
              <Labelled label="one window — no window level (14-2)" tag="decided"><div style={{ minHeight: 440, width: "var(--tasty-graph-base-picker-width)" }}><BasePicker windows={PICKER_ONE_WINDOW} value="s_w23" open inline /></div></Labelled>
              <Labelled label="filter “work” — matches with their path" tag="decided"><div style={{ minHeight: 440, width: "var(--tasty-graph-base-picker-width)" }}><BasePicker value="s_w23" open inline query="work" /></div></Labelled>
              <Labelled label="filter with no match" tag="decided"><div style={{ minHeight: 140, width: "var(--tasty-graph-base-picker-width)" }}><BasePicker value="s_w23" open inline query="zzz" /></div></Labelled>
            </>)}
          </View>
          <View name="child-surface-selector-empty" label="No terminal surface in any window — the picker is disabled">
            <Frame w={560} h={200}><ChildGraphSurface nodes={[]} baseId="" status="empty" windows={[]} /></Frame>
          </View>
          <View name="child-surface-picker-locales" label="ko, ja, zh-Hans — the open picker">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
              {["ko", "ja", "zh-Hans"].map((l) => <div key={l} style={{ minHeight: 440, width: "var(--tasty-graph-base-picker-width)" }}><BasePicker lang={l} value="s_m2" open inline /></div>)}
            </div>
          </View>
        </Views>
        <Meta specs={[["header", "bg-sidebar · 8 / 12 · wraps < 640"], ["label", "Base surface · caption muted"], ["trigger", "the Select trigger · field-width-lg · “workspace / name · id” · placeholder child_graph.empty.pick_base"], ["popover", "menu shell · graph-base-picker-width 360 · max graph-base-picker-height 400 · filter field + separator + tree (only the tree scrolls)"], ["levels", "window (TreeRow, child_graph.picker.window) › category (sidebar category band, count) › workspace (status dot + name, remote glyph + host) › pane (child_graph.picker.pane) › tab (title) › surface (terminal or remote glyph · name · id mono)"], ["window row", "child_graph.picker.window({n}) · the graph's window adds “ · ” + child_graph.picker.this_window in text-muted, in the label, same line, ellipsis with the label · no meta"], ["numbers", "open order, one sequence · a parked window keeps its number and its place · no closed mark (14-6)"], ["kinds", "terminal surfaces only (decided, Q14) · markdown, explorer, html and graph surfaces are not listed"], ["scope", "every window, parked ones included · mirrors included · no relation filter"], ["levels kept", "every level, even with one item: pane row with one pane, tab row + surface row with one surface (14-4)"], ["levels left out", "category level when categories are off (14-1) · window level with one window (14-2) · split groups never (14-3)"], ["open state", "windows and categories open · the path to the base open, base selected · the rest closed"], ["height", "max graph-base-picker-height 400, the tree scrolls · the deeper tree adds pane and tab rows only on the open path"], ["filter", "surface name, id or workspace · child_graph.picker.search · none: picker.no_match"], ["disabled", "no terminal surface in any window · child_graph.base_empty"], ["checkbox", "child_graph.show_full_tree"], ["canvas", "surface bed, focused or unfocused"]]}
          tokens={[{ tok: "--tasty-graph-base-picker-width", use: "360" }, { tok: "--tasty-graph-base-picker-height", use: "400" }, { tok: "--tasty-sidebar-category-header-bg", use: "category band", color: "var(--tasty-sidebar-category-header-bg)" }, { tok: "--tasty-tree-row-indent", use: "12 per level" }, { tok: "--tasty-field-width-lg", use: "trigger" }]} />
        <Note>In the app the picker opens as a floating layer over the surface. Here the open picker is drawn on its own in the views below, because the gallery frame would clip it.</Note>
      </Spec>

      <Spec id="child-to-dag-push-and-back" title="Child graph → DAG — push right, back with the chevron"
        when={<>Selecting a surface that <b>created</b> a DAG shows <b>View DAG</b> in its drawer. It <b>pushes</b> the whole area under the title bar (or the surface) to the left and the next screen comes in from the right, in <span className="tok">--tasty-motion-ui</span> (120); with reduced motion it switches at once. The next screen is always the <b>list step</b> (next spec), even for one DAG; picking the DAG there pushes again to the DAG screen. Each pushed screen's top is a <b>DrillDown back bar</b>: the back chevron at the top left and the title. The DAG screen's title is the DAG name, <i>From builder</i> in muted text, with the runner badge on the right. Back slides the other way and <b>restores</b> the child view as it was — zoom, pan, selection, open drawer — because the child graph is where the user was working; the DAG popup's list back still resets, since a list has no view to restore. The DAG screen is the DAG graph unchanged: its own zoom cluster on the canvas and its drawer.</>}>
        <Stage style={{ padding: 16, display: "block", background: "var(--tasty-bg-app)" }}>
          {row(<>
            <Labelled label="1 · before — View DAG in the drawer"><ChildGraphWindow width={480} height={360} still push={0} initial={{ selected: "s_01HX7Q", owner: "s_01HX7Q" }} /></Labelled>
            <Labelled label="2 · middle frame — half way to the list"><ChildGraphWindow width={480} height={360} still push={0.5} initial={{ selected: "s_01HX7Q", owner: "s_01HX7Q" }} /></Labelled>
            <Labelled label="3 · after — the list step, back chevron top left"><ChildGraphWindow width={480} height={360} still push={1} initial={{ selected: "s_01HX7Q", owner: "s_01HX7Q" }} /></Labelled>
          </>)}
        </Stage>
        <Views>
          <View name="child-push-surface" label="Surface frame — the same push, the back bar replaces the header">
            <Frame w={760} h={380}><ChildGraphSurface nodes={CHILD_SMALL} baseId={CHILD_SMALL_BASE} initial={{ selected: "s_01HX7Q", owner: "s_01HX7Q", dagId: "build-and-deploy" }} /></Frame>
          </View>
        </Views>
        <Meta specs={[["trigger", "View DAG — Button secondary sm, only when the surface created a DAG"], ["motion", "translateX of the whole area · motion-ui 120 · ease-ui · reduced motion: 0"], ["next screen", "the list step, one DAG or several (decided 10-2 a)"], ["back", "DrillDown back bar 36 · chevron-left IconButton · tooltip child_graph.back on the list, dag_list.back on the DAG"], ["title", "DAG name · “From {name}” muted (child_graph.from)"], ["actions", "runner badge, no hint"], ["return", "child view restored as left"], ["Esc on the DAG screen", "clears the DAG selection first, then goes back"]]}
          tokens={[{ tok: "--tasty-graph-push-motion", use: "120 → motion-ui" }, { tok: "--tasty-drilldown-backbar-height", use: "36" }]} />
        <Note>The back control is DrillDown's, so one back affordance serves the app. It draws <code>chevronLeft</code>; the request wrote <code>&lt;-</code>. See the question list if a literal arrow is wanted.</Note>
      </Spec>

      <Spec id="child-several-dags-list-step" title="The list step — one DAG or several (decided 4-5, 10-2 a)"
        when={<><b>Decided</b>: the list of DAGs comes first, <b>whatever their number</b>. One button: <b>View DAG</b> for one, <b>View DAGs (2)</b> for several — the label counts the DAGs, the press always does the same thing. It pushes to a <b>list step</b> of the DAGs that surface created — the DAG list's own rows — titled <i>DAGs created by builder</i>, one row or many; picking one pushes to the graph. Three steps, one back bar each: the graph's back returns to the list (<i>Back to list</i>), the list's back returns to the child graph, restored as it was left.</>}>
        <Stage style={{ padding: 16, display: "block", background: "var(--tasty-bg-app)" }}>
          <Labelled label="try it — select conductor-page, View DAGs (2), pick a DAG, then back twice" tag="decided"><ChildGraphWindow nodes={CHILD_LARGE} baseId="s_c2" width={480} height={380} /></Labelled>
        </Stage>
        <Views>
          <View name="child-list-step-one" label="One DAG — drawer, list step, graph step, back once, back twice" wide>
            {row(<>
              <Labelled label="one DAG · 1 · drawer — View DAG" tag="decided"><ChildGraphWindow width={480} height={360} still push={0} initial={{ selected: "s_01HX7Q", owner: "s_01HX7Q" }} /></Labelled>
              <Labelled label="one DAG · 2 · list step, one row" tag="decided"><ChildGraphWindow width={480} height={360} still push={1} initial={{ selected: "s_01HX7Q", owner: "s_01HX7Q" }} /></Labelled>
              <Labelled label="one DAG · 3 · graph step — back to the list" tag="decided"><ChildGraphWindow width={480} height={360} still push={2} initial={{ selected: "s_01HX7Q", owner: "s_01HX7Q", dagId: "build-and-deploy" }} /></Labelled>
              <Labelled label="one DAG · 4 · back once — the list again" tag="decided"><ChildGraphWindow width={480} height={360} still push={1} initial={{ selected: "s_01HX7Q", owner: "s_01HX7Q" }} /></Labelled>
              <Labelled label="one DAG · 5 · back twice — the child graph as it was left, drawer open" tag="decided"><ChildGraphWindow width={480} height={360} still push={0} initial={{ selected: "s_01HX7Q" }} /></Labelled>
            </>)}
          </View>
          <View name="child-list-step-several" label="Several DAGs — drawer, list step, graph step" wide>
            {row(<>
              <Labelled label="several · drawer — View DAGs (2)" tag="decided"><ChildGraphWindow nodes={CHILD_LARGE} baseId="s_c2" width={480} height={380} still push={0} initial={{ selected: "s_c2", owner: "s_c2" }} /></Labelled>
              <Labelled label="several · list step" tag="decided"><ChildGraphWindow nodes={CHILD_LARGE} baseId="s_c2" width={480} height={380} still push={1} initial={{ selected: "s_c2", owner: "s_c2" }} /></Labelled>
              <Labelled label="several · graph step — back to the list" tag="decided"><ChildGraphWindow nodes={CHILD_LARGE} baseId="s_c2" width={480} height={380} still push={2} initial={{ selected: "s_c2", owner: "s_c2", dagId: "docs-publish" }} /></Labelled>
            </>)}
          </View>
        </Views>
        <Meta specs={[["button", "child_graph.drawer.view_dag for one DAG · view_dags({n}) when n > 1 · same press either way"], ["list title", "child_graph.dag_list_title({name}), one DAG or several"], ["list rows", "the DAG list row (ListCtrl 36) — rollup + done/total"], ["back from graph", "existing dag_list.back “Back to list”"], ["back from list", "child_graph.back"], ["one DAG", "the list step with one row (decided 10-2 a)"]]}
          tokens={[{ tok: "--tasty-dag-row-height", use: "36 list row" }]} />
      </Spec>

      <Spec id="child-graph-empty-and-base-closed" title="Empty and base closed (decided 4-4, 10-3 b)"
        when={<>A base with no parent and no children shows the child empty block, in either form. <b>Only the surface form</b> has a base-closed state. <b>Decided 4-4</b> (as the DAG surface does for a missing DAG): the canvas says <i>Base surface closed</i> with a <b>Select base surface</b> button that opens the base picker, and the picker shows its placeholder. A base lost to its mirror ending adds a banner (next spec) only when the user detached the mirror or a mirror with no saved row was closed after a drop; a <b>workspace the server closed</b> shows this state as it is, with no banner, beside the app's window toast <code>attach.toast.workspace_closed_on_server</code>. <b>Decided 10-3 b</b>: the <b>popup</b> is scoped to its base surface, so it closes when that surface closes — like any popup whose scope is gone — and it has no base-closed screen. Nothing is drawn for it here.</>}>
        <Stage variant="grid" style={{ display: "flex", flexWrap: "wrap", gap: 16, padding: 20, alignItems: "flex-start" }}>
          <Labelled label="child empty — popup"><ChildGraphWindow nodes={CHILD_SMALL.slice(3).map((n) => ({ ...n, parent: undefined }))} baseId="s_01HXB2" width={420} height={280} /></Labelled>
          <Labelled label="base closed — pick another" tag="decided"><Frame w={480} h={300}><ChildGraphSurface status="base-closed" nodes={CHILD_SMALL} /></Frame></Labelled>
        </Stage>
        <Meta specs={[["empty", "child_graph.empty.none + none_hint · gitBranch glyph · popup and surface"], ["base closed", "surface only · child_graph.empty.base_closed + _hint · paneEmpty glyph · Button secondary sm pick_base"], ["base picker", "placeholder child_graph.empty.pick_base"], ["mirror base", "a banner only when the mirror was detached or, with no saved row, closed after a drop (next spec) · a workspace the server closed: this state, no banner, beside the app's attach.toast.workspace_closed_on_server"], ["popup, base closed", "no state: the popup is scoped to its base surface and closes with it (decided 10-3 b)"]]}
          tokens={[]} />
      </Spec>

      <Spec id="child-graph-mirror-base-detached" title="Base was a mirrored surface — detached or closed, Reconnect, the reason, the restart notice (decided 13, 13-2 to 13-5)"
        when={<>A child graph surface whose base is a <b>mirrored remote surface</b> loses it when the mirror is <b>detached</b> (the user's act) or its <b>mirror workspace is closed</b> after the connection dropped. It covers the two ways the app ends a mirror while the base was on it. <b>Detached</b>: the user closed or disconnected the mirror (the app shows no toast). <b>Closed after a drop</b>: a mirror with <b>no saved row</b> ended for a remote reason — a transport drop, a forced disconnect, a failed resync or a failed resync reattach — and the app closed it and showed its window toast <code>attach.toast.mirror_disconnected</code>; a mirror with a saved row never ends this way, since the app keeps it and reconnects, so this cause always has Reconnect disabled. Not this banner: a <b>workspace the server closed</b> (the app shows its own toast, and the base surface is closed, so the surface shows the base-closed state of 4-4), and a <b>resync reattach in progress</b> (nothing of its own; it ends with the graph as it was, or closed after a drop). <b>Decided</b>: a banner across the top says which, and the rest is the <b>pick a base surface</b> state of 4-4 (the picker shows its placeholder; the canvas offers <i>Select base surface</i>). Detached takes the neutral band; closed after a drop, or a failed try, takes the warning band, as the refresh error does. A <b>transport drop that keeps the mirror</b> is not this banner: the base is still here, so the mirrored cards stay with their states unknown under the warning strip, and what lay beyond the mirror — here the read-only ancestor — is folded into one <i>Disconnected</i> gap node on a dashed line (last frame; Graph view › Status; the gap node spec). The banner ends in <b>Reconnect</b>: it attaches again through the mirror's <b>saved remote workspace row</b> — its attach profile — to the <b>same remote surface</b> (its tooltip names both). While it tries, the button is disabled with a spinner and reads <i>Reconnecting…</i>. <b>On failure</b> (13-4 a) the banner stays, turns to the warning band and <b>leads with the reason</b> in one sentence — <i>could not reach Tasty there</i>, <i>the surface is no longer in its workspace there</i> (closed, or moved to another workspace: 13-3 a), or <i>another client holds it</i> (13-5 a: the reason only, with no force-detach button and no prompt) — and Reconnect stays live for another try; the sentence replaces the cause, which the user already read. <b>On success</b> the banner goes and the graph returns with that base. If the remote Tasty had <b>restarted</b> and restored the same surface id (13-2 a), an <b>info strip</b> takes the banner's place — the same 28 strip, so the canvas does not move — and says so until it is dismissed, another base is picked or the base is lost again. Picking another base also clears the banner. The machine is named by the <b>host text rule</b> (Dialogs › File handler › Remote path): the attach profile name (R-57). With <b>no profile name</b> every sentence takes its <b>no-host</b> form, which leaves the host out (the word Remote there would read as a machine name; <code>127.0.0.1:&lt;port&gt;</code> is never shown). What Reconnect can do depends on the <b>saved remote workspace row</b>, not on the profile name: a row saved with an empty name has one, so Reconnect works and its tooltip leaves the empty name out; a mirror with <b>no saved row</b> (<code>--ssh</code>, <code>--target-port</code>, a hand-installed attach) has nothing to reattach with, so Reconnect stays in place, <b>disabled</b>, with that reason as its tooltip (an impossible action is shown disabled, not hidden). A hand-installed attach can keep a <b>profile name</b> and still have no saved row: the sentences name its host, and Reconnect is disabled all the same. This banner is a <b>proposal</b>: the app has no mirror banner and no Reconnect in its graphs yet.</>}>
        <Stage style={{ padding: 16, display: "block" }}>
          <Labelled label="mirror detached — Reconnect" tag="decided"><Frame w={560} h={280}><ChildGraphSurface nodes={CHILD_SMALL} status="base-closed" banner={<MirrorBanner cause="detached" />} /></Frame></Labelled>
        </Stage>
        <Views>
          <View name="child-mirror-reconnect-results" label="After Reconnect is pressed — trying, the three failure reasons, back after a remote restart" wide>
            {row(<>
              <Labelled label="Reconnect — trying" tag="decided"><Frame w={560} h={280}><ChildGraphSurface nodes={CHILD_SMALL} status="base-closed" banner={<MirrorBanner cause="detached" state="trying" />} /></Frame></Labelled>
              <Labelled label="failed — could not reach Tasty there; Reconnect again" tag="decided"><Frame w={560} h={280}><ChildGraphSurface nodes={CHILD_SMALL} status="base-closed" banner={<MirrorBanner state="failed" reason="unreachable" />} /></Frame></Labelled>
              <Labelled label="failed — the surface is gone or moved to another workspace there (13-3 a)" tag="decided"><Frame w={560} h={280}><ChildGraphSurface nodes={CHILD_SMALL} status="base-closed" banner={<MirrorBanner state="failed" reason="surface_gone" />} /></Frame></Labelled>
              <Labelled label="failed — another client holds it; no force detach (13-5 a)" tag="decided"><Frame w={560} h={280}><ChildGraphSurface nodes={CHILD_SMALL} status="base-closed" banner={<MirrorBanner state="failed" reason="held" />} /></Frame></Labelled>
              <Labelled label="reconnected after a remote restart — the info strip in the banner's place (13-2 a)" tag="decided"><Frame w={560} h={280}><ChildGraphSurface nodes={CHILD_MIRROR} baseId={CHILD_MIRROR_BASE} banner={<RestartNotice />} /></Frame></Labelled>
            </>)}
          </View>
          <View name="child-mirror-ends" label="How the mirror ended — closed after a drop with the app's toast, a server-closed workspace, a drop that keeps the mirror" wide>
            {row(<>
              <Labelled label="mirror closed after a drop (no saved row only) — the banner and the app's warning toast together; Reconnect disabled, reason as tooltip" tag="decided"><WithToast variant="warning" text={gt("attach.toast.mirror_disconnected", "en")}><Frame w={560} h={280}><ChildGraphSurface nodes={CHILD_SMALL} status="base-closed" banner={<MirrorBanner cause="lost" saved={false} />} /></Frame></WithToast></Labelled>
              <Labelled label="not this banner — the server closed the workspace: the base-closed state (4-4) and the app's success toast, no banner" tag="decided"><WithToast variant="success" text={gt("attach.toast.workspace_closed_on_server", "en")}><Frame w={560} h={280}><ChildGraphSurface nodes={CHILD_SMALL} status="base-closed" /></Frame></WithToast></Labelled>
              <Labelled label="not this banner — a drop that keeps the mirror: the mirrored cards stay, states unknown, under the warning strip; the ancestor beyond the mirror folded into a gap node" tag="decided"><Frame w={560} h={280}><ChildGraphSurface nodes={CHILD_MIRROR_LOST} baseId={CHILD_MIRROR_BASE} banner={<GraphStrip>{gt("graph.remote_disconnected", "en", "lab-linux")}</GraphStrip>} /></Frame></Labelled>
            </>)}
          </View>
          <View name="child-mirror-banner-named-no-row" label="A profile name with no saved row (a hand-installed attach) — the host is named, Reconnect disabled with the no-saved-row tooltip" wide>
            {row(<>
              <Frame label="detached — named, no saved row" w={560} h={280}><ChildGraphSurface nodes={CHILD_SMALL} status="base-closed" banner={<MirrorBanner cause="detached" saved={false} />} /></Frame>
              <Frame label="closed after a drop — named, no saved row" w={560} h={280}><ChildGraphSurface nodes={CHILD_SMALL} status="base-closed" banner={<MirrorBanner cause="lost" saved={false} />} /></Frame>
            </>)}
          </View>
          <View name="child-mirror-banner-no-host" label="No profile name — every sentence in its no-host form; a profile saved with an empty name keeps Reconnect, an attach with no saved row has it disabled">
            <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--tasty-space-lg)" }}>
              {[["saved row, empty name — detached", { cause: "detached" }], ["saved row, empty name — failed, unreachable", { state: "failed", reason: "unreachable" }], ["saved row, empty name — failed, surface gone", { state: "failed", reason: "surface_gone" }], ["saved row, empty name — failed, held", { state: "failed", reason: "held" }], ["no saved row — mirror workspace closed, Reconnect disabled", { cause: "lost", saved: false }], ["no saved row — detached, Reconnect disabled", { cause: "detached", saved: false }]].map(([label, p]) => (
                <Frame key={label} label={label} w={560} h={280}><ChildGraphSurface nodes={CHILD_SMALL} status="base-closed" banner={<MirrorBanner host="" profile="" {...p} />} /></Frame>
              ))}
              <Frame label="restart notice — no-host form" w={560} h={280}><ChildGraphSurface nodes={CHILD_MIRROR} baseId={CHILD_MIRROR_BASE} banner={<RestartNotice host="" />} /></Frame>
            </div>
          </View>
          <View name="child-mirror-banner-no-host-locales" label="ko, ja, zh-Hans — the no-host sentences: detached, the three failures, closed after a drop, the restart notice (the strip alone)" wide>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--tasty-space-lg)" }}>
              {["ko", "ja", "zh-Hans"].map((l) => (
                <div key={l} style={{ display: "flex", flexDirection: "column", gap: "var(--tasty-space-sm)", width: 560, background: "var(--tasty-bg-panel)" }}>
                  <span style={cap}>{l}</span>
                  <MirrorBanner host="" profile="" cause="detached" lang={l} />
                  {["unreachable", "surface_gone", "held"].map((r) => <MirrorBanner key={r} host="" profile="" state="failed" reason={r} lang={l} />)}
                  <MirrorBanner host="" profile="" cause="lost" saved={false} lang={l} />
                  <RestartNotice host="" lang={l} />
                </div>
              ))}
            </div>
          </View>
          <View name="child-mirror-banner-locales" label="ko, ja, zh-Hans — the three reasons, the closed mirror and the restart notice">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
              {["ko", "ja", "zh-Hans"].map((l) => (
                <React.Fragment key={l}>
                  {["unreachable", "surface_gone", "held"].map((r) => <Frame key={l + r} label={`${l} · failed, ${r}`} w={560} h={280}><ChildGraphSurface lang={l} nodes={CHILD_SMALL} status="base-closed" banner={<MirrorBanner state="failed" reason={r} lang={l} />} /></Frame>)}
                  <WithToast variant="warning" text={gt("attach.toast.mirror_disconnected", l)}><Frame label={`${l} · mirror workspace closed, no saved row, with the app's toast`} w={560} h={280}><ChildGraphSurface lang={l} nodes={CHILD_SMALL} status="base-closed" banner={<MirrorBanner cause="lost" saved={false} lang={l} />} /></Frame></WithToast>
                  <WithToast variant="success" text={gt("attach.toast.workspace_closed_on_server", l)}><Frame label={`${l} · the server closed the workspace — base closed, the app's toast`} w={560} h={280}><ChildGraphSurface lang={l} nodes={CHILD_SMALL} status="base-closed" /></Frame></WithToast>
                  <Frame label={`${l} · restart notice`} w={560} h={280}><ChildGraphSurface lang={l} nodes={CHILD_MIRROR} baseId={CHILD_MIRROR_BASE} banner={<RestartNotice lang={l} />} /></Frame>
                </React.Fragment>
              ))}
            </div>
          </View>
        </Views>
        <Meta specs={[["banner", "GraphStrip 28 · detached: info band · closed after a drop / failed: warning band (dag-cycle-*) · text ellipsis, full text as tooltip"], ["when", "detached: the user closed or disconnected the mirror (no app toast) · closed after a drop: a mirror with no saved row ended for a remote reason (transport drop, forced disconnect, failed resync, failed resync reattach), together with the app's window toast attach.toast.mirror_disconnected (warning) — the banner stays with the graph, the toast leaves on its timer"], ["not this banner", "a saved-row mirror's drop: the app reconnects, the graph keeps the mirrored cards (state unknown) under graph.remote_disconnected and folds what lay beyond the mirror into a disconnected gap node · a resync reattach in progress: nothing · a workspace the server closed: the base-closed state (4-4), no banner, beside the app's attach.toast.workspace_closed_on_server (success); the app then ends the mirror locally, so attach.toast.mirror_disconnected does not follow"], ["Reconnect", "detached + saved row only · closed after a drop has no saved row by definition, so Reconnect is always disabled there"], ["text", "child_graph.mirror_detached(host, name) · mirror_lost(host, name)"], ["failed", "the reason replaces the cause · reconnect_failed.unreachable(host) · reconnect_failed.surface_gone(name, host) — closed there or moved to another workspace there · reconnect_failed.held(name, host) — no force detach button or prompt · Reconnect live again"], ["host", "the host text rule: attach profile name (R-57) · never 127.0.0.1:<port>"], ["no host", "empty host text → the _no_host key of the same sentence (mirror_detached_no_host(name), mirror_lost_no_host(name), reconnect_failed.*_no_host, remote_restarted_no_host(name)) · same band"], ["saved row, empty name", "Reconnect enabled · tooltip reconnect_tooltip_no_host(name)"], ["no saved row", "--ssh, --target-port, a hand-installed attach: Reconnect disabled in place · tooltip reconnect_unavailable (not a saved remote workspace row) · trying and failed never occur · a profile name may remain (hand-installed): the host sentence, still disabled"], ["action", "Button secondary sm child_graph.reconnect · tooltip reconnect_tooltip(name, profile)"], ["trying", "disabled · Spinner 12 · child_graph.reconnecting"], ["below", "pick a base surface state (4-4): child_graph.empty.base_closed · pick_base"], ["restart notice", "13-2 a · info GraphStrip 28 in the banner's place over the returned graph · child_graph.remote_restarted(host, name) · × IconButton sm, child_graph.notice_dismiss · stays until dismissed, another base, or the base lost again · not timed"], ["clears", "reconnected (banner), or another base picked"], ["proposal", "the app has no mirror banner, notice or Reconnect in its graphs yet"]]}
          tokens={[{ tok: "--tasty-dag-cycle-bg", use: "warning band", color: "var(--tasty-dag-cycle-bg)" }, { tok: "--tasty-dag-chrome-bg", use: "info band", color: "var(--tasty-dag-chrome-bg)" }, { tok: "--tasty-dag-cycle-height", use: "28" }]} />
        <Note>Why a strip and not a toast for the restart: the toast is window-wide and leaves on a timer, while the restart concerns this graph, whose content may have changed with the restart; the strip stays with the graph until it is read. Why the reason replaces the cause on failure: the user pressed Reconnect after reading the cause, so the next sentence answers that press. The one-line strip ellipsizes the end, so each reason sentence starts with the failure.</Note>
      </Spec>

      <Spec id="child-graph-mirror-scope-and-remote-ancestor" title="Across machines — one graph, the machine on the card, read-only ancestors (decided 4-7 to 4-9, 9-2)"
        when={<><b>Decided</b>: parent and child relations that cross machines are <b>one graph</b> — this computer's surface <i>A</i>, its child <i>B</i> on a remote, and <i>B</i>'s child <i>C</i> on a machine <i>B</i> attached to read A → B → C with ordinary lines. Cards from another machine carry the remote glyph and, at full LOD, the <b>machine's name</b> in the id's slot, so <i>B</i> and <i>C</i> read apart; cards on this computer carry no name. The machine's name is its attach profile name (9-2): for a machine two or more hops away, the profile name the machine before it gave it. The drawer names the machine in <b>Attach profile</b>, and a surface reached through other machines adds <b>Reached through</b> with them in order. An attach with no profile name has <b>no Attach profile row</b> (the word Remote under that key would read as a profile name); its card shows <i>Remote</i> in the label font, as the host text rule says. An ancestor in a remote workspace that is not mirrored here is drawn <b>read-only</b>: dashed card, <i>Not mirrored</i>, its machine's name like any other card from there, a drawer with rows and a note and no actions. Ancestors are followed to the root across workspaces and machines. Attach occupancy (which machine mirrors which) is never drawn.</>}>
        <Stage style={{ padding: 16, display: "block" }}>
          <Labelled label="A → B → C → D over three machines — select a card for its drawer" tag="decided"><Frame w={760} h={320}><ChildView nodes={CHILD_CHAIN} baseId="s_A1" /></Frame></Labelled>
        </Stage>
        <Views>
          <View name="child-graph-chain-drawers" label="Drawers open — C of the three-machine chain, the read-only ancestor, a remote surface, a remote child" wide>
            {row(<>
              <Labelled label="A → B → C → D over three machines; C's drawer: Attach profile gpu-box, Reached through lab-build" tag="decided"><Frame w={760} h={320}><ChildView nodes={CHILD_CHAIN} baseId="s_A1" selected="s_C1" /></Frame></Labelled>
              <Labelled label="read-only ancestor in a workspace not mirrored here (drawer open on it)" tag="decided"><Frame w={640} h={320}><ChildView nodes={CHILD_MIRROR} baseId={CHILD_MIRROR_BASE} selected="s_m0" /></Frame></Labelled>
              <Labelled label="a remote surface's drawer — attach profile" tag="decided"><Frame w={640} h={320}><ChildView nodes={CHILD_MIRROR} baseId={CHILD_MIRROR_BASE} selected="s_m2" /></Frame></Labelled>
              <Labelled label="A → B → C: this computer, then a remote child and its child on the same machine" tag="decided"><Frame w={640} h={320}><ChildView nodes={CHILD_CROSS} baseId="s_L1" selected="s_R1" /></Frame></Labelled>
            </>)}
          </View>
          <View name="child-graph-remote-no-profile" label="A remote surface attached with no profile name — Remote on its card, no Attach profile row in its drawer">
            <Frame w={640} h={320}><ChildView nodes={CHILD_CROSS.map((n) => (n.id === "s_R1" ? { ...n, profile: "" } : n))} baseId="s_L1" selected="s_R1" /></Frame>
          </View>
          <View name="child-graph-chain-lod" label="The three-machine chain at compact and block — the remote glyph, then the state fill">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
              {[0.55, 0.3].map((z) => <Frame key={z} label={`zoom ${z}`} w={520} h={220}><ChildView nodes={CHILD_CHAIN} baseId="s_A1" initialZoom={z} /></Frame>)}
            </div>
          </View>
          <View name="child-graph-chain-locales" label="ko, ja, zh-Hans — C's drawer">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
              {["ko", "ja", "zh-Hans"].map((l) => <Frame key={l} label={l} w={640} h={320}><ChildView nodes={CHILD_CHAIN} baseId="s_A1" selected="s_C1" lang={l} /></Frame>)}
            </div>
          </View>
        </Views>
        <Meta specs={[["remote card", "remote glyph in accent-remote-raised · full LOD: the machine's host text in the id's slot · state as usual · tooltip and accessible name “name — STATE — machine — id”"], ["machine ink", "a mirrored surface: dag-node-meta-status-fg, as the id it replaces · a read-only ancestor: dag-node-meta-fg, as the rest of its dashed card"], ["this computer", "no machine name on the card or in the drawer"], ["machine name", "attach profile name (9-2) · two or more hops: the profile name the previous machine gave it · no profile name → attach.mirror_pill_label on the card (label font), no Attach profile row · never 127.0.0.1:<port>"], ["drawer", "Attach profile (the machine's name) · Reached through (child_graph.drawer.via): the machines in between, “ › ” between them, mono · only when there is one"], ["read-only ancestor", "dashed · Not mirrored · its machine's host text · drawer: role, id, workspace, attach profile, read-only note"], ["disconnected", "see graph-states: warning strip, mirrored cards kept with states unknown, beyond the mirror one disconnected gap node"], ["across machines", "same parent → child line"], ["attach", "occupancy not drawn"]]}
          tokens={[{ tok: "--tasty-accent-remote-raised", use: "remote glyph", color: "var(--tasty-accent-remote-raised)" }, { tok: "--tasty-dag-node-meta-status-fg", use: "machine name on a mirrored card", color: "var(--tasty-dag-node-meta-status-fg)" }, { tok: "--tasty-dag-node-meta-fg", use: "machine name on a read-only ancestor", color: "var(--tasty-dag-node-meta-fg)" }]} />
      </Spec>

      <Spec id="child-graph-gap-nodes" title="Across machines — a gap node where the chain cannot be followed"
        when={<>The graph follows only the attach connections already open, relaying the query machine to machine. Where a link cannot be followed, nothing beyond it is guessed: <b>one gap node</b> stands where the chain breaks, on either side — a child that cannot be reached, or a parent that cannot be. It is the card's box (168 × 48, so layout and LOD stay the card's), <b>dashed</b> like the other cards that are not a surface here, with <b>no bar and no state colour</b> — it is not a surface state, and the strip, not the card, carries a warning. Its name row is a <b>reason glyph</b> and the <b>reason</b>; its meta row is the machine the broken link leads to, by the host text rule. One shape for all reasons, each with its own label and a glyph from a small set, so the graph does not grow a second legend: <i>Disconnected</i> and <i>No response</i> share the unreachable glyph; <i>stale</i> and <i>malformed</i> share one label, <i>Parent unverified</i> — the user acts on them the same way. <i>Checking…</i> spins while Tasty asks. Its line is the one <b>dashed</b> edge. It is <b>selectable</b>: its drawer says why in a sentence and names what is around it — the last surface reached, the machine, the machines in between, and for <i>No response</i> the next try — with no actions. <b>What was seen beyond the break is dropped</b> and folded into the gap node, not kept dimmed: a dimmed card would still read as a surface that exists, and the chain past the break may have changed. A surface mirrored here stays, with its state unknown, since it is still here (Graph view › Status). A <b>loop in the parents</b> (a diagnostic state, not a normal one) is cut the same way: a <i>Parent loop</i> gap node at the top, whose drawer names the surface the loop returns to, instead of a line back that the left-to-right tree cannot draw.</>}>
        <Stage variant="grid" style={{ display: "block", padding: 20 }}>
          <div style={{ display: "grid", gridTemplateColumns: "max-content var(--tasty-dag-node-width)", columnGap: "var(--tasty-space-lg)", rowGap: "var(--tasty-space-sm)", alignItems: "center" }}>
            <span /><span style={cap}>rest</span>
            {GAP_REASONS.map((r) => (
              <React.Fragment key={r}>
                <span style={cap}>{r}</span>
                <div style={{ position: "relative", width: "var(--tasty-dag-node-width)", height: "var(--tasty-dag-node-height)" }}><ChildNode node={{ id: `g_${r}`, kind: "gap", reason: r, host: "gpu-box" }} /></div>
              </React.Fragment>
            ))}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--tasty-space-lg)", marginTop: "var(--tasty-space-xl)", alignItems: "flex-end" }}>
            {["full", "compact", "block"].map((l) => <Labelled key={l} label={`gap · ${l}`}><Card node={{ id: "g_l", kind: "gap", reason: "disconnected", host: "gpu-box" }} lod={l} /></Labelled>)}
            <Labelled label="no profile name — Remote in the label font"><Card node={{ id: "g_n", kind: "gap", reason: "timeout", host: "" }} /></Labelled>
          </div>
        </Stage>
        <Stage style={{ padding: 16, display: "block" }}>
          {row(<>
            <Frame label="before — A → B → C → D, every link answering" w={760} h={300}><ChildView nodes={CHILD_CHAIN} baseId="s_A1" /></Frame>
          </>)}
        </Stage>
        <Views>
          <View name="child-gap-selected" label="Every reason selected — the card's selection ring" wide>
            <div style={{ display: "grid", gridTemplateColumns: "max-content var(--tasty-dag-node-width)", columnGap: "var(--tasty-space-lg)", rowGap: "var(--tasty-space-sm)", alignItems: "center" }}>
              {GAP_REASONS.map((r) => (
                <React.Fragment key={r}>
                  <span style={cap}>{r}</span>
                  <div style={{ position: "relative", width: "var(--tasty-dag-node-width)", height: "var(--tasty-dag-node-height)" }}><ChildNode node={{ id: `g_${r}`, kind: "gap", reason: r, host: "gpu-box" }} selected /></div>
                </React.Fragment>
              ))}
            </div>
          </View>
          <View name="child-gap-drawers" label="Gap nodes selected — the drawer of a cut chain, of a gap on each side, of a parent loop" wide>
            {row(<>
              <Frame label="after lab-build loses gpu-box — C and D dropped, one gap node under B (drawer open)" w={760} h={300}><ChildView nodes={CHILD_CHAIN_CUT} baseId="s_A1" selected="g_C" /></Frame>
              <Frame label="a gap on each side — the base's parent unverified, a child with no response (drawer: next try)" w={760} h={320}><ChildView nodes={CHILD_GAP_SIDES} baseId="s_B1" selected="g_dn" /></Frame>
              <Frame label="a loop in the parents — cut with a Parent loop gap at the top (drawer: the surface it returns to)" w={760} h={300}><ChildView nodes={CHILD_GAP_CYCLE} baseId="s_m2" selected="g_loop" /></Frame>
            </>)}
          </View>
          <View name="child-gap-themes" label="Mocha and Latte — every reason">
            <ThemePair render={() => (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--tasty-space-lg)", background: "var(--tasty-dag-canvas-bg)", padding: "var(--tasty-space-md)" }}>
                {GAP_REASONS.map((r) => <div key={r} style={{ position: "relative", width: "var(--tasty-dag-node-width)", height: "var(--tasty-dag-node-height)" }}><ChildNode node={{ id: `g_${r}`, kind: "gap", reason: r, host: "gpu-box" }} /></div>)}
              </div>
            )} />
          </View>
          <View name="child-gap-locales" label="en, ko, ja, zh-Hans — every label and every reason's drawer, the same states in each language" wide>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {["en", "ko", "ja", "zh-Hans"].map((l) => (
                <div key={l} style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "flex-start" }}>
                  {GAP_REASONS.filter((r) => r !== "malformed").map((r) => <Labelled key={r} label={`${l} · ${r}`}><Card node={{ id: `g_${r}`, kind: "gap", reason: r, host: "gpu-box" }} lang={l} /></Labelled>)}
                  {GAP_REASONS.filter((r) => r !== "malformed").map((r) => (r === "cycle"
                    ? <Frame key={r} label={`${l} · drawer · cycle (points back to)`} w={640} h={300}><ChildView nodes={CHILD_GAP_CYCLE} baseId="s_m2" selected="g_loop" lang={l} /></Frame>
                    : <Frame key={r} label={`${l} · drawer · ${r}`} w={640} h={300}><ChildView nodes={gapChain(r)} baseId="s_A1" selected="g_x" lang={l} /></Frame>))}
                </div>
              ))}
            </div>
          </View>
        </Views>
        <Meta specs={[["box", "168 × 48 · dashed 1px dag-node-border · dag-node-bg · no bar, no state colour · selection ring as a card"], ["name row", "reason glyph sm in dag-node-meta-fg · reason label 13 medium dag-node-fg"], ["meta row", "the machine the link leads to: host text (profile name mono, else attach.mirror_pill_label in the label font) · dag-node-meta-fg"], ["LOD", "full: both rows · compact: glyph + reason · block: the dashed box, glyph centred · tooltip “reason — machine” at every tier"], ["reasons", "disconnected (globeOff) · timeout (globeOff) · unsupported (alertCircle) · refused (lock) · limit (more) · stale, malformed → unverified (helpCircle) · gone (paneEmpty) · pending (Spinner 12) · cycle (alertTriangle)"], ["labels", "child_graph.gap.<reason> · ≤ 18 en characters"], ["edge", "dashed 4 / 4, see Edges"], ["drawer", "title = the label · caption child_graph.gap.<reason>_note · rows: last_reached, points_back_to (cycle), attach_profile (the machine; none with no profile name), via, next_try (timeout) · no actions (user decision 11-24)"], ["beyond the break", "dropped and folded into the one gap node · mirrored surfaces stay (state unknown, Graph view › Status)"], ["cycle", "diagnostic only · cut with a cycle gap at the top, never a line back"], ["minimap", "dag-minimap-node-dim, as the other cards that are not a surface"]]}
          tokens={[{ tok: "--tasty-dag-node-border", use: "dashed edge", color: "var(--tasty-dag-node-border)" }, { tok: "--tasty-dag-node-bg", use: "fill", color: "var(--tasty-dag-node-bg)" }, { tok: "--tasty-dag-node-fg", use: "reason", color: "var(--tasty-dag-node-fg)" }, { tok: "--tasty-dag-node-meta-fg", use: "glyph, machine", color: "var(--tasty-dag-node-meta-fg)" }]} />
        <Note>A gap node has no Retry and no other action: <b>user decision 11-24</b> (no action). <i>No response</i> retries by itself on the next refresh, and the other reasons are settled elsewhere (the connection, the remote's version, its permissions), so the drawer only says why, which machine and, for <i>No response</i>, when the next try is.</Note>
        <Dont>Do not keep the cards seen before the break, dimmed or not: they would read as surfaces that are still there. Do not draw a line back for a loop.</Dont>
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

      <Spec id="child-graph-entry-points" title="Entry points and default shortcuts (decided 4-1, 4-2, 4-3, 10-1)"
        when={<><b>Tools menu</b>: <i>Open child graph</i> right after <i>Task DAGs</i>. <b>Decided 4-1</b>: default shortcuts — the child graph popup <Kbd keys="Alt+G" /> (macOS <Kbd keys={["⌘", "G"]} />), the Task DAGs popup <Kbd keys="Alt+Y" /> (macOS <Kbd keys={["⌘", "Y"]} />). The Task DAGs key is <b>not a new action</b>: it is a binding of Tasty's existing <i>Toggle DAG list</i> action, which today defaults to <Kbd keys="Ctrl+Shift+G" /> or <Kbd keys="Alt+Shift+G" /> depending on the keybinding preset. <b>Decided 10-1</b>: Alt+Y <b>replaces</b> that default in every preset, so the action has one default binding, Alt+Y. On macOS a binding's Alt reads as Cmd by default and a setting can switch it to Option (R-56); neither key collides with a default binding or the macOS menu bar. Keybindings and the command palette list them by action name. The Tools menu shows no keys, as today. A terminal surface's context menu takes the same label when it is adopted. <b>Decided 4-3</b>: the surface kind is <code>child_graph</code>; it shows as <i>Child graph</i> in its tab and in the convert list. <b>Decided 4-2</b>: no new entry for DAGs — the Task DAGs popup lists them and a pick goes to the graph inside the same popup (the Task DAG page's popup spec).</>}>
        <Stage style={{ padding: 16, display: "block" }}>
          {row(<>
            <Labelled label="Tools menu — the new item" tag="decided"><div style={{ width: 360 }}><ToolsMenuFrame active="Open child graph" height={380} /></div></Labelled>
            <Labelled label="default shortcuts — Windows and Linux (4-1); Toggle DAG list with Alt+Y only (10-1)" tag="decided">
              <div style={{ width: 320, padding: "var(--tasty-space-sm)", background: "var(--tasty-menu-bg)", border: "var(--tasty-border-width) solid var(--tasty-menu-border)", borderRadius: "var(--tasty-radius)" }}>
                <MenuItem label={gt("settings.keybindings.toggle_child_graph_label")} shortcut={<Kbd keys={"Alt+G"} />} />
                <MenuItem label={gt("settings.keybindings.toggle_dag_list_label")} shortcut={<Kbd keys={"Alt+Y"} />} />
              </div>
            </Labelled>
            <Labelled label="default shortcuts — macOS (Alt reads as Cmd, R-56); Toggle DAG list with ⌘Y only (10-1)" tag="decided">
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
        <Meta specs={[["Tools menu", "child_graph.tools_menu_item, after Task DAGs"], ["child graph key", "action toggle_child_graph, label settings.keybindings.toggle_child_graph_label · default binding Alt+G · macOS ⌘G"], ["Task DAGs key", "existing action toggle_dag_list, existing label settings.keybindings.toggle_dag_list_label · default binding Alt+Y · macOS ⌘Y · replaces the old default (Ctrl+Shift+G or Alt+Shift+G by preset) in every preset (decided, 10-1)"], ["macOS", "a binding's Alt reads as Cmd by default; Option by setting (R-56)"], ["kind", "child_graph"], ["context menu", "child_graph.surface_menu_item"], ["kind name", "child_graph.kind_name — tab title and convert list"]]} tokens={[]} />      </Spec>

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
        <Meta specs={[["L2", "Misc · Scripts → Task pipeline → Anomaly detection → Child graph"], ["row", "Switch · settings label column 150 · gap 16 · min-height 32"], ["caption", "11 muted · measure-md · under the row"], ["default", "off"], ["keys", "settings.misc.subtab.child_graph · settings.child_graph.show_full_tree · _desc"]]}
          tokens={[{ tok: "--tasty-settings-label-width", use: "150" }, { tok: "--tasty-settings-row-min-height", use: "row" }]} />
      </Spec>

      <Spec id="child-graph-copy-keys" title="Copy — every key in four languages"
        when={<>The proposed keys and their values. Codex wrote every value; a script checked placeholders, backtick spans, sentence case, the card meta length, zh-Hans spacing, punctuation and glossary terms, and polite Korean UI endings. Existing keys reused as they are (not listed; the kit copies their four values from Tasty): <code>dag.detail.close</code>, <code>dag_list.back</code>, <code>settings.keybindings.toggle_dag_list_label</code>, <code>dag.zoom.*</code>, <code>dag.lod.*</code>, <code>dag.empty.*</code>.</>}>
        <Stage style={{ padding: 0, display: "block" }}><CopyTable /></Stage>
      </Spec>
    </Section>
  );
}

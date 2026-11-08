import React, { useState } from "react";
import { Icon } from "../../components/index.js";
import { SurfaceFocusEdge, SurfaceLeaf } from "../../ui_kits/terminal/surface_focus.jsx";
import { Spec, Stage, Meta, Note, Do, Dont, Views, View } from "../parts/specimen.jsx";

// Tasty Gallery: Layouts, surface focus edge. Every surface kind, focused and unfocused, in Mocha and Latte.
// Mounted by layouts/index.jsx as <GallerySurfaceFocus />. Tokens: --tasty-surface-focus-edge-* (components.css).

const caption = { fontSize: "var(--tasty-font-size-caption)", lineHeight: 1.4 };
const mono = { ...caption, fontFamily: "var(--tasty-font-mono)" };
const band = (bg) => ({ flex: "none", display: "flex", alignItems: "center", height: "var(--tasty-size-20)", padding: "0 var(--tasty-space-sm)", background: bg, color: "var(--tasty-text-secondary)", ...mono, whiteSpace: "nowrap", overflow: "hidden" });
const fill = (bg, color) => ({ flex: 1, minHeight: 0, padding: "var(--tasty-space-xs) var(--tasty-space-sm)", background: bg, color, ...mono, whiteSpace: "nowrap", overflow: "hidden" });

// What each kind draws under the edge. Only the terminal's bed and default ink change with focus.
const KINDS = [
  { id: "terminal", label: "terminal", body: (f) => (
    <div style={fill(f ? "var(--tasty-surface-terminal-focused-bg)" : "var(--tasty-surface-terminal-unfocused-bg)", f ? "var(--tasty-surface-terminal-focused-fg)" : "var(--tasty-surface-terminal-unfocused-fg)")}>~/tasty $ cargo test</div>
  ) },
  { id: "markdown", label: "markdown", body: () => (
    <>
      <div style={band("var(--tasty-md-address-bar-bg)")}>notes.md</div>
      <div style={fill("var(--tasty-md-doc-bg)", "var(--tasty-md-doc-fg)")}>Document</div>
    </>
  ) },
  { id: "html", label: "html", body: () => (
    <>
      <div style={band("var(--tasty-html-address-bar-bg)")}>example.com</div>
      <div data-audit-exempt="html-page" style={fill("var(--tasty-bg-panel)", "var(--tasty-text-muted)")}>The page paints itself</div>
    </>
  ) },
  { id: "image", label: "image", body: () => (
    <>
      <div style={band("var(--tasty-bg-panel)")}>photo.png</div>
      <div style={{ ...fill("var(--tasty-bg-sidebar)", "var(--tasty-text-secondary)"), display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="image" /></div>
    </>
  ) },
  { id: "explorer", label: "explorer", body: () => (
    <>
      <div style={band("var(--tasty-bg-sidebar)")}>src</div>
      <div style={fill("var(--tasty-bg-panel)", "var(--tasty-text-secondary)")}>main.rs</div>
    </>
  ) },
  { id: "empty", label: "empty", body: () => <div style={fill("var(--tasty-bg-app)", "var(--tasty-text-secondary)")} /> },
  { id: "dag_graph", label: "dag_graph", body: () => (
    <>
      <div style={band("var(--tasty-bg-sidebar)")}>build</div>
      <div style={{ ...fill("var(--tasty-dag-canvas-bg)", "var(--tasty-text-secondary)"), display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ width: "var(--tasty-size-48)", height: "var(--tasty-size-16)", background: "var(--tasty-dag-node-bg)", borderRadius: "var(--tasty-radius)" }} />
      </div>
    </>
  ) },
  { id: "plugin-webview", label: "plugin, webview", body: () => <div data-audit-exempt="plugin-webview" style={fill("var(--tasty-bg-panel)", "var(--tasty-text-muted)")}>The plugin page paints itself</div> },
  { id: "plugin-mesh", label: "plugin, egui-mesh", body: () => <div data-audit-exempt="third-party-plugin" style={fill("var(--tasty-bg-panel)", "var(--tasty-text-muted)")}>The plugin frame paints itself</div> },
];

const frame = { flex: "1 1 var(--tasty-size-96)", height: "var(--tasty-size-64)", border: "var(--tasty-border-width) solid var(--tasty-border-default)", borderRadius: "var(--tasty-radius)" };

function Frame({ kind, focused, marks }) {
  return (
    <SurfaceLeaf focused={focused} data-frame={focused ? "focused" : "unfocused"} style={{ ...frame, ...marks }}>
      {kind.body(focused)}
    </SurfaceLeaf>
  );
}

function ThemeRow({ theme, label, kind }) {
  return (
    <div data-theme={theme} style={{ background: "var(--tasty-bg-panel)", padding: "var(--tasty-space-xs)" }}>
      <div style={{ ...caption, color: "var(--tasty-text-secondary)", marginBottom: "var(--tasty-space-xs)" }}>{label}: focused, unfocused</div>
      <div style={{ display: "flex", gap: "var(--tasty-space-xs)" }}>
        <Frame kind={kind} focused />
        <Frame kind={kind} focused={false} />
      </div>
    </div>
  );
}

// Which leaf has focus is host state: click moves it, and the edge changes in the same frame.
function FocusDemo() {
  const [at, setAt] = useState(0);
  const leaves = [KINDS[0], KINDS[1], KINDS[4]];
  return (
    <div style={{ display: "flex", gap: "var(--tasty-space-sm)", height: "var(--tasty-size-160)", width: "100%" }}>
      {leaves.map((kind, i) => (
        <SurfaceLeaf key={kind.id} focused={at === i} onClick={() => setAt(i)} style={{ flex: 1, cursor: "pointer", border: "var(--tasty-border-width) solid var(--tasty-border-default)", borderRadius: "var(--tasty-radius)" }}>
          {kind.body(at === i)}
        </SurfaceLeaf>
      ))}
    </div>
  );
}

// A mark rings the leaf. The unfocused edge sits under it. The lit edge sits over it and takes only the lower row, so both show.
const ring = (token, width) => ({ outline: `var(--tasty-${width}) solid var(--tasty-${token})`, outlineOffset: `calc(-1 * var(--tasty-${width}))` });
const LOWER_ROW = { position: "absolute", top: "var(--tasty-border-width)", left: 0, right: 0, height: "var(--tasty-border-width)" };

function Marked({ kind = KINDS[0], focused, bedFocused = focused, token, width, children }) {
  return (
    <div style={{ position: "relative", ...frame, flex: "none", overflow: "hidden", display: "flex", flexDirection: "column", ...(token ? ring(token, width) : null) }}>
      <SurfaceFocusEdge focused={focused} />
      {kind.body(bedFocused)}
      {focused && token && <SurfaceFocusEdge focused style={LOWER_ROW} />}
      {children}
    </div>
  );
}

// A webview leaf: the page covers the ring, so only the ring's top side shows, in the edge's own row.
function WebviewMarked({ kind = KINDS[1], focused, token, width }) {
  return (
    <div style={{ ...frame, flex: "none", overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <div style={{ position: "relative", flex: "none" }}>
        <SurfaceFocusEdge focused={focused} />
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: `var(--tasty-${width})`, background: `var(--tasty-${token})` }} />
        {focused && <SurfaceFocusEdge focused style={LOWER_ROW} />}
      </div>
      {kind.body(focused)}
    </div>
  );
}

const WEBVIEW_MARKS = [
  ["occupied-soft", "Occupied soft", "surface-occupied-soft-border", "surface-occupied-border-width", true],
  ["occupied-hard", "Occupied hard or mirror", "surface-occupied-hard-border", "surface-occupied-border-width", true],
  ["needs-input", "Needs input", "surface-highlight-input-border", "surface-highlight-input-width", true],
  ["completion", "Completed", "surface-highlight-done-border", "surface-highlight-done-width", false],
];

export function GallerySurfaceFocus() {
  return (
    <>
      <Spec id="surface-focus-edge-every-kind" title="Focus edge on every surface kind"
        when={<>Every surface shows whether it has focus the same way: a <b>2px edge across the top of the leaf</b>, painted by the host. Focused reads <span className="tok">--tasty-surface-focus-edge-focused</span>, a bright neutral. Unfocused reads <span className="tok">--tasty-surface-focus-edge-unfocused</span>, the chrome tone, so it reads as no mark. The edge keeps its row in both states, so focus never moves the content or reflows a page. A surface's own colors stay as they are; only the terminal also swaps its bed.</>}>
        <Stage variant="tight" eager>
          <div style={{ flex: 1, minWidth: 0, width: "100%", padding: "var(--tasty-space-md)", background: "var(--tasty-bg-panel)" }}><FocusDemo /></div>
        </Stage>
        <Views>
          {KINDS.map((kind) => (
            <View key={kind.id} name={`focus-edge-${kind.id}`} label={kind.label}>
              <ThemeRow theme="mocha" label="Mocha" kind={kind} />
              <ThemeRow theme="latte" label="Latte" kind={kind} />
            </View>
          ))}
        </Views>
        <Meta
          specs={[["position", "top of the leaf, full width, above any head or address band"], ["height", <><span className="tok">--tasty-surface-focus-edge-width</span>, 2px in both states, zoom-exempt</>], ["follows", "host model focus, not the page's DOM focus and not the OS window state"], ["motion", "none, the color changes in one frame on every kind"], ["painted by", "the host, on the side that draws the leaf"], ["surface colors", "unchanged by focus, except the terminal bed and default ink"]]}
          tokens={[{ tok: "--tasty-surface-focus-edge-focused", use: "focused", color: "var(--tasty-surface-focus-edge-focused)" }, { tok: "--tasty-surface-focus-edge-unfocused", use: "unfocused", color: "var(--tasty-surface-focus-edge-unfocused)" }, { tok: "--tasty-surface-focus-edge-width", use: "2px bar" }]} />
        <Note>In the states grid, <b>rest</b> is unfocused and <b>focus</b> is focused. Hosts are the grounds a surface can show right under the edge. An <code>egui-mesh</code> or webview plugin may add its own focus styling inside its frame, but it is never the thing that tells the states apart.</Note>
        <Do><b>Do</b> reserve the row on every leaf at all times. A webview starts below it, so the host can always paint it.</Do>
        <Dont><b>Don't</b> make the edge blue. Blue is the keyboard focus ring and the completion highlight, and a surface can show those at the same time.</Dont>
      </Spec>

      <Spec id="surface-focus-edge-with-marks" title="Focus edge with rings, marks and keyboard focus"
        when={<>The unfocused edge sits under a ring. The lit edge sits over it and takes only the lower row, so the ring keeps the upper row and both stay visible. Where the host surface shows on all four sides, a ring has four sides and the edge one, so they differ by position as well as color. <b>A webview leaf is the exception</b>: the page covers the ring, so only its top side shows, in the edge's own row, and row and hue are what is left. That reading comes from the stacking order and is unmeasured in the app. The ring keeps its own priority: needs input, then occupancy, then completion. A hard-occupied surface keeps the unfocused bed and ink because it takes no input, and its edge still follows focus. A mirror follows the focus of the client that draws it.</>}>
        <Views>
          <View name="edge-occupied-soft" label="Occupied soft, focused"><Marked focused token="surface-occupied-soft-border" width="surface-occupied-border-width" /></View>
          <View name="edge-occupied-hard-focused" label="Occupied hard or mirror, focused"><Marked focused bedFocused={false} token="surface-occupied-hard-border" width="surface-occupied-border-width" /></View>
          <View name="edge-occupied-hard-unfocused" label="Occupied hard or mirror, unfocused"><Marked focused={false} token="surface-occupied-hard-border" width="surface-occupied-border-width" /></View>
          <View name="edge-needs-input-focused" label="Needs input, focused"><Marked focused token="surface-highlight-input-border" width="surface-highlight-input-width" /></View>
          <View name="edge-needs-input-unfocused" label="Needs input, unfocused"><Marked focused={false} token="surface-highlight-input-border" width="surface-highlight-input-width" /></View>
          <View name="edge-completion-unfocused" label="Completed, unfocused"><Marked focused={false} token="surface-highlight-done-border" width="surface-highlight-done-width" /></View>
          <View name="edge-field-focus" label="Focused surface with a focused field">
            <Marked kind={KINDS[2]} focused>
              <span style={{ position: "absolute", top: "var(--tasty-size-4)", left: "var(--tasty-size-4)", right: "var(--tasty-size-4)", height: "var(--tasty-size-16)", outline: "var(--tasty-focus-ring-width) solid var(--tasty-input-border-focus)", borderRadius: "var(--tasty-radius-sm)" }} />
            </Marked>
          </View>
          {WEBVIEW_MARKS.flatMap(([id, label, token, width, canFocus]) => [
            canFocus && <View key={id + "-focused"} name={`edge-webview-${id}-focused`} label={`Webview, ${label.toLowerCase()}, focused`}><WebviewMarked focused token={token} width={width} /></View>,
            <View key={id + "-unfocused"} name={`edge-webview-${id}-unfocused`} label={`Webview, ${label.toLowerCase()}, unfocused`}><WebviewMarked focused={false} token={token} width={width} /></View>,
          ])}
        </Views>
        <Meta
          specs={[["paint order", "unfocused edge, then ring, then lit edge"], ["lit edge with a ring", <>lower row only, <span className="tok">--tasty-border-width</span> tall; the ring keeps the upper row</>], ["webview leaf", "only the ring's top side shows, in the edge's row. Unmeasured in the app"], ["ring priority", "needs input, occupancy, completion, as before"], ["keyboard focus", <>unchanged, blue <span className="tok">--tasty-input-border-focus</span> ring on the field</>], ["hard occupied", "unfocused bed and ink, edge follows focus"], ["mirror", "edge from the focus of the client that draws it"]]}
          tokens={[{ tok: "--tasty-surface-occupied-soft-border", use: "soft ring", color: "var(--tasty-surface-occupied-soft-border)" }, { tok: "--tasty-surface-occupied-hard-border", use: "hard ring", color: "var(--tasty-surface-occupied-hard-border)" }, { tok: "--tasty-surface-highlight-input-border", use: "needs input ring", color: "var(--tasty-surface-highlight-input-border)" }, { tok: "--tasty-surface-highlight-done-border", use: "completion ring", color: "var(--tasty-surface-highlight-done-border)" }]} />
        <Note>A completed highlight clears on focus, so there is no focused frame for it.</Note>
      </Spec>
    </>
  );
}

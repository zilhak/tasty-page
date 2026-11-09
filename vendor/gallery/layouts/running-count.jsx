import React from "react";
import { Icon, StatusDot, Tag, Badge, BadgeGroup, Tooltip, LoadingOverlay } from "../../components/index.js";
import { WorkspaceRunningCount } from "../../ui_kits/terminal/chrome.jsx";
import { Spec, Stage, Meta, Note, Do, Dont, Views, View } from "../parts/specimen.jsx";

// Tasty Gallery — Layouts › Running count on the workspace row (2026-11-09).
// The app's sidebar has three widths, one per ui_scale, so the row is drawn at all three. Zoom stands in for
// ui_scale, as it does on the loading overlay page, and the width is the app's width after the zoom.

const SCALES = [["small", 0.85, 150], ["medium", 1, 180], ["large", 1.2, 220]];
const line = "calc(var(--tasty-font-size-body) * var(--tasty-line-height-ui))";
const cap = { fontFamily: "var(--tasty-font-mono)", fontSize: "var(--tasty-font-size-micro)", color: "var(--tasty-text-muted)" };

const FILL = {
  rest: "transparent",
  hover: "var(--tasty-overlay-hover)",
  press: "var(--tasty-overlay-active)",
  selected: "var(--tasty-surface-active)",
  "selected+hover": "linear-gradient(var(--tasty-overlay-hover), var(--tasty-overlay-hover)), var(--tasty-surface-active)",
  "selected+press": "linear-gradient(var(--tasty-overlay-active), var(--tasty-overlay-active)), var(--tasty-surface-active)",
};
const LABEL = {
  rest: "var(--tasty-text-secondary)",
  hover: "var(--tasty-text-secondary-raised)",
  press: "var(--tasty-text-secondary-raised)",
  selected: "var(--tasty-text-on-active)",
  "selected+hover": "var(--tasty-text-on-active-hover)",
  "selected+press": "var(--tasty-text-on-active-hover)",
};

const Keycap = ({ n, active }) => (
  <span aria-hidden style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", display: "inline-flex", alignItems: "center", justifyContent: "center", boxSizing: "border-box",
    width: "var(--tasty-switch-overlay-size)", height: "var(--tasty-switch-overlay-size)", borderRadius: "var(--tasty-radius-sm)", borderStyle: "solid", borderWidth: "var(--tasty-border-width)", borderBottomWidth: "var(--tasty-switch-overlay-shadow-depth)",
    borderColor: active ? "var(--tasty-switch-overlay-active-bg)" : "var(--tasty-switch-overlay-border)",
    background: active ? "var(--tasty-switch-overlay-active-bg)" : "var(--tasty-switch-overlay-bg)",
    color: active ? "var(--tasty-switch-overlay-active-fg)" : "var(--tasty-switch-overlay-fg)",
    fontFamily: "var(--tasty-font-mono)", fontSize: "var(--tasty-kbd-font-size)", fontWeight: "var(--tasty-font-weight-medium)", lineHeight: 1 }}>{n}</span>
);

function CountRow({ name, count = 0, state = "rest", attached, loading, keycap, ni, done, refused, move, mirror, subtitle, description }) {
  const selected = state.startsWith("selected");
  const tail = refused || move || ni != null || done != null;
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: "var(--tasty-workspace-dot-gap)", boxSizing: "border-box",
      padding: "var(--tasty-space-sm) var(--tasty-space-sm) var(--tasty-space-sm) var(--tasty-workspace-row-padding-x)",
      background: FILL[state], boxShadow: selected ? "inset var(--tasty-workspace-row-active-bar-width) 0 0 var(--tasty-accent-primary)" : "none",
      ...(selected ? { "--tasty-status-dot-idle": "var(--tasty-status-dot-idle-active)", "--tasty-status-dot-success": "var(--tasty-status-dot-success-active)", "--tasty-status-dot-attached-ring": "var(--tasty-status-dot-attached-ring-active)" } : null) }}>
      <span style={{ position: "relative", flex: "none", width: "var(--tasty-workspace-dot-slot)", height: line, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
        <StatusDot status={count > 0 ? "running" : "idle"} attached={attached} />
        {loading && <LoadingOverlay kind="lnb" visible bed={`${FILL[state] === "transparent" ? "" : `linear-gradient(${FILL[state]}, ${FILL[state]}), `}var(--tasty-bg-sidebar)`} reducedMotion />}
        {keycap && <Keycap n={keycap} active={selected} />}
      </span>
      <WorkspaceRunningCount count={count} state={state} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--tasty-space-sm)", height: line }}>
          <span style={{ flex: 1, minWidth: 0, fontSize: "var(--tasty-font-size-body)", fontWeight: "var(--tasty-font-weight-medium)", lineHeight: "var(--tasty-line-height-ui)", color: LABEL[state], overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</span>
          {tail && (
            <span style={{ flex: "none", display: "inline-flex", alignItems: "center", gap: "var(--tasty-space-sm)" }}>
              {move && <span aria-label="Move source inside" style={{ display: "inline-flex", color: "var(--tasty-move-source-glyph)" }}><Icon name="move" size="var(--tasty-move-source-glyph-size)" /></span>}
              {refused && <span aria-label="Attach refused" style={{ display: "inline-flex", color: "var(--tasty-attach-refusal-glyph)" }}><Icon name="alertTriangle" size="var(--tasty-move-source-glyph-size)" /></span>}
              {(ni != null || done != null) && (
                <BadgeGroup>
                  {ni != null && <Badge variant="warning">{ni}</Badge>}
                  {done != null && <Badge variant="primary">{done}</Badge>}
                </BadgeGroup>
              )}
            </span>
          )}
        </div>
        {mirror && <div style={{ marginTop: "var(--tasty-size-2)" }}><Tag variant="info" caps aria-label="Remote mirror" style={{ color: "var(--tasty-tag-info-fg)" }}><Icon name="remote" size="var(--tasty-workspace-mirror-icon-size)" />remote</Tag></div>}
        {subtitle && <div style={{ fontSize: "var(--tasty-font-size-term-sm)", lineHeight: "var(--tasty-line-height-ui)", marginTop: "var(--tasty-size-1)", color: selected ? LABEL[state] : "var(--tasty-text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{subtitle}</div>}
        {description && <div style={{ fontSize: "var(--tasty-font-size-caption)", lineHeight: "var(--tasty-line-height-ui)", marginTop: "var(--tasty-size-3)", color: selected ? LABEL[state] : "var(--tasty-text-muted)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{description}</div>}
      </div>
    </div>
  );
}

// The sidebar's column at an app width. The zoom scales what is inside; the outer box stays at the app's pixels.
function Column({ scale, width, children, caption }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--tasty-space-xs)", minWidth: 0 }}>
      <span style={cap}>{caption}</span>
      <div style={{ width, boxSizing: "content-box", flex: "none", background: "var(--tasty-bg-sidebar)", border: "var(--tasty-border-width) solid var(--tasty-separator)" }}>
        <div style={{ zoom: scale, display: "flex", flexDirection: "column" }}>{children}</div>
      </div>
    </div>
  );
}
function ThreeWidths({ children }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--tasty-space-lg)", alignItems: "flex-start", padding: "var(--tasty-space-md)", background: "var(--tasty-bg-app)" }}>
      {SCALES.map(([label, scale, width]) => <Column key={label} caption={`${label} · ${width}px · ui_scale ${scale}`} scale={scale} width={width}>{children}</Column>)}
    </div>
  );
}
function Rows({ rows }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--tasty-space-sm)", padding: "var(--tasty-space-md)", background: "var(--tasty-bg-app)" }}>
      {rows.map(([label, props]) => (
        <div key={label} style={{ display: "flex", flexDirection: "column", gap: "var(--tasty-size-2)" }}>
          <span style={cap}>{label}</span>
          <div style={{ width: 180, background: "var(--tasty-bg-sidebar)" }}><CountRow {...props} /></div>
        </div>
      ))}
    </div>
  );
}

const CatBand = ({ label, count }) => (
  <div style={{ display: "flex", alignItems: "center", gap: "var(--tasty-space-xs)", padding: "var(--tasty-sidebar-category-header-pad-y) var(--tasty-sidebar-category-header-pad-x)", background: "var(--tasty-sidebar-category-header-bg)", borderTop: "var(--tasty-border-width) solid var(--tasty-sidebar-category-header-border)", borderBottom: "var(--tasty-border-width) solid var(--tasty-sidebar-category-header-border)" }}>
    <span style={{ display: "inline-flex", color: "var(--tasty-sidebar-category-header-fg)" }}><Icon name="chevronDown" size="var(--tasty-icon-size-xs)" /></span>
    <span style={{ flex: 1, fontFamily: "var(--tasty-font-label)", fontSize: "var(--tasty-font-size-micro)", textTransform: "uppercase", letterSpacing: "var(--tasty-sidebar-section-heading-tracking)", fontWeight: "var(--tasty-sidebar-category-header-weight)", color: "var(--tasty-sidebar-category-header-fg)" }}>{label}</span>
    <span style={{ fontFamily: "var(--tasty-font-mono)", fontSize: "var(--tasty-sidebar-category-header-count-font-size)", color: "var(--tasty-sidebar-category-header-count-fg)" }}>{count}</span>
  </div>
);

const LONG = "very-long-workspace-name-for-the-narrow-sidebar";

export function RunningCountSpec() {
  return (
    <Spec id="workspace-row-running-count" title="Workspace row — running count"
      when={<>Use in expanded workspace rows to show running terminal surfaces, including hidden tabs and excluding plugin surfaces. Place the bare numeral between the status dot and name. The dot uses the same test: 0 is idle, 1 or more is running. Filled NeedsInput and Completion pills stay at the far right; a surface can count toward both activity and attention.</>}>
      <Stage variant="tight" grid>
        <ThreeWidths>
          <CountRow name="tasty-core" count={2} state="selected" />
          <CountRow name="docs-site" count={3} done={3} />
          <CountRow name="data-etl" count={1} ni={1} mirror />
          <CountRow name="monorepo" count={12} ni={2} done={5} />
          <CountRow name="scratch" count={0} />
        </ThreeWidths>
      </Stage>
      <Views>
        <View name="running-count-values" label="Values: every row shows the number, and 0 to 99 keep the name in place">
          <Rows rows={[["0 — idle dot", { name: "scratch", count: 0 }], ["1", { name: "docs-site", count: 1 }], ["9", { name: "data-etl", count: 9 }], ["12 — two digits fill the column", { name: "monorepo", count: 12 }], ["99", { name: "farm", count: 99 }], ["128 → 99+, this row's column grows", { name: "farm-large", count: 128 }]]} />
        </View>
        <View name="running-count-row-states" label="Row states: hover, press and selected, at 0 and at 3">
          <Rows rows={["rest", "hover", "press", "selected", "selected+hover", "selected+press"].flatMap((state) => [[`${state} · 3`, { name: "docs-site", count: 3, state }], [`${state} · 0`, { name: "scratch", count: 0, state }]])} />
        </View>
        <View name="running-count-attention" label="Beside attention: the left number is activity, the filled pills at the far end are attention">
          <Rows rows={[["no attention", { name: "docs-site", count: 2 }], ["NeedsInput only", { name: "data-etl", count: 1, ni: 1 }], ["Completion only", { name: "docs-site", count: 0, done: 3 }], ["both", { name: "tasty-core", count: 2, ni: 2, done: 5 }], ["one surface counted twice — permission dialog", { name: "agent", count: 1, ni: 1 }], ["overflow on all three", { name: "monorepo", count: 128, ni: "99+", done: "99+" }]]} />
        </View>
        <View name="running-count-narrowest" label="Narrowest case: long name, both badges at 99+, refusal mark and move glyph. The name gives way and the number stays">
          <ThreeWidths>
            <CountRow name={LONG} count={3} ni="99+" done="99+" refused move />
            <CountRow name={LONG} count={12} state="selected" ni="99+" done="99+" refused move />
            <CountRow name={LONG} count={0} />
          </ThreeWidths>
        </View>
        <View name="running-count-categories" label="Category list: the band's right-hand count is the number of workspaces, the row's left-hand count is running surfaces">
          <ThreeWidths>
            <CatBand label="Workspaces" count={2} />
            <CountRow name="agents-prod" count={2} state="selected" />
            <CountRow name="scratch" count={0} />
            <CatBand label="Services" count={3} />
            <CountRow name="infra" count={0} subtitle="terraform + k8s" />
            <CountRow name="api-gateway" count={1} ni={1} />
            <CountRow name="data-pipeline" count={4} done={1} />
          </ThreeWidths>
        </View>
        <View name="running-count-marks" label="With the row's other marks: the column does not move, and lines below start at the name">
          <Rows rows={[["switch keycap over the dot", { name: "docs-site", count: 3, keycap: "2" }], ["switch keycap · selected", { name: "tasty-core", count: 12, keycap: "1", state: "selected" }], ["attached ring", { name: "api-gateway", count: 1, attached: true }], ["attach wait spinner", { name: "build-farm", count: 0, loading: true }], ["mirror · subtitle · description", { name: "data-pipeline", count: 3, mirror: true, subtitle: "mirror → gb10", description: "nightly ETL across the warehouse, last run 18m ago" }]]} />
        </View>
        <View name="running-count-tooltip" label="Tooltip: over the number only, with the exact value">
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--tasty-size-40)", padding: "var(--tasty-size-40) var(--tasty-size-64) var(--tasty-space-md)", background: "var(--tasty-bg-sidebar)" }}>
            <Tooltip open placement="top" content="Running surfaces: 3"><WorkspaceRunningCount count={3} /></Tooltip>
            <Tooltip open placement="top" content="Running surfaces: 128"><WorkspaceRunningCount count={128} /></Tooltip>
          </div>
        </View>
      </Views>
      <Meta
        specs={[["position", "between the dot slot and the name, on every expanded row"], ["slot → numeral", <span className="tok">--tasty-workspace-running-count-gap</span>], ["column", <><span className="tok">--tasty-workspace-running-count-min-width</span>, numeral left-aligned</>], ["numeral → name", <span className="tok">--tasty-workspace-dot-gap</span>], ["body x", "8 + 16 + 2 + 10 + 4 = 40"], ["type", <><span className="tok">--tasty-workspace-running-count-font-size</span>, mono, medium</>], ["overflow", <>above <span className="tok">--tasty-workspace-running-count-max</span>: 99+</>], ["motion", "none, the value swaps"], ["width taken from the name", "small 14 · medium 16 · large 19"], ["narrowest name room", "small 21 · medium 32 · large 41"]]}
        tokens={[{ tok: "--tasty-text-muted", use: "rest", color: "var(--tasty-text-muted)" }, { tok: "--tasty-text-muted-raised", use: "hover, press", color: "var(--tasty-text-muted-raised)" }, { tok: "--tasty-text-on-active", use: "selected", color: "var(--tasty-text-on-active)" }, { tok: "--tasty-text-on-active-hover", use: "selected+hover, selected+press", color: "var(--tasty-text-on-active-hover)" }]} />
      <Do><b>Do</b> show 0 on quiet rows and reserve the numeral column so the name stays in place when the value changes between 0 and 1.</Do>
      <Dont><b>Don't</b> use a filled pill, an accent colour or the trailing group for the count; these treatments make it read as attention.</Dont>
      <Note>Use one muted text tone in both themes: Latte's muted and secondary inks are identical, and the dot already distinguishes idle from running. Swap numerals without motion because updates about once a second would keep drawing attention. The column always holds a number, so it does not violate the attention pills' rule against reserving empty slots.</Note>
    </Spec>
  );
}

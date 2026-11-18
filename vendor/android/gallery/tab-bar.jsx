// Specimens of the Android pane tab bar. The part itself is ../parts/tab-bar.jsx. Product behaviour (what a tab, a pane
// and the logo menu do) is not decided here: this section only draws it.
import React from "react";
import { Bar, TAB_BAR_DECLARED, tabBarVars } from "../parts/tab-bar.jsx";
import { Cluster, Section, Spec, Stage, View, Views } from "../../gallery/parts/specimen.jsx";
import { COPY } from "./copy.js";
import { Prose, SpecTable, TokenValue } from "./kit.jsx";

// Values read from the canon unchanged.
const CANON = [
  ["Tab inset, both sides", "tab-padding-x"],
  ["Selection edge", "tab-indicator-width"],
  ["+ glyph", "icon-size-md"],
  ["Label type", "font-size-body"],
  ["Tab divider, bar bottom line", "border-width"],
];

const COLORS = [
  ["Tab at rest", "tab-bg", "tab-fg"],
  ["Tab pressed, and held for the long-press menu", "tab-bg-hover", "tab-fg-hover"],
  ["Selected tab, focused pane", "tab-bg-active", "tab-fg-active"],
  ["Selected tab, other pane", "tab-bg-active", "text-secondary"],
  ["Selection edge, focused pane only", "tab-indicator", ""],
  ["+ glyph", "", "icon-button-fg"],
  ["+ and logo pressed", "overlay-active", ""],
  ["Bar ground, focused pane", "surface-raised", ""],
  ["Bar ground, other pane", "bg-sidebar", ""],
  ["Tab divider, bar bottom line", "tab-separator", ""],
];

const TITLES = ["Terminal 1", "~/work/tasty", "npm run dev", "vim README.md", "ssh build-host", "cargo test --workspace", "Terminal 7", "htop", "logs", "Terminal 10", "git log", "Terminal 12", "python3", "Terminal 14"];
export const titles = (n) => TITLES.slice(0, n);
const LINES = ["$ cd ~/work/tasty", "$ git status", "On branch main", "nothing to commit, working tree clean", "$ npm run build", "built in 4.8s"];
export function Terminal({ focused, lines = 2, style }) {
  return (
    <div style={{ padding: "var(--tasty-space-xs) var(--tasty-space-sm)", fontFamily: "var(--tasty-font-mono)", fontSize: "var(--tasty-font-size-term)",
      background: focused ? "var(--tasty-surface-terminal-focused-bg)" : "var(--tasty-surface-terminal-unfocused-bg)",
      color: focused ? "var(--tasty-surface-terminal-focused-fg)" : "var(--tasty-surface-terminal-unfocused-fg)", ...style }}>
      {LINES.slice(0, lines).map((l) => <div key={l} style={{ whiteSpace: "nowrap", overflow: "hidden" }}>{l}</div>)}
    </div>
  );
}

// Screen frames. 360 is the narrow-phone width of the widths section. 800 is a chosen landscape phone width (a 360 by 800
// phone turned), not a value from a source. 180 is one half of 360, split left and right.
export const PORTRAIT = 360;
const LANDSCAPE = 800;
export const HALF = PORTRAIT / 2;

function Rows({ pane, rows }) {
  return (
    <Stage eager variant="column" style={{ overflowX: "auto", flexWrap: "nowrap" }}>
      {rows.map(([label, props]) => (
        <Cluster key={label} label={label}><Bar pane={pane} {...props} /></Cluster>
      ))}
    </Stage>
  );
}

// Two panes side by side, each with its bar and two terminal lines. Only the right one reaches the top right.
function Split({ left, right, focus, targets }) {
  return (
    <div style={{ display: "flex", width: `${PORTRAIT}px`, flex: "none", background: "var(--tasty-bg-app)" }}>
      {[["left", left], ["right", right]].map(([side, n]) => (
        <div key={side} style={{ width: `${HALF}px`, flex: "none", overflow: "hidden", boxSizing: "border-box", ...(side === "left" ? { borderRight: "var(--tasty-border-width) solid var(--tasty-separator)" } : null) }}>
          <Bar pane={HALF} tabs={titles(n)} selected={n > 2 ? 1 : 0} focused={focus === side} logo={side === "right"} targets={targets} />
          <Terminal focused={focus === side} />
        </div>
      ))}
    </div>
  );
}

export function TabBarSection() {
  return (
    <Section id="tab-bar" title="Pane tab bar">
      <div style={tabBarVars}>
        <Spec id="tab-bar-anatomy" title="Anatomy" when={COPY.tabBarAnatomyWhen}>
          <Views>
            <View name="tab-bar-focused" label="Focused pane, with the logo"><Bar pane={HALF} tabs={titles(1)} logo /></View>
            <View name="tab-bar-other" label="Other pane, no logo"><Bar pane={HALF} tabs={titles(2)} focused={false} /></View>
            <View name="tab-bar-pressed-tab" label="Pressed: a tab at rest"><Bar pane={HALF + 60} tabs={titles(2)} pressed={{ tab: 1 }} /></View>
            <View name="tab-bar-pressed-plus" label="Pressed: new tab"><Bar pane={HALF} tabs={titles(1)} logo pressed={{ plus: true }} /></View>
            <View name="tab-bar-pressed-logo" label="Pressed: logo"><Bar pane={HALF} tabs={titles(1)} logo pressed={{ logo: true }} /></View>
          </Views>
          <SpecTable head={["Part", "Ground", "Ink"]} mono={[1, 2]} rows={COLORS} />
          <Prose k="tabBarAnatomyNote" />
        </Spec>
        <Spec id="tab-bar-values" title="Values" when={COPY.tabBarValuesWhen}>
          <SpecTable head={["Declared here", "Reads", "Value", "Sets"]} mono={[0, 1, 2]}
            rows={TAB_BAR_DECLARED.map(([name, from, use]) => [name, from, <TokenValue name={from} />, use])} />
          <SpecTable head={["Part", "Canon token", "Value"]} mono={[1, 2]}
            rows={CANON.map(([part, name]) => [part, name, <TokenValue name={name} />])} />
          <SpecTable head={["Rule", "Value"]}
            rows={[
              ["Tab width", "Equal share of the bar width left after + and the logo, kept between min and max width"],
              ["Label", "One line, ellipsis at the end, no icon, no close button. The whole tab width less the two insets"],
              ["Closing a tab", "Long press on the tab, then Close tab in the long-press menu"],
              ["+", "Right after the last tab. Stays at the right end of the tab row when the tabs overflow"],
              ["Logo", "Far right, only on the pane that reaches the top right of the screen"],
              ["Overflow", "The tab row scrolls sideways. No arrows. A cut tab at the edge shows there is more"],
            ]} />
          <Prose k="tabBarValuesNote" />
        </Spec>
        <Spec id="tab-bar-targets" title="Drawn size and touch target" when={COPY.tabBarTargetsWhen}>
          <Stage eager variant="column" style={{ overflowX: "auto", flexWrap: "nowrap" }}>
            <Cluster label={`${PORTRAIT} dp, dashed lines are targets`}>
              <div style={{ width: `${PORTRAIT}px` }}><Bar pane={PORTRAIT} tabs={titles(2)} logo targets /><Terminal focused /></div>
            </Cluster>
            <Cluster label={`Two ${HALF} dp panes, dashed lines are targets`}><Split left={2} right={2} focus="right" targets /></Cluster>
          </Stage>
          <SpecTable head={["Part", "Drawn", "Target", "Baseline"]} mono={[1, 2, 3]}
            rows={[
              ["Tab", "the whole tab", "android-tab-min-width to max by android-tab-height", "48 by 48"],
              ["+", <>icon-size-md <TokenValue name="icon-size-md" /></>, "android-tab-button-width by android-tab-height + android-tab-button-reach", "48 by 48"],
              ["Logo", <>android-tab-logo-size <TokenValue name="size-20" /></>, "android-tab-button-width by android-tab-height + android-tab-button-reach", "48 by 48"],
            ]} />
          <Prose k="tabBarTargetsNote" />
        </Spec>
        <Spec id="tab-bar-portrait" title={`Portrait, ${PORTRAIT} dp`} when={COPY.tabBarPortraitWhen}>
          <Rows pane={PORTRAIT} rows={[
            ["With the logo, one tab", { tabs: titles(1), logo: true }],
            ["With the logo, three tabs", { tabs: titles(3), selected: 1, logo: true }],
            ["With the logo, overflow, at the start", { tabs: titles(8), selected: 1, logo: true }],
            ["With the logo, overflow, a new tab at the end", { tabs: titles(9), selected: 8, logo: true }],
            ["No logo, one tab", { tabs: titles(1) }],
            ["No logo, three tabs", { tabs: titles(3), selected: 1 }],
            ["No logo, overflow", { tabs: titles(8), selected: 1 }],
          ]} />
        </Spec>
        <Spec id="tab-bar-landscape" title={`Landscape, ${LANDSCAPE} dp`} when={COPY.tabBarLandscapeWhen}>
          <Rows pane={LANDSCAPE} rows={[
            ["With the logo, one tab", { tabs: titles(1), logo: true }],
            ["With the logo, four tabs", { tabs: titles(4), selected: 2, logo: true }],
            ["With the logo, overflow", { tabs: titles(14), selected: 2, logo: true }],
            ["No logo, one tab", { tabs: titles(1) }],
            ["No logo, four tabs", { tabs: titles(4), selected: 2 }],
          ]} />
        </Spec>
        <Spec id="tab-bar-split" title={`Split, two ${HALF} dp panes`} when={COPY.tabBarSplitWhen}>
          <Stage eager variant="column" style={{ overflowX: "auto", flexWrap: "nowrap" }}>
            <Cluster label="One tab each, left pane focused"><Split left={1} right={1} focus="left" /></Cluster>
            <Cluster label="Three tabs each, right pane focused"><Split left={3} right={3} focus="right" /></Cluster>
            <Cluster label="Overflow on both, left pane focused"><Split left={6} right={6} focus="left" /></Cluster>
          </Stage>
          <Prose k="tabBarSplitNote" />
        </Spec>
      </div>
    </Section>
  );
}

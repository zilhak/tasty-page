// The pane tab bar on Android. The canon has no touch tab bar, so the few values it needs are declared below, each one
// pointing at a canon token. Colors, type and the + button are the desktop's, read unchanged. Product behaviour (what a
// tab, a pane and the logo menu do) is not decided here: this section only draws it.
import React, { useEffect, useRef } from "react";
import { Icon, IconButton } from "../../components/index.js";
import { Cluster, Section, Spec, Stage, View, Views } from "../../gallery/parts/specimen.jsx";
import { COPY } from "./copy.js";
import { Prose, SpecTable, TokenValue } from "./kit.jsx";

const BASE = `${import.meta.env.BASE_URL.replace(/\/$/, "")}/`;

// Android's own values. Name, the canon token it reads, and what it sets. Declared on the section root as custom
// properties, so the specimens below read these names and no number.
const DECLARED = [
  ["android-tab-height", "control-height", "Bar height. Every target in the bar is this tall"],
  ["android-tab-min-width", "size-120", "Narrowest tab. One whole tab fits a 180 pane that also holds + and the logo"],
  ["android-tab-max-width", "size-240", "Widest tab, when the pane has room to share"],
  ["android-tab-close-target", "control-height", "Close target, square, at the right end of the selected tab"],
  ["android-tab-logo-size", "size-20", "Drawn logo mark inside its target"],
];
const declared = Object.fromEntries(DECLARED.map(([name, from]) => [`--${name}`, `var(--tasty-${from})`]));

// Values read from the canon unchanged.
const CANON = [
  ["Tab inset, start", "tab-padding-x"],
  ["Label to close target", "tab-status-gap"],
  ["Close, drawn cell", "tab-close-size"],
  ["Close, glyph", "icon-size-xs"],
  ["Close, corner", "tab-close-radius"],
  ["Selection edge", "tab-indicator-width"],
  ["+ and logo target", "icon-button-size"],
  ["+ glyph", "icon-size-md"],
  ["Label type", "font-size-body"],
  ["Tab divider, bar bottom line", "border-width"],
];

const COLORS = [
  ["Tab at rest", "tab-bg", "tab-fg"],
  ["Tab pressed", "tab-bg-hover", "tab-fg-hover"],
  ["Selected tab, focused pane", "tab-bg-active", "tab-fg-active"],
  ["Selected tab, other pane", "tab-bg-active", "text-secondary"],
  ["Selection edge, focused pane only", "tab-indicator", ""],
  ["Close glyph", "", "text-secondary"],
  ["Close, + and logo pressed", "overlay-active", ""],
  ["Bar ground, focused pane", "surface-raised", ""],
  ["Bar ground, other pane", "bg-sidebar", ""],
  ["Tab divider, bar bottom line", "tab-separator", ""],
];

const TITLES = ["Terminal 1", "~/work/tasty", "npm run dev", "vim README.md", "ssh build-host", "cargo test --workspace", "Terminal 7", "htop", "logs", "Terminal 10", "git log", "Terminal 12", "python3", "Terminal 14"];
const titles = (n) => TITLES.slice(0, n);
const dashed = { outline: "var(--tasty-border-width) dashed var(--tasty-border-control)", outlineOffset: "calc(-1 * var(--tasty-border-width))" };

// Equal share of the room the buttons leave, between the min and max width. The app takes the pane width from layout.
const tabWidth = (pane, logo, count) =>
  `clamp(var(--android-tab-min-width), calc((${pane}px - var(--tasty-icon-button-size)${logo ? " - var(--tasty-icon-button-size)" : ""}) / ${count}), var(--android-tab-max-width))`;

function Logo({ pressed, targets }) {
  return (
    <IconButton aria-label="Tasty menu" style={{ flex: "none", ...(pressed ? { background: "var(--tasty-overlay-active)" } : null), ...(targets ? dashed : null) }}>
      <img src={`${BASE}tasty-icon.png`} alt="" width={64} height={64} style={{ display: "block", width: "var(--android-tab-logo-size)", height: "var(--android-tab-logo-size)" }} />
    </IconButton>
  );
}

function ATab({ label, width, selected, focused, pressed, closePressed, targets }) {
  const fg = selected ? (focused ? "var(--tasty-tab-fg-active)" : "var(--tasty-text-secondary)") : pressed ? "var(--tasty-tab-fg-hover)" : "var(--tasty-tab-fg)";
  const bg = selected ? "var(--tasty-tab-bg-active)" : pressed ? "var(--tasty-tab-bg-hover)" : "var(--tasty-tab-bg)";
  return (
    <div role="tab" aria-selected={selected} style={{ position: "relative", flex: "none", boxSizing: "border-box", width, height: "var(--android-tab-height)", display: "flex", alignItems: "center",
      gap: "var(--tasty-tab-status-gap)", paddingLeft: "var(--tasty-tab-padding-x)", background: bg, color: fg, fontFamily: "var(--tasty-font-ui)", fontSize: "var(--tasty-font-size-body)",
      borderRight: "var(--tasty-border-width) solid var(--tasty-tab-separator)", ...(targets ? dashed : null) }}>
      {selected && focused && <span style={{ position: "absolute", top: 0, left: 0, right: 0, height: "var(--tasty-tab-indicator-width)", background: "var(--tasty-tab-indicator)" }} />}
      <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>
      {/* The slot stays on every tab so a label never moves when its tab is selected. Only the selected tab shows it. */}
      <span style={{ flex: "none", width: "var(--android-tab-close-target)", height: "var(--android-tab-close-target)", display: "inline-flex", alignItems: "center", justifyContent: "center",
        visibility: selected ? "visible" : "hidden", ...(targets && selected ? dashed : null) }}>
        <span style={{ width: "var(--tasty-tab-close-size)", height: "var(--tasty-tab-close-size)", display: "inline-flex", alignItems: "center", justifyContent: "center", borderRadius: "var(--tasty-tab-close-radius)",
          color: "var(--tasty-text-secondary)", background: closePressed ? "var(--tasty-overlay-active)" : "transparent" }}>
          <Icon name="close" size="var(--tasty-icon-size-xs)" />
        </span>
      </span>
    </div>
  );
}

// One pane's bar. pane is its width. The tabs scroll; + follows the last tab and stays at the end when they overflow;
// the logo, when this pane reaches the top right of the screen, sits at the far right.
// The selected tab is scrolled fully into view, as the app does after a tab is selected or added.
function Bar({ pane, tabs, selected = 0, focused = true, logo = false, pressed = {}, targets = false }) {
  const scroller = useRef(null);
  useEffect(() => {
    const row = scroller.current;
    const tab = row && row.children[selected];
    if (!tab) return;
    const end = tab.getBoundingClientRect().right - row.getBoundingClientRect().left + row.scrollLeft;
    if (end > row.clientWidth) row.scrollLeft = end - row.clientWidth;
  }, [selected, tabs.length]);
  const width = tabWidth(pane, logo, tabs.length);
  return (
    <div style={{ width: `${pane}px`, flex: "none", boxSizing: "border-box", height: "calc(var(--android-tab-height) + var(--tasty-border-width))", display: "flex", alignItems: "flex-start",
      background: focused ? "var(--tasty-surface-raised)" : "var(--tasty-bg-sidebar)", borderBottom: "var(--tasty-border-width) solid var(--tasty-separator)" }}>
      <div ref={scroller} role="tablist" style={{ flex: "0 1 auto", minWidth: 0, display: "flex", overflowX: "auto", scrollbarWidth: "none" }}>
        {tabs.map((t, i) => <ATab key={t} label={t} width={width} selected={i === selected} focused={focused} pressed={pressed.tab === i} closePressed={pressed.close && i === selected} targets={targets} />)}
      </div>
      <IconButton aria-label="New tab" style={{ flex: "none", ...(pressed.plus ? { background: "var(--tasty-overlay-active)" } : null), ...(targets ? dashed : null) }}><Icon name="plus" /></IconButton>
      <span style={{ flex: 1 }} />
      {logo && <Logo pressed={pressed.logo} targets={targets} />}
    </div>
  );
}

const LINES = ["$ cd ~/work/tasty", "$ git status", "On branch main"];
function Terminal({ focused, lines = 2 }) {
  return (
    <div style={{ padding: "var(--tasty-space-xs) var(--tasty-space-sm)", fontFamily: "var(--tasty-font-mono)", fontSize: "var(--tasty-font-size-term)",
      background: focused ? "var(--tasty-surface-terminal-focused-bg)" : "var(--tasty-surface-terminal-unfocused-bg)",
      color: focused ? "var(--tasty-surface-terminal-focused-fg)" : "var(--tasty-surface-terminal-unfocused-fg)" }}>
      {LINES.slice(0, lines).map((l) => <div key={l} style={{ whiteSpace: "nowrap", overflow: "hidden" }}>{l}</div>)}
    </div>
  );
}

// Screen frames. 360 is the narrow-phone width of the widths section. 800 is a chosen landscape phone width (a 360 by 800
// phone turned), not a value from a source. 180 is one half of 360, split left and right.
const PORTRAIT = 360;
const LANDSCAPE = 800;
const HALF = PORTRAIT / 2;

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
function Split({ left, right, focus }) {
  return (
    <div style={{ display: "flex", width: `${PORTRAIT}px`, flex: "none", background: "var(--tasty-bg-app)" }}>
      {[["left", left], ["right", right]].map(([side, n]) => (
        <div key={side} style={{ width: `${HALF}px`, flex: "none", overflow: "hidden", boxSizing: "border-box", ...(side === "left" ? { borderRight: "var(--tasty-border-width) solid var(--tasty-separator)" } : null) }}>
          <Bar pane={HALF} tabs={titles(n)} selected={n > 2 ? 1 : 0} focused={focus === side} logo={side === "right"} />
          <Terminal focused={focus === side} />
        </div>
      ))}
    </div>
  );
}

export function TabBarSection() {
  return (
    <Section id="tab-bar" title="Pane tab bar">
      <div style={declared}>
        <Spec id="tab-bar-anatomy" title="Anatomy" when={COPY.tabBarAnatomyWhen}>
          <Views>
            <View name="tab-bar-focused" label="Focused pane, with the logo"><Bar pane={HALF} tabs={titles(1)} logo /></View>
            <View name="tab-bar-other" label="Other pane, no logo"><Bar pane={HALF} tabs={titles(2)} focused={false} /></View>
            <View name="tab-bar-pressed-tab" label="Pressed: a tab at rest"><Bar pane={HALF + 60} tabs={titles(2)} pressed={{ tab: 1 }} /></View>
            <View name="tab-bar-pressed-close" label="Pressed: close"><Bar pane={HALF} tabs={titles(1)} logo pressed={{ close: true }} /></View>
            <View name="tab-bar-pressed-plus" label="Pressed: new tab"><Bar pane={HALF} tabs={titles(1)} logo pressed={{ plus: true }} /></View>
            <View name="tab-bar-pressed-logo" label="Pressed: logo"><Bar pane={HALF} tabs={titles(1)} logo pressed={{ logo: true }} /></View>
          </Views>
          <SpecTable head={["Part", "Ground", "Ink"]} mono={[1, 2]} rows={COLORS} />
          <Prose k="tabBarAnatomyNote" />
        </Spec>
        <Spec id="tab-bar-values" title="Values" when={COPY.tabBarValuesWhen}>
          <SpecTable head={["Declared here", "Reads", "Value", "Sets"]} mono={[0, 1, 2]}
            rows={DECLARED.map(([name, from, use]) => [name, from, <TokenValue name={from} />, use])} />
          <SpecTable head={["Part", "Canon token", "Value"]} mono={[1, 2]}
            rows={CANON.map(([part, name]) => [part, name, <TokenValue name={name} />])} />
          <SpecTable head={["Rule", "Value"]}
            rows={[
              ["Tab width", "Equal share of the bar width left after + and the logo, kept between min and max width"],
              ["Label", "One line, ellipsis at the end, no icon"],
              ["Close", "Selected tab only. Its slot is kept on every tab"],
              ["+", "Right after the last tab. Stays at the right end of the tab row when the tabs overflow"],
              ["Logo", "Far right, only on the pane that reaches the top right of the screen"],
              ["Overflow", "The tab row scrolls sideways. No arrows. A cut tab at the edge shows there is more"],
            ]} />
          <Prose k="tabBarValuesNote" />
        </Spec>
        <Spec id="tab-bar-targets" title="Drawn size and touch target" when={COPY.tabBarTargetsWhen}>
          <Stage eager variant="column" style={{ overflowX: "auto", flexWrap: "nowrap" }}>
            <Cluster label={`${PORTRAIT} dp, dashed lines are targets`}><Bar pane={PORTRAIT} tabs={titles(2)} logo targets /></Cluster>
            <Cluster label={`${HALF} dp pane, dashed lines are targets`}><Bar pane={HALF} tabs={titles(2)} logo targets /></Cluster>
          </Stage>
          <SpecTable head={["Part", "Drawn", "Target", "Baseline"]} mono={[1, 2, 3]}
            rows={[
              ["Tab", "the whole tab", <>android-tab-min-width to max by android-tab-height</>, "48 by 48"],
              ["Close", <>tab-close-size <TokenValue name="tab-close-size" /></>, <>android-tab-close-target <TokenValue name="control-height" /></>, "48 by 48"],
              ["+", <>icon-size-md <TokenValue name="icon-size-md" /></>, <>icon-button-size <TokenValue name="icon-button-size" /></>, "48 by 48"],
              ["Logo", <>android-tab-logo-size <TokenValue name="size-20" /></>, <>icon-button-size <TokenValue name="icon-button-size" /></>, "48 by 48"],
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

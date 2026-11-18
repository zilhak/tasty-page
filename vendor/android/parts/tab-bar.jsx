// Android part: the pane tab bar. Drawn here, not taken from vendor/components, because its shape differs from the
// desktop tab strip. The desktop strip is a reference only. Colors and type are canon tokens, and its sizes are the
// --tasty-android-tab-* tokens in tokens/components.css. Icons come from vendor/icons through Icon.
import React, { useEffect, useRef } from "react";
import { Icon } from "../../components/index.js";

const BASE = `${import.meta.env.BASE_URL.replace(/\/$/, "")}/`;

// The Android tab bar tokens, for the gallery tables: token, the canon token it reads, and what it sets.
export const TAB_BAR_TOKENS = [
  ["android-tab-height", "size-32", "Bar height, and the height of a tab's target"],
  ["android-tab-min-width", "size-96", "Narrowest tab. One whole tab fits a 180 pane that also holds + and the logo"],
  ["android-tab-max-width", "size-240", "Widest tab, when the pane has room to share"],
  ["android-tab-button-width", "size-40", "Width of the + and logo buttons, which is their target width"],
  ["android-tab-button-reach", "space-sm", "How far the + and logo targets reach below the bar, into the pane's own terminal"],
  ["android-tab-logo-size", "size-20", "Drawn logo mark inside its target"],
];

const dashed = { outline: "var(--tasty-border-width) dashed var(--tasty-border-control)", outlineOffset: "calc(-1 * var(--tasty-border-width))" };

// Equal share of the room the buttons leave, between the min and max width. The app takes the pane width from layout.
const tabWidth = (pane, logo, count) =>
  `clamp(var(--tasty-android-tab-min-width), calc((${pane}px - var(--tasty-android-tab-button-width)${logo ? " - var(--tasty-android-tab-button-width)" : ""}) / ${count}), var(--tasty-android-tab-max-width))`;

// The + and logo buttons. The drawn cell is the bar height; the target reaches android-tab-button-reach further down.
export function BarButton({ label, pressed, targets, children }) {
  return (
    <button type="button" aria-label={label} style={{ position: "relative", flex: "none", width: "var(--tasty-android-tab-button-width)", height: "var(--tasty-android-tab-height)", padding: 0, border: 0,
      display: "inline-flex", alignItems: "center", justifyContent: "center", color: "var(--tasty-icon-button-fg)", background: pressed ? "var(--tasty-overlay-active)" : "transparent", cursor: "pointer" }}>
      {children}
      {targets && <span aria-hidden="true" style={{ position: "absolute", zIndex: 1, top: 0, left: 0, right: 0, height: "calc(100% + var(--tasty-border-width) + var(--tasty-android-tab-button-reach))", ...dashed }} />}
    </button>
  );
}

export function Tab({ label, width, selected, focused, pressed, targets }) {
  const fg = selected ? (focused ? "var(--tasty-tab-fg-active)" : "var(--tasty-text-secondary)") : pressed ? "var(--tasty-tab-fg-hover)" : "var(--tasty-tab-fg)";
  const bg = selected ? "var(--tasty-tab-bg-active)" : pressed ? "var(--tasty-tab-bg-hover)" : "var(--tasty-tab-bg)";
  return (
    <div role="tab" aria-selected={selected} style={{ position: "relative", flex: "none", boxSizing: "border-box", width, height: "var(--tasty-android-tab-height)", display: "flex", alignItems: "center",
      padding: "0 var(--tasty-tab-padding-x)", background: bg, color: fg, fontFamily: "var(--tasty-font-ui)", fontSize: "var(--tasty-font-size-body)",
      borderRight: "var(--tasty-border-width) solid var(--tasty-tab-separator)", ...(targets ? dashed : null) }}>
      {selected && focused && <span style={{ position: "absolute", top: 0, left: 0, right: 0, height: "var(--tasty-tab-indicator-width)", background: "var(--tasty-tab-indicator)" }} />}
      <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>
    </div>
  );
}

// One pane's bar. pane is its width. The tabs scroll; + follows the last tab and stays at the end when they overflow;
// the logo, when this pane reaches the top right of the screen, sits at the far right. The selected tab is scrolled
// fully into view, as the app does after a tab is selected or added.
export function Bar({ pane, tabs, selected = 0, focused = true, logo = false, pressed = {}, targets = false }) {
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
    <div style={{ position: "relative", width: `${pane}px`, flex: "none", boxSizing: "border-box", height: "calc(var(--tasty-android-tab-height) + var(--tasty-border-width))", display: "flex", alignItems: "flex-start",
      background: focused ? "var(--tasty-surface-raised)" : "var(--tasty-bg-sidebar)", borderBottom: "var(--tasty-border-width) solid var(--tasty-separator)" }}>
      <div ref={scroller} role="tablist" style={{ flex: "0 1 auto", minWidth: 0, display: "flex", overflowX: "auto", scrollbarWidth: "none" }}>
        {tabs.map((t, i) => <Tab key={t} label={t} width={width} selected={i === selected} focused={focused} pressed={pressed.tab === i} targets={targets} />)}
      </div>
      <BarButton label="New tab" pressed={pressed.plus} targets={targets}><Icon name="plus" size="var(--tasty-icon-size-md)" /></BarButton>
      <span style={{ flex: 1 }} />
      {logo && (
        <BarButton label="Tasty menu" pressed={pressed.logo} targets={targets}>
          <img src={`${BASE}tasty-icon.png`} alt="" width={64} height={64} style={{ display: "block", width: "var(--tasty-android-tab-logo-size)", height: "var(--tasty-android-tab-logo-size)" }} />
        </BarButton>
      )}
    </div>
  );
}


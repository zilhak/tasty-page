// The long-press menu. On Android a long press opens a list popup in the middle of the screen, for a tab and for any
// later target. Only Close tab is decided for a tab; the other rows are candidates and are drawn as such. The parts are
// ../parts/list-popup.jsx and ../parts/tab-bar.jsx.
import React from "react";
import { Cluster, Section, Spec, Stage, View, Views } from "../../gallery/parts/specimen.jsx";
import { LIST_POPUP_DECLARED, ListPopup, ListPopupRow, ListPopupSeparator, listPopupVars } from "../parts/list-popup.jsx";
import { Bar, tabBarVars } from "../parts/tab-bar.jsx";
import { COPY } from "./copy.js";
import { Prose, SpecTable, TokenValue } from "./kit.jsx";
import { PORTRAIT, Terminal, titles } from "./tab-bar.jsx";

const LANDSCAPE = 800;
// A landscape window with the on-screen keyboard open leaves about this much height. Chosen for the specimen, not measured.
const SHORT = 200;

const COLORS = [
  ["Scrim", "scrim-bg", ""],
  ["Popup", "bg-panel", ""],
  ["Popup edge", "border-frame", ""],
  ["Popup lift", "shadow-modal", ""],
  ["Title", "", "text-primary, weight semibold"],
  ["Title rule, group rule", "menu-separator", ""],
  ["Row", "", "text-primary"],
  ["Row pressed", "overlay-active", "text-primary"],
];

// What the tab menu holds. Close tab is decided; the rest are candidates for the product decision.
function TabMenu({ candidates, pressed }) {
  return (
    <>
      {candidates && (
        <>
          <ListPopupRow label="Rename tab" candidate />
          <ListPopupRow label="Move left" candidate />
          <ListPopupRow label="Move right" candidate />
          <ListPopupSeparator />
        </>
      )}
      <ListPopupRow label="Close tab" pressed={pressed} />
    </>
  );
}

// A screen: the pane's bar, with the long-pressed tab still held, and its terminal, under the popup.
function Screen({ width, height, held = 1, selected = 0, title, candidates, pressed, tabs = 3 }) {
  const under = (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "var(--tasty-surface-terminal-focused-bg)" }}>
      <Bar pane={width} tabs={titles(tabs)} selected={selected} logo pressed={{ tab: held }} />
      <Terminal focused lines={6} style={{ flex: 1 }} />
    </div>
  );
  return (
    <div style={{ width: `${width}px`, height: `${height}px`, flex: "none" }}>
      <ListPopup title={title || titles(tabs)[held]} under={under}><TabMenu candidates={candidates} pressed={pressed} /></ListPopup>
    </div>
  );
}

export function LongPressSection() {
  return (
    <Section id="long-press" title="Long-press menu">
      <div style={{ ...tabBarVars, ...listPopupVars }}>
        <Spec id="long-press-tab" title="Tab menu" when={COPY.longPressTabWhen}>
          <Stage eager variant="column" style={{ overflowX: "auto", flexWrap: "nowrap" }}>
            <Cluster label="1. Finger down on a tab: the tab takes the pressed ground"><Bar pane={PORTRAIT} tabs={titles(3)} logo pressed={{ tab: 1 }} /></Cluster>
            <Cluster label="2. Long press reached: the popup opens, decided rows only"><Screen width={PORTRAIT} height={360} /></Cluster>
            <Cluster label="2. The same, with the candidate rows"><Screen width={PORTRAIT} height={360} candidates /></Cluster>
          </Stage>
          <Prose k="longPressTabNote" />
        </Spec>
        <Spec id="long-press-states" title="Popup states" when={COPY.longPressStatesWhen}>
          <Views>
            <View name="long-press-row-pressed" label="Row pressed"><Screen width={240} height={240} pressed /></View>
            <View name="long-press-selected-tab" label="Long press on the selected tab"><Screen width={240} height={240} held={0} /></View>
            <View name="long-press-long-title" label="Long title"><Screen width={240} height={240} tabs={6} held={5} /></View>
          </Views>
          <Stage eager variant="column" style={{ overflowX: "auto", flexWrap: "nowrap" }}>
            <Cluster label={`Landscape ${LANDSCAPE} dp, keyboard open, about ${SHORT} dp left: the rows scroll under the title`}><Screen width={LANDSCAPE} height={SHORT} candidates tabs={4} /></Cluster>
          </Stage>
        </Spec>
        <Spec id="long-press-values" title="Values" when={COPY.longPressValuesWhen}>
          <SpecTable head={["Declared here", "Reads", "Value", "Sets"]} mono={[0, 1, 2]}
            rows={LIST_POPUP_DECLARED.map(([name, from, use]) => [name, from, <TokenValue name={from} />, use])} />
          <SpecTable head={["Part", "Ground", "Ink"]} mono={[1, 2]} rows={COLORS} />
          <SpecTable head={["Rule", "Value"]}
            rows={[
              ["Opens", "When a long press is reached on the target. The target keeps its pressed ground while the popup is open"],
              ["Where", "Middle of the window, over a scrim. Never at the finger"],
              ["Width", "android-popup-max-width, or the window width less two margins when that is narrower"],
              ["Title", "The name of what was long-pressed, one line, ellipsis at the end. No close button"],
              ["Rows", "Full popup width, one line each. A rule separates groups. Decided actions last"],
              ["Choosing", "A tap on a row runs it and closes the popup. Lifting the finger from the long press chooses nothing"],
              ["Closing without a choice", "A tap on the scrim, or the system back"],
              ["Too short a window", "The title stays; the rows scroll"],
              ["Under the scrim", "Inert while the popup is open"],
            ]} />
          <Prose k="longPressValuesNote" />
        </Spec>
      </div>
    </Section>
  );
}

// Popup menus. On Android every menu is a list popup in the middle of the window: the tab menu a long press opens, and
// the Tasty menu the logo opens. An open on-screen keyboard stays open; the popup sits in the area above it. The parts
// are ../parts/list-popup.jsx and ../parts/tab-bar.jsx. The rows and what they do are the product's; this section
// draws them.
import React from "react";
import { Cluster, Section, Spec, Stage, View, Views } from "../../gallery/parts/specimen.jsx";
import { LIST_POPUP_DECLARED, ListPopup, ListPopupHeading, ListPopupRow, ListPopupSeparator, listPopupVars } from "../parts/list-popup.jsx";
import { Bar, tabBarVars } from "../parts/tab-bar.jsx";
import { COPY } from "./copy.js";
import { Prose, SpecTable, TokenValue } from "./kit.jsx";
import { PORTRAIT, Terminal, titles } from "./tab-bar.jsx";

// Screen sizes for the frames: a 360 by 640 portrait window and the same class of phone turned, 800 by 360. The keyboard
// heights are chosen for the specimen, not measured on a device.
const TALL = 640;
const LANDSCAPE = 800;
const SHORT = 360;
const KEYBOARD_PORTRAIT = 280;
const KEYBOARD_LANDSCAPE = 200;

const COLORS = [
  ["Scrim, over the app window only", "scrim-bg", ""],
  ["Popup", "bg-panel", ""],
  ["Popup edge", "border-frame", ""],
  ["Popup lift", "shadow-modal", ""],
  ["Title", "", "text-primary, semibold"],
  ["Group heading", "", "text-secondary, caption, semibold"],
  ["Title rule, group rule", "menu-separator", ""],
  ["Row", "", "text-primary"],
  ["Row in effect (current workspace)", "", "text-primary, semibold, check in accent-primary"],
  ["Row not available", "", "text-disabled"],
  ["Row pressed", "overlay-active", "text-primary"],
];

// The tab menu. index and count place the tab in its row: the first tab cannot move left, the last cannot move right.
function TabMenu({ index, count, pressed }) {
  return (
    <>
      <ListPopupRow label="Rename tab" pressed={pressed === "rename"} />
      <ListPopupRow label="Move left" disabled={index === 0} />
      <ListPopupRow label="Move right" disabled={index === count - 1} />
      <ListPopupSeparator />
      <ListPopupRow label="Close tab" pressed={pressed === "close"} />
    </>
  );
}

const WORKSPACES = ["Workspace 1", "tasty", "build server", "notes", "Workspace 5", "Workspace 6", "Workspace 7", "Workspace 8"];

// The Tasty menu, in the app's order. The pane and surface groups show when a pane and a surface have focus, as now.
function TastyMenu({ workspaces = 3, current = 0, pane = true, surface = true }) {
  return (
    <>
      <ListPopupHeading label="Workspaces" />
      {WORKSPACES.slice(0, workspaces).map((w, i) => <ListPopupRow key={w} label={w} current={i === current} />)}
      <ListPopupRow label="New workspace" />
      <ListPopupSeparator />
      {pane && (
        <>
          <ListPopupRow label="Split pane right" />
          <ListPopupRow label="Split pane down" />
          <ListPopupRow label="Close pane" />
          <ListPopupSeparator />
        </>
      )}
      {surface && (
        <>
          <ListPopupRow label="Split surface right" />
          <ListPopupRow label="Split surface down" />
          <ListPopupRow label="Close surface" />
          <ListPopupSeparator />
        </>
      )}
      <ListPopupRow label="Close workspace" />
    </>
  );
}

// A window: the pane's bar and its terminal under the popup, and the keyboard below when it is open.
// held: the tab held by a long press, or "logo" when the logo was tapped.
function Screen({ width, height, keyboard = 0, tabs = 3, selected = 0, held = 1, title, scrollTo, children }) {
  const under = (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "var(--tasty-surface-terminal-focused-bg)" }}>
      <Bar pane={width} tabs={titles(tabs)} selected={selected} logo pressed={held === "logo" ? { logo: true } : { tab: held }} />
      <Terminal focused lines={6} style={{ flex: 1 }} />
    </div>
  );
  return (
    <div style={{ width: `${width}px`, height: `${height}px`, flex: "none" }}>
      <ListPopup title={title || titles(tabs)[held]} under={under} keyboard={keyboard} scrollTo={scrollTo}>{children}</ListPopup>
    </div>
  );
}

const column = { overflowX: "auto", flexWrap: "nowrap" };

export function PopupMenuSection() {
  return (
    <Section id="popup-menu" title="Popup menus">
      <div style={{ ...tabBarVars, ...listPopupVars }}>
        <Spec id="popup-tab-menu" title="Tab menu, by long press" when={COPY.popupTabMenuWhen}>
          <Stage eager variant="column" style={column}>
            <Cluster label="1. Finger down on a tab: the tab takes the pressed ground"><Bar pane={PORTRAIT} tabs={titles(3)} logo pressed={{ tab: 1 }} /></Cluster>
            <Cluster label="2. Long press reached: one haptic tick, and the popup opens. A middle tab: every row available"><Screen width={PORTRAIT} height={420}><TabMenu index={1} count={3} /></Screen></Cluster>
          </Stage>
          <Views>
            <View name="popup-tab-first" label="First tab: Move left not available"><Screen width={240} height={340} held={0}><TabMenu index={0} count={3} /></Screen></View>
            <View name="popup-tab-last" label="Last tab: Move right not available"><Screen width={240} height={340} held={2} selected={2}><TabMenu index={2} count={3} /></Screen></View>
            <View name="popup-tab-only" label="Only tab: neither move available"><Screen width={240} height={340} tabs={1} held={0}><TabMenu index={0} count={1} /></Screen></View>
            <View name="popup-tab-pressed" label="Row pressed"><Screen width={240} height={340}><TabMenu index={1} count={3} pressed="close" /></Screen></View>
            <View name="popup-tab-long-title" label="Long title"><Screen width={240} height={340} tabs={6} held={5}><TabMenu index={5} count={6} /></Screen></View>
          </Views>
          <Prose k="popupTabMenuNote" />
        </Spec>
        <Spec id="popup-tasty-menu" title="Tasty menu, from the logo" when={COPY.popupTastyMenuWhen}>
          <Stage eager variant="column" style={column}>
            <Cluster label="Logo tapped: three workspaces, a focused pane and surface"><Screen width={PORTRAIT} height={TALL} held="logo" title="Tasty"><TastyMenu /></Screen></Cluster>
            <Cluster label="Eight workspaces: the rows scroll under the title, shown scrolled to the end"><Screen width={PORTRAIT} height={TALL} held="logo" title="Tasty" scrollTo={10000}><TastyMenu workspaces={8} current={1} /></Screen></Cluster>
          </Stage>
          <Prose k="popupTastyMenuNote" />
        </Spec>
        <Spec id="popup-keyboard" title="With the on-screen keyboard open" when={COPY.popupKeyboardWhen}>
          <Stage eager variant="column" style={column}>
            <Cluster label={`Portrait ${PORTRAIT} by ${TALL}, keyboard ${KEYBOARD_PORTRAIT}: tab menu`}><Screen width={PORTRAIT} height={TALL} keyboard={KEYBOARD_PORTRAIT}><TabMenu index={1} count={3} /></Screen></Cluster>
            <Cluster label={`Portrait ${PORTRAIT} by ${TALL}, keyboard ${KEYBOARD_PORTRAIT}: Tasty menu, rows scroll`}><Screen width={PORTRAIT} height={TALL} keyboard={KEYBOARD_PORTRAIT} held="logo" title="Tasty"><TastyMenu /></Screen></Cluster>
            <Cluster label={`Landscape ${LANDSCAPE} by ${SHORT}, keyboard ${KEYBOARD_LANDSCAPE}: tab menu, rows scroll`}><Screen width={LANDSCAPE} height={SHORT} keyboard={KEYBOARD_LANDSCAPE} tabs={4}><TabMenu index={1} count={4} /></Screen></Cluster>
            <Cluster label={`Landscape ${LANDSCAPE} by ${SHORT}, keyboard ${KEYBOARD_LANDSCAPE}: Tasty menu, rows scroll`}><Screen width={LANDSCAPE} height={SHORT} keyboard={KEYBOARD_LANDSCAPE} tabs={4} held="logo" title="Tasty"><TastyMenu /></Screen></Cluster>
          </Stage>
          <Prose k="popupKeyboardNote" />
        </Spec>
        <Spec id="popup-values" title="Values" when={COPY.popupValuesWhen}>
          <SpecTable head={["Declared here", "Reads", "Value", "Sets"]} mono={[0, 1, 2]}
            rows={LIST_POPUP_DECLARED.map(([name, from, use]) => [name, from, <TokenValue name={from} />, use])} />
          <SpecTable head={["Part", "Ground", "Ink"]} mono={[1, 2]} rows={COLORS} />
          <SpecTable head={["Rule", "Value"]}
            rows={[
              ["Which menus", "Every menu on Android: a long press on a tab, and the logo"],
              ["Opens", "Long press: when the long press is reached, with one haptic tick. The pressed target keeps its pressed ground while the popup is open. Logo: on tap"],
              ["Where", "Middle of the app window area that is free, over a scrim. Never at the finger"],
              ["On-screen keyboard", "Stays open and is not pushed away. The scrim stops at the keyboard, and the popup centres in the area above it"],
              ["Width", "android-popup-max-width, or the free width less two margins when that is narrower"],
              ["Height", "As tall as its rows, up to the free height less two margins. Past that the title stays and the rows scroll"],
              ["Title", "What was pressed: the tab title, or Tasty for the logo. One line, ellipsis at the end. No close button"],
              ["Rows", "Full popup width, one line each, ellipsis at the end. A rule separates groups. A heading names a group when its rows are names, such as Workspaces"],
              ["Row not available", "Shown in place in text-disabled and not tappable. Never hidden, so rows keep their place"],
              ["Row in effect", "Semibold label and a check at the end, such as the workspace on screen"],
              ["Choosing", "A tap on a row runs it and closes the popup. Lifting the finger from the long press chooses nothing"],
              ["Closing without a choice", "A tap on the scrim, or the system back"],
              ["Under the scrim", "Inert while the popup is open"],
            ]} />
          <Prose k="popupValuesNote" />
        </Spec>
      </div>
    </Section>
  );
}

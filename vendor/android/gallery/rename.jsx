// Rename tab: the input popup that Rename tab in the tab menu opens. The part is ../parts/input-popup.jsx. What renaming
// does is the product's; this section draws the popup, its states, and how it closes.
import React from "react";
import { Cluster, Section, Spec, Stage, View, Views } from "../../gallery/parts/specimen.jsx";
import { InputPopup, PopupButton, PopupField } from "../parts/input-popup.jsx";
import { Bar } from "../parts/tab-bar.jsx";
import { COPY } from "./copy.js";
import { Prose, SpecTable } from "./kit.jsx";
import { KEYBOARD_LANDSCAPE, KEYBOARD_PORTRAIT, LANDSCAPE, SHORT, Screen, TALL, TabMenu } from "./popup-menu.jsx";
import { PORTRAIT, Terminal, titles } from "./tab-bar.jsx";

const NAME = titles(3)[1];
const LONG = "ssh build-host -- tail -f /var/log/tasty/agent-session-2026-11-18.log";

// The rename popup over a window: the pane's bar, with the tab being renamed held, and its terminal under the scrim.
// Outside a scroll specimen the frame shows the whole popup, and a line under it says when the app's free area is
// shorter than the popup. field: props for PopupField. ok: the Rename button's state.
function RenameScreen({ width, height, keyboard = 0, field = { value: NAME, selected: true }, ok = {}, cancel = {} }) {
  const [real, setReal] = React.useState(null);
  const under = (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "var(--tasty-surface-terminal-focused-bg)" }}>
      <Bar pane={width} tabs={titles(3)} logo pressed={{ tab: 1 }} />
      <Terminal focused lines={6} style={{ flex: 1 }} />
    </div>
  );
  const empty = !field.value || !field.value.trim();
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--tasty-space-xs)", flex: "none", width: `${width}px` }}>
      <div style={{ width: `${width}px`, minHeight: `${height}px`, display: "flex", flexDirection: "column" }}>
        <InputPopup title="Rename tab" under={under} keyboard={keyboard} expanded onFit={setReal}
          actions={<><PopupButton label="Cancel" {...cancel} /><PopupButton label="Rename" primary disabled={empty} {...ok} /></>}>
          <PopupField placeholder="Tab name" {...field} />
        </InputPopup>
      </div>
      {real && !real.fits && (
        <span style={{ fontSize: "var(--tasty-font-size-caption)", color: "var(--tasty-text-secondary)" }}>
          Shown in full. In the app at {width} by {height}, the popup is taller than the space above the keyboard, and Tasty leaves it so.
        </span>
      )}
    </div>
  );
}

const COLORS = [
  ["Popup, title, scrim", "as the list popup", ""],
  ["Field", "input-bg", "input-fg"],
  ["Field edge, focused", "input-border-focus, with a 1 px ring of the same", ""],
  ["Placeholder", "", "input-placeholder"],
  ["Selected text", "selection-bg", "text-on-active"],
  ["Caret (the system's)", "text-primary", ""],
  ["Rename", "button-primary-bg", "button-primary-fg"],
  ["Rename, not available", "state-disabled-fill, state-disabled-border", "state-disabled-fg"],
  ["Cancel", "", "text-primary"],
  ["Button pressed", "overlay-active over its fill", ""],
  ["Keyboard focus", "focus-ring-width ring in border-focus", ""],
];

const column = { overflowX: "auto", flexWrap: "nowrap" };

export function RenameSection() {
  return (
    <Section id="rename-tab" title="Rename tab">
      <div>
        <Spec id="rename-open" title="Opening" when={COPY.renameOpenWhen}>
          <Stage eager variant="column" style={column}>
            <Cluster label="1. Tab menu: Rename tab pressed"><Screen width={PORTRAIT} height={420}><TabMenu index={1} count={3} pressed="rename" /></Screen></Cluster>
            <Cluster label="2. The popup opens with the current name, all of it selected"><RenameScreen width={PORTRAIT} height={420} /></Cluster>
          </Stage>
          <Prose k="renameOpenNote" />
        </Spec>
        <Spec id="rename-states" title="States" when={COPY.renameStatesWhen}>
          <Views>
            <View name="rename-typing" label="Typing: the selection is replaced"><RenameScreen width={240} height={300} field={{ value: "build", caret: "end" }} /></View>
            <View name="rename-empty" label="Empty: Rename not available"><RenameScreen width={240} height={300} field={{ value: "", caret: "end" }} /></View>
            <View name="rename-spaces" label="Spaces only: counts as empty"><RenameScreen width={240} height={300} field={{ value: "   ", caret: "end" }} /></View>
            <View name="rename-long" label="Long name: the field scrolls with the caret"><RenameScreen width={240} height={300} field={{ value: LONG, caret: "end" }} /></View>
            <View name="rename-focus" label="Hardware keyboard: Tab to Rename"><RenameScreen width={240} height={300} field={{ value: "build", focused: false }} ok={{ focused: true }} /></View>
            <View name="rename-pressed" label="Rename pressed"><RenameScreen width={240} height={300} field={{ value: "build", caret: "end" }} ok={{ pressed: true }} /></View>
          </Views>
          <Prose k="renameStatesNote" />
        </Spec>
        <Spec id="rename-keyboard" title="With the on-screen keyboard open" when={COPY.renameKeyboardWhen}>
          <Stage eager variant="column" style={column}>
            <Cluster label={`Portrait ${PORTRAIT} by ${TALL}, keyboard ${KEYBOARD_PORTRAIT}`}><RenameScreen width={PORTRAIT} height={TALL} keyboard={KEYBOARD_PORTRAIT} field={{ value: "build", caret: "end" }} /></Cluster>
            <Cluster label={`Landscape ${LANDSCAPE} by ${SHORT}, keyboard ${KEYBOARD_LANDSCAPE}`}><RenameScreen width={LANDSCAPE} height={SHORT} keyboard={KEYBOARD_LANDSCAPE} field={{ value: "build", caret: "end" }} /></Cluster>
          </Stage>
          <Prose k="renameKeyboardNote" />
        </Spec>
        <Spec id="rename-rules" title="Rules" when={COPY.renameRulesWhen}>
          <SpecTable head={["Rule", "Value"]}
            rows={[
              ["Opens", "From Rename tab in the tab menu. The tab menu closes, and the tab keeps its pressed ground under the scrim"],
              ["Where", "As every Android popup: the middle of the free area above any open keyboard, over a scrim. The keyboard is neither opened nor closed by Tasty"],
              ["Title", "Rename tab"],
              ["Field", "One line, a row unit tall, the full popup width less the insets. Takes focus when the popup opens"],
              ["First value", "The tab's current name as the tab shows it, all of it selected, so typing replaces it and an arrow key keeps it"],
              ["Long name", "The field scrolls sideways with the caret; nothing wraps"],
              ["Empty", "A field with no character but spaces counts as empty: the placeholder Tab name shows when it has no character at all, and Rename is shown but not available"],
              ["Rename", "Tap Rename, or Enter on a hardware keyboard or the on-screen keyboard's action key, renames the tab and closes the popup. Enter does nothing while the field is empty"],
              ["Cancel", "Tap Cancel, Esc on a hardware keyboard, the system back, or a tap on the scrim closes the popup and keeps the old name"],
              ["Buttons", "Right-aligned, Cancel then Rename, each a row unit tall. Tab and Shift+Tab move keyboard focus between the field, Cancel and Rename"],
              ["A short area", "No special handling. If the popup is taller than the space above the keyboard, it stays so"],
            ]} />
          <SpecTable head={["Part", "Ground", "Ink"]} mono={[1, 2]} rows={COLORS} />
          <Prose k="renameRulesNote" />
        </Spec>
      </div>
    </Section>
  );
}

import React from "react";
import { Icon } from "../../components/index.js";
import { Spec, Stage, Meta, Views, View, Note } from "../parts/specimen.jsx";
import { TitlebarLinux } from "../../ui_kits/terminal/titlebar/titlebar_linux.jsx";
import { TitlebarWindows } from "../../ui_kits/terminal/titlebar/titlebar_windows.jsx";

// Tasty Gallery: Layouts, Title bar. Each cell is one row of the Title bar, Title bar (inactive) and Window close
// button contracts, painted with the tokens the contract names.




const CELL = { display: "grid", placeItems: "center", width: "var(--tasty-titlebar-caption-width)", height: "var(--tasty-titlebar-height)", flex: "none" };
const STATE_BG = { rest: "transparent", hover: "var(--tasty-titlebar-button-hover-bg)", press: "var(--tasty-titlebar-button-active-bg)" };
const STATE_FG = { hover: "var(--tasty-titlebar-button-fg-hover)", press: "var(--tasty-titlebar-button-fg-hover)" };

const WINDOWS = [
  { label: "Active", contract: "Title bar", host: "crust", bg: "var(--tasty-titlebar-bg)", fg: "var(--tasty-titlebar-fg)", buttonRest: "var(--tasty-titlebar-button-fg)" },
  { label: "Inactive", contract: "Title bar (inactive)", host: "mantle", bg: "var(--tasty-titlebar-bg-inactive)", fg: "var(--tasty-titlebar-fg-inactive)", buttonRest: "var(--tasty-titlebar-fg-inactive)" },
];

function Band({ w, children }) {
  return (
    <div style={{ display: "flex", alignItems: "stretch", width: "100%", minWidth: "var(--tasty-size-320)", height: "var(--tasty-titlebar-height)", background: w.bg }}>
      <span data-part="title" style={{ flex: 1, minWidth: 0, alignSelf: "center", padding: "0 var(--tasty-space-md)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: "var(--tasty-font-size-body)", color: w.fg }}>agents-prod</span>
      {children}
    </div>
  );
}

function CaptionCell({ w, state }) {
  return (
    <span style={{ ...CELL, background: STATE_BG[state], color: state === "rest" ? w.buttonRest : STATE_FG[state] }}>
      <Icon name="chevronDown" size="var(--tasty-icon-size-xs)" data-part="button" />
    </span>
  );
}

function CloseCell({ w }) {
  return (
    <span style={{ ...CELL, background: "var(--tasty-titlebar-close-hover-bg)", color: "var(--tasty-titlebar-close-hover-fg)" }}>
      <Icon name="close" size="var(--tasty-icon-size-xs)" data-part="glyph" />
    </span>
  );
}

const STAGE = { padding: "var(--tasty-space-md)", background: "var(--tasty-bg-panel)", flexDirection: "column", gap: "var(--tasty-space-sm)", overflowX: "auto" };

function GalleryTitleBar() {
  return (
    <Spec id="titlebar-states" title="Title bar: active and inactive, rest, hover, press, close" when="Use a title bar to show whether a window is active. Compare the title and buttons in active and inactive windows, including rest, hover, and press states and the close button's hover treatment. The demo draws Windows caption buttons (button). A round Linux window button (window button), on the main window and the settings window, keeps the title ink in every state; its cells are in the states grid, and the settings window specimen shows it in place.">
      <Stage variant="solo" eager style={STAGE}>
        {WINDOWS.map((w) => (
          <div key={w.label} style={{ width: "100%", minWidth: 0 }}>
            <div style={{ marginBottom: "var(--tasty-space-xs)", fontFamily: "var(--tasty-font-mono)", fontSize: "var(--tasty-font-size-caption)", color: "var(--tasty-text-secondary)" }}>{w.label}: rest, hover, press, close</div>
            <Band w={w}>
              {["rest", "hover", "press"].map((s) => <CaptionCell key={s} w={w} state={s} />)}
              <CloseCell w={w} />
            </Band>
          </div>
        ))}
      </Stage>
      <Meta
        specs={[["height", "--tasty-titlebar-height"], ["caption cell", "titlebar-caption-width by titlebar-height"], ["glyph", "icon-size-xs 12"], ["title", "body, ellipsis at the right end"], ["Linux window button", "--tasty-titlebar-window-button-size"], ["Linux glyph extent", "--tasty-titlebar-window-glyph-size"]]}
        tokens={[
          { tok: "--tasty-titlebar-bg", use: "active ground, crust", color: "var(--tasty-titlebar-bg)" },
          { tok: "--tasty-titlebar-bg-inactive", use: "inactive ground, mantle", color: "var(--tasty-titlebar-bg-inactive)" },
          { tok: "--tasty-titlebar-fg", use: "active title and Linux window button glyph", color: "var(--tasty-titlebar-fg)" },
          { tok: "--tasty-titlebar-fg-inactive", use: "inactive title, Windows caption button at rest, Linux window button glyph", color: "var(--tasty-titlebar-fg-inactive)" },
          { tok: "--tasty-titlebar-button-fg", use: "Windows caption button at rest, active window", color: "var(--tasty-titlebar-button-fg)" },
          { tok: "--tasty-titlebar-button-fg-hover", use: "Windows caption button under hover and press", color: "var(--tasty-titlebar-button-fg-hover)" },
          { tok: "--tasty-titlebar-close-hover-bg", use: "close fill", color: "var(--tasty-titlebar-close-hover-bg)" },
          { tok: "--tasty-titlebar-close-hover-fg", use: "close glyph", color: "var(--tasty-titlebar-close-hover-fg)" },
        ]} />
    </Spec>
  );
}

// The main window's Linux title bar as Tasty draws it (client-side decorations): the UI kit's TitlebarLinux.
// The demo follows the pointer; the frames freeze one button each, in Mocha and Latte, active and inactive.
const LINUX_STATES = [
  { key: "rest", label: "buttons at rest", states: {} },
  { key: "hover", label: "maximize under hover", states: { max: "hover" } },
  { key: "press", label: "maximize pressed", states: { max: "press" } },
  { key: "close", label: "close under hover and press", states: { close: "hover" } },
];
const LINUX_FRAMES = [];
for (const theme of ["mocha", "latte"]) {
  for (const active of [true, false]) {
    for (const st of LINUX_STATES) LINUX_FRAMES.push({ theme, active, st });
  }
}

// A frame whose close button is under the pointer marks it as a Window close button cell, so the check reads its
// glyph against the contract. The contract's one state is rest (close under the pointer); its host is the window's ground.
const closeCell = (active) => ({ close: { contract: "Window close button", state: "rest", host: active ? "crust" : "mantle" } });

function LinuxBar({ active, states, cells }) {
  return <TitlebarLinux active={active} states={states} cells={cells} title="agents-prod" />;
}

function GalleryTitleBarLinux() {
  return (
    <Spec id="titlebar-linux" title="Title bar on Linux: window buttons"
      when={<>On Linux Tasty draws the main window's title bar itself. Its minimize, maximize and close buttons are round <b>window buttons</b>: no fill at rest, the hover or press fill under the pointer, and the title ink on the glyph in every state. Close under the pointer is the Window close button. Linux has no restore glyph.</>}>
      <Stage variant="solo" style={{ ...STAGE, background: "var(--tasty-bg-app)" }}>
        {[true, false].map((active) => (
          <div key={String(active)} style={{ width: "100%", minWidth: 0 }}>
            <div style={{ marginBottom: "var(--tasty-space-xs)", fontFamily: "var(--tasty-font-mono)", fontSize: "var(--tasty-font-size-caption)", color: "var(--tasty-text-secondary)" }}>{active ? "Active" : "Inactive"}</div>
            <LinuxBar active={active} />
          </div>
        ))}
      </Stage>
      <Views>
        {LINUX_FRAMES.map(({ theme, active, st }) => {
          const name = `titlebar-linux-${theme}-${active ? "active" : "inactive"}-${st.key}`;
          const label = `${theme === "mocha" ? "Mocha" : "Latte"}, ${active ? "active" : "inactive"}, ${st.label}`;
          return (
            <View key={name} name={name} label={label} wide>
              <div data-theme={theme} inert="" style={{ padding: "var(--tasty-space-sm)", background: "var(--tasty-bg-app)", pointerEvents: "none" }}>
                <LinuxBar active={active} states={st.states} cells={st.states.close ? closeCell(active) : undefined} />
              </div>
            </View>
          );
        })}
      </Views>
      <Meta
        specs={[["height", "--tasty-titlebar-height"], ["window button, round", "--tasty-titlebar-window-button-size"], ["glyph extent, 1px stroke", "--tasty-titlebar-window-glyph-size"], ["glyphs", "windowMinimize · windowMaximize · close"], ["button gap", "--tasty-space-xs"], ["padding-x", "--tasty-space-sm"]]}
        tokens={[
          { tok: "--tasty-titlebar-fg", use: "window button glyph, active", color: "var(--tasty-titlebar-fg)" },
          { tok: "--tasty-titlebar-fg-inactive", use: "window button glyph, inactive", color: "var(--tasty-titlebar-fg-inactive)" },
          { tok: "--tasty-titlebar-button-hover-bg", use: "window button fill on hover", color: "var(--tasty-titlebar-button-hover-bg)" },
          { tok: "--tasty-titlebar-button-active-bg", use: "window button fill on press", color: "var(--tasty-titlebar-button-active-bg)" },
          { tok: "--tasty-titlebar-close-hover-bg", use: "close fill under the pointer", color: "var(--tasty-titlebar-close-hover-bg)" },
          { tok: "--tasty-titlebar-close-hover-fg", use: "close glyph under the pointer", color: "var(--tasty-titlebar-close-hover-fg)" },
        ]} />
      <Note>The buttons read the window button part of the Title bar and Title bar (inactive) contracts and the Window close button contract, whose cells are in the states grid above. The settings window's Linux title bar draws the same close button.</Note>
    </Spec>
  );
}

// The main window's Windows title bar as the UI kit draws it: TitlebarWindows. The states grid above paints the
// contract cells with tokens; this specimen renders the kit itself, so its own selectors are what the check reads,
// including an inactive window under the pointer.
const WIN_STATES = [
  { key: "rest", label: "buttons at rest", states: {} },
  { key: "hover", label: "minimize under hover", states: { min: "hover" } },
  { key: "press", label: "minimize pressed", states: { min: "press" } },
  { key: "close", label: "close under hover", states: { close: "hover" } },
  { key: "close-press", label: "close pressed", states: { close: "press" } },
  // A maximized window shows the restore glyph on the middle button (the app picks it from the maximized state).
  { key: "maximized", label: "maximized, restore glyph at rest", states: {}, maximized: true },
];
const WIN_FRAMES = [];
for (const theme of ["mocha", "latte"]) {
  for (const active of [true, false]) {
    for (const st of WIN_STATES) WIN_FRAMES.push({ theme, active, st });
  }
}

function GalleryTitleBarWindows() {
  return (
    <Spec id="titlebar-windows" title="Title bar on Windows: caption buttons"
      when={<>The Windows title bar with its three caption buttons, from the UI kit. At rest a button takes the caption ink, <b>titlebar-fg-inactive</b> in an inactive window. Under the pointer, in an active or an inactive window, the glyph takes the hover ink and the cell the hover fill; press changes only the fill. Close under the pointer is the Window close button.</>}>
      <Stage variant="solo" style={{ ...STAGE, background: "var(--tasty-bg-app)" }}>
        {[true, false].map((active) => (
          <div key={String(active)} style={{ width: "100%", minWidth: 0 }}>
            <div style={{ marginBottom: "var(--tasty-space-xs)", fontFamily: "var(--tasty-font-mono)", fontSize: "var(--tasty-font-size-caption)", color: "var(--tasty-text-secondary)" }}>{active ? "Active" : "Inactive"}</div>
            <TitlebarWindows active={active} />
          </div>
        ))}
      </Stage>
      <Views>
        {WIN_FRAMES.map(({ theme, active, st }) => {
          const name = `titlebar-windows-${theme}-${active ? "active" : "inactive"}-${st.key}`;
          const label = `${theme === "mocha" ? "Mocha" : "Latte"}, ${active ? "active" : "inactive"}, ${st.label}`;
          return (
            <View key={name} name={name} label={label} wide>
              <div data-theme={theme} inert="" style={{ padding: "var(--tasty-space-sm)", background: "var(--tasty-bg-app)", pointerEvents: "none", overflowX: "auto" }}>
                <TitlebarWindows active={active} states={st.states} maximized={!!st.maximized} cells={st.states.close ? closeCell(active) : undefined} />
              </div>
            </View>
          );
        })}
      </Views>
      <Meta
        specs={[["height", "--tasty-titlebar-height"], ["caption cell width", "--tasty-titlebar-caption-width"], ["glyph", "--tasty-icon-size-xs"]]}
        tokens={[
          { tok: "--tasty-titlebar-button-fg", use: "caption glyph at rest, active", color: "var(--tasty-titlebar-button-fg)" },
          { tok: "--tasty-titlebar-fg-inactive", use: "caption glyph at rest, inactive", color: "var(--tasty-titlebar-fg-inactive)" },
          { tok: "--tasty-titlebar-button-fg-hover", use: "caption glyph under hover and press, active or inactive", color: "var(--tasty-titlebar-button-fg-hover)" },
          { tok: "--tasty-titlebar-button-hover-bg", use: "caption fill on hover", color: "var(--tasty-titlebar-button-hover-bg)" },
          { tok: "--tasty-titlebar-button-active-bg", use: "caption fill on press", color: "var(--tasty-titlebar-button-active-bg)" },
          { tok: "--tasty-titlebar-close-hover-bg", use: "close fill under the pointer", color: "var(--tasty-titlebar-close-hover-bg)" },
          { tok: "--tasty-titlebar-close-hover-fg", use: "close glyph under the pointer", color: "var(--tasty-titlebar-close-hover-fg)" },
        ]} />
      <Note>The buttons read the button part of the Title bar and Title bar (inactive) contracts and the Window close button contract, whose cells are in the states grid above.</Note>
    </Spec>
  );
}

export { GalleryTitleBar, GalleryTitleBarLinux, GalleryTitleBarWindows };

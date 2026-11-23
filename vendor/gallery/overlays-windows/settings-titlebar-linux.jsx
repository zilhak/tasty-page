import React from "react";
import { Spec, Stage, Views, View, Meta, Note, Dont } from "../parts/specimen.jsx";
import { SettingsWindow as Kit_SettingsWindow } from "../../ui_kits/terminal/overlays/settings_window.jsx";

// Settings window on Linux — the client-drawn title bar above the L1 band (2026-11-24).
// The demo is the settings kit with os="linux". The frames crop the same kit to the title bar
// and the L1 band, in Mocha and Latte, active and inactive, close at rest and under the pointer.
const noop = () => {};

const CROP = {
  width: "100%", minWidth: 0, overflowX: "auto", overflowY: "hidden", flex: "none",
  height: "calc(var(--tasty-titlebar-height) + var(--tasty-size-44) + var(--tasty-border-width))",
};

function Crop({ theme, active, close }) {
  return (
    <div data-theme={theme} style={{ ...CROP, background: "var(--tasty-bg-app)" }}>
      <Kit_SettingsWindow os="linux" frame="bare" windowActive={active} closeState={close}
        initialL1="Appearance" initialL2="Theme" theme={theme} onTheme={noop} uiScale={1} onUiScale={noop} onClose={noop} />
    </div>
  );
}

const FRAMES = [];
for (const theme of ["mocha", "latte"]) {
  for (const active of [true, false]) {
    for (const close of ["rest", "hover"]) {
      FRAMES.push({ theme, active, close });
    }
  }
}

function SettingsTitleBarLinuxSpec() {
  return (
    <Spec id="settings-titlebar-linux" title="Settings window on Linux — title bar"
      when={<>On Linux the settings window drops the OS decoration and draws its own title bar above the L1 band, the way the main window does. The row is the window's drag area and holds one button, <b>close</b>, at the right end. It shows no title: the L1 band's <b>Settings</b> label names the window, the same on every OS. The window grows by the row, so the 1100 × 700 below it does not change. When the compositor forces its own decorations, the row is not drawn.</>}>
      <Stage variant="solo" style={{ padding: "var(--tasty-space-lg)", background: "var(--tasty-bg-app)", overflowX: "auto" }}>
        <Kit_SettingsWindow os="linux" frame="bare" theme="mocha" onTheme={noop} uiScale={1} onUiScale={noop} onClose={noop} />
      </Stage>
      <Views>
        {FRAMES.map(({ theme, active, close }) => {
          const name = `settings-titlebar-linux-${theme}-${active ? "active" : "inactive"}-close-${close}`;
          const label = `${theme === "mocha" ? "Mocha" : "Latte"}, ${active ? "active" : "inactive"}, close ${close === "rest" ? "at rest" : "under hover and press"}`;
          return (
            <View key={name} name={name} label={label} wide>
              <Crop theme={theme} active={active} close={close} />
            </View>
          );
        })}
      </Views>
      <Meta
        specs={[
          ["window", "settings-window-width × settings-window-csd-height (1100 × 736), inner and minimum, off the UI scale"],
          ["title bar", "titlebar-height 36 · 1px titlebar-border below · padding-x space-sm 8"],
          ["title", "none — the L1 band keeps its Settings label and divider"],
          ["buttons", "close only, right end · titlebar-window-button-size 24, round · close X titlebar-window-glyph-size 10.56, 1px stroke, centered on the 36 row"],
          ["drag", "the rest of the row moves the window · double click does nothing (no maximize)"],
          ["server-side decorations", "no row · settings-window-height 700"],
          ["below", "L1 band 44, L2 sidebar, content and footer as on every OS"],
        ]}
        tokens={[
          { tok: "--tasty-titlebar-bg", use: "active ground, crust", color: "var(--tasty-titlebar-bg)" },
          { tok: "--tasty-titlebar-bg-inactive", use: "inactive ground, mantle", color: "var(--tasty-titlebar-bg-inactive)" },
          { tok: "--tasty-titlebar-border", use: "1px line above the L1 band", color: "var(--tasty-titlebar-border)" },
          { tok: "--tasty-titlebar-fg", use: "close glyph at rest, active", color: "var(--tasty-titlebar-fg)" },
          { tok: "--tasty-titlebar-fg-inactive", use: "close glyph at rest, inactive", color: "var(--tasty-titlebar-fg-inactive)" },
          { tok: "--tasty-titlebar-close-hover-bg", use: "close fill on hover and press", color: "var(--tasty-titlebar-close-hover-bg)" },
          { tok: "--tasty-titlebar-close-hover-fg", use: "close glyph on hover and press", color: "var(--tasty-titlebar-close-hover-fg)" },
          { tok: "--tasty-titlebar-window-button-size", use: "24 button" },
          { tok: "--tasty-settings-window-csd-height", use: "736 window height on Linux" },
        ]} />
      <Note>The row reads the window button part of the Title bar and Title bar (inactive) contracts and the Window close button contract, the same as the main window's Linux title bar (Layouts › Title bar). Close discards the draft, like Cancel and the settings shortcut. macOS and Windows keep the OS title bar and the 1100 × 700 window.</Note>
      <Dont><b>Don't</b> put “Settings” in the title bar as well: the L1 band already says it one row below.</Dont>
    </Spec>
  );
}

export { SettingsTitleBarLinuxSpec };

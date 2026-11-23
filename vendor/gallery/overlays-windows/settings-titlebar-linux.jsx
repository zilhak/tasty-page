import React from "react";
import { Spec, Stage, Views, View, Meta, Note, Dont } from "../parts/specimen.jsx";
import { Button } from "../../components/index.js";
import { SettingsWindow as Kit_SettingsWindow } from "../../ui_kits/terminal/overlays/settings_window.jsx";

// Settings window on Linux — the client-drawn title bar above the L1 band (2026-11-24).
// The demo is the settings kit with os="linux". The frames crop the same kit to the title bar
// and the L1 band, in Mocha and Latte, active and inactive, close at rest and under the pointer.
const noop = () => {};

const CROP = {
  width: "100%", minWidth: 0, overflowX: "auto", overflowY: "hidden", flex: "none",
  // the window's top border, the title bar and the L1 band, read from the tokens the kit draws them with
  height: "calc(var(--tasty-border-width) + var(--tasty-titlebar-height) + var(--tasty-settings-l1-height))",
};

// A frame is a picture: the window inside is inert, so it takes no pointer and no keyboard focus, and its
// close button is frozen by closeState. Only the crop itself scrolls, and it opens scrolled to its right end,
// so the close button is in view at any width; the Settings label is a scroll to the left.
function Crop({ theme, active, close }) {
  const ref = React.useRef(null);
  React.useLayoutEffect(() => {
    const el = ref.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, []);
  return (
    <div ref={ref} data-theme={theme} style={{ ...CROP, background: "var(--tasty-bg-app)" }}>
      <div inert="" style={{ width: "max-content", pointerEvents: "none" }}>
        <Kit_SettingsWindow os="linux" frame="bare" windowActive={active} closeState={close}
          initialL1="Appearance" initialL2="Theme" theme={theme} onTheme={noop} uiScale={1} onUiScale={noop} onClose={noop} />
      </div>
    </div>
  );
}

// The live demo: close closes the window, the title bar's empty area moves it, and Open settings brings it back.
// Save closes it and keeps what was changed: the same window instance comes back. The title bar close and
// Cancel close it and drop the draft: a fresh instance comes back. The kit's controls keep their own state, so
// a fresh instance starts from the kit's first values, which are the saved ones until a Save. After a Save,
// dropping a later draft also returns to the first values: the demo has no store to restore the Save from.
function Demo() {
  const [open, setOpen] = React.useState(true);
  const [instance, setInstance] = React.useState(0);
  const [last, setLast] = React.useState(null);
  const [at, setAt] = React.useState({ x: 0, y: 0 });
  const base = React.useRef(null);
  const drag = (dx, dy) => {
    if (dx === null) { base.current = null; return; }
    if (!base.current) base.current = at;
    // The window stays at or right of and below where it opened, so the title bar never leaves the stage's
    // scrollable area: the stage scrolls right and down to reach it, never up or left.
    setAt({ x: Math.max(0, base.current.x + dx), y: Math.max(0, base.current.y + dy) });
  };
  const save = () => { setLast("saved"); setOpen(false); };
  const drop = () => { setLast("dropped"); setOpen(false); setInstance((n) => n + 1); };
  return (
    <>
      {!open && (
        <div style={{ display: "flex", alignItems: "center", gap: "var(--tasty-space-md)", fontSize: "var(--tasty-font-size-body)", color: "var(--tasty-text-secondary)" }}>
          <span>{last === "saved" ? "The settings window is closed and the changes are saved." : "The settings window is closed and the draft is dropped."}</span>
          <Button variant="secondary" onClick={() => { setAt({ x: 0, y: 0 }); setOpen(true); }}>Open settings</Button>
        </div>
      )}
      {/* Kept mounted while closed, so a Save survives until the window opens again. */}
      <div style={{ display: open ? "block" : "none", transform: `translate(${at.x}px, ${at.y}px)`, flex: "none" }}>
        <Kit_SettingsWindow key={instance} os="linux" frame="bare" theme="mocha" onTheme={noop} uiScale={1} onUiScale={noop}
          onClose={drop} onSave={save} onTitleBarDrag={drag} />
      </div>
    </>
  );
}

// Hover and press look the same (Window close button fill), so one frame shows both. Keyboard focus exists
// only in an active window.
const FRAMES = [];
for (const theme of ["mocha", "latte"]) {
  for (const active of [true, false]) {
    for (const close of active ? ["rest", "hover", "focus"] : ["rest", "hover"]) {
      FRAMES.push({ theme, active, close });
    }
  }
}
const CLOSE_LABEL = { rest: "close at rest", hover: "close under hover and press", focus: "close with keyboard focus" };

function SettingsTitleBarLinuxSpec() {
  return (
    <Spec id="settings-titlebar-linux" title="Settings window on Linux — title bar"
      when={<>On Linux the settings window drops the OS decoration and draws its own title bar above the L1 band, the way the main window does. The row is the window's drag area and holds one button, <b>close</b>, at the right end. It shows no title: the L1 band's <b>Settings</b> label names the window, the same on every OS. The window grows by the row, so the 1100 × 700 below it does not change. When the compositor forces its own decorations, the row is not drawn.</>}>
      <Stage variant="solo" style={{ padding: "var(--tasty-space-lg)", background: "var(--tasty-bg-app)", overflow: "auto" }}>
        <Demo />
      </Stage>
      <Views>
        {FRAMES.map(({ theme, active, close }) => {
          const name = `settings-titlebar-linux-${theme}-${active ? "active" : "inactive"}-close-${close}`;
          const label = `${theme === "mocha" ? "Mocha" : "Latte"}, ${active ? "active" : "inactive"}, ${CLOSE_LABEL[close]}`;
          return (
            <View key={name} name={name} label={label} wide>
              <Crop theme={theme} active={active} close={close} />
            </View>
          );
        })}
      </Views>
      <Meta
        specs={[
          ["window width", "--tasty-settings-window-width"],
          ["window height, inner and minimum", "--tasty-settings-window-csd-height"],
          ["window height with OS decorations (no row)", "--tasty-settings-window-height"],
          ["title bar height", "--tasty-titlebar-height"],
          ["line below the title bar", "--tasty-border-width"],
          ["title bar padding-x", "--tasty-space-sm"],
          ["close button, round", "--tasty-titlebar-window-button-size"],
          ["close X span, 1px stroke", "--tasty-titlebar-window-glyph-size"],
          ["L1 band below", "--tasty-settings-l1-height"],
          ["title", "none — the L1 band keeps its Settings label and divider"],
          ["buttons", "close only, right end, centered on the title bar"],
          ["drag", "the rest of the row moves the window · double click does nothing (no maximize)"],
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

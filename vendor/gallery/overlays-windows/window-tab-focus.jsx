import React from "react";
import { Spec, Meta, Views, View } from "../parts/specimen.jsx";
import { mirrorPseudoStates } from "../parts/state-grid.jsx";
import { RemoteFrame, RemoteFormFrame } from "../parts/overlay-frames.jsx";
import { SettingsWindow as Kit_SettingsWindow } from "../../ui_kits/terminal/overlays/settings_window.jsx";
import { PluginsWindow as Kit_PluginsWindow } from "../../ui_kits/terminal/overlays/plugins_window.jsx";

// Keyboard focus on the tabs of the settings, remote and plugins windows. In the app these tabs take focus
// by Tab and Shift+Tab and press on Space and Enter, so each shows the control ring. The check does not
// press keys, so every frame freezes one tab in its focused state: mirrorPseudoStates copies each
// :focus-visible rule to [data-force~="focus"], and the frame sets that on the tab. The ring is the
// component's own base.css ring, not one drawn here. A frame is a picture, so the window inside is inert.

const noop = () => {};

function FocusOn({ pick, crop, children }) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    mirrorPseudoStates();
    const el = ref.current && pick(ref.current);
    if (!el) return;
    if (!el.hasAttribute("tabindex")) el.setAttribute("tabindex", "-1");
    el.setAttribute("data-force", "focus");
  });
  return (
    <div style={{ overflow: "hidden", height: crop, flex: "none", width: "max-content" }}>
      <div ref={ref} inert="" style={{ pointerEvents: "none", position: "relative" }}>{children}</div>
    </div>
  );
}

// the element whose own text (without nested counts or badges) starts with the label
const byText = (selector, label) => (root) =>
  Array.from(root.querySelectorAll(selector)).find((el) => (el.firstChild && el.firstChild.textContent || el.textContent).trim() === label);

const cap = { fontSize: "var(--tasty-font-size-caption)", color: "var(--tasty-text-muted)" };
const col = { display: "flex", flexDirection: "column", gap: "var(--tasty-space-xs)", minWidth: 0 };

// the settings window cut below its L1 band and the first L2 rows
const SETTINGS_CROP = "calc(var(--tasty-border-width) + var(--tasty-settings-l1-height) + var(--tasty-size-240))";

function WindowTabFocusSpec() {
  return (
    <Spec id="window-tabs-keyboard-focus" title="Window tabs — keyboard focus"
      when={<>The tabs inside the settings, remote and plugins windows take keyboard focus: <span className="ic">Tab</span> and <span className="ic">Shift+Tab</span> move it, <span className="ic">Space</span> and <span className="ic">Enter</span> press the tab. A focused tab shows the control ring, except the settings L1 tab, which fills its band at the top of the window and takes the ring inside its box, as the pane tab does. The pane tab strip is not one of these: it is no keyboard stop and draws no ring (Components › Tab).</>}>
      <Views>
        <View name="settings-l1-tab-focus" wide label="Settings — an L1 tab with keyboard focus (General, while Appearance is open)">
          <div style={col}><span style={cap}>settings · L1 tab</span>
            <FocusOn crop={SETTINGS_CROP} pick={byText("button", "General")}>
              <Kit_SettingsWindow frame="bare" initialL1="Appearance" initialL2="Theme" theme="mocha" onTheme={noop} uiScale={1} onUiScale={noop} onClose={noop} />
            </FocusOn></div>
        </View>
        <View name="settings-l2-row-focus" wide label="Settings — an L2 sidebar row with keyboard focus (General, while Theme is open)">
          <div style={col}><span style={cap}>settings · L2 row</span>
            <FocusOn crop={SETTINGS_CROP} pick={byText("[data-settings-l2]", "General")}>
              <Kit_SettingsWindow frame="bare" initialL1="Appearance" initialL2="Theme" theme="mocha" onTheme={noop} uiScale={1} onUiScale={noop} onClose={noop} />
            </FocusOn></div>
        </View>
        <View name="remote-tab-focus" wide label="Remote connections — a tab in the tab strip with keyboard focus (Remote profiles, while Passkeys is open)">
          <div style={col}><span style={cap}>remote · tab strip</span>
            {/* the focused tab is not next to the open one, so no part of its ring lies on the open tab's accent underline */}
            <FocusOn pick={byText("span", "Remote profiles")}><RemoteFrame tab="passkeys" /></FocusOn></div>
        </View>
        <View name="remote-segment-focus" wide label="Remote connections — a segment with keyboard focus (Direct (inline))">
          <div style={col}><span style={cap}>remote · segmented</span>
            <FocusOn pick={byText("div", "Direct (inline)")}><RemoteFormFrame variant="attach" /></FocusOn></div>
        </View>
        <View name="plugins-tab-focus" wide label="Plugins — a tab with keyboard focus (Attention, while Installed is open)">
          <div style={col}><span style={cap}>plugins · tab bar</span>
            <FocusOn crop="var(--tasty-size-120)" pick={byText("button", "Attention")}>
              {/* the kit window's own 820 x 540 box, so its scrim centers it at the top left of the crop */}
              <div style={{ position: "relative", width: 820, height: 540 }}>
                <Kit_PluginsWindow onClose={noop} onFlash={noop} onConfigure={noop} />
              </div>
            </FocusOn></div>
        </View>
      </Views>
      <Meta
        specs={[["tabs", "Settings L1 tabs and L2 rows · Remote tab strip and segments · Plugins tab bar"], ["keys", "Tab / Shift+Tab move focus · Space / Enter press"], ["focus", <>control ring: outline <span className="tok">--tasty-focus-ring-width</span> 2px · <span className="tok">--tasty-border-focus</span> · <span className="tok">--tasty-focus-ring-offset</span> 1px off the tab</>], ["settings L1 tab", <>the same 2px ring inside the tab (offset minus <span className="tok">--tasty-focus-ring-width</span>): the tab fills its band at the window's top edge</>], ["not here", "pane tab strip: no keyboard stop, no ring"]]}
        tokens={[{ tok: "--tasty-border-focus", use: "focus ring", color: "var(--tasty-border-focus)" }, { tok: "--tasty-focus-ring-width", use: "→ 2px" }, { tok: "--tasty-focus-ring-offset", use: "→ 1px" }]} />
    </Spec>
  );
}

export { WindowTabFocusSpec };

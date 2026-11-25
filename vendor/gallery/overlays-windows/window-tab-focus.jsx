import React from "react";
import { Spec, Stage, Meta, Views, View } from "../parts/specimen.jsx";
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
  // The ring is what the frame shows, so the view box that scrolls a wide window opens on it: when the ring
  // does not fit the box's visible width, the box scrolls until its far edge is in view, on first paint and
  // whenever the box changes width.
  React.useEffect(() => {
    const box = ref.current && ref.current.closest("figure") && ref.current.closest("figure").querySelector(":scope > div");
    const el = ref.current && ref.current.querySelector('[data-force~="focus"]');
    if (!box || !el) return undefined;
    const reveal = () => {
      const cs = getComputedStyle(el);
      const reach = parseFloat(cs.outlineOffset) + parseFloat(cs.outlineWidth);
      const r = el.getBoundingClientRect(), b = box.getBoundingClientRect();
      const left = b.left + box.clientLeft, right = left + box.clientWidth;
      const pad = parseFloat(getComputedStyle(box).paddingRight) || 0;
      if (r.right + reach > right) box.scrollLeft += r.right + reach - right + pad;
      else if (r.left - reach < left) box.scrollLeft -= left - (r.left - reach) + pad;
    };
    reveal();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(reveal) : null;
    if (ro) ro.observe(box);
    return () => { if (ro) ro.disconnect(); };
  }, []);
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
      when={<>The tabs inside the settings, remote and plugins windows take keyboard focus: <span className="ic">Tab</span> and <span className="ic">Shift+Tab</span> move it, <span className="ic">Space</span> and <span className="ic">Enter</span> press the tab. The settings L1 tab and every remote tab draw the 2px focus ring inside the tab at a −5px offset, with 1px of clearance from its own underline. An outer ring would lose its top edge in the settings window's top band or cross the 2px gap and meet the adjacent remote tab's underline if that tab is open. The pane tab strip is not one of these: it is no keyboard stop and draws no ring (Components › Tab).</>}>
      <Views>
        <View name="settings-l1-tab-focus" wide label="Settings — an L1 tab with keyboard focus (General, while Appearance is open)">
          <div style={col}><span className="g-cap" style={cap}>settings · L1 tab</span>
            <FocusOn crop={SETTINGS_CROP} pick={byText("button", "General")}>
              <Kit_SettingsWindow frame="bare" initialL1="Appearance" initialL2="Theme" theme="mocha" onTheme={noop} uiScale={1} onUiScale={noop} onClose={noop} />
            </FocusOn></div>
        </View>
        <View name="settings-l1-selected-tab-focus" wide label="Settings — the selected L1 tab with keyboard focus (Appearance, while Appearance is open)">
          <div style={col}><span className="g-cap" style={cap}>settings · selected L1 tab</span>
            <FocusOn crop={SETTINGS_CROP} pick={byText("button", "Appearance")}>
              <Kit_SettingsWindow frame="bare" initialL1="Appearance" initialL2="Theme" theme="mocha" onTheme={noop} uiScale={1} onUiScale={noop} onClose={noop} />
            </FocusOn></div>
        </View>
        <View name="settings-l2-row-focus" wide label="Settings — an L2 sidebar row with keyboard focus (General, while Theme is open)">
          <div style={col}><span className="g-cap" style={cap}>settings · L2 row</span>
            <FocusOn crop={SETTINGS_CROP} pick={byText("[data-settings-l2]", "General")}>
              <Kit_SettingsWindow frame="bare" initialL1="Appearance" initialL2="Theme" theme="mocha" onTheme={noop} uiScale={1} onUiScale={noop} onClose={noop} />
            </FocusOn></div>
        </View>
        <View name="remote-tab-focus" wide label="Remote connections — a tab in the tab strip with keyboard focus (Remote profiles, while Passkeys is open)">
          <div style={col}><span className="g-cap" style={cap}>remote · tab strip</span>
            <FocusOn pick={byText("span", "Remote profiles")}><RemoteFrame tab="passkeys" /></FocusOn></div>
        </View>
        <View name="remote-tab-next-to-selected-focus" wide label="Remote connections — the tab next to the open one with keyboard focus (Passkeys, while Attach is open)">
          <div style={col}><span className="g-cap" style={cap}>remote · tab next to the open one</span>
            <FocusOn pick={byText("span", "Passkeys")}><RemoteFrame tab="attach" /></FocusOn></div>
        </View>
        <View name="remote-selected-tab-focus" wide label="Remote connections — the open tab with keyboard focus (Attach, while Attach is open)">
          <div style={col}><span className="g-cap" style={cap}>remote · selected tab</span>
            <FocusOn pick={byText("span", "Attach")}><RemoteFrame tab="attach" /></FocusOn></div>
        </View>
        <View name="remote-segment-focus" wide label="Remote connections — a segment with keyboard focus (Direct (inline))">
          <div style={col}><span className="g-cap" style={cap}>remote · segmented</span>
            <FocusOn pick={byText("div", "Direct (inline)")}><RemoteFormFrame variant="attach" /></FocusOn></div>
        </View>
        <View name="plugins-tab-focus" wide label="Plugins — a tab with keyboard focus (Attention, while Installed is open)">
          <div style={col}><span className="g-cap" style={cap}>plugins · tab bar</span>
            <FocusOn crop="var(--tasty-size-120)" pick={byText("button", "Attention")}>
              {/* the kit window's own 880 x 560 box, so its scrim centers it at the top left of the crop */}
              <div style={{ position: "relative", width: "var(--tasty-plugins-window-width)", height: "var(--tasty-plugins-window-height)" }}>
                <Kit_PluginsWindow onClose={noop} onFlash={noop} onConfigure={noop} />
              </div>
            </FocusOn></div>
        </View>
      </Views>
      <Meta
        specs={[["tabs", "Settings L1 tabs and L2 rows · Remote tab strip and segments · Plugins tab bar"], ["keys", "Tab / Shift+Tab move focus · Space / Enter press"], ["focus", <>control ring: outline <span className="tok">--tasty-focus-ring-width</span> 2px · <span className="tok">--tasty-border-focus</span> · <span className="tok">--tasty-focus-ring-offset</span> 1px off the tab</>], ["settings L1 tab", <>the same 2px ring inside the tab: the tab fills its band at the window's top edge · offset minus (2 × <span className="tok">--tasty-focus-ring-width</span> + <span className="tok">--tasty-focus-ring-offset</span>) = −5, so the ring clears the 2px active underline by 1px on every tab</>], ["remote tab", <>the same 2px ring inside the tab, at the settings L1 tab's −5 offset: the tabs stand 2px apart, and a ring 1px off one tab would reach 1px into the next and meet its accent underline · inside, it stays on its own tab and clears its own underline by 1px</>], ["plugins tab", <>the same ring: the tabs sit side by side on the header's mantle and only the selected one is filled (raised, 1px border-default), so the ring lies on mantle and reads <span className="tok">--tasty-border-focus</span> (RULES focus-ring)</>], ["not here", "pane tab strip: no keyboard stop, no ring"]]}
        tokens={[{ tok: "--tasty-border-focus", use: "focus ring", color: "var(--tasty-border-focus)" }, { tok: "--tasty-focus-ring-width", use: "→ 2px" }, { tok: "--tasty-focus-ring-offset", use: "→ 1px" }]} />
    </Spec>
  );
}

// The plugins window's header tabs under the pointer. The stage holds the live kit window cut below its header, so
// hovering a tab there shows the fill. The check does not hover, so each frame pins it with the kit's hoverTab.
// In the live crop only the three header tabs take the pointer and keyboard: the rest of the window, cut or not, is
// inert, so Tab cycles through the tabs and never scrolls the crop to a control below its edge.
const PLUGIN_TABS = ["Installed", "Attention", "Add plugin"];
function inertAllBut(node, keep) {
  for (const child of Array.from(node.children)) {
    if (keep.includes(child)) continue;
    if (keep.some((k) => child.contains(k))) inertAllBut(child, keep);
    else child.inert = true;
  }
}
function PluginsHeaderCrop({ hoverTab, live }) {
  const ref = React.useRef(null);
  // The window re-renders by itself when a tab is pressed, and the body it mounts again (the filter field among it)
  // would come back without inert, so the crop applies it again whenever the window's nodes change.
  React.useEffect(() => {
    const root = ref.current;
    if (!live || !root) return undefined;
    const apply = () => {
      const tabs = PLUGIN_TABS.map((l) => byText("button", l)(root)).filter(Boolean);
      if (tabs.length) inertAllBut(root, tabs);
    };
    apply();
    if (typeof MutationObserver === "undefined") return undefined;
    const mo = new MutationObserver(apply);
    mo.observe(root, { childList: true, subtree: true });
    return () => mo.disconnect();
  }, [live]);
  return (
    <div style={{ overflow: "hidden", height: "var(--tasty-size-120)", flex: "none", width: "max-content" }}>
      <div ref={ref} {...(live ? {} : { inert: "" })} style={{ position: "relative", width: "var(--tasty-plugins-window-width)", height: "var(--tasty-plugins-window-height)", pointerEvents: live ? undefined : "none" }}>
        <Kit_PluginsWindow onClose={noop} onFlash={noop} onConfigure={noop} hoverTab={hoverTab} />
      </div>
    </div>
  );
}

function PluginsTabHoverSpec() {
  return (
    <Spec id="plugins-window-header-tab-hover" title="Plugins window — header tab hover"
      when={<>Installed (with a count), Attention (with a danger badge for its count), and Add plugin sit side by side on the Plugins window header's mantle. Only the selected tab has a <span className="tok">surface-raised</span> fill and a 1px <span className="tok">border-default</span> border that stay the same on hover, while an unselected tab under the pointer takes the <span className="tok">overlay-hover</span> fill and keeps its label and count ink. You can hover a tab in the live stage, which is cropped below the header, while the two frames below pin hover on Add plugin and Attention for the gallery check.</>}>
      <Stage variant="solo" style={{ padding: "var(--tasty-space-lg)", background: "var(--tasty-bg-app)" }}>
        <div style={col}><span className="g-cap" style={cap}>live · hover a tab</span><PluginsHeaderCrop live /></div>
      </Stage>
      <Views>
        <View name="plugins-tab-hover-count" wide label="Plugins — an unselected tab under the pointer (Add plugin, while Installed is open)">
          <div style={col}><span className="g-cap" style={cap}>plugins · tab bar · hover</span><PluginsHeaderCrop hoverTab="add" /></div>
        </View>
        <View name="plugins-tab-hover-badge" wide label="Plugins — an unselected tab with its danger badge under the pointer (Attention, while Installed is open)">
          <div style={col}><span className="g-cap" style={cap}>plugins · tab bar · hover with badge</span><PluginsHeaderCrop hoverTab="attention" /></div>
        </View>
      </Views>
      <Meta
        specs={[["rest", "unselected: no fill · label text-muted"], ["hover", <>unselected: <span className="tok">--tasty-overlay-hover</span> over the header mantle · radius 4 · label and count ink unchanged</>], ["selected", "surface-raised · 1px border-default inside · label text-primary · no hover change"], ["badge", "Attention count stays the danger badge on hover"]]}
        tokens={[{ tok: "--tasty-overlay-hover", use: "hover fill" }, { tok: "--tasty-surface-raised", use: "selected tab", color: "var(--tasty-surface-raised)" }, { tok: "--tasty-text-muted", use: "unselected label", color: "var(--tasty-text-muted)" }]} />
    </Spec>
  );
}

export { WindowTabFocusSpec, PluginsTabHoverSpec };

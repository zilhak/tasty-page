import React from "react";
import { Spec, Stage, Meta, Note, Dont, Views, View } from "../parts/specimen.jsx";
import { ShellMock, CollapsedPopupButton, SearchBarFrame, GroundThemes, GroundCap } from "../parts/overlay-frames.jsx";
import { popupBorderColor, popupFocusAttr } from "../../ui_kits/terminal/overlays/shared.jsx";
import { SurfaceFocusEdge, SurfaceRing, surfaceBed } from "../../ui_kits/terminal/surface_focus.jsx";
import { ConvertSurfacePopup } from "../../ui_kits/terminal/overlays/info_modal.jsx";

// Tasty Gallery: Dialogs, which open popup holds key focus. A press outside a popup's scope never closes it and
// takes key focus to the surface it presses (closing on an outside click applies only inside the scope), so a surface popup can sit open beside the surface the user types in. The shell keeps
// its own border while it holds key focus and draws popup-border-unfocused while it does not (RULES.md "Popup focus").

const FOCUS_FRAMES = [
  ["The popup holds key focus and draws its focused border. Both surfaces are unfocused.", { scope: "surface" }],
  ["The user clicks the other surface and types there. The popup stays open with its unfocused border.", { scope: "surface", focus: "other" }],
  ["The child picker holds key focus. The parent draws its unfocused border.", { scope: "surface", child: true }],
  ["An agent opens the popup. It draws its unfocused border.", { scope: "surface", agent: true }],
  ["Window scope. The border stays the same in every focus state.", { scope: "window" }],
];

// A leaf with an anchored popup over it (no scrim, so shadow-popover). keys: "popup" while the popup holds key focus,
// "leaf" once focus is back in the leaf. The leaf paints focused only when keys go to it (RULES.md "Surface focus").
const mono = { fontFamily: "var(--tasty-font-mono)", fontSize: "var(--tasty-font-size-caption)", whiteSpace: "nowrap", overflow: "hidden" };
const LEAF_KINDS = {
  html: (f) => (
    <>
      <SurfaceFocusEdge focused={f} />
      <div style={{ ...mono, flex: "none", display: "flex", alignItems: "center", height: "var(--tasty-size-20)", padding: "0 var(--tasty-space-sm)", background: "var(--tasty-html-address-bar-bg)", color: "var(--tasty-text-secondary)" }}>example.com</div>
      <div data-audit-exempt="html-page" style={{ ...mono, flex: 1, padding: "var(--tasty-space-xs) var(--tasty-space-sm)", background: "var(--tasty-bg-panel)", color: "var(--tasty-text-muted)" }}>The page paints itself</div>
    </>
  ),
  terminal: (f) => (
    <div data-terminal-content="" style={{ ...mono, flex: 1, padding: "var(--tasty-space-xs) var(--tasty-space-sm)", background: surfaceBed(f), color: f ? "var(--tasty-surface-terminal-focused-fg)" : "var(--tasty-surface-terminal-unfocused-fg)" }}>$ cargo test</div>
  ),
};
// completed: the leaf finished a task before the popup took key focus. The completion ring stays while the popup holds
// key focus and clears in the frame key focus lands back in the leaf (RULES.md "Surface focus", Attention).
function LeafUnderPopup({ kind, keys, completed = false }) {
  const popupLit = keys === "popup";
  return (
    <div data-leaf-focus={popupLit ? "unfocused" : "focused"} style={{ position: "relative", display: "flex", flexDirection: "column", width: "var(--tasty-size-240)", height: "var(--tasty-size-112)", overflow: "hidden", border: "var(--tasty-border-width) solid var(--tasty-border-default)", borderRadius: "var(--tasty-radius)" }}>
      {LEAF_KINDS[kind](!popupLit)}
      {completed && popupLit && <SurfaceRing token="surface-highlight-done-border" width="surface-highlight-done-width" />}
      <div {...popupFocusAttr(popupLit)} style={{ position: "absolute", top: "var(--tasty-size-28)", right: "var(--tasty-space-sm)", width: "var(--tasty-size-140)", overflow: "hidden", padding: "var(--tasty-popup-content-margin)", display: "flex", flexDirection: "column", gap: "var(--tasty-space-xs)", background: "var(--tasty-bg-panel)", border: `var(--tasty-border-width) solid ${popupBorderColor(popupLit)}`, borderRadius: "var(--tasty-radius)", boxShadow: "var(--tasty-shadow-popover)" }}>
        <span style={{ fontSize: "var(--tasty-font-size-caption)", fontWeight: "var(--tasty-font-weight-semibold)", color: "var(--tasty-text-primary)" }}>Plugin popover</span>
        <span className="g-cap" style={{ fontSize: "var(--tasty-font-size-caption)", color: "var(--tasty-text-muted)" }}>surface scope, no scrim</span>
      </div>
    </div>
  );
}
const UNDER_POPUP = [
  ["html", "edge kind (html)"],
  ["terminal", "bed kind (terminal)"],
];

function PopupFocusSpec() {
  return (
    <Spec id="focus-an-open-popup-shows-whether-keys-go-to-it" title="Focus — an open popup shows whether keys go to it"
      when={<>A press outside a popup's scope never closes it. Key focus goes to the surface the user presses. Closing on an outside click, as convert surface declares, applies only to a press inside the scope and outside the frame. A surface, tab, pane or workspace popup stays open while the user clicks another surface and types there. Key focus is in one place. A popup that can take key focus shows it on its <b>1px border</b> when the popup appears in its own scope and its border is not its own mark. It draws <span className="tok">--tasty-popup-border-focused</span> while it holds key focus and <span className="tok">--tasty-popup-border-unfocused</span> while it does not. The host draws the border for host and plugin popups. A plugin cannot drop or recolor it. <b>Window-scope</b> popups keep their own borders in every state. Every click in the window is in their scope.</>}>
      <Stage variant="solo center" style={{ padding: 20, background: "var(--tasty-bg-app)", gap: 18, flexWrap: "wrap", alignItems: "flex-start" }}>
        {FOCUS_FRAMES.map(([label, props]) => (
          <div key={label} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div className="g-cap" style={{ fontSize: 11, color: "var(--tasty-text-muted)" }}>{label}</div>
            <ShellMock {...props} />
          </div>
        ))}
      </Stage>
      <Views>
        <View name="popup-focus-border-close-up" label="Close-up of the focused and unfocused borders in both themes">
          <GroundThemes render={() => (
            <div style={{ display: "flex", gap: "var(--tasty-space-lg)", alignItems: "flex-start", flexWrap: "wrap" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--tasty-space-xs)" }}>
                <GroundCap>Holds key focus</GroundCap>
                <CollapsedPopupButton kind="label" ring focused scrim={false} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--tasty-space-xs)" }}>
                <GroundCap>Open with focus elsewhere</GroundCap>
                <CollapsedPopupButton kind="label" focused={false} scrim={false} />
              </div>
            </div>
          )} />
        </View>
        <View name="popup-focus-border-titled-shell" label="Close-up of the focused and unfocused borders on a shell with a title bar (convert surface) in both themes">
          <GroundThemes render={() => (
            <div style={{ display: "flex", gap: "var(--tasty-space-lg)", alignItems: "flex-start", flexWrap: "wrap" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--tasty-space-xs)" }}>
                <GroundCap>Holds key focus</GroundCap>
                <ConvertSurfacePopup />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--tasty-space-xs)" }}>
                <GroundCap>Open with focus elsewhere</GroundCap>
                <ConvertSurfacePopup focused={false} />
              </div>
            </div>
          )} />
        </View>
        <View name="popup-focus-search-bar" label="Search bar focus" wide>
          <GroundThemes render={() => (
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--tasty-space-sm)", width: "var(--tasty-size-400)", maxWidth: "100%" }}>
              <GroundCap>The search bar holds key focus and draws its focused border. The field has widget focus and draws its focus edge.</GroundCap><SearchBarFrame height={48} focused />
              <GroundCap>Tab moves widget focus to a button. The button draws its keyboard focus ring and the field draws no focus edge. The bar still holds key focus and draws its focused border.</GroundCap><SearchBarFrame height={48} focused keyAt="button" />
              <GroundCap>Key focus returns to the terminal. The search bar draws its unfocused border and the terminal paints focused.</GroundCap><SearchBarFrame height={48} />
            </div>
          )} />
        </View>
        {UNDER_POPUP.map(([kind, label]) => (
          <View key={kind} name={`popup-focus-leaf-under-${kind}`} label={`the surface under a popup, ${label} — popup holds key focus, then focus back in the leaf`}>
            <GroundThemes render={() => (
              <div style={{ display: "flex", gap: "var(--tasty-space-lg)", alignItems: "flex-start", flexWrap: "wrap" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--tasty-space-xs)" }}>
                  <GroundCap>popup holds key focus · leaf unfocused</GroundCap>
                  <LeafUnderPopup kind={kind} keys="popup" />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--tasty-space-xs)" }}>
                  <GroundCap>Focus returns to the leaf. The popup draws its unfocused border.</GroundCap>
                  <LeafUnderPopup kind={kind} keys="leaf" />
                </div>
              </div>
            )} />
          </View>
        ))}
        <View name="popup-focus-leaf-under-terminal-completed" label="Completed terminal under a popup in an active OS window">
          <GroundThemes render={() => (
            <div style={{ display: "flex", gap: "var(--tasty-space-lg)", alignItems: "flex-start", flexWrap: "wrap" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--tasty-space-xs)" }}>
                <GroundCap>Popup holds key focus · ring stays, unfocused bed, no cursor</GroundCap>
                <LeafUnderPopup kind="terminal" keys="popup" completed />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--tasty-space-xs)" }}>
                <GroundCap>Key focus returns · ring clears, focused bed</GroundCap>
                <LeafUnderPopup kind="terminal" keys="leaf" completed />
              </div>
            </div>
          )} />
        </View>
      </Views>
      <Meta
        specs={[
          ["applies to", "Host and plugin popups that can take key focus, appear in their own surface, tab, pane or workspace scope and whose border is not their own mark. This includes dialog shells, the plugin popup shell, the search bar, the banner more menu and the collapsed show-button frame. Pressing the show button opens the popup over the window, where the window-scope rule applies."],
          ["focused when", "The popup or a widget inside it holds key focus in the host model. OS window activation does not set this state. A field with widget focus draws its focus edge. A button with widget focus draws its keyboard focus ring. The mark appears in the frame the popup takes key focus and updates in the frame widget focus moves inside it."],
          ["border", <>The same pair sets the 1px border for every shell whose border shows focus. <span className="tok">--tasty-popup-border-focused</span> resolves to <span className="tok">--tasty-border-frame</span>. <span className="tok">--tasty-popup-border-unfocused</span> resolves to <span className="tok">--tasty-border-default</span>. The pair replaces the shell's own border token. A focused dialog keeps its look. The focused plugin shell, search bar and banner more menu draw a stronger edge than their own border tokens give them.</>],
          ["layout", "Only the border color changes. The border stays 1px and nothing moves."],
          ["unfocused", <>The shell draws <span className="tok">--tasty-popup-border-unfocused</span>. This puts the border two ramp steps closer to the fill, darker in Mocha and lighter in Latte. The border equals the fill on the search bar and banner more menu. The fill against what is under the shell gives it its outline. The fill, shadow, scrim and content stay the same. Nothing dims because a user still reads the popup.</>],
          ["one focus", <>At most one shell draws <span className="tok">--tasty-popup-border-focused</span> or one surface draws its focused bed or edge. Every other shell whose border shows focus draws <span className="tok">--tasty-popup-border-unfocused</span>. When a child takes key focus, its parent draws <span className="tok">--tasty-popup-border-unfocused</span> if the parent's border shows focus. A parent shown over the window keeps its own border. Every surface paints unfocused while a popup holds key focus. A focused surface bed or edge means no popup holds key focus.</>],
          ["the surface under it", "While the popup holds key focus, the surface paints its unfocused bed or edge, with or without a scrim. Completion and needs-input highlights stay. Needs input shows over occupancy, and occupancy hides the completion ring. A terminal draws no cursor, and mesh, webview and plugin surfaces are told they lost focus. When key focus returns (on close or a click into the surface), the surface paints focused and a terminal can draw its cursor in that frame. A hard-occupied bed kind keeps its unfocused paint, and a hard-occupied terminal draws no cursor. An edge kind lights its edge even under hard occupancy. Focus notifications report that the surface has focus in the same frame regardless of occupancy. Highlights clear in that frame if the OS window is active and the surface is free of hard occupancy. Passive popups such as agent-opened popups, context menus, Select and autocomplete lists, and tooltips do not change any focus behavior."],
          ["passive (agent-opened)", <>A popup that an agent opens holds no key focus and draws no ring until the user gives it focus. While it is passive, it draws <span className="tok">--tasty-popup-border-unfocused</span> if its border shows focus.</>],
          ["scrim", "The scrim keeps its value in both focus states. It marks the scope the popup covers, where a click still goes to the popup."],
          ["window scope", <>A window-scope popup, a popup shown over the window and a child it opens there keep their own borders in every focus state. Every click in the window is in scope, so the popup holds focus while open or is passive. While one of these popups holds key focus, every surface paints unfocused and every shell whose border shows focus draws <span className="tok">--tasty-popup-border-unfocused</span>. The scrim over the whole window and the popup above it show where keys go.</>],
          ["not on the border", <>Window-scope popups, popups shown over the window and their children there keep their own border tokens. So do passive menus and lists that never take key focus, including the context menu, Select list, autocomplete list and tooltip. In the file picker's remote border mode, the <span className="tok">--tasty-accent-info</span> border and 2px info strip mark the remote state in every focus state. These shells draw no unfocused border value and stay out of the One focus count of borders.</>],
          ["motion", "The border color changes in the frame focus changes, with no motion."],
          ["contrast", "Both border values read the role border-frame, grade none, on the dialog and raised fills. The fill, shadow and content identify the popup. Neither border has a contrast target. The state rule requires an OKLab ΔE of at least 0.08 between the two values. The pair measures 0.153 · 0.099, with WCAG 2 contrast of 1.88 · 1.40. Against the dialog fill, contrast is 2.46 · 1.91 focused and 1.30 · 1.37 unfocused. Against the raised fill, contrast is 1.88 · 1.40 focused and 1.00 · 1.00 unfocused. Measurements use 8-bit values and are in Mocha · Latte order."],
        ]}
        tokens={[
          { tok: "--tasty-popup-border-focused", use: "The border of a shell that shows focus while it holds key focus.", color: "var(--tasty-popup-border-focused)" },
          { tok: "--tasty-popup-border-unfocused", use: "The border of a shell that shows focus while it has no key focus.", color: "var(--tasty-popup-border-unfocused)" },
          { tok: "--tasty-bg-panel", use: "The dialog fill in both focus states.", color: "var(--tasty-bg-panel)" },
          { tok: "--tasty-surface-raised", use: "The search bar and banner more menu fill in both focus states.", color: "var(--tasty-surface-raised)" },
          { tok: "--tasty-scrim-bg", use: "The scrim in both focus states.", color: "var(--tasty-scrim-bg)" },
        ]} />
      <Note>The popup border changes color on the surface ramp. All surfaces paint unfocused while a popup holds key focus. The control with widget focus draws its field focus edge or blue keyboard focus ring on top of the border. The markdown open, large file, convert, file picker, explorer name conflict and Properties specimens show the popup holding key focus. Where the border shows focus, it draws <span className="tok">--tasty-popup-border-focused</span>. The search bar specimens show both border states.</Note>
      <Dont><b>Don't</b> dim or fade an unfocused popup, lighten its scrim, or add a second unfocused color. The user still reads it, and a click inside its scope still goes to it.</Dont>
    </Spec>
  );
}

export { PopupFocusSpec };

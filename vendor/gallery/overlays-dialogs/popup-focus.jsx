import React from "react";
import { Spec, Stage, Meta, Note, Dont, Views, View } from "../parts/specimen.jsx";
import { ShellMock, CollapsedPopupButton, GroundThemes, GroundCap } from "../parts/overlay-frames.jsx";
import { popupBorderColor, popupFocusAttr } from "../../ui_kits/terminal/overlays/shared.jsx";
import { SurfaceFocusEdge, SurfaceRing, surfaceBed } from "../../ui_kits/terminal/surface_focus.jsx";
import { ConvertSurfacePopup } from "../../ui_kits/terminal/overlays/info_modal.jsx";

// Tasty Gallery: Dialogs, which open popup holds key focus. A press outside a popup's scope never closes it and
// takes key focus to the surface it presses (closing on an outside click applies only inside the scope), so a surface popup can sit open beside the surface the user types in. The shell keeps
// its own border while it holds key focus and draws popup-border-unfocused while it does not (RULES.md "Popup focus").

const FOCUS_FRAMES = [
  ["The popup holds key focus. Both surfaces are unfocused.", { scope: "surface" }],
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
      when={<>A press outside a popup's scope never closes it. Key focus goes to the surface the user presses. Closing on an outside click, as convert surface declares, applies only to a press inside the scope and outside the frame. So a <b>surface</b> popup (or a tab, pane or workspace one) stays open while the user clicks the next surface and types there. Key focus is in one place. The shell shows whether keys go to the popup with its <b>1px border</b>. While it holds key focus, it draws its own border. Unfocused, it draws <span className="tok">--tasty-popup-border-unfocused</span>. The host draws the border for host and plugin popups. A plugin cannot drop or recolor it. <b>Window-scope</b> popups keep their own borders in every state. Every click in the window is in their scope.</>}>
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
          ["applies to", "Host and plugin popups scoped to a surface, tab, pane or workspace. This includes the collapsed show-button frame and the search bar. Pressing the show button opens the popup over the window, where the window-scope rule applies."],
          ["focused when", "The popup or a widget inside it holds key focus in the host model. OS window activation does not set this state."],
          ["border", <>The 1px shell border uses <span className="tok">--tasty-border-frame</span> for a focused dialog and <span className="tok">--tasty-search-bar-border</span> for a focused search bar. In the file picker's remote border mode, the <span className="tok">--tasty-accent-info</span> border and 2px info strip stay in both focus states.</>],
          ["layout", "Only the border color changes. The border stays 1px and nothing moves."],
          ["unfocused", <>The shell draws <span className="tok">--tasty-popup-border-unfocused</span>, which resolves to <span className="tok">--tasty-border-default</span>. It is one step toward the fill, darker in Mocha and lighter in Latte. The search bar's border equals its own fill in this state, so the fill against the surface under it gives the bar its outline. The fill, shadow, scrim and content stay the same. Nothing dims because a user still reads the popup.</>],
          ["one focus", <>At most one popup's border or one surface's bed or edge shows focus. A focused child leaves its parent with <span className="tok">--tasty-popup-border-unfocused</span>. A focused surface keeps its own focused bed or edge, and the popup beside it draws <span className="tok">--tasty-popup-border-unfocused</span>. While a popup holds key focus in window scope, every surface and every popup scoped narrower than the window is unfocused.</>],
          ["the surface under it", "While the popup holds key focus, the surface paints its unfocused bed or edge, with or without a scrim. Completion and needs-input highlights stay. Needs input shows over occupancy, and occupancy hides the completion ring. A terminal draws no cursor, and mesh, webview and plugin surfaces are told they lost focus. When key focus returns (on close or a click into the surface), the surface paints focused and a terminal can draw its cursor in that frame. A hard-occupied bed kind keeps its unfocused paint, and a hard-occupied terminal draws no cursor. An edge kind lights its edge even under hard occupancy. Focus notifications report that the surface has focus in the same frame regardless of occupancy. Highlights clear in that frame if the OS window is active and the surface is free of hard occupancy. Passive popups such as agent-opened popups, context menus, Select and autocomplete lists, and tooltips do not change any focus behavior."],
          ["passive (agent-opened)", <>A popup scoped narrower than the window draws <span className="tok">--tasty-popup-border-unfocused</span> and no ring until the user gives it key focus.</>],
          ["scrim", "The scrim keeps its value in both focus states. It marks the scope the popup covers, where a click still goes to the popup."],
          ["window scope", "A window-scope popup, a popup shown over the window and a child it opens there keep their own border in every focus state. Every click in the window is in scope, so the popup holds focus while open or is passive. While one of these popups holds key focus, every surface is unfocused and no scoped popup shows focus. The scrim over the whole window and the popup above it show where keys go."],
          ["motion", "The border color changes in the frame focus changes, with no motion."],
          ["contrast", "The shell borders read the role border-frame, grade none. The fill, shadow and content identify the popup. In Mocha · Latte order, the dialog border pair has OKLab ΔE 0.153 · 0.099 and WCAG 2 contrast 1.88 · 1.40. Against the dialog fill, contrast is 2.46 · 1.91 focused and 1.30 · 1.37 unfocused. The search bar border pair has ΔE 0.0797 · 0.049. Both are below 0.08, so the search field's focus edge gives a second cue while the bar holds key focus."],
        ]}
        tokens={[
          { tok: "--tasty-border-frame", use: "The focused dialog border", color: "var(--tasty-border-frame)" },
          { tok: "--tasty-search-bar-border", use: "The focused search bar border", color: "var(--tasty-search-bar-border)" },
          { tok: "--tasty-popup-border-unfocused", use: "The unfocused shell border. It resolves to --tasty-border-default.", color: "var(--tasty-popup-border-unfocused)" },
          { tok: "--tasty-bg-panel", use: "The dialog fill in both focus states", color: "var(--tasty-bg-panel)" },
          { tok: "--tasty-scrim-bg", use: "The scrim in both focus states", color: "var(--tasty-scrim-bg)" },
        ]} />
      <Note>The popup border uses the neutral ramp. A control inside the popup can still show its blue keyboard focus ring on top. The markdown open, large file, convert, file picker, explorer name conflict and Properties specimens show the popup holding key focus, so they draw <span className="tok">--tasty-border-frame</span>. The search bar specimens show both states.</Note>
      <Dont><b>Don't</b> dim or fade an unfocused popup, lighten its scrim, or add a second unfocused color. The user still reads it, and a click inside its scope still goes to it.</Dont>
    </Spec>
  );
}

export { PopupFocusSpec };

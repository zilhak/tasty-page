import React from "react";
import { Spec, Stage, Meta, Note, Dont, Views, View } from "../parts/specimen.jsx";
import { ShellMock, CollapsedPopupButton, GroundThemes, GroundCap } from "../parts/overlay-frames.jsx";
import { PopupFocusEdge } from "../../ui_kits/terminal/overlays/shared.jsx";
import { SurfaceFocusEdge, surfaceBed } from "../../ui_kits/terminal/surface_focus.jsx";

// Tasty Gallery: Dialogs, which open popup holds key focus. A click outside a popup's scope leaves it open, unless it
// is declared to close on an outside click, and takes key focus to the surface it presses, so a surface popup can sit open beside the surface the user types in. The shell lights the
// popup focus edge while it holds key focus (RULES.md "Popup focus").

const FOCUS_FRAMES = [
  ["popup holds key focus — edge lit, both surfaces unfocused", { scope: "surface" }],
  ["the user clicked the other surface and types there — popup open, unlit", { scope: "surface", focus: "other" }],
  ["parent + child picker — the child holds focus, the parent is unlit", { scope: "surface", child: true }],
  ["opened by an agent (passive) — no focus, unlit", { scope: "surface", agent: true }],
  ["window scope — no edge in any state", { scope: "window" }],
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
    <div style={{ ...mono, flex: 1, padding: "var(--tasty-space-xs) var(--tasty-space-sm)", background: surfaceBed(f), color: f ? "var(--tasty-surface-terminal-focused-fg)" : "var(--tasty-surface-terminal-unfocused-fg)" }}>$ cargo test</div>
  ),
};
function LeafUnderPopup({ kind, keys }) {
  const popupLit = keys === "popup";
  return (
    <div data-leaf-focus={popupLit ? "unfocused" : "focused"} style={{ position: "relative", display: "flex", flexDirection: "column", width: "var(--tasty-size-240)", height: "var(--tasty-size-112)", overflow: "hidden", border: "var(--tasty-border-width) solid var(--tasty-border-default)", borderRadius: "var(--tasty-radius)" }}>
      {LEAF_KINDS[kind](!popupLit)}
      <div style={{ position: "absolute", top: "var(--tasty-size-28)", right: "var(--tasty-space-sm)", width: "var(--tasty-size-140)", overflow: "hidden", padding: "var(--tasty-popup-content-margin)", display: "flex", flexDirection: "column", gap: "var(--tasty-space-xs)", background: "var(--tasty-bg-panel)", border: "var(--tasty-border-width) solid var(--tasty-border-frame)", borderRadius: "var(--tasty-radius)", boxShadow: "var(--tasty-shadow-popover)" }}>
        <PopupFocusEdge lit={popupLit} />
        <span style={{ fontSize: "var(--tasty-font-size-caption)", fontWeight: "var(--tasty-font-weight-semibold)", color: "var(--tasty-text-primary)" }}>Plugin popover</span>
        <span style={{ fontSize: "var(--tasty-font-size-caption)", color: "var(--tasty-text-muted)" }}>surface scope, no scrim</span>
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
      when={<>A click outside a popup's scope does not close it, unless the popup is declared to close on an outside click (convert surface), and key focus goes to the surface it presses. So a <b>surface</b> popup (or a tab, pane or workspace one) stays open while the user clicks the next surface and types there. Key focus is in one place, and the popup's shell says whether it is that place: while it holds key focus it lights a <b>2px neutral bar across the top of its frame</b>, the same signal as the surface focus edge on an html or plugin leaf. Unfocused, the frame is what it always was. The shell draws the bar, so host and plugin popups read the same, and a plugin cannot drop it. <b>Window-scope</b> popups draw none: every click in the window is in their scope.</>}>
      <Stage variant="solo center" style={{ padding: 20, background: "var(--tasty-bg-app)", gap: 18, flexWrap: "wrap", alignItems: "flex-start" }}>
        {FOCUS_FRAMES.map(([label, props]) => (
          <div key={label} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ fontSize: 11, color: "var(--tasty-text-muted)" }}>{label}</div>
            <ShellMock {...props} />
          </div>
        ))}
      </Stage>
      <Views>
        <View name="popup-focus-edge-close-up" label="close-up — the frame, lit and unlit, in both themes">
          <GroundThemes render={() => (
            <div style={{ display: "flex", gap: "var(--tasty-space-lg)", alignItems: "flex-start", flexWrap: "wrap" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--tasty-space-xs)" }}>
                <GroundCap>holds key focus</GroundCap>
                <CollapsedPopupButton kind="label" ring edge scrim={false} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--tasty-space-xs)" }}>
                <GroundCap>open, focus elsewhere</GroundCap>
                <CollapsedPopupButton kind="label" edge={false} scrim={false} />
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
                  <GroundCap>focus back in the leaf · popup unlit</GroundCap>
                  <LeafUnderPopup kind={kind} keys="leaf" />
                </div>
              </div>
            )} />
          </View>
        ))}
      </Views>
      <Meta
        specs={[
          ["applies to", "every popup whose scope is narrower than the window: surface, tab, pane, workspace · host and plugin popups alike · the collapsed show-button frame and the search bar too · not a collapsed popup once pressed: it is shown over the window in window scope and blocks the other surfaces, so it draws none"],
          ["lit when", "the popup (or a widget inside it) holds key focus — host model focus, not OS window activation"],
          ["bar", <><span className="tok">--tasty-popup-focus-edge-focused</span> · <span className="tok">--tasty-popup-focus-edge-width</span> 2, zoom-exempt · full width across the top, inside the 1px border, clipped by the 4 radius</>],
          ["layout", "drawn over the content margin (popup-content-margin 4 ≥ 2) — no row is reserved, nothing moves on a focus change"],
          ["unfocused", "no bar · border, fill, shadow, scrim and content unchanged · nothing dims (a user still reads it)"],
          ["one focus", "at most one thing in the window is lit: one popup's bar or one surface's bed or edge · none while a window-scope popup or one shown over the window holds key focus · a child popup takes the bar from its parent · a focused surface keeps its own focused bed or edge"],
          ["the surface under it", "unfocused while the popup holds key focus, scrim or none: a bed kind takes the unfocused bed, an edge kind the unfocused edge · lit again in the frame key focus lands back in it (popup closed, or a click into it) · a passive popup leaves it focused"],
          ["passive (agent-opened)", "unlit, no ring, until the user gives it focus"],
          ["scrim", "unchanged by focus — it marks the scope the popup covers (a click there still goes to the popup), not where keys go"],
          ["window scope", "no bar — in scope everywhere, so focused while open, or passive · while it holds key focus every surface is unfocused, so nothing in the window is lit · the same for a popup shown over the window and its child"],
          ["motion", "none — the bar appears and goes in the frame focus changes"],
          ["contrast", "role glyph, grade 3 · on base 9.26 Mocha · 5.53 Latte · on mantle (a title strip at the top) 9.91 · 5.14 · on raised (search bar) 7.10 · 4.05"],
        ]}
        tokens={[
          { tok: "--tasty-popup-focus-edge-focused", use: "the lit bar (text-secondary)", color: "var(--tasty-popup-focus-edge-focused)" },
          { tok: "--tasty-popup-focus-edge-width", use: "2 — hairline, zoom-exempt" },
          { tok: "--tasty-bg-panel", use: "frame fill, both states", color: "var(--tasty-bg-panel)" },
          { tok: "--tasty-border-frame", use: "frame edge, both states", color: "var(--tasty-border-frame)" },
          { tok: "--tasty-scrim-bg", use: "the same in both states", color: "var(--tasty-scrim-bg)" },
        ]} />
      <Note>The bar is the surface focus edge's own idea and value, so "keys go here" reads one way on a leaf and on a popup. It is neutral on purpose: blue is the keyboard focus ring of the control inside, which still shows on top. Specimens elsewhere that draw a surface popup's frame alone (markdown open, large file, convert, file picker, explorer name conflict and Properties) draw it holding key focus, so they show the lit bar.</Note>
      <Dont><b>Don't</b> dim or fade an unfocused popup, lighten its scrim, or add a second unfocused color. The user still reads it, and a click inside its scope still goes to it.</Dont>
    </Spec>
  );
}

export { PopupFocusSpec };

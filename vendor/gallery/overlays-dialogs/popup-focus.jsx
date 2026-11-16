import React from "react";
import { Spec, Stage, Meta, Note, Dont, Views, View } from "../parts/specimen.jsx";
import { ShellMock, CollapsedPopupButton, GroundThemes, GroundCap } from "../parts/overlay-frames.jsx";

// Tasty Gallery: Dialogs, which open popup holds key focus. A click or key outside a popup's scope leaves it open and
// does not take its focus, so a surface popup can sit open beside the surface the user types in. The shell lights the
// popup focus edge while it holds key focus (RULES.md "Popup focus").

const FOCUS_FRAMES = [
  ["popup holds key focus — edge lit", { scope: "surface" }],
  ["the user clicked the other surface and types there — popup open, unlit", { scope: "surface", focus: "other" }],
  ["parent + child picker — the child holds focus, the parent is unlit", { scope: "surface", child: true }],
  ["opened by an agent (passive) — no focus, unlit", { scope: "surface", agent: true }],
  ["window scope — no edge in any state", { scope: "window" }],
];

function PopupFocusSpec() {
  return (
    <Spec id="focus-an-open-popup-shows-whether-keys-go-to-it" title="Focus — an open popup shows whether keys go to it"
      when={<>A click or key outside a popup's scope does not close it or move its focus. So a <b>surface</b> popup (or a tab, pane or workspace one) stays open while the user clicks the next surface and types there. Key focus is in one place, and the popup's shell says whether it is that place: while it holds key focus it lights a <b>2px neutral bar across the top of its frame</b>, the same signal as the surface focus edge on an html or plugin leaf. Unfocused, the frame is what it always was. The shell draws the bar, so host and plugin popups read the same, and a plugin cannot drop it. <b>Window-scope</b> popups draw none: every click in the window is in their scope.</>}>
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
      </Views>
      <Meta
        specs={[
          ["applies to", "every popup whose scope is narrower than the window: surface, tab, pane, workspace · host and plugin popups alike · the collapsed show-button frame and the search bar too · not a surface popup shown over the window (pressed, or moved there): it is shown in window scope and blocks the other surfaces, so it draws none"],
          ["lit when", "the popup (or a widget inside it) holds key focus — host model focus, not OS window activation"],
          ["bar", <><span className="tok">--tasty-popup-focus-edge-focused</span> · <span className="tok">--tasty-popup-focus-edge-width</span> 2, zoom-exempt · full width across the top, inside the 1px border, clipped by the 4 radius</>],
          ["layout", "drawn over the content margin (popup-content-margin 4 ≥ 2) — no row is reserved, nothing moves on a focus change"],
          ["unfocused", "no bar · border, fill, shadow, scrim and content unchanged · nothing dims (a user still reads it)"],
          ["one focus", "at most one popup in the window is lit · a child popup takes the bar from its parent · a focused surface keeps its own focused bed or edge"],
          ["passive (agent-opened)", "unlit, no ring, until the user gives it focus"],
          ["scrim", "unchanged by focus — it marks the scope the popup covers (a click there still goes to the popup), not where keys go"],
          ["window scope", "no bar — in scope everywhere, so focused while open, or passive"],
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

import React from "react";
import { Toast, Icon } from "../../components/index.js";
import { ctt } from "../../ui_kits/terminal/overlays/clipboard_toast_copy.js";
import { MdPage, Tile, Frame, Host } from "./opaque-over-page.jsx";
import { Spec, Meta, Note, Views, View } from "../parts/specimen.jsx";

// Tasty Gallery — Overlays · Popups › Toast over a page that takes keys (2026-11-13)
// A copy or cut on a web or markdown page raises the common success toast on that surface. The page the user just
// copied from usually has keyboard focus, and a page that takes keys is never hidden, so today the card sits under it.
// Current states first (the second one is option D, keep as is), then options A to C. Which option ships is a user
// decision (pending); the look inside each option is set here, except the card shape in C (decided only if C is chosen).
// Dashed amber outline = a rect the host paints over the page (a hole cut out of the page). Drawn 2px outside the card.
// Dashed muted outline = where a card would be, not drawn.

const W = 400, H = 220;
const STRIP = "var(--tasty-tab-height)"; // the pane tab strip, 24
const INSET = "var(--tasty-space-md)"; // scope margin, 12
// 400 × 0.5 = 200 fits a 240 Views column (padding included), so the card corner shows without scrolling.
const ZOOM = 0.5;

function Strip({ children }) {
  return (
    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: STRIP, boxSizing: "border-box", display: "flex", alignItems: "center", gap: "var(--tasty-space-xs)", padding: "0 var(--tasty-space-sm)",
      background: "var(--tasty-bg-sidebar)", borderBottom: "var(--tasty-border-width) solid var(--tasty-border-frame)", fontSize: "var(--tasty-font-size-caption)", color: "var(--tasty-text-secondary)" }}>
      <Icon name="markdown" size="var(--tasty-icon-size-sm)" /><span>release-notes.md</span>
      {children}
    </div>
  );
}
const Body = ({ children }) => <div style={{ position: "absolute", top: STRIP, left: 0, right: 0, bottom: 0 }}>{children}</div>;
const Corner = ({ children }) => (
  <div style={{ position: "absolute", right: INSET, bottom: INSET, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "var(--tasty-space-sm)" }}>{children}</div>
);
const SLOT_EDGE = { outline: "var(--tasty-border-width) dashed var(--tasty-text-muted)", outlineOffset: "calc(-1 * var(--tasty-border-width))" };
// where the card is under the page, not drawn: the outline takes the size of the card itself (same width and height rule)
const Slot = () => (
  <div aria-hidden="true" style={{ flex: "none", display: "flex", ...SLOT_EDGE }}>
    <Toast variant="success" style={{ visibility: "hidden" }}>{ctt("toast.copied")}</Toast>
  </div>
);
// option C: the place at the right end of the tab strip, as tall as the strip and as wide as the body text
// (no card shape yet, it is open)
const StripSlot = () => (
  <div aria-hidden="true" style={{ flex: "none", height: STRIP, boxSizing: "border-box", display: "flex", alignItems: "center", padding: "0 var(--tasty-space-md)", fontSize: "var(--tasty-font-size-body)", ...SLOT_EDGE }}>
    <span style={{ visibility: "hidden" }}>{ctt("toast.copied")}</span>
  </div>
);

function Scene({ mode }) {
  if (mode === "nokey") {
    return <Frame w={W} h={H}><Strip /><Body><Tile /><Corner><Toast variant="success">{ctt("toast.copied")}</Toast></Corner></Body></Frame>;
  }
  if (mode === "key") {
    return <Frame w={W} h={H}><Strip /><Body><MdPage /><Corner><Slot /></Corner></Body></Frame>;
  }
  if (mode === "hole") {
    return <Frame w={W} h={H}><Strip /><Body><MdPage /><Corner><Host on><Toast variant="success" opaque>{ctt("toast.copied")}</Toast></Host></Corner></Body></Frame>;
  }
  if (mode === "hole-stack") {
    return (
      <Frame w={W} h={H}><Strip /><Body><MdPage /><Corner>
        <Host on><Toast variant="success" opaque>{ctt("toast.copied")}</Toast></Host>
        <Host on><Toast variant="success" opaque>{ctt("toast.cut")}</Toast></Host>
      </Corner></Body></Frame>
    );
  }
  if (mode === "overlay") {
    return <Frame w={W} h={H}><Strip /><Body><MdPage /><Corner><Toast variant="success">{ctt("toast.copied")}</Toast></Corner></Body></Frame>;
  }
  // host area: the card would move to the right end of the pane tab strip (24 tall). The Toast card is about 36 tall,
  // so it does not fit; the shape that fits the strip is decided only if C is chosen. The slot marks the place.
  return (
    <Frame w={W} h={H}>
      <Body><MdPage /></Body>
      <Strip><span style={{ flex: 1 }} /><StripSlot /></Strip>
    </Frame>
  );
}

function Pair({ mode }) {
  return (
    <div style={{ display: "flex", gap: "var(--tasty-space-md)", flexWrap: "wrap" }}>
      {["Mocha", "Latte"].map((t) => (
        <div key={t} data-theme={t.toLowerCase()} style={{ display: "flex", flexDirection: "column", gap: "var(--tasty-space-xs)", padding: "var(--tasty-space-sm)", background: "var(--tasty-bg-app)", borderRadius: "var(--tasty-radius)" }}>
          <span style={{ fontSize: "var(--tasty-font-size-caption)", color: "var(--tasty-text-muted)" }}>{t}</span>
          <div style={{ zoom: ZOOM }}><Scene mode={mode} /></div>
        </div>
      ))}
    </div>
  );
}

const VIEWS = [
  ["toast-over-page-without-keys", "nokey", "Current · page without keys: page hidden for the card's life, card on the tile (unchanged in every option)"],
  ["toast-over-page-with-keys", "key", "Current · page that takes keys = option D, keep as is: page stays, card under it (dashed: where the card is, not drawn)"],
  ["toast-over-page-option-a-hole", "hole", "Option A · hole (recommended): same corner, the card's rect is cut out of the page, square card"],
  ["toast-over-page-option-a-stack", "hole-stack", "Option A · stack: one hole per card, the page shows between cards, newest bottom"],
  ["toast-over-page-option-b-overlay-host", "overlay", "Option B · window overlay host: same corner, rounded card as on other grounds (Linux with a compositing manager only)"],
  ["toast-over-page-option-c-host-area", "host-area", "Option C · host area: the right end of the pane tab strip (dashed: the place; the card shape for a 24 row is open)"],
];

function GalleryToastOverPage() {
  return (
    <Spec id="toast-over-a-page-that-takes-keys" title="Toast over a page that takes keys"
      when={<>A copy or cut on a web or markdown page raises the same success toast as any other copy, on that surface, in its bottom-right corner. That corner is on the page, and the page the user just copied from usually takes keys. A page that takes keys is never hidden for a toast (typed keys must not be lost), so today the card sits under the page and is not seen. <b>Which option ships is a user decision and is open.</b> The options are D (keep as is, the second current frame) and A to C below, each keeping the card's position rule or the page's input in a different way. The look inside A and B is set here and holds once that option is chosen; the card shape in C is open. These options are not the popup overlay modes (transparent, opaque, hidden): if A is chosen it applies in every overlay mode.</>}>
      <Views>
        {VIEWS.map(([name, mode, label]) => (
          <View key={name} name={name} label={label}><Pair mode={mode} /></View>
        ))}
      </Views>
      <Meta
        specs={[
          ["D · keep as is", "the card stays under a page that takes keys and is not seen there; the copy on that page raises a toast nobody sees"],
          ["A · hole (recommended)", "the card's rect is cut out of the page, as the restore notice is: the host paints the card there, and a click there goes to the host, not the page, for the card's life (2 s by default). Same corner, same stack, same card. The restore notice is a long-lived card; opening and closing a hole per short-lived card (up to 5) is not measured on any OS"],
          ["A · look", "square corners (Toast opaque → webview-opaque-radius, square like an opaque-mode box), no shadow (a toast has none), rail and body unchanged · no fade: hole and card appear and leave in the same frame, so no blank rect shows during a fade"],
          ["A · stack", "one hole per card, not one for the column; the 8px gaps stay page · cap 5 and the shared corner column unchanged"],
          ["A · pointer and keys", "the pointer over the card reaches the host, so hover can keep the card as on other grounds. Open (fact check): on Linux X11 keys follow the pointer when the X focus is on an ancestor window, so with the pointer over the hole keys may go to the host, the page may stop counting as taking keys, and the hide rule would then hide it"],
          ["B · window overlay host", "the card is drawn on the host window that floats over the page and keeps its rounded corners · only Linux X11 / XWayland with a compositing manager · every other environment falls back to A"],
          ["C · host area", "the card moves to the right end of the pane tab strip (the tab strip tooltip precedent) · the page keeps every pixel and click. Open if C is chosen: the strip is 24 (tab-height) and the Toast card is about 36, so the card needs a shape that fits a 24 row; and a fallback where the pane shows no tab strip, which is A or the current rule"],
          ["OS · Linux X11 / XWayland, XFixes and SHAPE", "A: hole · B: overlay host if a compositing manager runs, else hole"],
          ["OS · macOS", "A: hole (layer mask, hit test excluded), probe only, not measured · B: hole"],
          ["OS · Windows", "A: hole (child window region) · B: hole (no overlay host)"],
          ["OS · Linux without XFixes or SHAPE", "open (P3); recommended: current rule. No hole can be cut there; a page can still be hidden, but a page that takes keys is not hidden under the input rule, so the card stays under it in A and B. C would still show it"],
          ["native Wayland", "no web page is shown, nothing to decide"],
          ["page without keys", "unchanged in every option: the page is hidden for the card's life and the card sits on the tile"],
          ["markdown copy button", "the code block button keeps its own Copied state; the toast also shows. The button answers where the click was, the toast is the common notice"],
          ["scope", "open with the option: copy and cut toasts only, or every toast whose card lands on a page that takes keys (recommended: every toast, so one rule holds)"],
        ]}
        tokens={[
          { tok: "--tasty-webview-opaque-radius", use: "A · card corners (0)" },
          { tok: "--tasty-surface-raised", use: "card", color: "var(--tasty-surface-raised)" },
          { tok: "--tasty-accent-success", use: "rail · copy and cut", color: "var(--tasty-accent-success-raised)" },
          { tok: "--tasty-tab-height", use: "C · pane tab strip (24)" },
        ]} />
      <Note><b>Why A is recommended:</b> it keeps the one position rule every toast follows, draws the same square card on Linux, macOS and Windows, and builds on the hole the restore notice already cuts. Its costs: a card-sized rect at the page's bottom-right takes no clicks while the card is up, the pointer over that rect may change where keys go on Linux (open), and holes opened and closed per card are not measured on any OS. B keeps the rounded card but runs in one environment and falls back to A in the others. C keeps the page whole but needs a new card shape for the 24 strip and a fallback where a pane shows no host area, which brings back A or the hidden card. D changes nothing and leaves the toast unseen on the page it came from.</Note>
    </Spec>
  );
}

export { GalleryToastOverPage };

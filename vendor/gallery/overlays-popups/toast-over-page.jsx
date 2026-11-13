import React from "react";
import { Toast, Icon } from "../../components/index.js";
import { ctt } from "../../ui_kits/terminal/overlays/clipboard_toast_copy.js";
import { MdPage, Tile, Frame, Host } from "./opaque-over-page.jsx";
import { Spec, Meta, Note, Views, View } from "../parts/specimen.jsx";

// Tasty Gallery — Overlays · Popups › Toast over a page that takes keys (2026-11-13, decided 2026-11-14)
// Every toast whose card lands on a web or markdown page that takes keys is drawn in a hole cut out of that page:
// same corner, same stack, square card. A page without keys is hidden for the card's life, as before. Where no hole
// can be cut (Linux without XFixes or SHAPE) the current rule holds and the card stays under the page.
// Dashed amber outline = a rect the host paints over the page (a hole cut out of the page). Drawn 2px outside the card.
// Dashed muted outline = where a card is under the page, not drawn.

const W = 400, H = 220;
const STRIP = "var(--tasty-tab-height)"; // the pane tab strip, 24
const INSET = "var(--tasty-space-md)"; // scope margin, 12
// 400 × 0.5 = 200 fits a 240 Views column (padding included), so the card corner shows without scrolling.
const ZOOM = 0.5;

function Strip() {
  return (
    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: STRIP, boxSizing: "border-box", display: "flex", alignItems: "center", gap: "var(--tasty-space-xs)", padding: "0 var(--tasty-space-sm)",
      background: "var(--tasty-bg-sidebar)", borderBottom: "var(--tasty-border-width) solid var(--tasty-border-frame)", fontSize: "var(--tasty-font-size-caption)", color: "var(--tasty-text-secondary)" }}>
      <Icon name="markdown" size="var(--tasty-icon-size-sm)" /><span>release-notes.md</span>
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

function Scene({ mode }) {
  if (mode === "nokey") {
    return <Frame w={W} h={H}><Strip /><Body><Tile /><Corner><Toast variant="success">{ctt("toast.copied")}</Toast></Corner></Body></Frame>;
  }
  if (mode === "hole-stack") {
    return (
      <Frame w={W} h={H}><Strip /><Body><MdPage /><Corner>
        <Host on><Toast variant="success" opaque>{ctt("toast.copied")}</Toast></Host>
        <Host on><Toast variant="success" opaque>{ctt("toast.cut")}</Toast></Host>
      </Corner></Body></Frame>
    );
  }
  if (mode === "nohole") {
    return <Frame w={W} h={H}><Strip /><Body><MdPage /><Corner><Slot /></Corner></Body></Frame>;
  }
  return <Frame w={W} h={H}><Strip /><Body><MdPage /><Corner><Host on><Toast variant="success" opaque>{ctt("toast.copied")}</Toast></Host></Corner></Body></Frame>;
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
  ["toast-over-page-hole", "hole", "Page that takes keys: the card's rect is cut out of the page, the host draws the card there, square"],
  ["toast-over-page-hole-stack", "hole-stack", "Stack: one hole per card, the page shows in the gaps between cards, newest bottom"],
  ["toast-over-page-without-keys", "nokey", "Page without keys (unchanged): page hidden for the card's life, card on the tile"],
  ["toast-over-page-no-hole", "nohole", "Linux without XFixes or SHAPE: no hole, the page stays and the card is under it (dashed: where the card is, not drawn)"],
];

function GalleryToastOverPage() {
  return (
    <Spec id="toast-over-a-page-that-takes-keys" title="Toast over a page that takes keys"
      when={<>Every toast whose card lands on a web or markdown page that takes keys, a copy or cut on that page included. A page that takes keys is never hidden (typed keys must not be lost), so the host cuts each card's rect out of the page as a hole and draws the card there, in the same bottom-right corner and stack as on any other ground. The rule is the same on Linux, macOS and Windows. A page without keys is still hidden for the card's life. Where no hole can be cut (Linux without XFixes or SHAPE) the current rule holds: the page stays and the card is under it. This is not one of the popup overlay modes (transparent, opaque, hidden); it applies in all of them.</>}>
      <Views>
        {VIEWS.map(([name, mode, label]) => (
          <View key={name} name={name} label={label}><Pair mode={mode} /></View>
        ))}
      </Views>
      <Meta
        specs={[
          ["scope", "every toast whose card's rect intersects a page that takes keys (not only copy and cut). Other pages under the stack follow the hide rule"],
          ["position", "unchanged: the scope's bottom-right corner, the shared corner column, newest bottom, cap 5, 8px gap"],
          ["hole", "one hole per card, the card's own rect, not one for the column · the 8px gaps between cards stay page · up to 5 holes at once · the hole opens when the card shows and closes when it leaves"],
          ["look", "square corners (Toast opaque → webview-opaque-radius, like an opaque-mode box) · no shadow (a toast has none) · rail and body unchanged · no fade: hole and card appear and leave in the same frame, so no blank rect shows"],
          ["pointer", "a click inside a hole goes to the host, not the page, for the card's life (2 s by default) · hover over the card keeps it up, as on other grounds"],
          ["keys", "the page keeps keyboard focus; a toast never takes focus"],
          ["OS · Linux X11 / XWayland with XFixes and SHAPE", "hole"],
          ["OS · macOS", "hole (layer mask, hit test excluded)"],
          ["OS · Windows", "hole (child window region)"],
          ["OS · Linux without XFixes or SHAPE", "no hole: current rule, the page that takes keys is not hidden and the card stays under it, unseen. A page without keys is still hidden"],
          ["native Wayland", "no web page is shown, nothing to apply"],
          ["markdown copy button", "the code block button keeps its own Copied state; the toast also shows. The button answers where the click was, the toast is the common notice"],
          ["for the implementing side to check · F2", "opening and closing a hole per short-lived card (up to 5 at once) without flicker, on Linux, macOS and Windows. The restore notice cuts a long-lived hole; per-card holes are not measured on any OS"],
          ["for the implementing side to check · F3", "whether a hole and its card can open and close in the same frame (no blank rect, no card under the page for a frame)"],
          ["for the implementing side to check · F4", "Linux X11: with the X focus on an ancestor window, keys follow the pointer, so with the pointer over a hole keys may go to the host and the page may stop counting as taking keys (the hide rule would then hide it). Check the key route and the takes-keys test with the pointer over a hole"],
        ]}
        tokens={[
          { tok: "--tasty-webview-opaque-radius", use: "card corners in a hole (0)" },
          { tok: "--tasty-surface-raised", use: "card", color: "var(--tasty-surface-raised)" },
          { tok: "--tasty-accent-success", use: "rail · copy and cut", color: "var(--tasty-accent-success-raised)" },
        ]} />
      <Note><b>Decided 2026-11-14.</b> The hole keeps the one position rule every toast follows and draws the same square card on all three OSes, on the hole the restore notice already cuts. The cost is accepted: a card-sized rect at the page's bottom-right takes no clicks while the card is up. Also considered and not chosen: a window overlay host with a rounded card (one Linux environment only), a place in the pane tab strip (the 24 strip does not fit the card), and keeping the card under the page.</Note>
    </Spec>
  );
}

export { GalleryToastOverPage };

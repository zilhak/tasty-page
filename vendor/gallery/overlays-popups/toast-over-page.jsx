import React from "react";
import { Toast, Icon } from "../../components/index.js";
import { ctt } from "../../ui_kits/terminal/overlays/clipboard_toast_copy.js";
import { MdPage, Tile, Frame, Host } from "./opaque-over-page.jsx";
import { Spec, Meta, Note, Views, View } from "../parts/specimen.jsx";

// Tasty Gallery — Overlays · Popups › Toast over a page that takes keys (2026-11-13)
// A copy or cut on a web or markdown page raises the common success toast on that surface. The page the user just
// copied from usually has keyboard focus, and a page that takes keys is never hidden, so today the card sits under it.
// Current states first, then three options for showing the card. Which option ships is a user decision (pending);
// the look inside each option is set here.
// Dashed amber outline = a rect the host paints over the page (a hole cut out of the page). Drawn 2px outside the card.

const W = 400, H = 220, STRIP = 28, INSET = 12;
// 400 × 0.5 = 200 fits a 240 Views column (padding included), so the card corner shows without scrolling.
const ZOOM = 0.5;

function Strip({ children }) {
  return (
    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: STRIP, boxSizing: "border-box", display: "flex", alignItems: "center", gap: 6, padding: "0 10px",
      background: "var(--tasty-bg-sidebar)", borderBottom: "var(--tasty-border-width) solid var(--tasty-border-frame)", fontSize: 12, color: "var(--tasty-text-secondary)" }}>
      <Icon name="markdown" size="var(--tasty-icon-size-sm)" /><span>release-notes.md</span>
      {children}
    </div>
  );
}
const Body = ({ children }) => <div style={{ position: "absolute", top: STRIP, left: 0, right: 0, bottom: 0 }}>{children}</div>;
const Corner = ({ children }) => (
  <div style={{ position: "absolute", right: INSET, bottom: INSET, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "var(--tasty-space-sm)" }}>{children}</div>
);
// where the card is, under the page: nothing of it is visible
const Under = () => (
  <div style={{ width: 96, height: "var(--tasty-control-height)", outline: "var(--tasty-border-width) dashed var(--tasty-text-muted)", outlineOffset: 2 }} />
);

function Scene({ mode }) {
  if (mode === "nokey") {
    return <Frame w={W} h={H}><Strip /><Body><Tile /><Corner><Toast variant="success">{ctt("toast.copied")}</Toast></Corner></Body></Frame>;
  }
  if (mode === "key") {
    return <Frame w={W} h={H}><Strip /><Body><MdPage /><Corner><Under /></Corner></Body></Frame>;
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
  // host area: the card moves to the right end of the pane tab strip, which no page covers
  return (
    <Frame w={W} h={H}>
      <Body><MdPage /></Body>
      <Strip><span style={{ flex: 1 }} /><Toast variant="success">{ctt("toast.copied")}</Toast></Strip>
    </Frame>
  );
}

function Pair({ mode }) {
  return (
    <div style={{ display: "flex", gap: "var(--tasty-space-md)", flexWrap: "wrap" }}>
      {["Mocha", "Latte"].map((t) => (
        <div key={t} data-theme={t === "Latte" ? "latte" : undefined} style={{ display: "flex", flexDirection: "column", gap: "var(--tasty-space-xs)", padding: "var(--tasty-space-sm)", background: "var(--tasty-bg-app)", borderRadius: "var(--tasty-radius)" }}>
          <span style={{ fontSize: "var(--tasty-font-size-caption)", color: "var(--tasty-text-muted)" }}>{t}</span>
          <div style={{ zoom: ZOOM }}><Scene mode={mode} /></div>
        </div>
      ))}
    </div>
  );
}

const VIEWS = [
  ["toast-over-page-without-keys", "nokey", "Current · page without keys: page hidden for the card's life, card on the tile"],
  ["toast-over-page-with-keys", "key", "Current · page that takes keys: page stays, card under it (dashed: where the card is, not drawn)"],
  ["toast-over-page-option-a-hole", "hole", "Option A · hole (recommended): same corner, the card's rect is cut out of the page, square card"],
  ["toast-over-page-option-a-stack", "hole-stack", "Option A · stack: one hole per card, the page shows between cards, newest bottom"],
  ["toast-over-page-option-b-overlay-host", "overlay", "Option B · window overlay host: same corner, card as everywhere else (Linux with a compositing manager only)"],
  ["toast-over-page-option-c-host-area", "host-area", "Option C · host area: card moves to the right end of the pane tab strip"],
];

function GalleryToastOverPage() {
  return (
    <Spec id="toast-over-a-page-that-takes-keys" title="Toast over a page that takes keys"
      when={<>A copy or cut on a web or markdown page raises the same success toast as any other copy, on that surface, in its bottom-right corner. That corner is on the page, and the page the user just copied from usually takes keys. A page that takes keys is never hidden for a toast (typed keys must not be lost), so today the card sits under the page and is not seen. <b>Which option ships is a user decision and is open.</b> Options A to C below each keep the card's position rule or the page's input in a different way; the look inside each option is set here and holds once an option is chosen.</>}>
      <Views>
        {VIEWS.map(([name, mode, label]) => (
          <View key={name} name={name} label={label}><Pair mode={mode} /></View>
        ))}
      </Views>
      <Meta
        specs={[
          ["A · hole (recommended)", "the card's rect is cut out of the page, as the restore notice is: the host paints the card there, and a click there goes to the host, not the page, for the card's life (2 s by default). Same corner, same stack, same card"],
          ["A · look", "square corners (Toast opaque → webview-opaque-radius), no shadow (a toast has none), rail and body unchanged · no fade: hole and card appear and leave in the same frame, so no blank rect shows during a fade"],
          ["A · stack", "one hole per card, not one for the column; the 8px gaps stay page · cap 5 and the shared corner column unchanged"],
          ["A · hover", "the pointer over the card reaches the host, so hover keeps the card as on any other ground"],
          ["B · window overlay host", "the card is drawn on the host window that floats over the page, rounded as everywhere else · only Linux X11 / XWayland with a compositing manager · elsewhere B falls back to A"],
          ["C · host area", "the card moves to the right end of the pane tab strip (the tab strip tooltip precedent) · the page keeps every pixel and click · needs a fallback where the pane shows no tab strip, which is A or the current rule"],
          ["OS · Linux X11 / XWayland, XFixes and SHAPE", "A: hole · B: overlay host if a compositing manager runs, else hole"],
          ["OS · macOS", "A: hole (layer mask, hit test excluded) · B: hole"],
          ["OS · Windows", "A: hole (child window region) · B: hole (no overlay host)"],
          ["OS · Linux without XFixes or SHAPE", "no hole and the page cannot be hidden: the card stays under the page (current rule) in every option but C"],
          ["native Wayland", "no web page is shown, nothing to decide"],
          ["page without keys", "unchanged in every option: the page is hidden for the card's life and the card sits on the tile"],
          ["markdown copy button", "the code block button keeps its own Copied state; the toast also shows. The button answers where the click was, the toast is the common notice"],
          ["scope", "open with the option: copy and cut toasts only, or every toast whose card lands on a page that takes keys (recommended: every toast, so one rule holds)"],
        ]}
        tokens={[
          { tok: "--tasty-webview-opaque-radius", use: "A · card corners (0)" },
          { tok: "--tasty-surface-raised", use: "card", color: "var(--tasty-surface-raised)" },
          { tok: "--tasty-accent-success", use: "rail · copy and cut", color: "var(--tasty-accent-success-raised)" },
        ]} />
      <Note><b>Why A is recommended:</b> it keeps the one position rule every toast follows, looks the same on Linux, macOS and Windows, and uses the mechanism the restore notice already uses on all three. Its cost is a card-sized rect at the page's bottom-right that takes no clicks while the card is up. B looks best but covers one environment and falls back to A everywhere else. C keeps the page whole but was set aside before because a pane may show no host area, and its fallback brings back A or the hidden card.</Note>
    </Spec>
  );
}

export { GalleryToastOverPage };

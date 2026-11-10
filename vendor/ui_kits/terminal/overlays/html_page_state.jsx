import React from "react";
import { Icon as PsIcon } from "../../../components/core/Icon.jsx";
import { Kbd } from "../../../components/core/Kbd.jsx";
import { Spinner } from "../../../components/feedback/Spinner.jsx";

// Webview page tile — the one host state painted in a webview's page rect (html surface, plugin webview, html mirror)
// while the page is not there. Decided 2026-11-11. Every page-rect state in the kit draws through this part:
// HtmlAddressSurfaceG (html_address_bar.jsx), HtmlSurfaceG failed (html_script_banner.jsx), the remote flow's Loading
// (html_remote_banner.jsx) and the gallery's sized chrome tiles. There is no second drawing.
//
// Size: none of its own. It fills whatever rect the host gives (flex 1). The 220 x 150 gallery tile is this part in a
// fixed frame, not a second size.
// Ground: the host's bed. The part paints no fill, no border and no shadow. The page rect has no outline: the band's
// 1px separator above is the only rule, so nothing appears or disappears when the native page replaces the tile.
//
// Layout (top to bottom, centred as one block in the rect; padding space-md on all sides):
//   glyph  icon-size-md (16) · Spinner spinner-size (16) for loading and receiving
//   gap    space-sm (8)
//   title  font-size-body, one line box = font-size-body x line-height-ui; it wraps only when the rect is narrower than it
//   gap    space-sm (8)
//   sub    ALWAYS reserved: one caption line box = font-size-caption x line-height-ui, also when the state has no sub.
//          Content is centred in that box and never grows it (the Alt+L keycap may overhang it by its own height).
// So loading -> failed, empty -> loading and receiving -> paused never move the glyph. CenterState makes the same call.
//
// Ink (ground-ink matrix, roles on the host bed):
//   glyph  glyph-dim (empty, paused, notices) · glyph-danger → accent-danger (failed) · spinner-indicator (Spinner's own)
//   title  text-muted via html-receiving-fg · text-danger → accent-danger-raised (failed)
//   sub    text-muted · mono for a URL or byte count
// boundary: the bare bed, no glyph or text (an egui overlay hides a loaded page).

const PS_COPY = {
  emptyTitle: "No page loaded",
  emptyHint: "Type a path or URL in the address bar",
  loading: "Loading…",
  failed: "Failed to load",
  receiving: "Receiving remote files…",
  paused: "Paused — answer the notice above",
  macos: "Remote web pages can't be shown on this macOS version.",
  macosSub: "A newer version of macOS is required.",
  disconnected: "Disconnected from the remote",
  disconnectedSub: "Reconnect to load this page.",
};

const SUB_LINE = "calc(var(--tasty-font-size-caption) * var(--tasty-line-height-ui))";

function HaCenter({ glyph, glyphColor = "var(--tasty-html-receiving-glyph)", spin, title, titleColor = "var(--tasty-html-receiving-fg)", sub, mono }) {
  return (
    <div style={{ flex: 1, minHeight: 0, minWidth: 0, display: "flex", alignItems: "center", justifyContent: "center", padding: "var(--tasty-space-md)" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--tasty-space-sm)", maxWidth: "100%", minWidth: 0, textAlign: "center" }}>
        <span style={{ display: "inline-flex", height: "var(--tasty-icon-size-md)", color: glyphColor }}>{spin ? <Spinner /> : <PsIcon name={glyph} size="var(--tasty-icon-size-md)" />}</span>
        <span style={{ fontSize: "var(--tasty-font-size-body)", lineHeight: "var(--tasty-line-height-ui)", color: titleColor }}>{title}</span>
        <span style={{ display: "flex", alignItems: "center", justifyContent: "center", height: SUB_LINE, maxWidth: "100%", minWidth: 0, overflow: "visible" }}>
          {sub && <span style={{ fontFamily: mono ? "var(--tasty-font-mono)" : "var(--tasty-font-ui)", fontSize: "var(--tasty-font-size-caption)", lineHeight: "var(--tasty-line-height-ui)", color: "var(--tasty-text-muted)", maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sub}</span>}
        </span>
      </div>
    </div>
  );
}

// kind: boundary | empty | loading | failed | receiving | paused | macos | disconnected
// hint: the empty tab's address hint (+ Alt+L). Only a surface with an address band has one; without it the slot stays empty.
// emptyGlyph: the empty state's glyph (html on html surfaces).
function HtmlPageState({ kind = "empty", progress = "1.4 MB · 12 files", url, hint = true, emptyGlyph = "html" }) {
  switch (kind) {
    case "boundary": return <div style={{ flex: 1, minHeight: 0 }} />;
    case "empty": return <HaCenter glyph={emptyGlyph} glyphColor="var(--tasty-glyph-dim)" title={PS_COPY.emptyTitle} sub={hint ? <span style={{ display: "inline-flex", alignItems: "center", gap: "var(--tasty-space-xs)" }}>{PS_COPY.emptyHint} · <Kbd keys={["Alt", "L"]} /></span> : null} />;
    case "loading": return <HaCenter spin title={PS_COPY.loading} />;
    case "failed": return <HaCenter glyph="alertCircle" glyphColor="var(--tasty-accent-danger)" title={PS_COPY.failed} titleColor="var(--tasty-accent-danger-raised)" sub={url} mono />;
    case "receiving": return <HaCenter spin title={PS_COPY.receiving} sub={progress} mono />;
    case "paused": return <HaCenter glyph="download" title={PS_COPY.receiving} sub={PS_COPY.paused} />;
    case "macos": return <HaCenter glyph="info" title={PS_COPY.macos} sub={PS_COPY.macosSub} />;
    case "disconnected": return <HaCenter glyph="remote" title={PS_COPY.disconnected} sub={PS_COPY.disconnectedSub} />;
    default: return null;
  }
}

export { HtmlPageState, PS_COPY };

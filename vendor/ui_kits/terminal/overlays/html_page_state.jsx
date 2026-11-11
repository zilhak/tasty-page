import React from "react";
import { Icon as PsIcon } from "../../../components/core/Icon.jsx";
import { Kbd } from "../../../components/core/Kbd.jsx";
import { Spinner } from "../../../components/feedback/Spinner.jsx";
import { dbt } from "./display_backend_copy.js";

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
// Display-backend notices (2026-11-11): native-wayland, native-wayland-x, gdk-backend. The webview could not be
// created for the life of this Tasty process, so the tile never changes state again until Tasty restarts. Title =
// what is off + the cause, sub = the fix. The fix must be read in full, so for these kinds only:
//   title  wraps, balanced lines (text-wrap balance); breaks inside a long identifier only when it must
//   sub    caption, wraps the same way, NEVER ellipsis. The reserved caption box is its minimum and it grows by
//          whole caption lines. Moving the glyph is allowed here because no other state follows in the same rect.
//   block  centred while it fits; when it does not, it starts at the top padding and the rect scrolls vertically
//          (the standard scrollbar, class tasty-scroll), so nothing is clipped: the glyph and the cause show first and the fix is
//          a scroll away. Measured 2026-11-11: at 220 x 150 the cause 2 text (en, ja) and cause 1b (ja) run 13-31 px
//          over, and at 160 wide every cause does, so clipping would hide the fix.
// Glyph info in glyph-dim; title and sub text-muted: the same inks as macos, so all four beds already hold.
//
// Ink (ground-ink matrix, roles on the host bed):
//   glyph  glyph-dim (empty, paused, notices) · glyph-danger → accent-danger (failed) · spinner-indicator (Spinner's own)
//   title  text-muted · text-danger → accent-danger-raised (failed)
//   The part reads semantic tokens only, because its beds are base and crust (html, plugin webview) and term /
//   term-unfocused (markdown, which lays the tile on the focus bed). html-receiving-fg / -glyph are allowed on base and
//   crust only, so the part does not read them. glyph-dim, text-muted, accent-danger and accent-danger-raised hold on all four.
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

function HaCenter({ glyph, glyphColor = "var(--tasty-glyph-dim)", spin, title, titleColor = "var(--tasty-text-muted)", sub, mono, notice }) {
  const wrap = notice ? { textWrap: "balance", overflowWrap: "anywhere" } : null;
  return (
    <div data-page-notice={notice ? "" : undefined} className={notice ? "tasty-scroll" : undefined} style={{ flex: 1, minHeight: 0, minWidth: 0, display: "flex", alignItems: "center", justifyContent: "center", padding: "var(--tasty-space-md)", ...(notice ? { overflowX: "hidden", overflowY: "auto" } : null) }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--tasty-space-sm)", maxWidth: "100%", minWidth: 0, textAlign: "center", ...(notice ? { margin: "auto 0" } : null) }}>
        <span style={{ flex: "none", display: "inline-flex", height: "var(--tasty-icon-size-md)", color: glyphColor }}>{spin ? <Spinner /> : <PsIcon name={glyph} size="var(--tasty-icon-size-md)" />}</span>
        <span style={{ fontSize: "var(--tasty-font-size-body)", lineHeight: "var(--tasty-line-height-ui)", color: titleColor, ...wrap }}>{title}</span>
        <span style={{ display: "flex", alignItems: "center", justifyContent: "center", ...(notice ? { minHeight: SUB_LINE } : { height: SUB_LINE }), maxWidth: "100%", minWidth: 0, overflow: "visible" }}>
          {sub && <span style={{ fontFamily: mono ? "var(--tasty-font-mono)" : "var(--tasty-font-ui)", fontSize: "var(--tasty-font-size-caption)", lineHeight: "var(--tasty-line-height-ui)", color: "var(--tasty-text-muted)", maxWidth: "100%", ...(notice ? wrap : { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }) }}>{sub}</span>}
        </span>
      </div>
    </div>
  );
}

// Display-backend notice kind -> copy key (display_backend_copy.js, four languages by Codex). The fix is key + "_sub".
const DB_NOTICE = { "native-wayland": "webview.native_wayland", "native-wayland-x": "webview.native_wayland_x_failed", "gdk-backend": "webview.gdk_backend" };

// kind: boundary | empty | loading | failed | receiving | paused | macos | disconnected
//       | native-wayland | native-wayland-x | gdk-backend (display-backend notices: html, markdown and html mirror alike)
// hint: the empty tab's address hint (+ Alt+L). Only a surface with an address band has one; without it the slot stays empty.
// lang: the notices' language. The other kinds are en only, as the gallery is.
function HtmlPageState({ kind = "empty", progress = "1.4 MB · 12 files", url, hint = true, lang = "en" }) {
  const db = DB_NOTICE[kind];
  if (db) return <HaCenter notice glyph="info" title={dbt(db, lang)} sub={dbt(`${db}_sub`, lang)} />;
  switch (kind) {
    case "boundary": return <div style={{ flex: 1, minHeight: 0 }} />;
    case "empty": return <HaCenter glyph="html" title={PS_COPY.emptyTitle} sub={hint ? <span style={{ display: "inline-flex", alignItems: "center", gap: "var(--tasty-space-xs)" }}>{PS_COPY.emptyHint} · <Kbd keys={["Alt", "L"]} /></span> : null} />;
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

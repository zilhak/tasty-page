import React from "react";
import { Button } from "../../../components/core/Button.jsx";
import { Icon as HsIcon } from "../../../components/core/Icon.jsx";
import { IconButton } from "../../../components/core/IconButton.jsx";
import { Spinner } from "../../../components/feedback/Spinner.jsx";
import { Tooltip } from "../../../components/feedback/Tooltip.jsx";
import { HtmlPageState } from "./html_page_state.jsx";

// HTML surface — script-blocked notice (INSET banner) + tab-strip marker.
// Designed 2026-09-28.
//
// Placement ⒜: tasty paints the banner; the surface's WebView rect shrinks by
// banner height + --tasty-banner-inset-gap. The banner never overlaps the page.
// Box boundaries for the implementer: shell (BannerShell) > row [glyph | body | action]
// + dismiss slot (absolute, top-right). Narrow: when the SURFACE width is below
// --tasty-banner-narrow-below (440), the action wraps under the body, aligned to the
// body's left edge. Re-judged on every surface resize, no animation. Content never
// overrides the threshold. The title and body wrap and never clamp, so the row grows with the copy.
// Button on the shell: Secondary reads the banner-button tokens via [data-surface="banner"]
// (surface-hover fill · border-frame edge · hover = the usual overlay). Applies to every banner.
//
// Fires only when the USER views the document (opened it, or selected the surface).
// Agent/IPC opens, session restore and background tabs only record "has scripts".




const HS_COPY = {
  title: "Scripts in this document are blocked",
  body: "Buttons and menus that need JavaScript may not respond. Allowing applies to this document only, until Tasty restarts.",
  // 2026-11-01: shown only while the remote-content notice is also up (remote scripts need both allows).
  bodyRemote: "Buttons and menus that need JavaScript may not respond. Allowing applies to this document only, until Tasty restarts. Scripts inside it run; scripts from the network also need remote content allowed.",
  action: "Allow for this document",
  reloading: "Reloading with scripts allowed",
  actionLoading: "Available when loading finishes",
  markerBlocked: "Scripts blocked. Click to show the notice again.",
  markerAllowed: "Scripts allowed for this document until Tasty restarts",
  // 2026-11-10 — top-level http(s) page (`web`, see html_remote_banner.jsx). Same shell, glyph and states; copy only.
  // Tasty does not read the page, so the notice cannot know whether scripts exist: the body says "may use scripts".
  // Shown only after remote content is allowed, so it never needs bodyRemote. reloading, actionLoading, markerBlocked are shared.
  titleWeb: "Scripts on this page are blocked",
  bodyWeb: "This page may use scripts; buttons and menus that need JavaScript may not respond. Allowing applies only to this showing of the page; reloading asks again.",
  actionWeb: "Allow scripts on this page",
  markerAllowedWeb: "Scripts allowed for this showing of the page; reloading blocks them again",
};

// state: "blocked" | "loading" | "reloading"
//   loading (2026-09-29) = still blocked, but the surface is loading a new document (response
//   received, not yet committed). Allow is bound to the COMMITTED document's URL + fingerprint,
//   so it is disabled (standard disabled ink, no opacity) from load start until commit — no delay,
//   no grace period: a delay would reopen the window it closes. The flip is an ink change only.
//   Tooltip on the disabled button (top): HS_COPY.actionLoading. × stays available (hover).
//   After commit: new document still has scripts → back to "blocked" (enabled); none → banner goes.
//   web (2026-11-10): no fingerprint; the allow is bound to this showing of the page (see html_remote_banner.jsx).
// web: http(s) page copy (titleWeb/bodyWeb/actionWeb). tipOpen: draws the loading tooltip open (gallery frames).
function HtmlScriptBanner({ state = "blocked", remote = false, hover = false, narrow = false, web = false, tipOpen = false }) {
  const [h, setH] = React.useState(false);
  const showX = (hover || h) && (state === "blocked" || state === "loading");
  const reloading = state === "reloading";
  const actionLabel = web ? HS_COPY.actionWeb : HS_COPY.action;
  const action = reloading ? (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "var(--tasty-space-sm)", height: "var(--tasty-button-height-sm)", fontSize: "var(--tasty-banner-body-font-size)", color: "var(--tasty-banner-body-fg)", whiteSpace: "nowrap" }}>
      <Spinner size="var(--tasty-icon-size-sm)" />{HS_COPY.reloading}
    </span>
  ) : state === "loading" ? (
    <Tooltip placement="top" open={tipOpen} content={HS_COPY.actionLoading}>
      <span style={{ display: "inline-flex" }}><Button size="sm" variant="secondary" disabled style={{ whiteSpace: "nowrap" }}>{actionLabel}</Button></span>
    </Tooltip>
  ) : (
    <Button size="sm" variant="secondary" style={{ whiteSpace: "nowrap" }}>{actionLabel}</Button>
  );
  const body = web ? HS_COPY.bodyWeb : remote ? HS_COPY.bodyRemote : HS_COPY.body;
  return (
    <div data-surface="banner" onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)} style={{ position: "relative",
      background: "var(--tasty-banner-bg)", color: "var(--tasty-banner-fg)", border: "var(--tasty-border-width) solid var(--tasty-banner-border)",
      borderRadius: "var(--tasty-banner-radius)", boxShadow: "var(--tasty-banner-shadow)" }}>
      <div style={{ display: "flex", flexWrap: narrow ? "wrap" : "nowrap", alignItems: narrow ? "flex-start" : "center", gap: "var(--tasty-banner-gap)",
        padding: "var(--tasty-banner-padding-y) var(--tasty-banner-padding-x)",
        paddingRight: "calc(var(--tasty-icon-button-size-sm) + var(--tasty-space-sm) + var(--tasty-space-xs))" }}>
        <span style={{ display: "inline-flex", flex: "none", alignSelf: "flex-start", marginTop: "var(--tasty-banner-glyph-offset)", color: "var(--tasty-html-script-banner-glyph)" }}>
          <HsIcon name="lock" size="var(--tasty-icon-size-md)" />
        </span>
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "var(--tasty-banner-text-gap)" }}>
          <div style={{ fontSize: "var(--tasty-banner-title-font-size)", fontWeight: "var(--tasty-font-weight-semibold)", lineHeight: "var(--tasty-line-height-ui)", textWrap: "pretty" }}>{web ? HS_COPY.titleWeb : HS_COPY.title}</div>
          <div style={{ fontSize: "var(--tasty-banner-body-font-size)", lineHeight: "var(--tasty-line-height-ui)", color: "var(--tasty-banner-body-fg)", textWrap: "pretty" }}>{body}</div>
        </div>
        <span style={{ flex: "none", display: "flex", marginLeft: narrow ? "calc(var(--tasty-icon-size-md) + var(--tasty-banner-gap))" : 0, width: narrow ? "100%" : "auto" }}>{action}</span>
      </div>
      <span style={{ position: "absolute", top: "var(--tasty-banner-padding-y)", right: "var(--tasty-space-sm)", display: "flex",
        opacity: showX ? 1 : 0, transition: "opacity var(--tasty-banner-fade) var(--tasty-ease-ui)" }}>
        <IconButton size="sm" aria-label="Dismiss"><HsIcon name="close" /></IconButton>
      </span>
    </div>
  );
}

// the tab-strip marker: lock (blocked + notice dismissed) · scriptFile (allowed this session)
// the tab-strip marker: lock (blocked + notice dismissed) · scriptFile (allowed this session).
// Sits in the tab cell's RIGHT CLUSTER (Layouts › Pane tab strip): marker · move · busy · close,
// --tasty-tab-status-gap apart. lock = 16 hit cell with its own hover; scriptFile = tooltip only.
// Tooltip placement (2026-09-29): TOP. Tab-strip / pane-head tooltips never open down into the
// content rect — a native WebView there is drawn above egui and would hide the bubble.
// web (2026-11-10): the allowed tooltip reads markerAllowedWeb; glyphs and inks are shared.
function HtmlScriptMarker({ kind = "blocked", hover = false, web = false, open = false }) {
  const allowed = kind === "allowed";
  const [h, setH] = React.useState(false);
  const label = allowed ? (web ? HS_COPY.markerAllowedWeb : HS_COPY.markerAllowed) : HS_COPY.markerBlocked;
  return (
    <Tooltip placement="top" open={open} content={label}>
    <span role={allowed ? "img" : "button"}
      aria-label={label}
      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ display: "inline-flex", flex: "none", alignItems: "center", justifyContent: "center",
        width: "var(--tasty-html-script-marker-hit)", height: "var(--tasty-html-script-marker-hit)", borderRadius: "var(--tasty-radius-sm)",
        cursor: allowed ? "default" : "pointer", background: !allowed && (hover || h) ? "var(--tasty-html-script-marker-hover-bg)" : "transparent",
        color: allowed ? "var(--tasty-html-script-marker-allowed-fg)" : "var(--tasty-html-script-marker-fg)" }}>
      <HsIcon name={allowed ? "scriptFile" : "lock"} size="var(--tasty-html-script-marker-size)" />
    </span>
    </Tooltip>
  );
}

function HsTab({ label, icon, active, marker, markerWeb = false, markerOpen = false }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "var(--tasty-tab-gap)", height: "var(--tasty-control-height-tab)",
      padding: "0 var(--tasty-space-xs) 0 var(--tasty-tab-padding-x)", width: "var(--tasty-tab-width)", fontSize: "var(--tasty-font-size-caption)", borderRight: "var(--tasty-border-width) solid var(--tasty-separator)",
      background: active ? "var(--tasty-bg-panel)" : "transparent", color: active ? "var(--tasty-text-primary)" : "var(--tasty-text-muted)",
      boxShadow: active ? "inset 0 calc(-1 * var(--tasty-tab-indicator-width)) 0 var(--tasty-accent-primary)" : "none" }}>
      <span style={{ display: "inline-flex", flex: "none" }}><HsIcon name={icon} size="var(--tasty-tab-icon-size)" /></span>
      <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>
      <span style={{ flex: "none", display: "inline-flex", alignItems: "center", gap: "var(--tasty-tab-status-gap)" }}>
        {marker && <HtmlScriptMarker kind={marker} web={markerWeb} open={markerOpen} />}
        <span style={{ width: "var(--tasty-tab-close-size)", height: "var(--tasty-tab-close-size)", display: "inline-flex", alignItems: "center", justifyContent: "center",
          color: "var(--tasty-text-muted)", visibility: active ? "visible" : "hidden" }}><HsIcon name="close" size="var(--tasty-icon-size-xs)" /></span>
      </span>
    </span>
  );
}

// the page the WebView draws — a neutral stand-in, not tasty chrome
function HsPage({ label = "report.html" }) {
  return (
    <div style={{ flex: 1, minHeight: 0, background: "var(--tasty-surface-terminal-focused-bg)", padding: "var(--tasty-space-md)", display: "flex", flexDirection: "column", gap: "var(--tasty-space-sm)" }}>
      <span style={{ fontFamily: "var(--tasty-font-mono)", fontSize: "var(--tasty-font-size-micro)", color: "var(--tasty-text-placeholder)" }}>WebView — {label}</span>
      <span style={{ height: "var(--tasty-space-md)", width: "60%", background: "var(--tasty-surface-raised)", borderRadius: "var(--tasty-radius-sm)" }} />
      <span style={{ height: "var(--tasty-space-sm)", width: "85%", background: "var(--tasty-surface-raised)", borderRadius: "var(--tasty-radius-sm)" }} />
      <span style={{ height: "var(--tasty-space-sm)", width: "70%", background: "var(--tasty-surface-raised)", borderRadius: "var(--tasty-radius-sm)" }} />
    </div>
  );
}

// one HTML surface: tab strip → [inset banner] → WebView rect
// failed (2026-10-06): the document never committed (web process died / load error). The host chrome's
// failure state replaces the page. DECISION: in this state there is NO script banner and NO tab lock / script
// marker — both describe a document that is not there, and Allow would allow nothing. A reload that commits
// re-derives banner + marker from the new document. (Passing banner/marker with failed draws the old, wrong mix.)
// The failure state itself is the shared webview page tile (html_page_state.jsx, kind failed).
function HsFailed({ url = "file:///Users/me/report.html" }) {
  return <HtmlPageState kind="failed" url={url} />;
}
function HtmlSurfaceG({ banner = "blocked", marker = null, remote = false, hover = false, narrow = false, width, height = 260, label = "report.html", failed = false }) {
  return (
    <div style={{ width, height, flex: width ? "none" : 1, minWidth: 0, display: "flex", flexDirection: "column", background: "var(--tasty-bg-panel)", overflow: "hidden" }}>
      <div style={{ display: "flex", flex: "none", background: "var(--tasty-bg-sidebar)", borderBottom: "var(--tasty-border-width) solid var(--tasty-separator)" }}>
        <HsTab label={label} icon="html" active marker={marker} />
      </div>
      {banner && (
        <div style={{ flex: "none", padding: "var(--tasty-banner-margin) var(--tasty-banner-margin) var(--tasty-banner-inset-gap)" }}>
          <HtmlScriptBanner state={banner} remote={remote} hover={hover} narrow={narrow} />
        </div>
      )}
      {failed ? <HsFailed /> : <HsPage />}
    </div>
  );
}

// a terminal surface next to it — never gets the banner (scope = surface)
function TermSurfaceG({ height = 260 }) {
  return (
    <div style={{ flex: 1, minWidth: 0, height, display: "flex", flexDirection: "column", background: "var(--tasty-surface-terminal-unfocused-bg)" }}>
      <div style={{ display: "flex", flex: "none", background: "var(--tasty-bg-sidebar)", borderBottom: "var(--tasty-border-width) solid var(--tasty-separator)" }}>
        <HsTab label="zsh" icon="terminal" />
      </div>
      <div style={{ padding: "var(--tasty-space-md)", fontFamily: "var(--tasty-font-mono)", fontSize: "var(--tasty-font-size-term-sm)", color: "var(--tasty-surface-terminal-unfocused-fg)" }}>~/tasty $ open report.html</div>
    </div>
  );
}

export { HtmlScriptBanner, HtmlScriptMarker, HtmlSurfaceG, TermSurfaceG, HsTab, HsPage, HS_COPY };

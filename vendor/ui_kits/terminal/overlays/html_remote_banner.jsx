import React from "react";
import { Button } from "../../../components/core/Button.jsx";
import { Icon as RcIcon } from "../../../components/core/Icon.jsx";
import { IconButton } from "../../../components/core/IconButton.jsx";
import { Spinner } from "../../../components/feedback/Spinner.jsx";
import { Tooltip } from "../../../components/feedback/Tooltip.jsx";
import { HtmlAddressBar, HtmlSizeBanner } from "./html_address_bar.jsx";
import { HsTab, HsPage, HtmlScriptBanner } from "./html_script_banner.jsx";

// HTML surface — REMOTE CONTENT blocked notice (inset banner) + address-field marker.
// Designed 2026-11-01.
//
// Same life rules as the script notice (html_script_banner.jsx): fires only when the USER views the document,
// Allow reloads once, disabled while loading, no banner/marker on a failed (uncommitted) document, none while the
// global "Allow remote content" is on.
//
// Two document kinds, one shell (2026-11-10). `web` picks the copy; box, glyph, states, marker cell are shared.
//   file (local file:// document): allow binds to the committed document (URL + content fingerprint), survives a
//     reload of the same content, cleared by another document committing or by a restart. Remote allow and script
//     allow are independent; both notices can stack.
//   web (top-level http(s) page typed into the address field): no fingerprint. Allow covers this showing only —
//     the reload Allow itself starts keeps it; the USER's reload, any navigation (same site too), Back and restart
//     clear it when that load commits, and the notice is back then, blocked (a new showing, even if it was dismissed
//     before). Until that commit the allow and its markers hold; a notice already up (before Allow) stays, loading.
//     Shown whenever the page is viewed, first at the load's commit (never before it): the static references are
//     unknown, so the notice does not wait for a blocked request.
//     Remote allow does not enable scripts. With the script sandbox on, the script notice (web copy) takes the SAME
//     slot right after the remote reload commits; the two never stack on a web page, and the script notice never
//     shows while remote is blocked (dismissing the remote notice leaves only its marker). The user's reload clears
//     both allows and starts again at the remote notice.
//
// Box boundaries: tab strip → address band [nav | field [kind glyph | address | skipped Tag | REMOTE MARKER]]
//   → inset banner stack (size → REMOTE → script, banner-inset-gap apart) → WebView rect.
// Banner = BannerShell > row [glyph globeOff | body (title + body, wrap, never clamp) | action] + dismiss slot (top-right,
//   hover). Narrow (surface < banner-narrow-below 440): action wraps under the body, body-aligned.
// Marker = 20 cell (html-remote-marker-hit) at the END of the address field. Shown when the banner is NOT:
//   blocked (dismissed, or blocked-observed with no static reference) = globeOff glyph-dim, click → banner shows
//   (never allows on its own); allowed = globe text-muted, tooltip only. Tooltip TOP.




const RC_COPY = {
  title: "Remote content in this document is blocked",
  body: "Stylesheets, images, fonts, frames and scripts from the network don't load, so the page may look incomplete. Allowing applies to this document only, until Tasty restarts.",
  action: "Allow remote content",
  reloading: "Reloading with remote content allowed",
  actionLoading: "Available when loading finishes",
  markerBlocked: "Remote content blocked. Click for details.",
  markerAllowed: "Remote content allowed for this document until Tasty restarts",
  // 2026-11-10 — top-level http(s) page (`web`). action, reloading, actionLoading, markerBlocked are shared.
  titleWeb: "Page loaded; remote content blocked",
  bodyWeb: "Stylesheets, images, fonts, frames and media from the network are blocked, so the page may look incomplete. Allowing applies only to this showing of the page; reloading blocks remote content again. Permission to run scripts is requested separately.",
  markerAllowedWeb: "Remote content allowed for this showing of the page; reloading blocks it again",
  // 2026-11-10 — web body when the script sandbox is off: no script notice exists and the page's own scripts already
  // run, so network scripts join the blocked list and the "requested separately" sentence goes. Picked by the sandbox.
  bodyWebSandboxOff: "Stylesheets, images, fonts, frames, media and scripts from the network are blocked, so the page may look incomplete. Allowing applies only to this showing of the page; reloading blocks remote content again.",
};

// state: "blocked" | "loading" | "reloading" — identical visual rules to HtmlScriptBanner.
// web: top-level http(s) page copy (titleWeb/bodyWeb). tipOpen: draws the loading tooltip open (gallery frames).
// sandboxOff (web only): the script sandbox is off → bodyWebSandboxOff. Title, action and states are unchanged.
function HtmlRemoteBanner({ state = "blocked", hover = false, narrow = false, web = false, sandboxOff = false, tipOpen = false }) {
  const [h, setH] = React.useState(false);
  const showX = (hover || h) && state !== "reloading";
  const reloading = state === "reloading";
  const action = reloading ? (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "var(--tasty-space-sm)", height: "var(--tasty-button-height-sm)", fontSize: "var(--tasty-banner-body-font-size)", color: "var(--tasty-banner-body-fg)", whiteSpace: "nowrap" }}>
      <Spinner size="var(--tasty-icon-size-sm)" />{RC_COPY.reloading}
    </span>
  ) : state === "loading" ? (
    <Tooltip placement="top" open={tipOpen} content={RC_COPY.actionLoading}>
      <span style={{ display: "inline-flex" }}><Button size="sm" variant="secondary" disabled style={{ whiteSpace: "nowrap" }}>{RC_COPY.action}</Button></span>
    </Tooltip>
  ) : (
    <Button size="sm" variant="secondary" style={{ whiteSpace: "nowrap" }}>{RC_COPY.action}</Button>
  );
  return (
    <div data-surface="banner" onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)} style={{ position: "relative",
      background: "var(--tasty-banner-bg)", color: "var(--tasty-banner-fg)", border: "var(--tasty-border-width) solid var(--tasty-banner-border)",
      borderRadius: "var(--tasty-banner-radius)", boxShadow: "var(--tasty-banner-shadow)" }}>
      <div style={{ display: "flex", flexWrap: narrow ? "wrap" : "nowrap", alignItems: narrow ? "flex-start" : "center", gap: "var(--tasty-banner-gap)",
        padding: "var(--tasty-banner-padding-y) var(--tasty-banner-padding-x)",
        paddingRight: "calc(var(--tasty-icon-button-size-sm) + var(--tasty-space-sm) + var(--tasty-space-xs))" }}>
        <span style={{ display: "inline-flex", flex: "none", alignSelf: "flex-start", marginTop: "var(--tasty-banner-glyph-offset)", color: "var(--tasty-html-remote-banner-glyph)" }}>
          <RcIcon name="globeOff" size="var(--tasty-icon-size-md)" />
        </span>
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "var(--tasty-banner-text-gap)" }}>
          <div style={{ fontSize: "var(--tasty-banner-title-font-size)", fontWeight: "var(--tasty-font-weight-semibold)", lineHeight: "var(--tasty-line-height-ui)", textWrap: "pretty" }}>{web ? RC_COPY.titleWeb : RC_COPY.title}</div>
          <div style={{ fontSize: "var(--tasty-banner-body-font-size)", lineHeight: "var(--tasty-line-height-ui)", color: "var(--tasty-banner-body-fg)", textWrap: "pretty" }}>{web ? (sandboxOff ? RC_COPY.bodyWebSandboxOff : RC_COPY.bodyWeb) : RC_COPY.body}</div>
        </div>
        <span style={{ flex: "none", display: "flex", marginLeft: narrow ? "calc(var(--tasty-icon-size-md) + var(--tasty-banner-gap))" : 0, width: narrow ? "100%" : "auto" }}>{action}</span>
      </div>
      <span style={{ position: "absolute", top: "var(--tasty-banner-padding-y)", right: "var(--tasty-space-sm)", display: "flex",
        opacity: showX ? 1 : 0, transition: "opacity var(--tasty-banner-fade) var(--tasty-ease-ui)" }}>
        <IconButton size="sm" aria-label="Dismiss"><RcIcon name="close" /></IconButton>
      </span>
    </div>
  );
}

// kind: "blocked" | "allowed" · web: allowed tooltip says "this showing" (markerAllowedWeb); glyphs and inks are shared.
function HtmlRemoteMarker({ kind = "blocked", hover = false, web = false, open = false }) {
  const allowed = kind === "allowed";
  const [h, setH] = React.useState(false);
  const label = allowed ? (web ? RC_COPY.markerAllowedWeb : RC_COPY.markerAllowed) : RC_COPY.markerBlocked;
  return (
    <Tooltip placement="top" open={open} content={label}>
      <span role={allowed ? "img" : "button"} aria-label={label} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
        style={{ display: "inline-flex", flex: "none", alignItems: "center", justifyContent: "center", marginRight: "calc(-1 * var(--tasty-space-xs))",
          width: "var(--tasty-html-remote-marker-hit)", height: "var(--tasty-html-remote-marker-hit)", borderRadius: "var(--tasty-radius-sm)",
          cursor: allowed ? "default" : "pointer", background: !allowed && (hover || h) ? "var(--tasty-html-remote-marker-hover-bg)" : "transparent",
          color: allowed ? "var(--tasty-html-remote-marker-allowed-fg)" : hover || h ? "var(--tasty-html-remote-marker-fg-hover)" : "var(--tasty-html-remote-marker-fg)" }}>
        <RcIcon name={allowed ? "globe" : "globeOff"} size="var(--tasty-html-remote-marker-size)" />
      </span>
    </Tooltip>
  );
}

// stand-in for a page whose remote stylesheet/images did not load (not tasty chrome)
function RcUnstyledPage({ label = "report.html" }) {
  const line = (w) => <span style={{ height: "var(--tasty-space-sm)", width: w, background: "var(--tasty-surface-raised)", borderRadius: "var(--tasty-radius-sm)" }} />;
  const broken = (w) => (
    <span style={{ width: w, height: "var(--tasty-size-40)", flex: "none", border: "var(--tasty-border-width) dashed var(--tasty-border-default)", borderRadius: "var(--tasty-radius-sm)",
      display: "inline-flex", alignItems: "center", justifyContent: "center", color: "var(--tasty-text-disabled)" }}><RcIcon name="image" size="var(--tasty-icon-size-sm)" /></span>
  );
  return (
    <div style={{ flex: 1, minHeight: 0, background: "var(--tasty-surface-terminal-focused-bg)", padding: "var(--tasty-space-md)", display: "flex", flexDirection: "column", gap: "var(--tasty-space-sm)" }}>
      <span style={{ fontFamily: "var(--tasty-font-mono)", fontSize: "var(--tasty-font-size-micro)", color: "var(--tasty-text-placeholder)" }}>WebView — {label} · remote CSS + images not loaded</span>
      {line("40%")}{line("92%")}
      <span style={{ display: "flex", gap: "var(--tasty-space-sm)" }}>{broken("var(--tasty-size-64)")}{broken("var(--tasty-size-64)")}</span>
      {line("75%")}
    </div>
  );
}

// Whole surface for the comparison grid.
// remote / script: banner state or null · remoteMarker: "blocked" | "allowed" | null · scriptMarker: tab marker kind or null
// size: mirror size banner on top ("file" | "limit" | null) · page: "unstyled" | "styled"
// web (2026-11-10): top-level http(s) page — `web` address field (link glyph), web copy on both notices and both
//   allowed tooltips. A web page never passes remote and script together (they take the same slot in turn).
// loading: the band's Reload shows busy (a load is in flight, not yet committed).
const RC_WEB = { label: "Getting started", address: "https://docs.example.com/guide/getting-started", page: "docs.example.com" };
// sandboxOff: the remote notice takes its sandbox-off web body.
function HtmlRemoteSurfaceG({ width, height = 300, narrow = false, remote = null, script = null, remoteMarker = null, scriptMarker = null, size = null, page = "unstyled", mirror = false, web = false, loading = false, sandboxOff = false }) {

  const stack = [
    size && <HtmlSizeBanner key="size" kind={size} narrow={narrow} />,
    remote && <HtmlRemoteBanner key="remote" state={remote} narrow={narrow} web={web} sandboxOff={sandboxOff} />,
    script && <HtmlScriptBanner key="script" state={script} remote={!!remote} narrow={narrow} web={web} />,
  ].filter(Boolean);
  const kind = web ? "web" : mirror ? "remote" : "local";
  const address = web ? RC_WEB.address : mirror ? "build-eu:~/reports/q3/report.html" : "~/reports/q3/report.html";
  return (
    <div style={{ width, height, flex: width ? "none" : 1, minWidth: 0, display: "flex", flexDirection: "column", background: "var(--tasty-bg-panel)", overflow: "hidden" }}>
      <div style={{ display: "flex", flex: "none", background: "var(--tasty-bg-sidebar)", borderBottom: "var(--tasty-border-width) solid var(--tasty-separator)" }}>
        <HsTab label={web ? RC_WEB.label : "report.html"} icon="html" active marker={scriptMarker} markerWeb={web} />
      </div>
      <HtmlAddressBar kind={kind} address={address} narrow={narrow} state={loading ? "loading" : "idle"}
        trailing={remoteMarker ? <HtmlRemoteMarker kind={remoteMarker} web={web} /> : null} />
      {stack.length > 0 && (
        <div style={{ flex: "none", display: "flex", flexDirection: "column", gap: "var(--tasty-banner-inset-gap)", padding: "var(--tasty-banner-margin) var(--tasty-banner-margin) var(--tasty-banner-inset-gap)" }}>{stack}</div>
      )}
      {page === "styled" ? <HsPage label={web ? RC_WEB.page : undefined} /> : <RcUnstyledPage label={web ? RC_WEB.page : undefined} />}
    </div>
  );
}

export { HtmlRemoteBanner, HtmlRemoteMarker, HtmlRemoteSurfaceG, RC_COPY, RC_WEB };

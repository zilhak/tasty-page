import React from "react";
import { Icon as MdI } from "../../components/core/Icon.jsx";
import { IconButton } from "../../components/core/IconButton.jsx";
import { Kbd } from "../../components/core/Kbd.jsx";
import { useFreshPress } from "../../components/core/fresh-press.js";
import { Tag } from "../../components/core/Tag.jsx";
import { StatusDot } from "../../components/feedback/StatusDot.jsx";
import { Input } from "../../components/forms/Input.jsx";
import { Tab } from "../../components/navigation/Tab.jsx";
import { ic, Icon as KIcon } from "./chrome.jsx";
import { SearchBar } from "./overlays/search_bar.jsx";
import { surfaceBed } from "./surface_focus.jsx";

// Tasty UI kit — work area (tab strip, terminal/markdown surfaces, status bar).

 // SearchBar ← overlays/search_bar.jsx


// colored terminal line helpers
const C = {
  // The kit draws these lines itself, so they read the text cells for the terminal ground. RULES.md section 15.
  blue: "var(--tasty-accent-primary-raised)", green: "var(--tasty-accent-success-raised)", mauve: "var(--tasty-accent-agent-raised)",
  yellow: "var(--tasty-accent-warning-raised)", peach: "var(--tasty-accent-attention-raised)", red: "var(--tasty-accent-danger-raised)",
  teal: "var(--tasty-accent-info-raised)", dim: "var(--tasty-text-muted)", text: "var(--tasty-text-primary)",
};
const S = (color) => (txt, key) => <span key={key} style={{ color }}>{txt}</span>;

// ── Status resolution ──────────────────────────────────────────────
// resolveStatus collapses owner×activity into the 5-color StatusDot vocabulary
// (error→waiting→running→agent→idle). This is a WORKSPACE-level signal: the
// sidebar StatusDot, port_scanner, and plugins produce these. The TAB STRIP
// does NOT — it mirrors the product surface model, which exposes one activity
// bool per surface (`busy`). So tabBusy() reduces activity to busy/idle and the
// tab draws one dot; `attached` (claimed by another client) is orthogonal.
function resolveStatus(owner, activity) {
  if (activity === "error") return "error";
  if (activity === "waiting") return "waiting";
  if (activity === "running") return "running";
  return owner === "agent" ? "agent" : "idle";
}
const tabBusy = (activity) => activity === "running" || activity === "waiting" || activity === "error";
const shouldPulse = (status) => status === "running" || status === "agent" || status === "waiting";

// focused: the pane holds key focus, and the app paints its strip raised (tab_bar/view.rs), mantle otherwise. The kit
// window has one pane and it is focused, so true is the default; a picture of an unfocused pane passes false. Each tab
// takes the same ground (Tab's ground), and the + and pane action IconButtons sit on it (IconButton on raised). The app
// draws no line under the strip (tab_bar/view.rs fills the strip and draws only the separators between and after tabs),
// so the strip ends at its own fill. A tab keeps its full width, as the app's (tab_bar/view.rs lays every tab at
// tab_width and clips the row to its viewport, which scrolls): when the tabs pass the room, the row clips them and a host
// scrolls it (scrollLeft) to show the active tab; no tab shrinks.
function TabStrip({ tabs, active, onSelect, onClose, onNew, onSearch, focused = true }) {
  const ground = focused ? "raised" : "mantle";
  return (
    <div style={{ display: "flex", alignItems: "stretch", background: focused ? "var(--tasty-tab-bg-raised)" : "var(--tasty-tab-bg)", flex: "none" }}>
      <div style={{ display: "flex", minWidth: 0, overflow: "hidden" }}>
        {tabs.map((t) => (
          <Tab key={t.id} label={t.title} icon={t.kind === "markdown" ? ic.md : ic.term}
            active={t.id === active} ground={ground} status={tabBusy(t.activity) ? "busy" : "idle"} attached={t.attached} notif={t.notif}
            style={{ flex: "none" }} onClick={() => onSelect(t.id)} onClose={() => onClose(t.id)} />
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "center", padding: "0 var(--tasty-space-sm)" }}>
        <IconButton size="sm" aria-label="New tab" onClick={onNew}>{ic.plus}</IconButton>
      </div>
      <div style={{ flex: 1 }} />
      <div style={{ display: "flex", alignItems: "center", padding: "0 var(--tasty-space-sm)", gap: "var(--tasty-size-2)" }}>
        <IconButton size="sm" aria-label="Split">{ic.split}</IconButton>
        <IconButton size="sm" aria-label="Search" onClick={onSearch}>{ic.search}</IconButton>
      </div>
    </div>
  );
}

function Prompt({ branch }) {
  return (
    <div>
      <span style={{ color: C.green }}>~/tasty</span>{" "}
      <span style={{ color: C.blue }}>{branch || "main"}</span>{" "}
      <span style={{ color: C.dim }}>via</span>{" "}
      <span style={{ color: C.peach }}>🦀 v1.84</span>
    </div>
  );
}

function TerminalPane({ session, focused, searchOpen, onSearchClose }) {
  return (
    <div style={{
      flex: 1, minWidth: 0, display: "flex", flexDirection: "column", position: "relative",
      background: focused ? "var(--tasty-surface-terminal-focused-bg)" : "var(--tasty-surface-terminal-unfocused-bg)",
      color: focused ? "var(--tasty-surface-terminal-focused-fg)" : "var(--tasty-surface-terminal-unfocused-fg)",
      fontFamily: "var(--tasty-font-mono)", fontSize: "var(--tasty-font-size-body)", lineHeight: 1.6,
      border: "var(--tasty-border-width) solid var(--tasty-separator)", borderRadius: "var(--tasty-radius)", overflow: "hidden",
    }}>
      {focused && searchOpen && (
        <SearchBar lines={session.plainLines || []} onClose={onSearchClose} />
      )}
      <div data-terminal-content="" className="tasty-scroll" style={{ padding: "var(--tasty-space-sm) var(--tasty-space-md)", overflow: "auto", flex: 1 }}>
        {session.lines.map((ln, i) => <div key={i}>{ln}</div>)}
        <div style={{ display: "flex", alignItems: "center" }}>
          <span style={{ color: C.mauve }}>❯&nbsp;</span>
          {focused && <span style={{ width: "var(--tasty-size-8)", height: "var(--tasty-size-16)", background: "var(--tasty-surface-terminal-focused-fg)",
            display: "inline-block", animation: "tasty-blink 1.1s step-end infinite" }} />}
        </div>
      </div>
    </div>
  );
}

// 2026-10-21 — address band = gallery Plugins › Markdown:
// [Folder (· Reload when remote)] gap 8 [field: kind glyph + path] gap 8 [Go]. remote = editable mirror field.
function MarkdownSurface({ focused, path = "~/work/tasty/README.md", remote = false, stale = false, children }) {

  return (
    <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column",
      background: surfaceBed(focused), color: "var(--tasty-surface-markdown-focused-fg)",
      border: "var(--tasty-border-width) solid var(--tasty-separator)", borderRadius: "var(--tasty-radius)", overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "var(--tasty-md-address-bar-gap)", height: "var(--tasty-md-address-bar-height)", flex: "none",
        padding: "0 var(--tasty-md-address-bar-padding-x)", background: "var(--tasty-md-address-bar-bg)", borderBottom: "var(--tasty-border-width) solid var(--tasty-md-address-bar-border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--tasty-md-address-bar-nav-gap)", flex: "none" }}>
          <IconButton size="sm" aria-label={remote ? "Open a remote file" : "Open a file"} title={remote ? "Open a remote file…" : "Open a file…"}><MdI name="folderOpen" /></IconButton>
          {remote && (stale
            ? <button aria-label="The remote file changed — reload" title="The remote file changed — reload" style={{ width: "var(--tasty-icon-button-size-sm)", height: "var(--tasty-icon-button-size-sm)", display: "inline-flex", alignItems: "center", justifyContent: "center", padding: 0, border: 0,
                borderRadius: "var(--tasty-icon-button-radius)", background: "var(--tasty-md-address-stale-bg)", color: "var(--tasty-md-address-stale-fg)", cursor: "pointer" }}><MdI name="refresh" /></button>
            : <IconButton size="sm" aria-label="Reload" title="Reload"><MdI name="refresh" /></IconButton>)}
        </div>
        <div style={{ flex: 1, minWidth: "var(--tasty-md-address-field-min-width)", display: "flex", alignItems: "center", gap: "var(--tasty-input-gap)", height: "var(--tasty-input-height)", boxSizing: "border-box", padding: "0 var(--tasty-space-sm)",
          background: "var(--tasty-input-bg)", border: "var(--tasty-border-width) solid var(--tasty-input-border)", borderRadius: "var(--tasty-input-radius)" }}>
          <span style={{ display: "inline-flex", flex: "none", color: "var(--tasty-input-icon-fg)" }}><MdI name={remote ? "remote" : "file"} size="var(--tasty-icon-size-sm)" /></span>
          <span style={{ flex: 1, minWidth: 0, fontFamily: "var(--tasty-font-mono)", fontSize: "var(--tasty-input-font-size)", color: "var(--tasty-text-secondary)",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", direction: "rtl", textAlign: "left" }}><bdi>{path}</bdi></span>
        </div>
        <IconButton size="sm" aria-label="Go" title="Go"><MdI name="arrowRight" /></IconButton>
      </div>
      <div className="tasty-scroll" style={{ padding: "var(--tasty-space-lg) var(--tasty-space-xl)", overflow: "auto", lineHeight: 1.6, maxWidth: 620 }}>
        {children || <>
        <h1 style={{ fontFamily: "var(--tasty-font-mono)", fontSize: "var(--tasty-font-size-prose-h1)", margin: "0 0 var(--tasty-space-xs)" }}>Tasty</h1>
        <p style={{ color: "var(--tasty-text-secondary)", fontSize: "var(--tasty-font-size-body)", margin: "0 0 var(--tasty-space-lg)" }}>
          A cross-platform, GPU-accelerated terminal emulator purpose-built for AI coding agents.</p>
        <h2 style={{ fontSize: "var(--tasty-font-size-max)", margin: "0 0 var(--tasty-space-sm)", color: "var(--tasty-accent-primary-raised)" }}>Identity</h2>
        <p style={{ fontSize: "var(--tasty-font-size-body)", color: "var(--tasty-text-secondary)", margin: 0 }}>
          User actions and agent actions are strictly separated. An agent can open and close a
          hundred surfaces without ever touching your focus, history, or selection.</p>
        </>}
      </div>
    </div>
  );
}

// paletteKeys: the palette shortcut the chip shows. A host that binds the shortcut per platform passes what it binds
// ("Cmd+K" on macOS, "Ctrl+K" elsewhere), so the chip never names a key that does not open the palette.
// It is a Kbd keys value: a chord string, or an array of keys when the host draws a key itself (the landing page draws
// the modifier for both platforms and lets the page's platform pick one, so its first paint already names the right key).
function StatusBar({ surfaceId, theme = "Mocha", onTheme, onPalette, paletteKeys = "Cmd+K" }) {
  const cell = { display: "flex", alignItems: "center", gap: "var(--tasty-space-xs)", padding: "0 var(--tasty-space-sm)", height: "100%",
    fontFamily: "var(--tasty-font-mono)", fontSize: "var(--tasty-font-size-caption)", color: "var(--tasty-text-muted)" };
  const btn = { ...cell, border: 0, background: "transparent", cursor: "pointer" };
  // The palette chip opens a popup that hands the focus back to it, so it clicks only on a new press (fresh-press.js).
  const palettePress = useFreshPress({ onClick: onPalette });
  return (
    <div style={{ display: "flex", alignItems: "center", height: "var(--tasty-control-height-tab)", flex: "none",
      background: "var(--tasty-bg-app)", borderTop: "var(--tasty-border-width) solid var(--tasty-separator)" }}>
      <div style={{ ...cell, color: "var(--tasty-accent-success-raised)" }}><span style={{ width: "var(--tasty-size-8)", height: "var(--tasty-size-8)",
        borderRadius: "var(--tasty-radius-pill)", background: "currentColor" }} /> main</div>
      <div style={cell}>{surfaceId}</div>
      <div style={cell}>bash · 80×24</div>
      <div style={{ flex: 1 }} />
      {/* right cluster (B8-J4 canonical: screenshot shows palette chip + theme toggle) */}
      <button type="button" style={btn} {...palettePress} aria-label="Command palette"
        onMouseEnter={(e) => (e.currentTarget.style.color = "var(--tasty-text-secondary)")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "var(--tasty-text-muted)")}>
        <Kbd keys={paletteKeys} /> palette
      </button>
      <button type="button" style={btn} onClick={onTheme} aria-label="Toggle theme"
        onMouseEnter={(e) => (e.currentTarget.style.color = "var(--tasty-text-secondary)")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "var(--tasty-text-muted)")}>
        <span style={{ display: "inline-flex", color: "var(--tasty-statusbar-theme-glyph)" }}>
          <MdI name={/latte/i.test(theme) ? "sun" : "theme"} size="var(--tasty-statusbar-glyph-size)" /></span>{" "}
        {theme ? theme.charAt(0).toUpperCase() + theme.slice(1) : "Mocha"}
      </button>
    </div>
  );
}

export { TabStrip, TerminalPane, MarkdownSurface, StatusBar, Prompt, C, S, resolveStatus, tabBusy, shouldPulse };

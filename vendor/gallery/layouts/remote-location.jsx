// Tasty Gallery — Layouts: where a mirror (remote) surface says so.
// The status bar remote item and the terminal path link tooltip. The file handler
// picker's remote mark lives with the picker on the Dialogs page.
// Host text is the attach profile name and nothing else (decided 2026-11-10; R-57: a
// mirror always attaches through a tasty-attach profile): gx10, mac-company-attach and
// one long name.
// Widths quoted in the specs use the 6px D2Coding advance at 11px.
import React from "react";
import { Kbd, Icon, Tooltip } from "../../components/index.js";
import { Spec, Stage, Meta, Note, Do, Dont, Views, View } from "../parts/specimen.jsx";
import { ThemePair } from "../parts/theme-frame.jsx";
import { rt } from "../../ui_kits/terminal/overlays/remote_row_copy.js";

// Copy. reconnecting is new (status_bar.remote_reconnecting); the link tooltip and the
// file handler picker's remote mark reuse it for their reconnecting form. The rest is reused
// from the app catalog: attach.mirror_pill_label, attach.mirror_workspace,
// attach.toast.mirror_reconnecting.
export const REMOTE_COPY = {
  en: { reconnecting: "reconnecting", remote: "Remote", tip: "Mirror of a remote workspace", tipLost: "The remote connection was lost. Trying to reconnect…" },
  ko: { reconnecting: "재연결 중", remote: "원격", tip: "원격 워크스페이스의 미러 화면", tipLost: "원격 연결이 끊어졌습니다. 재연결을 시도합니다…" },
  ja: { reconnecting: "再接続中", remote: "リモート", tip: "リモートワークスペースのミラー", tipLost: "リモート接続が切断されました。再接続を試みています…" },
  "zh-Hans": { reconnecting: "重新连接中", remote: "远程", tip: "远程工作区的镜像", tipLost: "远程连接已断开。正在尝试重新连接…" },
};

// attach profile names (the decided host text)
const HOST = "gx10";
const MID = "mac-company-attach";
const LONG = "build-runner-eu-west-07-staging-attach";

const caption = { fontSize: "var(--tasty-font-size-caption)", color: "var(--tasty-text-muted)" };

// The remote item. live = connected: glyph + host in the remote hue.
// reconnecting: the bar's own neutral ink + the status word.
// disconnected (a saved remote row that stopped retrying, R-58): the same form, its own word.
// dropHost = collapse step 6 (host text gone, glyph stays; the status word stays).
// The item never shrinks: the host has its own cap, and the bar narrows by the drop order.
function RemoteItem({ host, state = "connected", dropHost = false, lang = "en" }) {
  const live = state === "connected";
  const c = REMOTE_COPY[lang];
  const word = state === "disconnected" ? rt("status_bar.remote_disconnected", lang) : c.reconnecting;
  return (
    <span data-statusbar-remote={state} style={{ display: "inline-flex", alignItems: "center", gap: "var(--tasty-statusbar-remote-gap)", flex: "none" }}>
      <span style={{ display: "inline-flex", flex: "none", color: live ? "var(--tasty-statusbar-remote-fg)" : "var(--tasty-statusbar-glyph)" }}>
        <Icon name="remote" size="var(--tasty-statusbar-glyph-size)" />
      </span>
      {!dropHost && (
        <span style={{ minWidth: 0, maxWidth: "var(--tasty-statusbar-remote-max-width)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          fontFamily: "var(--tasty-font-mono)", color: live ? "var(--tasty-statusbar-remote-fg)" : "var(--tasty-text-muted)" }}>{host}</span>
      )}
      {!live && <span lang={lang} style={{ flex: "none", fontFamily: "var(--tasty-font-label)", color: "var(--tasty-text-muted)" }}>{word}</span>}
    </span>
  );
}

// One 24px bar, the same drawing as the "What the 24px bar carries" specimen, with the
// remote item leading the left cluster. drop = how many collapse steps have run:
// 1 grid → 2 shell → 3 surface id → 4 palette cap → 5 branch text → 6 host text.
function Bar({ w, remote, drop = 0, branch = null, shell = null, lang = "en" }) {
  return (
    <div style={{ width: w, maxWidth: "100%", height: "var(--tasty-status-bar-height)", display: "flex", alignItems: "center", gap: 10, padding: "0 10px", boxSizing: "border-box",
      background: "var(--tasty-bg-sidebar)", border: "1px solid var(--tasty-border-frame)", borderRadius: "var(--tasty-radius-sm)",
      fontSize: "var(--tasty-font-size-caption)", color: "var(--tasty-text-muted)", overflow: "hidden" }}>
      {remote && <RemoteItem {...remote} dropHost={drop >= 6} lang={lang} />}
      {branch && (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, flex: "none", maxWidth: 160, overflow: "hidden" }}>
          <span style={{ display: "inline-flex", color: "var(--tasty-statusbar-glyph)" }}><Icon name="gitBranch" size="var(--tasty-statusbar-glyph-size)" /></span>
          {drop < 5 && <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{branch}</span>}
        </span>
      )}
      {drop < 3 && <span style={{ fontFamily: "var(--tasty-font-mono)", flex: "none" }}>s3·p1</span>}
      {drop < 2 && shell && <span style={{ flex: "none" }}>{shell}</span>}
      {drop < 1 && <span style={{ fontFamily: "var(--tasty-font-mono)", flex: "none" }}>120×32</span>}
      <div style={{ flex: 1 }} />
      {drop < 4 && <span style={{ flex: "none" }}><Kbd keys="Ctrl+K" /></span>}
      <span style={{ display: "inline-flex", flex: "none", color: "var(--tasty-statusbar-theme-glyph)" }}><Icon name="theme" size="var(--tasty-statusbar-glyph-size)" /></span>
    </div>
  );
}

function Labeled({ label, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 0 }}>
      <div style={caption}>{label}</div>
      {children}
    </div>
  );
}

const BAR_ROWS = [
  ["local surface — no remote item", { w: 470, branch: "feat/dag-detail", shell: "zsh" }],
  ["mirror · connected — profile gx10", { w: 470, remote: { host: HOST } }],
  ["mirror · connected — profile mac-company-attach", { w: 470, remote: { host: MID } }],
  ["mirror · reconnecting — neutral ink + status word", { w: 470, remote: { host: MID, state: "reconnecting" } }],
  ["long profile name — capped at 160, end-elided", { w: 470, remote: { host: LONG } }],
  ["narrow — grid and surface id drop", { w: 320, drop: 3, remote: { host: LONG } }],
  ["narrower — palette cap drops", { w: 260, drop: 4, remote: { host: LONG } }],
  ["floor — host text drops, glyph stays", { w: 120, drop: 6, remote: { host: LONG } }],
  ["floor · reconnecting — the status word stays", { w: 200, drop: 6, remote: { host: LONG, state: "reconnecting" } }],
  ["saved remote row · disconnected — the same form, its own word", { w: 470, remote: { host: MID, state: "disconnected" } }],
];

// Status bar tooltip: the item reads the bar's tooltip, text only. Full host, never elided.
function BarTip({ state = "connected", host = HOST, lang = "en" }) {
  const c = REMOTE_COPY[lang];
  return (
    <span lang={lang} style={{ display: "flex", flexDirection: "column" }}>
      <span>{state === "reconnecting" ? c.tipLost : c.tip}</span>
      <span style={{ fontFamily: "var(--tasty-font-mono)", overflowWrap: "anywhere" }}>{host}</span>
    </span>
  );
}

export function RemoteStatusBarSpec() {
  return (
    <Spec id="statusbar-remote-item" title="Remote item — a mirror surface has focus"
      when={<>When the focused surface belongs to a <b>mirror</b> workspace, the bar says so where your eyes already are, whether or not the sidebar is open. The item <b>leads the left cluster</b>: the location frames everything after it, and on a mirror the branch item is absent anyway. It is the explorer host mark — <b>remote glyph + host</b>, both in <span className="tok">--tasty-statusbar-remote-fg</span> — because the bar holds glyphs and text only, never a Tag fill. Focus a local surface and the item is gone. <b>Reconnecting</b> must not look live: glyph and host drop to the bar's own neutral ink and the status word <b>reconnecting</b> follows. The host is capped at 160 and elides its end; it is the <b>last text to drop</b>, after the branch text, and the glyph never drops. Hover shows the full host in the bar's tooltip; the item is not a button. The host text is the <b>attach profile name</b>, and only that: a mirror always attaches through a profile (R-57).</>}>
      <Stage variant="solo" style={{ padding: 20, background: "var(--tasty-bg-app)" }}>
        <ThemePair render={() => (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {BAR_ROWS.map(([label, o]) => <Labeled key={label} label={label}><Bar {...o} /></Labeled>)}
          </div>
        )} />
      </Stage>
      <Views>
        <View name="statusbar-remote-reconnecting-languages" label="Reconnecting — every language">
          <div style={{ display: "flex", flexDirection: "column", gap: 12, minWidth: 300 }}>
            {["en", "ko", "ja", "zh-Hans"].flatMap((lang) => [
              <Labeled key={lang} label={`${lang} · 260, step 3`}><Bar w={260} drop={3} lang={lang} remote={{ host: HOST, state: "reconnecting" }} /></Labeled>,
              <Labeled key={`${lang}-floor`} label={`${lang} · floor`}><Bar w={200} drop={6} lang={lang} remote={{ host: HOST, state: "reconnecting" }} /></Labeled>,
            ])}
          </div>
        </View>
        <View name="statusbar-remote-tooltip" label="Hover — the bar's tooltip, full host">
          <div style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 300 }}>
            {[["connected", "connected", LONG], ["reconnecting", "reconnecting", MID]].map(([label, state, host]) => (
              <Labeled key={label} label={label}>
                <div style={{ paddingTop: 72, display: "flex", justifyContent: "center", minWidth: 300 }}>
                  <Tooltip open placement="top" content={<BarTip state={state} host={host} />}>
                    <span style={{ display: "inline-flex", padding: "0 10px", height: "var(--tasty-status-bar-height)", alignItems: "center",
                      background: "var(--tasty-bg-sidebar)", border: "1px solid var(--tasty-border-frame)", borderRadius: "var(--tasty-radius-sm)", fontSize: "var(--tasty-font-size-caption)" }}>
                      <RemoteItem host={host} state={state} />
                    </span>
                  </Tooltip>
                </div>
              </Labeled>
            ))}
          </div>
        </View>
      </Views>
      <Meta
        specs={[["shown", "focused surface is in a mirror workspace — local surface: absent"], ["position", "first in the left cluster, before branch"], ["connected", <>remote glyph 12 + host · both <span className="tok">--tasty-statusbar-remote-fg</span> (crust 12.06 · 5.67 · mantle 11.29 · 6.17)</>], ["reconnecting", <>glyph <span className="tok">--tasty-statusbar-glyph</span> · host <span className="tok">--tasty-text-muted</span> · then <i>reconnecting</i> in <span className="tok">--tasty-font-label</span>, text-muted</>], ["disconnected", <>a saved remote row that stopped retrying (R-58): the reconnecting form with the word <i>disconnected</i> (<code>status_bar.remote_disconnected</code>) · tooltip: the connected tooltip (what it is + host)</>], ["gap", <><span className="tok">--tasty-statusbar-remote-gap</span> 4 — glyph ↔ host ↔ word</>], ["host text", "attach profile name, as it was at connect time — the only host text (R-57)"], ["host font", "mono caption (a config name)"], ["host cap", <><span className="tok">--tasty-statusbar-remote-max-width</span> 160 on the host text · end-elided with …</>], ["widths", "6px advance: gx10 24 · mac-company-attach 108 · cap 160 = 26 chars (25 + …)"], ["drop order", "1 grid → 2 shell → 3 surface id → 4 palette cap → 5 branch text → 6 host text (remote glyph stays)"], ["reconnecting floor", "dim glyph + status word + theme glyph"], ["tooltip", <>bar tooltip, text only: <code>attach.mirror_workspace</code> or <code>attach.toast.mirror_reconnecting</code>, then the full host in mono</>], ["click", "none — read-only, like every item but the palette chip and theme"], ["refresh", "follows the session state on the next 1Hz read"]]}
        tokens={[{ tok: "--tasty-statusbar-remote-fg", use: "glyph + host, connected", color: "var(--tasty-statusbar-remote-fg)" }, { tok: "--tasty-statusbar-glyph", use: "glyph, reconnecting", color: "var(--tasty-statusbar-glyph)" }, { tok: "--tasty-text-muted", use: "host + word, reconnecting", color: "var(--tasty-text-muted)" }, { tok: "--tasty-statusbar-remote-gap", use: "4" }, { tok: "--tasty-statusbar-remote-max-width", use: "160 host cap" }]} />
      <Note>The remote hue is the only colour in the bar. That is deliberate: it is an <b>identity</b> (where this surface lives), not a status, so it is never a dot. Losing it on reconnect is the signal, and the word says why.</Note>
      <Dont><b>Don't</b> animate the reconnecting state (no spinner, no pulse). The bar reads once a second and carries nothing that changes faster.</Dont>
    </Spec>
  );
}

// ── Terminal path link on a mirror ──
function TermLine({ children }) {
  return <div style={{ whiteSpace: "pre" }}>{children}</div>;
}
function LinkRun({ children }) {
  // the link under the pointer, unchanged: selection fill, text-on-active, blue underline
  return <span style={{ background: "var(--tasty-selection-bg)", color: "var(--tasty-text-on-active)", textDecoration: "underline", textDecorationColor: "var(--tasty-accent-primary-raised)", textUnderlineOffset: 2 }}>{children}</span>;
}
// reconnecting: the status bar's reconnecting form on the tooltip's raised ground —
// glyph glyph-dim-raised, host text-muted-raised, then the status word (label font,
// text-muted-raised). The word never elides; the host elides first.
function LinkTip({ host, state = "connected", lang = "en" }) {
  const c = REMOTE_COPY[lang];
  const live = state === "connected";
  const word = c.reconnecting;
  return (
    <span lang={lang} data-link-remote={state} style={{ display: "inline-flex", alignItems: "center", gap: "var(--tasty-space-sm)", whiteSpace: "nowrap", maxWidth: "100%", minWidth: 0 }}>
      <span style={{ flex: "none" }}>{c.remote}</span>
      <span style={{ display: "inline-flex", alignItems: "center", gap: "var(--tasty-link-remote-gap)", minWidth: 0, fontFamily: "var(--tasty-font-mono)",
        color: live ? "var(--tasty-link-remote-fg)" : "var(--tasty-text-muted-raised)" }}>
        <span style={{ display: "inline-flex", flex: "none", color: live ? "inherit" : "var(--tasty-glyph-dim-raised)" }}><Icon name="remote" size="var(--tasty-icon-size-xs)" /></span>
        <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" }}>{host}</span>
        {!live && <span style={{ flex: "none", fontFamily: "var(--tasty-font-label)" }}>{word}</span>}
      </span>
    </span>
  );
}
function Term({ children }) {
  return (
    <div style={{ background: "var(--tasty-surface-terminal-focused-bg)", color: "var(--tasty-surface-terminal-focused-fg)", fontFamily: "var(--tasty-font-mono)", fontSize: 12,
      lineHeight: "18px", padding: "10px 12px 56px", borderRadius: "var(--tasty-radius-sm)", border: "1px solid var(--tasty-border-frame)", overflow: "visible", minWidth: 0 }}>
      {children}
    </div>
  );
}

const LINK_ROWS = [
  ["local surface — path link, no tooltip", null, "src/main.rs:42", false],
  ["mirror — profile gx10, tooltip says where it lives", HOST, "src/main.rs:42", true],
  ["mirror — profile mac-company-attach", MID, "src/main.rs:42", true],
  ["mirror — long profile name, end-elided in the tooltip", LONG, "src/main.rs:42", true],
  ["agent mirror · reconnecting (resync, or drop → cleanup) — neutral ink + status word, as the status bar", MID, "src/main.rs:42", true, "reconnecting"],
  ["agent mirror · reconnecting, long profile name — the host elides, the word stays", LONG, "src/main.rs:42", true, "reconnecting"],
  ["mirror — https link, no tooltip (opens in the local browser)", HOST, "https://docs.rs/tokio", false],
];

export function RemoteLinkSpec() {
  return (
    <Spec id="terminal-link-remote" title="Path link on a mirror — say where it lives before the click"
      when={<>On a mirror, a path in the terminal names a file on the remote host. Holding the link modifier over it draws the same link as anywhere — selection fill, <span className="tok">text-on-active</span>, blue underline — and a <b>tooltip below the run</b> adds where it lives: the word <b>Remote</b> in tooltip ink, then <b>remote glyph + host</b> in <span className="tok">--tasty-link-remote-fg</span>. It shows after the tooltip delay and goes the frame the link is released, or the frame a click opens the picker; the terminal cells themselves do not change or animate. It stays inside the <b>terminal surface</b>, not just the window, so a link at the surface's edge does not put the tooltip over the sidebar or the next pane whenever the tooltip fits the surface; only a surface narrower than the tooltip lets it out. A <b>local</b> path gets no tooltip, and neither does a URL with a scheme: it opens in the local browser wherever the terminal runs. The host text is the <b>attach profile name</b>, and only that (R-57). An <b>agent mirror</b> can be <b>reconnecting</b> with no scrim: while it attaches again after a resync, and for the short span between its drop and its cleanup. There the link still opens, and the tooltip takes the status bar's reconnecting form: glyph and host drop to neutral ink and the status word <b>reconnecting</b> follows. When a <b>saved remote row</b> drops while the tooltip is up (into reconnecting too), the tooltip <b>closes</b>: it is not left under the scrim, and it does not come back when the row connects again.</>}>
      <Stage variant="solo" style={{ padding: 20, background: "var(--tasty-bg-app)" }}>
        <ThemePair render={() => (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {LINK_ROWS.map(([label, host, text, tip, state]) => (
              <Labeled key={label} label={label}>
                <Term>
                  <TermLine>{"$ cargo build"}</TermLine>
                  <TermLine>
                    {"error: mismatched types at "}
                    {tip
                      ? <Tooltip open placement="bottom" content={<LinkTip host={host} state={state} />}><LinkRun>{text}</LinkRun></Tooltip>
                      : <LinkRun>{text}</LinkRun>}
                  </TermLine>
                </Term>
              </Labeled>
            ))}
          </div>
        )} />
      </Stage>
      <Views>
        <View name="terminal-link-remote-languages" label="Tooltip — every language">
          <div style={{ display: "flex", flexDirection: "column", gap: 12, minWidth: 300 }}>
            {["en", "ko", "ja", "zh-Hans"].flatMap((lang) => ["connected", "reconnecting"].map((state) => (
              <Labeled key={`${lang}-${state}`} label={`${lang} · ${state}`}>
                <Term>
                  <TermLine>{"error: mismatched types at "}<Tooltip open placement="bottom" content={<LinkTip host={HOST} state={state} lang={lang} />}><LinkRun>src/main.rs:42</LinkRun></Tooltip></TermLine>
                </Term>
              </Labeled>
            )))}
          </div>
        </View>
      </Views>
      <Meta
        specs={[["when", "link modifier held + pointer on a PATH link in a mirror surface"], ["not shown", "local surface · URL with a scheme (http, https, …) · no link captured"], ["link cells", "unchanged — selection fill, text-on-active, accent-primary-raised underline"], ["means", "Tooltip, centred under the link run; above when there is no room below"], ["bounds", "the terminal surface's rect, not the window — room above and below is measured inside it, and the bubble is pulled in to its edges, so it stays off the sidebar, a neighbouring pane and the status bar whenever it fits the surface; only a surface narrower than the bubble lets it out (next row)"], ["narrow surface", "bubble wider than the surface: left edge on the surface's left edge, then clamped to the window as the last resort"], ["picker opens", "hidden the frame the file handler picker (Open with…) opens — the only picker a link opens, from Ctrl+click or the link menu's Open with; a link never opens the File Picker — and not shown while it is open, even with the pointer still on the link · after it closes, the normal show rule applies again (modifier + pointer + delay)"], ["content", <>one line: <code>attach.mirror_pill_label</code> in tooltip-fg · space-sm · remote glyph 12 + host in <span className="tok">--tasty-link-remote-fg</span> (raised 8.08 · 4.86)</>], ["reconnecting", <><code>attach.mirror_pill_label</code> in tooltip-fg (unchanged) · glyph <span className="tok">--tasty-glyph-dim-raised</span> · host <span className="tok">--tasty-text-muted-raised</span> · then <code>status_bar.remote_reconnecting</code> in <span className="tok">--tasty-font-label</span>, text-muted-raised · gap 4 · no spinner, no pulse</>], ["state", "agent mirror: follows its session state while shown, like the status bar item · saved remote row that drops while shown, into reconnecting too: the tooltip closes, is not left under the scrim and does not reopen when the row connects again (decided, Q1-a)"], ["disconnected", "no form (user decision, R-58 Q1: the scrim takes the pointer, drawn on Layouts › Saved remote workspace) — a saved remote row that is not connected, reconnecting included, catches no link under the scrim, so it has no form here · an agent mirror is closed once it drops (R-58 decision 23-4), so it has no disconnected form"], ["reconnecting form", "the agent mirror's, with no scrim: while it attaches again after a resync (whatever its anchor or origin), and in the short span between its drop and its cleanup · both short, not measured"], ["host", "attach profile name, the only host text (R-57) · mono · end-elided inside the tooltip max width (240); the status word never elides"], ["show", "tooltip delay (150ms), then instant hide on release — no fade on terminal cells"], ["copy", <>none new — the status word reuses <code>status_bar.remote_reconnecting</code></>]]}
        tokens={[{ tok: "--tasty-link-remote-fg", use: "glyph + host", color: "var(--tasty-link-remote-fg)" }, { tok: "--tasty-link-remote-gap", use: "glyph ↔ host ↔ word" }, { tok: "--tasty-tooltip-fg", use: "the word Remote", color: "var(--tasty-tooltip-fg)" }, { tok: "--tasty-glyph-dim-raised", use: "glyph, reconnecting", color: "var(--tasty-glyph-dim-raised)" }, { tok: "--tasty-text-muted-raised", use: "host + word, reconnecting", color: "var(--tasty-text-muted-raised)" }, { tok: "--tasty-tooltip-max-width", use: "240 — the host elides inside it" }]} />
      <Note>Reconnecting follows the <b>status bar</b>, not the child graph's mirror banner. The banner is an action (a Reconnect button, a spinner while it tries, a warning tone when the connection is lost); the bar, this tooltip and the picker mark only say where a path lives. So they share one read-only form: the remote hue goes, the word says why, nothing moves.</Note>
      <Dont><b>Don't</b> recolour the underline or the selection fill for a remote link. Colour alone does not say which host, the link grammar is shared by every surface, and a new hue on <code>term-selection</code> has no rule cell.</Dont>
      <Do><b>Do</b> keep the tooltip off the link run itself, so the path you are about to click stays readable.</Do>
      <Dont><b>Don't</b> leave the tooltip up once the picker opens. It answered <i>where does this path live</i> before the click; the picker's own host mark answers it now, and a tooltip over a modal reads as part of it.</Dont>
    </Spec>
  );
}

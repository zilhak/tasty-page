// Tasty Gallery — Layouts: where a mirror (remote) surface says so.
// The status bar remote item and the terminal path link tooltip. The file handler
// picker's remote mark lives with the picker on the Dialogs page.
// Host text in every specimen is a placeholder: what names a host (profile name,
// user@host, remote workspace name) is an open product decision. The specimens
// only hold the slot: user@host, the loopback label the session has today, a long
// host, and no value.
import React from "react";
import { Kbd, Icon, Tooltip } from "../../components/index.js";
import { Spec, Stage, Meta, Note, Do, Dont, Views, View } from "../parts/specimen.jsx";
import { ThemePair } from "../parts/theme-frame.jsx";

// Copy. reconnecting is new (status_bar.remote_reconnecting). The rest is reused
// from the app catalog: attach.mirror_pill_label, attach.mirror_workspace,
// attach.toast.mirror_reconnecting.
export const REMOTE_COPY = {
  en: { reconnecting: "reconnecting", remote: "Remote", tip: "Mirror of a remote workspace", tipLost: "The remote connection was lost. Trying to reconnect…" },
  ko: { reconnecting: "재연결 중", remote: "원격", tip: "원격 워크스페이스의 미러 화면", tipLost: "원격 연결이 끊어졌습니다. 재연결을 시도합니다…" },
  ja: { reconnecting: "再接続中", remote: "リモート", tip: "リモートワークスペースのミラー", tipLost: "リモート接続が切断されました。再接続を試みています…" },
  "zh-Hans": { reconnecting: "重新连接中", remote: "远程", tip: "远程工作区的镜像", tipLost: "远程连接已断开。正在尝试重新连接…" },
};

const HOST = "user@host";
const LOOPBACK = "127.0.0.1:54321";
const LONG = "deploy@build-runner-07.eu-west.example.internal";

const caption = { fontSize: "var(--tasty-font-size-caption)", color: "var(--tasty-text-muted)" };

// The remote item. live = connected: glyph + host in the remote hue.
// reconnecting: the bar's own neutral ink + the status word.
// dropHost = collapse step 6 (host text gone, glyph stays; the status word stays).
function RemoteItem({ host, state = "connected", dropHost = false, lang = "en" }) {
  const live = state !== "reconnecting";
  const c = REMOTE_COPY[lang];
  const label = host || c.remote;
  return (
    <span data-statusbar-remote={state} style={{ display: "inline-flex", alignItems: "center", gap: "var(--tasty-statusbar-remote-gap)", flex: "0 1 auto", minWidth: 0 }}>
      <span style={{ display: "inline-flex", flex: "none", color: live ? "var(--tasty-statusbar-remote-fg)" : "var(--tasty-statusbar-glyph)" }}>
        <Icon name="remote" size="var(--tasty-statusbar-glyph-size)" />
      </span>
      {!dropHost && (
        <span style={{ minWidth: 0, maxWidth: "var(--tasty-statusbar-remote-max-width)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          fontFamily: host ? "var(--tasty-font-mono)" : "var(--tasty-font-label)", color: live ? "var(--tasty-statusbar-remote-fg)" : "var(--tasty-text-muted)" }}>{label}</span>
      )}
      {!live && <span lang={lang} style={{ flex: "none", fontFamily: "var(--tasty-font-label)", color: "var(--tasty-text-muted)" }}>{c.reconnecting}</span>}
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
  ["mirror · connected — user@host (placeholder text)", { w: 470, remote: { host: HOST } }],
  ["mirror · connected — the loopback label the session has today", { w: 470, remote: { host: LOOPBACK } }],
  ["mirror · reconnecting — neutral ink + status word", { w: 470, remote: { host: HOST, state: "reconnecting" } }],
  ["long host — capped at 160, end-elided", { w: 470, remote: { host: LONG } }],
  ["no host value — the word Remote holds the slot", { w: 470, remote: { host: "" } }],
  ["narrow — grid and surface id drop", { w: 300, drop: 3, remote: { host: LONG } }],
  ["narrower — palette cap drops", { w: 230, drop: 4, remote: { host: LONG } }],
  ["floor — host text drops, glyph stays", { w: 120, drop: 6, remote: { host: LONG } }],
  ["floor · reconnecting — the status word stays", { w: 200, drop: 6, remote: { host: LONG, state: "reconnecting" } }],
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
      when={<>When the focused surface belongs to a <b>mirror</b> workspace, the bar says so where your eyes already are, whether or not the sidebar is open. The item <b>leads the left cluster</b>: the location frames everything after it, and on a mirror the branch item is absent anyway. It is the explorer host mark — <b>remote glyph + host</b>, both in <span className="tok">--tasty-statusbar-remote-fg</span> — because the bar holds glyphs and text only, never a Tag fill. Focus a local surface and the item is gone. <b>Reconnecting</b> must not look live: glyph and host drop to the bar's own neutral ink and the status word <b>reconnecting</b> follows. The host is capped at 160 and elides its end; it is the <b>last text to drop</b>, after the branch text, and the glyph never drops. Hover shows the full host in the bar's tooltip; the item is not a button. The host text is a placeholder until the product decides what names a host.</>}>
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
              <Labeled key={lang} label={`${lang} · 470`}><Bar w={470} lang={lang} remote={{ host: HOST, state: "reconnecting" }} /></Labeled>,
              <Labeled key={`${lang}-floor`} label={`${lang} · floor`}><Bar w={200} drop={6} lang={lang} remote={{ host: HOST, state: "reconnecting" }} /></Labeled>,
            ])}
          </div>
        </View>
        <View name="statusbar-remote-tooltip" label="Hover — the bar's tooltip, full host">
          <div style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 300 }}>
            {[["connected", "connected", LONG], ["reconnecting", "reconnecting", HOST]].map(([label, state, host]) => (
              <Labeled key={label} label={label}>
                <div style={{ paddingTop: 64, paddingLeft: 96 }}>
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
        specs={[["shown", "focused surface is in a mirror workspace — local surface: absent"], ["position", "first in the left cluster, before branch"], ["connected", <>remote glyph 12 + host · both <span className="tok">--tasty-statusbar-remote-fg</span> (crust 12.06 · 5.67 · mantle 11.29 · 6.17)</>], ["reconnecting", <>glyph <span className="tok">--tasty-statusbar-glyph</span> · host <span className="tok">--tasty-text-muted</span> · then <i>reconnecting</i> in <span className="tok">--tasty-font-label</span>, text-muted</>], ["gap", <><span className="tok">--tasty-statusbar-remote-gap</span> 4 — glyph ↔ host ↔ word</>], ["host font", "mono caption (an address or id)"], ["host cap", <><span className="tok">--tasty-statusbar-remote-max-width</span> 160 · end-elided with …</>], ["loopback", "127.0.0.1:54321 is 90px — never elides"], ["no host value", <>the word <b>Remote</b> (<code>attach.mirror_pill_label</code>) in the host slot, font-label</>], ["drop order", "1 grid → 2 shell → 3 surface id → 4 palette cap → 5 branch text → 6 host text (remote glyph stays)"], ["reconnecting floor", "dim glyph + status word + theme glyph"], ["tooltip", <>bar tooltip, text only: <code>attach.mirror_workspace</code> or <code>attach.toast.mirror_reconnecting</code>, then the full host in mono</>], ["click", "none — read-only, like every item but the palette chip and theme"], ["refresh", "follows the session state on the next 1Hz read"]]}
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
function LinkTip({ host, lang = "en" }) {
  const c = REMOTE_COPY[lang];
  return (
    <span lang={lang} style={{ display: "inline-flex", alignItems: "center", gap: "var(--tasty-space-sm)", whiteSpace: "nowrap", maxWidth: "100%", minWidth: 0 }}>
      <span style={{ flex: "none" }}>{c.remote}</span>
      <span style={{ display: "inline-flex", alignItems: "center", gap: "var(--tasty-link-remote-gap)", minWidth: 0, color: "var(--tasty-link-remote-fg)", fontFamily: "var(--tasty-font-mono)" }}>
        <span style={{ display: "inline-flex", flex: "none" }}><Icon name="remote" size="var(--tasty-icon-size-xs)" /></span>
        <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" }}>{host}</span>
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
  ["mirror — path link, tooltip says where it lives", HOST, "src/main.rs:42", true],
  ["mirror — the loopback label the session has today", LOOPBACK, "src/main.rs:42", true],
  ["mirror — long host, end-elided in the tooltip", LONG, "src/main.rs:42", true],
  ["mirror — https link, no tooltip (opens in the local browser)", HOST, "https://docs.rs/tokio", false],
];

export function RemoteLinkSpec() {
  return (
    <Spec id="terminal-link-remote" title="Path link on a mirror — say where it lives before the click"
      when={<>On a mirror, a path in the terminal names a file on the remote host. Holding the link modifier over it draws the same link as anywhere — selection fill, <span className="tok">text-on-active</span>, blue underline — and a <b>tooltip below the run</b> adds where it lives: the word <b>Remote</b> in tooltip ink, then <b>remote glyph + host</b> in <span className="tok">--tasty-link-remote-fg</span>. It shows after the tooltip delay and goes the frame the link is released; the terminal cells themselves do not change or animate. A <b>local</b> path gets no tooltip, and neither does a URL with a scheme: it opens in the local browser wherever the terminal runs. The host text is a placeholder until the product decides what names a host.</>}>
      <Stage variant="solo" style={{ padding: 20, background: "var(--tasty-bg-app)" }}>
        <ThemePair render={() => (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {LINK_ROWS.map(([label, host, text, tip]) => (
              <Labeled key={label} label={label}>
                <Term>
                  <TermLine>{"$ cargo build"}</TermLine>
                  <TermLine>
                    {"error: mismatched types at "}
                    {tip
                      ? <Tooltip open placement="bottom" content={<LinkTip host={host} />}><LinkRun>{text}</LinkRun></Tooltip>
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
            {["en", "ko", "ja", "zh-Hans"].map((lang) => (
              <Labeled key={lang} label={lang}>
                <Term>
                  <TermLine>{"error: mismatched types at "}<Tooltip open placement="bottom" content={<LinkTip host={HOST} lang={lang} />}><LinkRun>src/main.rs:42</LinkRun></Tooltip></TermLine>
                </Term>
              </Labeled>
            ))}
          </div>
        </View>
      </Views>
      <Meta
        specs={[["when", "link modifier held + pointer on a PATH link in a mirror surface"], ["not shown", "local surface · URL with a scheme (http, https, …) · no link captured"], ["link cells", "unchanged — selection fill, text-on-active, accent-primary-raised underline"], ["means", "Tooltip, below the link run; above when there is no room; clamped to the window"], ["content", <>one line: <code>attach.mirror_pill_label</code> in tooltip-fg · space-sm · remote glyph 12 + host in <span className="tok">--tasty-link-remote-fg</span> (raised 8.08 · 4.86)</>], ["host", "mono · end-elided inside the tooltip max width (240)"], ["show", "tooltip delay (150ms), then instant hide on release — no fade on terminal cells"], ["copy", "none new"]]}
        tokens={[{ tok: "--tasty-link-remote-fg", use: "glyph + host", color: "var(--tasty-link-remote-fg)" }, { tok: "--tasty-link-remote-gap", use: "glyph ↔ host" }, { tok: "--tasty-tooltip-fg", use: "the word Remote", color: "var(--tasty-tooltip-fg)" }, { tok: "--tasty-tooltip-max-width", use: "240 — the host elides inside it" }]} />
      <Dont><b>Don't</b> recolour the underline or the selection fill for a remote link. Colour alone does not say which host, the link grammar is shared by every surface, and a new hue on <code>term-selection</code> has no rule cell.</Dont>
      <Do><b>Do</b> keep the tooltip off the link run itself, so the path you are about to click stays readable.</Do>
    </Spec>
  );
}

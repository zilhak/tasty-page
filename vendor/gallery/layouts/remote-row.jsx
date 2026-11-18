// Tasty Gallery — Layouts: a saved remote workspace (R-58).
// A remote workspace added from the GUI stays in the sidebar across restarts and when the connection drops.
// Parts: ui_kits/terminal/overlays/remote_row.jsx (popup, marks, menu items, confirm) and chrome.jsx WorkspaceRow.
// Frames that rest on a product rule still waiting on the user carry the tag "user-pending (Ln)" and show
// both answers side by side; a later change keeps one.
import React from "react";
import { Spec, Stage, Meta, Note, Do, Dont, Views, View } from "../parts/specimen.jsx";
import { ThemePair } from "../parts/theme-frame.jsx";
import { WorkspaceRow } from "../../ui_kits/terminal/chrome.jsx";
import { RemoteConnectionPopup, RemoteWorkspaceContent, RemoteRailMarks, REMOTE_REASONS, remoteRowTip } from "../../ui_kits/terminal/overlays/remote_row.jsx";

const LANGS = ["en", "ko", "ja", "zh-Hans"];
const cap = { fontFamily: "var(--tasty-font-mono)", fontSize: "var(--tasty-font-size-micro)", color: "var(--tasty-text-muted)" };
const TagChip = ({ tag }) => (
  <span style={{ ...cap, padding: "0 var(--tasty-space-xs)", borderRadius: "var(--tasty-radius-sm)", border: "var(--tasty-border-width) solid var(--tasty-border-strong)", color: "var(--tasty-text-secondary)" }}>{tag}</span>
);
const Labelled = ({ label, tag, children }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: "var(--tasty-space-xs)", minWidth: 0 }}>
    <span style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "var(--tasty-space-sm)" }}>{[].concat(tag || []).map((t) => <TagChip key={t} tag={t} />)}<span style={cap}>{label}</span></span>
    {children}
  </div>
);
const col = (children) => <div style={{ display: "flex", flexDirection: "column", gap: "var(--tasty-space-md)", minWidth: 0 }}>{children}</div>;
const row = (children) => <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--tasty-space-lg)", alignItems: "flex-start" }}>{children}</div>;

const WS = { name: "tasty-core", profile: "gx10", remote: "tasty-core" };
const Frame = ({ shape, children }) => <RemoteWorkspaceContent shape={shape} width="var(--tasty-size-480)" height="var(--tasty-size-288)">{children}</RemoteWorkspaceContent>;
const Pop = (p) => <RemoteConnectionPopup name={WS.name} profile={WS.profile} remote={WS.remote} {...p} />;

// ── 1. Not connected yet: the bare workspace ──
export function RemoteRowEmptySpec() {
  return (
    <Spec id="remote-row-popup-on-the-bare-workspace" title="Not connected yet — the bare workspace and its connection popup"
      when={<>After a restart every saved remote row comes back <b>without tabs, panes or surfaces</b>: its workspace is the bare workspace ground and one popup in its centre. The popup is the <b>only place</b> that says how the row stands: where it points (attach <b>profile</b> and the <b>remote workspace</b> name, both mono, because the local row can be renamed), the state, a reason when it failed, and the one action. Opening the row starts connecting at once, so the first thing you usually see is <b>Connecting…</b>: the button keeps its place, disabled, with a spinner, as the child graph's Reconnect does. A failed attempt leaves the warning glyph, <b>Connection failed</b>, the reason and <b>Connect</b>. The popup is Workspace-scope: it shows only while this workspace is on screen, never takes focus on its own, and has no close button (there is nothing behind it to go back to). Close the row from its menu.</>}>
      <Stage variant="solo" style={{ padding: "var(--tasty-space-lg)", background: "var(--tasty-bg-app)" }}>
        <ThemePair render={() => col(<>
          <Labelled label="connecting — opened by the user (or right after a restart, user-pending L4 a)"><Frame><Pop kind="connecting" /></Frame></Labelled>
          <Labelled label="failed — the remote workspace is in use by another client"><Frame><Pop kind="failed" reason="occupied" /></Frame></Labelled>
        </>)} />
      </Stage>
      <Views>
        <View name="remote-row-popup-every-reason" label="Failed — every reason">
          {row(REMOTE_REASONS.map((r) => <Labelled key={r} label={"reason: " + r}><Frame><Pop kind="failed" reason={r} profile={r === "profile_missing" ? "gx10-old" : WS.profile} /></Frame></Labelled>))}
        </View>
        <View name="remote-row-popup-languages" label="Every language — connecting and the longest reason">
          {row(LANGS.flatMap((lang) => [
            <Labelled key={lang + "c"} label={lang + " · connecting"}><Frame><Pop lang={lang} kind="connecting" /></Frame></Labelled>,
            <Labelled key={lang + "f"} label={lang + " · failed · chain"}><Frame><Pop lang={lang} kind="failed" reason="chain" /></Frame></Labelled>,
          ]))}
        </View>
        <View name="remote-row-popup-narrow" label="Narrow workspace — the popup takes the width less space-md each side">
          <RemoteWorkspaceContent width="var(--tasty-size-320)" height="var(--tasty-size-288)"><Pop kind="failed" reason="workspace_missing" remote="release-pipeline-watch-eu-west" /></RemoteWorkspaceContent>
        </View>
      </Views>
      <Meta
        specs={[["ground", "the workspace content area in bg-app — no tab bar, no pane, no scrim"], ["popup", "Workspace-scope, centred in the content area · 360 wide, at most the area less space-md each side · no title bar, no ×, no drag"], ["frame", "bg-panel · 1px border-strong · radius · shadow-popover (no scrim under it)"], ["inset · gaps", "space-md all round and between blocks · space-xs between the two fields"], ["head", "remote glyph 16 in accent-remote-raised + the row name, body semibold, end-elided"], ["fields", "Profile / Remote workspace — caption labels text-muted · values mono caption text-secondary, end-elided"], ["state block", "title body semibold text-primary + body text-secondary · warning glyph 14 (accent-warning-glyph) only for failed and timed out"], ["action", "one primary sm button, right: Connect · while trying: disabled, Spinner 12, Connecting…"], ["close", "not in the popup — Close locally is in the row menu"], ["focus", "never moved: an agent that starts a connection changes the row mark only"]]}
        tokens={[{ tok: "--tasty-bg-panel", use: "popup", color: "var(--tasty-bg-panel)" }, { tok: "--tasty-border-strong", use: "popup edge", color: "var(--tasty-border-strong)" }, { tok: "--tasty-shadow-popover", use: "popup lift, no scrim" }, { tok: "--tasty-accent-remote-raised", use: "head glyph", color: "var(--tasty-accent-remote-raised)" }, { tok: "--tasty-accent-warning-glyph", use: "failed glyph", color: "var(--tasty-accent-warning-glyph)" }, { tok: "--tasty-text-muted", use: "field labels", color: "var(--tasty-text-muted)" }, { tok: "--tasty-text-secondary", use: "values, body", color: "var(--tasty-text-secondary)" }, { tok: "--tasty-size-360", use: "popup width" }]} />
      <Note>Copy keys are <code>remote.row.popup.*</code> and <code>remote.row.reason.*</code> in <code>ui_kits/terminal/overlays/remote_row_copy.js</code>, four languages each. <b>Connect</b> is for a row that has not connected in this run; a row that had a screen says <b>Reconnect</b>, the child graph's word (<code>child_graph.reconnect</code>), because it is the same action. No token was added.</Note>
      <Dont><b>Don't</b> put <b>Close locally</b> beside Connect. The popup is about the connection; a removal next to the main button turns a missed click into a lost row.</Dont>
    </Spec>
  );
}

// ── 2. Dropped while running: the last screen under the scrim ──
export function RemoteRowLastScreenSpec() {
  return (
    <Spec id="remote-row-popup-over-the-last-screen" title="Dropped while running — the last screen under a scrim, the same popup"
      when={<>Only a row that was connected <b>in this run</b> keeps its tab bar, panes and last screen (nothing is saved across a restart). When its connection drops the screen stays where it was, under the <b>scrim clipped to the workspace content area</b>, and the same popup sits on it with <span className="tok">shadow-modal</span>. Nothing reaches the remote while it is down: input, new tabs and splits do not get through (§4). The scrim also <b>takes the pointer</b> (user decision, R-58 Q1): the last screen is inert like anything under a scrim, so it cannot be selected, copied or scrolled, and links and the file handler picker do not answer under it. <b>Reconnecting</b> is Tasty retrying on its own for the set time (Settings › Remote attach › Keep reconnecting for): title <b>Connection lost</b>, the time in the body, the button disabled with <b>Reconnecting…</b>. When the time runs out it becomes <b>Reconnection timed out</b> with <b>Reconnect</b>. After the user's own <b>Disconnect</b> it is neutral, no warning glyph. A failed Reconnect shows the reason as on the bare workspace. When the remote workspace is <b>closed elsewhere</b> (another client, the remote Tasty itself) the row stays and the title says so, <b>Remote workspace closed</b>, over the workspace-missing reason: nothing failed, so it does not borrow Connection failed. Its <b>Reconnect stays, disabled</b>: the workspace is gone, so it could only fail, and an action that cannot succeed is shown disabled, not hidden. The reason right above it says why, so nothing else repeats it.</>}>
      <Stage variant="solo" style={{ padding: "var(--tasty-space-lg)", background: "var(--tasty-bg-app)" }}>
        <ThemePair render={() => col(<>
          <Labelled label="reconnecting — automatic, up to the set time"><Frame shape><Pop shape kind="reconnecting" /></Frame></Labelled>
          <Labelled label="disconnected — the time ran out"><Frame shape><Pop shape kind="gave_up" /></Frame></Labelled>
          <Labelled label="disconnected — the user chose Disconnect" tag="user-pending (L1)"><Frame shape><Pop shape kind="user" userVariant="stay" /></Frame></Labelled>
          <Labelled label="failed Reconnect — the remote workspace is gone"><Frame shape><Pop shape kind="failed" reason="workspace_missing" /></Frame></Labelled>
          <Labelled label="closed elsewhere — another client or the remote Tasty closed the workspace · Reconnect disabled"><Frame shape><Pop shape kind="closed" /></Frame></Labelled>
        </>)} />
      </Stage>
      <Views>
        <View name="remote-row-last-screen-languages" label="Every language — reconnecting, timed out and closed elsewhere">
          {row(LANGS.flatMap((lang) => [
            <Labelled key={lang + "r"} label={lang + " · reconnecting"}><Frame shape><Pop shape lang={lang} kind="reconnecting" /></Frame></Labelled>,
            <Labelled key={lang + "g"} label={lang + " · timed out"}><Frame shape><Pop shape lang={lang} kind="gave_up" /></Frame></Labelled>,
            <Labelled key={lang + "c"} label={lang + " · closed elsewhere"}><Frame shape><Pop shape lang={lang} kind="closed" /></Frame></Labelled>,
          ]))}
        </View>
      </Views>
      <Meta
        specs={[["shown", "a row that was connected in this run and is not now — never after a restart"], ["last screen", "drawn as it was, no blur, no change to terminal content (0 ms) · inert, the general under-scrim rule (R-58 Q1)"], ["cover", "scrim-bg clipped to the workspace content area (tab bar and panes) — sidebar, status bar and other windows stay clear"], ["pointer", "the scrim takes it (user decision, R-58 Q1) · no selection, copy, scroll, link or picker on the last screen while the row is not connected, reconnecting included"], ["popup", "same as on the bare workspace · shadow-modal, because it is centred over a scrim"], ["reconnecting", "title Connection lost · body: the reconnect time in s · button disabled, Spinner 12, Reconnecting…"], ["timed out", "warning glyph · Reconnection timed out · how long it tried · Reconnect"], ["user disconnected", "no glyph · Disconnected · body by L1 (next specimen) · Reconnect"], ["failed", "warning glyph · Connection failed · reason · Reconnect"], ["closed elsewhere", <>the remote workspace was closed by another client or the remote Tasty while the row was connected · the row stays (R-58 Q4) · warning glyph · <code>remote.row.popup.closed_title</code> (new) · body <code>remote.row.reason.workspace_missing</code> · Reconnect disabled, no Spinner, label unchanged · the body is the reason, no tooltip or extra line · after a restart the row has no last screen, and a failed connect shows Connection failed with the same reason and Connect enabled</>], ["reconnect time 0", "no reconnecting state: the drop goes straight to timed out with 0 s"], ["links, picker", "not reached on a saved remote row that is not connected, so no form: no link tooltip, no picker host mark (Layouts › Path link on a mirror, Dialogs › File handler picker) · a link tooltip or picker open when the row drops (into reconnecting too) closes, and does not reopen when the row connects again (decided, Q1-a)"]]}
        tokens={[{ tok: "--tasty-scrim-bg", use: "cover over the last screen", color: "var(--tasty-scrim-bg)" }, { tok: "--tasty-shadow-modal", use: "popup over the scrim" }, { tok: "--tasty-accent-warning-glyph", use: "timed out, failed", color: "var(--tasty-accent-warning-glyph)" }]} />
      <Note>The status bar under the workspace stays live: on a focused mirror surface it keeps its read-only form, <i>reconnecting</i> while Tasty retries and <i>disconnected</i> once it stops (Layouts › Workspace status bar). An agent mirror made from the CLI or IPC does not reconnect (R-58 decision 23-4): no scrim and no popup, it is closed once it drops. Its only reconnecting is short and has no scrim: attaching again after a resync, and the span between the drop and the cleanup; there the read-only marks take the reconnecting form.</Note>
      <Note><b>Toasts (R-58 §3-8).</b> A saved remote row shows <b>no connection toasts</b>: not <code>attach.toast.mirror_disconnected</code> (“…The mirror workspace has been closed.”, wrong for a row that stays), not <code>attach.toast.mirror_reconnecting</code>, not <code>attach.toast.mirror_reconnected</code>, not <code>attach.toast.mirror_reconnect_giveup</code> (its “switch away and back” advice does not apply). The row mark tells it whether or not the row is active, and the popup tells it while the row is on screen; a toast would say the same thing a third time and then be gone. An agent mirror does not reconnect, so it gets none of the three reconnect toasts; when it drops it only shows <code>attach.toast.mirror_disconnected</code>, the notice that it was closed.</Note>
      <Do><b>Do</b> keep the last screen readable under the scrim. It tells you which workspace this was and where it stopped, and it comes back as it is when Reconnect succeeds.</Do>
      <Dont><b>Don't</b> animate the cover or the screen under it. The only motion is the button's spinner while Tasty is trying.</Dont>
    </Spec>
  );
}

// ── 3. Row and rail marks ──
const ROWS = [
  ["connected", { remoteState: "connected", status: "running", running: 2 }],
  ["connecting", { remoteState: "connecting" }],
  ["reconnecting", { remoteState: "reconnecting", status: "running", running: 2 }],
  ["disconnected (last screen kept)", { remoteState: "disconnected" }],
  ["not connected (after a restart)", { remoteState: "not_connected" }],
  ["disconnected + reason", { remoteState: "disconnected", remoteReason: "occupied" }],
  ["not connected + reason", { remoteState: "not_connected", remoteReason: "profile_missing", remoteProfile: "gx10-old" }],
];
function Rows({ active, lang }) {
  return (
    <div style={{ width: "var(--tasty-size-240)", display: "flex", flexDirection: "column", background: "var(--tasty-bg-sidebar)", border: "var(--tasty-border-width) solid var(--tasty-border-frame)", borderRadius: "var(--tasty-radius)", overflow: "hidden" }}>
      {ROWS.map(([label, o]) => (
        <div key={label} title={label}>
          <WorkspaceRow ws={{ id: label, name: "tasty-core", mirror: true, status: "idle", remoteProfile: "gx10", remoteName: "tasty-core", ...o }} active={active} lang={lang} />
        </div>
      ))}
    </div>
  );
}
function RailAvatar({ o, active }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--tasty-space-xs)", width: "var(--tasty-size-64)" }}>
      <div title={remoteRowTip({ name: "tasty-core", remoteProfile: "gx10", remoteName: "tasty-core", ...o[1] })} style={{ position: "relative", width: "var(--tasty-size-36)", height: "var(--tasty-size-36)", display: "inline-flex", alignItems: "center", justifyContent: "center",
        borderRadius: "var(--tasty-radius)", background: active ? "var(--tasty-overlay-active)" : "transparent",
        fontFamily: "var(--tasty-font-mono)", fontWeight: "var(--tasty-font-weight-bold)", fontSize: "var(--tasty-font-size-body)", color: active ? "var(--tasty-accent-primary-raised)" : "var(--tasty-text-muted)" }}>
        T
        <RemoteRailMarks state={o[1].remoteState} warn={!!o[1].remoteReason} />
      </div>
      <span style={{ ...cap, textAlign: "center" }}>{o[0]}</span>
    </div>
  );
}
export function RemoteRowMarksSpec() {
  return (
    <Spec id="remote-row-marks-sidebar-and-rail" title="Row and rail — the connection state at a glance"
      when={<>The row says how the connection stands whether or not it is active; it never moves focus. The <b>REMOTE</b> tag stays the identity. <b>Connected</b> is today's tag in the remote hue. Every other state follows the status bar's read-only form: the tag turns <b>neutral</b> and a <b>status word</b> follows it — <i>connecting</i>, <i>reconnecting</i>, <i>disconnected</i> (the last screen is kept), <i>not connected</i> (nothing since Tasty started). While Tasty is trying (connecting, reconnecting) the dot slot shows the <b>LNB loading spinner</b>, the one Attaching… already uses; off the live state the dot falls to idle and the running count goes, because a status from a dropped connection is stale. A failed attempt adds the <b>warning mark</b> after the name — the auto-attach refusal mark, same glyph, slot and token — with the reason in the tooltip. Disconnected and failed are told apart by that mark: no mark is a plain end, a mark is something to read. The rail keeps the same four corners: the remote chip at bottom right turns neutral off the live state, the loading ring surrounds the initial while trying, the warning chip takes the top left.</>}>
      <Stage variant="solo" style={{ padding: "var(--tasty-space-lg)", background: "var(--tasty-bg-app)" }}>
        <ThemePair render={() => row(<>
          <Labelled label="inactive rows"><Rows /></Labelled>
          <Labelled label="active rows"><Rows active /></Labelled>
          <Labelled label="rail">
            <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--tasty-space-sm)", width: "var(--tasty-size-288)", padding: "var(--tasty-space-sm)", background: "var(--tasty-bg-sidebar)", borderRadius: "var(--tasty-radius)" }}>
              {ROWS.map((o) => <RailAvatar key={o[0]} o={o} />)}
            </div>
          </Labelled>
        </>)} />
      </Stage>
      <Views>
        <View name="remote-row-marks-languages" label="Status words — every language">
          {row(LANGS.map((lang) => <Labelled key={lang} label={lang}><Rows lang={lang} /></Labelled>))}
        </View>
      </Views>
      <Meta
        specs={[["connected", "REMOTE info Tag in the remote hue + the workspace's own dot and running count — unchanged"], ["off the live state", "REMOTE default Tag (tag-fg on its own fill) + status word: font-label caption, text-muted (text-on-active on the active row), end-elided"], ["words", "connecting · reconnecting (status_bar.remote_reconnecting) · disconnected (status_bar.remote_disconnected) · not connected"], ["dot slot", "trying: Spinner 14 (the LNB loading spinner) · otherwise not live: idle dot · running count hidden"], ["reason", "alertTriangle 14 in attach-refusal-glyph after the name, space-sm before it · tooltip: what it is, profile → remote workspace, the reason"], ["tooltip", "attach.mirror_workspace · profile → remote workspace (mono in the app) · the status word or the reason"], ["rail BR chip", "live: unchanged · not live: 1px border-control, glyph-dim remote glyph on workspace-mirror-chip-bg"], ["rail trying", "the 28 loading ring around the initial; corner chips draw above it"], ["rail TL chip", "the refusal chip — alertTriangle 8 on bg-sidebar"], ["agent use (N2)", "the row goes to connecting and back; focus stays where it is"], ["new tokens", "none — tag-fg, text-muted, border-control and glyph-dim are existing roles on bg-sidebar (glyph-dim 3.59 · 4.64, border-control 3.59 · 3.58)"]]}
        tokens={[{ tok: "--tasty-tag-info-fg", use: "REMOTE, connected", color: "var(--tasty-tag-info-fg)" }, { tok: "--tasty-tag-fg", use: "REMOTE, not live", color: "var(--tasty-tag-fg)" }, { tok: "--tasty-text-muted", use: "status word", color: "var(--tasty-text-muted)" }, { tok: "--tasty-attach-refusal-glyph", use: "reason mark", color: "var(--tasty-attach-refusal-glyph)" }, { tok: "--tasty-border-control", use: "rail chip edge, not live", color: "var(--tasty-border-control)" }, { tok: "--tasty-glyph-dim", use: "rail chip glyph, not live", color: "var(--tasty-glyph-dim)" }]} />
      <Note>The auto-attach refusal <b>banner</b> does not show on a saved remote row; the popup carries the reason. The row mark and rail chip are the refusal's, so a mapped workspace and a saved remote row warn in the same place.</Note>
      <Note><b>Glyph.</b> The REMOTE tag and the rail chip now draw the <code>remote</code> glyph through <code>Icon</code>, at the icon set's 2px stroke. They used to inline the same path at a 2.4 stroke. That is deliberate: the rules allow glyphs only through <code>Icon</code>, and the set has one stroke. At 10 and 8 px the thinner line is the only visible change; size, colour and position are unchanged.</Note>
      <Dont><b>Don't</b> drop the REMOTE tag when the connection is down. It is what the row is; the word next to it says how it stands.</Dont>
    </Spec>
  );
}

// ── 4. Waiting on the user: L1 to L4 ──
const PENDING = [
  ["L1", "A row the user disconnected, opened again in the same run", "a: stays disconnected — the popup keeps Reconnect; an agent's request is refused and the row mark stays disconnected", "b: reconnects — opening it shows Reconnecting…; an agent's request turns the row to connecting", "drawn: both, below"],
  ["L2", "An agent uses a not-connected row: does the request wait", "a: waits up to 35 s", "b: answers at once, connection keeps going", "same screen either way: the row turns connecting, then connected or not connected + reason; one form"],
  ["L3", "Does a query-only command start a connection", "a: no — the row stays not connected", "b, c: yes — the row turns connecting", "same marks either way (connecting); one form"],
  ["L4", "A remote row comes on screen without a click (restart, window focus, a neighbour closed)", "a: starts connecting — the popup shows Connecting…", "b: does not — the popup shows Not connected + Connect", "drawn: both, below"],
];
export function RemoteRowPendingSpec() {
  return (
    <Spec id="remote-row-user-pending-l1-l4" title="Waiting on the user — L1 to L4"
      when={<>Four product questions are still open. Two change what the popup shows first (L1, L4), so both answers are drawn here, tagged <b>user-pending</b>. Two change only <i>when</i> the row turns connecting (L2, L3); the marks are the same either way, so they get one form.</>}>
      <Stage variant="solo" style={{ padding: "var(--tasty-space-lg)", background: "var(--tasty-bg-app)", flexDirection: "column", alignItems: "stretch", gap: "var(--tasty-space-lg)" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ borderCollapse: "collapse", fontSize: "var(--tasty-font-size-caption)", color: "var(--tasty-text-secondary)", minWidth: "var(--tasty-size-560)" }}>
            <thead><tr>{["", "question", "answer a", "answer b", "screen"].map((h) => <th key={h} style={{ textAlign: "left", padding: "var(--tasty-space-xs) var(--tasty-space-sm)", borderBottom: "var(--tasty-border-width) solid var(--tasty-separator)", color: "var(--tasty-text-muted)", fontWeight: "var(--tasty-font-weight-semibold)" }}>{h}</th>)}</tr></thead>
            <tbody>{PENDING.map((r) => <tr key={r[0]}>{r.map((c, i) => <td key={i} style={{ verticalAlign: "top", padding: "var(--tasty-space-xs) var(--tasty-space-sm)", borderBottom: "var(--tasty-border-width) solid var(--tasty-separator)", fontFamily: i === 0 ? "var(--tasty-font-mono)" : undefined }}>{c}</td>)}</tr>)}</tbody>
          </table>
        </div>
        <ThemePair render={() => col(<>
          {row(<>
            <Labelled label="L1 a — opened again: still disconnected, Reconnect only" tag="user-pending (L1)"><Frame shape><Pop shape kind="user" userVariant="stay" /></Frame></Labelled>
            <Labelled label="L1 b — opened again: reconnects at once" tag="user-pending (L1)"><Frame shape><Pop shape kind="reconnecting" /></Frame></Labelled>
          </>)}
          {row(<>
            <Labelled label="L1 b — the line under Disconnected while it is still on screen" tag="user-pending (L1)"><Frame shape><Pop shape kind="user" userVariant="next" /></Frame></Labelled>
          </>)}
          {row(<>
            <Labelled label="L4 a — on screen after a restart: connecting" tag="user-pending (L4)"><Frame><Pop kind="connecting" /></Frame></Labelled>
            <Labelled label="L4 b — on screen after a restart: Not connected + Connect" tag="user-pending (L4)"><Frame><Pop kind="idle" /></Frame></Labelled>
          </>)}
        </>)} />
      </Stage>
      <Meta
        specs={[["L1 a", "user_body_stay · menu Reconnect enabled · agent request: row mark unchanged (disconnected)"], ["L1 b", "user_body_next while on screen · opening it again: reconnecting popup · agent request: row mark connecting"], ["L2", "one form — a: the connecting mark can last up to 35 s; b: the same mark, as long as the connection takes"], ["L3", "one form — a: list queries leave not connected as it is; b, c: they turn it connecting"], ["L4 a", "first screen Connecting… (also after window focus and a closed neighbour)"], ["L4 b", "first screen remote.row.popup.idle_title + Connect"], ["after the answers", "keep one frame per L and drop the tag"]]}
        tokens={[]} />
    </Spec>
  );
}

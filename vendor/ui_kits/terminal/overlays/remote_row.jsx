import React from "react";
import { Icon } from "../../../components/core/Icon.jsx";
import { Tag } from "../../../components/core/Tag.jsx";
import { Button } from "../../../components/core/Button.jsx";
import { Spinner } from "../../../components/feedback/Spinner.jsx";
import { StatusDot } from "../../../components/feedback/StatusDot.jsx";
import { MenuItem } from "../../../components/navigation/MenuItem.jsx";
import { rt } from "./remote_row_copy.js";

// Tasty UI kit — a saved remote workspace (a mirror added from the GUI, kept across restarts).
// One connection state per row:
//   connected     — live mirror. The REMOTE tag in the remote hue, as before.
//   connecting    — no screen yet; the user opened the row or an agent used it.
//   reconnecting  — the connection dropped while running; Tasty retries for the set time.
//   disconnected  — the connection ended (time ran out, or the user chose Disconnect); the last screen is kept.
//   not_connected — saved, not connected since Tasty started; no tabs.
// A failure adds a reason (reason + its argument) on top of disconnected or not_connected.
// The read-only marks follow the status bar's reconnecting form: off the live state the remote hue goes
// and a status word says why. The action (Connect / Reconnect) lives only in the connection popup and the menu.

export const REMOTE_ROW_STATES = ["connected", "connecting", "reconnecting", "disconnected", "not_connected"];
export const REMOTE_REASONS = ["profile_missing", "workspace_missing", "occupied", "chain", "endpoint", "self"];
// the reason's argument: profile name or remote workspace name
export const REASON_ARG = { profile_missing: "profile", workspace_missing: "remote", occupied: "remote", chain: "remote", endpoint: "profile", self: "profile" };

const TRYING = { connecting: true, reconnecting: true };
// a row that had a screen in this run says Reconnect; one that never connected says Connect
const HAS_SHAPE = { connected: true, reconnecting: true, disconnected: true };

export function remoteStateWord(state, lang = "en") {
  if (state === "connecting") return rt("remote.row.state.connecting", lang);
  if (state === "reconnecting") return rt("status_bar.remote_reconnecting", lang);
  if (state === "disconnected") return rt("status_bar.remote_disconnected", lang);
  if (state === "not_connected") return rt("remote.row.state.not_connected", lang);
  return null;
}

export function remoteReasonText(ws, lang = "en") {
  if (!ws.remoteReason) return null;
  const arg = REASON_ARG[ws.remoteReason] === "profile" ? ws.remoteProfile : ws.remoteName;
  return rt("remote.row.reason." + ws.remoteReason, lang, arg);
}

// Row and rail tooltip: what it is, where it points (mono in the app), then the state word or the reason.
export function remoteRowTip(ws, lang = "en") {
  const where = ws.remoteProfile ? ws.remoteProfile + " → " + (ws.remoteName || ws.name) : null;
  const state = ws.remoteState || "connected";
  const last = remoteReasonText(ws, lang) || remoteStateWord(state, lang);
  return [rt("attach.mirror_workspace", lang), where, last].filter(Boolean).join("\n");
}

// The REMOTE tag. live = the info Tag in the remote hue (unchanged); otherwise the neutral Tag.
// The Tag keeps its own fill, so the active row changes nothing in it.
export function RemoteTag({ live = true, title }) {
  return (
    <Tag variant={live ? "info" : "default"} caps title={title} aria-label="Remote mirror"
      style={{ flex: "none", color: live ? "var(--tasty-tag-info-fg)" : "var(--tasty-tag-fg)" }}>
      <Icon name="remote" size="var(--tasty-workspace-mirror-icon-size)" />
      remote
    </Tag>
  );
}

// The row's remote line, under the title: the tag, and off the live state the status word.
export function RemoteRowLine({ state = "connected", active = false, lang = "en", title }) {
  const live = state === "connected";
  const word = remoteStateWord(state, lang);
  return (
    <div data-remote-row={state} style={{ display: "flex", alignItems: "center", gap: "var(--tasty-space-xs)", minWidth: 0, marginTop: "var(--tasty-size-2)" }}>
      <RemoteTag live={live} title={title} />
      {word && (
        <span lang={lang} style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          fontFamily: "var(--tasty-font-label)", fontSize: "var(--tasty-font-size-caption)", lineHeight: "var(--tasty-line-height-ui)",
          color: active ? "var(--tasty-text-on-active)" : "var(--tasty-text-muted)" }}>{word}</span>
      )}
    </div>
  );
}

// Dot slot: trying = the LNB loading spinner (the same one Attaching… uses); not live = the idle dot,
// because a status from a dropped connection is stale; live = the workspace's own dot.
export function RemoteDotSlot({ state = "connected", status = "idle", attached, pulse }) {
  if (TRYING[state]) return <Spinner size={14} label={null} />;
  if (state !== "connected") return <StatusDot status="idle" />;
  return <StatusDot status={status} attached={attached} pulse={pulse} />;
}

// The warning mark in the title line's trailing slot: the auto-attach refusal mark, reused.
export function RemoteWarnMark({ title }) {
  return (
    <span title={title} aria-label="Remote not connected" style={{ display: "inline-flex", flex: "none", color: "var(--tasty-attach-refusal-glyph)" }}>
      <Icon name="alertTriangle" size="var(--tasty-icon-size-sm)" />
    </span>
  );
}

// Rail marks over a 36 avatar: BR remote chip (live: sky, as before · not live: neutral edge and dim glyph),
// a 28 spinner ring while trying (the rail loading ring), TL warning chip on a reason (the refusal chip).
export function RemoteRailMarks({ state = "connected", warn = false, title }) {
  const live = state === "connected";
  const chip = { position: "absolute", pointerEvents: "none", display: "inline-flex", alignItems: "center", justifyContent: "center",
    borderRadius: "var(--tasty-radius-pill)", boxSizing: "border-box", boxShadow: "0 0 0 var(--tasty-size-2) var(--tasty-bg-sidebar)" };
  return (
    <>
      {TRYING[state] && (
        <span aria-hidden style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
          <Spinner size={28} label={null} />
        </span>
      )}
      <span title={title} aria-label="Remote mirror" data-remote-chip={live ? "live" : "offline"} style={{ ...chip, bottom: -1, right: -1,
        width: "var(--tasty-workspace-mirror-chip-size)", height: "var(--tasty-workspace-mirror-chip-size)",
        border: "var(--tasty-border-width) solid " + (live ? "var(--tasty-workspace-mirror-chip-border)" : "var(--tasty-border-control)"),
        background: "var(--tasty-workspace-mirror-chip-bg)", color: live ? "var(--tasty-workspace-mirror-fg)" : "var(--tasty-glyph-dim)" }}>
        <Icon name="remote" size="var(--tasty-size-8)" />
      </span>
      {warn && (
        <span aria-label="Remote not connected" style={{ ...chip, top: "calc(-1 * var(--tasty-border-width))", left: "calc(-1 * var(--tasty-border-width))",
          width: "var(--tasty-attach-refusal-chip-size)", height: "var(--tasty-attach-refusal-chip-size)", background: "var(--tasty-bg-sidebar)",
          color: "var(--tasty-attach-refusal-glyph)", boxShadow: "none" }}>
          <Icon name="alertTriangle" size="var(--tasty-attach-refusal-chip-glyph-size)" />
        </span>
      )}
    </>
  );
}

// ── The remote connection popup (one per row: state, reason, the connect action) ──
// Workspace-scope popup, centred in the workspace content area, never takes focus on its own.
// kind: connecting · idle · failed (empty workspace) · reconnecting · gave_up · user · failed (over the last screen).
// shape = the last screen is kept under the scrim → shadow-modal; the empty workspace has no scrim → shadow-popover.
export function RemoteConnectionPopup({ lang = "en", name = "tasty-core", profile = "gx10", remote, kind = "connecting", reason, seconds = 300,
  userVariant = "stay", shape = false, width = "var(--tasty-size-360)" }) {
  const remoteName = remote || name;
  const warn = kind === "failed" || kind === "gave_up";
  const trying = kind === "connecting" || kind === "reconnecting";
  let title = null;
  let body = null;
  if (kind === "reconnecting") { title = rt("remote.row.popup.lost_title", lang); body = rt("remote.row.popup.lost_body", lang, seconds); }
  if (kind === "gave_up") { title = rt("remote.row.popup.gave_up_title", lang); body = rt("remote.row.popup.gave_up_body", lang, seconds); }
  if (kind === "user") { title = rt("remote.row.popup.user_title", lang); body = rt(userVariant === "next" ? "remote.row.popup.user_body_next" : "remote.row.popup.user_body_stay", lang); }
  if (kind === "idle") title = rt("remote.row.popup.idle_title", lang);
  if (kind === "failed") { title = rt("remote.row.popup.failed_title", lang); body = remoteReasonText({ remoteReason: reason, remoteProfile: profile, remoteName }, lang); }
  const label = trying
    ? rt(shape ? "child_graph.reconnecting" : "remote.row.popup.connecting", lang)
    : rt(shape ? "child_graph.reconnect" : "remote.row.popup.connect", lang);
  const field = { fontSize: "var(--tasty-font-size-caption)", lineHeight: "var(--tasty-line-height-ui)" };
  return (
    <div role="dialog" aria-label={name} lang={lang} data-remote-popup={kind}
      style={{ width, maxWidth: "calc(100% - 2 * var(--tasty-space-md))", boxSizing: "border-box", display: "flex", flexDirection: "column", gap: "var(--tasty-space-md)",
        padding: "var(--tasty-space-md)", background: "var(--tasty-bg-panel)", border: "var(--tasty-border-width) solid var(--tasty-border-strong)",
        borderRadius: "var(--tasty-radius)", boxShadow: shape ? "var(--tasty-shadow-modal)" : "var(--tasty-shadow-popover)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "var(--tasty-space-sm)", minWidth: 0 }}>
        <span style={{ display: "inline-flex", flex: "none", color: "var(--tasty-accent-remote-raised)" }}><Icon name="remote" size="var(--tasty-icon-size-md)" /></span>
        <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: "var(--tasty-font-size-body)",
          fontWeight: "var(--tasty-font-weight-semibold)", color: "var(--tasty-text-primary)" }}>{name}</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "auto minmax(0, 1fr)", columnGap: "var(--tasty-space-md)", rowGap: "var(--tasty-space-xs)" }}>
        <span style={{ ...field, color: "var(--tasty-text-muted)" }}>{rt("remote.row.popup.profile", lang)}</span>
        <span style={{ ...field, fontFamily: "var(--tasty-font-mono)", color: "var(--tasty-text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{profile}</span>
        <span style={{ ...field, color: "var(--tasty-text-muted)" }}>{rt("remote.row.popup.remote_workspace", lang)}</span>
        <span style={{ ...field, fontFamily: "var(--tasty-font-mono)", color: "var(--tasty-text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{remoteName}</span>
      </div>
      {title && (
        <div style={{ display: "flex", alignItems: "flex-start", gap: "var(--tasty-space-sm)", minWidth: 0 }}>
          {warn && <span style={{ display: "inline-flex", flex: "none", marginTop: "var(--tasty-size-1)", color: "var(--tasty-accent-warning-glyph)" }}><Icon name="alertTriangle" size="var(--tasty-icon-size-sm)" /></span>}
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--tasty-space-xs)", minWidth: 0 }}>
            <span style={{ fontSize: "var(--tasty-font-size-body)", lineHeight: "var(--tasty-line-height-ui)", fontWeight: "var(--tasty-font-weight-semibold)", color: "var(--tasty-text-primary)" }}>{title}</span>
            {body && <span style={{ fontSize: "var(--tasty-font-size-body)", lineHeight: "var(--tasty-line-height-ui)", color: "var(--tasty-text-secondary)", overflowWrap: "anywhere" }}>{body}</span>}
          </div>
        </div>
      )}
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <Button variant="primary" size="sm" disabled={trying} leadingIcon={trying ? <Spinner size={12} label={null} /> : undefined}>{label}</Button>
      </div>
    </div>
  );
}

// The workspace content area of a saved remote row that is not connected.
// shape = false: no tab bar or pane, the bare workspace ground, the popup on it.
// shape = true: the last tab bar and panes as they were, inert under the workspace-clipped scrim, the popup on it.
// The scrim takes the pointer: nothing under it answers, so no link is caught and no picker opens there.
export function RemoteWorkspaceContent({ shape = false, width = "var(--tasty-size-560)", height = "var(--tasty-size-320)", children }) {
  const line = (t, c) => <div style={{ whiteSpace: "pre", color: c || "var(--tasty-surface-terminal-focused-fg)" }}>{t}</div>;
  return (
    <div style={{ position: "relative", width, maxWidth: "100%", height, overflow: "hidden", boxSizing: "border-box",
      border: "var(--tasty-border-width) solid var(--tasty-border-frame)", borderRadius: "var(--tasty-radius)", background: "var(--tasty-bg-app)" }}>
      {shape && (
        <div data-audit-exempt="under-scrim" aria-hidden style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column" }}>
          <div style={{ height: "var(--tasty-tab-height)", flex: "none", display: "flex", alignItems: "stretch", background: "var(--tasty-bg-sidebar)", borderBottom: "var(--tasty-border-width) solid var(--tasty-separator)" }}>
            {["build", "logs"].map((t, i) => (
              <span key={t} style={{ display: "inline-flex", alignItems: "center", padding: "0 var(--tasty-space-md)", fontSize: "var(--tasty-font-size-caption)",
                background: i === 0 ? "var(--tasty-tab-bg-active)" : "transparent", color: i === 0 ? "var(--tasty-text-primary)" : "var(--tasty-text-muted)" }}>{t}</span>
            ))}
          </div>
          <div style={{ flex: 1, minHeight: 0, display: "flex", gap: "var(--tasty-border-width)", background: "var(--tasty-separator)" }}>
            <div style={{ flex: 1, padding: "var(--tasty-space-sm)", background: "var(--tasty-surface-terminal-focused-bg)", fontFamily: "var(--tasty-font-mono)", fontSize: "var(--tasty-font-size-caption)", lineHeight: "var(--tasty-line-height-ui)" }}>
              {line("$ cargo build --release")}{line("   Compiling tasty-core v0.9.0")}{line("   Compiling tasty-remote v0.9.0")}{line("error: mismatched types at src/main.rs:42")}
            </div>
            <div style={{ flex: 1, padding: "var(--tasty-space-sm)", background: "var(--tasty-surface-bed-unfocused)", fontFamily: "var(--tasty-font-mono)", fontSize: "var(--tasty-font-size-caption)", lineHeight: "var(--tasty-line-height-ui)" }}>
              {line("$ tail -f deploy.log")}{line("12:04:31 rollout 3/5")}{line("12:04:40 rollout 4/5")}
            </div>
          </div>
        </div>
      )}
      {shape && <div aria-hidden style={{ position: "absolute", inset: 0, background: "var(--tasty-scrim-bg)" }} />}
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>{children}</div>
    </div>
  );
}

// ── Close the workspace on the remote — the confirmation ──
// Window-scope centred confirm on the scrim, as Delete category. last = opened by closing the last tab or pane.
export function CloseOnRemoteDialog({ lang = "en", name = "tasty-core", profile = "gx10", last = false }) {
  return (
    <div role="alertdialog" lang={lang} aria-label={rt("remote.row.close_remote.title", lang, name)}
      style={{ width: "var(--tasty-info-modal-width)", maxWidth: "100%", boxSizing: "border-box", background: "var(--tasty-bg-panel)", border: "var(--tasty-border-width) solid var(--tasty-border-strong)",
        borderRadius: "var(--tasty-radius)", overflow: "hidden", boxShadow: "var(--tasty-shadow-modal)", textAlign: "left" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: "var(--tasty-space-sm)", padding: "var(--tasty-space-md) var(--tasty-space-md) 0" }}>
        <span style={{ display: "inline-flex", flex: "none", marginTop: "var(--tasty-size-1)", color: "var(--tasty-accent-danger-raised)" }}><Icon name="alertTriangle" size="var(--tasty-icon-size-md)" /></span>
        <span style={{ minWidth: 0, fontSize: "var(--tasty-font-size-max)", fontWeight: "var(--tasty-font-weight-semibold)", color: "var(--tasty-text-primary)", overflowWrap: "anywhere" }}>{rt("remote.row.close_remote.title", lang, name)}</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--tasty-space-sm)", padding: "var(--tasty-space-sm) var(--tasty-space-md) 0" }}>
        {last && <p style={{ margin: 0, fontSize: "var(--tasty-font-size-body)", lineHeight: "var(--tasty-line-height-ui)", color: "var(--tasty-text-secondary)" }}>{rt("remote.row.close_remote.last", lang)}</p>}
        <p style={{ margin: 0, fontSize: "var(--tasty-font-size-body)", lineHeight: "var(--tasty-line-height-ui)", color: "var(--tasty-text-secondary)" }}>{rt("remote.row.close_remote.body", lang, profile)}</p>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", flexWrap: "wrap", gap: "var(--tasty-space-sm)", padding: "var(--tasty-space-md)" }}>
        <Button variant="ghost">Cancel</Button>
        <Button variant="danger">{rt("remote.row.close_remote.confirm", lang)}</Button>
      </div>
    </div>
  );
}

// ── The saved remote row's menu (the OS menu in the app: order, wording, separators and disabled only) ──
// What each state allows:
//   Connect / Reconnect — disconnected, not connected (a row with a screen in this run says Reconnect)
//   Disconnect          — connected, connecting, reconnecting
//   Close locally       — always
//   Close remote …      — connected only
export function remoteMenuEnabled(state) {
  return {
    connect: state === "disconnected" || state === "not_connected",
    disconnect: state === "connected" || state === "connecting" || state === "reconnecting",
    closeLocal: true,
    closeRemote: state === "connected",
  };
}
// A saved remote row is a mirror added from the GUI: it carries its attach profile. A mirror without one
// (made from the CLI or IPC — an agent mirror) keeps today's menu and tooltip.
export function isSavedRemoteRow(ws) {
  return !!(ws && ws.mirror && ws.remoteProfile);
}
// onAct: called by every enabled item (the menu closes). categories: names to move the row to, or null when off.
export function RemoteRowMenuItems({ state = "connected", lang = "en", categories = null, forceDetach = false, onAct }) {
  const on = remoteMenuEnabled(state);
  return (
    <>
      <MenuItem label="Rename" onClick={onAct} />
      <MenuItem label="Change Subtitle" onClick={onAct} />
      <MenuItem separator />
      <MenuItem label="Move Up" onClick={onAct} />
      <MenuItem label="Move Down" onClick={onAct} />
      <MenuItem separator />
      <MenuItem label="Save as workspace preset" onClick={onAct} />
      {categories && (
        <>
          <MenuItem separator />
          <MenuItem label="Move to category" disabled />
          {categories.map((c) => <MenuItem key={c} label={c} onClick={onAct} />)}
          <MenuItem separator />
          <MenuItem label="New category" onClick={onAct} />
        </>
      )}
      {forceDetach && (<><MenuItem separator /><MenuItem label="Force detach" onClick={onAct} /></>)}
      <MenuItem separator />
      <MenuItem label={rt(HAS_SHAPE[state] ? "child_graph.reconnect" : "remote.row.popup.connect", lang)} disabled={!on.connect} onClick={on.connect ? onAct : undefined} />
      <MenuItem label={rt("remote.row.menu.disconnect", lang)} disabled={!on.disconnect} onClick={on.disconnect ? onAct : undefined} />
      <MenuItem separator />
      <MenuItem label={rt("remote.row.menu.close_local", lang)} onClick={onAct} />
      <MenuItem label={rt("remote.row.menu.close_remote", lang)} disabled={!on.closeRemote} onClick={on.closeRemote ? onAct : undefined} />
    </>
  );
}

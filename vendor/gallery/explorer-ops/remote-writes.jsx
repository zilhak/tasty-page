import React from "react";
import { IconButton, Button, Input, MenuItem, Kbd, Spinner, Icon } from "../../components/index.js";
import { XCol, XThemes, XToolbar, XCell, XDetail, XROWS, XDragChip } from "./create-drag-search.jsx";
import * as ExplorerOpsY_ns from "./index.jsx";
import * as K from "../parts/explorer-kit.jsx";
import { MIRROR_PILL_LABEL } from "../parts/overlay-frames.jsx";
import { Section, Spec, Stage, Meta, Note, Views, View } from "../parts/specimen.jsx";

// Tasty Gallery — Explorer file operations: remote (attach) explorer writes (2026-10-12, request explorer-remote-write).
// D1 unsupported remote · D2 waiting for the remote reply · D3 connection lost · D4 remote progress / queue · D5 drag chip reasons.
// Loaded before explorer-ops/index.jsx; Y* parts are read from explorer-ops/index.jsx at render time.





const Y = () => ExplorerOpsY_ns;

const REASON = {
  old: { key: "explorer.remote.write_needs_update", en: "Update Tasty on build-eu to change remote files.", ko: "build-eu의 Tasty를 업데이트하면 원격 파일을 바꿀 수 있습니다.", ja: "build-eu の Tasty を更新すると、リモートのファイルを変更できます。", "zh-Hans": "更新 build-eu 上的 Tasty 以更改远程文件。" },
  unsupported: { key: "explorer.state.remote_write_unsupported", en: "This action isn't supported in a mirrored remote explorer yet.", ko: "미러링된 원격 탐색기에서는 이 작업을 아직 지원하지 않습니다.", ja: "ミラーされたリモートエクスプローラーではこの操作をまだサポートしていません。", "zh-Hans": "远程文件浏览器镜像暂不支持此操作。" },
};
// No-host sentences (attach with no profile name: --ssh, --target-port, a profile saved with an
// empty name). New keys next to the explorer.remote ones; all four languages written by Codex.
// The host-free sentence is picked when the host text is empty; the word Remote is not put in
// the sentence and 127.0.0.1:<port> is never shown.
// explorer.remote.lost_body filled with op_copy, as the app fills it (tasty lang/*.toml).
const LOST_BODY_COPY = {"en": "The copy stopped at the item it was on. Some items may already have changed. The folder reloads when the connection is back.", "ko": "복사은(는) 하던 항목에서 멈췄습니다. 일부 항목은 이미 바뀌었을 수 있습니다. 다시 연결되면 폴더를 다시 읽습니다.", "ja": "コピーは処理中の項目で止まりました。一部の項目はすでに変更されている可能性があります。再接続するとフォルダーを再読み込みします。", "zh-Hans": "复制 已在当前处理的项目处停止。部分项目可能已更改。连接恢复后会重新加载文件夹。"};
const NO_HOST = {
  "write_needs_update": { key: "explorer.remote.write_needs_update_no_host", "en": "Update remote Tasty to change remote files.", "ko": "원격 Tasty를 업데이트하면 원격 파일을 바꿀 수 있습니다.", "ja": "リモートの Tasty を更新すると、リモートのファイルを変更できます。", "zh-Hans": "更新远程 Tasty 以更改远程文件。" },
  "waiting": { key: "explorer.remote.waiting_no_host", "en": "Waiting for remote Tasty", "ko": "원격 Tasty 응답 기다리는 중", "ja": "リモートの Tasty の応答を待っています", "zh-Hans": "正在等待远程 Tasty" },
  "renaming": { key: "explorer.remote.renaming_no_host", "en": "Renaming remotely…", "ko": "원격에서 이름 바꾸는 중…", "ja": "リモートで名前を変更中…", "zh-Hans": "正在远程重命名…" },
  "lost_title": { key: "explorer.remote.lost_title_no_host", "en": "Connection to remote Tasty lost · result unknown", "ko": "원격 Tasty 연결이 끊겨 결과를 알 수 없음", "ja": "リモートの Tasty との接続が切れたため結果が不明です", "zh-Hans": "与远程 Tasty 的连接已断开 · 结果未知" },
};
const NH_LANGS = ["en", "ko", "ja", "zh-Hans"];
// D6 reasons: key + en / ko / ja / zh-Hans (all four languages written by Codex). The two paste reasons are today's toast strings.
const MIRROR_REASON = {
  localOnly: { key: "explorer.menu.local_only_reason", en: "This action is only available for files and folders on this computer.", ko: "이 컴퓨터에 있는 파일과 폴더에만 이 작업을 수행할 수 있습니다.", ja: "この操作の対象は、このコンピューター上のファイルとフォルダーに限られます。", "zh-Hans": "此操作仅适用于此计算机上的文件和文件夹。" },
  newTab: { key: "explorer.menu.new_tab_remote_reason", en: "Folders in a mirrored remote explorer can't be opened in a new tab yet.", ko: "미러링된 원격 탐색기의 폴더는 아직 새 탭으로 열 수 없습니다.", ja: "ミラーされたリモートエクスプローラーのフォルダーは、まだ新しいタブで開けません。", "zh-Hans": "暂时无法在新标签页中打开远程文件浏览器镜像中的文件夹。" },
  undo: { key: "explorer.menu.undo_remote_reason", en: "Changes made in a mirrored remote explorer aren't recorded in the undo history, so there's nothing to undo or redo.", ko: "미러링된 원격 탐색기에서 변경한 내용은 실행 취소 기록에 남지 않아 실행 취소하거나 다시 실행할 수 없습니다.", ja: "ミラーされたリモートエクスプローラーでの変更は取り消し履歴に記録されないため、元に戻したりやり直したりできません。", "zh-Hans": "在远程文件浏览器镜像中所做的更改不会记入撤销历史，因此没有可撤销或重做的操作。" },
  pasteRemote: { key: "explorer.state.remote_paste_unsupported", en: "Files copied in a mirrored remote explorer can't be pasted yet." },
  pasteCross: { key: "explorer.state.cross_computer_paste_unsupported", en: "Files copied on this computer can't be pasted into a remote folder yet." },
};
// A reason tooltip drawn open, in place (the OS draws it in the app). Same tokens as the shared Tooltip bubble
// (components/feedback/Tooltip.jsx), laid out in the flow instead of absolutely, so a frame shows it without hover.
function Tip({ children }) {
  return <div role="tooltip" style={{ width: "max-content", maxWidth: "var(--tasty-tooltip-max-width)", padding: "var(--tasty-tooltip-padding-y) var(--tasty-tooltip-padding-x)", background: "var(--tasty-tooltip-bg)", border: "var(--tasty-border-width) solid var(--tasty-tooltip-border)", borderRadius: "var(--tasty-tooltip-radius)", boxShadow: "var(--tasty-tooltip-shadow)", fontFamily: "var(--tasty-font-ui)", fontSize: "var(--tasty-tooltip-font-size)", color: "var(--tasty-tooltip-fg)", lineHeight: "var(--tasty-tooltip-line-height)" }}>{children}</div>;
}
// Remote host mark for the progress line + queue: remote glyph + host, workspace-mirror-fg (accent-remote).
// The host text follows the host text rule (Dialogs › File handler › Remote path): the attach
// profile name (R-57). With no profile name (--ssh or --target-port from the CLI or IPC, a
// profile saved with an empty name) name is empty and the mark holds attach.mirror_pill_label
// ("Remote") in the label font, same ink; never 127.0.0.1:<port>.
function Host({ name = "build-eu", lang = "en" }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "var(--tasty-workspace-mirror-gap)", flex: "none", fontFamily: "var(--tasty-font-mono)", fontSize: "var(--tasty-font-size-caption)", color: "var(--tasty-workspace-mirror-fg)" }}>
      <Icon name="remote" size="var(--tasty-workspace-mirror-icon-size)" />
      {name || <span data-explorer-remote-host="none" lang={lang} style={{ fontFamily: "var(--tasty-font-label)" }}>{MIRROR_PILL_LABEL[lang] || MIRROR_PILL_LABEL.en}</span>}
    </span>
  );
}
// explorer.remote.queue_title, the app catalog's values (tasty lang/*.toml); the {} is the host mark.
const QUEUE_TITLE = { en: "On {} · one at a time", ko: "{} · 한 번에 하나씩", ja: "{} · 一度に 1 件", "zh-Hans": "在 {} 上 · 每次一项" };
function QueueHead({ name = "build-eu", lang = "en" }) {
  const [before, after] = (QUEUE_TITLE[lang] || QUEUE_TITLE.en).split("{}");
  return (
    <div lang={lang} style={{ display: "flex", alignItems: "center", gap: "var(--tasty-explorer-remote-queue-head-gap)", padding: "var(--tasty-space-xs) var(--tasty-space-sm)", fontSize: "var(--tasty-font-size-caption)", color: "var(--tasty-text-muted)" }}>
      {before.trim() && <span>{before.trim()}</span>}<Host name={name} lang={lang} />{after.trim() && <span>{after.trim()}</span>}
    </div>
  );
}
function PendingDetailRow({ glyph = K.ic.folder, value }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 132px 92px", alignItems: "center", height: "var(--tasty-table-cell-height)", padding: "0 10px", background: "var(--tasty-surface-active)" }}>
      <span style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
        <span style={{ display: "inline-flex", flex: "none", color: "var(--tasty-text-secondary)" }}>{glyph}</span>
        <span style={{ flex: 1, minWidth: 0 }}><Input block readOnly defaultValue={value} /></span>
        <span style={{ display: "inline-flex", flex: "none", color: "var(--tasty-text-muted)" }} title="Waiting for build-eu"><Spinner size="var(--tasty-icon-size-sm)" /></span>
      </span>
      <span /><span /><span />
    </div>
  );
}
function RenamePending({ lang = "en", idle = false, noHost = false }) {
  const t = [...{ en: ["Rename", "Renaming on build-eu…", "Cancel", "Rename"], ko: ["이름 바꾸기", "build-eu에서 이름 바꾸는 중…", "취소", "이름 바꾸기"], ja: ["名前の変更", "build-eu で名前を変更中…", "キャンセル", "名前を変更"] }[lang]];
  if (noHost) t[1] = NO_HOST.renaming[lang];
  return (
    <div style={{ width: "var(--tasty-size-360)", maxWidth: "100%", background: "var(--tasty-dialog-bg)", border: "var(--tasty-border-width) solid var(--tasty-border-strong)", borderRadius: "var(--tasty-radius)", boxShadow: "var(--tasty-shadow-modal)", padding: "var(--tasty-space-md) var(--tasty-size-14)", display: "flex", flexDirection: "column", gap: "var(--tasty-space-sm)" }}>
      <span style={{ fontSize: "var(--tasty-font-size-body)", fontWeight: "var(--tasty-font-weight-semibold)", color: "var(--tasty-text-primary)" }}>{t[0]}</span>
      <Input block readOnly={!idle} defaultValue="report-final.pdf" />
      <span style={{ display: "flex", alignItems: "center", gap: "var(--tasty-space-sm)", minHeight: "var(--tasty-icon-size-sm)", fontSize: "var(--tasty-font-size-caption)", color: "var(--tasty-text-muted)" }}>{idle ? <>Press <Kbd keys="↵" /> to confirm, <Kbd keys="Esc" /> to cancel.</> : <><Spinner size="var(--tasty-icon-size-sm)" />{t[1]}</>}</span>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--tasty-space-sm)" }}><Button variant="ghost" size="sm" disabled={!idle}>{t[2]}</Button><Button variant="primary" size="sm" disabled={!idle}>{t[3]}</Button></div>
    </div>
  );
}
function RemoteQueue({ host = "build-eu" }) {
  const row = (title, sub, run) => (
    <div style={{ display: "flex", alignItems: "center", gap: "var(--tasty-space-sm)", minHeight: "var(--tasty-menu-item-height)", padding: "var(--tasty-space-xs) var(--tasty-space-sm)" }}>
      <span style={{ display: "inline-flex", flex: "none", color: "var(--tasty-text-muted)" }}>{run ? <Spinner size="var(--tasty-icon-size-sm)" /> : <Icon name="layers" size="var(--tasty-icon-size-sm)" />}</span>
      <span style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <span style={{ fontSize: "var(--tasty-font-size-body)", color: "var(--tasty-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</span>
        <span style={{ fontSize: "var(--tasty-font-size-caption)", color: "var(--tasty-text-muted)" }}>{sub}</span>
      </span>
      <IconButton size="sm" aria-label={run ? "Cancel" : "Remove from queue"} title={run ? "Cancel" : "Remove from queue"}>{K.ic.x}</IconButton>
    </div>
  );
  return (
    <div style={{ position: "absolute", right: "var(--tasty-space-sm)", bottom: "calc(var(--tasty-status-bar-height) + var(--tasty-space-xs))", width: "var(--tasty-size-288)", background: "var(--tasty-menu-bg)", border: "var(--tasty-border-width) solid var(--tasty-menu-border)", borderRadius: "var(--tasty-menu-radius)", boxShadow: "var(--tasty-shadow-popover)", padding: "var(--tasty-space-xs)" }}>
      <QueueHead name={host} />
      {row("Copy 6 items to logs/archive", "2 of 6 · 14 / 52 MB", true)}
      {row("Move to Trash 3 items", "Queued", false)}
    </div>
  );
}

function RemoteWriteSection() {
  const { YResult, YProgressStatus, YStatusRight, YToastAt } = Y();
  const remoteTb = <XToolbar path="/home/alice/logs" />;
  return (
    <Section id="remotewrite" title="Remote explorer — writes that differ from local">
      <Spec id="d1-a-remote-that-can-t-write-rows-shown-disabled-reason-in-the-t" title="D1 · A remote that can't write — rows shown disabled, reason in the tooltip and toast"
        when={<>A remote running a new Tasty shows the write rows exactly like local. A remote that <b>can't</b> write (its server doesn't announce remote writes, as an older Tasty, or the connection is gone) now <b>shows the rows disabled</b> (option b) instead of hiding them. Reason: the rows tell the user the command exists and where it went; hiding them made the menu look broken next to a writable remote in the next cell. The native menu can only grey a row and add a tooltip (Linux, macOS); Windows shows no tooltip, so the shortcut path keeps the <b>toast</b>, and the toast now names the reason. Two reasons, two strings: an older Tasty on the host gets the update hint, any other refusal (no connection details, a connection that is closing) the general “not supported in a mirror yet” line. The toolbar create group follows the same rule (disabled, tooltip = reason), the same way a local folder without write access does.</>}>
        <Stage variant="solo center" style={{ padding: 20, background: "var(--tasty-bg-app)", gap: 18, flexWrap: "wrap", alignItems: "flex-start" }}>
          <K.CtxMenu title="Writable remote (new Tasty)">
            <MenuItem label="Copy path" icon={K.ic.link} />
            <MenuItem label="Copy" icon={K.ic.copy} shortcut={<Kbd keys="Ctrl+C" />} />
            <MenuItem label="Cut" icon={K.ic.scissors} shortcut={<Kbd keys="Ctrl+X" />} />
            <MenuItem label="Paste into" icon={K.ic.paste} />
            <MenuItem separator />
            <MenuItem label="New folder" icon={<Icon name="folderPlus" />} />
            <MenuItem label="New file" icon={<Icon name="filePlus" />} />
            <MenuItem label="Rename" icon={K.ic.rename} />
            <MenuItem label="Move to Trash" icon={K.ic.trash} danger />
          </K.CtxMenu>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--tasty-space-sm)" }}>
            <K.CtxMenu title="Remote that can't write — disabled">
              <MenuItem label="Copy path" icon={K.ic.link} />
              <MenuItem label="Copy" icon={K.ic.copy} shortcut={<Kbd keys="Ctrl+C" />} />
              <MenuItem label="Cut" icon={K.ic.scissors} disabled />
              <MenuItem label="Paste into" icon={K.ic.paste} disabled />
              <MenuItem separator />
              <MenuItem label="New folder" icon={<Icon name="folderPlus" />} disabled />
              <MenuItem label="New file" icon={<Icon name="filePlus" />} disabled />
              <MenuItem label="Rename" icon={K.ic.rename} disabled />
              <MenuItem label="Move to Trash" icon={K.ic.trash} disabled />
            </K.CtxMenu>
            <Tip>{REASON.old.en}</Tip>
          </div>
          <XCol label="toolbar · can't write — create disabled" w={560}><div style={{ border: "var(--tasty-border-width) solid var(--tasty-border-default)", borderRadius: "var(--tasty-radius)", overflow: "hidden" }}><XToolbar denied deniedReason={REASON.old.en} path="/home/alice/logs" /></div></XCol>
          <XCol label="shortcut on a remote that can't write — toast (en · ko · ja)" w={340}>
            <XThemes gap="var(--tasty-space-sm)" render={() => (
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--tasty-space-sm)", width: "var(--tasty-toast-max-width)", maxWidth: "100%" }}>
                <YResult variant="info" title={REASON.old.en} />
                <YResult variant="info" title={REASON.unsupported.ko} />
                <YResult variant="info" title={REASON.unsupported.ja} />
              </div>
            )} />
          </XCol>
        </Stage>
        <Views>
          <View name="remote-write-reason-no-profile" label="No profile name (--ssh or --target-port from the CLI or IPC) — the older-Tasty reason with no host, as tooltip and toast, every language">
            <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--tasty-space-md)", alignItems: "flex-start" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--tasty-space-sm)" }}>{NH_LANGS.map((l) => <Tip key={l}><span lang={l}>{NO_HOST.write_needs_update[l]}</span></Tip>)}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--tasty-space-sm)", width: "var(--tasty-toast-max-width)", maxWidth: "100%" }}>{NH_LANGS.map((l) => <YResult key={l} variant="info" title={<span lang={l}>{NO_HOST.write_needs_update[l]}</span>} />)}</div>
            </div>
          </View>
        </Views>
        <Meta
          specs={[["choice", "(b) show disabled · tooltip = reason (Linux / macOS)"], ["rows", "Cut · Paste · New folder · New file · Rename · Move to Trash"], ["read rows", "Copy path · Copy · Open stay enabled"], ["toolbar", "create group disabled · tooltip = reason"], ["shortcut", "info toast in the cell · the same reason string"], ["reasons", "host doesn't announce remote writes (older Tasty) → explorer.remote.write_needs_update · any other refusal (no connection details, closing) → explorer.state.remote_write_unsupported"], ["no host", "no profile name (--ssh, --target-port, a profile saved with an empty name) → explorer.remote.write_needs_update_no_host() · never 127.0.0.1:<port>"]]}
          tokens={[{ tok: "--tasty-state-disabled-fg", use: "disabled row / button", color: "var(--tasty-state-disabled-fg)" }, { tok: "--tasty-toast-accent-info", use: "reason toast", color: "var(--tasty-toast-accent-info)" }]} />
        <Note>i18n: <code>explorer.remote.write_needs_update</code> “Update Tasty on {"{host}"} to change remote files.” / “{"{host}"}의 Tasty를 업데이트하면 원격 파일을 바꿀 수 있습니다.” / “{"{host}"} の Tasty を更新すると、リモートのファイルを変更できます。” / “更新 {"{host}"} 上的 Tasty 以更改远程文件。” · <code>explorer.state.remote_write_unsupported</code> “This action isn't supported in a mirrored remote explorer yet.” / “미러링된 원격 탐색기에서는 이 작업을 아직 지원하지 않습니다.” / “ミラーされたリモートエクスプローラーではこの操作をまだサポートしていません。” / “远程文件浏览器镜像暂不支持此操作。”. Both keys exist today; no new key. The general key stays as the fallback for every refusal that isn't an older Tasty. Tooltip and toast share the key, in the same order as D6's reason order.</Note>
      </Spec>

      <Spec id="d2-waiting-for-the-remote-the-input-row-stays-read-only-with-a-s" title="D2 · Waiting for the remote — the input row stays, read-only, with a spinner"
        when={<>Local creates the item at once; a remote needs a round trip. After <span className="ic">↵</span> the <b>input row stays where it is</b>, the field turns <b>read-only</b> (text kept, so the user sees what was sent) and a <b>Spinner</b> takes the trailing slot. Nothing moves, so a fast reply looks like the local flow and a slow one still shows that work is in progress. On success the row becomes the real item at its sorted place, selected. On failure the field becomes editable again with the text kept, and the error toast shows as today. <span className="ic">Esc</span> does nothing while waiting: the request is already on the remote. The <b>Rename popup</b> works the same way: it stays open, field read-only, a “Renaming on {"{host}"}…” line with a Spinner, both buttons disabled; it closes on success.</>}>
        <Stage variant="solo center" style={{ padding: 20, background: "var(--tasty-bg-app)", gap: 18, flexWrap: "wrap", alignItems: "flex-start" }}>
          <XCol label="new folder · waiting for build-eu" w={480}>
            <XCell w={480} h={210} toolbar={remoteTb} status="5 items"><XDetail rows={XROWS.slice(1)} before={<PendingDetailRow value="New folder" />} /></XCell>
          </XCol>
          <XCol label="Rename popup · waiting (en · ko · ja)" w={360}>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--tasty-space-sm)" }}><RenamePending /><RenamePending lang="ko" /><RenamePending lang="ja" /></div>
          </XCol>
        </Stage>
        <Views>
          <View name="remote-waiting-no-profile" label="No profile name (--ssh or --target-port from the CLI or IPC) — the spinner tooltip and the Rename popup line with no host, every language">
            <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--tasty-space-md)", alignItems: "flex-start" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--tasty-space-sm)" }}>{NH_LANGS.map((l) => <Tip key={l}><span lang={l}>{NO_HOST.waiting[l]}</span></Tip>)}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--tasty-space-sm)" }}>
                <RenamePending noHost /><RenamePending lang="ko" noHost /><RenamePending lang="ja" noHost />
                <span lang="zh-Hans" style={{ display: "flex", alignItems: "center", gap: "var(--tasty-space-sm)", fontSize: "var(--tasty-font-size-caption)", color: "var(--tasty-text-muted)" }}><Spinner size="var(--tasty-icon-size-sm)" />{NO_HOST.renaming["zh-Hans"]}</span>
              </div>
            </div>
          </View>
        </Views>
        <Meta
          specs={[["input row", "stays in place · Input readOnly · text kept"], ["indicator", "Spinner icon-size-sm · trailing slot · tooltip “Waiting for {host}”"], ["Esc / blur", "ignored while waiting"], ["success", "row → item at its sorted place, selected"], ["failure", "field editable again, text kept · error toast (unchanged)"], ["Rename popup", "open · field readOnly · Spinner line · Cancel + Rename disabled · closes on success"], ["no host", "no profile name (--ssh, --target-port, a profile saved with an empty name) → explorer.remote.waiting_no_host() · explorer.remote.renaming_no_host() · never 127.0.0.1:<port>"]]}
          tokens={[{ tok: "--tasty-input-readonly-fg", use: "sent text", color: "var(--tasty-input-readonly-fg)" }, { tok: "--tasty-spinner-indicator", use: "waiting", color: "var(--tasty-spinner-indicator)" }]} />
        <Note>i18n: <code>explorer.remote.waiting</code> “Waiting for {"{host}"}” / “{"{host}"} 응답 기다리는 중” / “{"{host}"} の応答を待っています” · <code>explorer.remote.renaming</code> “Renaming on {"{host}"}…” / “{"{host}"}에서 이름 바꾸는 중…” / “{"{host}"} で名前を変更中…”.</Note>
      </Spec>


      <Spec id="rename-popup-the-read-only-field-against-the-popup-ground" title="Rename popup — the read-only field against the popup ground"
        when={<>The rename popup (workspace · tab · category · explorer item) is a <b>dialog</b>: its ground is <span className="tok">--tasty-dialog-bg</span> → <code>bg-panel</code>, the same as every frame on Overlays › Dialogs. It is <b>not</b> the popover ground <code>surface-raised</code>. On <code>bg-panel</code> the read-only field keeps its normal neutral box (<code>state-disabled-fill</code> → surface-raised, <code>state-disabled-border</code> → border-default) and its edge reads. The waiting state changes only the ink and the buttons, never the box. Inputs that really sit on <code>surface-raised</code> (menus, banners, popovers) pass <code>ground="raised"</code>: every state steps the box down to <code>bg-panel</code> with a <code>border-strong</code> edge.</>}>
        <Stage variant="solo center" style={{ padding: 20, background: "var(--tasty-bg-app)", gap: 18, flexWrap: "wrap", alignItems: "flex-start" }}>
          <XThemes gap="var(--tasty-space-md)" render={() => (
            <div style={{ display: "flex", gap: "var(--tasty-space-md)", flexWrap: "wrap" }}>
              <XCol label="normal" w={360}><RenamePending idle /></XCol>
              <XCol label="waiting — field read-only" w={360}><RenamePending /></XCol>
            </div>
          )} />
          <XThemes gap="var(--tasty-space-md)" render={() => (
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--tasty-space-sm)", width: "var(--tasty-size-360)", maxWidth: "100%" }}>
              {[["on surface-raised · default ground — box vanishes (don't)", "panel"], ["on surface-raised · ground=\"raised\"", "raised"]].map(([cap, g]) => (
                <div key={g} style={{ display: "flex", flexDirection: "column", gap: "var(--tasty-space-xs)" }}>
                  <span style={{ fontFamily: "var(--tasty-font-mono)", fontSize: "var(--tasty-font-size-micro)", color: "var(--tasty-text-muted)" }}>{cap}</span>
                  <div style={{ display: "flex", flexDirection: "column", gap: "var(--tasty-space-sm)", padding: "var(--tasty-space-md)", background: "var(--tasty-surface-raised)", border: "var(--tasty-border-width) solid var(--tasty-menu-border)", borderRadius: "var(--tasty-radius)" }}>
                    <Input block ground={g} defaultValue="editable" />
                    <Input block ground={g} readOnly defaultValue="read-only · report-final.pdf" />
                    <Input block ground={g} disabled defaultValue="disabled" />
                  </div>
                </div>
              ))}
            </div>
          )} />
        </Stage>
        <Meta
          specs={[["rename popup ground", "dialog-bg → bg-panel (was surface-raised in the product)"], ["field · waiting", "Input readOnly · state-disabled-fill (surface-raised) + border-default on bg-panel"], ["field · normal", "Input · input-bg + input-border"], ["on surface-raised", "Input ground=\"raised\" · bg-panel + border-strong · all states"], ["disabled on raised", "state-disabled-fill-raised + state-disabled-border-raised"], ["ink", "unchanged: readonly text-secondary · disabled text-disabled"]]}
          tokens={[{ tok: "--tasty-dialog-bg", use: "→ bg-panel", color: "var(--tasty-dialog-bg)" }, { tok: "--tasty-input-readonly-bg", use: "→ state-disabled-fill", color: "var(--tasty-input-readonly-bg)" }, { tok: "--tasty-input-raised-bg", use: "→ bg-panel", color: "var(--tasty-input-raised-bg)" }, { tok: "--tasty-input-raised-border", use: "→ border-strong", color: "var(--tasty-input-raised-border)" }, { tok: "--tasty-input-readonly-raised-bg", use: "→ state-disabled-fill-raised", color: "var(--tasty-input-readonly-raised-bg)" }, { tok: "--tasty-input-readonly-raised-border", use: "→ state-disabled-border-raised", color: "var(--tasty-input-readonly-raised-border)" }]} />
        <Note>The editable field keeps <code>input-bg</code> (surface-raised) like every dialog Input. The product's current crust fill for the editable rename field is not a token value; align it to <code>input-bg</code> when the ground moves to <code>dialog-bg</code>.</Note>
      </Spec>

      <Spec id="d3-connection-lost-result-unknown" title="D3 · Connection lost — result unknown"
        when={<>When the link drops mid-job or while a conflict question is open, the remote stops at the item it was on and this side never gets the report. The result card says exactly that: <b>warning</b> tone, it <b>stays until dismissed</b>, and it does <b>not</b> claim that nothing changed. There is no Retry and no Undo (the current state is unknown, so neither can be offered honestly); the only control is ×. A second line says the folder will be read again on reconnect, because that is when the user can see what happened. An open conflict popup for that job closes with it.</>}>
        <Stage variant="solo center" style={{ padding: 20, background: "var(--tasty-bg-app)", gap: 18, flexWrap: "wrap", alignItems: "flex-start" }}>
          <XCol label="in place" w={480}>
            <XCell w={480} h={230} toolbar={remoteTb} status="Disconnected from build-eu" overlay={<YToastAt><YResult variant="warning" title={<><div>Connection to build-eu lost · result unknown</div><div style={{ marginTop: "var(--tasty-space-xs)", fontSize: "var(--tasty-font-size-caption)", color: "var(--tasty-text-secondary)" }}>The copy stopped at the item it was on. Some items may already have changed. The folder reloads when the connection is back.</div></>} /></YToastAt>}><XDetail /></XCell>
          </XCol>
          <XThemes gap="var(--tasty-space-md)" render={() => (
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--tasty-space-sm)", width: "var(--tasty-toast-max-width)", maxWidth: "100%" }}>
              <YResult variant="warning" title={<><div>build-eu 연결이 끊겨 결과를 알 수 없음</div><div style={{ marginTop: "var(--tasty-space-xs)", fontSize: "var(--tasty-font-size-caption)", color: "var(--tasty-text-secondary)" }}>복사는 하던 항목에서 멈췄습니다. 일부 항목은 이미 바뀌었을 수 있습니다. 다시 연결되면 폴더를 다시 읽습니다.</div></>} />
              <YResult variant="warning" title={<><div>build-eu との接続が切れたため結果が不明です</div><div style={{ marginTop: "var(--tasty-space-xs)", fontSize: "var(--tasty-font-size-caption)", color: "var(--tasty-text-secondary)" }}>コピーは処理中の項目で止まりました。一部の項目はすでに変更されている可能性があります。再接続するとフォルダーを再読み込みします。</div></>} />
            </div>
          )} />
        </Stage>
        <Views>
          <View name="remote-lost-no-profile" label="No profile name (--ssh or --target-port from the CLI or IPC) — the title with no host and the unchanged body, every language">
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--tasty-space-sm)", width: "var(--tasty-toast-max-width)", maxWidth: "100%" }}>
              <YResult variant="warning" title={<><div>{NO_HOST.lost_title.en}</div><div style={{ marginTop: "var(--tasty-space-xs)", fontSize: "var(--tasty-font-size-caption)", color: "var(--tasty-text-secondary)" }}>The copy stopped at the item it was on. Some items may already have changed. The folder reloads when the connection is back.</div></>} />
              {NH_LANGS.slice(1).map((l) => <YResult key={l} variant="warning" title={<div lang={l}><div>{NO_HOST.lost_title[l]}</div><div style={{ marginTop: "var(--tasty-space-xs)", fontSize: "var(--tasty-font-size-caption)", color: "var(--tasty-text-secondary)" }}>{LOST_BODY_COPY[l]}</div></div>} />)}
            </div>
          </View>
        </Views>
        <Meta
          specs={[["tone", "warning · stays until dismissed"], ["title", "“Connection to {host} lost · result unknown”"], ["no host", "no profile name (--ssh, --target-port, a profile saved with an empty name) → explorer.remote.lost_title_no_host() · body unchanged (its {} is the operation) · never 127.0.0.1:<port> · the card is the remote file operation's result-unknown card, kept until dismissed · whether it stays depends on the saved row, not the name: a profile saved with an empty name has a saved row, which goes to reconnect on a drop, so its card stays as usual; an attach with no saved row (--ssh, --target-port) is cleaned up after a drop, so its card shows only for the few frames before that cleanup, when the link fails while a result is awaited"], ["body", "caption · text-secondary · stopped at the item · may have changed · reload on reconnect"], ["actions", "× only — no Retry, no Undo"], ["conflict popup", "closes with the job"], ["verb", "{op} = copy / move / move to Trash / rename / new folder / new file"]]}
          tokens={[{ tok: "--tasty-toast-accent-warning", use: "card", color: "var(--tasty-toast-accent-warning)" }]} />
        <Note>i18n: <code>explorer.remote.lost_title</code> “Connection to {"{host}"} lost · result unknown” / “{"{host}"} 연결이 끊겨 결과를 알 수 없음” / “{"{host}"} との接続が切れたため結果が不明です” · <code>explorer.remote.lost_body</code> “The {"{op}"} stopped at the item it was on. Some items may already have changed. The folder reloads when the connection is back.” / “{"{op}"}은(는) 하던 항목에서 멈췄습니다. 일부 항목은 이미 바뀌었을 수 있습니다. 다시 연결되면 폴더를 다시 읽습니다.” / “{"{op}"}は処理中の項目で止まりました。一部の項目はすでに変更されている可能性があります。再接続するとフォルダーを再読み込みします。”</Note>
      </Spec>

      <Spec id="d4-remote-progress-line-and-queue-host-shown" title="D4 · Remote progress line and queue — host shown"
        when={<>A remote job uses the same status line, bar and Cancel. The host is shown at the <b>start of the line</b> (remote glyph + host, <span className="tok">--tasty-workspace-mirror-fg</span>), because remote work waits in its own queue and runs one job at a time per connection; without the mark a slow job looks stuck behind nothing. “+n queued” counts <b>only this cell's remote queue</b>. The queue popover gets a header line “On {"{host}"} · one at a time” and otherwise the same rows. The host in both is the <b>host text</b> and follows the <b>host text rule</b> (Dialogs › File handler › Remote path): the attach profile name (R-57); for an attach with <b>no profile name</b> (<code>--ssh</code> or <code>--target-port</code> from the CLI or IPC, a profile saved with an empty name) the word <b>Remote</b> (<code>attach.mirror_pill_label</code>) in the label font and the same ink, glyph unchanged, never <code>127.0.0.1:&lt;port&gt;</code>. The queue header keeps its key: the word sits in the mark, so the line reads as the glyph-marked remote, not as a machine name.</>}>
        <Stage variant="solo center" style={{ padding: 20, background: "var(--tasty-bg-app)" }}>
          <XThemes render={(l) => (
            <XCell w={520} h={l === "Mocha" ? 290 : 200} toolbar={remoteTb} status={<><Host /><YProgressStatus pct={27} text="Copying 2 of 6 · nginx-access-2026-10-11.log.gz" /></>} statusRight={<YStatusRight bytes="14 / 52 MB" queued={1} />} overlay={l === "Mocha" ? <RemoteQueue /> : null}>
              <XDetail />
            </XCell>
          )} />
        </Stage>
        <Views>
          <View name="explorer-remote-progress-no-profile" label="No profile name (--ssh or --target-port from the CLI or IPC) — the word Remote in the progress line's mark and the queue header, then the header in every language">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "flex-start" }}>
              <XCell w={520} h={290} toolbar={remoteTb} status={<><Host name="" /><YProgressStatus pct={27} text="Copying 2 of 6 · nginx-access-2026-10-11.log.gz" /></>} statusRight={<YStatusRight bytes="14 / 52 MB" queued={1} />} overlay={<RemoteQueue host="" />}>
                <XDetail />
              </XCell>
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--tasty-space-sm)", width: "var(--tasty-size-288)", padding: "var(--tasty-space-xs)", background: "var(--tasty-menu-bg)", border: "var(--tasty-border-width) solid var(--tasty-menu-border)", borderRadius: "var(--tasty-menu-radius)" }}>
                {["en", "ko", "ja", "zh-Hans"].map((l) => <QueueHead key={l} name="" lang={l} />)}
              </div>
            </div>
          </View>
        </Views>
        <Meta
          specs={[["host mark", "remote glyph (workspace-mirror-icon-size) + host · mono caption · workspace-mirror-fg · first on the line"], ["host text", "the host text rule (Dialogs › File handler › Remote path): attach profile name (R-57) · never 127.0.0.1:<port>, the local end of the tunnel"], ["no host", "no profile name (--ssh, --target-port, a profile saved with an empty name) → attach.mirror_pill_label in --tasty-font-label, same ink, glyph unchanged · in the progress line's mark and the queue header's mark · queue_title unchanged · the address bar holds the remote absolute path, with or without a profile name"], ["queued", "“+n queued” = this cell's remote queue"], ["queue header", "“On {host} · one at a time” · caption · muted"], ["rest", "same bar · Cancel · rows as local"]]}
          tokens={[{ tok: "--tasty-workspace-mirror-fg", use: "host mark", color: "var(--tasty-workspace-mirror-fg)" }, { tok: "--tasty-workspace-mirror-gap", use: "glyph ↔ host" }]} />
        <Note>i18n: <code>explorer.remote.queue_title</code> “On {"{host}"} · one at a time” / “{"{host}"} · 한 번에 하나씩” / “{"{host}"} · 一度に 1 件”. The host mark has no string of its own: it is the host name, or <code>attach.mirror_pill_label</code> with no profile name.</Note>
      </Spec>

      <Spec id="d5-drag-chip-new-refusal-reasons-conflict-popup-unchanged" title="D5 · Drag chip — new refusal reasons · conflict popup unchanged"
        when={<>Drops inside one remote now work. Two refusals get their own line-2 reason: between this computer and a remote, or between two remotes, says <b>different computer</b>; a remote that can't write no longer says “read-only” (writable remotes exist now) but <b>“this remote can't change files”</b>. The name-conflict popup is used <b>as is</b> for remote jobs.</>}>
        <Stage variant="solo center" style={{ padding: 20, background: "var(--tasty-bg-app)" }}>
          <XThemes render={() => (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "flex-start" }}>
              <XDragChip label="nginx.conf" op="move" target="conf.d" />
              <XDragChip glyph={<Icon name="layers" />} label="3 items" op="refused" reason="different computer" />
              <XDragChip glyph={<Icon name="layers" />} label="3 items" op="refused" reason="this remote can't change files" />
              <XDragChip glyph={<Icon name="layers" />} label="항목 3개" op="refused" reason="다른 컴퓨터" />
              <XDragChip glyph={<Icon name="layers" />} label="3 個の項目" op="refused" reason="別のコンピューター" />
            </div>
          )} />
        </Stage>
        <Meta
          specs={[["inside one remote", "Move to / Copy to as local"], ["local ↔ remote · remote ↔ remote", "refused · “different computer”"], ["remote can't write", "refused · “this remote can't change files”"], ["conflict popup", "unchanged"]]}
          tokens={[{ tok: "--tasty-explorer-drag-refused-fg", use: "refused line", color: "var(--tasty-explorer-drag-refused-fg)" }]} />
        <Note>i18n: <code>explorer.drag.reason.other_computer</code> “different computer” / “다른 컴퓨터” / “別のコンピューター” · <code>explorer.drag.reason.remote</code> changes from “remote folders are read-only” to “this remote can't change files” / “이 원격은 파일을 바꿀 수 없음” / “このリモートはファイルを変更できません”.</Note>
      </Spec>

      <Spec id="d6-rows-a-mirror-can-t-run-shown-disabled" title="D6 · Rows a mirror can't run — shown disabled, reason in the tooltip"
        when={<>In a <b>mirror</b> (remote) cell, rows that work in a local cell but can't run here stay in their place, <b>disabled</b>, instead of being left out: <b>Open in system</b> and <b>Show in Finder / File Explorer / File Manager</b> with their separator, <b>Open in new tab</b> (folder and favorite rows), and <b>Undo · Redo</b> in the empty-area menu (bare labels, as with an empty history). <b>Paste</b> and <b>Paste into</b> are disabled when the clipboard list comes from another source (a mirror's list in a local cell or another connection, a local list in a mirror). A row shows <b>one</b> reason, in the order the shortcut path checks: when the target is a remote that can't write, the write refusal wins over the source reason (<code>explorer.remote.write_needs_update</code> for an older Tasty on the host, otherwise <code>explorer.state.remote_write_unsupported</code>, the same keys the paste shortcut's toast picks), so the tooltip and the toast always agree. One rule picks the reason: a disabled native row carries a <b>reason tooltip</b> (Linux, macOS) when the cause is not on screen, and stays <b>bare</b> when the cause is the plain absence of something (empty history, no selection, nothing held). Every row here is the first kind: a mirror cell looks like a local folder, so a grey row alone reads as broken. Windows popup menus have no item tooltips, and these labels are <b>not swapped</b> for the reason there: unlike a stale Undo (Undo / Redo rows › stale), a bare greyed “Open in system” or “Undo” does not name a step that looks runnable, so Windows shows the same rows without the tooltip, as in D1.</>}>
        <Stage variant="solo center" style={{ padding: "var(--tasty-space-lg)", background: "var(--tasty-bg-app)", gap: "var(--tasty-space-lg)", flexWrap: "wrap", alignItems: "flex-start" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--tasty-space-sm)" }}>
            <K.CtxMenu title="Mirror · one file · Linux">
              <MenuItem label="Copy path" icon={K.ic.link} />
              <MenuItem label="Copy" icon={K.ic.copy} shortcut={<Kbd keys="Ctrl+C" />} />
              <MenuItem label="Cut" icon={K.ic.scissors} shortcut={<Kbd keys="Ctrl+X" />} />
              <MenuItem separator />
              <MenuItem label="Rename" icon={K.ic.rename} />
              <MenuItem label="Move to Trash" icon={K.ic.trash} danger />
              <MenuItem separator />
              <MenuItem label="Open in system" icon={K.ic.external} disabled title={MIRROR_REASON.localOnly.en} />
              <MenuItem label="Show in File Manager" icon={<Icon name="folderOpen" />} disabled title={MIRROR_REASON.localOnly.en} />
              <MenuItem separator />
              <MenuItem label="Properties" icon={<Icon name="info" />} />
            </K.CtxMenu>
            <Tip>{MIRROR_REASON.localOnly.en}</Tip>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--tasty-space-sm)" }}>
            <K.CtxMenu title="Mirror · one folder · top of the menu">
              <MenuItem label="Copy path" icon={K.ic.link} />
              <MenuItem label="Add to favorites" icon={K.ic.star} />
              <MenuItem label="Open in new tab" disabled title={MIRROR_REASON.newTab.en} />
              <MenuItem label="Set as root" />
            </K.CtxMenu>
            <Tip>{MIRROR_REASON.newTab.en}</Tip>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--tasty-space-sm)" }}>
            <K.CtxMenu title="Mirror · favorite row">
              <MenuItem label="Open in new tab" disabled title={MIRROR_REASON.newTab.en} />
              <MenuItem label="Set as root" />
              <MenuItem separator />
              <MenuItem label="Remove from favorites" />
            </K.CtxMenu>
            <Tip>{MIRROR_REASON.newTab.en}</Tip>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--tasty-space-sm)" }}>
            <K.CtxMenu title="Mirror · empty area">
              <MenuItem label="Copy path" icon={K.ic.link} />
              <MenuItem label="Paste" icon={K.ic.paste} shortcut={<Kbd keys="Ctrl+V" />} />
              <MenuItem separator />
              <MenuItem label="Undo" shortcut={<Kbd keys="Ctrl+Z" />} disabled title={MIRROR_REASON.undo.en} />
              <MenuItem label="Redo" shortcut={<Kbd keys="Ctrl+Shift+Z" />} disabled title={MIRROR_REASON.undo.en} />
              <MenuItem separator />
              <MenuItem label="Properties" icon={<Icon name="info" />} />
            </K.CtxMenu>
            <Tip>{MIRROR_REASON.undo.en}</Tip>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--tasty-space-sm)" }}>
            <K.CtxMenu title="Local · empty area · a mirror's list held">
              <MenuItem label="Copy path" icon={K.ic.link} />
              <MenuItem label="Add to favorites" icon={K.ic.star} />
              <MenuItem separator />
              <MenuItem label="Paste" icon={K.ic.paste} shortcut={<Kbd keys="Ctrl+V" />} disabled title={MIRROR_REASON.pasteRemote.en} />
            </K.CtxMenu>
            <Tip>{MIRROR_REASON.pasteRemote.en}</Tip>
            <K.CtxMenu title="Mirror · one folder · a local list held · top of the menu">
              <MenuItem label="Copy path" icon={K.ic.link} />
              <MenuItem label="Add to favorites" icon={K.ic.star} />
              <MenuItem label="Open in new tab" disabled title={MIRROR_REASON.newTab.en} />
              <MenuItem label="Set as root" />
              <MenuItem label="Copy" icon={K.ic.copy} shortcut={<Kbd keys="Ctrl+C" />} />
              <MenuItem label="Cut" icon={K.ic.scissors} shortcut={<Kbd keys="Ctrl+X" />} />
              <MenuItem label="Paste into" icon={K.ic.paste} disabled title={MIRROR_REASON.pasteCross.en} />
            </K.CtxMenu>
            <Tip>{MIRROR_REASON.pasteCross.en}</Tip>
          </div>
        </Stage>
        <Views>
          <View name="mirror-disabled-windows" label="Windows — each menu as on Linux, same rows and separators, no tooltip, labels kept" wide>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--tasty-space-lg)", alignItems: "flex-start" }}>
              <K.CtxMenu title="Mirror · one file">
                <MenuItem label="Copy path" icon={K.ic.link} />
                <MenuItem label="Copy" icon={K.ic.copy} shortcut={<Kbd keys="Ctrl+C" />} />
                <MenuItem label="Cut" icon={K.ic.scissors} shortcut={<Kbd keys="Ctrl+X" />} />
                <MenuItem separator />
                <MenuItem label="Rename" icon={K.ic.rename} />
                <MenuItem label="Move to Trash" icon={K.ic.trash} danger />
                <MenuItem separator />
                <MenuItem label="Open in system" icon={K.ic.external} disabled />
                <MenuItem label="Show in File Explorer" icon={<Icon name="folderOpen" />} disabled />
                <MenuItem separator />
                <MenuItem label="Properties" icon={<Icon name="info" />} />
              </K.CtxMenu>
              <K.CtxMenu title="Mirror · one folder · top of the menu">
                <MenuItem label="Copy path" icon={K.ic.link} />
                <MenuItem label="Add to favorites" icon={K.ic.star} />
                <MenuItem label="Open in new tab" disabled />
                <MenuItem label="Set as root" />
              </K.CtxMenu>
              <K.CtxMenu title="Mirror · favorite row">
                <MenuItem label="Open in new tab" disabled />
                <MenuItem label="Set as root" />
                <MenuItem separator />
                <MenuItem label="Remove from favorites" />
              </K.CtxMenu>
              <K.CtxMenu title="Mirror · empty area">
                <MenuItem label="Copy path" icon={K.ic.link} />
                <MenuItem label="Paste" icon={K.ic.paste} shortcut={<Kbd keys="Ctrl+V" />} />
                <MenuItem separator />
                <MenuItem label="Undo" shortcut={<Kbd keys="Ctrl+Z" />} disabled />
                <MenuItem label="Redo" shortcut={<Kbd keys="Ctrl+Shift+Z" />} disabled />
                <MenuItem separator />
                <MenuItem label="Properties" icon={<Icon name="info" />} />
              </K.CtxMenu>
              <K.CtxMenu title="Local · empty area · a mirror's list held">
                <MenuItem label="Copy path" icon={K.ic.link} />
                <MenuItem label="Add to favorites" icon={K.ic.star} />
                <MenuItem separator />
                <MenuItem label="Paste" icon={K.ic.paste} shortcut={<Kbd keys="Ctrl+V" />} disabled />
              </K.CtxMenu>
              <K.CtxMenu title="Mirror · one folder · a local list held · top of the menu">
                <MenuItem label="Copy path" icon={K.ic.link} />
                <MenuItem label="Add to favorites" icon={K.ic.star} />
                <MenuItem label="Open in new tab" disabled />
                <MenuItem label="Set as root" />
                <MenuItem label="Copy" icon={K.ic.copy} shortcut={<Kbd keys="Ctrl+C" />} />
                <MenuItem label="Cut" icon={K.ic.scissors} shortcut={<Kbd keys="Ctrl+X" />} />
                <MenuItem label="Paste into" icon={K.ic.paste} disabled />
              </K.CtxMenu>
            </div>
          </View>
          <View name="mirror-disabled-reasons-languages" label="New reasons — ko, ja, zh-Hans at the tooltip width" wide>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--tasty-space-lg)", alignItems: "flex-start" }}>
              {["ko", "ja", "zh-Hans"].map((l) => (
                <div key={l} style={{ display: "flex", flexDirection: "column", gap: "var(--tasty-space-sm)" }}>
                  <span style={{ fontSize: "var(--tasty-font-size-caption)", color: "var(--tasty-text-muted)" }}>{l}</span>
                  <Tip>{MIRROR_REASON.localOnly[l]}</Tip>
                  <Tip>{MIRROR_REASON.newTab[l]}</Tip>
                  <Tip>{MIRROR_REASON.undo[l]}</Tip>
                </div>
              ))}
            </div>
          </View>
        </Views>
        <Meta
          specs={[["rule", "a row that waits on the cell's or the clipboard's state is disabled, never left out · a row the target's kind never takes is left out"], ["reason shown", "tooltip when the cause is off screen · bare when it is the plain absence of something (empty history, no selection, nothing held)"], ["Open in system · Show in …", "mirror: both disabled, separator kept · tooltip local_only_reason · several items: Open in system alone, the same"], ["Open in new tab", "mirror folder row and mirror favorite row: disabled in its current place · folder: Copy path · Add to favorites · Open in new tab · Set as root · … · favorite: Open in new tab · Set as root | Remove from favorites · tooltip new_tab_remote_reason"], ["Undo · Redo", "mirror empty area: the group is always there · bare “Undo” / “Redo” disabled, shortcut column kept · both rows tooltip undo_remote_reason"], ["Paste · Paste into", "list from another source: disabled · tooltip = the toast the shortcut already shows (remote_paste_unsupported, cross_computer_paste_unsupported) · empty clipboard stays bare"], ["reason order", "one reason per row, in the shortcut path's order: a target remote that can't write → the write refusal the paste shortcut shows wins, even with a list from another source: an older Tasty on the host → explorer.remote.write_needs_update · any other refusal (no connection details, …) → explorer.state.remote_write_unsupported · else a list from another source → its paste reason · else an empty list → bare"], ["Windows", "the same menus, rows and separators (Views › Windows) · no item tooltips · labels not swapped (the stale Undo keeps its label swap) · the shortcut path keeps its toast"], ["ink", "disabled rows only (OS-drawn) · no reason line in the menu"]]}
          tokens={[{ tok: "--tasty-state-disabled-fg", use: "disabled row (kit; the OS draws it in the app)", color: "var(--tasty-state-disabled-fg)" }, { tok: "--tasty-tooltip-fg", use: "reason tooltip text (Tooltip contract; OS-drawn in the app)", color: "var(--tasty-tooltip-fg)" }, { tok: "--tasty-tooltip-border", use: "reason tooltip edge", color: "var(--tasty-tooltip-border)" }]} />
        <Note>i18n (new, in <code>[explorer.menu]</code>): <code>local_only_reason</code> “{MIRROR_REASON.localOnly.en}” / “{MIRROR_REASON.localOnly.ko}” / “{MIRROR_REASON.localOnly.ja}” / “{MIRROR_REASON.localOnly["zh-Hans"]}” · <code>new_tab_remote_reason</code> “{MIRROR_REASON.newTab.en}” / “{MIRROR_REASON.newTab.ko}” / “{MIRROR_REASON.newTab.ja}” / “{MIRROR_REASON.newTab["zh-Hans"]}” · <code>undo_remote_reason</code> “{MIRROR_REASON.undo.en}” / “{MIRROR_REASON.undo.ko}” / “{MIRROR_REASON.undo.ja}” / “{MIRROR_REASON.undo["zh-Hans"]}”. Reused as is: <code>explorer.state.remote_paste_unsupported</code> and <code>explorer.state.cross_computer_paste_unsupported</code>; tooltip and toast share the key, as in D1. Undo and Redo share <code>undo_remote_reason</code>. Row labels keep their keys: <code>explorer.context_menu.open_in_system</code>, <code>.reveal_finder</code> / <code>.reveal_explorer</code> / <code>.reveal_files</code>, <code>.open_in_new_tab</code>, <code>.set_as_root</code>, <code>.add_to_favorites</code>, <code>.remove_from_favorites</code>, <code>.paste</code>, <code>.paste_into</code>; <code>explorer.menu.undo_none</code>, <code>.redo_none</code>. The new reasons sit in <code>[explorer.menu]</code>, beside the Undo rows.</Note>
      </Spec>
    </Section>
  );
}

export { RemoteWriteSection, Tip };

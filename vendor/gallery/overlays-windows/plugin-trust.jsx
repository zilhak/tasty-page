import React from "react";
import { Button, IconButton, Icon, Tag, Spinner, NotificationItem } from "../../components/index.js";
import { Spec, Stage, Meta, Note, Dont } from "../parts/specimen.jsx";

// Tasty Gallery — Overlays · Windows › Plugins window: unverified plugin warning + explicit add / register
// choice (2026-10-19). Static specimens of
// ui_kits/terminal/overlays/plugins_window.jsx TrustBox + action bar (same copy, same recipe).




const COPY = {
  en: {
    title: "Unverified plugin",
    risk: "Tasty can't confirm who made this plugin or that its files are unchanged. A plugin runs as a program with your account's access: it can read and change your files, use the network, and start other programs. The permissions above only limit what it can ask Tasty to do. Add it only if you trust where it came from.",
    trustKey: "Adding it also trusts this key.",
    cause: { "unknown-key": "It is signed by a key that isn't in your trust store.", "missing-pubkey": "It is signed, but the publisher's public key file (tasty-plugin.toml.pub) is missing or unreadable.", unsigned: "It has no signature.", "signature-error": "Its signature could not be verified against these files." },
    perms: "This publisher is trusted, but this version asks for permissions the trusted version did not have. Review the list above; adding it trusts the new set. These permissions limit what the plugin can ask Tasty to do; they don't isolate the plugin program from your files, network or other programs.",
    cancel: "Cancel", add: "Add anyway", trustAdd: "Trust key & add anyway", adding: "Adding…", register: "Register anyway", registering: "Registering…", grants: "Grants 3 permissions",
  },
  ko: {
    title: "검증되지 않은 플러그인",
    risk: "Tasty는 이 플러그인을 누가 만들었는지, 파일이 바뀌지 않았는지 확인할 수 없습니다. 플러그인은 내 계정 권한으로 실행되는 프로그램이라 파일을 읽고 바꾸거나, 네트워크를 쓰거나, 다른 프로그램을 실행할 수 있습니다. 위 권한 목록은 플러그인이 Tasty에 요청할 수 있는 범위만 제한합니다. 출처를 신뢰할 때만 추가하세요.",
    trustKey: "추가하면 이 키도 신뢰 목록에 들어갑니다.",
    cause: { "unknown-key": "신뢰 목록에 없는 키로 서명되었습니다.", "missing-pubkey": "서명은 있지만 배포자의 공개 키 파일(tasty-plugin.toml.pub)이 없거나 읽을 수 없습니다.", unsigned: "서명이 없습니다.", "signature-error": "이 파일들로 서명을 검증하지 못했습니다." },
    cancel: "취소", add: "그래도 추가", trustAdd: "키 신뢰 후 그래도 추가", adding: "추가하는 중…", register: "그래도 등록", registering: "등록하는 중…", grants: "권한 3개 부여",
  },
  ja: {
    title: "未検証のプラグイン",
    risk: "Tasty はこのプラグインの作成者も、ファイルが改変されていないことも確認できません。プラグインはあなたのアカウントの権限で動くプログラムで、ファイルの読み書き、ネットワークの使用、他のプログラムの起動ができます。上の権限一覧は、プラグインが Tasty に要求できる範囲を制限するだけです。入手元を信頼できる場合にのみ追加してください。",
    trustKey: "追加すると、この鍵も信頼済みになります。",
    cause: { "unknown-key": "信頼済みでない鍵で署名されています。", "missing-pubkey": "署名はありますが、発行者の公開鍵ファイル (tasty-plugin.toml.pub) がないか読み取れません。", unsigned: "署名がありません。", "signature-error": "これらのファイルで署名を検証できませんでした。" },
    cancel: "キャンセル", add: "それでも追加", trustAdd: "鍵を信頼してそれでも追加", adding: "追加中…", register: "それでも登録", registering: "登録中…", grants: "3 個の権限を付与",
  },
};
const KIND = {
  trusted: { tone: "success", glyph: "shieldCheck" },
  "permissions-changed": { tone: "warning", glyph: "alertTriangle", title: "Permissions changed" },
  "unknown-key": { tone: "danger", glyph: "alertCircle", unverified: true, fp: true, trustKey: true },
  "missing-pubkey": { tone: "danger", glyph: "alertCircle", unverified: true, fp: true },
  unsigned: { tone: "danger", glyph: "alertCircle", unverified: true },
  "signature-error": { tone: "danger", glyph: "alertCircle", unverified: true },
};
const FP = "9f2c 4ad1 b770 e3a6  ·  ed25519";
const THEMES = [["Mocha", "mocha"], ["Latte", "latte"]];
const cap = { fontSize: "var(--tasty-font-size-caption)", color: "var(--tasty-text-muted)" };

function FpLine({ value }) {
  return (
    <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "var(--tasty-space-sm)", fontFamily: "var(--tasty-font-mono)", fontSize: "var(--tasty-font-size-caption)", color: "var(--tasty-text-muted)" }}>
      <span style={{ color: "var(--tasty-plugin-trust-body-fg)" }}>fingerprint</span><span style={{ color: "var(--tasty-plugin-trust-body-fg)" }}>{value}</span>
      <IconButton size="sm" aria-label="Copy fingerprint"><Icon name="copy" /></IconButton>
    </div>
  );
}

function TrustBox2({ kind, lang = "en", attention = false }) {
  const k = KIND[kind]; const c = COPY[lang] || COPY.en;
  const acc = "var(--tasty-accent-" + k.tone + ")";
  const box = { display: "flex", flexDirection: "column", gap: "var(--tasty-space-sm)", padding: "var(--tasty-space-md) var(--tasty-size-14)", borderRadius: "var(--tasty-radius)",
    background: "color-mix(in srgb, " + acc + " calc(var(--tasty-tint-fill-alpha) * 100%), transparent)", border: "var(--tasty-border-width) solid color-mix(in srgb, " + acc + " calc(var(--tasty-tint-border-alpha) * 100%), transparent)" };
  if (kind === "trusted") return (
    <div style={{ ...box, flexDirection: "row", alignItems: "center", fontSize: "var(--tasty-font-size-term-sm)" }}>
      <span style={{ display: "inline-flex", flex: "none", color: "var(--tasty-plugin-trust-glyph-success)" }}><Icon name="shieldCheck" size={16} /></span>
      <span style={{ color: "var(--tasty-plugin-trust-body-trusted-fg)" }}>Signed by a <b>trusted publisher</b> — its key is in your trust store.</span>
    </div>
  );
  const p = { margin: 0, fontSize: "var(--tasty-font-size-term-sm)", lineHeight: "var(--tasty-line-height-ui)", color: "var(--tasty-plugin-trust-body-fg)", overflowWrap: "anywhere", textWrap: "pretty" };
  return (
    <div style={box} role={k.unverified ? "alert" : undefined}>
      <div style={{ display: "flex", alignItems: "center", gap: "var(--tasty-space-sm)", color: "var(--tasty-plugin-trust-title-fg)", fontSize: 13, fontWeight: 600 }}>
        <span style={{ display: "inline-flex", flex: "none", color: "var(--tasty-plugin-trust-glyph-" + k.tone + ")" }}><Icon name={k.glyph} size={16} /></span>
        <span>{k.unverified ? c.title : k.title}</span>
      </div>
      {k.unverified ? <><p style={p}>{c.cause[kind]}</p><p style={p}>{c.risk}{k.trustKey && !attention ? " " + c.trustKey : ""}</p></> : <p style={p}>{COPY.en.perms}</p>}
      {k.fp && !attention && <FpLine value={FP} />}
    </div>
  );
}

// action bar: reason/grants left · Cancel (initial focus on unverified) · danger primary
function Bar({ kind, lang = "en", state = "rest", focus = false }) {
  const k = KIND[kind]; const c = COPY[lang] || COPY.en;
  const busy = state === "busy";
  const label = kind === "trusted" ? "Add plugin" : kind === "permissions-changed" ? "Trust & add" : kind === "unknown-key" ? c.trustAdd : c.add;
  return (
    <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "var(--tasty-space-sm)", padding: "var(--tasty-space-md) var(--tasty-size-14)", borderTop: "var(--tasty-border-width) solid var(--tasty-separator)", background: "var(--tasty-bg-panel)" }}>
      <span style={{ flex: "1 1 auto", minWidth: 0, fontSize: "var(--tasty-font-size-caption)", color: "var(--tasty-text-muted)" }}>{c.grants}</span>
      <div style={{ display: "flex", gap: "var(--tasty-space-sm)", marginLeft: "auto" }}>
        {busy && <span style={{ display: "inline-flex", alignItems: "center", gap: "var(--tasty-space-sm)", fontSize: "var(--tasty-font-size-caption)", color: "var(--tasty-text-muted)" }}><Spinner size={14} label={c.adding} />{c.adding}</span>}
        <Button variant="ghost" disabled={busy} style={focus && !busy ? { boxShadow: "0 0 0 var(--tasty-focus-ring-width) var(--tasty-border-focus)" } : undefined}>{c.cancel}</Button>
        <Button variant={k.unverified ? "danger" : "primary"} disabled={busy}>{label}</Button>
      </div>
    </div>
  );
}

function Manifest({ narrow }) {
  return (
    <div style={{ border: "var(--tasty-border-width) solid var(--tasty-border-default)", borderRadius: "var(--tasty-radius)", background: "var(--tasty-surface-raised)", padding: "var(--tasty-space-md)", display: "flex", flexDirection: "column", gap: "var(--tasty-space-sm)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "var(--tasty-space-sm)", flexWrap: "wrap" }}>
        <span style={{ fontSize: "var(--tasty-font-size-max)", fontWeight: 600, color: "var(--tasty-text-primary)", overflowWrap: "anywhere" }}>{narrow ? "logwatch-structured-severity-highlighter" : "logwatch"}</span><Tag>v0.3.1</Tag>
      </div>
      <div style={{ display: "flex", gap: "var(--tasty-space-xs)", flexWrap: "wrap" }}>{["fs:read", "fs:watch", "ipc:logwatch.*"].map((x) => <Tag key={x}>{x}</Tag>)}</div>
      <span style={{ fontFamily: "var(--tasty-font-mono)", fontSize: "var(--tasty-font-size-caption)", color: "var(--tasty-text-secondary)", overflowWrap: "anywhere" }}>{narrow ? "~/dev/plugins/third-party/aurelia/tasty-logwatch-structured-severity-highlighter" : "~/dev/tasty-logwatch"}</span>
    </div>
  );
}

function AddPanel({ kind, lang, state, width = "var(--tasty-size-560)", narrow, focus, ground = "var(--tasty-bg-panel)" }) {
  return (
    <div style={{ width, maxWidth: "100%", display: "flex", flexDirection: "column", background: ground, border: "var(--tasty-border-width) solid var(--tasty-border-default)", borderRadius: "var(--tasty-radius)", overflow: "hidden" }}>
      <div style={{ padding: "var(--tasty-space-md)", display: "flex", flexDirection: "column", gap: "var(--tasty-space-md)" }}>
        <Manifest narrow={narrow} />
        <TrustBox2 kind={kind} lang={lang} />
      </div>
      <Bar kind={kind} lang={lang} state={state} focus={focus} />
    </div>
  );
}

function AttentionDetail({ reason = "unknown-key", state = "rest" }) {
  const busy = state === "busy";
  return (
    <div style={{ width: "var(--tasty-size-440)", maxWidth: "100%", display: "flex", flexDirection: "column", background: "var(--tasty-bg-panel)", border: "var(--tasty-border-width) solid var(--tasty-border-default)", borderRadius: "var(--tasty-radius)", overflow: "hidden" }}>
      <div style={{ padding: "var(--tasty-space-md)", display: "flex", flexDirection: "column", gap: "var(--tasty-space-md)" }}>
        <span style={{ fontSize: "var(--tasty-font-size-max)", color: "var(--tasty-text-primary)" }}>{reason === "unknown-key" ? "fleet-sync" : "remote-shell"}</span>
        <TrustBox2 kind={reason} attention />
        {reason === "unknown-key" && <FpLine value="a13c 4e7f 2b08 9d51  ·  ed25519" />}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "var(--tasty-space-sm)", padding: "var(--tasty-space-md) var(--tasty-size-14)", borderTop: "var(--tasty-border-width) solid var(--tasty-separator)" }}>
        <span style={{ fontSize: 12, color: "var(--tasty-accent-danger-raised)", display: "inline-flex", alignItems: "center", gap: "var(--tasty-space-sm)" }}><span style={{ width: "var(--tasty-status-dot-size)", height: "var(--tasty-status-dot-size)", borderRadius: "50%", background: "var(--tasty-accent-danger)" }} />Not registered</span>
        <div style={{ flex: 1 }} />
        {busy && <span style={{ display: "inline-flex", alignItems: "center", gap: "var(--tasty-space-sm)", fontSize: "var(--tasty-font-size-caption)", color: "var(--tasty-text-muted)" }}><Spinner size={14} label="Registering" />Registering…</span>}
        <Button variant="danger" disabled={busy}>Register anyway</Button>
      </div>
    </div>
  );
}

// Needs attention › reserved id (2026-11-08). A folder in the plugins folder whose manifest id starts with
// com.tasty. but is not on the official id list. It is never registered; the only action is Remove.
// Identity comes from the folder (name) and the id only — no manifest name, author, homepage or description,
// because an unofficial com.tasty.* manifest can word itself as Tasty.
const RESERVED = {
  en: {
    label: "Not an official plugin",
    blurb: "Registration was rejected because its id uses the com.tasty. prefix, which is reserved for official Tasty plugins, and this is not one of them. You can only remove it.",
    descHidden: "Description hidden — it is not an official plugin.",
    folder: "Folder", status: "Not registered", remove: "Remove", cancel: "Cancel", removing: "Removing…",
    confirmTitle: (n) => "Remove " + n + "?", confirmNote: "Its folder is deleted from your plugins folder.",
    noticeTitle: (id) => "Plugin '" + id + "' was not registered",
    noticeBody: "Its id uses the com.tasty. prefix, which is reserved for official Tasty plugins. Remove it from Plugins › Attention.",
  },
  ko: {
    label: "공식 플러그인 아님",
    blurb: "공식 Tasty 플러그인 전용인 com.tasty. 접두를 id로 쓰지만 공식 플러그인이 아니라서 등록하지 못했습니다. 제거만 할 수 있습니다.",
    descHidden: "공식 플러그인이 아니라서 설명을 숨겼습니다.",
    folder: "폴더", status: "등록 안 됨", remove: "제거", cancel: "취소", removing: "제거하는 중…",
    confirmTitle: (n) => n + "을(를) 제거할까요?", confirmNote: "플러그인 폴더에서 이 폴더가 삭제됩니다.",
    noticeTitle: (id) => "플러그인 '" + id + "'을(를) 등록하지 않았습니다",
    noticeBody: "id가 공식 Tasty 플러그인 전용인 com.tasty. 접두를 씁니다. 플러그인 › 확인 필요에서 제거하세요.",
  },
  ja: {
    label: "公式プラグインではありません",
    blurb: "id に公式 Tasty プラグイン専用の com.tasty. 接頭辞を使っていますが、公式プラグインではないため登録できませんでした。削除のみできます。",
    descHidden: "公式プラグインではないため説明を非表示にしています。",
    folder: "フォルダー", status: "未登録", remove: "削除", cancel: "キャンセル", removing: "削除中…",
    confirmTitle: (n) => n + " を削除しますか？", confirmNote: "プラグインフォルダーからこのフォルダーが削除されます。",
    noticeTitle: (id) => "プラグイン '" + id + "' を登録しませんでした",
    noticeBody: "id に公式 Tasty プラグイン専用の com.tasty. 接頭辞を使っています。プラグイン › 確認が必要 から削除してください。",
  },
};
const RESERVED_SAMPLE = { folder: "com.tasty.agent-stream-plus", id: "com.tasty.agent-stream-plus", dir: "~/.tasty/plugins/com.tasty.agent-stream-plus" };
const RESERVED_LONG = { folder: "tasty-official-agent-stream-v2-preview-build", id: "com.tasty.official.agent-stream.v2-preview", dir: "~/.tasty/plugins/tasty-official-agent-stream-v2-preview-build" };
const monoCap = { fontFamily: "var(--tasty-font-mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "var(--tasty-letter-spacing-caps)", color: "var(--tasty-text-muted)" };
const dot = (bg) => <span style={{ flex: "none", width: "var(--tasty-status-dot-size)", height: "var(--tasty-status-dot-size)", borderRadius: "50%", background: bg }} />;

function ReservedAvatar({ name, lg }) {
  const sz = lg ? "lg" : "sm";
  return (
    <span style={{ width: "var(--tasty-plugin-avatar-size-" + sz + ")", height: "var(--tasty-plugin-avatar-size-" + sz + ")", flex: "none", borderRadius: "var(--tasty-plugin-avatar-radius)", display: "inline-flex", alignItems: "center", justifyContent: "center",
      background: "var(--tasty-plugin-avatar-bg)", border: "var(--tasty-plugin-avatar-border-width) solid var(--tasty-plugin-avatar-border)", fontFamily: "var(--tasty-font-mono)", fontWeight: "var(--tasty-plugin-avatar-initial-weight)",
      color: "var(--tasty-plugin-avatar-fg)", fontSize: "var(--tasty-plugin-avatar-initial-font-size-" + sz + ")", lineHeight: 1 }}>{name.charAt(0).toUpperCase()}</span>
  );
}

// list row — same recipe as the other reasons: avatar sm · folder name · mono reason label in danger · danger dot
function ReservedRow({ p = RESERVED_SAMPLE, lang = "en", selected = false }) {
  const c = RESERVED[lang] || RESERVED.en;
  const on = selected;
  return (
    <div style={{ width: "var(--tasty-plugins-list-width)", maxWidth: "100%", padding: "var(--tasty-space-sm)", background: "var(--tasty-bg-sidebar)", borderRadius: "var(--tasty-radius)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "var(--tasty-space-sm)", padding: "var(--tasty-space-sm)", borderRadius: "var(--tasty-radius)",
        background: on ? "var(--tasty-surface-active)" : "transparent", boxShadow: on ? "inset var(--tasty-selection-edge-width) 0 0 var(--tasty-accent-danger)" : "none" }}>
        <ReservedAvatar name={p.folder} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, color: on ? "var(--tasty-text-on-active)" : "var(--tasty-text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.folder}</div>
          <div style={{ fontFamily: "var(--tasty-font-mono)", fontSize: "var(--tasty-font-size-micro)", color: on ? "var(--tasty-text-on-active)" : "var(--tasty-accent-danger-raised)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.label}</div>
        </div>
        {dot("var(--tasty-accent-danger)")}
      </div>
    </div>
  );
}

// detail — identity (folder name · id) → hidden-description line → danger banner → Folder section → action bar
// state: rest (Remove, secondary with danger ink — not focused on selection) · confirm (bar replaced in place,
// Cancel holds focus) · removing (both disabled, Spinner + Removing…)
function ReservedDetail({ p = RESERVED_SAMPLE, lang = "en", state = "rest", width = "var(--tasty-size-560)" }) {
  const c = RESERVED[lang] || RESERVED.en;
  const confirm = state === "confirm" || state === "removing";
  const busy = state === "removing";
  const body = { margin: 0, fontSize: "var(--tasty-font-size-term-sm)", lineHeight: "var(--tasty-line-height-ui)", color: "var(--tasty-plugin-trust-body-fg)", overflowWrap: "anywhere", textWrap: "pretty" };
  const acc = "var(--tasty-accent-danger)";
  return (
    <div style={{ width, maxWidth: "100%", display: "flex", flexDirection: "column", background: "var(--tasty-bg-panel)", border: "var(--tasty-border-width) solid var(--tasty-border-default)", borderRadius: "var(--tasty-radius)", overflow: "hidden" }}>
      <div style={{ padding: "var(--tasty-space-lg)", display: "flex", flexDirection: "column", gap: "var(--tasty-space-lg)" }}>
        <div style={{ display: "flex", gap: "var(--tasty-space-md)", alignItems: "flex-start" }}>
          <ReservedAvatar name={p.folder} lg />
          <div style={{ flex: 1, minWidth: 0 }}>
            <span style={{ fontSize: "var(--tasty-font-size-max)", color: "var(--tasty-text-primary)", overflowWrap: "anywhere" }}>{p.folder}</span>
            <div style={{ marginTop: "var(--tasty-space-xs)", fontFamily: "var(--tasty-font-mono)", fontSize: 11, color: "var(--tasty-text-muted)", overflowWrap: "anywhere" }}>{p.id}</div>
          </div>
        </div>
        <p style={{ margin: 0, fontSize: "var(--tasty-font-size-caption)", color: "var(--tasty-text-muted)" }}>{c.descHidden}</p>
        <div role="alert" style={{ display: "flex", flexDirection: "column", gap: "var(--tasty-space-sm)", padding: "var(--tasty-space-md) var(--tasty-size-14)", borderRadius: "var(--tasty-radius)",
          background: "color-mix(in srgb, " + acc + " calc(var(--tasty-tint-fill-alpha) * 100%), transparent)", border: "var(--tasty-border-width) solid color-mix(in srgb, " + acc + " calc(var(--tasty-tint-border-alpha) * 100%), transparent)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--tasty-space-sm)", color: "var(--tasty-plugin-trust-title-fg)", fontSize: 13, fontWeight: 600 }}>
            <span style={{ display: "inline-flex", flex: "none", color: "var(--tasty-plugin-trust-glyph-danger)" }}><Icon name="alertCircle" size={16} /></span>
            <span>{c.label}</span>
          </div>
          <p style={body}>{c.blurb}</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--tasty-space-sm)", minWidth: 0 }}>
          <div style={monoCap}>{c.folder}</div>
          <span style={{ fontFamily: "var(--tasty-font-mono)", fontSize: "var(--tasty-font-size-caption)", color: "var(--tasty-text-muted)", wordBreak: "break-all", userSelect: "text" }}>{p.dir}</span>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "var(--tasty-space-sm)", padding: "var(--tasty-space-md) var(--tasty-size-14)", borderTop: "var(--tasty-border-width) solid var(--tasty-separator)" }}>
        {!confirm && <>
          <span style={{ fontSize: 12, color: "var(--tasty-accent-danger-raised)", display: "inline-flex", alignItems: "center", gap: "var(--tasty-space-sm)" }}>{dot(acc)}{c.status}</span>
          <div style={{ flex: 1 }} />
          <Button variant="secondary" style={{ color: "var(--tasty-accent-danger-raised)" }}>{c.remove}</Button>
        </>}
        {confirm && <>
          <span style={{ display: "inline-flex", flex: "none", color: "var(--tasty-accent-attention-raised)" }}><Icon name="alertTriangle" size={16} /></span>
          <div style={{ flex: "1 1 auto", minWidth: 0, display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "var(--tasty-font-size-body)", color: "var(--tasty-text-primary)", overflowWrap: "anywhere" }}>{c.confirmTitle(p.folder)}</span>
            <span style={{ fontSize: "var(--tasty-font-size-caption)", color: "var(--tasty-text-muted)" }}>{c.confirmNote}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--tasty-space-sm)", marginLeft: "auto" }}>
            {busy && <span style={{ display: "inline-flex", alignItems: "center", gap: "var(--tasty-space-sm)", fontSize: "var(--tasty-font-size-caption)", color: "var(--tasty-text-muted)" }}><Spinner size={14} label={c.removing} />{c.removing}</span>}
            <Button variant="ghost" disabled={busy} style={!busy ? { boxShadow: "0 0 0 var(--tasty-focus-ring-width) var(--tasty-border-focus)" } : undefined}>{c.cancel}</Button>
            <Button variant="danger" disabled={busy}>{c.remove}</Button>
          </div>
        </>}
      </div>
    </div>
  );
}

function ReservedNotice({ lang = "en", id = RESERVED_SAMPLE.id }) {
  const c = RESERVED[lang] || RESERVED.en;
  return (
    <div style={{ width: "var(--tasty-size-440)", maxWidth: "100%", background: "var(--tasty-bg-panel)", border: "var(--tasty-border-width) solid var(--tasty-border-default)", borderRadius: "var(--tasty-radius)", overflow: "hidden" }}>
      <NotificationItem level="warning" title={c.noticeTitle(id)} body={c.noticeBody} time="now" unread expanded />
    </div>
  );
}

const Themed = ({ attr, children }) => (
  <div data-theme={attr || undefined} style={{ display: "flex", flexDirection: "column", gap: "var(--tasty-space-md)", padding: "var(--tasty-space-md)", background: "var(--tasty-bg-app)", border: "var(--tasty-border-width) solid var(--tasty-border-default)", borderRadius: "var(--tasty-radius)", minWidth: 0 }}>{children}</div>
);

function PluginTrustSpecs() {
  return (
    <>
      <Spec id="plugin-unverified" title="Unverified plugin — warning + explicit Add anyway"
        when={<>Four signature states are now <b>addable by an explicit choice</b>: <b>unknown key</b>, <b>public key file missing</b>, <b>unsigned</b>, <b>signature error</b>. They share one <b>danger</b> trust box: the same title “Unverified plugin”, a <b>cause line</b> that names the actual state, and the same <b>risk paragraph</b> (a plugin is a program with the user's access; the permission list limits only what it can ask Tasty to do). A fingerprint line follows only when a fingerprint exists. The action bar keeps its order; the primary becomes <b>Add anyway</b> (danger fill) — <b>Trust key &amp; add anyway</b> for an unknown key, because adding still trusts that key. <b>Trusted</b> and its flow are unchanged.</>}>
        <Stage variant="solo" style={{ padding: "var(--tasty-space-lg)", background: "var(--tasty-bg-app)", gap: "var(--tasty-space-lg)", flexWrap: "wrap", alignItems: "flex-start" }}>
          {THEMES.map(([label, attr]) => (
            <Themed key={label} attr={attr}>
              <span style={cap}>{label} · Add plugin tab — trust box + action bar per verdict</span>
              {["unknown-key", "missing-pubkey", "unsigned", "signature-error"].map((k) => (
                <div key={k} style={{ display: "flex", flexDirection: "column", gap: "var(--tasty-space-xs)" }}><span style={{ ...cap, fontFamily: "var(--tasty-font-mono)" }}>{k}{k === "unknown-key" ? " · Cancel holds initial focus" : ""}</span><AddPanel kind={k} focus={k === "unknown-key"} /></div>
              ))}
              <span style={{ ...cap, fontFamily: "var(--tasty-font-mono)" }}>trusted · permissions-changed — unchanged flow (contrast reference)</span>
              <AddPanel kind="trusted" />
              <AddPanel kind="permissions-changed" />
            </Themed>
          ))}
        </Stage>
        <Meta
          specs={[["box", "tint-fill + tint-border of the tone · pad 12 / 14 · radius 4 (unchanged recipe)"], ["tone (2026-10-19)", "success trusted · warning permissions changed · danger unverified (all four) — danger now means “at your own risk”, not “blocked”"], ["title", "13/600 text-primary · glyph 16 carries the tone (accent titles failed 4.5:1 in Latte)"], ["cause", "one sentence naming the state · term-sm text-secondary"], ["risk", "shared paragraph · term-sm text-secondary · wraps anywhere"], ["fingerprint", "unknown key · missing .pub only — never invented for unsigned / signature error"], ["bar", "grants left · Cancel (ghost) · Add anyway (danger) right · wraps under on narrow"], ["only blocked state", "Already installed (disabled Add plugin + reason, unchanged)"]]}
          tokens={[{ tok: "--tasty-plugin-trust-title-fg", use: "→ text-primary", color: "var(--tasty-plugin-trust-title-fg)" }, { tok: "--tasty-plugin-trust-body-fg", use: "→ text-secondary", color: "var(--tasty-plugin-trust-body-fg)" }, { tok: "--tasty-plugin-trust-glyph-danger", use: "→ accent-danger", color: "var(--tasty-plugin-trust-glyph-danger)" }, { tok: "--tasty-plugin-trust-glyph-warning", use: "→ accent-warning-glyph (new semantic; Latte remap)", color: "var(--tasty-plugin-trust-glyph-warning)" }, { tok: "--tasty-plugin-trust-glyph-success", use: "→ accent-success", color: "var(--tasty-plugin-trust-glyph-success)" }]} />
        <Note><b>Keyboard and choice.</b> After Verify shows an unverified verdict, <b>initial focus is Cancel</b>; <span className="ic">Enter</span> activates the focused button only, so Enter cancels. There is no implicit default button. <span className="ic">Esc</span> = Cancel (nothing installed, the tab returns to the path field). <span className="ic">Tab</span> moves Cancel → Add anyway. Pointer: one click on Add anyway. Nothing is installed or registered before that click / key. Remembering the choice and re-asking rules are the implementation's, not this design's.</Note>
        <Note><b>Contrast (WCAG relative luminance).</b> Title text-primary on the danger tint: Mocha ≈ 11:1 · Latte ≈ 7:1. Body text-secondary: Mocha ≈ 8:1 · Latte n1000 ≈ 4.7:1. Danger glyph: Latte #d20f39 on tint ≈ 4.1:1 (≥ 3) · Mocha #f38ba8 ≈ 6:1. Warning glyph (permissions changed): Latte before #df8e1d ≈ 2.2:1 → <span className="tok">--tasty-accent-warning-glyph</span> (yellow 50% toward n1100) ≈ 3.6:1. Danger button label: Latte white on #d20f39 5.43:1 · Mocha crust on #f38ba8 ≈ 8:1. Trusted box: see <b>Trusted verdict — contrast (2026-10-27)</b> below (the old “≈ 3.3:1” figure measured neither real ground and is withdrawn).</Note>
      </Spec>

      <Spec id="plugin-trusted-contrast" title="Trusted verdict — contrast on both grounds"
        when={<>After Verify on a folder signed by a trusted key, the box keeps its one line, shield, copy, padding, success tint fill and border. Only the two inks move to a new success <b>ink</b> role: the body to <span className="tok">--tasty-plugin-trust-body-trusted-fg</span>, the shield to <span className="tok">--tasty-plugin-trust-glyph-success</span>, both → <span className="tok">--tasty-accent-success-ink</span>. In Mocha that role is accent-success, so Mocha is pixel-identical; Latte remaps it to green 60% toward black. Each theme is shown on <b>mantle</b> (the host Add tab, panel_fill) and on <b>base</b> (this board's AddPanel). The shield is a hover-only display element; pointing at it adds no tint. Permissions changed and unverified stay as they were (reference rows).</>}>
        <Stage variant="solo" style={{ padding: "var(--tasty-space-lg)", background: "var(--tasty-bg-app)", gap: "var(--tasty-space-lg)", flexWrap: "wrap", alignItems: "flex-start" }}>
          {THEMES.map(([label, attr]) => (
            <Themed key={label} attr={attr}>
              <span style={cap}>{label}</span>
              <span style={{ ...cap, fontFamily: "var(--tasty-font-mono)" }}>trusted · on mantle (host Add tab)</span><AddPanel kind="trusted" ground="var(--tasty-bg-sidebar)" />
              <span style={{ ...cap, fontFamily: "var(--tasty-font-mono)" }}>trusted · on base (board AddPanel)</span><AddPanel kind="trusted" />
              <span style={{ ...cap, fontFamily: "var(--tasty-font-mono)" }}>reference · permissions changed · unknown key (unchanged)</span>
              <AddPanel kind="permissions-changed" ground="var(--tasty-bg-sidebar)" />
              <AddPanel kind="unknown-key" ground="var(--tasty-bg-sidebar)" />
            </Themed>
          ))}
        </Stage>
        <Meta
          specs={[["fill", "accent-success × tint-fill-alpha 0.12 (egui 31/255) — unchanged"], ["border", "accent-success × tint-border-alpha 0.36 — unchanged"], ["body", "term-sm · plugin-trust-body-trusted-fg · target 4.5:1"], ["shield", "16 · plugin-trust-glyph-success · target 3:1 (same goal as the warning / danger trust glyphs)"], ["hover", "no change — the shield is Sense::hover display only"]]}
          tokens={[{ tok: "--tasty-accent-success-ink", use: "new semantic · Mocha → accent-success · Latte green 60% toward black ≈ #26601a", color: "var(--tasty-accent-success-ink)" }, { tok: "--tasty-plugin-trust-body-trusted-fg", use: "new · → accent-success-ink", color: "var(--tasty-plugin-trust-body-trusted-fg)" }, { tok: "--tasty-plugin-trust-glyph-success", use: "was accent-success → accent-success-ink", color: "var(--tasty-plugin-trust-glyph-success)" }, { tok: "--tasty-accent-success", use: "fill + border only (unchanged, global)", color: "var(--tasty-accent-success-raised)" }]} />
        <Note><b>Contrast (WCAG relative luminance, specified colours).</b> Box grounds: Latte mantle+tint #d2e0d7 (CSS 0.12 and egui 31/255 byte path give the same bytes) · base+tint CSS #dae7dd / egui #dae7dc. Latte body and shield, ink #26601a: mantle+tint <b>5.55:1</b> (both methods) · base+tint <b>5.94:1</b> CSS / 5.94:1 egui. Before (#40a02b): 2.45 / 2.62. Mocha (ink = accent-success #a6e3a1, unchanged): mantle+tint 9.02:1 CSS / 8.91:1 egui · base+tint 8.26:1 both. egui path = round(src × 31/255) + dst × (1 − 31/255), rounded per channel.</Note>
        <Note><b>Why a new role.</b> accent-success is shared by many green consumers (status dots, Tags, fills), so it can't change; text-secondary would meet 4.5 but turns Mocha's green line grey. Mixing toward n1100 (the accent-warning-glyph move) greys the green before it clears 4.5 (30% = #486756, 4.59:1), so the Latte remap mixes toward black instead and stays visibly green.</Note>
      </Spec>

      <Spec id="plugin-unverified-states" title="Adding · failure · narrow window · ko / ja · Needs attention › Register anyway"
        when={<>While adding, both buttons are disabled and keep their labels, with a 14 <b>Spinner + “Adding…” beside the buttons, in text-muted</b> — a second click or Enter cannot start a second install. A failure uses the <b>existing result path</b> (toast, buttons back to rest). In a narrow window the bar wraps: reason on its own line, buttons right-aligned under it; long names and paths wrap anywhere. A plugin found in the plugins folder sits in <b>Needs attention</b> with the same box (no fingerprint in the box; the Signature section below keeps it) and a <b>Register anyway</b> danger button. Not clicking it = it stays unregistered; selecting the row never focuses the button.</>}>
        <Stage variant="solo" style={{ padding: "var(--tasty-space-lg)", background: "var(--tasty-bg-app)", gap: "var(--tasty-space-lg)", flexWrap: "wrap", alignItems: "flex-start" }}>
          {THEMES.map(([label, attr]) => (
            <Themed key={label} attr={attr}>
              <span style={cap}>{label}</span>
              <span style={{ ...cap, fontFamily: "var(--tasty-font-mono)" }}>adding — busy, no double add</span><AddPanel kind="unsigned" state="busy" />
              <span style={{ ...cap, fontFamily: "var(--tasty-font-mono)" }}>narrow 320 · long name + path</span><AddPanel kind="missing-pubkey" narrow width="var(--tasty-size-320)" />
              <span style={{ ...cap, fontFamily: "var(--tasty-font-mono)" }}>Needs attention › unknown key</span><AttentionDetail reason="unknown-key" />
              <span style={{ ...cap, fontFamily: "var(--tasty-font-mono)" }}>Needs attention › signature invalid · registering</span><AttentionDetail reason="signature-error" state="busy" />
            </Themed>
          ))}
          <Themed>
            <span style={cap}>Mocha · ko / ja length</span>
            <AddPanel kind="unknown-key" lang="ko" width="var(--tasty-size-440)" />
            <AddPanel kind="signature-error" lang="ja" width="var(--tasty-size-440)" />
          </Themed>
        </Stage>
        <Meta specs={[["busy", "Cancel + primary disabled, labels unchanged · Spinner 14 + Adding… / Registering… beside them, caption, text-muted"], ["failure", "existing toast · buttons back to rest · verdict stays"], ["narrow", "bar flex-wrap · reason flex 1 · buttons margin-left auto"], ["attention", "same box (no fingerprint inside) · Signature section keeps fingerprint · Register anyway danger · no auto focus"], ["permissions changed", "copy adds the isolation limit · Re-approve flow unchanged"]]} />
        <Note>English is the source copy. ko / ja above are the meaning reference for translators (keys: <code>plugins.trust.unverified_title</code> · <code>…unverified_risk</code> · <code>…cause_unknown_key / _missing_pubkey / _unsigned / _signature_error</code> · <code>…trust_key_note</code> · <code>plugins.add.add_anyway</code> · <code>…trust_add_anyway</code> · <code>…adding</code> · <code>plugins.attention.register_anyway</code> · <code>…registering</code>).</Note>
        <Dont><b>Don't</b> say the plugin was reviewed, certified or sandboxed, and don't let Enter on a freshly shown verdict install it.</Dont>
      </Spec>

      <Spec id="plugin-reserved-id" title="Needs attention › reserved id — not an official plugin, remove only"
        when={<>A folder in the plugins folder whose id starts with <code>com.tasty.</code> but is not on the official id list is never registered. It sits in <b>Needs attention</b> as a fifth reason, <b>danger</b>, counted in the Attention tab badge and the sidebar plugin badge like the other unregistered reasons. Its only action is <b>Remove</b>: no Register anyway, Re-approve or Configure. The detail shows only what Tasty itself knows — the <b>folder name</b> as the title and the <b>id</b> on the meta line. The manifest name, version, author, homepage and description are not shown (a muted line says the description is hidden), because an unofficial <code>com.tasty.*</code> manifest can word itself as Tasty. The banner states the fact without calling it malicious. Remove is a secondary button with danger ink (the Installed Uninstall recipe), never focused by selecting the row; clicking it replaces the bar with a confirm in place (Cancel holds focus, Esc cancels, changing the selection cancels). Confirming deletes the folder and the row leaves the list. The arrival notice stays, with its own copy.</>}>
        <Stage variant="solo" style={{ padding: "var(--tasty-space-lg)", background: "var(--tasty-bg-app)", gap: "var(--tasty-space-lg)", flexWrap: "wrap", alignItems: "flex-start" }}>
          {THEMES.map(([label, attr]) => (
            <Themed key={label} attr={attr}>
              <span style={cap}>{label}</span>
              <span style={{ ...cap, fontFamily: "var(--tasty-font-mono)" }}>list row · rest · selected</span>
              <ReservedRow /><ReservedRow selected />
              <span style={{ ...cap, fontFamily: "var(--tasty-font-mono)" }}>detail · rest — Remove not focused on selection</span><ReservedDetail />
              <span style={{ ...cap, fontFamily: "var(--tasty-font-mono)" }}>detail · remove confirm — bar replaced in place, Cancel focused</span><ReservedDetail state="confirm" />
              <span style={{ ...cap, fontFamily: "var(--tasty-font-mono)" }}>detail · removing — both disabled</span><ReservedDetail state="removing" />
              <span style={{ ...cap, fontFamily: "var(--tasty-font-mono)" }}>notification · warning · on arrival (once per folder)</span><ReservedNotice />
            </Themed>
          ))}
          <Themed>
            <span style={cap}>Mocha · narrow 320 · long folder + id · confirm wraps</span>
            <ReservedDetail p={RESERVED_LONG} width="var(--tasty-size-320)" />
            <ReservedDetail p={RESERVED_LONG} state="confirm" width="var(--tasty-size-320)" />
          </Themed>
          <Themed>
            <span style={cap}>Mocha · ko / ja length</span>
            <ReservedRow lang="ko" selected /><ReservedRow lang="ja" selected />
            <ReservedDetail lang="ko" width="var(--tasty-size-440)" /><ReservedDetail lang="ko" state="confirm" width="var(--tasty-size-440)" />
            <ReservedDetail lang="ja" width="var(--tasty-size-440)" /><ReservedDetail lang="ja" state="confirm" width="var(--tasty-size-440)" />
            <ReservedNotice lang="ko" /><ReservedNotice lang="ja" />
          </Themed>
        </Stage>
        <Meta
          specs={[["reason", "fifth AttentionKind · danger (dot, selection edge, banner tint) · list label in accent-danger-raised (accent-danger is 4.46:1 on Latte mantle) · counted in the tab + sidebar badges"], ["identity", "avatar from the folder name initial · title = folder name · meta = id only (no author, homepage, version tag)"], ["description", "always hidden · caption text-muted line (same recipe as signature invalid)"], ["banner", "danger tint box (fill + border alpha tokens) · alertCircle 16 in plugin-trust-glyph-danger · title text-primary · body plugin-trust-body-fg"], ["detail", "mono header Folder · full path, caption text-muted, break-all, selectable · no Open folder"], ["bar · rest", "danger dot + Not registered (reused) · Remove secondary + accent-danger-raised ink · no auto focus"], ["bar · confirm", "alertTriangle 16 attention-raised · Remove {folder}? body text-primary · note caption muted · Cancel ghost (focus) · Remove danger · wraps on narrow"], ["bar · removing", "Cancel + Remove disabled · Spinner 14 + Removing… caption muted"], ["after remove", "row leaves the list · badges drop by one · toast Removed '{folder}'. · failure toast Remove failed: {reason}, bar back to rest"], ["notice", "warning level · once per newly seen folder (unchanged behaviour) · new title + body keys"]]}
          tokens={[{ tok: "--tasty-accent-danger", use: "dot · selection edge · banner tint", color: "var(--tasty-accent-danger)" }, { tok: "--tasty-accent-danger-raised", use: "list label · status text · Remove ink", color: "var(--tasty-accent-danger-raised)" }, { tok: "--tasty-plugin-trust-glyph-danger", use: "banner glyph", color: "var(--tasty-plugin-trust-glyph-danger)" }, { tok: "--tasty-plugin-trust-title-fg", use: "banner title", color: "var(--tasty-plugin-trust-title-fg)" }, { tok: "--tasty-plugin-trust-body-fg", use: "banner body", color: "var(--tasty-plugin-trust-body-fg)" }, { tok: "--tasty-accent-attention-raised", use: "confirm glyph (as Installed)", color: "var(--tasty-accent-attention-raised)" }]} />
        <Note>English is the source copy; ko / ja above are the meaning reference. Keys (all new unless marked): <code>plugins.attn_reserved_id_label</code> · <code>plugins.attn_reserved_id_blurb</code> · <code>plugins.attn_reserved_desc_hidden</code> · <code>plugins.attn_folder</code> · <code>plugins.attn_not_registered</code> (reused) · <code>plugins.attn_remove</code> · <code>plugins.attn_remove_confirm_title</code> · <code>plugins.attn_remove_note</code> · <code>plugins.attn_removing</code> · <code>plugins.attn_removed</code> (“Removed '{}'.” / “'{}'을(를) 제거했습니다.” / “'{}' を削除しました。”) · <code>plugins.attn_remove_failed</code> (“Remove failed: {}” / “제거 실패: {}” / “削除に失敗しました: {}”) · <code>plugin_notice.reserved_id_title</code> · <code>plugin_notice.reserved_id_body</code>. The notice stops reusing <code>start_failed_title</code> and the raw English reason.</Note>
        <Note><b>Why not the Uninstall confirm.</b> The plugin was never installed or registered, so the verb is <b>Remove</b>, and the Installed note (“Settings stay until you delete them”) would promise settings that an unregistered id may not have. The confirm keeps the Installed layout and only swaps the copy.</Note>
        <Dont><b>Don't</b> show the manifest's own name, author, homepage or description here, don't offer Register anyway, Re-approve, Configure or Open folder, and don't call the plugin malicious — the copy states what Tasty checked.</Dont>
      </Spec>
    </>
  );
}

export { TrustBox2, PluginTrustSpecs, ReservedDetail, ReservedRow, RESERVED };

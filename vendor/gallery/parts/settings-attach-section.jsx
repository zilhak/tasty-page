import React from "react";
import { Input } from "../../components/index.js";
import { rt } from "../../ui_kits/terminal/overlays/remote_row_copy.js";

// Tasty Gallery — Settings › General › Remote attach › Attach connections. Two rows on the shared SettingsRow and the
// shared settings number field: no clamp while typing, Enter or leaving the field commits and clamps, a
// non-number returns to the last committed value. The range line shows only while the typed value is out of range.
// Row 1 Disconnect after: 10 to 600, default 30. Row 2 Keep reconnecting for (R-58): 0 to 3600, default 300, 0 = off;
// it counts from the moment row 1 ends the connection.

const MIN = 10;
const MAX = 600;
const DEFAULT = 30;
const RECONNECT = { min: 0, max: 3600, def: 300 };

// en, ko and ja are final copy, one key each. The range line is settings.number.range_between and the unit is settings.number.unit_s, both reused.
const ATTACH_COPY = {
  en: {
    tab: "Remote attach",
    section: "Attach connections",
    label: "Disconnect after",
    caption: "How long an attach connection can receive nothing from the other side before it disconnects. Saved values apply to new connections, no restart needed. Open connections don't change. The other Tasty uses its own value and may disconnect first. Default 30.",
    range: (a, b, v) => "Between " + a + " and " + b + ". Value to save: " + v + ".",
  },
  ko: {
    tab: "원격 Attach",
    section: "Attach 연결",
    label: "끊기 전 대기 시간",
    caption: "상대에게서 이 시간 동안 아무것도 받지 못하면 attach 연결을 끊습니다. 저장한 값은 재시작 없이 새 연결부터 적용되고, 이미 열린 연결은 바뀌지 않습니다. 상대 Tasty는 자기 값을 쓰므로 먼저 끊을 수 있습니다. 기본값 30.",
    range: (a, b, v) => a + " 이상 " + b + " 이하입니다. 저장할 값: " + v + ".",
  },
  ja: {
    tab: "リモートアタッチ",
    section: "アタッチ接続",
    label: "切断までの待機時間",
    caption: "相手からこの時間何も受信しなければ、アタッチ接続を切断します。保存した値は再起動なしで新しい接続から適用され、すでに開いている接続は変わりません。相手の Tasty は自身の値を使うため、先に切断することがあります。既定値 30。",
    range: (a, b, v) => a + " 以上 " + b + " 以下です。保存する値: " + v + "。",
  },
};

// text: the field's typed text on mount, for a specimen that shows an uncommitted entry.
// reconnectText / reconnectFocused: the same for the second row.
function AttachConnectionsSection({ lang = "en", text = String(DEFAULT), focused = false, reconnectText = String(RECONNECT.def), reconnectFocused = false, stacked = false }) {
  const L = ATTACH_COPY[lang] || ATTACH_COPY.en;
  return (
    <section aria-label={L.section} style={{ display: "flex", flexDirection: "column", gap: "var(--tasty-settings-row-gap)", minWidth: 0 }}>
      <div lang={lang} style={{ fontFamily: "var(--tasty-font-label)", fontSize: "var(--tasty-font-size-micro)", textTransform: "uppercase", letterSpacing: "var(--tasty-letter-spacing-caps)", color: "var(--tasty-text-muted)" }}>{L.section}</div>
      <NumberRow lang={lang} label={L.label} caption={L.caption} range={L.range} min={MIN} max={MAX} def={DEFAULT} text={text} focused={focused} stacked={stacked} />
      <NumberRow lang={lang} label={rt("settings.remote_attach.reconnect_window", lang)} caption={rt("settings.remote_attach.reconnect_window_desc", lang)} range={L.range}
        min={RECONNECT.min} max={RECONNECT.max} def={RECONNECT.def} text={reconnectText} focused={reconnectFocused} stacked={stacked} />
    </section>
  );
}

function NumberRow({ lang, label, caption, range, min: MIN, max: MAX, def: DEFAULT, text: initial, focused, stacked }) {
  const L = { label, caption, range };
  const [committed, setCommitted] = React.useState(DEFAULT);
  const [text, setText] = React.useState(initial);
  const parsed = /^\s*-?\d+\s*$/.test(text) ? parseInt(text, 10) : null;
  const clamp = (v) => Math.min(MAX, Math.max(MIN, v));
  const out = parsed !== null && parsed !== clamp(parsed);
  const commit = () => {
    const v = parsed === null ? committed : clamp(parsed);
    setCommitted(v);
    setText(String(v));
  };
  const chars = Math.max(text.length, 1) + 1;
  return (
      <div lang={lang} style={{ display: "flex", flexDirection: "column", gap: "var(--tasty-settings-row-caption-gap)", minWidth: 0 }}>
        <div style={{ display: "flex", flexDirection: stacked ? "column" : "row", alignItems: stacked ? "stretch" : "flex-start", gap: stacked ? "var(--tasty-settings-row-stack-gap)" : "var(--tasty-settings-label-gap)", minWidth: 0 }}>
          <span style={{ flex: "none", width: stacked ? "auto" : "var(--tasty-settings-label-width)", minHeight: stacked ? 0 : "var(--tasty-settings-row-min-height)", display: "flex", alignItems: "center", fontSize: "var(--tasty-font-size-body)", lineHeight: "var(--tasty-line-height-ui)", color: "var(--tasty-text-secondary)", overflowWrap: "anywhere" }}>{L.label}</span>
          <span style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "var(--tasty-space-xs)", minWidth: 0 }}>
            <span style={{ display: "flex", alignItems: "center", gap: "var(--tasty-number-field-unit-gap)", minHeight: "var(--tasty-settings-row-min-height)", minWidth: 0 }}>
              <span style={{ display: "inline-flex", flex: "none", maxWidth: "100%", width: "max(var(--tasty-number-field-min-width), calc(" + chars + "ch + 2 * var(--tasty-input-padding-x) + 2 * var(--tasty-border-width)))" }}>
                <Input block mono value={text} invalid={out} focused={focused} inputMode="numeric" aria-label={L.label}
                  onChange={(e) => setText(e.target.value)} onBlur={commit} onKeyDown={(e) => { if (e.key === "Enter") commit(); }} style={{ textAlign: "right" }} />
              </span>
              <span style={{ fontFamily: "var(--tasty-font-mono)", fontSize: "var(--tasty-font-size-caption)", color: "var(--tasty-text-muted)", whiteSpace: "nowrap" }}>s</span>
            </span>
            {out && <span role="status" style={{ fontSize: "var(--tasty-font-size-caption)", lineHeight: "var(--tasty-line-height-ui)", color: "var(--tasty-accent-danger-raised)", maxWidth: "var(--tasty-measure-md)", overflowWrap: "anywhere" }}>{L.range(MIN, MAX, clamp(parsed))}</span>}
          </span>
        </div>
        <p style={{ margin: 0, fontSize: "var(--tasty-font-size-caption)", lineHeight: "var(--tasty-line-height-ui)", color: "var(--tasty-text-muted)", maxWidth: "var(--tasty-measure-md)", textWrap: "pretty", overflowWrap: "anywhere" }}>{L.caption}</p>
      </div>
  );
}

export { AttachConnectionsSection, ATTACH_COPY, RECONNECT };

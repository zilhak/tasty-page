// Tasty UI kit — copy for the attach clipboard copy wait (2026-11-24). Values for tasty lang/*.toml.
// attach.pending.copy is the PendingIndicator label while a program on the attached host is still sending a
// clipboard write (OSC 52), and the same value is the kind name of that wait in the chip's detail lines when other
// attach waits are pending too. One key serves both places. Checked by Codex (en, ko, ja, zh-Hans; zh-Hans follows
// i18n/zh-Hans/glossary.json, Clipboard = 剪贴板); the existing values were kept. Send changes back to Codex rather
// than editing a value by hand.
// The result toasts reuse existing keys, listed here so the wait is always read beside its outcome:
// toast.copied_osc52 (info) on success, toast.clipboard_failed (danger) when the clipboard write fails or the
// connection / mirror ends while the write is still arriving. No attach-only failure copy: a disconnect already
// raises the reconnect banner, which names the cause.

export const ATTACH_COPY_WAIT_LANGS = ["en", "ko", "ja", "zh-Hans"];

export const ATTACH_COPY_WAIT_COPY = {
  "attach.pending.copy": {"en": "Copying to clipboard", "ko": "클립보드에 복사 중", "ja": "クリップボードにコピー中", "zh-Hans": "正在复制到剪贴板"},
  "attach.pending.one": {"en": "Waiting for response", "ko": "응답 대기 중", "ja": "応答待ち", "zh-Hans": "等待响应"},
  "toast.copied_osc52": {"en": "Copied (OSC 52)", "ko": "복사됨 (OSC 52)", "ja": "コピーしました (OSC 52)", "zh-Hans": "已复制（OSC 52）"},
  "toast.clipboard_failed": {"en": "Clipboard operation failed. Try again.", "ko": "클립보드 작업에 실패했습니다. 다시 시도해 주세요.", "ja": "クリップボードの操作に失敗しました。もう一度お試しください。", "zh-Hans": "剪贴板操作失败。请重试。"},
};

// acw(key, lang): the value for key in lang.
export function acw(key, lang = "en") {
  const e = ATTACH_COPY_WAIT_COPY[key];
  return (e && (e[lang] || e.en)) || key;
}

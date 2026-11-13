// Tasty UI kit — copy for the text clipboard success toasts (2026-11-13). Values for tasty lang/*.toml, section [toast].
// toast.cut is a new key: the success toast after a text cut (host text fields, plugin text fields, web and markdown
// pages). Written by Codex (en, ko, ja, zh-Hans; zh-Hans follows i18n/zh-Hans/glossary.json) and checked by script:
// no placeholders, no line breaks, no Hangul or kana in the wrong language, no Han in ko, no glossary avoid term,
// en in sentence case. Send changes back to Codex rather than editing a value by hand.
// toast.copied is the existing value, unchanged, listed here so the cut toast is always read beside it.
//
// Which key a source raises: toast.cut only when the source says the action was a cut (a cut key or menu command in
// a text field, a page cut through the host's cut command or the page's own cut command). A source that cannot tell
// copy from cut (a page script writing to the clipboard directly) raises toast.copied: the text did reach the
// clipboard, so "Copied" stays true. Files keep toast.copied_files / toast.cut_files.
// A cut key or cut command in a field that cannot be edited (a label, a read-only text field) removes nothing and
// only copies the selection: it raises toast.copied, because the card says what happened and the text is still
// there (2026-11-14).
// A page cut made by the web engine itself, not through Tasty (the engine's own cut key, the page context menu's
// Cut): open. Whether the host notices it at all is a product decision not yet made, so no key is assigned here.
// Kind: success for both keys, as the Toast specimen already draws Path copied (the app raises them as info today).
// A copy a program asked for (toast.copied_osc52) stays info. Hint rule as for toast.copied.

export const CLIPBOARD_TOAST_LANGS = ["en", "ko", "ja", "zh-Hans"];

export const CLIPBOARD_TOAST_COPY = {
  "toast.copied": {"en": "Copied", "ko": "복사됨", "ja": "コピーしました", "zh-Hans": "已复制"},
  "toast.cut": {"en": "Text cut", "ko": "잘라냄", "ja": "切り取りました", "zh-Hans": "已剪切"},
};

// ctt(key, lang): the value for key in lang.
export function ctt(key, lang = "en") {
  const e = CLIPBOARD_TOAST_COPY[key];
  return (e && (e[lang] || e.en)) || key;
}

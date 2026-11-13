// Tasty UI kit — copy for the text clipboard success toasts (2026-11-13). Values for tasty lang/*.toml, section [toast].
// toast.cut is a new key: the success toast after a text cut (host text fields, plugin text fields, web and markdown
// pages). Written by Codex (en, ko, ja, zh-Hans; zh-Hans follows i18n/zh-Hans/glossary.json) and checked by script:
// no placeholders, no line breaks, no Hangul or kana in the wrong language, no Han in ko, no glossary avoid term,
// en in sentence case. Send changes back to Codex rather than editing a value by hand.
// toast.copied is the existing value, unchanged, listed here so the cut toast is always read beside it.
//
// Which key a source raises: toast.cut only when the source says the action was a cut (a cut key or menu command in
// a text field, a page cut through the host's cut command, a page script calling execCommand('cut')). A source that
// cannot tell copy from cut (a page script writing to the clipboard directly) raises toast.copied: the text did reach
// the clipboard, so "Copied" stays true. Files keep toast.copied_files / toast.cut_files.
// Exception, host egui fields (2026-11-14): a cut key or cut command on a selectable label or a read-only TextEdit in
// Tasty's own egui UI, when it does produce copy output, removes nothing and only copies the selection: toast.copied,
// because the card says what happened and the text is still there. In a host egui field, toast.cut needs a signal
// that text was removed; egui's copy output (OutputCommand::CopyText) carries only the text, not copy or cut and not
// whether anything was deleted, so without that signal the field raises toast.copied.
// Plugin egui fields: the rule above holds for now. A Cut request the host sent to the plugin, paired with its
// result, raises toast.cut. Open, waiting on a product decision: an exception for a plugin field that cannot be
// edited (the cut removed nothing and only copied), and whether the protocol gains a signal that text was removed.
// The host gets back only the copied text, so until then a read-only plugin field can show Text cut.
// Web and markdown pages, a selection that cannot be edited: not part of this exception. Open until the engine
// behavior is checked; until then the page rule above applies (toast.cut through the host's cut command).
// A page cut made by the web engine itself, not through Tasty (the engine's own cut key, the page context menu's
// Cut): open, not covered by the page's execCommand('cut') above. Whether the host notices it at all is a product
// decision not yet made, so no toast key yet: neither toast.cut, toast.copied nor no toast is settled here.
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

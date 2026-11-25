// Tasty UI kit — copy of the plugins window's empty Attention tab (2026-11-25).
// Values are the app's lang/*.toml, section [plugins], keys attn_empty_title and attn_empty_body, letter for letter.
// They are not new copy: a change starts in the app catalog and is copied here as it stands.

export const ATTN_EMPTY = {
  en: ["No plugins need attention", "Rejected or failing plugins show up here with the reason and what to do next."],
  ko: ["확인이 필요한 플러그인이 없습니다", "등록이나 실행에 실패한 플러그인과 그 원인, 해결 방법을 표시합니다."],
  ja: ["確認が必要なプラグインはありません", "登録や実行に失敗したプラグインを、原因と対処方法とともに表示します。"],
  "zh-Hans": ["没有待处理的插件", "被拒绝或运行失败的插件会显示在此处，并附上原因和后续操作。"],
};

// [title, body, lang] for a language. Only the four languages above are looked up, as own keys; any other value
// reads en, and lang is then en too, so the text never carries a language it is not written in.
export const attnEmpty = (lang) => {
  const shown = Object.hasOwn(ATTN_EMPTY, lang) ? lang : "en";
  return [...ATTN_EMPTY[shown], shown];
};

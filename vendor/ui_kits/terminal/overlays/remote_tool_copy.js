// Copy for the remote tool kit, keyed as in tasty lang/*.toml. en is the canon; ko, ja and zh-Hans were written by
// Codex (zh-Hans with the glossary) in the sentence form of the neighbouring remote_tool.local_ssh_empty.

export const REMOTE_TOOL_COPY = {
  "remote_tool.filter_empty": {"en": "No protocols.", "ko": "프로토콜이 없습니다.", "ja": "プロトコルがありません。", "zh-Hans": "没有协议。"},
};

// tt(key, lang): the value in lang, en when lang has none.
export function tt(key, lang = "en") {
  const v = REMOTE_TOOL_COPY[key];
  return (v && (v[lang] || v.en)) || key;
}

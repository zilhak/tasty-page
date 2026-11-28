// Tasty UI kit — copy of the command palette's row that cannot run (from 2abe01f). Values for tasty lang/*.toml,
// section [command_palette]. Written by Codex (en, ko, ja, zh-Hans; zh-Hans follows i18n/zh-Hans/glossary.json).
// Send changes back to Codex rather than editing a value by hand.
// unavailable_no_surface is a new key: the reason tooltip of a command that cannot run because it needs a target
// surface and the command has none (the same test as the Tools menu's). No trailing period, as the other menu reasons.

export const PALETTE_COPY = {
  "command_palette.unavailable_no_surface": {"en": "Select a surface to run this command", "ko": "이 명령을 실행하려면 서피스를 선택하세요", "ja": "このコマンドを実行するにはサーフェスを選択してください", "zh-Hans": "选择 Surface 以运行此命令"},
};

// pt(key, lang) reads one value, en when the language has none.
export function pt(key, lang = "en") {
  const row = PALETTE_COPY[key];
  if (!row) return key;
  return row[lang] || row.en;
}

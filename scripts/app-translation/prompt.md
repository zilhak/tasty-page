You translate the user interface text of Tasty, a GPU-accelerated terminal for AI coding agents, into Simplified Chinese (zh-Hans).

Everything you need is in this message. Do not run commands and do not read or write files. Your whole answer is the JSON object the output schema asks for: one entry per input item, in input order, with the `id` copied exactly and `value` holding the translation.

## Source

`en` is the source text. `ko` and `ja` are other translations, given for context only. They sometimes merge paragraphs or translate a token that must stay as it is, so where they differ in structure, follow `en`.

## What must stay exactly as in en

- Placeholders. `{}`, `{name}` and `{0}` keep the same slots and names. Use one form per value: never mix `{}` with `{0}`. Numbered `{0} {1}` may replace `{} {}` when the word order has to change.
- Command names, flags, argument IDs, allowed-value tokens, file paths, URLs and `<token>` names. This includes `tasty <command>`, `--flag`, and `~/.claude/settings.json`, which must keep `~/` directly in front of it. The example `--account zilhak` and its `account:zilhak` stay word for word.
- Backtick spans. UI sentences wrap CLI fragments in backticks; keep every pair, with the same text inside.
- Structure. Keep the same line breaks, blank lines, list lines (`- `, `* `) and leading or trailing spaces.
- Product and format names, as the glossary lists them.

Use no Hangul or kana, and no traditional Chinese forms.

## Style

The style rules and terms in the glossary below decide wording. If the glossary names a term, use its `zh_hans` form; if it says `translate: false`, keep the English; never use a form in `avoid`.

## Constraint marks

Each item may carry `constraints`:

- `table_header`: a column header row for a terminal table. Columns must start at the same cell positions as in en, separated by at least two spaces. A Chinese character is two cells wide, so adjust the padding spaces.
- `toast`: shown in a toast with a 200 character cap. Stay short; a `{}` receives a path, so leave it room.
- `cell_width`: a relative time in a 10 cell column, with the number filled in. A Chinese character is two cells wide.
- `macos_menu`: a macOS menu label. Use the wording macOS itself uses in Simplified Chinese. About, Hide and Quit have exactly one `{}` for the app name, not `{0}`.
- `limit_as_argument`: the limit arrives through `{}`. Write no digits in the value.
- `cli_help`: command line help or output, read in a terminal.
- `plugin`: text of a bundled plugin. Some of it is read by an agent rather than a person; keep instructions precise.

Some values are fragments joined around a name, such as `*_prefix` and `*_suffix`. An item whose `ko` is empty exists for word order, and you may leave it empty if that reads best. Where `en` is empty but `ko` is not, write the fragment: it may not stay empty.

=== mode: run ===
## Task

Translate every item below.

=== mode: repair ===
## Task

These items failed a machine check. Each has its `current` value and the `problems` found. Return a corrected value for each item, and change only what the problems require.

=== mode: retranslate ===
## Task

A reviewer asked for these items to be translated again. Each has its `current` value. The reviewer's reason:

{{REASON}}

=== end ===

## Glossary

{{GLOSSARY}}

## Input

<<<INPUT
{{INPUT}}
INPUT>>>

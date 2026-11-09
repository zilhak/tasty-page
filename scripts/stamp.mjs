/**
 * Stamps a translation with the hash of the Korean source it was made from.
 *
 *   node scripts/stamp.mjs content/en/using/terminal.md
 *
 * A file must sit in the translation tree of a language row. A translation whose
 * language has no row yet is named on the command line, so a mistyped folder still fails:
 *
 *   node scripts/stamp.mjs --tree ja content/ja/using/terminal.md
 *
 * Run it right after actually updating a translation. Stamping without updating
 * only hides the stale banner — the content stays out of date.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { relative, resolve, sep } from "node:path";
import { parseArgs } from "node:util";
import { canBeTranslationDir, contentHash } from "../src/lib/guide.ts";
import { TRANSLATION_DIRS } from "../src/lib/langs.mjs";

const root = resolve(import.meta.dirname, "..");
const { values, positionals: targets } = parseArgs({
  options: { tree: { type: "string", multiple: true, default: [] } },
  allowPositionals: true,
});
if (targets.length === 0) {
  console.error("usage: node scripts/stamp.mjs [--tree <folder>] <content/<folder>/…md> [more…]");
  process.exit(2);
}
for (const tree of values.tree) {
  if (!canBeTranslationDir(tree)) {
    console.error(`--tree ${tree} cannot be a translation folder`);
    process.exit(2);
  }
}

const trees = [...TRANSLATION_DIRS, ...values.tree];
const PREFIX = "<!-- source-hash:";

for (const arg of targets) {
  const abs = resolve(root, arg);
  const [tree, ...rest] = relative(resolve(root, "content"), abs).split(sep);
  if (rest.length === 0 || !trees.includes(tree)) {
    console.error(`${arg} is not under ${trees.map((t) => `content/${t}/`).join(", ")}`);
    process.exit(1);
  }
  const rel = rest.join("/");
  const sourcePath = resolve(root, "content", rel);
  let source;
  try {
    source = readFileSync(sourcePath, "utf8");
  } catch {
    console.error(`no Korean source at content/${rel}`);
    process.exit(1);
  }
  const hash = contentHash(source);
  const stampLine = `${PREFIX} ${hash} -->`;

  const body = readFileSync(abs, "utf8");
  const lines = body.split("\n");
  const first = lines.findIndex((l) => l.trim() !== "");
  const hasStamp = first >= 0 && lines[first].trim().startsWith(PREFIX);
  const out = hasStamp
    ? [...lines.slice(0, first), stampLine, ...lines.slice(first + 1)].join("\n")
    : `${stampLine}\n${body}`;
  writeFileSync(abs, out);
  console.log(`stamped content/${tree}/${rel} -> ${hash}`);
}

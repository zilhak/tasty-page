/**
 * Compares translated guide trees with the Korean source, page by page.
 *
 *   node scripts/check-translations.mjs [--counts] [--skip-missing] [folder…]
 *
 * With no folder it reads the language rows. A folder whose language has no row yet can
 * be named. --counts prints the number of problems per rule and always exits 0, for a
 * tree that is known not to pass. --skip-missing passes over a named folder that does
 * not exist.
 *
 * This compares structure only. It cannot tell whether a sentence means the same.
 * Headings, fences, commands and diagrams keep their order. Links and English labels
 * do not have to, because word order differs between languages.
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";
import { parseArgs } from "node:util";
import { ORDER, canBeTranslationDir, contentHash, readStamp } from "../src/lib/guide.ts";
import { TRANSLATION_DIRS } from "../src/lib/langs.mjs";

/** Korean a translation keeps: the app's language name, and examples of what the app
 * shows or reads in Korean. Longer strings come first, because they are removed in order. */
const ALLOWED_HANGUL = [
  "한국어",
  "내 클립보드 열기",
  "내 클립보드",
  "메타데이터 미설정",
  "턴 결과",
  "을(를) 저장했습니다. 읽기",
];
/** The one folder held to the Simplified Chinese script rules. */
const SIMPLIFIED_CHINESE_DIR = "zh";

const HANGUL = /[ᄀ-ᇿ㄰-㆏ꥠ-꥿가-힣ힰ-퟿]/;
const KANA = /[぀-ヿㇰ-ㇿｦ-ﾟ]/;
const HAN = /[㐀-䶿一-鿿豈-﫿]/gu;

const CONTENT = resolve(import.meta.dirname, "..", "content");

/** Han characters of GB2312, levels 1 and 2. Outside it, a character may be a traditional form. */
function gb2312Han() {
  const decoder = new TextDecoder("gbk");
  const set = new Set();
  for (let lead = 0xb0; lead <= 0xf7; lead++) {
    for (let trail = 0xa1; trail <= 0xfe; trail++) {
      if (lead === 0xd7 && trail >= 0xfa) continue; // Unassigned in GB2312, assigned in GBK.
      set.add(decoder.decode(new Uint8Array([lead, trail])));
    }
  }
  return set;
}

/** Splits a page into the lines outside code fences and the fences themselves. */
function parse(source) {
  const prose = [];
  const fences = [];
  let open = null;
  for (const line of source.replace(/\r\n/g, "\n").split("\n")) {
    const fence = /^[\s>]*(`{3,}|~{3,})(.*)$/.exec(line);
    if (open) {
      if (fence && fence[1][0] === open.mark[0] && fence[1].length >= open.mark.length && fence[2].trim() === "") {
        open = null;
      } else {
        open.lines.push(line);
      }
    } else if (fence) {
      open = { mark: fence[1], info: fence[2].trim(), lines: [] };
      fences.push(open);
    } else {
      prose.push(line);
    }
  }
  return { prose: prose.join("\n"), fences };
}

/** What a page must share with its source. Lists keep their order; bags and sets do not. */
function shapeOf(source) {
  const { prose, fences } = parse(source);
  const plain = prose.replace(/<!--[\s\S]*?-->/g, "").replace(/(`+)[^\n]*?\1/g, "");
  return {
    headings: [...plain.matchAll(/^ {0,3}(#{1,6})(?:\s|$)/gm)].map((m) => m[1].length),
    fences: fences.map((f) => f.info),
    commands: fences.flatMap((f) =>
      f.lines.map((l) => l.trim()).filter((l) => /^(?:\$\s+)?tasty(?:\s|$)/.test(l)).map((l) => l.replace(/\s+#\s.*$/, "")),
    ),
    links: [...plain.matchAll(/\]\(\s*<?([^)\s>]*)>?(?:\s+"[^"]*")?\s*\)|\bhref="([^"]*)"/g)]
      .map((m) => (m[1] ?? m[2]).split("#")[0])
      .filter(Boolean)
      .sort(),
    diagrams: [...prose.matchAll(/<!--\s*tasty-diagram:\s*([a-z0-9-]+)\s*-->/g)].map((m) => m[1]),
    labels: [...new Set([...prose.matchAll(/<!--\s*en:\s*([\s\S]*?)\s*-->/g)].map((m) => m[1].replace(/\s+/g, " ")))].sort(),
  };
}

/**
 * Whether a translated command line matches its source. A quoted string, placeholder or
 * word with Korean in it is sample text, which a translation rewrites. The rest stays.
 */
function sameCommand(source, translated) {
  const pattern = source.replace(/"[^"]*"|'[^']*'|<[^>]*>|\S+/g, (token) =>
    HANGUL.test(token) ? ".+" : token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
  );
  return new RegExp(`^${pattern}$`).test(translated);
}

/** Values in one list and not the other, counting repeats. */
function difference(from, against) {
  const left = [...against];
  return from.filter((value) => {
    const at = left.indexOf(value);
    if (at < 0) return true;
    left.splice(at, 1);
    return false;
  });
}

const sameList = (a, b) => a.length === b.length && a.every((value, i) => value === b[i]);

/** Reports where two ordered lists part. */
function describeOrdered(expected, actual) {
  const at = expected.findIndex((value, i) => value !== actual[i]);
  const index = at < 0 ? expected.length : at;
  return `${actual.length} found, expected ${expected.length}; first difference at #${index + 1}: ${JSON.stringify(actual[index] ?? null)}, expected ${JSON.stringify(expected[index] ?? null)}`;
}

function describeBag(expected, actual) {
  const missing = difference(expected, actual);
  const extra = difference(actual, expected);
  return [missing.length && `missing ${missing.join(", ")}`, extra.length && `extra ${extra.join(", ")}`].filter(Boolean).join("; ");
}

function comparePage(page, source, translated, report) {
  const want = shapeOf(source);
  const got = shapeOf(translated);
  if (!sameList(want.headings, got.headings)) report("headings", page, describeOrdered(want.headings, got.headings));
  if (!sameList(want.fences, got.fences)) report("fences", page, describeOrdered(want.fences, got.fences));
  const command = want.commands.findIndex((line, i) => i >= got.commands.length || !sameCommand(line, got.commands[i]));
  if (command >= 0 || want.commands.length !== got.commands.length) {
    const index = command >= 0 ? command : want.commands.length;
    report("commands", page, `${got.commands.length} found, expected ${want.commands.length}; first difference at #${index + 1}: ${JSON.stringify(got.commands[index] ?? null)}, expected ${JSON.stringify(want.commands[index] ?? null)}`);
  }
  if (!sameList(want.links, got.links)) report("links", page, describeBag(want.links, got.links));
  if (!sameList(want.diagrams, got.diagrams)) report("diagrams", page, describeOrdered(want.diagrams, got.diagrams));
  if (!sameList(want.labels, got.labels)) report("labels", page, describeBag(want.labels, got.labels));

  const stamp = readStamp(translated);
  const hash = contentHash(source);
  if (stamp !== hash) report("stamp", page, stamp ? `stamped ${stamp}, source is ${hash}` : `no stamp, source is ${hash}`);

  translated.split("\n").forEach((line, i) => {
    const rest = ALLOWED_HANGUL.reduce((text, word) => text.replaceAll(word, ""), line);
    if (HANGUL.test(rest)) report("hangul", page, `line ${i + 1}: ${rest.trim().slice(0, 80)}`);
  });
}

function checkSimplifiedChinese(page, translated, report, candidates, simplified) {
  translated.split("\n").forEach((line, i) => {
    if (KANA.test(line)) report("kana", page, `line ${i + 1}: ${line.trim().slice(0, 80)}`);
  });
  for (const [char] of translated.matchAll(HAN)) {
    if (!simplified.has(char)) candidates.add(`${char} ${page}`);
  }
}

function markdownFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return markdownFiles(path);
    return entry.name.endsWith(".md") ? [path] : [];
  });
}

function checkTree(tree, report, review) {
  const root = join(CONTENT, tree);
  const listed = new Set(ORDER.map((rel) => `${rel}.md`));
  const present = new Set(markdownFiles(root).map((path) => relative(root, path).split(sep).join("/")));
  for (const page of listed) if (!present.has(page)) report("files", page, "missing");
  for (const page of present) if (!listed.has(page)) report("files", page, "not in ORDER, so it is never published");

  const candidates = new Set();
  const simplified = tree === SIMPLIFIED_CHINESE_DIR ? gb2312Han() : null;
  for (const page of listed) {
    if (!present.has(page)) continue;
    const translated = readFileSync(join(root, page), "utf8");
    comparePage(page, readFileSync(join(CONTENT, page), "utf8"), translated, report);
    if (simplified) checkSimplifiedChinese(page, translated, report, candidates, simplified);
  }
  review(candidates);
}

const { values, positionals } = parseArgs({
  options: { counts: { type: "boolean", default: false }, "skip-missing": { type: "boolean", default: false } },
  allowPositionals: true,
});
for (const tree of positionals) {
  if (!canBeTranslationDir(tree)) {
    console.error(`${tree} cannot be a translation folder`);
    process.exit(2);
  }
}

let failed = 0;
for (const tree of positionals.length > 0 ? positionals : TRANSLATION_DIRS) {
  if (!existsSync(join(CONTENT, tree))) {
    if (values["skip-missing"]) {
      console.log(`${tree}: skipped, content/${tree}/ does not exist yet`);
      continue;
    }
    console.error(`${tree}: content/${tree}/ does not exist`);
    failed += 1;
    continue;
  }
  const counts = {};
  const report = (rule, page, detail) => {
    counts[rule] = (counts[rule] ?? 0) + 1;
    if (!values.counts) console.error(`${tree}/${page}: ${rule}: ${detail}`);
  };
  const review = (candidates) => {
    if (candidates.size === 0) return;
    console.log(`${tree}: ${candidates.size} possible traditional form(s) to review, not a failure:`);
    if (!values.counts) for (const candidate of [...candidates].sort()) console.log(`  ${candidate}`);
  };
  checkTree(tree, report, review);
  const total = Object.values(counts).reduce((sum, n) => sum + n, 0);
  const rules = Object.entries(counts).map(([rule, n]) => `${rule} ${n}`).join(", ");
  console.log(`${tree}: ${total} problem(s)${rules ? ` (${rules})` : ""}`);
  failed += total;
}
if (failed > 0 && !values.counts) process.exit(1);

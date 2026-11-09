/**
 * Guide model: reading order, sections, and the translation rules.
 *
 * Korean is canonical and every other language is a translation of it, in the tree
 * its language row names. A missing translation fails the build: a reader never gets
 * the Korean body in place of their language. Each translation carries a
 * `<!-- source-hash: … -->` stamp of the Korean source it was made from; when the
 * source moves on, the page says so. (docs/dev/site.md "번역 모델")
 */
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { LANGS, langRow } from "./langs.mjs";

/** A language code from langs.mjs. */
export type Lang = string;

/** Sidebar sections in reading order, by directory. The empty one is the guide home. Labels live in the language dictionaries. */
export const SECTIONS: string[] = ["", "getting-started", "using", "customize", "agents", "remote", "plugins", "help"];

/** Explicit reading order for the sidebar and previous/next links. */
export const ORDER: string[] = [
  "index",
  "getting-started/install",
  "getting-started/first-look",
  "using/workspaces",
  "using/workflow-layouts",
  "using/panes-tabs-splits",
  "using/terminal",
  "using/files",
  "customize/keybindings",
  "customize/settings",
  "customize/themes",
  "customize/scripts",
  "agents/cli",
  "agents/cli-reference",
  "agents/background-tasks",
  "agents/claude-codex",
  "agents/tasks",
  "agents/hooks-notifications",
  "remote/attach",
  "plugins/index",
  "help/troubleshooting",
  "help/cli-diagnostics",
];

const STAMP_PREFIX = "<!-- source-hash:";
const CONTENT_DIR = "content";

/** Short content hash. Line endings are normalised so a CRLF checkout does not
 *  invalidate every stamp. */
export function contentHash(source: string): string {
  return createHash("sha256").update(source.replace(/\r\n/g, "\n")).digest("hex").slice(0, 12);
}

/** The stamp on a translation's first non-empty line, if any. */
export function readStamp(source: string): string | null {
  for (const line of source.split("\n")) {
    const t = line.trim();
    if (!t) continue;
    if (!t.startsWith(STAMP_PREFIX)) return null;
    return t.slice(STAMP_PREFIX.length).replace("-->", "").trim();
  }
  return null;
}

/** First `# heading` of a document. */
export function titleOf(source: string, fallback: string): string {
  for (const line of source.split("\n")) {
    const t = line.trim();
    if (t.startsWith("# ")) return t.slice(2).trim();
  }
  return fallback;
}

/** First sentence of the paragraph under the title, as plain text for search and link previews. */
export function descriptionOf(source: string, fallback: string): string {
  const lines = source.split("\n");
  const start = lines.findIndex((l) => l.trim().startsWith("# ")) + 1;
  const para: string[] = [];
  for (const line of lines.slice(start)) {
    if (line.trim() === "") {
      if (para.length) break;
      continue;
    }
    para.push(line.trim());
  }
  const text = para
    .join(" ")
    .replace(/<!--.*?-->/g, "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[`*]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  const sentence = text.match(/^.+?[.!?](?=\s|$)/);
  return (sentence ? sentence[0] : text) || fallback;
}

/** Sidebar label: the title without a trailing parenthetical or dash clause. */
export function navLabel(title: string, rel: string): string {
  let label = title;
  const paren = label.indexOf(" (");
  if (paren >= 2) label = label.slice(0, paren);
  const dash = label.indexOf(" — ");
  if (dash >= 0) label = label.slice(0, dash);
  label = label.trim();
  return label || rel;
}

type Translation = { title: string; navLabel: string; description: string; stamp: string | null };

export type Page = {
  /** Path under content/, without extension: `using/terminal`. */
  rel: string;
  section: number;
  title: string;
  navLabel: string;
  description: string;
  /** Hash of the Korean source; a translation is stamped with it. */
  sourceHash: string;
  /** The page's translations, by the contentDir of their language row. */
  translations: Record<string, Translation>;
};

const read = (root: string, rel: string): string | null => {
  try {
    return readFileSync(join(root, CONTENT_DIR, `${rel}.md`), "utf8");
  } catch {
    return null;
  }
};

/** Builds the page list in reading order. `root` is the site directory. */
export function buildPages(root: string): Page[] {
  return ORDER.map((rel) => {
    const source = read(root, rel);
    if (source === null) throw new Error(`ORDER lists ${rel}, but content/${rel}.md is missing`);
    const dir = rel.includes("/") ? rel.slice(0, rel.lastIndexOf("/")) : "";
    const section = SECTIONS.indexOf(dir);
    if (section < 0) throw new Error(`content/${rel}.md sits in a directory with no sidebar section`);

    const title = titleOf(source, rel);
    const translations: Record<string, Translation> = {};
    for (const { code, contentDir } of LANGS) {
      if (!contentDir) continue;
      const translated = read(root, `${contentDir}/${rel}`);
      if (!translated) throw new Error(`Missing translation for site language ${code}: content/${contentDir}/${rel}.md`);
      const tTitle = titleOf(translated, title);
      translations[contentDir] = {
        title: tTitle,
        navLabel: navLabel(tTitle, rel),
        description: descriptionOf(translated, tTitle),
        stamp: readStamp(translated),
      };
    }

    return {
      rel,
      section,
      title,
      navLabel: navLabel(title, rel),
      description: descriptionOf(source, title),
      sourceHash: contentHash(source),
      translations,
    };
  });
}

/** The translation a language shows for a page. Null for the canonical language, which shows the page itself. */
const translationIn = (page: Page, lang: Lang): Translation | null => {
  const { contentDir } = langRow(lang);
  return contentDir ? page.translations[contentDir] : null;
};

/** How a page stands in one language. */
export type PageState = "canonical" | "translated" | "stale";

export function stateOf(page: Page, lang: Lang): PageState {
  const translation = translationIn(page, lang);
  if (!translation) return "canonical";
  return translation.stamp === page.sourceHash ? "translated" : "stale";
}

/** The file a language shows for a page, relative to content/ and without extension. */
export function sourceRelIn(page: Page, lang: Lang): string {
  const { contentDir } = langRow(lang);
  return contentDir ? `${contentDir}/${page.rel}` : page.rel;
}

/**
 * The collection entry id that holds the body to render.
 *
 * The glob loader folds `<dir>/index.md` into `<dir>`; only the tree root keeps
 * the name `index`.
 */
export function entryIdFor(page: Page, lang: Lang): string {
  const path = sourceRelIn(page, lang);
  return path === "index" ? path : path.replace(/\/index$/, "");
}

export const titleIn = (p: Page, lang: Lang) => (translationIn(p, lang) ?? p).title;
export const descriptionIn = (p: Page, lang: Lang) => (translationIn(p, lang) ?? p).description;
export const navLabelIn = (p: Page, lang: Lang) => (translationIn(p, lang) ?? p).navLabel;

/** Route prefix of a language's guide, without a trailing slash: `guide`, `ko/guide`. */
export const prefixOf = (lang: Lang) => langRow(lang).guide.replace(/\/$/, "");

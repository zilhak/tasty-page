/** The site's languages, one row each, in the order the language switch shows them.
 * A .mjs file so scripts can read it too, like base.mjs.
 *
 * Paths are relative to the deployment base. shareImage names a file that must
 * exist, so a new language points at an existing image until it has its own.
 * contentDir is the language's translation tree under content/, and null for the
 * canonical language, whose pages sit directly in content/. code goes to hreflang
 * and <html lang>; never build a path from it, because a path may differ from the
 * code. */
export const LANGS = [
  {
    code: "en",
    prefix: "",
    label: "EN",
    ogLocale: "en_US",
    landing: "",
    guide: "guide/",
    contentDir: "en",
    privacy: "privacy/",
    searchIndex: "search-index.json",
    shareImage: "tasty-share-en.png",
  },
  {
    code: "ko",
    prefix: "ko/",
    label: "KO",
    ogLocale: "ko_KR",
    landing: "ko/",
    guide: "ko/guide/",
    contentDir: null,
    privacy: "ko/privacy/",
    searchIndex: "search-index.ko.json",
    shareImage: "tasty-share-ko.png",
  },
];

/** The language served without a path prefix, and the target of x-default. */
export const DEFAULT_LANG = "en";

/** The language the guide is written in. Translations are stamped against it. */
export const CANONICAL_LANG = "ko";

/** The translation trees under content/, by the language rows. */
export const TRANSLATION_DIRS = LANGS.flatMap((row) => row.contentDir ?? []);

/** The row of a path relative to content/. Everything outside a row's tree is the
 * canonical language, including a translation folder whose language has no row yet.
 * Such a folder publishes nothing: buildPages reads only the rows. */
export const rowOfContentPath = (rel) => {
  const top = rel.split(/[\\/]/)[0];
  return LANGS.find((row) => row.contentDir === top) ?? langRow(CANONICAL_LANG);
};

/** The row of a language code. An unknown code is an error, not a fallback. */
export const langRow = (code) => {
  const row = LANGS.find((candidate) => candidate.code === code);
  if (!row) throw new Error(`Unknown site language: ${code}`);
  return row;
};

/** A page's path per language code, for pages that exist in every listed language. */
export const hrefsFor = (pathOfRow) => Object.fromEntries(LANGS.map((row) => [row.code, pathOfRow(row)]));

/** One static path per language for a route under `[...locale]`. The language without a prefix has no locale segment. */
export const localePaths = () =>
  LANGS.map((row) => ({
    params: { locale: row.prefix.replace(/\/$/, "") || undefined },
    props: { lang: row.code },
  }));

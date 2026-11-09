/** The site's languages, one row each, in the order the language switch shows them.
 * A .mjs file so scripts can read it too, like base.mjs.
 *
 * Paths are relative to the deployment base. shareImage names a file that must
 * exist, so a new language points at an existing image until it has its own. */
export const LANGS = [
  {
    code: "en",
    prefix: "",
    label: "EN",
    ogLocale: "en_US",
    landing: "",
    guide: "guide/",
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
    privacy: "ko/privacy/",
    searchIndex: "search-index.ko.json",
    shareImage: "tasty-share-ko.png",
  },
];

/** The language served without a path prefix, and the target of x-default. */
export const DEFAULT_LANG = "en";

/** The row of a language code. An unknown code is an error, not a fallback. */
export const langRow = (code) => {
  const row = LANGS.find((candidate) => candidate.code === code);
  if (!row) throw new Error(`Unknown site language: ${code}`);
  return row;
};

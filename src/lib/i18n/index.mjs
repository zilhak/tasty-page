/** Every site language's copy, one dictionary per language. A .mjs file so the
 * Markdown processor, which runs outside Vite, can read it too.
 *
 * Importing this file checks the dictionaries, so a missing or extra key, an empty
 * value or a language row with no dictionary fails `npm run build`. There is no
 * fallback to another language. Register a dictionary here before its language gets
 * a row in langs.mjs: it is checked from then on.
 *
 * Do not import this from a client island. It would send every language to the
 * browser. Pass the current language's values as props instead. */
import { DEFAULT_LANG, LANGS } from "../langs.mjs";
import { dictionaryProblems } from "./check.mjs";
import en from "./en.mjs";
import ja from "./ja.mjs";
import ko from "./ko.mjs";

const DICTIONARIES = { en, ko, ja };

const problems = dictionaryProblems(DICTIONARIES, DEFAULT_LANG, LANGS.map((row) => row.code));
if (problems.length > 0) {
  throw new Error(`Site dictionaries have ${problems.length} problem(s):\n${problems.map((p) => `  - ${p}`).join("\n")}`);
}

/** The dictionary of a language code. An unknown code is an error, not a fallback. */
export const dictionaryFor = (code) => {
  if (!Object.hasOwn(DICTIONARIES, code)) throw new Error(`No dictionary for site language: ${code}`);
  return DICTIONARIES[code];
};

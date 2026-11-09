/** Every site language's copy, one dictionary per language. A .mjs file so the
 * Markdown processor, which runs outside Vite, can read it too.
 *
 * Do not import this from a client island. It would send every language to the
 * browser. Pass the current language's values as props instead. */
import en from "./en.mjs";
import ko from "./ko.mjs";

const DICTIONARIES = { en, ko };

/** The dictionary of a language code. An unknown code is an error, not a fallback. */
export const dictionaryFor = (code) => {
  if (!Object.hasOwn(DICTIONARIES, code)) throw new Error(`No dictionary for site language: ${code}`);
  return DICTIONARIES[code];
};

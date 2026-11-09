/** User-facing chrome strings. The values live in the language dictionaries. */
import { SECTIONS } from "./guide";
import { dictionaryFor } from "./i18n/index.mjs";
import type en from "./i18n/en.mjs";

export type Strings = (typeof en)["chrome"];

/** The strings of a language code. An unknown code is an error, not a fallback. */
export const stringsFor = (lang: string): Strings => dictionaryFor(lang).chrome;

/** Sidebar label of a section, by its index in SECTIONS. The guide home has no directory, so its key is `home`. */
export const sectionLabel = (section: number, lang: string): string => {
  const key = SECTIONS[section] || "home";
  const label = dictionaryFor(lang).sections[key];
  if (!label) throw new Error(`No sidebar label for section ${key} in site language: ${lang}`);
  return label;
};

/** Structure check for the language dictionaries. A .mjs file with no imports so
 * anything can run it. Reports every problem at once, each with the language code
 * and key path, so a translator can fix a whole dictionary in one pass. */

/** Keys that may be empty because word order differs between languages. */
const MAY_BE_EMPTY = new Set(["landing.titleLead", "landing.titleAccent", "landing.titleTail"]);

const kindOf = (value) => (Array.isArray(value) ? "array" : value === null ? "null" : typeof value);
const placeholders = (text) => (text.match(/\{[a-z]+\}/g) ?? []).sort().join(" ");

/** Empty strings anywhere under a value, the reference language included. */
function emptyValues(code, value, path, problems) {
  if (typeof value === "string") {
    if (value.trim() === "" && !MAY_BE_EMPTY.has(path)) problems.push(`${code}: ${path} is empty`);
  } else if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) emptyValues(code, child, path ? `${path}.${key}` : key, problems);
  }
}

/** Differences between a dictionary and the reference at one path. */
function compare(code, reference, value, path, problems) {
  const expected = kindOf(reference);
  const actual = kindOf(value);
  if (expected !== actual) {
    problems.push(`${code}: ${path} is ${actual}, expected ${expected}`);
  } else if (expected === "array") {
    if (reference.length !== value.length) {
      problems.push(`${code}: ${path} has ${value.length} items, expected ${reference.length}`);
    }
    const shared = Math.min(reference.length, value.length);
    for (let i = 0; i < shared; i++) compare(code, reference[i], value[i], `${path}[${i}]`, problems);
  } else if (expected === "object") {
    for (const key of Object.keys(reference)) {
      const child = path ? `${path}.${key}` : key;
      if (Object.hasOwn(value, key)) compare(code, reference[key], value[key], child, problems);
      else problems.push(`${code}: ${child} is missing`);
    }
    for (const key of Object.keys(value)) {
      if (!Object.hasOwn(reference, key)) problems.push(`${code}: ${path ? `${path}.${key}` : key} is not a key of the reference dictionary`);
    }
  } else if (expected === "string" && placeholders(reference) !== placeholders(value)) {
    problems.push(`${code}: ${path} has placeholders [${placeholders(value)}], expected [${placeholders(reference)}]`);
  }
}

/**
 * Problems in a set of dictionaries, as messages.
 * `dictionaries` maps language codes to dictionaries, including languages with no
 * row yet. `referenceCode` names the one the others must match. `rowCodes` are the
 * codes in the language list, and each of them needs a dictionary.
 */
export function dictionaryProblems(dictionaries, referenceCode, rowCodes) {
  const problems = [];
  const reference = dictionaries[referenceCode];
  for (const code of rowCodes) {
    if (!Object.hasOwn(dictionaries, code)) problems.push(`${code}: the language list has a row but no dictionary is registered`);
  }
  if (!reference) return problems;
  for (const [code, dictionary] of Object.entries(dictionaries)) {
    const declared = dictionary.chrome?.lang;
    if (declared !== code) problems.push(`${code}: chrome.lang is ${JSON.stringify(declared)}, expected the language code`);
    emptyValues(code, dictionary, "", problems);
    if (code !== referenceCode) compare(code, reference, dictionary, "", problems);
  }
  return problems;
}

// Check that the two icon copies in vendor/ draw the same glyphs.
//
// The site draws ICON_PATHS from vendor/components/core/Icon.jsx, not the files in
// vendor/icons/*.svg, so both copies must carry the same glyph names, the same inner
// markup and the same opening <svg> attributes. The check compares normalized source
// text. It does not render, so it cannot prove pixel equality, and a change that only
// rewrites the notation can still be reported as a difference.
//
// Exits 1 and lists every problem when the copies disagree.

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const ICON_DIR = "vendor/icons";
const REGISTRY = "vendor/components/core/Icon.jsx";

/** Lower bound for every parsed copy, so that two empty parses cannot pass as equal. */
const PARSE_FLOOR = 60;

/** Glyphs drawn filled. Icon.jsx FILL_GLYPHS must name exactly these. */
const FILLED = ["starFill"];

/** Opening-tag attributes that must be equal everywhere: SVG name and JSX name. */
const SHARED_ENVELOPE = [
  ["viewBox", "viewBox"],
  ["stroke-width", "strokeWidth"],
  ["stroke-linecap", "strokeLinecap"],
  ["stroke-linejoin", "strokeLinejoin"],
];

/** Attributes only a standalone SVG document needs. The inline JSX tag must not have them. */
const DOCUMENT_ONLY_ENVELOPE = ["xmlns"];

/** Attributes that may differ: color comes from currentColor, and filling is checked through FILLED. */
const DIVERGENT_ENVELOPE = ["stroke", "fill"];

const SHAPES = ["circle", "path", "rect", "line", "polyline", "polygon", "ellipse"];

/** Unify self-closing tags and collapse whitespace, including whitespace inside attributes. */
function normalize(body) {
  let s = body;
  for (const tag of SHAPES) s = s.split(`></${tag}>`).join("/>");
  return s.replace(/[ \t\n\r\f]+/g, " ").split("> <").join("><").trim();
}

function svgSources() {
  const out = new Map();
  for (const file of readdirSync(ICON_DIR).filter((f) => f.endsWith(".svg")).sort()) {
    out.set(file.slice(0, -4), readFileSync(join(ICON_DIR, file), "utf8"));
  }
  return out;
}

/** name -> normalized inner markup of vendor/icons/<name>.svg */
function fileBodies(sources, problems) {
  const out = new Map();
  for (const [name, text] of sources) {
    const openEnd = text.indexOf(">");
    const close = text.lastIndexOf("</svg>");
    if (openEnd === -1 || close === -1) {
      problems.push(`${name}.svg: cannot find the <svg> element`);
      continue;
    }
    out.set(name, normalize(text.slice(openEnd + 1, close)));
  }
  return out;
}

/** ICON_PATHS entries, each a one-line single-quoted string. */
function registryBodies(src) {
  const start = src.indexOf("export const ICON_PATHS = {");
  if (start === -1) throw new Error(`${REGISTRY}: cannot find ICON_PATHS`);
  const rest = src.slice(start);
  const end = rest.indexOf("\n};");
  if (end === -1) throw new Error(`${REGISTRY}: cannot find the end of ICON_PATHS`);
  const out = new Map();
  for (const raw of rest.slice(0, end).split("\n").slice(1)) {
    const line = raw.trim();
    if (!line || line.startsWith("//")) continue;
    const colon = line.indexOf(":");
    if (colon === -1) continue;
    const rhs = line.slice(colon + 1);
    const open = rhs.indexOf("'");
    const close = rhs.lastIndexOf("'");
    if (open === -1 || close <= open) continue;
    out.set(line.slice(0, colon).trim(), normalize(rhs.slice(open + 1, close)));
  }
  return out;
}

function filledGlyphs(src) {
  const start = src.indexOf("FILL_GLYPHS = new Set([");
  if (start === -1) throw new Error(`${REGISTRY}: cannot find FILL_GLYPHS`);
  const rest = src.slice(start);
  const end = rest.indexOf("])");
  if (end === -1) throw new Error(`${REGISTRY}: cannot find the end of FILL_GLYPHS`);
  return new Set([...rest.slice(0, end).matchAll(/"([^"]*)"/g)].map((m) => m[1]));
}

/** Marks a JSX expression value. Its content is not compared. */
const JSX_EXPR = "{expr}";

/** Double-quoted attribute values of an opening tag; JSX expressions become JSX_EXPR. */
function openTagAttrs(tag) {
  const out = new Map();
  let i = 0;
  while (i < tag.length) {
    if (!/[A-Za-z]/.test(tag[i])) {
      i++;
      continue;
    }
    const start = i;
    while (i < tag.length && /[A-Za-z0-9:-]/.test(tag[i])) i++;
    const name = tag.slice(start, i);
    let j = i;
    while (j < tag.length && /\s/.test(tag[j])) j++;
    if (tag[j] !== "=") continue;
    j++;
    while (j < tag.length && /\s/.test(tag[j])) j++;
    if (tag[j] === '"') {
      const close = tag.indexOf('"', j + 1);
      if (close === -1) break;
      out.set(name, tag.slice(j + 1, close));
      i = close + 1;
    } else if (tag[j] === "{") {
      let depth = 0;
      let k = j;
      for (; k < tag.length; k++) {
        if (tag[k] === "{") depth++;
        else if (tag[k] === "}" && --depth === 0) break;
      }
      out.set(name, JSX_EXPR);
      i = Math.min(k + 1, tag.length);
    }
  }
  return out;
}

/** The opening <svg ...> tag, up to the first > outside double quotes. */
function svgOpenTag(src, what) {
  const at = src.indexOf("<svg");
  if (at === -1) throw new Error(`${what}: cannot find <svg`);
  let inQuote = false;
  for (let i = at; i < src.length; i++) {
    if (src[i] === '"') inQuote = !inQuote;
    else if (src[i] === ">" && !inQuote) return src.slice(at, i);
  }
  throw new Error(`${what}: the opening <svg> tag is not closed`);
}

function registryEnvelope(src) {
  const at = src.indexOf("export function Icon(");
  if (at === -1) throw new Error(`${REGISTRY}: cannot find export function Icon(`);
  return openTagAttrs(svgOpenTag(src.slice(at), `${REGISTRY} component`));
}

const problems = [];
const registrySrc = readFileSync(REGISTRY, "utf8");
const sources = svgSources();
const files = fileBodies(sources, problems);
const registry = registryBodies(registrySrc);

// Both parsers must actually read the copies.
for (const [what, n] of [[`${ICON_DIR}/*.svg`, files.size], [`${REGISTRY} ICON_PATHS`, registry.size]]) {
  if (n < PARSE_FLOOR) problems.push(`read only ${n} glyphs from ${what} (floor ${PARSE_FLOOR}); check the source format`);
}

// Same glyph names.
const onlyFiles = [...files.keys()].filter((k) => !registry.has(k));
const onlyRegistry = [...registry.keys()].filter((k) => !files.has(k));
if (onlyFiles.length || onlyRegistry.length) {
  problems.push(`glyph names differ. Only in ${ICON_DIR}: [${onlyFiles.join(", ")}]. Only in ICON_PATHS: [${onlyRegistry.join(", ")}]`);
}

// Same inner markup.
for (const [name, body] of files) {
  if (!registry.has(name) || registry.get(name) === body) continue;
  problems.push(`inner markup differs for ${name}:\n    icons/${name}.svg  ${body}\n    ICON_PATHS        ${registry.get(name)}`);
}

// Opening-tag attributes.
const classified = new Set([...SHARED_ENVELOPE.map(([svg]) => svg), ...DOCUMENT_ONLY_ENVELOPE, ...DIVERGENT_ENVELOPE]);
const envelopes = new Map([...sources].map(([name, text]) => [name, openTagAttrs(svgOpenTag(text, `${name}.svg`))]));
const regEnvelope = registryEnvelope(registrySrc);
if (!regEnvelope.has(SHARED_ENVELOPE[0][1])) {
  problems.push(`could not read ${SHARED_ENVELOPE[0][1]} from the <svg> tag in ${REGISTRY}`);
}
for (const [name, attrs] of envelopes) {
  for (const key of attrs.keys()) {
    if (!classified.has(key)) {
      problems.push(`${name}.svg: unclassified <svg> attribute ${key}. Add it to SHARED_ENVELOPE if every copy must agree, or to DIVERGENT_ENVELOPE with a reason`);
    }
  }
  for (const [svgAxis] of SHARED_ENVELOPE) {
    if (!attrs.has(svgAxis)) problems.push(`${name}.svg: missing shared attribute ${svgAxis}`);
  }
}
for (const [svgAxis, jsxAxis] of SHARED_ENVELOPE) {
  const byValue = new Map();
  const add = (v, where) => byValue.set(v, [...(byValue.get(v) ?? []), where]);
  for (const [name, attrs] of envelopes) if (attrs.has(svgAxis)) add(attrs.get(svgAxis), `${name}.svg`);
  if (regEnvelope.has(jsxAxis)) add(regEnvelope.get(jsxAxis), REGISTRY);
  else problems.push(`${jsxAxis} is missing from the <svg> tag in ${REGISTRY}, which is what the site draws`);
  if (byValue.size > 1) {
    const spread = [...byValue].map(([v, wheres]) => {
      const head = wheres.slice(0, 3).join(", ");
      return wheres.length > 3 ? `"${v}" in ${head} and ${wheres.length - 3} more` : `"${v}" in ${head}`;
    });
    problems.push(`[${svgAxis}] differs: ${spread.join(" / ")}`);
  }
}
for (const axis of DOCUMENT_ONLY_ENVELOPE) {
  const values = new Set([...envelopes.values()].map((a) => a.get(axis)));
  if (values.size !== 1 || values.has(undefined)) {
    problems.push(`${axis} differs or is missing among the SVG files: ${[...values].map(String).join(", ")}`);
  }
  if (regEnvelope.has(axis)) {
    problems.push(`${axis} appeared on the inline <svg> in ${REGISTRY}; it is no longer document-only, so move it to SHARED_ENVELOPE`);
  }
}

// Filled glyphs.
const fill = filledGlyphs(registrySrc);
if (fill.size === 0) problems.push(`read FILL_GLYPHS as an empty set`);
const want = new Set(FILLED);
if (fill.size !== want.size || [...fill].some((g) => !want.has(g))) {
  problems.push(`FILL_GLYPHS [${[...fill].join(", ")}] differs from FILLED [${FILLED.join(", ")}]`);
}
for (const name of FILLED) {
  if (!files.has(name) || !registry.has(name)) problems.push(`filled glyph ${name} is missing from one of the copies`);
}

if (problems.length) {
  console.error(`icon copies disagree (${problems.length} problem(s)):\n  - ${problems.join("\n  - ")}`);
  process.exit(1);
}
console.log(`${files.size} icon files and ${registry.size} ICON_PATHS entries agree`);

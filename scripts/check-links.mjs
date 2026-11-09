/**
 * Checks every internal link and `#anchor` in the built site, and that a link from a design page to a design page stays in
 * the language of the page it is on.
 *
 *   node scripts/check-links.mjs [dist]
 */
import { readdirSync, statSync, readFileSync, existsSync } from "node:fs";
import { join, resolve, dirname, relative } from "node:path";
import { BASE } from "../src/lib/base.mjs";
import { LANGS } from "../src/lib/langs.mjs";

const base = BASE.replace(/\/$/, "");

const dist = resolve(process.argv[2] ?? "dist");
if (!existsSync(dist)) {
  console.error(`no build at ${dist} — run npm run build first`);
  process.exit(2);
}

const htmlFiles = [];
(function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else if (name.endsWith(".html")) htmlFiles.push(p);
  }
})(dist);

const anchorsOf = (html) =>
  new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));

const anchors = new Map(htmlFiles.map((f) => [f, anchorsOf(readFileSync(f, "utf8"))]));

/** Where a site path lands on disk, following the directory build format. */
const targetOf = (path) => {
  const clean = path.replace(/[?#].*$/, "");
  // A site-absolute link carries the base; the build output does not.
  if (base && !(clean === base || clean.startsWith(`${base}/`))) return null;
  const p = join(dist, clean.slice(base.length));
  if (existsSync(p) && statSync(p).isDirectory()) return join(p, "index.html");
  if (existsSync(p)) return p;
  if (existsSync(`${p}.html`)) return `${p}.html`;
  return null;
};

// A site path's language and the rest of the path. Only the language without a prefix matches every path, so it comes last.
const languageRows = [...LANGS].sort((a, b) => b.prefix.length - a.prefix.length);
const languageOf = (path) => {
  const row = languageRows.find((candidate) => path.startsWith(candidate.prefix));
  return { code: row.code, rest: path.slice(row.prefix.length) };
};
const isDesignPage = (path) => /^design\/(?:tokens\/|gallery\/.*)?$/.test(path);

let broken = 0;
let checked = 0;
let leaks = 0;
for (const file of htmlFiles) {
  const html = readFileSync(file, "utf8");
  const here = relative(dist, file);
  const page = languageOf(here.replace(/index\.html$/, ""));
  // The language switch is the way out of a language. Head links are not anchors, so hreflang is not looked at.
  if (isDesignPage(page.rest)) {
    for (const m of html.matchAll(/<a\b[^>]*>/g)) {
      if (/\sdata-lang=/.test(m[0])) continue;
      const raw = /\shref="([^"]+)"/.exec(m[0])?.[1];
      if (!raw || /^(https?:|mailto:|#|\/\/)/.test(raw)) continue;
      const path = (raw.startsWith("/") ? raw.slice(base.length + 1) : relative(dist, resolve(dirname(file), raw))).replace(/[?#].*$/, "");
      const target = languageOf(path.endsWith("/") || path === "" ? path : `${path}/`);
      if (isDesignPage(target.rest) && target.code !== page.code) {
        leaks++;
        console.error(`  ${here}: ${raw} leaves the ${page.code} path for ${target.code}. A link between specimen pages is a relative path`);
      }
    }
  }
  for (const m of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const raw = m[1];
    if (/^(https?:|mailto:|data:|#|\/\/)/.test(raw)) {
      // A bare fragment must exist on this very page.
      if (raw.startsWith("#") && raw.length > 1) {
        checked++;
        if (!anchors.get(file).has(decodeURIComponent(raw.slice(1)))) {
          broken++;
          console.error(`  ${here}: ${raw}`);
        }
      }
      continue;
    }
    checked++;
    const abs = raw.startsWith("/")
      ? raw
      : `${base}/${relative(dist, resolve(dirname(file), raw))}`;
    const target = targetOf(abs);
    if (!target) {
      broken++;
      console.error(`  ${here}: ${raw}`);
      continue;
    }
    const hash = raw.includes("#") ? decodeURIComponent(raw.slice(raw.indexOf("#") + 1)) : null;
    if (hash && !anchors.get(target)?.has(hash)) {
      broken++;
      console.error(`  ${here}: ${raw} (no #${hash} in target)`);
    }
  }
}

console.log(`${htmlFiles.length} pages, ${checked} links checked, ${broken} broken, ${leaks} design links leaving their language`);
process.exit(broken + leaks > 0 ? 1 : 0);

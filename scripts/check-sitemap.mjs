/**
 * Checks dist/sitemap.xml against the built pages. A public page is built HTML whose head has no noindex, so no list of
 * paths is written twice. Fails when a public page is missing, when a <loc> names no built page or a noindex page, when a
 * <loc> repeats, or when the sitemap is missing or empty.
 *
 *   node scripts/check-sitemap.mjs [dist]
 */
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";
import { BASE, SITE } from "../src/lib/base.mjs";

const dist = resolve(process.argv[2] ?? "dist");
if (!existsSync(dist)) {
  console.error(`no build at ${dist} — run npm run build first`);
  process.exit(2);
}

// A 404 page answers with status 404, so no crawler indexes it and it has no place in a sitemap.
const NOT_A_PAGE = new Set(["404.html"]);
const base = BASE.replace(/\/$/, "");

const htmlFiles = [];
(function walk(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path);
    else if (name.endsWith(".html")) htmlFiles.push(path);
  }
})(dist);

const hasNoindex = (html) => {
  const head = html.slice(0, Math.max(html.search(/<\/head>/i), 0));
  return [...head.matchAll(/<meta\b[^>]*>/gi)].some(([tag]) => /\bname=["']?robots\b/i.test(tag) && /\bcontent=["'][^"']*\bnoindex\b/i.test(tag));
};
const addressOf = (file) => {
  const rel = relative(dist, file).split(sep).join("/");
  return encodeURI(`${SITE}${base}/${rel === "index.html" ? "" : rel.replace(/(^|\/)index\.html$/, "$1")}`);
};

const publicPages = new Set();
const noindexPages = new Set();
for (const file of htmlFiles) {
  if (NOT_A_PAGE.has(relative(dist, file))) continue;
  (hasNoindex(readFileSync(file, "utf8")) ? noindexPages : publicPages).add(addressOf(file));
}

const problems = [];
const sitemap = join(dist, "sitemap.xml");
const locs = existsSync(sitemap) ? [...readFileSync(sitemap, "utf8").matchAll(/<loc>\s*([^<]*?)\s*<\/loc>/g)].map((m) => m[1]) : [];
if (!existsSync(sitemap)) problems.push("no sitemap.xml in the build");
else if (locs.length === 0) problems.push("sitemap.xml has no <loc>");

const listed = new Set(locs);
for (const page of publicPages) if (!listed.has(page)) problems.push(`public page missing from the sitemap: ${page}`);
const seen = new Set();
for (const loc of locs) {
  if (seen.has(loc)) problems.push(`repeated <loc>: ${loc}`);
  seen.add(loc);
  if (noindexPages.has(loc)) problems.push(`<loc> names a noindex page: ${loc}`);
  else if (!publicPages.has(loc)) problems.push(`<loc> names no built page: ${loc}`);
}

problems.forEach((p) => console.error(`  ${p}`));
console.log(`${publicPages.size} public pages, ${locs.length} sitemap locs, ${noindexPages.size} noindex pages left out, ${problems.length} problems`);
process.exit(problems.length > 0 ? 1 : 0);

import type { APIRoute } from "astro";
import { DESIGN_PAGES, designPath, isIndexed } from "../lib/design";
import { LANGS as SITE_LANGS } from "../lib/langs.mjs";
import { buildPages, type Lang } from "../lib/guide";
import { absolute } from "../lib/site";
import { pathOf } from "../lib/urls";

const LANGS: Lang[] = ["en", "ko"];

/** The landings and the privacy notice have no shared list to read from. */
const SINGLE_PAGES = ["", "ko/", "privacy/", "ko/privacy/"];

/** Pages meant for search. A design page says which of its language paths those are. */
const paths = () => [
  ...SINGLE_PAGES,
  ...buildPages(process.cwd()).flatMap((page) => LANGS.map((lang) => pathOf(page, lang))),
  ...DESIGN_PAGES.flatMap((page) =>
    SITE_LANGS.filter((row) => isIndexed(page, row.code)).map((row) => designPath(page.slug, row.code)),
  ),
];

export const GET: APIRoute = () => {
  const urls = paths().map((path) => `  <url><loc>${absolute(path)}</loc></url>`);
  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls,
    "</urlset>",
    "",
  ].join("\n");
  return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
};

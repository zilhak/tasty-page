import type { APIRoute } from "astro";
import { buildPages } from "../lib/guide";
import { LANGS } from "../lib/langs.mjs";
import { searchIndex } from "../lib/search";

/** One index per language, under the file name its language row gives. */
export const getStaticPaths = () =>
  LANGS.map((row) => ({ params: { searchIndex: row.searchIndex }, props: { lang: row.code } }));

export const GET: APIRoute = ({ props }) => {
  const root = process.cwd();
  return new Response(JSON.stringify(searchIndex(root, buildPages(root), props.lang)), {
    headers: { "content-type": "application/json" },
  });
};

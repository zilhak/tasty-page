import type { APIRoute } from "astro";
import { absolute } from "../lib/site";

/** Allows everything. A Disallow would hide the noindex of the cards and the gallery from crawlers. */
export const GET: APIRoute = () =>
  new Response(`User-agent: *\nAllow: /\n\nSitemap: ${absolute("sitemap.xml")}\n`, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });

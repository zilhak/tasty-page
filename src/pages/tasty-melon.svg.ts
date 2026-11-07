import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/** The logo is a copy of the Tasty repository's logo, kept in this repository's assets. */
export const GET = () =>
  new Response(readFileSync(resolve(process.cwd(), "assets/icons/tasty-melon.svg")), {
    headers: { "Content-Type": "image/svg+xml" },
  });

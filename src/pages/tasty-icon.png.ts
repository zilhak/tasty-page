import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/** The app icon is a copy of the Tasty repository's icon, kept in this repository's assets. */
export const GET = () =>
  new Response(readFileSync(resolve(process.cwd(), "assets/icons/icon_256.png")), {
    headers: { "Content-Type": "image/png" },
  });

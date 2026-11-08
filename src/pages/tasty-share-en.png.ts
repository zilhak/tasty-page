import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/** The English share image, read from its design source in vendor/share. */
export const GET = () =>
  new Response(readFileSync(resolve(process.cwd(), "vendor/share/tasty-share-en.png")), {
    headers: { "Content-Type": "image/png" },
  });

import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";

/**
 * The user guide. Korean (`content/**`) is canonical; each translation tree, named
 * by its language row's contentDir, mirrors it path for path. All of them live in one
 * collection. The tree prefix on an entry id is what separates a translation from its
 * source (src/lib/guide.ts).
 */
const guide = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./content" }),
});

export const collections = { guide };

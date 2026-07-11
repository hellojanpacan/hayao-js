// Content collections — the site renders the monorepo's documentation directly,
// so hayao.dev can never drift from the repo it documents (same doctrine as the
// live demos importing ../src via the @hayao alias).

import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

/** docs/*.md — the engineering manual, rendered at /docs/<slug>. */
const docs = defineCollection({
  loader: glob({ pattern: "*.md", base: "../docs" }),
  // Repo docs carry no frontmatter — titles come from the first heading and
  // the curated map in pages/docs/index.astro.
  schema: z.object({}).passthrough(),
});

/** design/**'/'*.md — the Design Codex, rendered at /docs/codex/<id>.
    Modules carry full YAML frontmatter; shelf READMEs and playbooks don't. */
const codex = defineCollection({
  loader: glob({ pattern: ["**/*.md", "!_TEMPLATE.md", "!CONTRIBUTING.md"], base: "../design" }),
  schema: z
    .object({
      id: z.string().optional(),
      title: z.string().optional(),
      kind: z.string().optional(),
      tags: z.array(z.string()).optional(),
      summary: z.string().optional(),
      "use-when": z.string().optional(),
      "composes-with": z.array(z.string()).optional(),
      anchors: z.array(z.string()).optional(),
      "verify-with": z.string().optional(),
    })
    .passthrough(),
});

export const collections = { docs, codex };

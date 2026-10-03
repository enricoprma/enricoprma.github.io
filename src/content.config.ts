import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const projects = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/projects" }),
  schema: z.object({
    project: z.string(),
    locale: z.enum(["de", "en"]),
    summary: z.string(),
    role: z.string(),
    team: z.string(),
    context: z.string(),
    period: z.string(),
    video: z.object({
      src: z.string(),
      poster: z.string(),
      width: z.number().int().positive(),
      height: z.number().int().positive(),
      caption: z.string(),
      description: z.string(),
    }),
  }),
});

export const collections = { projects };

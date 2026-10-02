import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: z.object({
    project: z.string(),
    locale: z.enum(['de', 'en']),
    summary: z.string().optional(),
    role: z.string().optional(),
    team: z.string().optional(),
    context: z.string().optional(),
    period: z.string().optional(),
    video: z.object({
      src: z.string(),
      poster: z.string(),
      width: z.number().int().positive(),
      height: z.number().int().positive(),
      caption: z.string(),
      description: z.string(),
    }).optional(),
  }),
});

export const collections = { projects };

import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const feeds = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/feeds' }),
  schema: z.object({
    title: z.string().min(2),
    subtitle: z.string().min(2),
    category: z.enum(['worldcup', 'lol', 'stock', 'ai']),
    topic: z.string().min(2),
    date: z.coerce.date(),
    cover: z.string().min(1),
    tags: z.array(z.string()).default([]),
    summary: z.string().min(2),
    source: z.string().optional(),
    sourceUrl: z.url().optional(),
    reviewed: z.boolean().default(false),
    priority: z.number().default(0)
  })
});

export const collections = { feeds };

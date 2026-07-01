import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const feedCategorySchema = z.enum([
  'worldcup',
  'lol',
  'stock',
  'ai',
  'global',
  'rust',
  'product'
]);

const feeds = defineCollection({
  loader: glob({ pattern: '{worldcup,lol,stock,ai,global,rust,product}/**/*.md', base: './src/content' }),
  schema: z.object({
    title: z.string().min(2),
    subtitle: z.string().min(2),
    category: feedCategorySchema,
    kind: z.enum(['match_result', 'match_schedule', 'hot_topic', 'market_brief', 'policy_update']).default('hot_topic'),
    topic: z.string().min(2),
    date: z.coerce.date(),
    eventAt: z.coerce.date().optional(),
    eventKey: z.string().min(2).optional(),
    cover: z.string().min(1),
    fallbackCover: z.string().min(1).optional(),
    tags: z.array(z.string()).default([]),
    summary: z.string().min(2),
    source: z.string().optional(),
    sourceUrl: z.url().optional(),
    reviewed: z.boolean().default(false),
    priority: z.number().default(0)
  })
});

export const collections = { feeds };

import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const feedCategorySchema = z.enum([
  'worldcup',
  'lol',
  'stock',
  'ai',
  'compute',
  'global',
  'rust',
  'dev',
  'security',
  'product'
]);

const feedKindSchema = z.enum([
  'match_result',
  'match_schedule',
  'match_flow',
  'player_spotlight',
  'knockout_update',
  'worldcup_feed',
  'hot_topic',
  'market_brief',
  'policy_update',
  'news',
  'breaking',
  'insight',
  'ai',
  'data',
  'visual'
]);

const coverStatusSchema = z.enum([
  'generated_webp',
  'pending'
]);

const feeds = defineCollection({
  loader: glob({ pattern: '{worldcup,lol,stock,ai,compute,global,rust,dev,security,product}/**/*.md', base: './src/content' }),
  schema: z.object({
    title: z.string().min(2),
    subtitle: z.string().min(2),
    category: feedCategorySchema,
    kind: feedKindSchema.default('news'),
    topic: z.string().min(2),
    date: z.coerce.date(),
    eventAt: z.coerce.date(),
    eventKey: z.string().min(2),
    cover: z.string().min(1),
    coverStatus: coverStatusSchema.default('generated_webp'),
    fallbackCover: z.string().min(1).optional(),
    tags: z.array(z.string()).default([]),
    summary: z.string().min(2),
    source: z.string().min(2),
    sourceUrl: z.url(),
    reviewed: z.boolean().default(false),
    priority: z.number().default(0)
  })
});

export const collections = { feeds };

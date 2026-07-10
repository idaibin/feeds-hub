import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { FEED_CATEGORIES, FEED_COVER_STATUSES, FEED_KINDS } from '@/domain/feed';

const feedCategorySchema = z.enum(FEED_CATEGORIES);
const feedKindSchema = z.enum(FEED_KINDS);
const coverStatusSchema = z.enum(FEED_COVER_STATUSES);

const feeds = defineCollection({
  loader: glob({ pattern: '{worldcup,lol,stock,ai,github,hot,compute,global,rust,dev,security,product}/**/*.md', base: './src/content' }),
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
    coverStatus: coverStatusSchema.default('pending'),
    tags: z.array(z.string()).default([]),
    summary: z.string().min(2),
    source: z.string().min(2),
    sourceUrl: z.url(),
    reviewed: z.boolean().default(false),
    priority: z.number().default(0)
  })
});

export const collections = { feeds };

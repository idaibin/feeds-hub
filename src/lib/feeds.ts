import { getCollection } from 'astro:content';

export const CATEGORIES = [
  { id: 'worldcup', name: '世界杯', shortName: '世界杯', description: '按年份聚合世界杯赛程、球队、焦点比赛与相关新闻，默认关注 2026 世界杯。' },
  { id: 'lol', name: 'LOL 赛事', shortName: 'LOL', description: '聚合 LPL、先锋赛、MSI、世界赛等英雄联盟赛事信息。' },
  { id: 'stock', name: '股市简报', shortName: '股市', description: '聚合 A 股、美股、创业板、纳斯达克等市场重点信息。' },
  { id: 'ai', name: 'AI 科技', shortName: 'AI 科技', description: '聚合 AI、科技公司、开源模型、工程工具与产品动态。' }
] as const;

export type CategoryId = (typeof CATEGORIES)[number]['id'];

export function getCategoryMeta(category: string) {
  return CATEGORIES.find((item) => item.id === category) ?? CATEGORIES[0];
}

export async function getAllFeeds() {
  const feeds = await getCollection('feeds', ({ data }) => data.reviewed === true);
  return feeds.sort((a, b) => {
    const timeDelta = b.data.date.getTime() - a.data.date.getTime();
    if (timeDelta !== 0) return timeDelta;
    return b.data.priority - a.data.priority;
  });
}

export async function getFeedsByCategory(category: CategoryId) {
  const feeds = await getAllFeeds();
  return feeds.filter((entry) => entry.data.category === category);
}

export function getFeedCounts(feeds: Awaited<ReturnType<typeof getAllFeeds>>) {
  return Object.fromEntries(
    CATEGORIES.map((category) => [
      category.id,
      feeds.filter((entry) => entry.data.category === category.id).length
    ])
  ) as Record<CategoryId, number>;
}

export function formatDate(value: Date) {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(value);
}

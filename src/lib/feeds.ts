import { getCollection } from 'astro:content';

export const CATEGORIES = [
  { id: 'worldcup', name: '世界杯', shortName: '世界杯', description: '按年份聚合世界杯赛程、球队、焦点比赛与相关新闻，默认关注 2026 世界杯。' },
  { id: 'lol', name: 'LOL 赛事', shortName: 'LOL', description: '聚合 LPL、先锋赛、MSI、世界赛等英雄联盟赛事信息。' },
  { id: 'stock', name: '股市简报', shortName: '股市', description: '聚合 A 股、美股、创业板、纳斯达克等市场重点信息。' },
  { id: 'ai', name: 'AI 科技', shortName: 'AI 科技', description: '聚合 AI、科技公司、开源模型、工程工具与产品动态。' },
  { id: 'compute', name: 'AI 基建', shortName: 'AI 基建', description: '聚合 AI 芯片、HBM、数据中心、云资本开支、电力与基础设施动态。' },
  { id: 'rust', name: '开源与 Rust', shortName: 'Rust', description: '聚合 Rust、开源项目、工程工具、基础设施与开发者生态动态。' },
  { id: 'dev', name: '开发者生态', shortName: '开发', description: '聚合 TypeScript、Node、前端框架、运行时、云平台和开发工具动态。' },
  { id: 'security', name: '安全简报', shortName: '安全', description: '聚合 CVE、安全公告、供应链风险、开源依赖和云安全事件。' },
  { id: 'product', name: '创业与产品设计', shortName: '产品', description: '聚合创业、产品设计、增长、用户体验与商业化相关信息。' },
  { id: 'global', name: '全球重点', shortName: '全球', description: '聚合全球范围内值得关注的政治、经济、社会与科技综合新闻。' }
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

export function getFeedsByCategory(feeds: Awaited<ReturnType<typeof getAllFeeds>>, category: string) {
  return feeds.filter((entry) => entry.data.category === category);
}

export function formatDate(value: Date) {
  return new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(value);
}

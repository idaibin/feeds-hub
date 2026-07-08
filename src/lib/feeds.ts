import { getCollection } from 'astro:content';

export const CATEGORIES = [
  { id: 'ai', name: 'AI 科技', shortName: 'AI 科技', description: '聚合 AI、科技公司、开源模型、工程工具与产品动态。' },
  { id: 'github', name: 'GitHub 热榜', shortName: 'GitHub', description: '聚合 GitHub 热门仓库、Star 增长、重要 release、AI 相关开源项目和安全公告。' },
  { id: 'stock', name: '股市闭市', shortName: '股市', description: '汇报 A 股、港股、美股每日闭市情况和关键市场信息。' },
  { id: 'hot', name: '热点新闻', shortName: '热点', description: '汇总微博和 X 上的最新公共热点，按小时限量生成。' },
  { id: 'lol', name: 'LOL 赛事', shortName: 'LOL', description: '聚合 LPL、先锋赛、MSI、世界赛等英雄联盟赛事信息。' },
  { id: 'worldcup', name: '世界杯', shortName: '世界杯', description: '按年份聚合世界杯赛程、球队、焦点比赛与相关新闻，默认关注 2026 世界杯。' },
  { id: 'compute', name: 'AI 基建', shortName: 'AI 基建', description: '聚合 AI 芯片、HBM、数据中心、云资本开支、电力与基础设施动态。' },
  { id: 'rust', name: '开源与 Rust', shortName: 'Rust', description: '聚合 Rust、开源项目、工程工具、基础设施与开发者生态动态。' },
  { id: 'dev', name: '开发者生态', shortName: '开发', description: '聚合 TypeScript、Node、前端框架、运行时、云平台和开发工具动态。' },
  { id: 'security', name: '安全简报', shortName: '安全', description: '聚合 CVE、安全公告、供应链风险、开源依赖和云安全事件。' },
  { id: 'product', name: '创业与产品设计', shortName: '产品', description: '聚合创业、产品设计、增长、用户体验与商业化相关信息。' },
  { id: 'global', name: '全球重点', shortName: '全球', description: '聚合全球范围内值得关注的政治、经济、社会与科技综合新闻。' }
] as const;

export type CategoryId = (typeof CATEGORIES)[number]['id'];

export const FEED_GROUPS = [
  {
    id: 'realtime',
    name: '实时性',
    shortName: '实时性',
    description: '聚合 AI、GitHub、股市闭市、热点、科技、开发、安全和产品等高时效信息。',
    categories: ['ai', 'github', 'stock', 'hot', 'compute', 'rust', 'dev', 'security', 'product']
  },
  {
    id: 'sports',
    name: '赛事',
    shortName: '赛事',
    description: '聚合世界杯、LOL 等赛事赛程、进展、结果和焦点事件。',
    categories: ['lol', 'worldcup']
  }
] as const;

export const FEED_TOPIC_GROUPS = [
  {
    id: 'ai',
    name: 'AI',
    shortName: 'AI',
    description: '聚合 AI 科技、模型、技巧、开源仓库、芯片、数据中心与基础设施动态。',
    categories: ['ai', 'github', 'compute']
  },
  {
    id: 'dev',
    name: '开发者',
    shortName: '开发者',
    description: '聚合 GitHub、Rust、开源项目、工程工具、前端框架和开发者生态动态。',
    categories: ['dev', 'rust']
  }
] as const;

export const PRIMARY_FEED_NAV = [
  { id: 'all', href: '/', label: '全部' },
  { id: 'hot', href: '/category/hot/', label: '热点' },
  { id: 'ai', href: '/category/ai/', label: 'AI' },
  { id: 'github', href: '/category/github/', label: 'GitHub' },
  { id: 'stock', href: '/category/stock/', label: '股市' },
  { id: 'lol', href: '/category/lol/', label: '英雄联盟' },
  { id: 'worldcup', href: '/category/worldcup/', label: '世界杯' }
] as const;

export function getCategoryMeta(category: string) {
  return CATEGORIES.find((item) => item.id === category) ?? CATEGORIES[0];
}

function isStockCloseFeed(entry: { data: { category: string; eventKey: string; title: string; subtitle: string; topic: string } }) {
  if (entry.data.category !== 'stock') return true;

  const text = [
    entry.data.eventKey,
    entry.data.topic,
    entry.data.title,
    entry.data.subtitle
  ].join(' ').toLowerCase();
  const marketText = [
    entry.data.topic,
    entry.data.title,
    entry.data.subtitle
  ].join(' ');
  const primaryMarketText = [entry.data.topic, entry.data.title].join(' ');
  const isUnsupportedMarket = /欧洲|韩国|日本|亚洲|全球|欧元区|STOXX|KOSPI|Nikkei/i.test(primaryMarketText);
  const isSupportedMarket = /美股|美国|港股|香港|A 股|A股|沪深|上证|深证|创业板|科创/.test(marketText);

  return !isUnsupportedMarket && isSupportedMarket && (
    text.includes(':close:') ||
    text.includes('close') ||
    text.includes('收盘') ||
    text.includes('闭市')
  );
}

export async function getAllFeeds() {
  const feeds = await getCollection('feeds', ({ data }) => data.reviewed === true).then((entries) =>
    entries.filter(isStockCloseFeed)
  );
  const now = Date.now();
  const sportsCategories = new Set<string>(
    FEED_GROUPS.find((group) => group.id === 'sports')?.categories ?? []
  );
  const isFutureSportsEvent = (entry: (typeof feeds)[number]) =>
    sportsCategories.has(entry.data.category) && entry.data.eventAt.getTime() > now;

  return feeds.sort((a, b) => {
    const aFutureSportsEvent = isFutureSportsEvent(a);
    const bFutureSportsEvent = isFutureSportsEvent(b);

    if (aFutureSportsEvent !== bFutureSportsEvent) {
      return Number(aFutureSportsEvent) - Number(bFutureSportsEvent);
    }

    if (aFutureSportsEvent && bFutureSportsEvent) {
      const eventDelta = a.data.eventAt.getTime() - b.data.eventAt.getTime();
      if (eventDelta !== 0) return eventDelta;
    } else {
      const eventDelta = b.data.eventAt.getTime() - a.data.eventAt.getTime();
      if (eventDelta !== 0) return eventDelta;
    }

    const priorityDelta = b.data.priority - a.data.priority;
    if (priorityDelta !== 0) return priorityDelta;

    const dateDelta = b.data.date.getTime() - a.data.date.getTime();
    if (dateDelta !== 0) return dateDelta;

    return a.id.localeCompare(b.id);
  });
}

export function getFeedsByCategory(feeds: Awaited<ReturnType<typeof getAllFeeds>>, category: string) {
  return feeds.filter((entry) => entry.data.category === category);
}

export function getFeedGroupMeta(group: string) {
  return FEED_GROUPS.find((item) => item.id === group);
}

export function getFeedTopicMeta(topic: string) {
  return FEED_TOPIC_GROUPS.find((item) => item.id === topic);
}

export function getFeedsByList(feeds: Awaited<ReturnType<typeof getAllFeeds>>, list: string) {
  if (list === 'all') return feeds;

  const topic = getFeedTopicMeta(list);
  if (topic) {
    return feeds.filter((entry) => topic.categories.includes(entry.data.category as never));
  }

  const group = getFeedGroupMeta(list);
  if (group) {
    return feeds.filter((entry) => group.categories.includes(entry.data.category as never));
  }

  return getFeedsByCategory(feeds, list);
}

export function formatDate(value: Date) {
  const parts = new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(value);

  const getPart = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? '';
  return `${getPart('year')}-${getPart('month')}-${getPart('day')} ${getPart('hour')}:${getPart('minute')}`;
}

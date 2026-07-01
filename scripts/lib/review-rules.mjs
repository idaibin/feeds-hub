export const CATEGORY_RULES = {
  worldcup: {
    label: '世界杯',
    tags: ['世界杯', '2026', '足球'],
    keywords: ['世界杯', 'world cup', 'fifa', '2026', '足球', '世足']
  },
  lol: {
    label: 'LOL 赛事',
    tags: ['LOL', 'LPL', '电竞'],
    keywords: ['lpl', 'lol', '英雄联盟', 'league of legends', 'msi', '全球总决赛', '世界赛', '先锋赛', '电竞']
  },
  stock: {
    label: '股市简报',
    tags: ['A股', '美股', '市场'],
    keywords: ['a股', '美股', '纳斯达克', '创业板', '上证', '道指', '标普', '股市', '股票', '市场']
  },
  ai: {
    label: 'AI 科技',
    tags: ['AI', '科技', '模型'],
    keywords: ['ai', '人工智能', 'openai', 'anthropic', 'google', '模型', '科技', '大模型', '机器人']
  }
};

export function cleanText(value = '') {
  return String(value)
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

export function reviewCandidate(candidate, existingKeys = new Set()) {
  const reasons = [];
  const rule = CATEGORY_RULES[candidate.category];
  if (!rule) reasons.push('未知分类');
  if (!candidate.title || cleanText(candidate.title).length < 6) reasons.push('标题过短');
  if (!candidate.summary || cleanText(candidate.summary).length < 12) reasons.push('摘要过短');
  if (!candidate.sourceUrl || !/^https?:\/\//.test(candidate.sourceUrl)) reasons.push('缺少有效来源链接');

  const title = cleanText(candidate.title);
  const summary = cleanText(candidate.summary);
  const haystack = `${title} ${summary}`.toLowerCase();
  if (rule && !rule.keywords.some((keyword) => haystack.includes(keyword.toLowerCase()))) {
    reasons.push(`内容未命中${rule.label}关键词`);
  }

  const key = candidate.sourceUrl || title;
  if (key && existingKeys.has(key)) reasons.push('重复内容');

  const publishedAt = new Date(candidate.publishedAt);
  if (Number.isNaN(publishedAt.getTime())) reasons.push('发布时间无效');

  return { passed: reasons.length === 0, reasons, reviewed: reasons.length === 0 };
}

import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { XMLParser } from 'fast-xml-parser';
import { CATEGORY_RULES, cleanText, reviewCandidate } from './lib/review-rules.mjs';

const ROOT = process.cwd();
const DRY_RUN = process.argv.includes('--dry-run');
const SOURCES_PATH = path.join(ROOT, 'src/data/topic-sources.json');
const CONTENT_ROOT = path.join(ROOT, 'src/content/feeds');
const IMAGE_ROOT = path.join(ROOT, 'public/images/feeds');

function hash(value) {
  return crypto.createHash('sha1').update(value).digest('hex').slice(0, 10);
}

function toIso(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

function toDateId(value) {
  return toIso(value).slice(0, 10);
}

function truncate(value, max = 220) {
  const text = cleanText(value);
  return text.length <= max ? text : `${text.slice(0, max - 1)}…`;
}

function yamlString(value) {
  return JSON.stringify(cleanText(value));
}

function yamlArray(values) {
  return values.map((value) => `  - ${yamlString(value)}`).join('\n');
}

async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, 'utf-8'));
}

async function listMarkdownFiles(dir) {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const files = await Promise.all(entries.map(async (entry) => {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) return listMarkdownFiles(fullPath);
      return entry.name.endsWith('.md') ? [fullPath] : [];
    }));
    return files.flat();
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
}

async function loadExistingKeys() {
  const files = await listMarkdownFiles(CONTENT_ROOT);
  const keys = new Set();
  for (const file of files) {
    const raw = await fs.readFile(file, 'utf-8');
    const sourceUrl = raw.match(/^sourceUrl:\s*["']?(.+?)["']?\s*$/m)?.[1];
    const title = raw.match(/^title:\s*["']?(.+?)["']?\s*$/m)?.[1];
    if (sourceUrl) keys.add(sourceUrl.trim());
    if (title) keys.add(title.trim());
  }
  return keys;
}

function getRssLink(link) {
  if (!link) return '';
  if (typeof link === 'string') return link;
  if (Array.isArray(link)) return getRssLink(link[0]);
  return link['@_href'] || link.href || '';
}

function normalizeRssItems(parsed) {
  const channel = parsed?.rss?.channel ?? parsed?.feed;
  const rawItems = channel?.item ?? parsed?.feed?.entry ?? [];
  return Array.isArray(rawItems) ? rawItems : [rawItems].filter(Boolean);
}

async function fetchRss(source) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(source.url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'feeds-hub/0.1' }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const xml = await response.text();
    const parser = new XMLParser({ ignoreAttributes: false });
    return normalizeRssItems(parser.parse(xml));
  } finally {
    clearTimeout(timeout);
  }
}

function itemToCandidate(item, topic, source) {
  const title = cleanText(item.title?.['#text'] ?? item.title ?? '');
  const summary = truncate(item.description ?? item.summary ?? item.content ?? item['content:encoded'] ?? title);
  const sourceUrl = getRssLink(item.link);
  const publishedAt = item.pubDate ?? item.published ?? item.updated ?? new Date().toISOString();
  return {
    title,
    subtitle: `${topic.label} · ${source.name}`,
    category: topic.category,
    topic: topic.topic,
    summary,
    source: source.name,
    sourceUrl,
    publishedAt,
    tags: CATEGORY_RULES[topic.category]?.tags ?? [topic.label]
  };
}

function escapeXml(value = '') {
  return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

function wrapText(text, maxChars = 18, maxLines = 4) {
  const chars = Array.from(cleanText(text));
  const lines = [];
  for (let i = 0; i < chars.length && lines.length < maxLines; i += maxChars) {
    lines.push(chars.slice(i, i + maxChars).join(''));
  }
  if (chars.length > maxChars * maxLines && lines.length > 0) lines[lines.length - 1] = `${lines[lines.length - 1].slice(0, -1)}…`;
  return lines;
}

function createPosterSvg(candidate) {
  const rule = CATEGORY_RULES[candidate.category];
  const titleText = wrapText(candidate.title).map((line, index) => `<text x="80" y="${250 + index * 64}" class="title">${escapeXml(line)}</text>`).join('\n  ');
  const summaryText = wrapText(candidate.summary, 26, 3).map((line, index) => `<text x="84" y="${555 + index * 34}" class="summary">${escapeXml(line)}</text>`).join('\n  ');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675" viewBox="0 0 1200 675" role="img" aria-label="${escapeXml(candidate.title)}">
  <defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#eff6ff"/><stop offset="60%" stop-color="#ffffff"/><stop offset="100%" stop-color="#dbeafe"/></linearGradient><linearGradient id="mark" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#2563eb"/><stop offset="100%" stop-color="#38bdf8"/></linearGradient><style>.label{font:800 34px -apple-system,BlinkMacSystemFont,'Segoe UI','PingFang SC',sans-serif;fill:#1d4ed8}.title{font:900 50px -apple-system,BlinkMacSystemFont,'Segoe UI','PingFang SC',sans-serif;fill:#172033}.summary{font:500 24px -apple-system,BlinkMacSystemFont,'Segoe UI','PingFang SC',sans-serif;fill:#475569}.date{font:700 24px -apple-system,BlinkMacSystemFont,'Segoe UI','PingFang SC',sans-serif;fill:#64748b}</style></defs>
  <rect width="1200" height="675" fill="url(#bg)"/><circle cx="1010" cy="120" r="170" fill="#bfdbfe" opacity="0.52"/><circle cx="1048" cy="430" r="250" fill="#dbeafe" opacity="0.72"/><rect x="68" y="72" width="1064" height="535" rx="42" fill="#ffffff" opacity="0.82"/>
  <rect x="84" y="90" width="220" height="58" rx="29" fill="#dbeafe"/><text x="112" y="130" class="label">${escapeXml(rule?.label ?? candidate.topic)}</text><text x="84" y="204" class="date">${escapeXml(candidate.topic)} · ${escapeXml(toDateId(candidate.publishedAt))}</text>
  ${titleText}
  <rect x="80" y="500" width="760" height="118" rx="28" fill="#f8fafc"/>${summaryText}<rect x="870" y="230" width="210" height="210" rx="48" fill="url(#mark)"/><circle cx="932" cy="302" r="22" fill="#ffffff" opacity="0.9"/><path d="M924 375 C964 318,1002 390,1038 306" fill="none" stroke="#ffffff" stroke-width="18" stroke-linecap="round" stroke-linejoin="round" opacity="0.92"/></svg>`;
}

function createMarkdown(candidate, coverPath) {
  const tags = candidate.tags?.length ? candidate.tags : CATEGORY_RULES[candidate.category]?.tags ?? [];
  return `---\ntitle: ${yamlString(candidate.title)}\nsubtitle: ${yamlString(candidate.subtitle)}\ncategory: ${yamlString(candidate.category)}\ntopic: ${yamlString(candidate.topic)}\ndate: ${yamlString(toIso(candidate.publishedAt))}\ncover: ${yamlString(coverPath)}\ntags:\n${yamlArray(tags)}\nsummary: ${yamlString(candidate.summary)}\nsource: ${yamlString(candidate.source)}\nsourceUrl: ${yamlString(candidate.sourceUrl)}\nreviewed: true\npriority: 0\n---\n\n## 重点摘要\n\n${cleanText(candidate.summary)}\n\n## 内容说明\n\n这条信息由定时任务自动同步，并通过分类关键词、来源链接、标题长度、摘要长度和重复内容检查。\n\n## 来源\n\n- [${cleanText(candidate.source)}](${candidate.sourceUrl})\n`;
}

async function writeCandidate(candidate) {
  const id = `${toDateId(candidate.publishedAt)}-${hash(candidate.sourceUrl || candidate.title)}`;
  const contentDir = path.join(CONTENT_ROOT, candidate.category);
  const imageDir = path.join(IMAGE_ROOT, candidate.category);
  const contentFile = path.join(contentDir, `${id}.md`);
  const imageFile = path.join(imageDir, `${id}.svg`);
  const coverPath = `/images/feeds/${candidate.category}/${id}.svg`;
  if (DRY_RUN) {
    console.log(`[dry-run] would write ${path.relative(ROOT, contentFile)} and ${path.relative(ROOT, imageFile)}`);
    return;
  }
  await fs.mkdir(contentDir, { recursive: true });
  await fs.mkdir(imageDir, { recursive: true });
  await fs.writeFile(contentFile, createMarkdown(candidate, coverPath), 'utf-8');
  await fs.writeFile(imageFile, createPosterSvg(candidate), 'utf-8');
}

async function updateProgress(stats) {
  const lines = ['# 进度记录', '', `更新时间：${new Date().toISOString()}`, '', '## 最近一次定时同步', '', '| 分类 | 接受 | 跳过 | 说明 |', '|---|---:|---:|---|'];
  for (const item of stats) lines.push(`| ${item.label} | ${item.accepted} | ${item.skipped} | ${item.note} |`);
  lines.push('', '## 说明', '', '- 每小时执行一次。', '- 每一类主题独立获取、独立审查、独立跳过。', '- 没有新增有效内容时不会产生提交。', '- 图片目前保存到 GitHub 仓库的 `public/images/feeds`。');
  if (!DRY_RUN) {
    await fs.mkdir(path.join(ROOT, 'docs'), { recursive: true });
    await fs.writeFile(path.join(ROOT, 'docs/progress.md'), `${lines.join('\n')}\n`, 'utf-8');
  }
}

async function main() {
  const config = await readJson(SOURCES_PATH);
  const existingKeys = await loadExistingKeys();
  const stats = [];
  for (const topic of config.topics) {
    let accepted = 0;
    let skipped = 0;
    if (!topic.enabled) {
      stats.push({ label: topic.label, accepted, skipped, note: '已禁用' });
      continue;
    }
    for (const source of topic.sources ?? []) {
      if (accepted >= (topic.limitPerRun ?? 1)) break;
      try {
        if (source.type !== 'rss') continue;
        const items = await fetchRss(source);
        for (const item of items) {
          if (accepted >= (topic.limitPerRun ?? 1)) break;
          const candidate = itemToCandidate(item, topic, source);
          const review = reviewCandidate(candidate, existingKeys);
          if (!review.passed) {
            skipped += 1;
            console.log(`[review:skip] ${topic.label}: ${candidate.title} -> ${review.reasons.join('、')}`);
            continue;
          }
          await writeCandidate(candidate);
          existingKeys.add(candidate.sourceUrl || candidate.title);
          existingKeys.add(candidate.title);
          accepted += 1;
          console.log(`[review:pass] ${topic.label}: ${candidate.title}`);
        }
      } catch (error) {
        skipped += 1;
        console.error(`[fetch:error] ${topic.label} / ${source.name}: ${error.message}`);
      }
    }
    stats.push({ label: topic.label, accepted, skipped, note: accepted > 0 ? '已写入新内容' : '无新增有效内容，跳过写入' });
  }
  await updateProgress(stats);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

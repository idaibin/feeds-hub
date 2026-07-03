import { existsSync } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const contentRoot = path.join(root, 'src', 'content');
const postersRoot = path.join(root, 'docs', 'posters');

const categories = ['worldcup', 'lol', 'stock', 'ai', 'global', 'rust', 'product'];
const kinds = [
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
];

const requiredFields = [
  'title',
  'subtitle',
  'category',
  'kind',
  'topic',
  'date',
  'eventAt',
  'eventKey',
  'cover',
  'tags',
  'summary',
  'source',
  'sourceUrl',
  'reviewed',
  'priority'
];

const forbiddenEditorialPhrases = [
  '为什么重要',
  '这意味着',
  '意味着',
  '影响深远',
  '值得关注',
  '关键点',
  '重磅',
  '史诗级',
  '买入',
  '卖出',
  '持有建议',
  '目标价',
  '大概率',
  '基本可以确定',
  '稳赚',
  '必然成功',
  '盈利主线',
  '更适合关注',
  '容易先承压',
  '提醒市场'
];

const sourceUrlBlockList = [
  'google.com/search',
  'bing.com/search',
  'baidu.com/s',
  'duckduckgo.com/',
  'search?q=',
  'query=',
  'screenshot'
];

const stockSentiments = ['市场情绪：上涨', '市场情绪：下跌', '市场情绪：分化', '市场情绪：震荡', '市场情绪：偏热', '市场情绪：偏暖', '市场情绪：偏冷'];

const errors = [];
const warnings = [];
const eventKeys = new Map();

function addError(file, message) {
  errors.push(`${file}: ${message}`);
}

function addWarning(file, message) {
  warnings.push(`${file}: ${message}`);
}

function stripQuotes(value) {
  const trimmed = String(value ?? '').trim();
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function parseScalar(raw) {
  const value = stripQuotes(raw);
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (value.startsWith('[') && value.endsWith(']')) {
    const inner = value.slice(1, -1).trim();
    if (!inner) return [];
    return inner.split(',').map((item) => stripQuotes(item));
  }
  if (/^-?\d+(\.\d+)?$/.test(value)) return Number(value);
  return value;
}

function parseFrontmatter(text, file) {
  if (!text.startsWith('---\n')) {
    addError(file, 'missing frontmatter block');
    return { data: {}, body: text };
  }

  const end = text.indexOf('\n---', 4);
  if (end === -1) {
    addError(file, 'frontmatter block is not closed');
    return { data: {}, body: text };
  }

  const raw = text.slice(4, end).split('\n');
  const body = text.slice(end + 4).trim();
  const data = {};
  let currentArrayKey = null;

  for (const line of raw) {
    if (!line.trim() || line.trim().startsWith('#')) continue;

    const arrayItem = line.match(/^\s*-\s+(.+)$/);
    if (arrayItem && currentArrayKey) {
      data[currentArrayKey].push(stripQuotes(arrayItem[1]));
      continue;
    }

    const pair = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!pair) {
      addWarning(file, `unparsed frontmatter line: ${line}`);
      currentArrayKey = null;
      continue;
    }

    const [, key, rawValue] = pair;
    if (rawValue === '') {
      data[key] = [];
      currentArrayKey = key;
    } else {
      data[key] = parseScalar(rawValue);
      currentArrayKey = null;
    }
  }

  return { data, body };
}

async function collectMarkdownFiles(dir) {
  const files = [];

  async function walk(current) {
    if (!existsSync(current)) return;
    const entries = await readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        if (entry.name === 'README.md') continue;
        files.push(fullPath);
      }
    }
  }

  await walk(dir);
  return files.sort();
}

function normalizeUrl(value) {
  try {
    const url = new URL(value);
    url.hash = '';
    if (url.pathname.endsWith('/')) {
      url.pathname = url.pathname.slice(0, -1);
    }
    return url.toString();
  } catch {
    return String(value ?? '').trim();
  }
}

function isIsoWithChinaOffset(value) {
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?\+08:00$/.test(String(value ?? ''));
}

function validateRequiredFields(file, data) {
  for (const field of requiredFields) {
    if (!(field in data) || data[field] === '' || data[field] == null) {
      addError(file, `missing required frontmatter field: ${field}`);
    }
  }
}

function validateCategoryAndPath(file, data) {
  const relative = path.relative(contentRoot, file).replaceAll(path.sep, '/');
  const [dirCategory] = relative.split('/');

  if (!categories.includes(dirCategory)) {
    addError(file, `file is under unsupported category directory: ${dirCategory}`);
  }

  if (!categories.includes(data.category)) {
    addError(file, `invalid category: ${data.category}`);
  }

  if (data.category && dirCategory !== data.category) {
    addError(file, `category mismatch: directory is ${dirCategory}, frontmatter is ${data.category}`);
  }
}

function validateKind(file, data) {
  if (!kinds.includes(data.kind)) {
    addError(file, `invalid kind: ${data.kind}`);
  }
}

function validateDates(file, data) {
  if (!isIsoWithChinaOffset(data.date)) {
    addError(file, 'date must be ISO datetime with +08:00 offset');
  }
  if (!isIsoWithChinaOffset(data.eventAt)) {
    addError(file, 'eventAt must be ISO datetime with +08:00 offset');
  }
}

function validateCover(file, data) {
  const cover = String(data.cover ?? '');
  if (!cover.startsWith('/images/')) {
    addError(file, 'cover must start with /images/');
  }
  if (cover.includes('public')) {
    addError(file, 'cover must not contain public');
  }
  if (data.category && !cover.startsWith(`/images/${data.category}/`)) {
    addError(file, `cover must be under /images/${data.category}/`);
  }
  if (!cover.endsWith('.webp')) {
    addError(file, 'cover must end with .webp');
  }
}

function validatePosterDoc(file, data) {
  if (!data.category) return;
  const posterDoc = path.join(postersRoot, `${data.category}.md`);
  if (!existsSync(posterDoc)) {
    addError(file, `missing poster prompt document: docs/posters/${data.category}.md`);
  }
}

function validateTags(file, data) {
  if (!Array.isArray(data.tags)) {
    addError(file, 'tags must be a YAML array');
  }
}

function validateReviewedAndPriority(file, data) {
  if (data.reviewed !== true) {
    addError(file, 'reviewed must be true for published feeds');
  }
  if (typeof data.priority !== 'number' || Number.isNaN(data.priority)) {
    addError(file, 'priority must be a number');
  }
}

function validateSource(file, data) {
  if (typeof data.source !== 'string' || data.source.trim().length < 2) {
    addError(file, 'source must be a non-empty string');
  }

  try {
    const url = new URL(String(data.sourceUrl ?? ''));
    if (!['http:', 'https:'].includes(url.protocol)) {
      addError(file, 'sourceUrl must use http or https');
    }
  } catch {
    addError(file, 'sourceUrl must be a valid URL');
  }

  const normalizedLower = normalizeUrl(data.sourceUrl).toLowerCase();
  if (sourceUrlBlockList.some((blocked) => normalizedLower.includes(blocked))) {
    addError(file, 'sourceUrl must not be a search page, screenshot, or generic query URL');
  }
}

function validateEventKey(file, data) {
  const eventKey = String(data.eventKey ?? '').trim();
  if (eventKeys.has(eventKey)) {
    addError(file, `duplicate eventKey with ${eventKeys.get(eventKey)}`);
  } else if (eventKey) {
    eventKeys.set(eventKey, file);
  }
}

function validateBody(file, data, body) {
  if (data.category === 'stock' && !stockSentiments.some((sentiment) => body.includes(sentiment))) {
    addError(file, 'stock feed body must include a market sentiment line, such as 市场情绪：分化');
  }
}

function validateEditorialPhrases(file, data, body) {
  const fields = [
    ['title', data.title],
    ['subtitle', data.subtitle],
    ['summary', data.summary],
    ['body', body]
  ];

  for (const [field, value] of fields) {
    const text = String(value ?? '');
    for (const phrase of forbiddenEditorialPhrases) {
      if (text.includes(phrase)) {
        addError(file, `${field} contains forbidden phrase: ${phrase}`);
      }
    }
  }
}

async function validateFile(file) {
  const relative = path.relative(root, file).replaceAll(path.sep, '/');
  const text = await readFile(file, 'utf8');
  const { data, body } = parseFrontmatter(text, relative);

  validateRequiredFields(relative, data);
  validateCategoryAndPath(relative, data);
  validateKind(relative, data);
  validateDates(relative, data);
  validateCover(relative, data);
  validatePosterDoc(relative, data);
  validateTags(relative, data);
  validateReviewedAndPriority(relative, data);
  validateSource(relative, data);
  validateEventKey(relative, data);
  validateBody(relative, data, body);
  validateEditorialPhrases(relative, data, body);
}

async function main() {
  const legacyFeedsDir = path.join(contentRoot, 'feeds');
  if (existsSync(legacyFeedsDir)) {
    addError('src/content/feeds', 'legacy feeds directory must not exist');
  }

  if (!existsSync(path.join(postersRoot, 'README.md'))) {
    addError('docs/posters/README.md', 'poster prompt index must exist');
  }

  if (!existsSync(path.join(postersRoot, 'type-matrix.md'))) {
    addError('docs/posters/type-matrix.md', 'poster type ratio matrix must exist');
  }

  for (const category of categories) {
    const posterDoc = path.join(postersRoot, `${category}.md`);
    if (!existsSync(posterDoc)) {
      addError(`docs/posters/${category}.md`, 'poster prompt document must exist for every category');
    }
  }

  const files = await collectMarkdownFiles(contentRoot);
  if (files.length === 0) {
    addWarning('src/content', 'no markdown feed files found');
  }

  for (const file of files) {
    await validateFile(file);
  }

  if (warnings.length > 0) {
    console.warn('\nFeed validation warnings:');
    for (const warning of warnings) console.warn(`- ${warning}`);
  }

  if (errors.length > 0) {
    console.error('\nFeed validation failed:');
    for (const error of errors) console.error(`- ${error}`);
    process.exit(1);
  }

  console.log(`Feed validation passed: ${files.length} markdown files checked.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

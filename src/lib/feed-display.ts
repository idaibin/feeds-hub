const sourceVerbs = [
  '报道称',
  '报道',
  '转述',
  '援引',
  '引述',
  '称',
  '显示',
  '指出',
  '披露',
  '提到',
  '宣布',
  '发布',
  '公告称',
  '警告',
  '表示'
];

const defaultSources = [
  'Reuters',
  'Business Insider',
  'The Verge',
  'Axios',
  'Bloomberg',
  'CNBC',
  'The Guardian',
  'Financial Times',
  'FT',
  'LoL Esports',
  'GitHub Changelog'
];

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function compactText(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}

function normalizeForCompare(value: string) {
  return compactText(value).replace(/[，。,:：；;、\s-]/g, '');
}

function isTinyFragment(value: string) {
  return normalizeForCompare(value).length < 6;
}

function editDistance(a: string, b: string) {
  const left = Array.from(a);
  const right = Array.from(b);
  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  const current = Array.from({ length: right.length + 1 }, () => 0);

  for (let i = 1; i <= left.length; i += 1) {
    current[0] = i;

    for (let j = 1; j <= right.length; j += 1) {
      const cost = left[i - 1] === right[j - 1] ? 0 : 1;
      current[j] = Math.min(
        current[j - 1] + 1,
        previous[j] + 1,
        previous[j - 1] + cost
      );
    }

    previous.splice(0, previous.length, ...current);
  }

  return previous[right.length];
}

export function isRedundantDisplayText(value: string, compareWith: string) {
  const normalizedValue = normalizeForCompare(value);
  const normalizedCompare = normalizeForCompare(compareWith);

  if (!normalizedValue || !normalizedCompare) {
    return false;
  }

  if (normalizedValue.startsWith(normalizedCompare) || normalizedCompare.startsWith(normalizedValue)) {
    return true;
  }

  const maxLength = Math.max(normalizedValue.length, normalizedCompare.length);
  const similarity = 1 - editDistance(normalizedValue, normalizedCompare) / maxLength;
  const lengthRatio = Math.min(normalizedValue.length, normalizedCompare.length) / maxLength;

  return similarity >= 0.68 && lengthRatio >= 0.38;
}

export function stripSourceLead(value: string, source?: string) {
  let text = compactText(value);
  const sources = getSourceNames(source);

  for (const sourceName of sources) {
    const sourcePattern = escapeRegExp(sourceName).replace(/\s+/g, '\\s+');
    const verbPattern = sourceVerbs.join('|');

    text = text
      .replace(new RegExp(`^${sourcePattern}\\s*\\d{1,2}\\s*月\\s*\\d{1,2}\\s*日\\s*[^，,。；;]{0,16}(?:${verbPattern})[，,:：\\s]*`, 'i'), '')
      .replace(new RegExp(`^${sourcePattern}\\s*(?:${verbPattern})[，,:：\\s]*`, 'i'), '')
      .replace(new RegExp(`^${sourcePattern}\\s*[^，,。；;]{1,24}(?:${verbPattern})[，,:：\\s]*`, 'i'), '');
  }

  return stripReportLead(compactText(text));
}

function getSourceNames(source?: string) {
  const sources = new Set(defaultSources);

  if (source) {
    sources.add(source);
    source.split('/').map((item) => item.trim()).filter(Boolean).forEach((item) => sources.add(item));
  }

  return sources;
}

function stripReportLead(value: string) {
  return value
    .replace(/^(?:报道称|报道显示|报道指出|报道披露|报道提到|报道还称|报道还指出|报道还提到|报道同时称|报道同时指出|报道同时提到)[，,:：\s]*/, '')
    .replace(/^(?:该报道|这篇报道|该消息)[^，,。]{0,20}(?:称|显示|指出|披露|表示)[，,:：\s]*/, '')
    .replace(/^(?:援引|引述|转述)(?:一名|消息人士|知情人士)?[，,:：\s]*/, '')
    .replace(/^(?:消息人士|知情人士)(?:报道称|称|表示)[，,:：\s]*/, '')
    .trim();
}

function stripReportPhrases(value: string) {
  return value
    .replace(/(^|[。；;，,：:\s])(?:报道称|报道显示|报道指出|报道披露|报道提到|报道还称|报道还指出|报道还提到|报道同时称|报道同时指出|报道同时提到|报道援引|报道转述|报道引述)[，,:：\s]*/g, '$1')
    .replace(/(^|[。；;，,：:\s])(?:该报道|这篇报道|该消息)[^，,。；;]{0,20}(?:称|显示|指出|披露|表示)[，,:：\s]*/g, '$1')
    .replace(/(^|[。；;，,：:\s])(?:消息人士|知情人士)(?:报道称|称|表示)[，,:：\s]*/g, '$1')
    .replace(/(^|[。；;，,：:\s])报道称/g, '$1')
    .replace(/该报道/g, '该信息')
    .replace(/这篇报道/g, '该信息')
    .replace(/该消息/g, '该信息')
    .replace(/说法称/g, '确认')
    .replace(/知情人士称[，,:：\s]*/g, '');
}

export function stripSourceMentions(value: string, source?: string) {
  let text = stripSourceLead(value, source);
  const verbPattern = sourceVerbs.join('|');

  for (const sourceName of getSourceNames(source)) {
    const sourcePattern = escapeRegExp(sourceName).replace(/\s+/g, '\\s+');
    text = text
      .replace(new RegExp(`${sourcePattern}\\s*\\d{1,2}\\s*月\\s*\\d{1,2}\\s*日\\s*[^，,。；;]{0,16}(?:${verbPattern})[，,:：\\s]*`, 'gi'), '')
      .replace(new RegExp(`${sourcePattern}\\s*(?:${verbPattern})[，,:：\\s]*`, 'gi'), '')
      .replace(new RegExp(`${sourcePattern}\\s*[^，,。；;]{1,24}(?:${verbPattern})[，,:：\\s]*`, 'gi'), '');
  }

  return stripReportLead(compactText(cleanSourceArtifacts(stripReportPhrases(text))));
}

function cleanSourceArtifacts(value: string) {
  return value
    .replace(/均来自\s*[。；;]/g, '均已核验。')
    .replace(/来自\s*[。；;]/g, '')
    .replace(/^\s*[，,:：；;]\s*/, '')
    .replace(/\s+([，。；;,:：])/g, '$1')
    .replace(/([，,:：；;])\s*([。；;])/g, '$2');
}

export function getDisplayBody(body = '', source?: string) {
  return body
    .split(/\n{2,}/)
    .map((paragraph) => stripSourceMentions(paragraph, source))
    .filter(Boolean);
}

export function getDisplayTitle(title: string, source?: string) {
  return stripSourceMentions(title, source);
}

function isRedundantAgainstAny(value: string, compareWith: string[]) {
  return compareWith.some((item) => item && isRedundantDisplayText(value, item));
}

export function getDisplaySummary(summary: string, title: string, source?: string, compareWith: string[] = []) {
  let text = stripSourceMentions(summary, source);
  const normalizedTitle = compactText(getDisplayTitle(title, source));

  if (normalizedTitle && text.startsWith(normalizedTitle)) {
    text = text.slice(normalizedTitle.length).replace(/^[，。,:：\s-]+/, '');
  }

  if (isTinyFragment(text)) {
    return '';
  }

  if (isRedundantAgainstAny(text, [normalizedTitle, ...compareWith])) {
    return '';
  }

  return compactText(text);
}

export function getDisplaySubtitle(subtitle: string, source?: string, compareWith: string[] = []) {
  const text = stripSourceMentions(subtitle, source);

  if (isRedundantAgainstAny(text, compareWith)) {
    return '';
  }

  return text;
}

const sourceVerbs = [
  '报道称',
  '报道',
  '称',
  '显示',
  '指出',
  '披露',
  '宣布',
  '发布',
  '公告称',
  '警告',
  '表示'
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

function isRedundantSummary(summary: string, title: string) {
  const normalizedSummary = normalizeForCompare(summary);
  const normalizedTitle = normalizeForCompare(title);

  if (!normalizedSummary || !normalizedTitle) {
    return false;
  }

  if (normalizedSummary.startsWith(normalizedTitle) || normalizedTitle.startsWith(normalizedSummary)) {
    return true;
  }

  const maxLength = Math.max(normalizedSummary.length, normalizedTitle.length);
  const similarity = 1 - editDistance(normalizedSummary, normalizedTitle) / maxLength;

  return similarity >= 0.74 && normalizedSummary.length <= normalizedTitle.length * 1.7;
}

export function stripSourceLead(value: string, source?: string) {
  let text = compactText(value);
  const sources = new Set<string>();

  if (source) {
    sources.add(source);
    source.split('/').map((item) => item.trim()).filter(Boolean).forEach((item) => sources.add(item));
  }

  for (const sourceName of sources) {
    const sourcePattern = escapeRegExp(sourceName).replace(/\s+/g, '\\s+');
    const verbPattern = sourceVerbs.join('|');
    const sourceLead = new RegExp(`^${sourcePattern}\\s*`, 'i');

    if (sourceLead.test(text)) {
      const withoutSource = text.replace(sourceLead, '');
      const firstBreak = withoutSource.search(/[，,。]/);
      const firstClause = firstBreak >= 0 ? withoutSource.slice(0, firstBreak) : withoutSource;

      if (/(?:报道称|报道|称|显示|指出|披露|宣布|发布|公告称|警告|表示|引用)/.test(firstClause)) {
        text = firstBreak >= 0 ? withoutSource.slice(firstBreak + 1) : '';
      }
    }

    text = text
      .replace(new RegExp(`^${sourcePattern}\\s*(?:${verbPattern})[，,:：\\s]*`, 'i'), '')
      .replace(new RegExp(`^${sourcePattern}\\s*[^，,。]{1,24}(?:${verbPattern})[，,:：\\s]*`, 'i'), '')
      .replace(new RegExp(`^${sourcePattern}\\s+[A-Za-z][A-Za-z\\s.&-]{0,40}\\s*(?:${verbPattern})[，,:：\\s]*`, 'i'), '');
  }

  return compactText(text);
}

export function getDisplaySummary(summary: string, title: string, source?: string) {
  let text = stripSourceLead(summary, source);
  const normalizedTitle = compactText(title);

  if (normalizedTitle && text.startsWith(normalizedTitle)) {
    text = text.slice(normalizedTitle.length).replace(/^[，。,:：\s-]+/, '');
  }

  if (isRedundantSummary(text, title)) {
    return '';
  }

  return compactText(text);
}

export function getDisplaySubtitle(subtitle: string, source?: string) {
  return stripSourceLead(subtitle, source);
}

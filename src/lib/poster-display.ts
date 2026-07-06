const sportsCategories = new Set(['worldcup', 'lol']);
const sportsKinds = new Set([
  'match_result',
  'match_schedule',
  'match_flow',
  'player_spotlight',
  'knockout_update',
  'worldcup_feed'
]);
const sportsBracketKinds = new Set(['knockout_update', 'worldcup_feed']);

export type PosterProfile = 'default' | 'sports_card' | 'sports_bracket';

export function getPosterProfile(categoryId: string, kind: string): PosterProfile {
  const isSports = sportsCategories.has(categoryId) || sportsKinds.has(kind);

  if (!isSports) {
    return 'default';
  }

  if (sportsBracketKinds.has(kind)) {
    return 'sports_bracket';
  }

  return 'sports_card';
}

export function getPosterRatioClass(categoryId: string, kind: string) {
  return getPosterProfile(categoryId, kind) === 'sports_card' ? 'poster-ratio-4x5' : 'poster-ratio-16x9';
}

export function getFallbackCover(categoryId: string, fallbackCover?: string) {
  return fallbackCover ?? `/images/${categoryId}/init.webp`;
}

export function getResolvedCover(categoryId: string, cover: string, coverStatus: string, fallbackCover?: string) {
  const resolvedFallbackCover = getFallbackCover(categoryId, fallbackCover);

  return coverStatus === 'generated_webp' ? cover : resolvedFallbackCover;
}

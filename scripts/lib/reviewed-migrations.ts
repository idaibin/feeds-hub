import { createHash } from 'node:crypto';

export interface DrizzleJournalEntry {
  idx: number;
  version: string;
  when: number;
  tag: string;
  breakpoints: boolean;
}

export interface DrizzleJournal {
  entries: DrizzleJournalEntry[];
}

export interface AppliedMigrationRow {
  hash: string;
  createdAt: string | number;
}

export const FOUNDATION_MIGRATION = {
  idx: 0,
  tag: '0000_windy_trish_tilby',
  when: 1783660331886,
  hash: 'c97f859ca2041b4c84beb6aa0b916642a0028f38e30f7750f1df8d22b1d8f342',
} as const;

export const RUNTIME_FORWARD_MIGRATION = {
  idx: 1,
  tag: '0001_swift_ben_parker',
  when: 1783672823432,
  hash: 'e4f9b3cbf37e1799446d488bb86842c53dded96e08274a1943a25ed79c18524f',
} as const;

const destructivePatterns = [
  /\bdrop\b/i,
  /\btruncate\b/i,
  /\bdelete\s+from\b/i,
];

function selectExactEntry(
  journal: DrizzleJournal,
  expected: { idx: number; tag: string; when: number },
) {
  const matches = journal.entries.filter((entry) => entry.idx === expected.idx);
  if (
    matches.length !== 1
    || matches[0].tag !== expected.tag
    || matches[0].when !== expected.when
  ) {
    throw new Error(`Reviewed migration journal entry ${expected.idx}/${expected.tag} is missing or changed`);
  }
  return matches[0];
}

export function selectFoundationMigration(journal: DrizzleJournal) {
  return selectExactEntry(journal, FOUNDATION_MIGRATION);
}

export function selectRuntimeForwardMigration(journal: DrizzleJournal) {
  const foundation = selectFoundationMigration(journal);
  const forward = selectExactEntry(journal, RUNTIME_FORWARD_MIGRATION);
  if (foundation.idx >= forward.idx || foundation.when >= forward.when) {
    throw new Error('Reviewed runtime forward migration must follow the foundation migration');
  }
  return forward;
}

function prepareMigrationSql(sql: string, label: string, expectedHash: string) {
  if (!sql.trim()) throw new Error(`${label} migration is empty`);
  for (const pattern of destructivePatterns) {
    if (pattern.test(sql)) throw new Error(`${label} migration contains destructive SQL`);
  }
  const statements = sql
    .split('--> statement-breakpoint')
    .map((statement) => statement.trim())
    .filter(Boolean);
  if (!statements.length) throw new Error(`${label} migration has no executable statements`);
  const hash = createHash('sha256').update(sql).digest('hex');
  if (hash !== expectedHash) throw new Error(`${label} migration hash does not match the reviewed SQL`);
  return {
    statements,
    hash,
  };
}

export function prepareFoundationMigrationSql(sql: string) {
  return prepareMigrationSql(sql, 'Foundation', FOUNDATION_MIGRATION.hash);
}

export function prepareRuntimeForwardMigrationSql(sql: string) {
  return prepareMigrationSql(sql, 'Runtime forward', RUNTIME_FORWARD_MIGRATION.hash);
}

function rowMatches(row: AppliedMigrationRow, hash: string, when: number) {
  return row.hash === hash && String(row.createdAt) === String(when);
}

export function assertOnlyFoundationApplied(
  rows: AppliedMigrationRow[],
  foundationHash: string,
  foundationWhen: number,
) {
  if (rows.length !== 1 || !rowMatches(rows[0], foundationHash, foundationWhen)) {
    throw new Error('Database migration journal must contain exactly the reviewed foundation migration');
  }
}

export function assertFoundationAndRuntimeForwardApplied(
  rows: AppliedMigrationRow[],
  foundationHash: string,
  foundationWhen: number,
  forwardHash: string,
  forwardWhen: number,
) {
  if (
    rows.length !== 2
    || !rowMatches(rows[0], foundationHash, foundationWhen)
    || !rowMatches(rows[1], forwardHash, forwardWhen)
  ) {
    throw new Error('Database migration journal does not match the reviewed foundation and runtime forward migrations');
  }
}

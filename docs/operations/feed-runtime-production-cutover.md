# Feed Runtime Production Cutover Runbook

Status: execution template. Nothing in this document proves that a Production migration, import, deployment, canary, or cutover has run.

This runbook is Production-only. Do not create or use a Vercel Preview deployment, Preview database, arbitrary SQL runner, destructive down migration, reset, truncate, delete, or physical Feed deletion. `src/content/**` and `ContentFeedSource` remain available throughout every phase.

## Execution record — fill before the change

Do not start while any required value is blank.

| Evidence | Execution-time value |
|---|---|
| Change owner | _required_ |
| Rollback owner | _required_ |
| Approver / review record | _required_ |
| Change window, Asia/Shanghai | _required_ |
| Change window, UTC | _required_ |
| Target local `main` commit | _required_ |
| Target `origin/main` commit | _fill after push; must equal target local commit_ |
| Target deployment source commit | _fill after deploy; must equal target local commit_ |
| Pre-change known-good Production deployment ID | _required_ |
| Pre-change known-good Production URL | _required; must identify the same deployment ID_ |
| Pre-change known-good deployment source commit | _required; must match that deployment's metadata, but may differ from target_ |
| Target Vercel project / scope | _required_ |
| Redacted Neon database fingerprint | _required_ |
| Runtime role | _must equal `feeds_app_runtime`_ |
| Migration owner role | _required; must differ from `feeds_app_runtime`_ |
| Backup / restore identifier | _required before each database mutation_ |
| Backup creation time | _required; less than 24 hours old and before mutation_ |
| Backup retention deadline | _required; after the change window_ |
| Neon recovery entry | _required; record reference, never credentials_ |
| Phase deployment IDs | _fill after each deployment_ |
| Start / finish / result | _fill during execution_ |

Record evidence in the approved operational system. Never commit database URLs, bearer tokens, recovery credentials, or unredacted provider secrets.

## Global preflight

1. Prepare the reviewed target commit on local `main` with a clean worktree. Fetch the remote and stop unless `origin/main` is still the reviewed base commit; do not overwrite unexpected remote changes.
2. Verify the linked Vercel project is `idaibin/feeds-hub` in the approved scope.
3. Capture the current public home, one category, one detail page, pagination JSON, and the pre-change known-good Production deployment ID, URL, and source commit. These three values must describe one deployment, but its commit is not required to equal the new target commit.
4. Confirm `vercel.json` disables Git automatic deployments with minimatch `**` (including branch names containing `/`) and explicitly enables `main`. Vercel treats unspecified branches as enabled and lets any matching `true` rule win, so both entries are required. A push to `main` therefore starts the Phase A Production deployment; no database preparation may precede Phase A. Do not run `vercel`, `vercel deploy`, or create a Dashboard deployment for a non-`main` branch.
5. Before pushing, verify Production already has these safe baseline values:

   ```text
   FEED_READ_SOURCE=content
   FEED_WRITES_ENABLED=false
   FEED_MCP_ENABLED=false
   ```

   Outside the explicitly enabled one-time bootstrap deployment, Vercel must contain only `FEED_RUNTIME_DATABASE_URL` using username `feeds_app_runtime`. Remove `DATABASE_URL`, `DATABASE_URL_UNPOOLED` and provider-prefixed direct/owner aliases (for example Marketplace storage aliases) after bootstrap. The runtime guard scans database-shaped environment values and intentionally fails without printing a URL if any Neon credential is direct or uses another role.

6. Run the local non-Production checks listed in `docs/progress/feed-runtime.md`. Stop on any failure.

## Phase A — Content baseline

Push the reviewed local `main` target to `origin/main`. The reviewed `vercel.json` starts the Production deployment automatically with:

```text
FEED_READ_SOURCE=content
FEED_WRITES_ENABLED=false
FEED_MCP_ENABLED=false
```

Record `origin/main`, the target deployment ID, and its source commit. Stop unless all three equal or identify the reviewed local target commit. Verify home, representative categories, detail pages, pagination JSON, ordering, historical feeds, write API rejection, and `/api/mcp` disabled behavior.

Stop gate: do not prepare or mutate the database unless the target deployment source commit and public output match the baseline. On failure, restore the pre-change known-good Production deployment and its safe environment configuration.

## Database preflight after Phase A

1. Keep Phase A live on Content with writes and MCP disabled.
2. For the normal operator path, verify pooled `DATABASE_URL` uses fixed role `feeds_app_runtime`, direct `DATABASE_URL_UNPOOLED` uses the distinct owner named by `FEED_DB_EXPECTED_MIGRATION_ROLE`, both identify the same Neon endpoint/database, and `FEED_DB_EXPECTED_FINGERPRINT` covers both roles. For the one-time bootstrap path below, the temporary input pooled/direct aliases use the same owner; bootstrap derives the fixed-role runtime URL before invoking the normal runners.
3. Provision `feeds_app_runtime` either through a reviewed Neon operator procedure or the fixed one-time Vercel bootstrap. The bootstrap creates only the constant role name, accepts a constrained generated password, and does not expose credentials in output.
4. Create and record a usable Neon backup or restore point. Each mutation command requires a fresh, operation-scoped confirmation and complete backup evidence.
5. Stop unless the recorded target deployment remains healthy and its source commit still equals local `main` and `origin/main`.

### One-time Vercel bootstrap path

Use this path only when the operator cannot safely run database preparation locally. It does not weaken the backup, commit, identity or disabled-service gates above.

1. Set `FEED_DB_BOOTSTRAP_ENABLED=true`, the exact reviewed source commit, fresh backup evidence, a generated runtime password, and the same-owner pooled/direct Neon URLs in Production only.
2. Keep `FEED_READ_SOURCE=content`, `FEED_WRITES_ENABLED=false` and `FEED_MCP_ENABLED=false`.
3. Deploy the exact reviewed commit. `prebuild` runs the fixed foundation migration, forward migration and write-grant runners, then verifies schema, grants and runtime identity.
4. Record the redacted bootstrap status and create `FEED_RUNTIME_DATABASE_URL` with role `feeds_app_runtime`.
5. Remove `DATABASE_URL`, `DATABASE_URL_UNPOOLED`, all `FEED_DB_BOOTSTRAP_*` variables and any Marketplace owner aliases; disable bootstrap and redeploy.
6. Confirm the bootstrap status artifact is no longer public before enabling database reads or MCP.

The bootstrap accepts no caller-supplied role, SQL, migration path or shell command. Re-running against an initialized database verifies the reviewed schema and grants instead of applying arbitrary migrations.

## Database preparation while Content remains live

All commands in this section require `FEED_DB_TARGET=production`, Content reads, writes off, MCP off, a clean worktree, matching pooled/direct identity, matching fingerprint, and explicit `--apply`. They fail closed when evidence is incomplete.

### Empty database: foundation migration

Run only when the application schema is verified empty. This runner executes only reviewed journal entry `0` / `0000_windy_trish_tilby`; later journal entries do not broaden it.

```bash
npm run db:migrate -- \
  --apply \
  --confirm-production=feeds-hub-production:foundation-migration:<fingerprint> \
  --backup-id=<provider-id> \
  --backup-created-at=<ISO-8601> \
  --backup-database-fingerprint=<fingerprint> \
  --backup-retain-until=<ISO-8601> \
  --recovery-reference=<https-console-neon-tech-entry>
```

Stop unless post-verification confirms `feeds`, `feed_import_runs`, `drizzle.__drizzle_migrations`, and exactly the reviewed foundation journal row.

### First deterministic Markdown import

Run the offline plan first, then a database comparison. Apply only when the plan has no invalid/conflict/unexpected rows and the backup evidence has been refreshed if required.

```bash
npm run content:import:dry
npm run content:import:dry -- --database
npm run content:import -- \
  --apply \
  --confirm-production=feeds-hub-production:markdown-import:<fingerprint> \
  --backup-id=<provider-id> \
  --backup-created-at=<ISO-8601> \
  --backup-database-fingerprint=<fingerprint> \
  --backup-retain-until=<ISO-8601> \
  --recovery-reference=<https-console-neon-tech-entry>
npm run content:verify
```

Do not repeat the import unless a reviewed plan and a new operation-scoped confirmation authorize that exact idempotent run.

When Production exposes only `FEED_RUNTIME_DATABASE_URL` and the reviewed write grants are already active, the import may instead use the fixed one-time Vercel runtime importer. This exception is only for an already-migrated database and does not reintroduce owner credentials. Before the deployment:

1. Record a fresh, usable Neon backup/restore point and its retention deadline. Stop if the recovery entry cannot be verified.
2. Set `FEED_READ_SOURCE=content`, `FEED_WRITES_ENABLED=false`, `FEED_MCP_ENABLED=false`, `FEED_CONTENT_IMPORT_ENABLED=true`, `FEED_CONTENT_IMPORT_MODE=plan` and the exact `FEED_CONTENT_IMPORT_SOURCE_COMMIT`. Deploy only the exact reviewed `main` commit. The read-only plan verifies schema, grants, identity and the database comparison, then reports the redacted runtime-only fingerprint and counts without exporting the URL.
3. Stop unless the initialization plan contains only insert or unchanged rows, with no update, invalid, conflict or unexpected rows. Record a fresh, usable Neon backup/restore point and its retention deadline. Stop if the recovery entry cannot be verified.
4. Change only `FEED_CONTENT_IMPORT_MODE=apply` and add the plan fingerprint plus the four `FEED_CONTENT_IMPORT_BACKUP_*` / recovery evidence values. Redeploy the same commit. `prebuild` repeats every plan check and performs the deterministic plan in one database statement. It accepts no SQL, file path, role, shell command, delete, truncate or reset input.
5. Require the build log to report matching plan, result and post-verification counts without exposing credentials. Stop on any mismatch.
6. Remove every `FEED_CONTENT_IMPORT_*` value, restore `FEED_READ_SOURCE=database`, `FEED_WRITES_ENABLED=true`, `FEED_MCP_ENABLED=true`, and redeploy the same reviewed commit. Confirm the one-time importer is disabled by absence of its switch.

This runtime-only path never updates an existing Feed and does not grant `feeds_app_runtime` access to `feed_import_runs`; the exact source commit, source tree hash, plan counts, database fingerprint and verification counts are retained in the Vercel Production build log and the execution record. Re-running still requires a new reviewed deployment and fresh backup evidence.

### Exact runtime forward migration

Run only after the database journal contains exactly reviewed `0000` and before `0001` has been applied. The runner executes only reviewed entry `1` / `0001_swift_ben_parker`; it accepts no migration name, SQL, file, shell, down, delete, or reset input.

```bash
npm run db:migrate:forward -- \
  --apply \
  --confirm-production=feeds-hub-production:runtime-forward-migration:<fingerprint> \
  --backup-id=<provider-id> \
  --backup-created-at=<ISO-8601> \
  --backup-database-fingerprint=<fingerprint> \
  --backup-retain-until=<ISO-8601> \
  --recovery-reference=<https-console-neon-tech-entry>
```

Stop unless post-verification confirms `pg_trgm`, `feed_revisions`, `feed_audit_events`, `feed_idempotency_keys`, the delete/history protection triggers, and exactly the reviewed `0000` then `0001` journal rows.

## Phase B — Database reads

While Phase A still serves Content, apply only the fixed read grant runner. It removes runtime/public table and sequence grants, public-schema/database creation, and database temporary-object creation, then grants only `SELECT` on `public.feeds`. It accepts no SQL, role, table, file, or shell input and fails unless the runtime role has no elevated attributes, inherited roles, or owned objects.

```bash
npm run db:grant:runtime-read -- \
  --apply \
  --confirm-production=feeds-hub-production:runtime-read-grants:<fingerprint> \
  --backup-id=<provider-id> \
  --backup-created-at=<ISO-8601> \
  --backup-database-fingerprint=<fingerprint> \
  --backup-retain-until=<ISO-8601> \
  --recovery-reference=<https-console-neon-tech-entry>
```

Stop unless verification reports `feeds_app_runtime` with no elevated attributes, inherited roles, owned objects, schema/database create or temporary privileges, unexpected table privileges, or sequence privileges.

Change only:

```text
FEED_READ_SOURCE=database
FEED_WRITES_ENABLED=false
FEED_MCP_ENABLED=false
```

Redeploy the same reviewed commit. Verify home, all categories, selected detail pages, pagination JSON, list membership, sorting, stock close filtering, selected historical feeds, response status, database latency, and connection errors.

Stop gate: on mismatch or unacceptable database behavior, restore Content reads with writes/MCP off and roll back to the pre-change known-good Production deployment. Preserve all Neon rows and logs.

## Phase C — Read-only MCP canary

Change only:

```text
FEED_READ_SOURCE=database
FEED_WRITES_ENABLED=false
FEED_MCP_ENABLED=true
```

Configure the reviewed OAuth issuer, canonical resource/audience and JWKS values from [`feed-mcp-oauth.md`](feed-mcp-oauth.md). Production must use `FEED_MCP_AUTH_MODE=oauth`; do not configure the legacy `FEED_MCP_TOKEN`. Redeploy the same reviewed commit. Verify protected-resource discovery, the OAuth login flow, Streamable HTTP initialize, `tools/list`, `list_feeds`, `get_feed`, and `find_feed_duplicates` with redacted evidence.

`tools/list` currently advertises all seven narrow tools. Read-only behavior is enforced by `FEED_WRITES_ENABLED=false`; explicitly verify `save_feed_draft`, `publish_feed`, `update_published_feed`, and `archive_feed` are rejected with `WRITES_DISABLED` and create no Feed, revision, audit, or idempotency record.

Stop gate: on protocol, OAuth metadata/token validation, origin, latency, or unexpected mutation behavior, set `FEED_MCP_ENABLED=false`, revoke affected OAuth grants when exposure is possible, and redeploy. Database reads may remain enabled only if Phase B was independently approved.

## Phase D — Writes

This phase requires a separate Production write authorization after Phase C review. Local integration success does not authorize it.

First disable MCP while keeping database reads and writes off, then redeploy and verify `/api/mcp` is disabled:

```text
FEED_READ_SOURCE=database
FEED_WRITES_ENABLED=false
FEED_MCP_ENABLED=false
```

From the controlled operator environment, apply the fixed write grant runner with fresh confirmation and backup evidence:

```bash
npm run db:grant:runtime-write -- \
  --apply \
  --confirm-production=feeds-hub-production:runtime-write-grants:<fingerprint> \
  --backup-id=<provider-id> \
  --backup-created-at=<ISO-8601> \
  --backup-database-fingerprint=<fingerprint> \
  --backup-retain-until=<ISO-8601> \
  --recovery-reference=<https-console-neon-tech-entry>
```

Stop unless the verified matrix is exact: `feeds` gets `SELECT/INSERT/UPDATE`; `feed_revisions`, `feed_audit_events`, and `feed_idempotency_keys` get `SELECT/INSERT`; `feed_import_runs` and all sequence/DDL/DELETE/TRUNCATE/REFERENCES/TRIGGER privileges remain unavailable.

Only after that result is reviewed, change to:

```text
FEED_READ_SOURCE=database
FEED_WRITES_ENABLED=true
FEED_MCP_ENABLED=true
```

Grant only the reviewed OAuth write scopes to the dedicated operator. Verify one minimal draft, replay with the same idempotency key, conflicting replay, duplicate evidence, review, publish, public page appearance, optimistic version conflict, update, archive, revisions, audit events, and absence of any physical delete path. Record created Feed IDs and audit IDs without recording credentials.

Stop gate: on unauthorized/unaudited mutation, idempotency failure, version failure, page mismatch, or unexpected write scope, immediately set `FEED_WRITES_ENABLED=false` and `FEED_MCP_ENABLED=false`. Run the fixed read grant runner with a fresh `runtime-read-grants` confirmation to revoke database write privileges; rotate tokens when containment requires it. Preserve Feed rows and all history for diagnosis.

## Rollback matrix

| Failure stage | Immediate rollback |
|---|---|
| Database preparation | Stop; use the recorded Neon recovery procedure only under provider/operator review. Never run a down migration, reset, truncate, or delete. |
| Phase A | Restore the execution record's pre-change known-good Production deployment and safe environment configuration. |
| Phase B | Set Content reads, writes off, MCP off; restore the pre-change known-good Production deployment. |
| Phase C | Disable MCP and rotate its token if needed; retain database reads only if Phase B remains approved. |
| Phase D | Disable writes and MCP immediately; reapply the fixed read-only privilege matrix with fresh evidence; rotate tokens if needed; fall back to Content reads if public output is affected. |

After rollback, verify public routes and pagination, retain Neon data/revisions/audit/idempotency records and logs, and keep `src/content/**` plus `ContentFeedSource`. Record the trigger, owner, time, deployment ID, and verification result.

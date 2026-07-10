# Feed Runtime Architecture

Status: proposed by Task 0. This document defines contracts for later task packages; it does not activate database reads, writes, runtime rendering, or MCP.

## Goals

- Keep the existing Astro site, routes, feed ordering, text-only UI, and content rules.
- Add Neon Postgres as an optional runtime data source without deleting the Astro Content Collection source.
- Add protected, idempotent feed writes with optimistic locking and append-only audit evidence.
- Expose the same domain operations through a Remote MCP Server only after Astro/Vercel compatibility is proven.
- Move the external content-writing workflow in `idaibin/aicraft` to MCP only after the production read/write path is reviewed and cut over.

## Non-goals

- No Next.js migration or second application framework.
- No general CMS, admin console, arbitrary SQL, arbitrary shell, or physical feed deletion.
- No content wording or UI rule changes unless a later task explicitly owns them.
- No removal of `src/content/**` or the Content Collection fallback during these tasks.
- No Production database mutation except the explicitly authorized Task 1 foundation migration and first idempotent Markdown import, plus separately confirmed Task 6 cutover operations. No other task inherits either authorization.

## Current Baseline

The Task 0 branch starts from `origin/main` at `f77e5b8e845ded0709bc7ccd95e76f810a3573c7`.

- Astro `7.0.4`, `output: "static"`.
- `getCollection("feeds")` is the only feed source.
- `CollectionEntry<"feeds">` flows through `src/lib/feeds.ts`, `FeedList`, `FeedCard`, and pagination serialization.
- Home, category, detail, and pagination JSON are generated at build time.
- `src/content/**/*.md` contains 234 feeds: 233 reviewed and 1 unreviewed at the Task 0 snapshot.
- All 234 `eventKey` values are unique. Repeated `sourceUrl` values are valid and must not be used as a uniqueness constraint.

## Target Layers

```text
Astro pages / pagination JSON / MCP transport / write API
                         |
                    FeedService
                         |
          FeedSource (read) + FeedRepository (write)
                 /                       \
ContentFeedSource                  DatabaseFeedRepository
Astro Content Collection           Drizzle + Neon Postgres
```

### Domain layer

`Feed` is the stable application model. It is independent of Astro Content Collection and database row types. UI components and serializers accept the domain model only after Task 2.

### Read source layer

`FeedSource` owns published-feed reads and the existing sorting/list semantics.

- `ContentFeedSource` adapts `CollectionEntry<"feeds">` into `Feed`.
- `DatabaseFeedSource` reads published rows from Neon.
- `FEED_READ_SOURCE=content|database` selects exactly one source.
- Default remains `content` through Tasks 1 and 2.
- Selecting `database` without a valid server-side database URL is a startup/request error. There is no silent fallback that could hide an incomplete migration.

### Write layer

`FeedRepository` owns transactions and persistence. `FeedService` owns validation, deduplication, idempotency, status transitions, optimistic locking, and audit intent. HTTP and MCP are transport adapters and must not duplicate domain rules.

All mutations require:

- `FEED_WRITES_ENABLED=true`;
- authenticated server-side access;
- a command-specific validation schema;
- an idempotency key for every save-draft, publish, published-update, and archive operation;
- `expectedVersion` for published updates and archive operations;
- an audit actor and reason.

### Transport layer

- Task 4 adds protected HTTP write routes under `/api/feeds/**`.
- Task 5 adds `/api/mcp` only after a compatibility spike proves that `mcp-handler` can run inside an Astro route built by `@astrojs/vercel` using Streamable HTTP.
- Task 7 changes `aicraft` to call the reviewed MCP tools. It does not bypass `FeedService`.

## Astro and Vercel Runtime

Task 3 adds the official `@astrojs/vercel` adapter and on-demand rendering for feed-backed routes. Astro officially supports adapter-based on-demand rendering and permits individual routes to opt out of prerendering. The implementation must stay within Astro; adding Next.js to satisfy an MCP library is a reject condition.

Runtime routes after Task 3:

- `/`
- `/category/[category]/`
- `/feed/[...slug]/`
- `/feed-pages/[list]/[page].json`
- later `/api/feeds/**`
- later `/api/mcp`

Static assets and unrelated routes may remain prerendered. Route URLs, visible labels, list membership, and sort order remain unchanged.

Official references:

- Astro on-demand rendering: <https://docs.astro.build/en/guides/on-demand-rendering/>
- Astro integrations and adapters: <https://docs.astro.build/en/guides/integrations/>

## Neon and Drizzle

Task 1 uses:

- `drizzle-orm` for typed schema and queries;
- `drizzle-kit` for generated SQL migrations;
- `@neondatabase/serverless` with the Drizzle Neon HTTP driver for serverless reads, deterministic imports, and non-interactive operations.

Drizzle documents Neon HTTP as appropriate for serverless queries and supports batching with the Neon HTTP driver. Task 4 must prove that its multi-statement mutation path is atomic using supported batching or a single SQL statement before writes can be enabled. If the chosen driver cannot provide the required atomicity, Task 4 stops and records the blocker instead of weakening audit or optimistic-lock guarantees.

Official references:

- Drizzle and Neon: <https://orm.drizzle.team/docs/connect-neon>
- Drizzle batch API: <https://orm.drizzle.team/docs/batch-api>
- Drizzle transactions: <https://orm.drizzle.team/docs/transactions>

## Database Ownership by Task

### Task 1 foundation

- `feeds`
- `feed_import_runs`
- enums, constraints, indexes, generated migrations

The initial `feeds` row includes `version` and lifecycle state so later tasks do not need a destructive table redesign.

### Task 4 writes

- `feed_revisions`
- `feed_audit_events`
- `feed_idempotency_keys`
- additional indexes required by duplicate search and audit lookup

No table or tool exposes physical delete. Archive is a lifecycle transition.

## Lifecycle

```text
draft -> published -> archived
  |          |
  +----------+ update with expectedVersion
```

- Markdown `reviewed: false` imports as `draft`.
- Markdown `reviewed: true` imports as `published`.
- Published updates increment `version` and append a revision and audit event.
- Archive increments `version`, sets `archivedAt`, and appends an audit event.
- An archived feed is excluded from public reads but remains queryable to authorized internal services.
- There is no transition that physically deletes a feed.

## Environment Contract

| Variable | Default | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | unset | Server-only Neon pooled URL used by runtime queries. |
| `DATABASE_URL_UNPOOLED` | unset | Direct URL reserved for reviewed migration commands. |
| `FEED_DB_TARGET` | unset | Required mutation target: `test`, `preview`, or `production`. |
| `FEED_READ_SOURCE` | `content` | Selects `content` or `database`. |
| `FEED_WRITES_ENABLED` | `false` | Global write kill switch. |
| `FEED_WRITE_TOKEN` | unset | Bearer token for protected HTTP writes. |
| `FEED_MCP_ENABLED` | `false` | Remote MCP kill switch. |
| `FEED_MCP_TOKEN` | unset | Separate bearer token for `/api/mcp`. |

All variables are server-only. They must not use a public client prefix or appear in logs, API errors, rendered HTML, or MCP tool output.

The current rollout uses one Production Neon database and does not create or use a Preview database. Task 1 must verify or establish both exact server-only aliases `DATABASE_URL` and `DATABASE_URL_UNPOOLED` before any database command runs. The pooled and direct aliases must resolve to the same Neon project, branch, and database with their expected connection roles; a missing alias, role mismatch, or redacted-identity mismatch stops before connection or mutation. Platform integrations may generate differently prefixed variables, but application code reads only these contract names; provider-specific generated names must not be hard-coded as fallbacks, and the direct URL must not be derived by string rewriting. Verification may report a redacted database identity, never a connection string.

The Production-only decision grants a narrow exception to Task 1 for the generated foundation migration and the first deterministic Markdown import. Both operations remain gated by the migration document: a successful dry run, verified Production database identity, a recorded backup or restore point, an operation-scoped `--confirm-production` flag, `FEED_READ_SOURCE=content`, disabled runtime writes/MCP, rejection of unexpected non-empty application schema or data, and post-import verification. It does not authorize reset, truncate, delete, destructive rollback, Task 4 mutation tests, or Task 5 Preview database access.

## Security Invariants

- Writes and MCP are disabled by default.
- Tokens are compared through one authentication helper and can be rotated independently.
- Payload size and field length limits are enforced before repository calls.
- `sourceUrl` accepts HTTP/HTTPS only.
- Duplicate detection is advisory before save and mandatory before publish.
- Optimistic-lock conflicts return a stable conflict error; they never overwrite silently.
- Audit records are append-only and store actor, action, feed id, version, reason, idempotency key, and timestamp.
- HTTP/MCP responses never include database URLs, raw driver errors, tokens, or arbitrary stack traces.
- No API or MCP tool accepts SQL, shell commands, file paths, or delete instructions.

## Task Dependency Chain

| Task | Branch | Depends on | Exit gate |
| --- | --- | --- | --- |
| 0 | `content/feed-runtime-architecture` | `origin/main@f77e5b8` | Reviewed architecture, contracts, migration and rollback docs. |
| 1 | `feat/feed-database-foundation` | Task 0 squashed to latest `main` | Production gates pass; generated foundation migration and first idempotent import verify; pages still use content and writes remain off. |
| 2 | `refact/feed-domain-model` | Task 1 squashed | UI no longer imports `CollectionEntry<"feeds">`; output unchanged. |
| 3 | `feat/feed-runtime-read` | Task 2 squashed | Content/database switch, runtime pages and Playwright pass. |
| 4 | `feat/feed-write-api` | Task 3 squashed | Protected writes, lock/idempotency/audit integration tests pass on an explicitly authorized non-Production database; writes default off. |
| 5 | `feat/feed-mcp-server` | Task 4 squashed | Astro/Vercel/mcp-handler spike passes in Vercel Preview without database mutation before tool implementation. |
| 6 | `release/feed-runtime-cutover` | Task 5 squashed | Production read cutover evidence, separately confirmed forward migrations, rollback material, and Markdown source retained. |
| 7 | `feat/feeds-hub-mcp-writer` in `aicraft` | Task 6 reviewed and cut over | Existing content rules drive MCP draft/review/publish workflow. |

Each task stops after its branch is committed and pushed. The next task starts only from the latest `main` after the preceding branch has been reviewed and squash-integrated.

## Reject Conditions

Stop the active task and report instead of expanding scope when:

- the required preceding task is not present on latest `main`;
- Task 1 cannot verify the exact Production identity, a usable backup/restore point, an operation-scoped Production confirmation, disabled runtime writes/MCP, or the expected empty application schema/data state before mutation;
- any task other than the authorized Task 1 foundation/import operation or a separately confirmed Task 6 cutover attempts to mutate Production;
- Task 4 has only the Production database for mutation/integration testing; the Task 1 authorization is not reusable and Task 4 stops until an explicitly authorized non-Production database exists;
- Task 5 Preview attempts a database migration, import, write test, or Production database mutation; its Preview authorization covers only code and MCP protocol compatibility;
- runtime output, URL shape, sort order, or copy changes without explicit ownership;
- write atomicity, optimistic locking, or audit completeness cannot be proven;
- `mcp-handler` requires Next.js/Nuxt-specific primitives that cannot be adapted within an Astro route;
- a proposed MCP tool would expose SQL, shell execution, physical delete, or an unrestricted mutation surface.

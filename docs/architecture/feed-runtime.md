# Feed Runtime Architecture

Status: historical architecture and rollout design. Tasks 0–6 were completed in July 2026. Current Production state and later content sync evidence live in `README.md` and `docs/progress/feed-runtime.md`; old commit, count and branch values below are frozen baseline evidence, not current instructions.

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
- Task 5 adds `/api/mcp` only after a local compatibility spike proves that the pinned `mcp-handler` can run inside an Astro route using Streamable HTTP. Task 5 does not deploy; Task 6 owns the phased Production canary after squash integration to `main`.
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
| `FEED_RUNTIME_DATABASE_URL` | unset | Vercel Production runtime-only pooled URL using the fixed `feeds_app_runtime` role. |
| `DATABASE_URL` | unset | Operator/bootstrap pooled URL. It may temporarily contain the owner credential only during the explicitly enabled one-time Production bootstrap and must be removed afterward. |
| `DATABASE_URL_UNPOOLED` | unset | Direct migration-owner URL for reviewed operator commands only; it must be absent from Vercel build/runtime environments. |
| `FEED_DB_EXPECTED_MIGRATION_ROLE` | unset | Exact reviewed owner role expected in `DATABASE_URL_UNPOOLED`; never a grant target supplied by a caller. |
| `FEED_DB_TARGET` | unset | Required mutation target: `test`, `preview`, or `production`. |
| `FEED_READ_SOURCE` | `content` | Selects `content` or `database`. |
| `FEED_WRITES_ENABLED` | `false` | Global write kill switch. |
| `FEED_WRITE_TOKEN` | unset | Bearer token for protected HTTP writes. |
| `FEED_MCP_ENABLED` | `false` | Remote MCP kill switch. |
| `FEED_MCP_AUTH_MODE` | `oauth` | `/api/mcp` authentication mode. Production uses `oauth`; `token` is retained only for explicit local compatibility tests. |
| `FEED_MCP_OAUTH_ISSUER` | unset | Exact OAuth/OIDC issuer identifier used to validate `iss`. |
| `FEED_MCP_OAUTH_RESOURCE` | unset | Canonical HTTPS MCP resource URL, for example `https://feeds.idaibin.dev/api/mcp`. |
| `FEED_MCP_OAUTH_AUDIENCE` | resource URL | Access-token audience required by the MCP resource server. |
| `FEED_MCP_OAUTH_JWKS_URL` | unset | HTTPS JWKS endpoint used to verify signed OAuth access tokens. |
| `FEED_MCP_OAUTH_ALGORITHMS` | `RS256` | Comma-separated allowlist limited to `RS256`, `PS256`, `ES256`, or `EdDSA`. |
| `FEED_MCP_OAUTH_REQUIRED_SCOPES` | `feeds:read` | Scopes required before MCP dispatch. Expand only during a separately reviewed write cutover. |
| `FEED_MCP_TOKEN` | unset | Legacy local compatibility credential; do not configure it in Production OAuth mode. |
| `FEED_MCP_ALLOWED_ORIGINS` | unset | Optional exact Origin allowlist for MCP request-origin enforcement; not a CORS switch. |

All variables are server-only. They must not use a public client prefix or appear in logs, API errors, rendered HTML, or MCP tool output.

The current rollout uses one Production Neon database and does not create or use a Preview database. Normal operator commands require pooled `DATABASE_URL` with fixed role `feeds_app_runtime` and direct `DATABASE_URL_UNPOOLED` with the distinct reviewed migration owner; both resolve to the same endpoint/database, and the identity fingerprint covers both roles. The one-time bootstrap instead receives pooled/direct aliases for the same owner, derives a fixed-role runtime URL, then invokes those normal runners with the derived runtime URL. Missing aliases, role mismatch, or fingerprint mismatch stops before mutation. After bootstrap, Vercel retains only `FEED_RUNTIME_DATABASE_URL` with the low-privilege runtime role and rejects any other Neon direct/owner credential.

The Production-only decision grants a narrow exception to Task 1 for the generated foundation migration and the first deterministic Markdown import. Both operations remain gated by the migration document: a successful dry run, verified Production database identity, a recorded backup or restore point, an operation-scoped `--confirm-production` flag, `FEED_READ_SOURCE=content`, disabled runtime writes/MCP, rejection of unexpected non-empty application schema or data, and post-import verification. It does not authorize reset, truncate, delete, destructive rollback, Task 4 mutation tests, Task 5 database access, or the later Production MCP canary to write data.

## Security Invariants

- Writes and MCP are disabled by default.
- MCP OAuth access tokens are verified against exact issuer, audience, expiry, signature algorithm, and JWKS. HTTP write tokens remain independent.
- MCP tools enforce `feeds:read`, `feeds:write`, `feeds:publish`, or `feeds:archive` scopes before service calls; the global write kill switch remains a second boundary.
- Payload size and field length limits are enforced before repository calls.
- `sourceUrl` accepts HTTP/HTTPS only.
- Duplicate detection is advisory before save and mandatory before publish.
- Optimistic-lock conflicts return a stable conflict error; they never overwrite silently.
- Audit records are append-only and store actor, action, feed id, version, reason, idempotency key, and timestamp.
- The Production runtime role owns no objects, inherits no roles, cannot create schemas or temporary objects, and has no DDL, DELETE, TRUNCATE, REFERENCES, or TRIGGER privilege. Phase B grants only Feed reads; Phase D adds only the exact tables and operations required by `FeedRepository`.
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
| 5 | `feat/feed-mcp-server` | Task 4 squashed | Local Astro/mcp-handler Streamable HTTP spike passes before all seven tools are implemented; no deployment or database mutation. |
| 6 | `release/feed-runtime-cutover` | Task 5 squashed | Production read cutover and read-only MCP canary evidence from `main`, separately confirmed forward migrations, rollback material, and Markdown source retained. |
| 7 | `feat/feeds-hub-mcp-writer` in `aicraft` | Task 6 reviewed and cut over | Existing content rules drive MCP draft/review/publish workflow. |

Each task stops after its branch is committed and pushed. The next task starts only from the latest `main` after the preceding branch has been reviewed and squash-integrated.

## Reject Conditions

Stop the active task and report instead of expanding scope when:

- the required preceding task is not present on latest `main`;
- Task 1 cannot verify the exact Production identity, a usable backup/restore point, an operation-scoped Production confirmation, disabled runtime writes/MCP, or the expected empty application schema/data state before mutation;
- any task other than the authorized Task 1 foundation/import operation or a separately confirmed Task 6 cutover attempts to mutate Production;
- Task 4 has only the Production database for mutation/integration testing; the Task 1 authorization is not reusable and Task 4 stops until an explicitly authorized non-Production database exists;
- Task 5 attempts any deployment or Production database access; its authorization covers local code and MCP protocol compatibility only;
- the Task 6 first MCP canary invokes mutation tools, enables writes, or treats local test authorization as Production write authority;
- runtime output, URL shape, sort order, or copy changes without explicit ownership;
- write atomicity, optimistic locking, or audit completeness cannot be proven;
- `mcp-handler` requires Next.js/Nuxt-specific primitives that cannot be adapted within an Astro route;
- a proposed MCP tool would expose SQL, shell execution, physical delete, or an unrestricted mutation surface.

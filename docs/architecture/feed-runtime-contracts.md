# Feed Runtime Contracts

Status: implemented contract plus historical rollout commentary. Production cutover completed in July 2026; runtime behavior is defined by reviewed source, while current deployment and data-sync evidence live in `docs/progress/feed-runtime.md`. Task labels below describe provenance and are not pending work.

## Domain Model

```ts
type FeedStatus = 'draft' | 'published' | 'archived';
type FeedOrigin = 'markdown' | 'api' | 'mcp';

interface Feed {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  category: CategoryId;
  kind: FeedKind;
  topic: string;
  date: Date;
  eventAt: Date;
  eventKey: string;
  cover: string;
  coverStatus: 'pending';
  tags: string[];
  summary: string;
  source: string;
  sourceUrl: string;
  body: string;
  priority: number;
  status: FeedStatus;
  version: number;
  origin: FeedOrigin;
  publishedAt: Date | null;
  archivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
```

The domain model preserves every field currently needed by the UI. `reviewed` is an adapter concern:

- Content adapter maps `reviewed: true` to `published`.
- Content adapter maps `reviewed: false` to `draft`.
- Database rows store `status` directly.

`id` is the stable internal identifier. `slug` is the public path identity and matches the existing Content Collection entry id such as `ai/2026-07-10-example`.

## Validation Contract

One shared schema validates Markdown imports, HTTP commands, and MCP tool inputs before they reach `FeedService`.

Required invariants:

- `slug`: stable lowercase path containing only safe path segments.
- `title`, `subtitle`, `summary`, `body`: bounded strings following existing content rules.
- `category`, `kind`, `coverStatus`: existing enum values from `src/content.config.ts` until Task 2 centralizes them.
- `eventAt`, `date`: valid timestamps normalized to UTC.
- `eventKey`: non-empty and globally unique at the database boundary.
- `sourceUrl`: absolute HTTP/HTTPS URL.
- `tags`: bounded array of bounded strings.
- `priority`: finite integer in a documented range.
- unknown fields: rejected for write commands.

Validation errors use stable machine-readable codes plus field paths. Transport adapters may translate them to HTTP/MCP shapes but may not weaken them.

## Read Contracts

```ts
interface PublicFeedPageQuery {
  list: string;
  page: number;
  pageSize: number;
}

interface FeedPage {
  items: Feed[];
  page: number;
  pageSize: number;
  hasMore: boolean;
}

interface FeedSource {
  listPublished(query: PublicFeedPageQuery): Promise<FeedPage>;
  getBySlug(slug: string): Promise<Feed | undefined>;
}
```

Public reads always return published feeds. Numeric `page` and `pageSize` preserve the existing pagination URL contract, with `page` bounded to 1-1000 and `pageSize` to 1-100. The database adapter pushes list/category selection, the stock-close predicate, future-sports ordering, stable tie-breaks, and pagination into PostgreSQL; it fetches at most `pageSize + 1` projected rows and excludes `body` from list queries. Only detail lookup fetches the complete body. Draft/archived search and cursor pagination are separate internal repository/service operations and require authorization.

### Existing presentation contract

Tasks 2 and 3 must preserve:

- `/` as the all-feed list.
- `/category/<id>/` route paths and labels.
- `/feed/<category>/<slug>/` detail URLs produced from the existing entry id.
- `/feed-pages/<list>/<page>.json` payload fields: `id`, `href`, `category`, `categoryShortName`, `title`, `summary`, `eventAt`, `eventAtLabel`; the public `id` remains the existing Content entry id, which is the feed slug.
- page size of 10.
- current topic/list resolution, including the existing `ai` and `dev` topic-group lookup before category fallback.
- the stock close filter in `src/lib/feeds.ts`.

### Existing sort contract

1. Non-future items precede future sports events.
2. Future sports events sort by `eventAt` ascending.
3. Other items sort by `eventAt` descending.
4. Ties sort by `priority` descending.
5. Remaining ties sort by `date` descending.
6. Final ties sort by public `slug` ascending. Database UUID `id` is not a presentation ordering key.

Database ordering must implement the same semantics. Tests must compare content-source and database-source output using the same fixture set.

## Repository Contract

```ts
interface AuthorizedFeedSearch {
  status?: FeedStatus;
  category?: CategoryId;
  query?: string;
  limit?: number;
  cursor?: string;
}

interface AuthorizedFeedSearchPage {
  items: Feed[];
  nextCursor: string | null;
}

interface FeedRepository extends FeedSource {
  search(input: AuthorizedFeedSearch): Promise<AuthorizedFeedSearchPage>;
  findDuplicates(input: DuplicateQuery): Promise<DuplicateCandidate[]>;
  saveDraft(command: SaveDraftCommand): Promise<MutationResult>;
  publish(command: PublishCommand): Promise<MutationResult>;
  updatePublished(command: UpdatePublishedCommand): Promise<MutationResult>;
  archive(command: ArchiveCommand): Promise<MutationResult>;
}
```

Repository methods are not exposed directly to routes. `FeedService` calls them after feature flags, auth context, validation, deduplication, and command rules pass.

## Duplicate Contract

```ts
interface DuplicateQuery {
  feedId?: string;
  slug?: string;
  eventKey?: string;
  sourceUrl?: string;
  title?: string;
  category?: CategoryId;
}

interface DuplicateCandidate {
  feedId: string;
  slug: string;
  eventKey: string;
  sourceUrl: string;
  status: FeedStatus;
  reasons: Array<'event_key' | 'slug' | 'source_url' | 'title_similarity'>;
}
```

- Exact `eventKey` or `slug` collision blocks a second feed.
- Repeated `sourceUrl` is a review signal, not a uniqueness violation; the current Markdown snapshot contains valid repeated source URLs.
- Title similarity is advisory and must include the candidate evidence in the response.
- Publishing requires an explicit duplicate check within the same service command.

## Write Commands

```ts
interface MutationContext {
  actor: string;
  reason: string;
  idempotencyKey: string;
}

interface SaveDraftCommand extends MutationContext {
  feedId?: string;
  expectedVersion?: number;
  feed: FeedDraftInput;
}

interface PublishCommand extends MutationContext {
  feedId: string;
  expectedVersion: number;
}

interface UpdatePublishedCommand extends MutationContext {
  feedId: string;
  expectedVersion: number;
  patch: PublishedFeedPatch;
}

interface ArchiveCommand extends MutationContext {
  feedId: string;
  expectedVersion: number;
}

interface MutationResult {
  feed: Feed;
  action: 'created' | 'published' | 'updated' | 'archived';
  auditEventId: string;
}
```

`PublishedFeedPatch` is an allowlist of editorial fields. It cannot contain `id`, `version`, timestamps, audit fields, raw SQL, or lifecycle state.

Creating a new draft omits `feedId` and `expectedVersion`. Updating an existing draft requires both; the same optimistic-lock behavior applies so concurrent draft review cannot overwrite silently.

## Idempotency

- Every save-draft, publish, published-update, and archive command requires an idempotency key. There is no mutation command for which the key is optional.
- HTTP mutation routes use the `Idempotency-Key` header; MCP write tools require `idempotencyKey` in input. Read-only duplicate queries do not require an idempotency key.
- Scope is `(actor, operation, idempotencyKey)`.
- The repository stores a normalized request hash and successful result reference.
- Same key plus same request returns the stored result.
- A replay returns the original feed snapshot, action, and audit event id without adding another revision or audit event.
- Same key plus different request returns `IDEMPOTENCY_CONFLICT`.
- Failed validation is not persisted as a successful idempotent result.

Markdown import idempotency is based on `eventKey`, `slug`, and canonical content hash:

- same identity and hash: `unchanged`;
- same identity with changed content: deterministic update during the approved import stage;
- eventKey/slug mapping collision: fail and report; never rename silently.

## Optimistic Locking

- Every mutable feed row starts at `version = 1`.
- Existing draft update, publish, published update, and archive include `expectedVersion`.
- The update predicate includes both feed id and expected version.
- Zero updated rows returns `VERSION_CONFLICT` with the current version when authorized.
- A successful mutation increments version once and writes the revision/audit records atomically.

## Audit Contract

Each successful save-draft, publish, published-update, and archive mutation appends an immutable event containing:

- event id;
- feed id;
- resulting version;
- actor;
- action;
- reason;
- origin (`api` or `mcp`);
- idempotency key;
- timestamp;
- safe request metadata, excluding secrets and raw database errors.

Published updates also store a revision snapshot sufficient to inspect or restore content through a future reviewed service operation. No MCP tool performs arbitrary history rewrites.

## HTTP Write API

All routes require bearer authentication and `FEED_WRITES_ENABLED=true`. Every mutation route also requires an `Idempotency-Key` header; the read-only duplicate route does not.

| Method | Route | Operation |
| --- | --- | --- |
| `POST` | `/api/feeds/duplicates` | Find duplicate candidates. |
| `POST` | `/api/feeds/drafts` | Save or idempotently return a draft. |
| `POST` | `/api/feeds/:id/publish` | Publish a draft with `expectedVersion`. |
| `PATCH` | `/api/feeds/:id` | Update allowlisted fields on a published feed. |
| `POST` | `/api/feeds/:id/archive` | Soft-archive a feed. |

There is no `DELETE` route.

### Response envelope

Success:

```json
{
  "ok": true,
  "data": {}
}
```

Failure:

```json
{
  "ok": false,
  "error": {
    "code": "VERSION_CONFLICT",
    "message": "Feed version changed",
    "issues": []
  }
}
```

Stable error codes:

- `AUTH_REQUIRED`
- `WRITES_DISABLED`
- `VALIDATION_FAILED`
- `DUPLICATE_CONFLICT`
- `IDEMPOTENCY_CONFLICT`
- `VERSION_CONFLICT`
- `FEED_NOT_FOUND`
- `INVALID_STATE_TRANSITION`
- `DATABASE_UNAVAILABLE`
- `INTERNAL_ERROR`

Raw database messages are logged only after secret redaction and are never returned.

## MCP Compatibility Gate

Task 5 pins `mcp-handler@1.1.0` with `@modelcontextprotocol/sdk@1.26.0` and begins with a local compatibility spike. Although the package documentation is framework-oriented, this version exposes a Web `Request` to Web `Response` handler and uses the Web Standard Streamable HTTP transport. The spike must prove all of the following inside this repository before the remaining tools are implemented:

- an Astro API route at `/api/mcp` can adapt the request/response types without a second framework;
- the Astro route preserves Streamable HTTP POST responses and required headers;
- initialization, tool listing, and one read-only Content-source tool work through a real local HTTP request and every response completes;
- OAuth bearer authentication runs before MCP request dispatch;
- no Next.js, Nuxt, Express sidecar, or separate deployment is introduced.

The route's method gate admits authenticated Streamable HTTP `POST` and `GET`; the pinned stateless transport has SSE disabled and therefore completes `GET` with `405`. The OAuth protected-resource metadata endpoint is `/.well-known/oauth-protected-resource` and supports metadata CORS `GET`/`OPTIONS`; `/api/mcp` itself does not add wildcard CORS. `FEED_MCP_ALLOWED_ORIGINS` is an exact Origin allowlist used to reject unexpected browser origins and DNS-rebinding paths. Non-browser clients may omit `Origin`, but every MCP request still requires a signed OAuth access token with exact issuer/audience/expiry validation. Declared request size is rejected before authentication, and the actual POST stream is read only after successful authentication, with a 256 KiB maximum.

Production OAuth mode follows the MCP authorization specification and RFC 9728. Unauthorized responses advertise the protected-resource metadata URL through `WWW-Authenticate`. The authorization server must publish OAuth/OIDC metadata, support authorization code with PKCE S256, issue JWT access tokens for the exact MCP resource/audience, and expose JWKS. ChatGPT may use client-ID metadata documents, dynamic client registration, or a separately configured static OAuth client. Tool callbacks enforce `feeds:read`, `feeds:write`, `feeds:publish`, and `feeds:archive`; validated OAuth subject/client identity is carried into mutation audit actors.

The pinned `mcp-handler@1.1.0` package is maintained through the repository's `patch-package` postinstall patch. The patch calls `unref()` on the package-global cleanup interval in both published CJS and ESM builds, preserving cleanup behavior while allowing idle serverless/test processes to exit naturally.

If any gate fails, Task 5 stops with evidence and does not implement the tools.

Task 5 does not deploy to Vercel Preview or Production. After Task 5 is reviewed, Task 6 may run a phased canary from `main` in Production. The MCP canary starts only after the database-read phase is approved, with `FEED_READ_SOURCE=database` and `FEED_WRITES_ENABLED=false`; it exercises initialization, tool listing, `list_feeds`, `get_feed`, and `find_feed_duplicates`, and verifies every advertised mutation tool fails with `WRITES_DISABLED` without creating data. It grants no migration, import, database mutation, or MCP mutation authorization. Enabling writes is a separate Task 6 decision after the read-only canary and local integration evidence are reviewed.

Reference: <https://github.com/vercel/mcp-handler>

## MCP Tools

All tools are narrow wrappers around `FeedService`.

| Tool | Input boundary | Output boundary |
| --- | --- | --- |
| `list_feeds` | status/category/query/limit/cursor allowlist; query 2-300 characters; limit 1-100 | Feed summaries and source-bound cursor. |
| `get_feed` | id or slug | One authorized feed view. |
| `find_feed_duplicates` | duplicate query fields only | Candidates with reasons. |
| `save_feed_draft` | validated feed draft + idempotency key + reason | Draft mutation result. |
| `publish_feed` | feed id + expected version + idempotency key + reason | Published mutation result. |
| `update_published_feed` | feed id + expected version + allowlisted patch + idempotency key + reason | Updated mutation result. |
| `archive_feed` | feed id + expected version + idempotency key + reason | Archived mutation result. |

Prohibited MCP capabilities:

- arbitrary SQL;
- arbitrary shell or command execution;
- filesystem access;
- physical feed deletion;
- schema/migration execution;
- token, environment, or raw audit export;
- generic create/update endpoints that bypass the seven named tools.

The authorized list/get contract is intentionally bounded for the current small feed dataset: Bearer authentication is mandatory, `limit` defaults to 20 and never exceeds 100, and cursors contain a canonical version plus `content` or `database` source identity. A cursor from one source is rejected before the other source's driver is called. This is not a general search or bulk-export interface.

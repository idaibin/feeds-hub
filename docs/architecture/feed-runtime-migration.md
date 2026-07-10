# Feed Runtime Migration and Rollback

Status: proposed by Task 0. No database command is executed by this task.

## Baseline Evidence

Task 0 records the following `origin/main@f77e5b8` snapshot for later comparison:

- 234 Markdown feeds.
- 233 feeds with `reviewed: true`.
- 1 feed with `reviewed: false`.
- 234 unique `eventKey` values.
- 29 repeated `sourceUrl` groups; these are expected because one source may support multiple events or states.
- Static Astro build with Content Collection as the only source.

Later verification must compute live counts instead of hard-coding these numbers as permanent expectations.

## Database Command Safety

Database mutation commands require both a connection URL and `FEED_DB_TARGET`. The current rollout is Production-only: it does not create or use a Preview database.

| Target | Current rollout policy |
| --- | --- |
| `test` | Not provisioned by this decision. A later test database requires explicit authorization before use. |
| `preview` | Not created or used. Vercel Preview in Task 5 is a code/protocol environment only and grants no database mutation authority. |
| `production` | Task 1 may run only the generated foundation migration and first idempotent Markdown import under the gates below. Task 6 may run separately reviewed forward migrations during cutover. All other mutations are rejected. |

Rules:

- `db:generate` and `db:check` are local/static and do not connect to a database.
- `content:import:dry` parses and validates without writing.
- Task 1 verifies or establishes both exact server-only aliases `DATABASE_URL` and `DATABASE_URL_UNPOOLED` before connecting. Platform-generated prefixed variables may be mapped in deployment configuration, but application code never reads those provider-specific names. Both aliases must resolve to the same Neon project, branch, and database with the pooled/direct roles expected by the command; a missing alias, role mismatch, or redacted-identity mismatch fails before connection or mutation. The unpooled URL is never derived by string rewriting the pooled URL.
- Migration and real import commands print the resolved target and a redacted database identity, never the URL, credentials, or connection-string fragments.
- An unset or unknown target fails before opening a connection.
- Before each authorized Production mutation, the operator must verify the actual project/branch/database identity against the reviewed target and record a usable provider backup or restore point. The evidence includes a redacted backup/restore identifier, creation time, covered database identity, retention window, and recovery entry; it must predate the mutation, and unverifiable recovery evidence stops the command.
- Production requires an operation-scoped `--confirm-production` flag in addition to `FEED_DB_TARGET=production`. The flag is supplied only to the reviewed command invocation and is not persisted as an application or Vercel environment variable.
- `FEED_READ_SOURCE=content`, `FEED_WRITES_ENABLED=false`, and `FEED_MCP_ENABLED=false` remain in force throughout Task 1 migration/import. Task 1 does not switch the live read source.
- Before the foundation migration, any unexpected non-empty application schema, pre-existing task-owned table, or application data stops the command for review. The command never adopts, overwrites, or clears an unknown database state.
- Reset, truncate, delete, destructive down-migration, and physical feed deletion are prohibited against Production in every task.
- Task 1 runs the import dry plan before applying the first import and runs `content:verify` immediately afterward. Count, identity, content, lifecycle, or ordering mismatch stops the task without switching reads.
- No rollback instruction destroys database or Markdown history.

## Deterministic Markdown Import

Task 1 implements a two-stage importer.

### Parse and normalize

1. Recursively enumerate `src/content/**/*.md` in sorted path order.
2. Parse frontmatter and body without changing source files.
3. Validate against the shared feed schema.
4. Derive `slug` from the Content Collection-compatible relative path.
5. Map `reviewed` to lifecycle status.
6. Normalize dates to UTC and preserve the exact source URL.
7. Compute a canonical content hash from normalized domain fields.

### Plan and apply

The dry plan classifies each item as:

- `insert`;
- `update`;
- `unchanged`;
- `conflict`;
- `invalid`.

Rules:

- `eventKey` and slug identify the feed.
- Same identity and hash is unchanged.
- Same identity and different hash is an update only in the reviewed import operation.
- Event key mapped to a different slug, or slug mapped to a different event key, is a conflict.
- Repeated source URLs are reported but do not fail by themselves.
- Any invalid/conflict item makes the import command fail before writes unless an explicitly reviewed resolution exists.

The authorized Task 1 apply phase runs once against the verified Production target only after all Production gates pass. All feed-row changes and the corresponding `feed_import_runs` record commit as one proven atomic transaction, batch, or equivalent single database operation. An interrupted or failed apply commits neither partial feed rows nor a successful import-run record. If the selected Neon/Drizzle path cannot prove this atomicity before Production execution, Task 1 stops.

The successful apply records an import run id, source commit, counts, and failures. Re-running the same source commit is idempotent, but every rerun still requires a fresh operation-scoped Production confirmation and must produce an `unchanged` plan unless a separately reviewed source change explains the difference.

## Verification Contract

`content:verify` compares Markdown normalization with database rows and reports:

- total, draft, published, archived counts;
- missing and unexpected identities;
- event key and slug collisions;
- content-hash mismatches;
- status mismatches;
- invalid timestamps or enums;
- source URL duplicate groups as informational evidence;
- ordered sample comparisons for all/category/sports lists.

It returns non-zero for identity, content, lifecycle, or ordering mismatches.

## Staged Delivery

### Task 0: architecture

Scope:

- architecture, interfaces, migration, rollback, and progress documentation only.

Exit:

- base validation passes;
- branch is committed and pushed;
- no runtime or dependency changes.

Rollback:

- revert the documentation commit; runtime is unaffected.

### Task 1: database foundation

Scope:

- Drizzle schema, generated migration, Neon client, deterministic importer, static/import verification.
- No page or component changes.

Required validation:

- `pnpm install --frozen-lockfile`
- `pnpm run db:generate`
- `pnpm run db:check`
- `pnpm run content:import:dry`
- verify the exact Production database identity and recorded backup/restore point without exposing connection strings
- prove that the selected Neon/Drizzle apply path atomically commits feed rows and `feed_import_runs`, with no partial state on failure
- apply only the generated foundation migration with `FEED_DB_TARGET=production` and a fresh operation-scoped `--confirm-production` flag
- apply the first deterministic Markdown import with a new operation-scoped `--confirm-production` flag
- `pnpm run content:verify` against the verified Production database
- `pnpm run check`
- `pnpm run build`

Rollback:

- keep `FEED_READ_SOURCE=content`;
- keep `FEED_WRITES_ENABLED=false` and `FEED_MCP_ENABLED=false`;
- revert the Task 1 commit if needed;
- preserve database rows, migration metadata, import reports, and Markdown for diagnosis; do not drop, truncate, delete, or run a destructive down-migration;
- use the recorded provider restore point only as a separately reviewed incident action. Database artifacts otherwise remain unused by pages.

### Task 2: domain model

Scope:

- introduce `Feed` domain types and Content adapter;
- remove `CollectionEntry<"feeds">` imports from UI and serialization boundaries;
- retain Content Collection as the only selected source.

Required evidence:

- before/after route list;
- serialized pagination fixture equality;
- unchanged sorting, labels, URLs, and visible copy;
- base validation and task tests.

Rollback:

- revert Task 2; database foundation remains unused.

### Task 3: runtime reads

Scope:

- official `@astrojs/vercel` adapter;
- database source;
- `FEED_READ_SOURCE` selector;
- on-demand home, category, detail, and pagination routes;
- Playwright coverage for both sources.

Validation sequence:

1. Keep deployed Production on `FEED_READ_SOURCE=content` and confirm route parity.
2. Run database-source page and pagination tests locally against the already imported Production data using read-only operations.
3. Compare representative pages and order with the Content source.
4. Do not switch the deployed Production read source before Task 6.

Rollback:

- set `FEED_READ_SOURCE=content` and redeploy;
- do not delete database rows or Markdown.

### Task 4: write API

Scope:

- FeedService, repository transactions, revisions, audit, idempotency, protected API.
- `FEED_WRITES_ENABLED=false` remains the default.
- no delete route.

Integration gate:

1. Keep writes disabled and prove all write routes reject without mutating Production.
2. Run validation, duplicate, optimistic-lock, audit, and archive integration tests only on an explicitly authorized non-Production database, including idempotent replay and key-conflict coverage for every mutation command.
3. If Production is the only available database, stop Task 4 and report the blocker. The Task 1 Production authorization cannot be reused or broadened for write-path integration tests.
4. Disable writes after verification unless a later review explicitly changes the non-Production test environment.

Rollback:

- set `FEED_WRITES_ENABLED=false`;
- rotate `FEED_WRITE_TOKEN` if exposure is suspected;
- retain audit and revision evidence;
- keep public reads on the last reviewed source.

### Task 5: Remote MCP Server

Scope starts with compatibility only.

Compatibility proof:

1. Add `mcp-handler` on its task branch.
2. Implement only `/api/mcp`, authentication, tool listing, and one read-only probe tool.
3. Verify Streamable HTTP locally.
4. Verify the same endpoint through the explicit Vercel Preview gate below.
5. Record request/response status, content type, MCP headers, and tool result.

#### Explicit Vercel Preview gate

The current `vercel.json` skips Git-triggered builds when `VERCEL_GIT_COMMIT_REF` is not `main`. Task 5 therefore must not treat the absence of an automatic feature-branch Preview as a compatibility result or wait for a Git-triggered deployment.

Task 5 must create an explicitly authorized Preview deployment from the clean task-branch commit under review. The deployment must not target, promote, or change Production. Before exercising `/api/mcp`, its evidence must include:

- the linked Vercel project and scope authorized for `idaibin/feeds-hub`; if the repository is not linked to an authorized project, stop and report the missing authorization;
- the branch name, a clean `git status`, and the exact commit from `git rev-parse HEAD`;
- the exact Preview deployment command, with no Production flag or promotion step;
- the resulting immutable Preview URL and deployment metadata proving it was built from the recorded commit; if the deployment mechanism cannot prove the commit, stop and report instead of testing an untraceable URL;
- the exact MCP request command and response evidence: HTTP status, content type, required Streamable HTTP headers, tool listing, and one read-only tool result.

This gate validates only the current Task 5 feature-branch commit. It does not change the repository's Git deployment policy and does not authorize a Production deployment.

The Task 5 Preview deployment must use `FEED_READ_SOURCE=content` and `FEED_WRITES_ENABLED=false`. It must not run migration/import commands, attach a writable Production database path, mutate Production, or treat the Task 1 Production confirmation as reusable authorization. The probe tool is read-only and uses the Content source.

If the Astro/Vercel adapter cannot host the handler without Next.js, Nuxt, Express sidecar, or a second deployment, stop the task and report failure. Do not implement the seven tools.

After compatibility passes, implement only the named tools from `feed-runtime-contracts.md`.

Rollback:

- set `FEED_MCP_ENABLED=false`;
- rotate `FEED_MCP_TOKEN`;
- leave the HTTP write API kill switch off if broader containment is required.

### Task 6: cutover

Task 6 coordinates the Production read cutover and any separately reviewed forward migrations required after the Task 1 foundation. It does not silently repeat or broaden the Task 1 import authorization.

Preconditions:

- Tasks 1-5 are reviewed and squash-integrated to latest `main`.
- Task 1 Production foundation migration/import completed under its recorded gates, and `content:verify` passed.
- Task 3 content-source/database-source parity tests passed using read-only access.
- Task 4 write integration tests passed on an explicitly authorized non-Production database; if none exists, Task 4 and therefore Task 6 remain blocked.
- Task 5 Vercel Preview code/MCP protocol compatibility passed without database mutation.
- write and MCP kill switches have been proven.
- rollback owner and change window are recorded.

Production sequence:

1. Capture current Production deployment, commit, environment, and public sample URLs.
2. Reconfirm the actual Production database identity and create/record a usable backup or restore point without exposing connection strings.
3. Run `content:import:dry` and `content:verify` read-only; stop on unexpected schema/data, conflicts, drift, or mismatch.
4. If reviewed post-Task-1 forward migrations are required, apply only those migrations with `FEED_DB_TARGET=production` and a fresh operation-scoped `--confirm-production` flag. Never reset, truncate, delete, or run a destructive down-migration.
5. Re-run `content:verify`; do not repeat the initial import unless a separately reviewed plan and explicit Production confirmation authorize the exact idempotent operation.
6. Deploy with `FEED_READ_SOURCE=content`, writes off, MCP off.
7. Switch Production read source to `database` and redeploy.
8. Verify home, categories, detail pages, pagination, ordering, and selected historical feeds.
9. Enable writes/MCP only as separately recorded cutover steps after their own review.

Rollback triggers:

- missing or reordered published feeds;
- page/API errors attributable to database mode;
- connection saturation or unacceptable latency;
- unauthorized or un-audited mutation;
- idempotency or version-conflict failure;
- MCP protocol/auth incompatibility.

Production rollback:

1. Disable MCP.
2. Disable writes.
3. Set `FEED_READ_SOURCE=content`.
4. Redeploy the last reviewed commit/configuration.
5. Verify public routes and pagination.
6. Preserve Neon rows, revisions, audit records, logs, and import reports for diagnosis.

Markdown and `ContentFeedSource` remain until a later explicitly approved removal task. Task 6 must not remove them.

### Task 7: aicraft MCP writer

Scope:

- update `idaibin/aicraft` only after Feeds Hub cutover is reviewed;
- replace GitHub Markdown writes with:

```text
discover -> verify -> dedupe -> save draft -> review -> publish -> page verification
```

- retain existing topic, source, verification, deduplication, and writing rules;
- do not add a direct database client to `aicraft`.

Rollback:

- disable the MCP writer workflow;
- do not fall back to unreviewed direct database writes;
- use the last explicitly approved content workflow until the Feeds Hub path is restored.

## Branch and Review Discipline

- One task, one named branch, one repository.
- Each branch starts from latest `main` only after the prior task is reviewed and squash-integrated.
- Each task updates `docs/progress/feed-runtime.md` with commands actually executed.
- Each task commits and pushes its own branch, creates no PR, and stops.
- No task pre-implements the next package to make its own validation easier.

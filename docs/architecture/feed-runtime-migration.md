# Feed Runtime Migration and Rollback

Status: Task 0 design with Task 1–6 implementation alignment. This document does not claim that any Production database command or cutover has executed; the operator-facing procedure is `docs/operations/feed-runtime-production-cutover.md`.

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
| `test` | An isolated local `feeds_hub_test` database has been used for Task 4/5 integration evidence. It is not a deployment or Production substitute. |
| `preview` | Not created or used. Task 5 performs local protocol compatibility only. |
| `production` | The foundation runner may execute only reviewed `0000`; the import command may perform only the deterministic Markdown import; the Task 6 forward runner may execute only reviewed `0001`. Each requires its own operation scope, confirmation and backup evidence. All other migration mutations are rejected. |

Rules:

- `db:generate` and `db:check` are local/static and do not connect to a database.
- `content:import:dry` parses and validates without writing.
- Operator commands verify both exact aliases before connecting: pooled `DATABASE_URL` uses fixed role `feeds_app_runtime`, while direct `DATABASE_URL_UNPOOLED` uses the distinct owner recorded in `FEED_DB_EXPECTED_MIGRATION_ROLE`. They must resolve to the same Neon endpoint/database, and the reviewed fingerprint covers both roles. Vercel build/runtime environments contain only `DATABASE_URL`; code fails closed if `DATABASE_URL_UNPOOLED` is present there. Neither URL is derived by string rewriting.
- Runtime privileges are changed only by the fixed `db:grant:runtime-read` and `db:grant:runtime-write` runners. They accept no SQL, role, table, file, or shell input. Both remove schema/database creation, temporary-object creation, and existing public-table/sequence grants, then fail unless the runtime role also has no elevated attributes, inherited roles, or owned objects and the complete effective privilege matrix is exact. Phase B grants only `SELECT` on `feeds`; Phase D grants `SELECT/INSERT/UPDATE` on `feeds` and `SELECT/INSERT` on `feed_revisions`, `feed_audit_events`, and `feed_idempotency_keys`. No runtime phase grants DELETE, TRUNCATE, DDL, REFERENCES, TRIGGER, sequence, or `feed_import_runs` access.
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
4. Record local request/response status, content type, MCP headers, completion time, and tool result.
5. If the local gate passes, implement and verify only the named tools from `feed-runtime-contracts.md`.

#### Deferred Production canary

Task 5 does not create a Vercel Preview or Production deployment. Local compatibility evidence is necessary but does not claim that Vercel Production has been verified.

After the reviewed Task 5 commit is squash-integrated to `main`, Task 6 may perform a separately authorized, phased Production canary. Before exercising `/api/mcp`, its evidence must include:

- the linked Vercel project and scope authorized for `idaibin/feeds-hub`; if the repository is not linked to an authorized project, stop and report the missing authorization;
- `main`, a clean `git status`, and exact equality between the local commit, `origin/main`, and the deployment source commit;
- the exact Production deployment or promotion command and resulting deployment metadata;
- the exact MCP request command and response evidence: HTTP status, content type, required Streamable HTTP headers, tool listing, and one read-only tool result.

The first MCP canary runs only after the database-read phase is independently approved. It uses `FEED_READ_SOURCE=database`, `FEED_WRITES_ENABLED=false`, and exercises initialization, `tools/list`, `list_feeds`, `get_feed`, and `find_feed_duplicates`. Because `tools/list` advertises the narrow mutation tools too, the canary must also prove that each mutation attempt returns `WRITES_DISABLED` and creates no data. It must not run migration/import commands, mutate Production, or treat a prior Production confirmation as reusable authorization.

After the read-only canary is reviewed, Task 6 may decide whether to enable mutation tools in a later phase. That decision remains subject to the write kill switch, bearer authentication, validation, duplicate checks, idempotency, optimistic locking, audit requirements, and a separately recorded Production change authorization. Local Task 4/5 test authorization does not authorize Production writes.

If Astro cannot host the local handler without Next.js, Nuxt, Express sidecar, or a second runtime, stop Task 5 and do not implement the seven tools. If the later Vercel Production canary cannot preserve the already-reviewed Streamable HTTP contract, stop Task 6, keep MCP disabled, and report the deployment incompatibility instead of adding another framework.

Rollback:

- set `FEED_MCP_ENABLED=false`;
- rotate `FEED_MCP_TOKEN`;
- leave the HTTP write API kill switch off if broader containment is required.

### Task 6: cutover

Task 6 coordinates the Production read cutover and any separately reviewed forward migrations required after the Task 1 foundation. It does not silently repeat or broaden the Task 1 import authorization.

The executable checklist, evidence fields, exact commands, stop gates, phase verification, and rollback matrix live in `docs/operations/feed-runtime-production-cutover.md`. That runbook is authoritative for execution.

Preconditions:

- Tasks 1-5 are reviewed on the exact commit intended for `main`. The current user-authorized combined-branch integration may use one reviewed squash; this is an explicit exception to the earlier one-branch-per-task delivery plan, not an exception to Production gates.
- If Task 1 Production foundation migration/import has not run, Task 6 performs those exact guarded steps while the live site remains on Content. It never assumes an empty schema or successful import.
- Task 3 content-source/database-source parity tests passed using read-only access.
- Task 4 write integration tests passed on an explicitly authorized non-Production database; if none exists, Task 4 and therefore Task 6 remain blocked.
- Task 5 local Astro/MCP protocol compatibility passed without a deployment or database mutation.
- the Task 6 read-only Production canary plan keeps Content reads and writes disabled until its evidence is reviewed.
- write and MCP kill switches have been proven.
- rollback owner and change window are recorded.

Production sequence summary:

1. Capture current Production deployment, commit, environment, and public sample URLs.
2. Confirm the safe Content/writes-off/MCP-off Production environment, then push the reviewed target `main`; its automatic Vercel deployment is Phase A. Record `origin/main`, deployment ID, and deployment source commit, and stop unless all identify the reviewed target.
3. Reconfirm the actual Production database identity and create/record a usable backup or restore point without exposing connection strings.
4. While the healthy Phase A deployment remains on Content, apply only required fixed runners: foundation `0000` on an empty schema, deterministic Markdown import, then runtime forward `0001`. Each mutation has fresh backup evidence and a distinct operation-scoped confirmation.
5. Run `content:verify`; stop on unexpected schema/data, conflicts, drift, or mismatch. Do not repeat the initial import without separate review and confirmation.
6. Phase B: switch only reads to `database`; verify pages, pagination, ordering, history, latency and errors.
7. Phase C: enable MCP while writes remain off; verify read tools and verify every mutation tool returns `WRITES_DISABLED` with no writes.
8. Phase D: only after separate Production write authorization, enable writes and run the minimal audited/idempotent canary.

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
4. Redeploy the known-good deployment ID and configuration recorded before the change.
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

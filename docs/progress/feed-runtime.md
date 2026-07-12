# Feed Runtime Progress

## 当前任务

- 任务：Task 6 — Production-only 部署配置、精确 forward migration、分阶段 cutover 与回滚材料。
- 状态：Task 1–6、最终 release review 和 Phase A Production Content baseline 已完成；功能分支已推送，已单次 squash 到远端 `main` 并完成 Production 页面/kill-switch canary。尚未连接或修改 Production 数据库。
- 本次整合例外：根据用户最新明确授权，Task 1–6 在当前组合分支完成 review 后可单次 squash 到 `main`。这不改变 Production 逐阶段确认、无 Preview、无 PR 和禁止破坏性数据库操作的边界。

## 分支

`feat/feed-database-foundation`

## 起始 commit

`0b338c231333fd267f7b0a5c3b1d5dd4e3b92341` (`origin/main`，Task 0 架构文档)

当前组合分支在 Task 6 工作开始前包含：

- `fa22fe8` — Task 1 database foundation
- `82dbf5d` — Task 2 Feed domain model 解耦
- `3bc5ed1` — Task 3 runtime read source switching
- `1dcd704` — Task 4 protected write API
- `0f74651` — Task 5 Remote MCP Server
- `1c2245c` — Task 6 Production cutover controls

上述 Task 1–6 提交均已存在；当前未提交工作树仅包含最终 release review 的定向修复，未改写这些提交。

## 修改范围

Task 1–5 已实现 Drizzle/Neon foundation、Markdown import/verify、稳定 Feed domain、Content/Database 双读取源、Vercel Astro adapter、动态首页/分类/详情/分页、受保护写入 API、审计/幂等/乐观锁，以及 Astro 内 `/api/mcp`。

Task 6 提交修改：

- `scripts/db-migrate.ts`
- `scripts/db-migrate-forward.ts`
- `scripts/lib/production-guard.ts`
- `scripts/lib/reviewed-migrations.ts`
- `tests/migration-runners.test.ts`
- `tests/deployment-config.test.ts`
- `tests/production-guard.test.ts`
- `package.json`
- `vercel.json`
- `README.md`
- `docs/operations/feed-runtime-production-cutover.md`
- `docs/architecture/feed-runtime-migration.md`
- `docs/architecture/feed-runtime-contracts.md`
- `docs/progress/feed-runtime.md`

未修改 `src/content/**`、前台 UI 文案、页面结构、Feed API/MCP 工具能力或 Content/Database 读取实现；未增加 SQL、shell、delete、reset、truncate、down migration 或物理删除入口。

最终 release review 的定向修复仅涉及：数据库 authorized cursor 无损保留 PostgreSQL 微秒精度及真实数据库回归测试、分页 JSON 对超大页码返回 404、Phase A 自动部署早于数据库准备的 runbook 顺序，以及相应测试/状态文档。

## 已完成项

- Foundation runner 在组合 journal 中固定选择并校验 `idx=0` / `0000_windy_trish_tilby`、journal `when=1783660331886` 和不可变 SHA-256；空 schema 下只执行 `0000`，不会因存在 `0001` 而拒绝或顺带执行它。
- Foundation runner 保留 exact Production identity、pooled/direct 同库、备份证据、Content 读取、writes/MCP 关闭、clean worktree、Serializable transaction 和 post-journal verification。
- 新增 `db:migrate:forward`，只允许 `runtime-forward-migration` operation，且固定执行 `idx=1` / `0001_swift_ben_parker`、journal `when=1783672823432` 和不可变 SHA-256。
- Forward runner 执行前要求数据库存在确切 foundation schema 且 migration journal 只有 reviewed `0000`；执行后验证 `pg_trgm`、三张历史表、四个 delete/history trigger，以及 reviewed `0000 → 0001` journal。
- Forward runner 不接受 migration 名称、SQL、文件、shell、down、delete 或 reset 输入；migration DDL 与 journal 仍在单一 Serializable transaction 内。
- Production mutation guard 新增独立 `runtime-forward-migration` confirmation scope，并继续强制 24 小时内备份/恢复证据、Content 读取、writes false、MCP false。
- Vercel 配置改为 `npm ci` 和 `npm run build`；移除可能覆盖 `@astrojs/vercel` Build Output 的 `outputDirectory`。使用官方 `git.deploymentEnabled` 的 `"**": false` + `"main": true` 覆盖含 `/` 的非 `main` 分支并阻止 Git push 创建自动 deployment；不再把 Ignored Build Step 描述为不创建 deployment。
- README 保留两张架构图，更新为当前代码能力，并明确 Production 真实状态只能来自执行证据。
- 新增 Production-only runbook，固定 `content → database → read-only MCP → writes`，每阶段有 stop gate、验证与回滚；明确不用 Preview，且执行时必须填写 change owner、rollback owner、change window 和 known-good deployment。
- 明确保留 Markdown、`src/content/**`、`ContentFeedSource` 和 Neon 历史数据作为回滚/诊断来源。

## 未完成项

- 最终 release review 已完成且无 blocker；定向修复已提交为 `ab04ad7` 并推送功能分支。
- 功能实现已 squash 为 `cc2795a6b374a1af11e7cea521c384a4229e6dee` 并推送远端 `main`；本地分叉 `main` 未切换、未改写。
- Vercel Phase A Production deployment 已完成；未创建新的 Vercel Preview。
- 父任务已实际执行 `vercel pull --environment=production`；命令曾将 Production 环境写入 gitignored 的 `.vercel/.env.production.local`。检查仅输出变量名和值长度，未展示值；Production-only 数据库凭据仍是不可读占位符，未用于数据库连接或 mutation。短期 OIDC token 所在本地文件随后已删除。
- 最终切换前只读核对发现 Vercel Marketplace 向 Production/Preview 注入了 owner/direct 数据库凭据。为满足最小权限与 Production-only 边界，已从 Vercel 项目环境删除这些数据库/Neon 集成变量；未删除或修改 Neon 数据库。随后只在 Production 显式设置 `FEED_READ_SOURCE=content`、`FEED_WRITES_ENABLED=false`、`FEED_MCP_ENABLED=false`，Preview 当前无环境变量。
- 未连接 Production Neon；未执行 foundation migration、Markdown import、runtime forward migration 或 Production `content:verify`。
- 未执行 Production 页面 database canary、read-only MCP canary 或 write canary。
- `docs/operations/feed-runtime-production-cutover.md` 的 owner、change window、known-good deployment、数据库 fingerprint、备份和阶段 deployment ID 必须由执行者在真实变更时填写，当前不可预填。

## 执行过的验证命令

父任务在当前 Task 4/5 代码上已实际执行：

- `TEST_DATABASE_URL='postgresql://feeds_hub_test:feeds_hub_test@127.0.0.1:55432/feeds_hub_test' FEED_DB_TARGET=test CI=true volta run npm run test:integration`
- `CI=true volta run npm run test:mcp`
- `CI=true volta run npm run test`
- `CI=true volta run npm run check`
- `CI=true volta run npm run db:generate`
- `CI=true volta run npm run db:check`
- `CI=true volta run npm run build`
- `vercel pull --environment=production`（父任务；下载到 gitignored 本地文件，随后安全删除）
- Task 3：`npm run test:e2e`（Content source；完整命令由父任务执行记录保存）

Task 6 本轮执行：

- `npm run test`（首次）
- `CI=true npm ci`
- `CI=true npm run test`（依赖恢复后复跑）
- `CI=true npm run test:mcp`
- `CI=true npm run content:import:dry`
- `CI=true npm run db:generate`
- `CI=true npm run db:check`
- `CI=true npm run check`（首次）
- `CI=true npm run test` 与 `CI=true npm run check`（类型修复后复跑）
- `CI=true npm run build`
- `CI=true npm run test && git diff --check`（最终复跑）
- Task 6 review 修复后：`CI=true npm run test`、`CI=true npm run check`、`CI=true npm run build`、`git diff --check`
- 最终 release review 定向修复：`npm run test`、`npm run check`、`TEST_DATABASE_URL='postgresql://feeds_hub_test:feeds_hub_test@127.0.0.1:55432/feeds_hub_test' FEED_DB_TARGET=test CI=true npm run test:integration`、`CI=true npm run test`、`CI=true npm run check`、`CI=true npm run build`、`git diff --check`
- 主代理最终串行验证：`CI=true npm ci`、`CI=true npm run test`、`CI=true npm run test:mcp`、`TEST_DATABASE_URL='postgresql://feeds_hub_test:feeds_hub_test@127.0.0.1:55432/feeds_hub_test' FEED_DB_TARGET=test CI=true npm run test:integration`、`CI=true npm run test:e2e`、`CI=true npm run content:import:dry`、`CI=true npm run db:generate`、`CI=true npm run db:check`、`CI=true npm run check`、`CI=true npm run build`、`npm audit --prod --registry=https://registry.npmjs.org/`、`git diff --check`
- Vercel 环境核对：`vercel env ls production`、`vercel env ls preview`；删除 Marketplace owner/direct 数据库变量后再次核对，并仅向 Production 写入三个安全开关。

## 命令真实结果

- 父任务 `test:integration`：通过；13/13，使用明确隔离的本地 `feeds_hub_test`，覆盖 Feed API/MCP 七工具和 database cursor。Task 6 未重置或复跑该共享数据库。
- 父任务 `test:mcp`：通过；8/8。
- 父任务当时的 `test`：通过；45/45。Task 6 加入迁移与部署配置测试后的最新结果见下方 51/51。
- 父任务 `check`：通过；69 files，0 errors、0 warnings、0 hints。
- 父任务 `db:generate`：通过；`No schema changes, nothing to migrate`。
- 父任务 `db:check`：通过；migration hash 前缀 `38a653...`。
- 父任务 `build`：通过；生成 Vercel server bundle。
- 父任务 `vercel pull --environment=production`：通过；Production 环境曾下载到 gitignored 本地文件。只输出了变量名和值长度，未展示值；数据库凭据为不可读占位符，未用于连接或 mutation。包含短期 OIDC token 的本地文件随后已删除；未修改远端环境变量。
- Task 3 Content-source e2e：3 passed、1 database case skipped；skip 原因是没有可安全使用的 Production database URL。Database parity 尚未执行。
- 首次 `npm run test`：未进入测试；旧包管理器因非 TTY 环境需要重建 `node_modules` 而中止。未连接数据库、未运行测试用例。
- `CI=true npm ci`：通过；lockfile 无变化，安装 497 packages。
- `CI=true npm run test`：通过；50 tests、50 passed、0 failed。包含新增 foundation/forward 固定迁移选择、不可变 hash、destructive SQL 拒绝、journal 状态和 Production operation scope 测试。
- `CI=true npm run test:mcp`：通过；8 tests、8 passed、0 failed。
- `CI=true npm run content:import:dry`：通过；离线解析 234 feeds，234 insert、0 update、0 unchanged、0 conflict、0 invalid；29 组重复 `sourceUrl` 仅作信息报告，未比较数据库。
- `CI=true npm run db:generate`：通过；识别 5 tables，`No schema changes, nothing to migrate`，未产生 drift 文件。
- `CI=true npm run db:check`：通过；Drizzle journal/snapshot 一致，两个 migration 通过破坏性 SQL 检查，combined migration hash `38a653b70f50af03740f0d5edbc93f3fa5c4d3b2717148535a9976ece84b3b8c`。
- 首次 `CI=true npm run check`：失败；`reviewed-migrations.ts` 的内部 spec 参数错误保留 `idx: 0` 字面类型，导致 reviewed `idx: 1` 在类型检查中被拒绝。未运行数据库或部署。
- 类型修复后的 `CI=true npm run check`：通过；72 files，0 errors、0 warnings、0 hints。
- `CI=true npm run build`：通过；Astro `output: static` / `mode: server`，`@astrojs/vercel` server bundle 与 `.vercel/output/static` 生成成功。
- 最终 `CI=true npm run test`：通过；50/50。`git diff --check`：通过。
- Task 6 review 修复后 `CI=true npm run test`：通过；51/51，新增 Vercel `git.deploymentEnabled` 配置回归，并覆盖两个 journal `when` 篡改拒绝。
- Task 6 review 修复后 `CI=true npm run check`：通过；73 files，0 errors、0 warnings、0 hints。
- Task 6 review 修复后 `CI=true npm run build`：通过；Vercel server bundle 与 static output 成功生成。
- 最终 release review 首轮 `npm run test`：通过；51/51。随后同一命令链中的 `npm run check` 首次失败；测试 mock 把 `updatedAtMicros` 错放进 `Feed` 对象，1 个 TypeScript error，修正到数据库查询 row 后复跑通过。
- 最终 release review 的真实 PostgreSQL `test:integration`：通过；13/13，连接明确隔离的本地 `feeds_hub_test`，新增用例固定同一毫秒内 `.123456` 与 `.123400` 两个 `updated_at`，验证 database cursor 两页均返回且不漏记录。
- 最终复跑 `CI=true npm run test`：通过；51/51。
- 最终复跑 `CI=true npm run check`：通过；73 files，0 errors、0 warnings、0 hints。
- 最终复跑 `CI=true npm run build`：通过；Vercel server bundle 与 static output 成功生成。`git diff --check`：通过。
- 主代理最终冻结安装首次未加 `CI=true`，旧包管理器因非 TTY 环境拒绝切换 store；加 `CI=true` 后通过，lockfile 无变化。
- 主代理首次并行执行 `test` / `test:mcp` / `check` 时，两个 Astro 进程同时重建 `.astro`，`test` 的独立 HTTP 用例因临时文件 rename 竞态失败；同批 `test:mcp` 8/8、`check` 77 files 0 diagnostics、`db:generate` / `db:check` / `content:import:dry` 均通过。改为串行后 `CI=true npm run test` 通过，55/55。
- 主代理最终 `test:integration`：通过，16/16，使用明确隔离的本地 PostgreSQL；包含 SQL 有界分页、stock/sports parity、微秒 cursor、Phase B/Phase D 权限矩阵与完整 API/MCP 生命周期。
- 主代理最终 `test:e2e`：3 passed、1 database parity skipped；Content 页面、无效路由和超大页码 404 通过，database parity 仍因尚无最小权限 Production URL 跳过。
- 主代理最终 `content:import:dry`：通过；234 insert、0 update/unchanged/conflict/invalid，29 组重复 `sourceUrl` 仅报告。
- 主代理最终 `db:generate` / `db:check`：通过；无 schema drift，migration hash `38a653b70f50af03740f0d5edbc93f3fa5c4d3b2717148535a9976ece84b3b8c`。
- 主代理最终 `check`：通过；77 files、0 diagnostics。`build`：通过；生成 Vercel server bundle。`git diff --check`：通过。
- `npm audit --prod`：非零，报告 `@astrojs/vercel -> @vercel/routing-utils -> path-to-regexp@6.1.0` 的 1 个 high advisory。已复核当前生成路由不包含 advisory 要求的同 segment 多参数模式；上游当前依赖树仍未完全移除 6.1.0，作为供应链残余风险记录。
- 最终独立 release review：无 blocker、无 Medium；定向 guard/migration/feed-source 测试 17/17 通过。

## 未执行验证及原因

- Task 6 原实现轮未复跑 `npm run test:integration`；最终 release review 已在同一个明确隔离的本地测试数据库上复跑并通过 13/13，结果见上方。
- `npm run content:import:dry -- --database`、`npm run content:verify`：需要经过审查的数据库身份；本轮不连接 Production。
- `npm run db:migrate -- --apply ...`、`npm run db:migrate:forward -- --apply ...`、`npm run content:import -- --apply ...`、两个 grant runner：用户已授权 Production 执行，但仍缺少可登录的 Neon operator 会话、独立 `feeds_app_runtime` 凭据、数据库 fingerprint、可恢复备份和 fresh operation confirmation；在这些 fail-closed 前置条件完成前不执行。
- Vercel Phase A Production deploy/canary：已执行并通过；Phase B/C/D 仍依赖上述数据库前置条件。
- Vercel Preview：按任务边界明确禁止，不执行。

## 已知风险

- 迁移 runner 的 Production 网络、Neon 角色权限、`CREATE EXTENSION pg_trgm` 权限和 Vercel Production runtime 尚未在本轮验证。
- Production 数据库当前实际 journal/schema/import 状态未读取；runbook 必须先核对，不能假设为空或已完成 foundation。
- `tools/list` 会展示七个窄 MCP tools；read-only MCP 阶段依靠 `FEED_WRITES_ENABLED=false` 拒绝四个 mutation tools，canary 必须验证拒绝行为和零写入证据。
- Vercel link metadata 与 Production environment key metadata 已读取，但不等于敏感值、目标部署或 pre-change known-good deployment 已核验；真实 project scope、target commit、deployment source commit 和 pre-change known-good ID/URL/commit 必须在执行时重新确认。
- Forward migration 只允许当前 reviewed `0001`。未来 schema 变化必须新增独立、重新 review 的 runner/operation，不得把该入口泛化为任意 migration。
- 当前组合分支相对 `origin/main` 包含多个任务提交；最终 squash 前仍需完整 diff/security/validation review。
- 依赖审计仍有 1 个当前路由不可达的 `path-to-regexp` high advisory；需持续跟踪 `@vercel/routing-utils` 上游修复，不能把当前不可达判断当作永久豁免。

## 下一任务依赖

- Task 6 全套非 Production 验证与只读 review 已完成，无 blocker。
- 已按用户明确授权将当前组合分支单次 squash 到隔离的最新 `origin/main` 工作树并 push `main`；未创建 PR，未触碰本地分叉 `main`。
- Production 执行前填写 runbook：确认 target `main = origin/main = target deployment source commit`；另行记录内部一致但可来自旧 commit 的 pre-change known-good deployment ID/URL/commit，以及 owner/window、Neon identity/fingerprint 和可恢复备份。
- 严格逐阶段执行并 review：Content baseline → Database reads → read-only MCP → separately authorized writes。
- Task 7 `aicraft` MCP writer 只有在 Task 6 Production cutover 有真实证据并完成 review 后才能开始。

## Phase A Production 实际执行记录

- 功能分支：`feat/feed-database-foundation`；结束 commit `ab04ad77784968f7aa5715d6c22557d4f748fadc`，已 push。
- 集成方式：从最新 `origin/main` `0b338c231333fd267f7b0a5c3b1d5dd4e3b92341` 创建隔离 detached worktree，`git merge --squash feat/feed-database-foundation`，生成 `main` commit `cc2795a6b374a1af11e7cea521c384a4229e6dee`；squash tree 与功能分支 tree 完全一致。
- 远端核对：`git ls-remote origin refs/heads/main` 返回 `cc2795a6b374a1af11e7cea521c384a4229e6dee`。
- Vercel 环境：删除 Marketplace 注入的 Production/Preview owner/direct 数据库变量；Production 只保留 `FEED_READ_SOURCE=content`、`FEED_WRITES_ENABLED=false`、`FEED_MCP_ENABLED=false`，Preview 无环境变量。未删除 Neon 数据库。
- Pre-change known-good：deployment `dpl_4v7RnhJs14HiFWmi9PVSRuErmN5b`，URL `https://feeds-pp3vtl4cb-abin-projects.vercel.app`，source commit `0b338c231333fd267f7b0a5c3b1d5dd4e3b92341`。
- Phase A deployment：`dpl_5TxGKSJfP346KKgAGRcNCEgw3pio`，URL `https://feeds-las8k9qcy-abin-projects.vercel.app`，Production `READY`，source commit filter `cc2795a6b374a1af11e7cea521c384a4229e6dee`；alias `https://feeds.idaibin.dev` 已指向该 deployment。
- Live canary：`/`、`/category/ai/`、代表性详情页、`/feed-pages/all/2.json` 均为 200；首页含 `Feeds Hub`；`POST /api/feeds/drafts` 为 503 / `WRITES_DISABLED`；`POST /api/mcp` 为 404 / `MCP_DISABLED`。
- 功能分支 push 后按 commit/ref 查询只看到 6 小时前的 canceled Preview，没有本轮新 Preview deployment。
- 未执行：Production database migration/import/verify/grants、database-source page parity、MCP read-only canary、write canary。原因是仍缺少可登录 Neon operator 会话、独立 `feeds_app_runtime` URL、fingerprint、恢复点和 fresh operation confirmation；保持 fail closed。

## Production 最小权限角色拆分复审修复

- Public database list 不再读取全部 published rows：list/category、stock close filter、future sports 排序、稳定 tie-break 和分页均下推 PostgreSQL，`page <= 1000`、`pageSize <= 100`，单次只取 `pageSize + 1` 个投影行且排除 `body`；详情查询仍读取完整正文。
- 真实本地 PostgreSQL regression 覆盖 past/future sports、stock include/exclude、global 两页 parity，以及完全相同 `updated_at` 微秒值时按 UUID 升序跨页无重复/遗漏。
- Production pooled `DATABASE_URL` 固定使用 `feeds_app_runtime`；direct `DATABASE_URL_UNPOOLED` 使用 `FEED_DB_EXPECTED_MIGRATION_ROLE` 锁定的独立 migration owner。两者必须同 Neon endpoint/database、不同 role，数据库 fingerprint 同时覆盖两角色。
- Vercel config load、database read client 与默认 `NeonFeedRepository` 写路径均执行 runtime guard：只允许 pooled Neon `feeds_app_runtime` 凭据，并扫描/拒绝任何 provider-prefixed direct/owner Neon URL；错误不输出连接串。`DATABASE_URL_UNPOOLED` 与 migration owner 变量只属于受控 operator 环境。
- 新增固定 `db:grant:runtime-read` / `db:grant:runtime-write` runners。它们不接受 SQL、role、table、file 或 shell 输入；撤销 public/runtime table、sequence、schema CREATE、database CREATE/TEMP 权限并验证 role attributes、membership、ownership 和完整 effective privilege matrix。
- Phase B 只授予 `feeds SELECT`。Phase D 只增加 `feeds SELECT/INSERT/UPDATE` 和三张 revision/audit/idempotency 表的 `SELECT/INSERT`；不授予 `feed_import_runs`、sequence、DDL、DELETE、TRUNCATE、REFERENCES 或 TRIGGER。
- 修改/新增范围：`astro.config.mjs`、`package.json`、`src/db/client.ts`、`src/db/neon-feed-repository.ts`、`src/db/runtime-environment.ts`、`scripts/lib/production-guard.ts`、`scripts/lib/runtime-grants.ts`、`scripts/db-grant-runtime-read.ts`、`scripts/db-grant-runtime-write.ts`、`tests/production-guard.test.ts`、`tests/migration-runners.test.ts`、三份 runtime architecture/migration/operations 文档与本进度文档。
- 实际验证：最终 `CI=true volta run npm run test` 通过，55/55；定向 `production-guard`/`migration-runners` 测试通过，11/11；`CI=true volta run npm run check` 通过，77 files、0 diagnostics；`CI=true volta run npm run build` 通过，生成 Vercel server bundle；`git diff --check` 通过。provider alias guard 收紧后的两次中间全量测试曾仅因测试期望错误文案的正则不匹配而各为 54/55，修正测试后已完成上述最终全量复跑。
- 合并 SQL pagination 与权限真实数据库用例后：`TEST_DATABASE_URL='postgresql://feeds_hub_test:feeds_hub_test@127.0.0.1:55432/feeds_hub_test' FEED_DB_TARGET=test CI=true volta run npm run test:integration` 通过，16/16；`CI=true volta run npm run check` 通过，77 files、0 diagnostics。
- 负向 build guard：以假 credential 设置 `VERCEL=1` 与 `DATABASE_URL_UNPOOLED` 后执行 build，Astro config 在加载阶段按预期非零退出并只报告 `DATABASE_URL_UNPOOLED`/通用 guard 错误，未连接数据库。
- 未执行两个 grant runners、migration/import/verify 或任何 Vercel deploy：这些命令需要真实 Production identity、owner/change window、备份证据和 fresh operation confirmation；本轮未访问 Production。

## 2026-07-11 Vercel bootstrap 与 MCP Production 切换

- 在 `feat/feed-vercel-bootstrap` 增加 fail-closed Vercel Production `prebuild`：固定 source commit、24 小时内备份证据、Content reads、writes/MCP disabled、同库同 owner pooled/direct 身份和固定 migration/grant runners。
- Vercel Production bootstrap 已完成 foundation/forward schema、固定 `feeds_app_runtime` 登录角色和 write grants；随后验证 schema、权限与 runtime identity。
- bootstrap 完成后，Production 只保留低权限 `FEED_RUNTIME_DATABASE_URL`；Marketplace owner/direct aliases、`DATABASE_URL`、`DATABASE_URL_UNPOOLED` 与全部 `FEED_DB_BOOTSTRAP_*` 已移除。
- Production 已切换 `FEED_READ_SOURCE=database`、`FEED_WRITES_ENABLED=true`、`FEED_MCP_ENABLED=true`，OAuth protected-resource metadata 公布 `feeds:read`、`feeds:write`、`feeds:publish`、`feeds:archive`。
- Live canary：站点首页 200；bootstrap 状态文件 404；无 token 的规范 MCP initialize 返回 401，并通过 `WWW-Authenticate` 指向 protected-resource metadata 和四个 scopes。
- 未执行携带最终 ChatGPT access token 的 Production mutation canary；ChatGPT Pro 实际只展示三个 read/fetch tools。服务端七工具与数据库写入已就绪，但该客户端套餐不能验证或调用 write/modify tools。

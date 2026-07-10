# Feed Runtime Progress

## 当前任务

- 任务：Task 0 — 运行时信息流架构、接口、迁移与回滚设计。
- 状态：Task 0 Production-only 决策与 review 修复完成，等待分支复审。

## 分支

`content/feed-runtime-architecture`

## 起始 commit

`f77e5b8e845ded0709bc7ccd95e76f810a3573c7` (`origin/main`)

本任务明确从远端 `origin/main` 创建，未包含工作区本地 `main` 上已有但未推送的其它提交。

## 修改范围

- `docs/architecture/feed-runtime.md`
- `docs/architecture/feed-runtime-contracts.md`
- `docs/architecture/feed-runtime-migration.md`
- `docs/architecture/feed-runtime-architecture.png`
- `docs/architecture/feed-runtime-update-flow.png`
- `docs/progress/feed-runtime.md`
- `README.md`

未修改运行时代码、依赖、配置、内容文案或 UI 规则；README 仅增加目标架构说明和图片入口。

## 已完成项

- 记录当前 Astro Content Collection 静态读取基线。
- 定义 Content/Database 双数据源边界和 `FEED_READ_SOURCE` 开关。
- 定义 Feed 领域模型、读取接口、Repository、FeedService 和排序/URL/分页兼容契约。
- 定义 Neon + Drizzle 的任务边界、Schema 所有权和数据库命令安全门槛。
- 定义 draft/published/archived 生命周期、幂等、乐观锁、revision 和审计契约。
- 定义受保护 HTTP 写入 API；未设计删除接口。
- 定义 7 个允许的 MCP Tool 及禁止 SQL/shell/物理删除的边界。
- 将 Astro + `@astrojs/vercel` + `mcp-handler` + Streamable HTTP 兼容性设为 Task 5 前置阻断门槛。
- 定义 Tasks 1-7 的依赖、验证、Preview/Production 切换和回滚顺序。
- 将运行时架构图和后续更新流程图加入 README，并标注尚未上线及 Markdown 回滚边界。
- 根据独立 review 统一四类写操作的幂等契约：save draft、publish、published update 和 archive 均要求幂等键，并同步 HTTP、MCP、审计与集成测试要求。
- 针对 `vercel.json` 跳过非 `main` Git 构建的现状，定义 Task 5 显式、非 Production、可追溯到功能分支 commit 的 Preview 验证门禁。
- 记录用户明确确认的 Production-only 数据库决策：不创建 Preview 数据库，Task 1 仅可在严格门禁下执行 Production foundation migration 和首次幂等 Markdown import。
- 补齐 Production 导入原子性、数据库双 URL 同库/角色校验、可复核备份证据和非破坏回滚要求；Task 4 不继承 Task 1 的 Production 授权。
- 记录 Task 0 内容快照：234 feeds、233 reviewed、1 unreviewed、eventKey 无重复、sourceUrl 存在预期重复。

## 未完成项

- Task 1：Drizzle Schema、migration、Neon 客户端、幂等 Markdown 导入和验证。
- Task 2：Feed 领域模型落地及 UI 与 `CollectionEntry<"feeds">` 解耦。
- Task 3：Vercel runtime read、数据源开关和 Playwright 页面测试。
- Task 4：FeedService、Repository、写入 API、幂等、乐观锁、revision 和审计。
- Task 5：MCP 兼容性验证及 Remote MCP Server。
- Task 6：Production 读取切换、核对、另行确认的 forward migration 和回滚材料。
- Task 7：`aicraft` MCP writer 集成。

## 执行过的验证命令

- `CI=true volta run pnpm install --frozen-lockfile --store-dir /private/tmp/pnpm-store`
- `CI=true volta run pnpm run check`
- `CI=true volta run pnpm run build`
- `file docs/architecture/feed-runtime-architecture.png docs/architecture/feed-runtime-update-flow.png`
- `git diff --check`

## 命令真实结果

- `pnpm install --frozen-lockfile`：通过；lockfile 已是最新，依赖无需更新，pnpm `11.7.0`。
- `pnpm run check`：通过；检查 14 个 Astro/TypeScript 文件，0 errors、0 warnings、0 hints。
- `pnpm run build`：通过；保持 `output: "static"`，成功生成 248 个页面。
- 图片检查：通过；两张图片均为 1672 × 941、8-bit RGB、非隔行 PNG。
- `git diff --check`：通过；无空白或补丁格式错误。

## 未执行验证及原因

- `pnpm run test`：当前 `package.json` 没有 `test` script；Task 0 不新增测试运行时。
- `pnpm run test:integration`：当前没有该 script；数据库/写入集成尚未实现。
- `pnpm run db:generate`：当前没有该 script；属于 Task 1。
- `pnpm run db:check`：当前没有该 script；属于 Task 1。
- `pnpm run content:import:dry`：当前没有该 script；属于 Task 1。
- `pnpm run content:verify`：当前没有该 script；属于 Task 1。
- `pnpm run test:e2e`：当前没有该 script；属于 Task 3。
- 真实 Neon migration/import：Task 0 不连接数据库；Production-only 授权仅供 Task 1 在本分支复审并 squash 合入最新 `main` 后使用。
- Vercel Preview 验证：Task 0 不修改运行时或部署配置；Task 5 必须使用已授权、可证明 commit 的显式非 Production Preview，缺少授权或 commit 证据时停止。
- MCP Inspector/Streamable HTTP：属于 Task 5，当前不得提前安装或声明兼容。

## 已知风险

- `mcp-handler` 官方公开支持面当前以 Next.js/Nuxt 为主，Astro 兼容性未验证；Task 5 必须先做阻断性 spike，失败即停止。
- 当前 `vercel.json` 跳过非 `main` Git 自动构建；Task 5 依赖已授权的显式 Preview 部署能力，无法获得授权项目链接或 commit 证明时必须停止。
- Neon/Drizzle 的 Production 导入原子批处理路径尚未用本仓库 Schema 证明；Task 1 不能在此门槛通过前执行真实 import。
- Vercel 集成生成的 `STORAGE_*` 变量尚未核对；Task 1 必须建立并验证 `DATABASE_URL` / `DATABASE_URL_UNPOOLED` 同库且角色正确的服务端别名，禁止输出连接串或用字符串改写推导直连 URL。
- 当前没有 test/Preview 数据库；Task 4 若仍只有 Production 数据库，必须停止写入集成测试并等待另行授权的非 Production 数据库。
- 现有 `sourceUrl` 有预期重复，后续去重不能把 URL 设为唯一键。
- 当前 `ai`/`dev` list id 与 topic group 的解析顺序属于既有输出契约；任务 2/3 不得顺手改变。
- 本任务分支基于远端 `origin/main`；工作区本地 `main` 的其它未推送提交不属于本任务，后续整合前必须单独处理，不能混入 Task 0 squash。

## 下一任务依赖

Task 1 只能在本分支完成 review、以单一 squash commit 合入最新 `main` 并同步远端后开始。

Task 1 分支必须从届时最新 `main` 创建：`feat/feed-database-foundation`。

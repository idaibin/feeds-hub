# Feeds Hub

AI-powered information hub built with Astro.

Feeds Hub 把公开信息搜索、主题筛选、事实核验、去重、结构化 Markdown 和静态站点发布串成一套可复制流程。仓库只保存展示层和处理后的 feed 内容；通用 Prompt、Skill、Workflow 和共享自动化规范由 [`idaibin/aicraft`](https://github.com/idaibin/aicraft) 维护。

## 用途

- 个人 AI 新闻入口
- 股市每日闭市、科技、开源或产品简报
- 微博 / X / V2EX 公共热点简报
- 世界杯、LOL 等赛事追踪
- 团队内部信息看板
- 自定义主题信息流站点

## 文档入口

| 文件 | 负责 |
|---|---|
| `docs/rules/repo-scope.md` | 仓库边界和允许修改路径 |
| `docs/automation/feeds-hub-update.md` | AI 更新任务入口 |
| `docs/topics/README.md` | 主题列表和主题文档格式 |
| `docs/topics/<category>.md` | 单主题范围、来源、跳过条件 |
| `docs/rules/content-format.md` | frontmatter、标题、摘要、正文格式 |
| `docs/rules/ui-spec.md` | 页面、card 和详情页展示规则 |
| `docs/architecture/feed-runtime.md` | 运行时架构、任务边界和依赖顺序 |
| `docs/architecture/feed-runtime-contracts.md` | Feed 领域模型、API 与 MCP 契约 |
| `docs/architecture/feed-runtime-migration.md` | 数据迁移、切换与回滚方案 |
| `docs/operations/feed-runtime-production-cutover.md` | Production-only 上线、验证与回滚 runbook |
| `docs/operations/feed-mcp-oauth.md` | Remote MCP OAuth、Vercel 与 ChatGPT Dev Mode 配置 |
| `docs/progress/feed-runtime.md` | 分阶段实施进度和真实验证结果 |

## 默认主题

| 分类 | 说明 |
|---|---|
| `worldcup` | 世界杯赛程、进程、赛果和单场事件 |
| `lol` | LOL 赛事赛程、进程、赛果、阵容和规则 |
| `stock` | A 股、港股、美股每日闭市简报 |
| `github` | GitHub 昨日热门仓库和技术内容 |
| `hot` | 微博、X 和 V2EX 最新公共热点，按小时限量汇总 |
| `ai` | AI 模型、产品、论文、工具、政策和公司动态 |
| `compute` | AI 基础设施、芯片、HBM、数据中心、电力和云资本开支 |
| `rust` | Rust、开源、工具链、crate、RFC 和安全公告 |
| `dev` | TypeScript、Node、前端框架、运行时、云平台和开发工具 |
| `security` | CVE、安全公告、供应链风险、开源依赖和云安全事件 |
| `product` | 创业、产品设计、增长、定价、平台和商业化 |
| `global` | 全球范围高信号公共事件 |

## 更新流程

完整执行规则见 `docs/automation/feeds-hub-update.md`。核心顺序：

```text
topics -> sources -> dedupe -> kind -> markdown -> validation
```

必要原则：

- 1 feed = 1 event。
- 信息准确、可核验、去重表达优先。
- `cover` / `coverStatus` 只作 schema 兼容；`coverStatus` 固定为 `pending`。

## 运行时架构

当前代码已具备 Astro Content Collection / Neon Postgres 双读取源、受保护的 Feed 写入 API，以及 Astro 内的 Remote MCP Server。默认开关仍以 Content 读取为准，写入和 MCP 默认关闭；Production 是否已切换必须以 [`Production cutover runbook`](docs/operations/feed-runtime-production-cutover.md) 中的实际执行记录为准，不能仅根据代码存在推断。

![Feeds Hub 运行时架构图](docs/architecture/feed-runtime-architecture.png)

上线顺序固定为 `content → database → read-only MCP → writes`。本项目不使用 Vercel Preview 或 Preview 数据库做这次切换；每一阶段只从 `main` 部署到 Production，验证通过并完成 review 后才进入下一阶段。即使数据库读取和 MCP 写入启用，`src/content/**` 与 `ContentFeedSource` 仍作为归档和回滚来源，不会在本阶段删除。

![Feeds 后续更新流程图](docs/architecture/feed-runtime-update-flow.png)

## 内容结构

```text
src/content/<category>/<yyyy-mm-dd>-<slug>.md
```

frontmatter 中的 `cover` 是历史兼容占位，不参与展示，也不要求对应文件存在。建议使用稳定站点路径：

```text
/images/<category>/<yyyy-mm-dd>-<slug>.webp
```

`reviewed: true` 的内容才会展示。

## 本地运行

```bash
pnpm install
pnpm run dev
```

## 校验

```bash
pnpm install --frozen-lockfile
pnpm run test
pnpm run test:mcp
pnpm run db:generate
pnpm run db:check
pnpm run content:import:dry
pnpm run check
pnpm run build
```

`pnpm run test:integration` 只能连接明确隔离的非 Production 测试数据库；Production migration、import、切换和回滚必须逐项执行 [`Production cutover runbook`](docs/operations/feed-runtime-production-cutover.md)。

## 部署

推荐 Vercel：

```text
Framework Preset: Astro
Build Command: pnpm run build
Output Directory: 由 @astrojs/vercel 生成，不手工覆盖
Install Command: pnpm install --frozen-lockfile
```

`vercel.json` 使用 Vercel 官方 [`git.deploymentEnabled`](https://vercel.com/docs/project-configuration/git-configuration#gitdeploymentenabled) minimatch 分支匹配：`main` 显式为 `true`，覆盖含 `/` 分支名的 `**` 为 `false`。这会阻止非 `main` push 触发 Git 自动 deployment；它不是 Ignored Build Step。操作者也不得用 CLI 或 Dashboard 为其他分支手工创建 Preview。

# ChatGPT Scheduled Task

本文件是 ChatGPT Chat 定时更新 Feeds Hub 的执行入口。每次从 `idaibin/feeds-hub` 最新 `main` 读取本文件、`docs/topics/README.md`、全部 `docs/topics/*.md`、相关 `docs/types/*.md`、`docs/rules/content-format.md`、`src/domain/feed-content-hash.ts`、`src/lib/feed-validation.ts`、`src/db/schema.ts` 和 `src/db/neon-feed-repository.ts`。记录精确 commit SHA；读不到任一必要文件则停止。

## 运行边界

- 必须在 ChatGPT Chat 执行，不使用 ChatGPT Work。
- GitHub 全程只读：不得创建分支、Markdown、commit、PR，不得更新 `main`。
- 不修改 Vercel、环境变量或 Google Drive，不触发部署。
- Production 内容只写 Neon 项目 `mute-tree-11109990`、分支 `br-raspy-rice-at72v136`。
- 单轮最多新增 1 条 Feed；没有满足条件的事件时正常跳过，不凑数。
- 不更新、覆盖或删除既有 Feed，不执行 DDL、DELETE、TRUNCATE。
- `src/content/**` 仅作历史参考；去重以 Production 数据库为准。

## 每轮顺序

1. 读取当前时间，按 `docs/topics/README.md`、topic frontmatter 和 type rules 判断应检查与应跳过的分类。
2. 固定节奏优先：已到窗口的 `stock`、活跃赛事、`github` 每日覆盖、`hot` 小时覆盖；之后才检查随机事件 `ai`。
3. 打开官方一手来源；必要时增加独立第二证据。社交平台和社区只能用于发现或热度，不单独确认硬事实。
4. 只选择新鲜、可核验且具有实际信息增量的事件。正文默认 3–5 段：事实、时间线/能力、影响、限制与下一步。
5. title、subtitle、summary 和首段不得近似复述；`1 feed = 1 event`；`coverStatus=pending`。
6. 查询 Production `feeds`，按 eventKey、slug、sourceUrl、标题相似度、事件语义和 content hash 去重。精确重复或语义重复均跳过。
7. 写前读取真实表结构、枚举、约束及当前仓库的 hash、验证和 repository 实现，不凭记忆猜字段。
8. 形成只读计划，必须为 `1 insert / 0 update / 0 conflict / 0 invalid`；否则停止写入。
9. 优先使用已连接的 Feeds Hub 写入 API/MCP。若当前 Chat 只提供 Neon 连接，则严格复用仓库现行语义，在单一数据库事务中完成 draft → published，并同步写入 revision、audit event 和 idempotency key。origin 使用 `mcp`，actor 使用 `mcp:feed-writer`。
10. 写后查询必须确认：总数只增加 1、目标 eventKey 恰好 1 条、status=published、version=2、origin=mcp、正文及全部业务字段一致、revision/audit/idempotency 各 2 条。
11. 回读 `https://feeds.idaibin.dev/`、对应分类页和详情页。分别核验首页标题、分类页标题、详情页完整正文和关键段落。
12. 云端访问线路若返回与用户本地不同的托管占位页，只能把公开回读标为 `not verified`，不得把数据库写入误报为失败或把占位页误报为站点事实。

## Topic 节奏

- `hot`：每小时检查；北京时间自然日最多 5 条，同一小时默认最多 1 条。
- `stock`：仅在 A 股、港股、美股真实闭市窗口后检查；休市不写。
- `github`：每天最多 1 条，优先昨天的高价值仓库或正式 release。
- `lol`、`worldcup`：仅在 Active Event Calendar 的赛事窗口内按官方状态检查。
- `ai`：随机事件；优先过去 48 小时内的官方模型、产品、工具、研究或工程更新。
- 其它 topic 默认跳过。

## 内容与去重

- 允许状态递进：schedule → flow → result；proposal → official decision；release candidate → stable；advisory → patched。
- sourceUrl 只是辅助证据，不能单独决定重复。
- 不写原始抓取数据、关键词堆砌、标题党、预测、投资建议或无来源扩写。
- cover 使用对应分类下的稳定占位路径，`coverStatus` 固定 `pending`。

## 失败与报告

- 任一必要来源、规则、Production schema、权限或写入契约不确定时，在写入前停止。
- 仅在新增成功或出现真实失败/阻塞时回复；没有符合条件的新事件时输出 `::SKIP_COMPLETION::`。
- 成功报告保持简洁：查询时间、topic、标题、官方来源、eventKey、数据库计数、审计计数、首页/分类/详情回读状态。
- 明确区分 `verified`、`failed`、`not verified`。

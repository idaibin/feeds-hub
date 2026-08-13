# Feeds Hub Update

自动更新流程摘要。实际定时任务配置不在本仓库内；执行入口看 `chatgpt-scheduled-task.md`。

## 范围

- Topic 配置：`docs/topics/*.md`
- 类型规则：`docs/types/*.md`
- 内容格式：`docs/rules/content-format.md`
- UI 展示：`docs/rules/ui-spec.md`

内容分支只写 Markdown；Production 当前读取 Neon，因此完整流程还必须在合并 `main` 后完成受控数据库同步和公网页面回读。

已批准但尚未实现的 knowledge candidate 是主内容流程完成后的独立显式交付，合同见
`docs/architecture/knowledge-candidate-handoff.md`。它不能自动写入 AI Handbook、
不能改变 feed 的核验状态，也不能直接触发 Blog 发布。未启用 producer 时，本任务
不得生成或上报 candidate 成功。

## 执行顺序

1. 从最新 `origin/main` 开始。
2. 创建或继续 `content/feeds-hub-update-<yyyyMMdd-HHmm>`。
3. 读取 `docs/topics/README.md` 的 `Active Event Calendar`。
4. 读取全部 topic frontmatter 和对应 type rules。
5. 先处理固定节奏 topic：`hot` 小时热点、`stock` 闭市、`lol` 赛程状态、`worldcup` 赛程状态、`github` 昨日热门仓库。
6. 再处理随机事件 topic：`ai`。
7. 其它 topic 报告 `skipped: disabled-by-focus`。
8. 写入已核验 Markdown。
9. 重新读取产物并验证格式、来源、去重、正文完整性、非重复表达。
10. 验证通过后 squash 到 `main` 并推送；记录精确 commit。
11. 等待该 commit 的 Production deployment READY。不要把构建成功视为数据同步成功。
12. 按 Production runbook 的“例行 Markdown → Neon 同步”执行数据库 plan、恢复点、apply 和 post-verify。
13. 恢复 `FEED_READ_SOURCE=database`、`FEED_WRITES_ENABLED=true`、`FEED_MCP_ENABLED=true`，移除全部临时 `FEED_CONTENT_IMPORT_*`，重新部署同一 commit。
14. 回读分类页和每条新 Feed 的详情页；确认数据库计数、页面内容和 commit 一致后，删除本轮已合并内容分支。

如果当前执行没有 Production 数据库授权、可验证恢复点或 Vercel/Neon 权限，停在 `awaiting-production-sync` 并明确报告。不得把 `main` 已更新或 deployment READY 报告成完整发布成功。

## 赛事覆盖

对 `flows` 包含 `sports` 的 topic：

- 对照 `Active Event Calendar` 和 topic `Topic Overrides` 建立比赛清单。
- 检查官方赛程、比赛中心、赛果、standings / bracket / stage 和内嵌 match data。
- 赛前补 `match_schedule`。
- 赛中或状态变化补 `match_flow`。
- 赛后补 `match_result`。
- 未完成逐场审查前，不写热点、反应、背景稿。

## GitHub 写入

使用 connector 时采用 blob/tree/commit/ref：

1. 读取目标分支 HEAD 和 tree。
2. 为新增 Markdown 创建 blob。
3. 创建 tree。
4. 创建 commit。
5. 更新内容分支 ref。
6. 重新读取本次变更验证。

## 合并门槛

- 内容分支 Markdown 已验证。
- 来源、去重、正文完整性通过。
- 标题、summary、subtitle、首段不雷同。
- `coverStatus` 保持 `pending`。
- stock 交易日已覆盖 A 股、港股、美股闭市；休市必须有交易所日历或权威来源说明；不得写盘中、早盘、期货、单股、研报或宏观前瞻 stock feed。
- github 每天最多 1 条，默认汇报昨天热门仓库和技术内容。
- hot 每个北京时间自然日最多 5 条；同一小时默认最多 1 条，除非重大公共安全或官方确认事件。
- `main` 与 `origin/main` 同步。

失败时不推送 `main`，报告步骤、topic、feed、分支、已验证文件和失败原因。

## 报告字段

- 任务计划和分支名。
- 遍历 topic。
- topic flows、来源检查、跳过原因。
- 赛事 `sportsCoverage.checkedMatches`、`missingSchedule`、`missingFlow`、`missingResult`、`noMissingState`。
- 股市 `marketCloseCoverage.aShare`、`marketCloseCoverage.hk`、`marketCloseCoverage.us`，包含 checked/skipped/newFeed、关键指数涨跌和市场信息。
- GitHub `githubTrendingCoverage`，包含 targetDate、checkedRepos、selectedRepo、star/growth evidence。
- 热点 `hotCoverage`，包含 currentHour、dailyCount、checkedTopics、newFeed、skipped reason。
- 新增/跳过/待补。
- 每条 feed 的 source、sourceUrl、eventAt、eventKey、路径、正文补充范围、相似度检查、coverStatus。
- 写入提交、验证结果、squash 结果、main 推送结果、Production deployment ID、数据库 plan/apply/post-verify、公开 URL 回读和分支清理结果。

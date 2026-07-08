# Feeds Hub Update

自动更新流程摘要。实际定时任务配置不在本仓库内；执行入口看 `chatgpt-scheduled-task.md`。

## 范围

- Topic 配置：`docs/topics/*.md`
- 类型规则：`docs/types/*.md`
- 内容格式：`docs/rules/content-format.md`
- UI 展示：`docs/rules/ui-spec.md`

main 内容流程只写 Markdown。

## 执行顺序

1. 从最新 `origin/main` 开始。
2. 创建或继续 `content/feeds-hub-update-<yyyyMMdd-HHmm>`。
3. 读取 `docs/topics/README.md` 的 `Active Event Calendar`。
4. 读取全部 topic frontmatter 和对应 type rules。
5. 先审查 `lol`、`worldcup` 的逐场赛事状态。
6. 再处理 `ai`、`github`、`stock`；`stock` 必须先跑 A 股、港股、美股闭市子检查。
7. 其它 topic 报告 `skipped: disabled-by-focus`。
8. 写入已核验 Markdown。
9. 重新读取产物并验证格式、来源、去重、正文完整性、非重复表达。
10. 验证通过后 squash 到 `main`，推送，删除本轮内容分支。

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
- stock 交易日已覆盖 A 股、港股、美股闭市；休市必须有交易所日历或权威来源说明。
- `main` 与 `origin/main` 同步。

失败时不推送 `main`，报告步骤、topic、feed、分支、已验证文件和失败原因。

## 报告字段

- 任务计划和分支名。
- 遍历 topic。
- topic flows、来源检查、跳过原因。
- 赛事 `sportsCoverage.checkedMatches`、`missingSchedule`、`missingFlow`、`missingResult`、`noMissingState`。
- 股市 `marketCloseCoverage.aShare`、`marketCloseCoverage.hk`、`marketCloseCoverage.us`，包含 checked/skipped/newFeed 和关键指数涨跌。
- 新增/跳过/待补。
- 每条 feed 的 source、sourceUrl、eventAt、eventKey、路径、正文补充范围、相似度检查、coverStatus。
- 写入提交、验证结果、squash 结果、main 推送结果、分支清理结果。

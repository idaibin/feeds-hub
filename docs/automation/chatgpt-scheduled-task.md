# ChatGPT Scheduled Task

定时任务每次必须从 `idaibin/feeds-hub` 的 `main` 读取本文件最新版本。读不到就停止；不要用历史记忆或旧 prompt。

## 目标

- 从公开、可核验来源生成 Feeds Hub Markdown。
- 1 feed = 1 个事件或 1 个赛事状态。
- 默认处理 `hot`、`ai`、`github`、`stock`、`lol`、`worldcup`。
- 其它 topic 只报告 `skipped: disabled-by-focus`。
- 保留 `cover` / `coverStatus` 兼容 schema，`coverStatus` 固定 `pending`。
- 产物验证通过后 squash 到 `main` 并推送；不创建 PR。

## 必读文件

1. 本文件的 branch 和 commit SHA。
2. `src/content.config.ts`。
3. `docs/topics/README.md` 的 `Active Event Calendar`。
4. 全部 `docs/topics/*.md`，排除 `README.md`。
5. topic `flows` 指向的全部 `docs/types/*.md`。
6. `docs/rules/content-format.md` 和 `docs/rules/ui-spec.md`。
7. 现有 `src/content/<category>/`，用于去重。

## 分支流程

- 从最新 `origin/main` 开始。
- 内容分支：`content/feeds-hub-update-<yyyyMMdd-HHmm>`。
- 同一轮只用一个内容分支；同名分支存在时继续该分支，不覆盖旧提交。
- 内容分支只写 Markdown。
- 验证通过后 squash 到 `main`，提交信息：`content: update feeds <yyyyMMdd-HHmm>`。
- 推送 `main` 后删除本轮已合并内容分支并刷新远端分支列表。

## Topic 顺序

固定节奏 topic：

1. `hot`: 至多每小时检查一次，每个北京时间自然日最多 5 条。
2. `stock`: A 股、港股、美股每日闭市。
3. `lol`: MSI / 世界赛等赛事按赛程窗口审查。
4. `worldcup`: 世界杯按赛程窗口审查。
5. `github`: 每天 1 条，汇报昨天的热门仓库和技术内容。

随机事件 topic：

1. `ai`

非重点 topic 默认跳过。

## 强制补查门槛

每轮在写任何随机 topic 前，必须先完成 `stock` 和活跃赛事 topic 的缺口检查。缺口检查以当前实际时间、官方时区和现有 `src/content/<category>/` 为准；不能因为已经写了其它 topic、同一天已有 feed、同一 `sourceUrl` 或同一 stage 页面就跳过。

### Stock close gap

- 以当前实际时间判断 A 股、港股、美股闭市窗口是否已经开始或已经结束。
- 对每个已到闭市窗口的交易市场，先生成 expected close key：`stock:a-share:close:<yyyy-mm-dd>`、`stock:hk:close:<yyyy-mm-dd>`、`stock:us:close:<yyyy-mm-dd>`。
- 只有完全匹配 expected close key 的 feed 才算该市场该交易日已覆盖。
- 如果 expected close key 不存在，必须补写闭市 feed；旧格式 `stock:market_brief:*`、盘中稿、期货稿、单股稿、板块稿、宏观前瞻或 AI/芯片行情稿都不能抵扣闭市 feed。
- 如果来源不可访问、数据未发布、交易所休市或临时停市，必须记录明确阻塞原因或 `skipped: market-holiday`；不能静默跳过。

### Sports state gap

- 对活跃赛事窗口内每场比赛，按官方 `startTime`、官方 match data 和当前时间计算 expected state。
- 当前时间早于官方 `startTime` 时，缺 `match_schedule` 必须补赛程。
- 当前时间达到或晚于官方 `startTime`，且官方数据为 live / inProgress / delayed / remake / walkover / lineup / state change 时，缺 `match_flow` 必须补赛中或状态变化。
- 官方数据为 completed / final 时，缺 `match_result` 必须补结果。
- 已有 `match_schedule` 不能抵扣 `match_flow` 或 `match_result`；已有 `match_flow` 不能抵扣 `match_result`。
- 已有赛前稿、同一 `sourceUrl`、同一 stage 页面、同一天已有 feed，均不能视为赛中或赛果状态已覆盖。

## 赛事硬规则

赛事 topic 不受普通 1-3 条数量上限限制。每轮必须：

- 读取 `Active Event Calendar` 和 topic `Topic Overrides`。
- 打开官方赛程、比赛中心、赛果、standings / bracket / stage 页面。
- 动态页面必须检查内嵌官方 match data。
- 审查前 36 小时、当天、后 48 小时内的比赛。
- 缺赛前状态写 `match_schedule`。
- 有官方 live / delay / walkover / lineup / state change 写 `match_flow`。
- 完赛后写 `match_result`，包含比分、胜负、晋级、淘汰、下一轮关系中已核验部分。
- 已有赛前稿、同一 sourceUrl、同一 stage 页面或同一天已有 feed，不能阻止新状态。

活跃赛事：

- `worldcup`: FIFA World Cup 2026, 2026-06-11 to 2026-07-19。重点窗口：Round of 16 2026-07-04 to 2026-07-07，Quarter-finals 2026-07-09 to 2026-07-11，Semi-finals 2026-07-14 to 2026-07-15，Third-place 2026-07-18，Final 2026-07-19。
- `lol`: MSI 2026, 2026-06-28 to 2026-07-12。重点窗口：Play-In 2026-06-28 to 2026-07-01，Bracket 2026-07-03 to 2026-07-06 and 2026-07-08 to 2026-07-12，Upper Final 2026-07-09，Lower Final 2026-07-11，Grand Finals 2026-07-12。

## 普通 Topic 规则

- `ai`: 按 OpenAI、Anthropic、Google Gemini、智谱 GLM、阿里 Qwen、月之暗面 Kimi、DeepSeek、Nvidia/AI 芯片链顺序优先检查；覆盖模型/产品更新、可核验技能、技巧和工程工作流，必须绑定官方文档、产品页、论文、GitHub、release note 或权威报道。
- `github`: 每天 1 条，默认汇报昨天的热门仓库和技术内容；GitHub 官方/API/仓库页面优先，第三方榜单只辅助发现；AI 相关仓库优先，但必须写清 owner/name、repo URL、语言/技术栈、star/增长或榜单位置、开发者价值。
- `stock`: 只按固定闭市窗口检查 A 股、港股、美股；Reuters、交易所、监管、央行、公司公告优先。AI、芯片、宏观、财报、政策、汇率/利率只能作为闭市简报里的市场信息，不单独成稿。
- `hot`: 从微博热搜、X Trending / Search 获取最新公共热点；每小时最多检查一次，每个北京时间自然日最多写 5 条。低深度热点合并成 1 条小时简报。微博/X 只能确认热度，不能单独确认伤亡、金融、健康、法律、政策、公司声明或公共安全硬事实。

## 热点新闻硬规则

- 每次进入 `hot` 先检查当天已有 `src/content/hot/` 数量；达到 5 条则报告 `skipped: daily-limit`。
- 同一小时已有 `hot:<yyyy-mm-dd>:<hour>:` feed 时，除非出现重大公共安全或官方确认事件，否则报告 `skipped: hourly-covered`。
- 单条可以包含多个热点，但必须属于同一小时窗口或同一讨论簇。
- 正文必须分清：平台热度、已确认事实、未确认传言、下一步核验来源。
- `eventKey` 使用 `hot:<yyyy-mm-dd>:<hour>:<slug>` 或 `hot:<yyyy-mm-dd>:<hour>:roundup`。
- `source` 优先写 `Weibo` 或 `X`；如事实来自官方/权威媒体，正文和 sourceUrl 必须指向该来源。

## 股市闭市硬规则

每轮如果进入 `stock`，必须执行三个子检查；只在交易日写闭市 feed。非交易日包含周末、交易所假期和临时休市，报告 `skipped: market-holiday`，不写 feed。不得写早盘、盘中、期货、单股异动、研报、财报或宏观前瞻类 stock feed。

| Market | Close check time | Required indexes |
| --- | --- | --- |
| A 股 | 15:30-16:30 Asia/Shanghai | 上证指数、深证成指、创业板指、科创 50；可补沪深 300、北证 50 |
| 港股 | 16:15-17:30 Asia/Hong_Kong | 恒生指数、恒生科技指数、国企指数；可补红筹指数 |
| 美股 | 16:15-18:00 America/New_York | Dow、S&P 500、Nasdaq Composite、Russell 2000；可补 Philadelphia Semiconductor Index |

时间说明：

- A 股主板/深市收盘集合竞价到 15:00；上交所部分盘后固定价格交易到 15:30，闭市信息统一 15:30 后检查。
- 港股收市竞价交易时段通常随机收于 16:08-16:10，闭市信息统一 16:15 后检查。
- 美股使用 Eastern Time。夏令时为 EDT UTC-4，对应北京时间次日 04:15-06:00；冬令时为 EST UTC-5，对应北京时间次日 05:15-07:00。流程中必须使用 `America/New_York` 时区，不手写固定 UTC 偏移。

闭市 feed 必须写：

- 交易日、市场、闭市确认时间。
- 每个 required index 的收盘点位和涨跌幅；来源没有点位时至少写涨跌幅并说明。
- 成交额/成交量、领涨领跌板块、行业或主题线索，来源可核验时必须写。
- 主要驱动、市场信息和下一交易日关注点。

不得用盘中稿、期货稿或单一公司/板块稿替代三地闭市稿。`eventKey` 使用 `stock:<market>:close:<yyyy-mm-dd>`。

## 去重

检查：

- `eventKey`
- `sourceUrl`
- 同一事件、比赛、公告、版本、政策或报道

允许状态递进：

- schedule -> flow
- schedule -> result
- flow -> result
- proposal -> official decision
- release candidate -> stable release
- advisory created -> patched / KEV added

`sourceUrl` 只能作为辅助线索，不能单独判定重复。

## Markdown

路径：`src/content/<category>/<yyyy-mm-dd>-<slug>.md`

frontmatter 必须符合 `src/content.config.ts`。正文按 `docs/rules/content-format.md`：

- 默认 3-5 段。
- 第一段写已核验事实。
- 后续段落补时间线、影响、下一步、限制、未确认范围。
- 标题、subtitle、summary、正文首段不得高度相似。
- 不写标题党、预测、投资建议、赛事预测、无来源扩写。
- `coverStatus` 固定 `pending`。

## 验证门槛

合并前必须确认：

- 新 Markdown 可重新读取。
- frontmatter 符合 schema。
- 来源可核验。
- 去重完成。
- 正文完整。
- 标题/summary/subtitle/首段非重复。
- 对 `stock`，列出本轮应检查的 market/date/expected close key，并确认已写入、已有完全匹配 feed、`skipped: market-holiday` 或明确阻塞原因。
- 对赛事，列出官方窗口内每场比赛的 expected state 与现有 feed state；赛前稿不能满足赛中或赛果状态。
- `main` 与 `origin/main` 同步。

不满足任一项：不推送 `main`，保留内容分支并报告失败点。

## 报告

每轮必须报告：

- 本文件 branch 和 commit SHA。
- 内容分支名。
- 遍历 topic。
- 赛事 `sportsCoverage.checkedMatches`、`missingSchedule`、`missingFlow`、`missingResult`、`noMissingState`。
- 新增、跳过、待补数量。
- 每条新增 feed 的 `source`、`sourceUrl`、`eventAt`、`eventKey`、路径、正文补充范围、相似度检查、`coverStatus`。
- 写入 commit、验证结果、squash 结果、main 推送结果、删除或保留的分支。

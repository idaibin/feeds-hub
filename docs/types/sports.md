# Sports Type Rules

用于 `worldcup`、`lol` 和未来 sports topic。

## Scope

- 1 feed = 1 个比赛状态、球员/选手故事、晋级路径更新或明确赛事事件。
- 官方赛事日先补赛程、赛中状态、赛果和晋级关系，再写热点/反应/背景。
- 当前日期落在 `docs/topics/README.md` 的赛事窗口内时，不能跳过逐场审查。

## Kinds

- `match_schedule`: fixture, kickoff date, exact start time, timezone, stage, teams, venue/region, format.
- `match_flow`: live/in-progress, lineup, pause, delay, remake, walkover, current score/state.
- `match_result`: final score, winner, loser, advancement, elimination, next match.
- `knockout_update`: bracket/path/next opponent/final route.
- `data`: standings, schedule table, bracket, ranking, timeline.
- `player_spotlight`, `hot_topic`, `news`: 只写边界清楚的赛事故事。

## Per-run Review

1. 读取 `Active Event Calendar` 和 topic `Topic Overrides`。
2. 打开官方 schedule、results、standings/bracket/stage、match centre。
3. 生成审查清单：前 36 小时、当天、后 48 小时。
4. 将每场标为 scheduled、live、final、postponed、cancelled、remake、walkover、unknown。
5. 对照现有 `src/content/<category>/` 去重。
6. 缺 `match_schedule` / `match_flow` / `match_result` 时先补比赛 feed。
7. 没有新增时报告 `sportsCoverage.checkedMatches` 和 `noMissingState`。

## State Progression Gate

每场比赛必须按官方数据计算 expected state：

- 当前时间 < 官方 `startTime`: expected `match_schedule`
- 当前时间 >= 官方 `startTime` 且官方 state 为 live / inProgress / delayed / remake / walkover / lineup / state change: expected `match_flow`
- 官方 state 为 completed / final: expected `match_result`

已有较早状态不能抵扣较晚状态。`match_schedule` 不能抵扣 `match_flow` 或 `match_result`；`match_flow` 不能抵扣 `match_result`。

如果官方动态页面可打开但 match data 无法解析，必须报告 `missingSchedule` / `missingFlow` / `missingResult` 的阻塞原因，不能用已有赛前稿、同一 `sourceUrl`、同一 stage 页面或同一天已有 feed 判定 `noMissingState`。

## Dedup

- 优先使用官方 match ID。
- 无 ID 时用 tournament + teams + eventAt + state。
- `sourceUrl` 不能单独判重，stage/standings 页面通常包含多场比赛。
- 同一场可按状态递进：schedule -> flow -> result。
- result 只在同一 match、state、score、晋级关系均已存在时才算重复。

## Source

- 硬事实来自官方赛程、比赛中心、赛果、standings/stage、官方声明或 topic 允许的权威报道。
- 社区/中文站只能补充评价、情绪、讨论热度和背景。
- 官方与权威来源冲突时跳过。

## Body

- `match_schedule` 的 title、subtitle、summary 和第一段必须写入官网核验的具体开赛时间；中文页面和中文内容统一显示北京时间。只有官网明确 TBD 时才写 TBD，并说明待确认。
- 第一段：状态、对阵、时间、比分或关键事实。
- 第二段：阶段、下一轮、晋级/淘汰、确认范围。
- 第三段可写冲突、缺失细节、延期/重赛等限制。
- 标题、summary、subtitle、首段不得近似复述。

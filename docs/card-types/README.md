# Card Types

本文件负责 `kind` 选择和通用海报类型提示词。比例、尺寸、格式、写入和 fallback 看 `docs/rules/poster-spec.md`。

## Selection

| kind | ratio | use |
|---|---:|---|
| `match_schedule` | `4:5` | 体育或电竞赛程、赛前预告、开球节点 |
| `match_result` | `4:5` | 体育或电竞赛果、晋级、淘汰 |
| `match_flow` | `4:3` | 比赛进程、官方实时状态、时间线、关键节点 |
| `player_spotlight` | `4:5` | 单一球员、选手或人物焦点 |
| `knockout_update` | `4:3` | 淘汰赛、bracket、晋级路径 |
| `worldcup_feed` | `4:3` | 同一比赛日或同一阶段世界杯结构化汇总 |
| `market_brief` | `16:9` | 市场、指数、板块、财报或宏观简报 |
| `policy_update` | `16:9` | 政策、监管、标准、治理、规则更新 |
| `hot_topic` | `16:9` | 单一热点事件、发布、争议或关注焦点 |
| `breaking` | `16:9` | 已确认的突发重大变化 |
| `insight` | `16:9` | 来源支持的背景整理或结构化解释 |
| `news` | `16:9` | 默认新闻和普通资讯 |
| `ai` | `16:9` | AI 主题的结构化聚合或模型/工具更新 |
| `data` | `4:3` | 指数、榜单、图谱、地图、流程、架构、漏斗 |
| `visual` | `4:5` | 图片主导的专题视觉，不作为默认 fallback |

未命中时使用 `news` 和 `16:9`。

## Quick Rules

- 赛事官方页、赛前信息、直播进程、赛果：优先 `match_schedule`、`match_flow`、`match_result`、`knockout_update`。
- 监管、政策、标准、官方文件：优先 `policy_update`。
- 财报、指数、宏观数据、市场报道：优先 `market_brief` 或 `data`。
- 模型、工具、产品、开源发布：优先 `hot_topic`、`ai`、`news`。
- 图表、结构、地图、bracket、时间线或流程：优先 `data`。

## Prompt Assembly

组合顺序、基础比例提示词和 negative constraints 统一看 `docs/rules/poster-spec.md`。

## Prompts

### `match_schedule`

```text
Use a pre-event poster composition with anticipation, fixture structure, stage readiness, and matchday energy.
```

### `match_result`

```text
Use a result-focused poster composition with post-event energy, advancement or elimination pressure, and a decisive central focal point.
If exact score is supplied by the feed, it may be used as designed text; otherwise keep scoreboards generic or unreadable.
```

### `match_flow`

```text
Use a structured timeline composition showing event rhythm, turning points, pressure, and progress through premium timeline panels.
Only use exact minute, score, or player text when supplied by the feed.
```

### `player_spotlight`

```text
Use a single-person spotlight composition with one generic illustrated athlete, player, founder, researcher, or operator silhouette.
Do not copy real faces, jerseys, team badges, champion art, official portraits, or broadcast graphics.
```

### `knockout_update`

```text
Use a bracket or advancement composition with structured nodes, paths, and stage hierarchy.
Only include exact teams or stage labels when supplied by the feed and verified.
```

### `worldcup_feed`

```text
Use a same-day or same-stage structured World Cup feed composition with clean modules.
Do not mix unrelated events, teams, or stages.
```

### `market_brief`

```text
Use a neutral market dashboard, research desk, sector rotation, macro screen, or institutional analysis composition.
Do not imply investment advice, guaranteed profit, buy/sell/hold signals, or panic-crash sensationalism.
```

### `policy_update`

```text
Use formal institutions, documents, review tables, hearing rooms, governance, regulatory, standards, or public-policy context.
Do not render official seals, policy numbers, signatures, or fake document text.
```

### `hot_topic`

```text
Use a focused editorial scene with one clear subject, current attention, and restrained urgency.
Avoid collage-like multi-topic compositions.
```

### `breaking`

```text
Use a direct, high-clarity news scene with visible urgency but no sensational visual panic.
Represent uncertainty by keeping secondary details abstract.
```

### `insight`

```text
Use a structured explanation scene: layered panels, cause-and-effect paths, research desk, system map, or annotated environment.
Do not add unsourced conclusions inside the image.
```

### `news`

```text
Use a clean editorial news cover with one main subject, relevant environment, and restrained visual context.
```

### `ai`

```text
Use a structured AI technology scene: model interface, developer workflow, research dashboard, chip substrate, data center, or agent system map.
Avoid generic robot imagery and fake product UI.
```

### `data`

```text
Use a structured data visual composition: dashboard, bracket, map, timeline, ranking, dependency graph, funnel, or architecture panel.
Data marks must be symbolic unless exact facts are supplied by the feed.
```

### `visual`

```text
Use a high-quality editorial visual poster with stronger hierarchy than normal news.
Use only when the feed is intended to be image-led.
```

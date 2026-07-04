# Card Types

本目录维护 Feeds Hub 的 card 信息分类和通用海报类型提示词。

执行者拿到主题信息后，先用 `docs/topics/<category>.md` 判断是否值得写入，再用本文件选择 `kind`、图片比例和通用海报提示词。

如果 topic 没有额外主题海报提示词，则直接根据信息来源和内容形态选择本文件中的 card type：

- 来源是赛程、赛果、赛事官方页：优先 `match_schedule`、`match_result`、`match_flow`、`knockout_update`。
- 来源是监管、政策、标准、官方文件：优先 `policy_update`。
- 来源是财报、指数、宏观数据、市场报道：优先 `market_brief` 或 `data`。
- 来源是模型、工具、产品、开源发布：优先 `hot_topic`、`ai`、`news`。
- 来源天然包含图表、结构、地图、bracket、时间线或流程：优先 `data`。
- 未命中明确类型：使用 `news`。

## 输出

每条 feed 必须确定：

```text
kind
poster ratio
poster size
card type prompt
```

## 比例

| Ratio | Recommended size | Use case |
|---|---:|---|
| `16:9` | `1600x900` | 默认新闻、政策、市场简报、热点 |
| `4:5` | `1440x1800` | 赛事赛程、赛果、球员或选手焦点、强视觉海报 |
| `4:3` | `1600x1200` | 数据图、bracket、时间线、结构化图表 |

禁止使用 `1:1` 作为 feed 主封面。

## 选择规则

| kind | ratio | 何时使用 |
|---|---:|---|
| `match_schedule` | `4:5` | 体育或电竞赛程、赛前节点 |
| `match_result` | `4:5` | 体育或电竞赛果、晋级、淘汰 |
| `match_flow` | `4:3` | 比赛进程、时间线、关键节点 |
| `player_spotlight` | `4:5` | 单一球员、选手或人物焦点 |
| `knockout_update` | `4:3` | 淘汰赛、bracket、晋级路径 |
| `worldcup_feed` | `4:3` | 同一比赛日或同一阶段世界杯结构化汇总 |
| `market_brief` | `16:9` | 市场、指数、板块、财报或宏观简报 |
| `policy_update` | `16:9` | 政策、监管、标准、治理、规则更新 |
| `hot_topic` | `16:9` | 单一热点事件、发布、争议或关注焦点 |
| `breaking` | `16:9` | 已确认的突发重大变化 |
| `insight` | `16:9` | 来源支持的背景整理或结构化解释 |
| `news` | `16:9` | 默认新闻和普通资讯 |
| `ai` | `16:9` | AI 主题的结构化聚合或模型 / 工具更新 |
| `data` | `4:3` | 指数、榜单、图谱、地图、流程、架构、漏斗 |
| `visual` | `4:5` | 图片主导的专题视觉，不作为默认 fallback |

未命中时使用 `news` 和 `16:9`。

## Prompt Assembly

每条 feed 的主封面提示词按以下顺序组合：

```text
Base ratio / size prompt
+ Card type prompt
+ Topic poster prompt from docs/topics/<category>.md
+ Event facts from current feed
+ Negative constraints
```

图片只表达主题、场景、氛围和事件方向。比分、时间、日期、来源、公司名、队伍名、价格等精确事实必须来自当前 feed，不得由模型补写。

## Base Prompts

### `16:9`

```text
Create a premium 16:9 editorial news cover image, 1600x900 WebP.
Use one clear focal point, strong contrast, premium lighting, and restrained details.
Keep the composition readable for a mobile-first feed card.
Do not add Feeds Hub branding, source badges, category labels, watermarks, or unsupported readable metadata.
```

### `4:5`

```text
Create a premium vertical editorial poster, aspect ratio 4:5, 1440x1800 WebP.
Use strong mobile poster hierarchy: clear top zone, dominant middle focal point, and structured lower information area.
Use cinematic lighting, realistic depth, rich details, and high-end poster finish.
Only include short factual visual labels when those facts are supplied by the current feed.
```

### `4:3`

```text
Create a premium 4:3 structured editorial information cover, 1600x1200 WebP.
Use a clean data, bracket, dashboard, map, timeline, workflow, or architecture composition.
Charts, brackets, panels, and timelines must be symbolic unless exact facts are supplied by the feed.
Do not render fake numbers, fake dates, fake tickers, fake team names, fake official logos, or fake source marks.
```

## Card Type Prompts

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

## Negative Constraints

```text
No 1:1 feed cover.
No reusable generic template applied to multiple unrelated feeds.
No script-drawn placeholder, SVG, Canvas, HTML screenshot, or CSS-generated poster.
No Feeds Hub logo, Feeds Hub wordmark, watermark, category tag, source tag, or status pill inside the image.
No fake official logo, team badge, company logo, government seal, ticker, score, date, chart value, API screenshot, or document text.
```

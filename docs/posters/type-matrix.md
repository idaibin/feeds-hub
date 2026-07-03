# Poster Type Matrix

本文件定义 Feeds Hub 移动端优先的信息类型、海报比例、推荐尺寸和类型化提示词。生成每条 feed 的海报前，必须先读取本文件，再读取 `docs/posters/<category>.md`。

## 核心原则

- 卡片宽度统一，图片比例按 `category + kind` 推导。
- 默认比例为 `16:9`，只在内容形态需要时切换为 `4:5` 或 `4:3`。
- 禁止使用 `1:1` 作为 feed 主封面比例。
- 每条 feed 必须单独生成海报，禁止把同一张通用模板批量复用到多条 feed。
- 主封面必须由 ChatGPT 图像生成能力逐张生成，不能用 Python、Pillow、SVG、Canvas、HTML 截图、GitHub Actions 或任何确定性脚本生成图片。
- 图片必须达到高质感视觉海报水平：电影感、强光影、真实场景或高质量 3D/信息图场景、清晰细节、稳定构图、清楚主体。
- 图片只表达主题、场景、氛围和事件方向，不承载未经 feed 明确提供的精确事实。
- 比分、日期、时间、来源、队伍名、公司名、价格等精确信息必须来自当前 feed frontmatter 和正文。

## 已确认的黄金风格基准

### 世界杯 / LOL 赛事海报

已确认可接受的视觉方向：

```text
premium sports editorial poster,
cinematic dark blue night stadium,
electric blue floodlights,
metallic sports typography,
glowing football or stage focal point,
large glossy flag / team-side medallions when relevant,
clear result / schedule hierarchy,
neon HUD lower information panel,
rich pitch or stage depth,
sharp high-contrast details,
not a flat template,
not a script-drawn placeholder.
```

世界杯 `match_result` 和 `match_schedule` 可在图片内使用已验证事实，例如比分、晋级、对阵和下一轮信息，但这些事实必须来自当前 feed，不得由模型补写或改写。

### AI / 科技新闻封面

已确认可接受的视觉方向：

```text
premium technology editorial cover,
deep navy and cyan cinematic lighting,
realistic server-room or product-strategy atmosphere,
layered translucent dashboard panels,
agent workflow / review dashboard / system map,
left text + right technical scene composition,
crisp Chinese headline,
not a generic robot image,
not a flat SaaS template,
not a script-drawn placeholder.
```

AI 新闻默认不在图片中展示公司 logo 或仿制产品界面；公司名、模型名和事实必须来自当前 feed。

## 比例与尺寸

| Ratio | Recommended size | Minimum size | Use case |
|---|---:|---:|---|
| `16:9` | `1600x900` | `1280x720` | 默认新闻、AI、Rust、Product、Global、Stock、普通资讯 |
| `4:5` | `1440x1800` | `1120x1400` | 世界杯 / LOL 赛事赛程、赛果、球员焦点、强视觉海报 |
| `4:3` | `1600x1200` | `1280x960` | 数据图、排名、bracket、淘汰赛进展、时间线、结构化图表 |

`1:1` 不用于 feed 主封面。需要图标、Logo、头像或专题入口时另行维护，不进入默认信息流主封面规范。

## Type mapping

| category | kind | ratio | style |
|---|---|---:|---|
| `worldcup` | `match_schedule` | `4:5` | 赛事前瞻海报 |
| `worldcup` | `match_result` | `4:5` | 赛事结果海报 |
| `worldcup` | `match_flow` | `4:3` | 比赛进程 / 时间线 |
| `worldcup` | `player_spotlight` | `4:5` | 球员焦点海报 |
| `worldcup` | `knockout_update` | `4:3` | 淘汰赛 bracket / 晋级图 |
| `worldcup` | `worldcup_feed` | `4:3` | 同一比赛日结构化汇总 |
| `worldcup` | `data` | `4:3` | 排名、对阵、晋级路径 |
| `worldcup` | `visual` | `4:5` | 人工精选赛事海报 |
| `lol` | `match_schedule` | `4:5` | 电竞赛程海报 |
| `lol` | `match_result` | `4:5` | 电竞赛果海报 |
| `lol` | `match_flow` | `4:3` | 比赛进程 / ban-pick / 时间线 |
| `lol` | `player_spotlight` | `4:5` | 选手焦点，禁止肖像复刻 |
| `lol` | `knockout_update` | `4:3` | bracket / 晋级形势 |
| `lol` | `data` | `4:3` | 排名、赛程表、数据简报 |
| `lol` | `visual` | `4:5` | 人工精选电竞海报 |
| `stock` | `data` | `4:3` | 指数、板块、宏观数据图 |
| `stock` | `market_brief` | `16:9` | 市场简报 |
| `stock` | `policy_update` | `16:9` | 央行、监管、公告、政策 |
| `ai` | `data` | `4:3` | benchmark / 架构 / 生态数据，禁止可读假数值 |
| `ai` | `visual` | `4:5` | 专题视觉图，少用 |
| `rust` | `data` | `4:3` | 依赖图、构建链路、迁移结构 |
| `product` | `data` | `4:3` | 漏斗、旅程、实验结构 |
| `product` | `visual` | `4:5` | 产品专题海报，少用 |
| `global` | `data` | `4:3` | 地图、流程、机构结构图 |
| `*` | `news` / `breaking` / `insight` / `ai` / `hot_topic` / `policy_update` | `16:9` | 默认新闻封面 |

未命中规则时使用 `16:9`。

## Prompt assembly

每条 feed 单独组装：

```text
Base prompt with ratio and size
+ Confirmed golden style baseline from this file
+ Type prompt from this file
+ Category prompt from docs/posters/<category>.md
+ Kind prompt from docs/posters/<category>.md or this file
+ Event facts from frontmatter and body
+ Negative constraints
```

## Base prompt by ratio

### `16:9`

```text
Create a premium 16:9 editorial news cover image, 1600x900 WebP.
Use a real visual scene, high-quality 3D editorial scene, cinematic information dashboard, or symbolic editorial illustration.
Keep the composition clean, readable, modern, and suitable for a mobile-first web news card.
Use one clear focal point, strong contrast, premium lighting, and restrained details.
Do not add Feeds Hub branding, source badges, category labels, watermarks, or unsupported readable metadata inside the image.
```

### `4:5`

```text
Create a premium vertical editorial poster, aspect ratio 4:5, 1440x1800 WebP.
Use strong mobile poster hierarchy: clear top zone, dominant middle focal point, and structured lower information area.
Use cinematic lighting, realistic depth, rich details, and high-end poster finish.
The image may include short factual visual labels only when those facts are supplied by the current feed.
Do not add Feeds Hub branding, source badges, category labels, watermarks, or fake official marks.
```

### `4:3`

```text
Create a premium 4:3 structured editorial information cover, 1600x1200 WebP.
Use a clean data, bracket, dashboard, map, timeline, workflow, or architecture composition with strong hierarchy and enough vertical space for readable visual structure.
Charts, brackets, panels, and timelines must be symbolic unless exact facts are supplied by the feed.
Do not render fake numbers, fake dates, fake tickers, fake team names, fake official logos, or fake source marks.
```

## Type prompts

### `match_schedule`

```text
Use a pre-event poster composition with anticipation, fixture structure, stage readiness, and matchday energy.
For football, use cinematic stadium lights, pitch texture, national color cues, flags if appropriate, and a central matchup focal point.
For esports, use stage lighting, player stations, bracket energy, and abstract team sides.
```

### `match_result`

```text
Use a result-focused poster composition with post-event energy, elimination or advancement pressure, and a decisive central focal point.
If exact score is supplied by frontmatter/body, it may be used as designed text; otherwise keep scoreboards generic or unreadable.
Avoid betting, odds, win-probability, or forecast-board visual language.
```

### `match_flow`

```text
Use a structured timeline or match-flow composition.
Show event rhythm, turning points, pressure, and progress through premium timeline panels.
Only use exact minute, score, or player text when supplied by the feed; otherwise keep timeline marks symbolic.
```

### `player_spotlight`

```text
Use a single-player spotlight composition with one generic illustrated athlete or esports competitor silhouette.
Do not copy real player photos, faces, jerseys, team badges, champion art, or broadcast graphics.
Focus on role, momentum, performance context, and match pressure.
```

### `knockout_update`

```text
Use a bracket or advancement composition with structured nodes, paths, and stage hierarchy.
Avoid unrelated multi-event collage.
Only include exact teams or stage labels when supplied by the feed and verified.
```

### `worldcup_feed`

```text
Use a same-day or same-stage structured World Cup feed composition.
Group closely related results or next-match context into clean modules.
Do not mix unrelated events, teams, or stages.
```

### `market_brief`

```text
Use a neutral market dashboard, research desk, sector rotation, macro screen, or institutional analysis composition.
Do not imply investment advice, guaranteed profit, buy/sell/hold signals, or panic-crash sensationalism.
```

### `policy_update`

```text
Use formal institutions, documents, review tables, hearing rooms, governance, regulatory or standards context.
Do not render official seals, policy numbers, signatures, or fake document text.
```

### `data`

```text
Use a structured data visual composition: dashboard, bracket, map, timeline, ranking, dependency graph, funnel, or architecture panel.
Data marks must be symbolic unless exact facts are supplied by the feed.
```

### `visual`

```text
Use a high-quality editorial visual poster with stronger visual hierarchy than normal news.
Use only when the feed is intended to be image-led.
Do not use it as a generic fallback.
```

### `news` / `breaking` / `insight` / `ai` / `hot_topic`

```text
Use a premium editorial news cover.
Represent the topic through a credible scene, object, interface, institution, or environment.
Avoid flat template style and avoid repeating the article title inside the image unless the feed requires a poster-led visual.
```

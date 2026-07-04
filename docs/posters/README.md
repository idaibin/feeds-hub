# Posters

Feeds Hub 海报规则唯一入口。本目录负责 `kind` 选择、比例映射、单类海报提示词、提示词拼装、封面格式、GitHub 二进制写入和 pending cover。

## Core

- 图片生成不强制。
- 有效 feed 的前置条件是信息真实、来源可核验、事件不重复、frontmatter 完整。
- 图片失败或当前环境不能生成图片时，仍写入合格 Markdown，并设置 `coverStatus: "pending"`。
- 主封面只允许 WebP。禁止 SVG、PNG、Canvas、HTML 截图、CSS 或脚本绘图冒充主封面。
- 生成真实图片时必须显式调用可用图片创建能力，例如 ChatGPT 定时任务中的图片生成能力。

## Paths

图片文件：

```text
public/images/<category>/<yyyy-mm-dd>-<slug>.webp
```

frontmatter `cover`：

```text
/images/<category>/<yyyy-mm-dd>-<slug>.webp
```

禁止在 `cover` 中写 `public` 或 `/images/feeds/`。

## Status

```text
generated_webp
pending
```

- `generated_webp`：真实 WebP 已写入仓库。
- `pending`：本轮无法生成或写入合规 WebP。

`pending` 时保留未来 WebP 目标路径，页面由组件 fallback 承接缺失图片。

## Ratio And Size

| Ratio | Recommended | Minimum | Use case |
|---|---:|---:|---|
| `16:9` | `1600x900` | `1280x720` | 默认新闻、政策、市场简报、热点、赛事赛程、赛事战报 |
| `4:5` | `1440x1800` | `1120x1400` | 人物焦点、强视觉专题、图片主导海报 |
| `4:3` | `1600x1200` | `1280x960` | 数据图、bracket、时间线、结构化图表 |

禁止 `1:1` 主封面。原始生成使用推荐尺寸或更高同等比例尺寸。

## Execution Flow

1. Topic 获取并核验信息。
2. 根据信息类型选择 `kind`。
3. 按下表得到 ratio。
4. 读取 `docs/posters/<kind>.md` 的 `Prompt`。
5. 将该 prompt 放入本文定义的提示词模板。

## Prompt Assembly

```text
Base ratio / size prompt
+ Poster kind prompt from docs/posters/<kind>.md
+ Topic poster prompt from docs/topics/<category>.md
+ Event facts from current feed
+ Quality requirements from this file
+ Negative constraints from this file
```

图片只表达主题、场景、氛围和事件方向。比分、时间、日期、来源、公司名、队伍名、价格等精确事实必须来自当前 feed，不得由模型补写。

## Base Prompts

### `16:9`

```text
Create a premium 16:9 editorial news cover image, recommended size 1600x900.
Use one clear focal point, strong contrast, premium lighting, and restrained details.
Keep the composition readable for a mobile-first feed card.
Do not add Feeds Hub branding, source badges, category labels, watermarks, or unsupported readable metadata.
```

### `4:5`

```text
Create a premium vertical editorial poster, aspect ratio 4:5, recommended size 1440x1800.
Use strong mobile poster hierarchy: clear top zone, dominant middle focal point, and structured lower information area.
Use cinematic lighting, realistic depth, rich details, and high-end poster finish.
Only include short factual visual labels when those facts are supplied by the current feed.
```

### `4:3`

```text
Create a premium 4:3 structured editorial information cover, recommended size 1600x1200.
Use a clean data, bracket, dashboard, map, timeline, workflow, or architecture composition.
Charts, brackets, panels, and timelines must be symbolic unless exact facts are supplied by the feed.
Do not render fake numbers, fake dates, fake tickers, fake team names, fake official logos, or fake source marks.
```

## Quality Requirements

```text
Highly detailed, premium editorial finish, clean composition, realistic depth, strong focal hierarchy, sharp rendering, and suitable for a professional mobile news feed cover.
Keep readable text minimal.
Only render exact facts that are explicitly supplied by the current feed.
If a fact is not supplied, keep the corresponding information symbolic, abstract, generic, or non-readable.
```

## Poster DSL

- `ratio`: `16:9` | `4:5` | `4:3`
- `size`: follow ratio table
- `format`: `webp` | `pending`
- `layout`: hero / scoreboard / split / poster / bracket / timeline / dashboard / map / workflow
- `focus`: title / score / schedule / player / bracket / market / policy / product / code / data
- `maxLines`: no more than 2 lines, unless `4:3` structured facts are supplied by the feed

## Negative Constraints

```text
No 1:1 feed cover.
No reusable generic template applied to multiple unrelated feeds.
No script-drawn placeholder, Canvas, HTML screenshot, or CSS-generated poster.
No PNG or SVG feed cover or fallback.
No Feeds Hub logo, wordmark, watermark, category tag, source tag, or status pill inside the image.
No fake official logo, team badge, company logo, government seal, ticker, score, date, chart value, API screenshot, or document text.
No model-invented benchmark number, stock price, team name, company name, government badge, official logo, fake UI text, or fake chart value.
```

## Selection

| kind | ratio | prompt file | use |
|---|---:|---|---|
| `match_schedule` | `16:9` | `match_schedule.md` | 体育或电竞赛程、赛前预告、开球节点 |
| `match_result` | `16:9` | `match_result.md` | 体育或电竞赛果、晋级、淘汰 |
| `match_flow` | `4:3` | `match_flow.md` | 比赛进程、官方实时状态、时间线、关键节点 |
| `player_spotlight` | `4:5` | `player_spotlight.md` | 单一球员、选手或人物焦点 |
| `knockout_update` | `4:3` | `knockout_update.md` | 淘汰赛、bracket、晋级路径 |
| `worldcup_feed` | `4:3` | `worldcup_feed.md` | 同一比赛日或同一阶段世界杯结构化汇总 |
| `market_brief` | `16:9` | `market_brief.md` | 市场、指数、板块、财报或宏观简报 |
| `policy_update` | `16:9` | `policy_update.md` | 政策、监管、标准、治理、规则更新 |
| `hot_topic` | `16:9` | `hot_topic.md` | 单一热点事件、发布、争议或关注焦点 |
| `breaking` | `16:9` | `breaking.md` | 已确认的突发重大变化 |
| `insight` | `16:9` | `insight.md` | 来源支持的背景整理或结构化解释 |
| `news` | `16:9` | `news.md` | 默认新闻和普通资讯 |
| `ai` | `16:9` | `ai.md` | AI 主题的结构化聚合或模型/工具更新 |
| `data` | `4:3` | `data.md` | 指数、榜单、图谱、地图、流程、架构、漏斗 |
| `visual` | `4:5` | `visual.md` | 图片主导的专题视觉，不作为默认类型 |

未命中时使用 `news` 和 `16:9`。

赛事卡片不默认使用 `4:5`。赛程预告和比赛战报优先 `16:9`；只有人物焦点、强视觉专题等图片主导内容使用 `4:5`。

## Quick Rules

- 赛事官方页、赛前信息、直播进程、赛果：优先 `match_schedule`、`match_flow`、`match_result`、`knockout_update`。
- 监管、政策、标准、官方文件：优先 `policy_update`。
- 财报、指数、宏观数据、市场报道：优先 `market_brief` 或 `data`。
- 模型、工具、产品、开源发布：优先 `hot_topic`、`ai`、`news`。
- 图表、结构、地图、bracket、时间线或流程：优先 `data`。

## Kind File Shape

每个 `docs/posters/<kind>.md` 必须包含：

```text
ID
Ratio
Use
Dynamic Inputs
Poster DSL Defaults
Prompt
Text Rules
Negative Constraints
```

## GitHub Connector Flow

写入 WebP 必须使用 GitHub connector 的 blob/tree/commit/ref 流程。

- `owner`: `idaibin`
- `repo`: `feeds-hub`
- branch: `content/<task-name>`
- 禁止直接更新 `main`
- 禁止创建 PR

步骤：

1. 确认 `content/<task-name>` 存在；不存在时从当前 `origin/main` commit 创建。
2. 按 `kind` 比例生成高清真实图片。
3. 后处理为 WebP：保持比例、移除 metadata，统一使用 `quality 95`。
4. 如无法生成或写入合规 WebP，保持 `coverStatus: "pending"`。
5. 将最终 WebP 二进制转纯 Base64，禁止 `data:image/webp;base64,` 前缀。
6. 用 `GitHub.create_blob` 创建图片 blob，`encoding=base64`。
7. 读取目标分支最新 `HEAD` commit 和 tree。
8. 用 `GitHub.create_tree` 写入本次实际产物：
   - 生成阶段可只写 Markdown，并保持 `coverStatus: "pending"` 和未来 WebP 路径。
   - 补图阶段新增或替换 `public/images/<category>/<file>.webp`，并将对应 Markdown 设置为 `coverStatus: "generated_webp"`。
   - 删除同名旧 `.svg` 或 `.png`，如存在。
9. 用 `GitHub.create_commit` 创建提交，parent 为目标分支最新 `HEAD`。
10. 用 `GitHub.update_ref` 更新 `refs/heads/content/<task-name>`。
11. 重新读取本次变更的 Markdown 或 WebP 验证，并查询 Vercel commit status。

Markdown 和图片允许分步提交。图片生成失败或暂未生成时，Markdown 可先以 `coverStatus: "pending"` 写入；后续补图提交必须同时写入 WebP 并把对应 Markdown 更新为 `coverStatus: "generated_webp"`。

## Failure Handling

任一步无法可靠完成时：

- 不更新 `main`。
- 不创建 PR。
- 不写入 SVG/PNG fallback。
- 不写入 data URL 前缀。
- Markdown 可继续写入，但必须设置 `coverStatus: "pending"` 并保留未来 WebP 路径。
- 汇报失败点。

## Report

```text
cover: /images/<category>/<file>.webp
coverStatus: generated_webp | pending
coverReason: one short reason
```

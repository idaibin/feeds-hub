# Poster Spec

Feeds Hub 海报、封面格式、GitHub 二进制写入和 pending cover 的唯一规范。其他文档只能引用本文件，不重复定义这些规则。

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
| `16:9` | `1600x900` | `1280x720` | 默认新闻、政策、市场简报、热点 |
| `4:5` | `1440x1800` | `1120x1400` | 赛事赛程、赛果、人物焦点、强视觉海报 |
| `4:3` | `1600x1200` | `1280x960` | 数据图、bracket、时间线、结构化图表 |

禁止 `1:1` 主封面。原始生成使用推荐尺寸或更高同等比例尺寸；最终写入仓库的 WebP 必须小于等于 `300 KB`。

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
3. 后处理为 WebP：保持比例、移除 metadata、压缩到 `300 KB` 以内。
4. 如无法在最低尺寸要求内压到 `300 KB`，保持 `coverStatus: "pending"`，不得写入超限图片。
5. 将最终 WebP 二进制转纯 Base64，禁止 `data:image/webp;base64,` 前缀。
6. 用 `GitHub.create_blob` 创建图片 blob，`encoding=base64`。
7. 读取目标分支最新 `HEAD` commit 和 tree。
8. 用 `GitHub.create_tree` 一次性完成：
   - 新增或替换 `public/images/<category>/<file>.webp`。
   - 修改 `src/content/<category>/<file>.md` 的 `cover`。
   - 设置 `coverStatus: "generated_webp"`。
   - 删除同名旧 `.svg` 或 `.png`，如存在。
9. 用 `GitHub.create_commit` 创建提交，parent 为目标分支最新 `HEAD`。
10. 用 `GitHub.update_ref` 更新 `refs/heads/content/<task-name>`。
11. 重新读取 Markdown 和 WebP 验证，并查询 Vercel commit status。

Markdown 和图片必须处于同一个 commit。禁止只有 Markdown 或只有图片的不完整提交。

## Failure Handling

任一步无法可靠完成时：

- 不更新 `main`。
- 不创建 PR。
- 不写入 SVG/PNG fallback。
- 不写入 data URL 前缀。
- 不创建不完整 tree。
- Markdown 可继续写入，但必须设置 `coverStatus: "pending"` 并保留未来 WebP 路径。
- 汇报失败点。

## Prompt Assembly

```text
Base ratio / size prompt
+ Card type prompt from docs/card-types/README.md
+ Topic poster prompt from docs/topics/<category>.md
+ Event facts from current feed
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

## Report

```text
cover: /images/<category>/<file>.webp
coverStatus: generated_webp | pending
coverReason: one short reason
```

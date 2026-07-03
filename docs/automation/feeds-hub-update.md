# Feeds Hub 自动更新任务

## Authority

本任务遵循：

```text
idaibin/aicraft/docs/standards/cron-automation.md
idaibin/aicraft/docs/standards/github-branching.md
idaibin/aicraft/docs/standards/ai-content-quality.md
idaibin/feeds-hub/docs/repo-scope.md
idaibin/feeds-hub/docs/ui-spec.md
idaibin/feeds-hub/docs/topics/README.md
idaibin/feeds-hub/docs/sources/README.md
idaibin/feeds-hub/docs/editorial/README.md
idaibin/feeds-hub/docs/posters/README.md
idaibin/feeds-hub/docs/posters/type-matrix.md
```

本文件只定义 `Feeds Hub 更新` 自动任务的仓库级执行流程。主题级关注范围、输出格式、来源和跳过条件维护在 `docs/topics/`；主题级信息来源策略维护在 `docs/sources/`；正文写作格式维护在 `docs/editorial/`；海报比例、类型矩阵、黄金风格基准和主题级生图提示词维护在 `docs/posters/`。

自动任务 prompt 只应作为 bootstrap：读取上述通用规范、本仓库 scope、本文件、UI 规范、对应主题文档、对应来源文档、正文格式文档、poster 类型矩阵和对应 poster 文档，然后按文档执行。当前 demo 可由 ChatGPT 定时任务承载，但不要在 ChatGPT 定时任务 prompt 里复制完整业务规则。

## 任务元信息

- 仓库：`idaibin/feeds-hub`
- 生产分支：`main`
- 任务名：`feeds-hub-update`
- 运行频率：每小时
- 时区：`UTC+08:00 / Asia/Shanghai`
- 是否创建 PR：否
- 是否使用仓库 RSS / GitHub Actions 抓取：否
- 是否使用脚本生成图片：否
- 定时生产写入：仅允许通过 AICraft 规范定义的安全 cron 分支流程写入 `main`

## 任务目标

本任务只做短周期信息流内容更新：搜索公开信息，按主题审查，去重，生成短摘要和 WebP 主封面，并写入 Feeds Hub 静态站点内容目录。

## 主题规则

执行前必须读取：

```text
docs/topics/README.md
docs/topics/<category>.md
```

默认主题与 `src/lib/feeds.ts` 的 `CATEGORIES` 保持一致：

```text
worldcup
lol
stock
ai
global
rust
product
```

主题细节不得继续堆入本文件；新增或调整主题规则时，更新对应 `docs/topics/<category>.md`。

## 来源规则

搜索信息前必须读取：

```text
docs/sources/README.md
docs/sources/<category>.md
```

要求：

- Level 1 来源优先作为事实依据。
- Level 2 来源可作为事实补充和交叉验证。
- Level 3 来源只用于判断网络热度或社区关注度，不能单独作为事实依据。
- 热度只用于排序和是否写入，不用于正文解释。
- 正文只写事实、当前状态和待确认信息。
- 股市主题可以补充市场情绪：上涨、下跌、分化、震荡、偏热或偏冷。

## 正文格式规则

生成 Markdown 前必须读取：

```text
docs/editorial/README.md
docs/editorial/content-format.md
```

正文规则：

- 标题只写核心事实。
- 副标题补充来源、范围或状态。
- 摘要只写一句事实摘要。
- 正文优先 2 段，最多 3 段。
- 禁止写主观判断、未经来源支持的推断、操作建议、赛果推测或产品成功判断。
- 禁止把社交热度写成事实。
- 长背景和观点内容应放到 blog，不放到 Feeds Hub。

## Poster Prompt 规则

生成主封面前必须读取：

```text
docs/posters/README.md
docs/posters/type-matrix.md
docs/posters/<category>.md
```

生图提示词按以下顺序组合：

```text
Base prompt with ratio and size
+ Confirmed golden style baseline from docs/posters/type-matrix.md
+ Type prompt from docs/posters/type-matrix.md
+ Category prompt from docs/posters/<category>.md
+ Kind prompt from docs/posters/<category>.md or type-matrix.md
+ Event facts from current feed frontmatter and body
+ Negative constraints
```

约束：

- `docs/ui-spec.md` 负责比例、卡片渲染、图片格式、页面读取 `cover` 等结构规则。
- `docs/posters/type-matrix.md` 负责移动端优先的比例、尺寸、黄金风格基准和类型化提示词。
- `docs/posters/<category>.md` 负责主题特色、话题线索、热度表达、风格提示词和负面约束。
- 主封面必须由 ChatGPT 图像生成能力逐张生成，不能用 Python、Pillow、SVG、Canvas、HTML 截图、GitHub Actions 或任何确定性脚本生成图片。
- 每条 feed 必须单独生成海报，禁止同一张通用模板图批量复用到多条 feed。
- 图片必须达到高质感视觉海报水平：电影感、强光影、真实场景或高质量 3D/信息图场景、清晰细节、稳定构图、清楚主体。
- 图片只表达主题、场景、氛围和事件方向。
- 世界杯 / LOL 赛事类 feed 可以在图片中使用当前 feed 已验证的比分、对阵、晋级和下一轮信息；不得让模型补写、改写或推测事实。
- AI、股市、Rust、产品和全球新闻默认不在图中使用大量正文，除非当前 feed 明确是 `visual` 或 `data`。
- 新增主题时，必须同步新增 `docs/topics/<category>.md` 和 `docs/posters/<category>.md`。

## UI 和图片规范

UI、移动端体验、Header 主题切换、海报比例、图片格式和 cover 渲染规则统一以：

```text
docs/ui-spec.md
docs/posters/type-matrix.md
```

为准。本文件只保留内容写入和验证流程。

自动任务必须按以下当前 UI 约束生成内容和封面：

- 所有信息流 card 使用同一个 Card Shell。
- 所有信息流 card 在同一断点内等宽，PC 端使用等宽网格，card 之间必须保留固定 gap，移动端随容器收缩为单列。
- `kind` 和 Card Type 表达内容类型，并决定图片比例；不改变 card 宽度或列表布局。
- 默认新闻类主封面使用 `16:9`。
- 世界杯 / LOL 赛事海报类主封面可使用 `4:5`。
- 数据图、bracket、时间线、结构化图表类主封面可使用 `4:3`。
- 禁止使用 `1:1` 作为 feed 主封面。
- 海报图片内不生成 Feeds Hub logo、Feeds Hub wordmark、Feeds Hub 品牌角标、水印、分类、来源或状态标签。
- 如需展示品牌、分类、来源或状态标识，只能由 card 组件或 CSS 覆盖层承载，不能烘焙进图片。

## 允许修改

普通定时内容更新只允许修改：

```text
src/content/<category>/*.md
public/images/<category>/*.webp
```

用户明确要求更新任务规则时，才允许修改：

```text
docs/automation/feeds-hub-update.md
docs/repo-scope.md
docs/topics/**
docs/sources/**
docs/editorial/**
docs/posters/**
docs/ui-spec.md
AGENTS.md
README.md
scripts/validate-feeds.mjs
package.json
src/content.config.ts
src/components/FeedCard.astro
src/pages/feed/[...slug].astro
```

## 禁止修改

除非用户明确要求，禁止修改：

```text
src/components/**
src/pages/**
src/layouts/**
src/lib/**
docs/ui-spec.md
AGENTS.md
```

说明：上面的禁止路径约束默认适用于定时内容更新运行。人工维护主题规范、来源策略、正文格式、海报模板、展示规范、校验脚本或仓库协作规则时，可以在用户明确要求下修改对应 docs、`AGENTS.md`、`README.md`、`scripts/validate-feeds.mjs`、`package.json` 和指定源码文件，但仍不得把这些改动混入普通内容更新提交。

也禁止把通用 AI 自动化规范写入本仓库；通用规范属于 `idaibin/aicraft`。

## 执行流程

1. 读取 AICraft 通用规范、本仓库 scope、本文件、`docs/ui-spec.md`、`docs/topics/README.md`、`docs/sources/README.md`、`docs/editorial/README.md`、`docs/posters/README.md` 和 `docs/posters/type-matrix.md`。
2. 按本轮主题读取对应 `docs/topics/<category>.md`。
3. 按本轮主题读取对应 `docs/sources/<category>.md`。
4. 按本轮主题读取对应 `docs/posters/<category>.md`。
5. 读取 `docs/editorial/content-format.md`。
6. 按来源规则搜索公开信息并记录来源。
7. 按主题规则和来源规则审查事实、热度、信息价值、去重，决定写入或跳过。
8. 有有效内容时按正文格式规则写入 Markdown。
9. 按 poster prompt 组合顺序，使用 ChatGPT 图像生成能力生成 WebP 主封面。
10. 人工或模型自检图片是否符合 `docs/posters/type-matrix.md` 和 `docs/posters/<category>.md`，不合格则重新生成，不提交占位图或脚本图。
11. 执行 `pnpm run validate:feeds`。
12. 执行 `pnpm run check` 和 `pnpm run build`。
13. 使用固定提交信息写入目标分支或生产分支。

## 路径规则

内容写入：

```text
src/content/<category>/<yyyy-mm-dd>-<slug>.md
```

主封面写入：

```text
public/images/<category>/<yyyy-mm-dd>-<slug>.webp
```

frontmatter `cover` 使用：

```text
/images/<category>/<yyyy-mm-dd>-<slug>.webp
```

禁止使用：

- `src/content/feeds/**`
- `/images/feeds/**`
- `cover` 里带 `public`

## Frontmatter 必填字段

每条 Markdown 必须包含：

```yaml
title: string
subtitle: string
category: worldcup | lol | stock | ai | global | rust | product
kind: match_result | match_schedule | match_flow | player_spotlight | knockout_update | worldcup_feed | hot_topic | market_brief | policy_update | news | breaking | insight | ai | data | visual
topic: string
date: ISO datetime with +08:00 offset
eventAt: ISO datetime with +08:00 offset
eventKey: string
cover: string
tags: string[]
summary: string
source: string
sourceUrl: string
reviewed: true
priority: number
```

## 去重规则

发布前必须依次检查：

1. `eventKey` 是否已存在。
2. 规范化后的 `sourceUrl` 是否已存在；重复 `sourceUrl` 只作为人工审查线索，不作为 `validate:feeds` 硬性失败条件。
3. 最近 7 天同 `category`、`kind`、核心主体、`eventAt` 是否重复。
4. 标题是否只是旧内容改写。

`eventKey` 是硬去重字段。同一来源页可能持续更新多个事实，因此允许不同事件共用同一个可核验 `sourceUrl`；同一事件的后续项只有在包含明确新事实时才允许写入。

## 验证规则

提交前必须验证：

- Markdown frontmatter 完整。
- `category` 属于 `src/lib/feeds.ts` 和 `src/content.config.ts` 定义的主题。
- `date` 和 `eventAt` 使用 `+08:00` 偏移。
- `source` 与 `sourceUrl` 符合 `docs/sources/<category>.md`。
- `sourceUrl` 不能是搜索结果页、无法核验的截图或无事实依据的社交讨论。
- 标题、副标题、摘要和正文符合 `docs/editorial/content-format.md`。
- 正文未写主观判断、未经来源支持的推断、操作建议、赛果推测或产品成功判断。
- 股市内容如写市场情绪，必须来自可核验的市场数据或可信报道。
- `cover` 路径不包含 `public`。
- 主封面文件存在于 `public/images/<category>/*.webp`。
- 主封面图片比例和尺寸符合 `docs/posters/type-matrix.md`。
- 主封面由 ChatGPT 图像生成能力逐张生成，不是脚本图、模板图、占位图或 GitHub Actions 生成图。
- 主封面符合 `docs/posters/README.md`、`docs/posters/type-matrix.md` 和 `docs/posters/<category>.md`。
- 主封面没有 Feeds Hub logo、wordmark、水印、分类角标、来源角标或状态标签。
- 主封面没有伪造官方 logo、队徽、公司 logo、政府印章或来源标识。
- 页面仍读取 `entry.data.cover` 渲染图片海报，而不是用 CSS/HTML 生成海报替代图片。
- `reviewed: true` 只用于已审查内容。
- `eventKey`、`sourceUrl`、核心主体和 `eventAt` 已完成去重检查；重复 `sourceUrl` 为人工审查线索，重复 `eventKey` 为 error。
- 本轮没有把普通内容更新与规则、UI 或文档调整混在一起提交。

## 提交信息

最终写入 `main` 的普通内容更新提交信息固定为：

```text
content: update feeds
```

规则、UI 或文档维护必须独立提交，不能与普通内容更新合并。

## 汇报格式

每次汇报需要说明：

- 更新了哪些主题。
- 哪些主题跳过。
- 跳过原因。
- 使用了哪些主要来源。
- 是否使用 Level 3 热度来源。
- 是否生成图片。
- 主封面格式。
- `cover` 路径。
- 使用的 `docs/posters/README.md`、`docs/posters/type-matrix.md` 和 `docs/posters/<category>.md`。
- `pnpm run validate:feeds` 结果。
- `pnpm run check` 和 `pnpm run build` 结果。
- 是否创建 PR。该项必须为否，除非用户明确要求。

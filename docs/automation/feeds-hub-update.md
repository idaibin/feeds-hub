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
```

本文件只定义 `Feeds Hub 更新` 自动任务的仓库级执行流程。主题级关注范围、输出格式、来源和跳过条件维护在 `docs/topics/`；主题级信息来源策略维护在 `docs/sources/`；正文写作格式维护在 `docs/editorial/`。

ChatGPT 定时任务 prompt 只应作为 bootstrap：读取上述通用规范、本仓库 scope、本文件、UI 规范、对应主题文档、对应来源文档和正文格式文档，然后按文档执行。不要在 ChatGPT 定时任务 prompt 里复制完整业务规则。

## 任务元信息

- 仓库：`idaibin/feeds-hub`
- 生产分支：`main`
- 任务名：`feeds-hub-update`
- 运行频率：每小时
- 时区：`UTC+08:00 / Asia/Shanghai`
- 是否创建 PR：否
- 是否使用仓库 RSS / GitHub Actions 抓取：否
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

## UI 和图片规范

UI、移动端体验、Header 主题切换、16:9 横图海报比例、图片格式和 cover 渲染规则统一以：

```text
docs/ui-spec.md
```

为准。本文件只保留内容写入和验证流程。

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
docs/ui-spec.md
AGENTS.md
README.md
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

说明：上面的禁止路径约束默认适用于定时内容更新运行。人工维护主题规范、来源策略、正文格式、海报模板、展示规范或仓库协作规则时，可以在用户明确要求下修改对应 docs、`AGENTS.md`、`README.md` 和指定源码文件，但仍不得把这些改动混入普通内容更新提交。

也禁止把通用 AI 自动化规范写入本仓库；通用规范属于 `idaibin/aicraft`。

## 执行流程

1. 读取 AICraft 通用规范、本仓库 scope、本文件、`docs/ui-spec.md`、`docs/topics/README.md`、`docs/sources/README.md` 和 `docs/editorial/README.md`。
2. 按本轮主题读取对应 `docs/topics/<category>.md`。
3. 按本轮主题读取对应 `docs/sources/<category>.md`。
4. 读取 `docs/editorial/content-format.md`。
5. 按来源规则搜索公开信息并记录来源。
6. 按主题规则和来源规则审查事实、热度、信息价值、去重，决定写入或跳过。
7. 有有效内容时按正文格式规则写入 Markdown。
8. 生成 WebP 主封面。
9. 验证 frontmatter、路径、cover 文件、来源、正文格式、去重键和构建结果。
10. 使用固定提交信息写入目标分支或生产分支。

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
kind: match_result | match_schedule | hot_topic | market_brief | policy_update
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
2. 规范化后的 `sourceUrl` 是否已存在。
3. 最近 7 天同 `category`、`kind`、核心主体、`eventAt` 是否重复。
4. 标题是否只是旧内容改写。

同一事件的后续项只有在包含明确新事实时才允许写入。

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
- 主封面文件存在。
- 主封面使用 16:9 横图，推荐尺寸为 `1600x900`，最低不低于 `1280x720`。
- 主封面不是 1x1、透明、空白或通用占位图。
- 页面仍读取 `entry.data.cover` 渲染图片海报，而不是用 CSS/HTML 生成海报替代图片。
- `reviewed: true` 只用于已审查内容。
- `eventKey`、`sourceUrl`、核心主体和 `eventAt` 已完成去重检查。
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
- 验证命令和结果。
- 是否创建 PR。该项必须为否，除非用户明确要求。

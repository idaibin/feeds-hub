# ChatGPT 自动更新规范

本仓库只负责展示信息流内容，不在仓库内配置 RSS 抓取任务，也不通过 GitHub Actions 抓取内容。

## 更新方式

由 ChatGPT 自动任务每小时执行一次：

1. 搜索公开信息。
2. 按主题分别审查。
3. 去重并确认新增事实。
4. 生成中文摘要。
5. 为每条信息生成高度相关的 WebP 主封面。
6. 写入 GitHub 仓库。
7. 当前没有可靠内容时，先回溯最近 1 小时；仍没有则回溯最近 1 天；仍无可靠内容则跳过。

## 当前目标仓库

```text
idaibin/feeds-hub
```

## 当前目标分支

```text
main
```

自动任务允许写入生产分支，但每轮最终推送到 `main` 时只能形成一个本轮更新提交。禁止创建 PR。

## 默认主题

### 世界杯

- 默认年份：2026
- 重点内容：赛程、比赛结果、焦点球队、关键新闻
- 分类 ID：`worldcup`

### LOL 赛事

- 重点内容：LPL、先锋赛、MSI、世界赛、重点比赛、赛后评价
- 分类 ID：`lol`

### 股市简报

- 重点内容：A 股、美股、创业板、纳斯达克、重要指数、市场新闻
- 分类 ID：`stock`

### AI 科技

- 重点内容：AI 公司、模型、开源项目、工程工具、产品动态
- 分类 ID：`ai`

### 全球重点简报

- 重点内容：全球范围内值得关注的综合新闻
- 分类 ID：`global`

### 开源与 Rust 工程

- 重点内容：Rust、开源项目、工程工具、基础设施与开发者生态
- 分类 ID：`rust`

### 创业与产品设计

- 重点内容：创业、产品设计、增长、用户体验与商业化
- 分类 ID：`product`

## 审查规则

每个主题独立审查：

1. 标题必须明确。
2. 摘要必须能说明核心信息。
3. 来源必须可追溯。
4. 不写入重复内容。
5. 不确定的信息必须降级为“待确认”，不能写成事实。
6. 没有可靠新增内容时，按 1 小时、1 天的顺序回溯。
7. 股市内容只做市场信息整理，不做个性化投资建议。

## 去重规则

每条候选内容必须尽量提取事件实际发生时间 `eventAt`，不要只依赖新闻发布时间。

发布前生成内部去重指纹 `eventKey`，建议由以下字段组成：

```text
category + kind + mainEntity + secondaryEntity + eventAt + topic
```

如果 `eventKey` 已存在，默认不发布。只有出现明确新增事实时，才允许作为后续更新发布，并在 `summary` 中说明新增点。

发布前还必须检查：

1. 规范化后的 `sourceUrl` 是否已存在。
2. 同一赛事、同一公告、同一市场事件、同一产品发布或同一版本发布是否已发布。
3. 标题和摘要是否只是旧内容改写。
4. 是否只有评论、转述、二次报道，没有新增事实。

## 海报规则

每条信息必须有对应主封面：

1. 默认使用 WebP 主封面，不再默认使用 SVG。
2. 主封面必须围绕当前这条信息，不使用通用占位图。
3. 世界杯、LOL、AI 科技、全球重点简报优先使用真实感、现场感、新闻封面风格的 WebP。
4. 股市、开源与 Rust、创业与产品设计可根据内容选择 WebP 或 SVG；结构化图表和纯信息图可使用 SVG。
5. 标题、副标题、时间、来源、标签等文字默认由前端或模板层叠加，避免图片模型生成乱码文字。
6. 不强制复现真实人物身份、官方队徽、官方赛事素材、真实战队 Logo 或游戏官方角色。

## 写入格式

内容写入：

```text
src/content/<category>/<yyyy-mm-dd>-<slug>.md
```

WebP 主封面物理文件写入：

```text
public/images/<category>/<yyyy-mm-dd>-<slug>.webp
```

页面和 frontmatter 中的 `cover` 使用浏览器可访问路径：

```text
/images/<category>/<yyyy-mm-dd>-<slug>.webp
```

注意：`public` 是 Astro 静态资源物理目录，不写入 `cover`。不要再使用 `feeds` 中间目录。

如需 SVG 兜底或纯信息图，可额外写入：

```text
public/images/<category>/<yyyy-mm-dd>-<slug>.webp
```

Markdown frontmatter 必须包含：

```yaml
title: "标题"
subtitle: "副标题"
category: "worldcup | lol | stock | ai | global | rust | product"
kind: "match_result | match_schedule | hot_topic | market_brief | policy_update"
topic: "主题"
date: "ISO 时间"
eventAt: "ISO 时间"
eventKey: "category:kind:mainEntity:secondaryEntity:eventAt:topic"
cover: "/images/<category>/<file>.webp"
tags:
  - "标签"
summary: "摘要"
source: "来源名称"
sourceUrl: "来源链接"
reviewed: true
priority: 0
```

## 跳过规则

出现以下情况，当前主题本轮跳过：

- 没有新增信息。
- 来源不可靠。
- 信息互相矛盾且无法确认。
- 只有传言，没有权威来源。
- 与主题无关。
- 已存在相同事件、相同来源或相同标题。

## 提交要求

提交信息格式：

```text
content: update feeds
```

每次提交需要说明：

- 更新了哪些主题。
- 哪些主题跳过。
- 跳过原因。
- 是否生成图片。
- 主封面格式。
- cover 路径。
- 是否创建 PR。该项必须为否。

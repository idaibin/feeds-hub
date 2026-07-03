# Poster Prompts

本目录维护 Feeds Hub 各主题的海报生成提示词。它只负责图片语义、尺寸比例和类型化提示词，不负责事实承载。

## Prompt 组合顺序

每次生成主封面时，按主题文档、类型矩阵和当前 feed 信息内容共同确定提示词。组合顺序如下：

```text
Base prompt by ratio from docs/posters/type-matrix.md
+ Type prompt from docs/posters/type-matrix.md
+ Category prompt from docs/posters/<category>.md
+ Kind prompt from docs/posters/<category>.md
+ Event facts
+ Negative constraints
```

禁止把同一张通用模板图批量复用到多条 feed。每条 feed 必须按自己的 `category`、`kind`、`topic`、`title`、`summary` 和正文事实单独生成海报。

## Base prompt

Base prompt 不再固定为 `16:9`。生成前必须先从 `docs/posters/type-matrix.md` 推导比例和尺寸：

```text
16:9 -> 1600x900, minimum 1280x720
4:5  -> 1440x1800, minimum 1120x1400
4:3  -> 1600x1200, minimum 1280x960
```

`1:1` 不用于 feed 主封面。

## Event facts 输入

自动任务生成图片前，应从当前 feed frontmatter 和正文中抽取事实，但只用于控制画面方向：

```text
category:
kind:
ratio:
recommendedSize:
topic:
title:
subtitle:
eventAt:
source:
summary:
hotness:
bodyFacts:
```

其中：

- `category` 决定读取 `docs/posters/<category>.md`。
- `kind` 决定采用赛事结果、赛程、比赛进程、球员焦点、淘汰赛进展、市场简报、政策更新或普通新闻结构。
- `ratio` 和 `recommendedSize` 必须来自 `docs/posters/type-matrix.md`。
- `hotness` 只影响视觉强度，不改变事实判断。

## 事实承载原则

图片只表达主题和氛围。精确事实仍由 frontmatter 和页面文本承担。

图片内不要依赖以下信息：

- 比分
- 时间
- 日期
- 来源
- 公司名
- 队伍名
- 股票价格
- 政策编号
- 精确地名

例外：当 `match_result`、`match_schedule`、`match_flow`、`knockout_update` 或 `worldcup_feed` 的精确事实已由 feed 明确提供时，可把少量事实作为视觉文案使用，但页面文本仍是事实来源。

可以使用抽象或弱文字元素，例如模糊屏幕、无可读字符的票据、无品牌 UI、通用数据面板。

## Kind prompt

通用 kind prompt 以 `docs/posters/type-matrix.md` 为准；主题级差异在 `docs/posters/<category>.md` 中补充。

必须覆盖以下 kind：

```text
match_result
match_schedule
match_flow
player_spotlight
knockout_update
worldcup_feed
hot_topic
market_brief
policy_update
news
breaking
insight
ai
data
visual
```

## 全局负面约束

```text
No 1:1 feed cover.
No reusable generic template applied to multiple unrelated feeds.
No readable exact facts unless supplied by the feed.
No fake scores, no fake dates, no fake company names, no fake source logos.
No copyrighted character likeness, no exact team badges, no government seals.
No Feeds Hub logo, no Feeds Hub wordmark, no Feeds Hub brand badge, no watermark, no source badge.
No investment advice visuals, no buy/sell signals, no guaranteed outcome symbols.
No sensational gore, disaster exploitation, hate symbols, or entertainment-style treatment of serious news.
No cluttered PPT style, no text-heavy poster, no duplicated article title, no low-effort placeholder image.
No top-left Feeds Hub logo, no top-left Feeds Hub wordmark, no top-left Feeds Hub brand badge.
No top-right theme, no top-right category label, no top-right topic tag, no top-right source tag, no top-right status pill.
No top-left or top-right metadata of any kind inside the image; the feed card already displays metadata below the image.
```

## 品牌与标签规则

海报就是海报。图片生成阶段不要把 Feeds Hub、主题分类、来源、状态标签或任何品牌标识写进图片。

尤其禁止：

- 左上角 Feeds Hub logo、Feeds Hub wordmark、Feeds Hub 品牌角标。
- 右上角主题、分类、来源、状态标签。
- 为这些元素预留的空白 header 区或胶囊位。

如果后续需要在卡片上展示品牌、分类、来源或状态标识，只能由页面组件和 CSS 在 card 层实现，不能烘焙进海报图片。

## 质量检查

已生成海报必须同时符合：

```text
docs/posters/type-matrix.md
docs/posters/quality.md
pnpm run validate:feeds
```

自动验证检查内容结构、cover 路径、对应主题 poster 文档是否存在、WebP 文件是否存在、WebP 尺寸和比例是否符合 type matrix。人工审查仍需检查图片语义、是否出现错误文字、是否复用通用模板。

## 文件

- `type-matrix.md`
- `quality.md`
- `worldcup.md`
- `lol.md`
- `stock.md`
- `ai.md`
- `global.md`
- `rust.md`
- `product.md`

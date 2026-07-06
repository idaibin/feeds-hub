# Poster Visual Hierarchy

本文件定义 Feeds Hub 海报的视觉层级和信息压缩规则。目标是避免 posterBrief 只保证事实正确，却输出工程化、堆信息、缺少设计收敛的海报。

## Principle

海报必须先做信息压缩，再做视觉表达：

```text
verified facts -> posterBrief -> visual hierarchy -> profile prompt -> quality gate
```

- `posterBrief` 解决事实准确。
- `visual hierarchy` 解决视觉主次。
- `quality-gate` 解决验收和失败降级。

不要把所有 facts 都画到图里。海报只展示能支撑用户一眼理解的核心信息；完整细节放 Markdown 正文。

## Visual Weight

每张海报必须给主要信息分配视觉权重。权重不是字号绝对值，而是用户第一眼看到的优先级。

| Rank | Element | Weight | Rule |
| --- | --- | ---: | --- |
| 1 | primary data | 100 | 比分、赛程时间、核心标题或 bracket 路径，只能有一个视觉核心 |
| 2 | matchup / entity | 70 | 队伍、公司、产品、国家或关键主体 |
| 3 | event context | 40 | 阶段、状态、时间、format、topic |
| 4 | details | 25 | BO5 分局、进球、bullet、摘要模块 |
| 5 | footer | 10 | source、legend、日期等公开信息 |

禁止 footer、装饰标签、标题大字、背景主体或光效抢过 rank 1。

## Layout Zones

### default

```text
TOP: source/topic label, very small
CENTER: headline, primary visual focus
LOWER: 2-4 compressed info modules
FOOTER: source only
```

### sports_card

```text
TOP: event + stage + status, compact
CENTER: matchup + score or VS, primary visual focus
LOWER: time + format + required sports details
FOOTER: source only
```

### sports_bracket

```text
TOP: event + stage, compact
CENTER: bracket grid + path lines, primary visual focus
LOWER: legend + dates + source, compact
```

布局区不可互相抢占。尤其是 `sports_card`：标题区不能变成视觉中心，BO5 和分局不能比比分更强，来源不能成为大横幅。

## Sports Card Compression

单场赛事结果图必须按以下信息压缩：

| Area | Content | Max density |
| --- | --- | --- |
| top band | event.name, stage, status | 1 line + 1 small tag |
| center | team A, score, team B | only matchup + score |
| lower meta | format, eventAt | 1 compact row |
| detail row | goals or games | max 3-5 compact chips |
| result note | winner / advancement | 1 short phrase |
| footer | sourceName | 1 small line |

LOL BO5 结果必须展示分局，但分局应是紧凑 chip，不应做成三个巨大卡片抢走比分焦点。

足球结果必须展示进球纪录，但进球纪录应压缩为短行，不应压过比分。

## Expected Sports Card Archetype

用于比赛结果时，优先采用以下结构，而不是自由海报结构：

```text
[small event/stage/status]

[TEAM A card]   [BIG SCORE]   [TEAM B card]

[format + time]

[G1 winner] [G2 winner] [G3 winner] [G4 winner] [G5 winner]

[result note]

[source]
```

视觉要求：

- 分数必须是中心最大视觉元素。
- 左右队伍卡片只承载队名或短名，不放真实 logo，除非提供素材。
- 分局结果应作为横向 chips，不应成为第二套主视觉。
- 背景可以有电竞舞台、体育场、奖杯或光效，但透明度和对比度必须服务数据可读性。
- 不要用大型 trophy、人物剪影、装饰徽章或粒子效果抢过比分。

## Anti-patterns

以下输出即使看起来精致，也判定为不合格：

- 标题、状态标签或“比赛结束”比比分更抢眼。
- BO5、G1/G2/G3 卡片面积过大，导致比分不再是唯一视觉核心。
- 海报像 dashboard 截图，信息很多但没有主视觉。
- 海报像宣传 KV，光效和背景强，但数据弱。
- 出现无意义小字、假 UI、假 logo、假赞助、假表格、假战队标识。
- footer 显示 profile、尺寸、格式等生产元信息，除非用于内部验收图，不得进入正式海报。

## Visual Compression Rules

每张海报生成前必须执行：

1. 选择一个 `primaryData`。
2. 删除或降级所有会抢 `primaryData` 的文字。
3. 将 secondary facts 压缩成 1 行或 chips。
4. 将 tertiary facts 放到底部或正文，不强行进图。
5. 将装饰、背景、光效压低到不影响可读性。

示例：LOL BO5 结果图。

```yaml
primaryData: "HLE 3-0 G2"
secondaryFacts:
  - "MSI 2026 胜者组第二轮"
  - "BO5 · 2026-07-05 17:00 KST"
tertiaryFacts:
  - "G1 HLE"
  - "G2 HLE"
  - "G3 HLE"
resultNote: "HLE 横扫晋级"
footer: "LoL Esports"
```

图中应该先看见 `3-0`，再看见 HLE/G2，再看见 BO5 和 G1-G3。

## Prompt Requirements

每个 profile prompt 必须显式包含：

```text
Apply visual hierarchy before rendering. Use only one primary visual focus. Compress secondary facts into chips or compact rows. Do not render every fact at equal weight. Do not let title, footer, background, BO5 labels, game chips, or decorative UI compete with the primary data.
```

## Quality Gate Extension

quality gate 必须额外判断：

- 是否只有一个 primary visual focus。
- 是否符合 profile 的 Layout Zones。
- 是否出现生产元信息进入正式海报。
- 是否有 details 抢走 primary data。
- 是否因为背景、光效、装饰、奖杯或人物主体导致数据可读性下降。

任一失败时，使用 `visual_hierarchy_failed` 或 `visual_compression_failed` 作为 `coverReason`。

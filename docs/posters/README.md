# Posters

Feeds Hub 海报图片规则入口。本文件定义 profile 选择、统一输入、图片格式、pending cover 和失败边界；具体 prompt profile 拆分到同目录文件，质量门槛和视觉层级见 [`quality-gate.md`](quality-gate.md) 与 [`visual-hierarchy.md`](visual-hierarchy.md)。

## Core

- 海报生成不强制；无法生成合规图片时返回 `coverStatus: "pending"` 和未来 WebP 目标路径。
- 主封面只允许真实 WebP。禁止 SVG、PNG、Canvas、HTML 截图、CSS 或脚本绘图冒充主封面。
- prompt 只定义画面能力和边界；事实、比分、赛程、进球、BO5 局分、晋级路径全部从外部结构化数据传入。
- prompt、profile、ratio、layout、focus、maxLines、关键词、画面说明和生成要求都是生成指令，不是可见海报文案。
- 图片生成前必须先压缩为结构化输入和视觉层级；不要把完整新闻正文、网页正文或长 Markdown 直接交给图片模型。
- 虎扑、X、Reddit 等平台内容只用于提炼场外情绪、选手评价、网友看法、情绪接受度、乐观/悲观倾向、用户反应和市场关注点，决定色调、张力和氛围，不直接生成事实。
- 赛事类硬事实必须来自官方赛程、官方比赛中心、官方赛果或权威通讯社；社区情绪不能覆盖比分、赛程、胜负、晋级、阵容或下一轮关系。
- AI、产品、政策和公司策略类硬事实必须来自官方页面、权威媒体、论文、GitHub release 或公告；Reddit 只能补充用户/开发者反应、争议点、接受度、乐观/悲观倾向和背景市场情绪。
- 未传入的信息不得编造。

## Paths

图片文件：

```text
public/images/<category>/<yyyy-mm-dd>-<slug>.webp
```

frontmatter `cover`：

```text
/images/<category>/<yyyy-mm-dd>-<slug>.webp
```

禁止在 `cover` 中写 `public`、`/images/feeds/` 或 data URL。

## Status

```text
generated_webp
pending
```

- `generated_webp`：真实 WebP 已生成并匹配目标路径。
- `pending`：本轮无法生成合规 WebP。

`pending` 时保留未来 WebP 目标路径。列表页按纯文本卡片展示，详情页可由组件 fallback 承接缺失图片。

生成图片如果露出提示词、规格标签、模板说明、占位模块、重复 fallback 或与 profile 不符的构图，必须视为失败并保持 `pending`。

## Profile Selection

```ts
if (!isSports) return "default";
if (isSportsBracket || isMultiMatchPath) return "sports_bracket";
return "sports_card";
```

判定规则：

- `isSports`：topic YAML `flows` 包含 `sports`，或 `kind` 为赛事类。
- `isSportsBracket`：`kind` 为 `knockout_update`、`worldcup_feed` 或输入包含 `paths` / bracket 结构。
- `isMultiMatchPath`：输入包含多场 `matches`、上下半区、淘汰路径或决赛路径。
- 其它全部使用 `default`。

## Input Contract

```yaml
poster:
  profile: default | sports_card | sports_bracket
  ratio: 16:9 | 4:5
  layout: hero | dashboard | scoreboard | timeline | bracket | list
  focus: headline | score | schedule | progress | result | bracket
  maxLines: 2

content:
  title: ""
  subtitle: ""
  summary: ""
  bullets: []

facts:
  sourceName: ""
  sourceUrl: ""
  eventAt: ""
  category: ""
  topic: ""
  flows: []

socialMood:
  enabled: true
  sources:
    - hupu
    - x
    - reddit
  mood: excited | regret | tense | calm | controversial | comeback | upset | celebration
  keywords: []
  playerEvaluation: []
  marketSignals: []
  optimismSignals: []
  pessimismSignals: []
  acceptanceSignals: []
  summary: ""
```

可选赛事输入：

```yaml
event:
  name: ""
  stage: ""
  status: scheduled | live | final
  format: ""
  eventAt: ""

teams:
  - name: ""
    shortName: ""
    score: null
  - name: ""
    shortName: ""
    score: null

result:
  winner: ""
  scoreText: ""

goals: []
cards: []
penalties: []
games: []
mvp: ""
keyEvents: []

matches:
  - id: ""
    stage: ""
    teamA: ""
    teamB: ""
    scoreA: null
    scoreB: null
    status: scheduled | live | final
    winner: ""
    nextMatchId: ""

paths:
  - from: ""
    to: ""
```

## Profiles

- [`default`](default.md)：常规新闻、AI 新闻、股市信息、开发圈新闻、政策信息、综合资讯、普通快报、数据摘要。
- [`sports_card`](sports_card.md)：单场赛程、单场前瞻、单场进度、单场结果、足球赛果、LOL BO5 赛果。
- [`sports_bracket`](sports_bracket.md)：整体晋级图、淘汰赛路径图、上下半区对阵图、多场比赛进度汇总、决赛路径展示。
- [`visual-hierarchy`](visual-hierarchy.md)：海报视觉主次、信息压缩和反模式。
- [`quality-gate`](quality-gate.md)：海报验收、重试和 pending 降级规则。

## Social Mood

`socialMood` 只影响整体氛围，不改变事实。赛事类可从虎扑提取选手评价、用户情绪、讨论热度和市场关注点，作为海报色调、张力、文案背景和正文补充参考。AI、产品、政策和公司策略类可从 Reddit 提取网友看法、情绪接受度、乐观/悲观倾向、开发者疑虑、使用反馈和背景市场反应，作为海报与正文的背景参考。

| mood | tone | contrast | motion | colors |
| --- | --- | --- | --- | --- |
| `excited` | bright | high | strong | warm / gold / red |
| `celebration` | victory | high | strong | gold / team color |
| `regret` | restrained | low | weak | blue / gray / desaturated |
| `tense` | dramatic | high | medium | dark / red / blue |
| `controversial` | sharp | high | medium | dark / split-color |
| `comeback` | dramatic | high | strong | red / gold / electric blue |
| `upset` | shocking | high | strong | dark / neon / warning accent |
| `calm` | neutral | medium | low | navy / white / muted gold |

## WebP Output

海报生成成功时必须输出真实 WebP 二进制：

- `default` 和 `sports_bracket`：`16:9`，推荐 `1600x900`，最低 `1280x720`。
- `sports_card`：`4:5`，推荐 `1440x1800`，最低 `1120x1400`。
- 移除 metadata。
- 统一使用 `quality 95`。
- 禁止 `data:image/webp;base64,` 前缀进入文件内容或 frontmatter。

生成后必须按 `quality-gate.md` 实际查看图片。尺寸、路径和 WebP 格式全部正确，但画面仍然像模板截图、prompt 草稿、占位图或重复 fallback 时，不得标记为 `generated_webp`。

体育海报允许使用官方或权威来源可核验的国家/战队 Logo、队徽、旗帜、球员/选手肖像、阵容、进球、MVP 和赞助标识。无法从官方赛程、官方比赛中心、官方队伍/赛事页面、官方视觉资产或权威通讯社/图片来源核验时，不得编造；必须降级为文字标签、缩写、抽象色块或中性徽章。

Markdown 和图片允许分步产出。图片生成失败或暂未生成时，返回 `coverStatus: "pending"` 并保留未来 WebP 路径；后续补图成功后返回 `coverStatus: "generated_webp"`。

## Failure Handling

图片无法可靠生成或后处理时：

- 不写入 SVG/PNG fallback。
- 不写入 data URL 前缀。
- 不输出脚本绘制、HTML 截图、CSS 生成或 Canvas 生成的主封面。
- 不输出可见的 prompt 片段、profile 名、比例说明、layout/focus/maxLines、关键词清单或生成要求。
- 返回 `coverStatus: "pending"`、目标 `cover` 路径和失败原因。

## Report

```text
posterProfile: default | sports_card | sports_bracket
qualityGate: passed | failed | skipped
cover: /images/<category>/<file>.webp
coverStatus: generated_webp | pending
coverReason: one short reason
```

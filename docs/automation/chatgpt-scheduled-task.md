# ChatGPT Scheduled Task

本文件是 ChatGPT 定时任务的唯一可变任务说明。定时任务每次运行必须从 GitHub 读取 `idaibin/feeds-hub` 仓库 `main` 分支的本文件最新版本，并按本文件执行。

如果无法读取本文件，立即停止并汇报原因；不要凭历史记忆、旧 prompt 或上次运行规则继续执行。

## Goal

更新 Feeds Hub：

- 从公开、可核验来源获取新信息。
- 每条 feed 只描述一个独立事件。
- 生成 Markdown 内容。
- 为每条新增 feed 尝试生成真实 WebP 海报。
- 通过 GitHub 写入内容分支。
- 验证产物后 squash 合并到 `main`。
- 不创建 PR。

## Immutable Rules

- 不直接写入 `main` 的未验证内容。
- 不创建 PR。
- 不创建空提交。
- 不混合多个事件到一条 feed。
- 不使用历史记忆替代本文件。
- 不把未验证图片标记为 `generated_webp`。
- 不写入 SVG、PNG、HTML 截图、Canvas、CSS 绘图或 data URL 作为主封面。
- 不把 fallback、模板占位图、重复图、空白图、错误比例图或带 prompt 痕迹的图片标记为成功海报。

## Repository Reads

每轮先读取：

- 本文件所在的 branch 和 commit SHA。
- `src/content.config.ts`，确认当前 schema。
- `docs/topics/*.md`，读取全部 topic frontmatter，排除 `README.md`。
- topic frontmatter 中每个 `flows` 对应的 `docs/types/<flow>.md`。
- 现有 `src/content/<category>/`，用于去重。
- 现有 `public/images/<category>/`，用于避免覆盖非本轮资产。

可以读取其它仓库文件辅助理解当前站点，但本文件是定时任务规则入口。

## Branch Flow

- 从当前 `origin/main` 开始。
- 内容分支名：`content/feeds-hub-update-<yyyyMMdd-HHmm>`。
- 同一轮任务只使用一个内容分支。
- 如果同名分支已存在，读取该分支最新 `HEAD` 并在其基础上继续，不覆盖已有提交。
- 所有 Markdown 和 WebP 先写内容分支。
- 只有本轮产物验证通过后，才 squash 合并到 `main`。
- squash commit message：`content: update feeds <yyyyMMdd-HHmm>`。
- 推送 `main` 后删除已合并内容分支，并刷新远端分支列表。

## Topics And Type Rules

Topic 真相源是 `docs/topics/*.md` 的 YAML frontmatter，排除 `README.md`。不要维护手写 topic 表。

每个 topic 必须声明：

```yaml
id: ""
type: realtime | sports | market
flows: []
sources:
  primary: []
  secondary: []
  supplemental: []
contentDir: ""
coverPrefix: ""
allowedKinds: []
```

执行时必须：

1. 遍历全部 topic 配置。
2. 对每个 topic 读取 `flows` 中的全部 `docs/types/<flow>.md`。
3. 按 topic `sources` 搜索、读取和核实信息。
4. 先写已核验文本 feed，再尝试海报。
5. 对每个 topic 报告新增、跳过或待补原因。

## Discovery And Deduplication

每个 topic 默认最多新增 1 到 3 条，高质量优先。无合格信息则跳过，但必须报告跳过原因。

`flows` 包含 `sports` 的 topic 在官方赛事日不受 1 到 3 条上限限制：必须先完整检查官方赛程、官方比赛中心、官方赛果、standings/stage 页面和页面内嵌官方数据，覆盖任务窗口内每场已验证的赛程、进行中状态或赛果；完成这些赛事硬事实后，才选择其它新闻或话题内容。

信息类型规则以 `docs/types/*.md` 为准；topic 文件只补充来源、目录、kind 和少量特有差异。

去重必须检查：

- `eventKey`
- `sourceUrl` 作为辅助线索
- 现有 `src/content/<category>/` 中同一事件、同一比赛、同一公告、同一版本、同一政策或同一报道

同一事件只有状态实质变化时才可新增，例如：

- schedule -> result
- schedule -> flow
- flow -> result
- policy proposal -> official decision
- release candidate -> stable release
- advisory created -> patched / KEV added

赛事类同一场比赛可以按状态递进生成多条 feed。不要因为已有赛前 feed、同一个 `sourceUrl`、同一个 stage 页面、同一天已有赛事 feed、同一对阵曾经出现，或已经达到普通 topic 数量上限，就跳过新的进行中状态或赛果。只有同一官方 match id 或同一对阵时间、同一状态、同一比分或同一晋级关系已经存在时才跳过。

对于 LoL Esports 这类动态页面，必须读取 stage/standings 页面内嵌的官方 match 数据；当页面提供 `id`、`state`、`matchTeams`、`gameWins`、`outcome`、`destinations` 或 `startTime` 时，以这些字段生成 `eventKey` 和正文事实。不能只看页面标题、meta 描述或旧 feed。

## Markdown Format

每条新增 feed 写入：

```text
src/content/<category>/<yyyy-mm-dd>-<slug>.md
```

Frontmatter 必须符合 `src/content.config.ts`：

```yaml
---
title: ""
subtitle: ""
category: "worldcup"
kind: "news"
topic: ""
date: "2026-07-06T00:00:00+08:00"
eventAt: "2026-07-05T16:00:00Z"
eventKey: ""
cover: "/images/<category>/<yyyy-mm-dd>-<slug>.webp"
coverStatus: "pending"
tags:
  - ""
summary: ""
source: ""
sourceUrl: "https://example.com"
reviewed: true
priority: 90
---
```

正文默认 2 段，最多 3 段，直接写段落，不要使用 `## 关键信息`、`## 视觉重点`、`returns`、prompt 字段名、YAML/JSON 字段名或模板说明作为正文内容：

- 第一段写已核验事实。
- 第二段写当前状态、下一步、市场情绪、赛程节点、影响范围或待确认信息。
- 第三段只在需要说明来源差异或未确认范围时使用。

禁止标题党、预测、投资建议、赛事预测、夸大判断、无来源路线图和社交热度当事实。

## Poster Profile

先根据 category、kind 和结构化输入选择 profile：

```text
if topic flows does not include sports and kind is not sports-like:
  profile = default
else if kind is knockout_update or worldcup_feed or input contains paths/bracket/multiple matches:
  profile = sports_bracket
else:
  profile = sports_card
```

Profile 映射：

- `default`：非体育新闻、AI、股市、开发、政策、产品、全球、Rust、安全、compute，16:9。
- `sports_card`：单场赛程、单场前瞻、单场进度、单场结果、足球赛果、LOL BO5 赛果，4:5。
- `sports_bracket`：淘汰图、晋级路径、多场比赛进度、上下半区、决赛路径，16:9。

## Poster Input

图片生成只接收最终结构化 facts，不读取原始新闻全文来编造事实。

基础输入：

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
socialMood:
  enabled: true
  sources: []
  mood: excited | regret | tense | calm | controversial | comeback | upset | celebration
  keywords: []
  summary: ""
```

赛事可选输入：

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
matches: []
paths: []
```

## Poster Generation

每条新增 feed 都必须尝试生成真实 WebP 海报，除非当前环境明确无法生成图片。

生成图片前必须读取 `docs/posters/README.md`、对应 `docs/posters/<profile>.md`、`docs/posters/visual-hierarchy.md` 和 `docs/posters/quality-gate.md`。图片输入必须来自结构化 facts 和压缩后的视觉层级，不要把原始新闻全文、网页全文或长 Markdown 直接交给图片模型。

WebP 文件写入：

```text
public/images/<category>/<yyyy-mm-dd>-<slug>.webp
```

Markdown `cover` 写入：

```text
/images/<category>/<yyyy-mm-dd>-<slug>.webp
```

尺寸要求：

- `default`：16:9，推荐 `1600x900`，最低 `1280x720`。
- `sports_bracket`：16:9，推荐 `1600x900`，最低 `1280x720`。
- `sports_card`：4:5，推荐 `1440x1800`，最低 `1120x1400`。

必须生成真实 WebP 二进制。WebP blob 可用 base64 写入 GitHub，但禁止 `data:image/webp;base64,` 前缀进入文件或 frontmatter。

## Visual Acceptance

只有全部满足时，才允许：

```yaml
coverStatus: "generated_webp"
```

验收项：

- 图片文件真实存在。
- 重新读取成功。
- 文件是 WebP RIFF 二进制。
- 不包含 `data:image` 前缀。
- 尺寸和比例符合 profile。
- 画面内容符合 feed 的 title、subtitle、summary 和 facts。
- 视觉层级符合 `docs/posters/visual-hierarchy.md`，只有一个主视觉焦点。
- 通过 `docs/posters/quality-gate.md` 的文件、profile、事实、文字、视觉、视觉层级和体育专项检查。
- 体育单场内容是 4:5 `sports_card`，不是横向模板。
- bracket 内容是 16:9 bracket，不是单场卡。
- 非体育内容不出现比分牌、VS、球场、赛程或 bracket。
- 没有 prompt、profile、ratio、layout、focus、maxLines、关键词、生成说明、规格标签或模板字段可见。
- 不是 fallback、空白图、占位图、重复图或模板截图。
- 没有伪造比分、赛程、公司、数字、logo、source 或未提供事实。
- 体育海报可以出现官方或权威来源可核验的国家/战队 Logo、队徽、旗帜、球员/选手肖像、阵容、进球、MVP 和赞助标识；无法从官方赛程、官方比赛中心、官方队伍/赛事页面、官方视觉资产或权威通讯社/图片来源核验时，必须降级为文字标签、缩写、抽象色块或中性徽章。

任一项失败，必须：

```yaml
coverStatus: "pending"
```

`pending` 时保留未来 `cover` 路径，但报告 `pendingReason`。不要声称图片已成功生成。

## GitHub Write Flow

使用 GitHub connector 写入时：

1. 读取目标分支最新 `HEAD` commit 和 tree。
2. 创建或继续内容分支。
3. 用 blob/tree/commit/ref 写 Markdown。
4. 图片成功时写 WebP blob，并同步 Markdown `coverStatus: "generated_webp"`。
5. 图片失败时写 Markdown，`coverStatus: "pending"`。
6. WebP blob 使用 base64，禁止 data URL 前缀。
7. 每次写入后重新读取本轮 Markdown 和 WebP，确认路径、frontmatter、二进制、尺寸和视觉验收结论。

Markdown 和图片允许分步提交，但最终合并前必须报告每条的图片状态。

## Merge Gate

合并到 `main` 前必须满足：

- 本轮新增 Markdown 均可重新读取。
- frontmatter 符合 schema。
- `eventKey` 和 `sourceUrl` 去重完成。
- 每条 feed 都有 `coverStatus`。
- 每条 `generated_webp` 都有 WebP 验收证据。
- 每条 `pending` 都有明确 `pendingReason`。
- `main` 与 `origin/main` 同步。

不满足任一条件时，不推送 `main`，保留内容分支并报告失败点。

## Final Report

最终报告必须包含：

- 读取到的本文件 branch 和 commit SHA。
- 内容分支名。
- 遍历 topic。
- 新增、跳过、待补数量。
- 写入 commit。
- squash 合并结果。
- `main` 推送结果。
- 删除或保留的内容分支。

并逐条列出每个新增 feed：

```text
category:
title:
source:
sourceUrl:
eventAt:
eventKey:
markdownPath:
posterProfile:
cover:
coverStatus:
qualityGate: passed | failed | skipped
imageGenerationCalled: yes/no
webpWritten: yes/no
webpBytes:
webpDimensions:
visualAccepted: yes/no
pendingReason:
branch:
commit:
```

如果报告缺少 `qualityGate`、`imageGenerationCalled`、`webpWritten`、`webpBytes`、`webpDimensions`、`visualAccepted` 或 `pendingReason`，本次任务视为未完成。

## Failure Report

失败时报告：

- 失败步骤。
- 受影响 topic。
- 受影响 feed。
- 内容分支。
- 已写入 commit。
- 哪些文件已验证。
- 为什么没有合并 `main`。

不要用笼统描述替代具体失败点。

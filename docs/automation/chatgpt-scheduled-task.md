# ChatGPT Scheduled Task

本文件是 ChatGPT 定时任务的唯一可变任务说明。定时任务每次运行必须从 GitHub 读取 `idaibin/feeds-hub` 仓库 `main` 分支的本文件最新版本，并按本文件执行。

如果无法读取本文件，立即停止并汇报原因；不要凭历史记忆、旧 prompt 或上次运行规则继续执行。

## Goal

更新 Feeds Hub：

- 从公开、可核验来源获取新信息。
- 每条 feed 只描述一个独立事件。
- 生成信息准确、正文完整的 Markdown 内容。
- 默认隐藏海报生成；图片只在用户明确要求或维护 `content/generate-posters` 时处理。
- 通过 GitHub 写入内容分支。
- 验证产物后 squash 合并到 `main`。
- 不创建 PR。

## Immutable Rules

- 不直接写入 `main` 的未验证内容。
- 不创建 PR。
- 不创建空提交。
- 不混合多个事件到一条 feed。
- 不使用历史记忆替代本文件。
- 不因海报缺失阻塞已核验文本发布。
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

可以读取其它仓库文件辅助理解当前站点，但本文件是定时任务规则入口。

## Branch Flow

- 从当前 `origin/main` 开始。
- 内容分支名：`content/feeds-hub-update-<yyyyMMdd-HHmm>`。
- 同一轮任务只使用一个内容分支。
- 如果同名分支已存在，读取该分支最新 `HEAD` 并在其基础上继续，不覆盖已有提交。
- 内容分支只写 Markdown。
- 图片生成分支固定保留为 `content/generate-posters`；主流程不得删除该分支。
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
4. 写入已核验文本 feed；默认不生成海报。
5. 对每个 topic 报告新增、跳过或待补原因。

## Discovery And Deduplication

每个 topic 默认最多新增 1 到 3 条，高质量优先。无合格信息则跳过，但必须报告跳过原因。

`flows` 包含 `sports` 的 topic 在官方赛事日不受 1 到 3 条上限限制：必须先完整检查官方赛程、官方比赛中心、官方赛果、standings/stage 页面和页面内嵌官方数据，覆盖任务窗口内每场已验证的赛程、进行中状态或赛果；完成这些赛事硬事实后，才选择其它新闻或话题内容。

赛事状态覆盖是硬要求：比赛前一天必须有 `match_schedule` 预告；比赛当天必须有最新赛程状态，若官方数据提供 live/in-progress、暂停、延期、重赛、walkover 或其它状态变化则补 `match_flow`；比赛结束后必须补 `match_result`，并写明已核验的比分、胜负、晋级、淘汰和下一轮关系。已有赛前稿不能阻止赛后结果稿，已有同源 stage 页面不能阻止同日其它比赛。

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

正文默认 3 到 5 段，直接写自然段，不要使用 `## 关键信息`、`## 视觉重点`、`returns`、prompt 字段名、YAML/JSON 字段名或模板说明作为正文内容：

- 第一段写已核验事实。
- 第二段写当前状态、下一步、市场情绪、赛程节点、影响范围或待确认信息。
- 第三段写来源中可核验的背景、时间线、关键数据、下一步或限制条件。
- 第四到第五段只在来源提供更多事实、需要说明来源差异、未确认范围或已排期节点时使用。

禁止标题党、预测、投资建议、赛事预测、夸大判断、无来源路线图和社交热度当事实。

## Hidden Poster Branch

主流程默认不生成、不验收、不展示图片。Markdown 仍保留 `cover` 和 `coverStatus` 字段以兼容 schema；没有已验收图片时写：

```yaml
cover: "/images/<category>/<yyyy-mm-dd>-<slug>.webp"
coverStatus: "pending"
```

只有用户明确要求生成图片，或任务目标是维护 `content/generate-posters` 时，才读取 `docs/posters/README.md`、对应 `docs/posters/<profile>.md`、`docs/posters/visual-hierarchy.md` 和 `docs/posters/quality-gate.md`。图片分支产物不得自动同步回 `main`；同步前必须由用户确认。

## Poster Input

仅在图片分支启用。图片生成只接收最终结构化 facts，不读取原始新闻全文来编造事实。

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

仅在图片分支启用。主流程必须跳过本节。

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

仅在图片分支启用。主流程必须跳过本节，并保持 `coverStatus: "pending"`。

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
4. 重新读取本轮 Markdown，确认路径、frontmatter、正文完整性、来源和去重结果。

Markdown 和图片分离提交。主流程只写 Markdown；图片只写入 `content/generate-posters` 或用户指定的图片分支。图片成功后是否同步回 `main` 需要用户明确确认。

## Merge Gate

合并到 `main` 前必须满足：

- 本轮新增 Markdown 均可重新读取。
- frontmatter 符合 schema。
- `eventKey` 和 `sourceUrl` 去重完成。
- 每条 feed 都有 `coverStatus`。
- 每条正文符合 3 到 5 段优先的信息完整性要求，来源没有更多可核验事实被无故遗漏。
- `coverStatus: generated_webp` 只允许出现在已有图片分支验收证据并经用户确认同步的内容中。
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
bodySupplement:
imageGeneration: skipped | branch-only | synced-after-confirmation
branch:
commit:
```

如果报告缺少正文补充范围、图片生成状态或内容验证结论，本次任务视为未完成。

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

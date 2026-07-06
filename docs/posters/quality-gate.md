# Poster Quality Gate

本文件定义 Feeds Hub 海报生成的质量闭环。目标不是写更长的 prompt，而是让定时任务按固定流程生成、验收、重试和失败降级。

## Principle

- 图像模型负责视觉质感。
- 结构化数据负责事实准确。
- `posterBrief` 负责把事实、文字预算、层级和视觉方向压缩成可生成输入。
- `visual-hierarchy.md` 负责把结构化 facts 压缩成一个主视觉和有限辅助信息。
- quality gate 负责拦截低质量、不准确、无主次或无法验证的图片。
- 无法可靠通过质量门槛时必须返回 `coverStatus: "pending"`，不得硬交付垃圾图。

## Required Flow

每张海报必须按以下顺序处理：

1. 读取 topic 文档、正文格式文档、poster visual hierarchy 文档和 poster profile 文档。
2. 查询并确认 verified facts；社区来源只能写入 `socialMood`。
3. 生成 Markdown draft 和结构化 `posterBrief`。
4. 按 `docs/posters/visual-hierarchy.md` 确认唯一 `primaryData`、layout zones、visual weight 和压缩/省略清单。
5. 按 `posterBrief.profile` 加载 `docs/posters/<profile>.md`。
6. 生成候选 WebP。
7. 执行 `Quality Gate`。
8. 若失败，使用 `Correction Prompt` 基于相同事实、相同 visual hierarchy 和相同 profile 重试一次。
9. 若仍失败，写入 `coverStatus: "pending"`、未来 `cover` 路径和 `coverReason`。

不得跳过 `posterBrief` 和 visual hierarchy，直接把新闻正文、网页正文、比赛报道或长摘要传给图片模型。

## PosterBrief Validation

`posterBrief` 必须满足：

- `profile` 与 `docs/posters/README.md` 的 Profile Selection 一致。
- `ratio` 与 profile 一致：`default` / `sports_bracket` 为 `16:9`，`sports_card` 为 `4:5`。
- `displayText` 中所有可读文字都来自 verified facts、feed title、feed summary、event fields 或明确传入的简短派生摘要。
- `textBudget` 明确限制标题、副标题、bullet、footer 和 microcopy。
- `hierarchy.primary` 明确指定核心视觉对象：headline、score、matchup 或 bracket。
- `visualHierarchy.primaryData` 明确指定唯一主视觉数据。
- `visualHierarchy.layoutZones` 必须与 profile 的布局区域一致。
- `visualHierarchy.compression` 必须明确 secondary facts、tertiary facts 和 omittedFromPoster。
- `visual.mood` 只来自事实语境或 `socialMood`，不得改写事实。
- `mustNot` 至少包含不编造事实、不生成假 logo / 假赞助 / 假比分 / 假日期 / 假来源、不生成乱码小字、不让次级信息抢主视觉。

缺少 `posterBrief`、visual hierarchy、profile 不匹配或字段明显不足时，不生成图片，直接返回 `coverStatus: "pending"`。

## Quality Gate

候选图必须全部通过以下检查，才能标记为 `generated_webp`。

### 1. File Check

- 文件是真实 WebP 二进制。
- 文件路径为 `public/images/<category>/<yyyy-mm-dd>-<slug>.webp`。
- frontmatter `cover` 为 `/images/<category>/<yyyy-mm-dd>-<slug>.webp`。
- `default` / `sports_bracket` 比例为 `16:9`，最低 `1280x720`。
- `sports_card` 比例为 `4:5`，最低 `1120x1400`。
- 无 `data:image/webp;base64,` 前缀。
- 无 metadata 要求可执行时应移除 metadata。

### 2. Profile Check

- `default` 不能像单场赛程卡、比分牌、淘汰赛图或赛事战报。
- `sports_card` 必须是单场卡片，不能出现完整 bracket、上下半区或多场路径。
- `sports_bracket` 必须是结构化晋级图，不能退化成普通新闻封面或纯列表。
- profile、ratio、layout、focus 任一明显错误，判定失败。

### 3. Fact Check

- 不得出现未传入的比分、时间、日期、队伍、选手、股票价格、模型能力、政策结论、来源名、logo、赞助商或冠军结果。
- 比分、赛程、胜负、晋级、BO5、进球、红黄牌、点球、MVP、下一轮关系必须与结构化输入一致。
- 社区来源不得变成硬事实。
- 如果图中文字与 Markdown frontmatter 或 verified facts 冲突，判定失败。

### 4. Text Check

- 无乱码中文、假中文、重复文字块、混乱中英混排、不可读小字。
- 标题最多 1-2 行，不得占满整张图。
- 文字层级清楚：核心数据优先，装饰性文字最少。
- 重要文字在 feed-card 缩略图尺寸下仍可辨认。
- 不得生成无意义 microcopy、假 UI 标签、假图表数字或装饰性新闻条。
- 正式海报不得展示 `posterProfile`、比例、尺寸、WebP、quality gate 等生产元信息。

### 5. Visual Check

- 主体层级清楚，第一眼能识别 headline、score、matchup 或 bracket。
- 背景不能压过文字、比分、队名、日期、晋级线或核心标签。
- 构图有足够边距，不裁切核心内容。
- 色调符合 `socialMood`，但不牺牲可读性。
- 不使用廉价模板感、过度噪点、过度光效、过密装饰或无关人物主体。

### 6. Visual Hierarchy Check

- 必须只有一个 primary visual focus。
- 视觉顺序必须符合 `docs/posters/visual-hierarchy.md`：primary data > matchup/entity > event context > details > footer。
- `sports_card` 结果图中，比分必须强于标题、BO5、分局、来源和背景。
- `sports_card` 赛程图中，对阵和时间必须强于标题和背景。
- `sports_bracket` 中，bracket grid 和 path lines 必须强于标题、背景、队伍装饰和图例。
- details 必须压缩为 chips、短行或小模块，不能成为第二个主视觉。
- footer 必须安静，不能像 headline 或 banner。
- 如果画面像 dashboard 截图、信息堆叠、宣传 KV 或自由海报而不是 profile 指定的信息卡，判定失败。

### 7. Sports Card Check

`sports_card` 必须额外检查：

- scheduled：展示 VS 或比赛时间，不得伪造比分。
- live：展示当前状态、当前比分或当前局/分钟，不得写成最终结果。
- final：展示最终比分、胜者或结果说明。
- 足球结果：如果输入包含 `goals`，图中必须展示核心进球纪录；完整纪录可放正文，但图中不能完全遗漏。
- LOL BO5：如果输入包含 `games`，图中必须展示 G1-G5 或简化分局结果；不能只写总比分。
- LOL BO5 分局应使用紧凑 chips 或一行小模块，不能让 G1/G2/G3 模块面积超过中心比分区域。
- 标题区应控制在画面顶部小范围，不能用巨大 `明日赛程`、`进行中`、`比赛结束` 压过对阵或比分。
- 如果未提供真实 logo、旗帜、队徽或赞助素材，不得生成疑似真实标识。

### 8. Sports Bracket Check

`sports_bracket` 必须额外检查：

- 必须展示结构化 bracket、晋级方向、路径线、下一轮/半决赛/决赛/总决赛/冠军位之一。
- 已完赛场次必须展示比分和晋级队伍。
- 未开始或未确定场次必须使用 `待定`、`TBD`、`?` 或输入提供的占位符。
- 双败赛制必须区分胜者组和败者组；总决赛可使用金色强调。
- 胜者组/上半区和败者组/下半区路径颜色必须清晰区分，且不能让背景光效抢过路径线。
- 不得把 bracket 做成普通列表、资讯卡片或单场赛果卡。

## Correction Prompt

首次候选图失败时，只允许基于同一 `posterBrief`、同一 visual hierarchy 和同一 profile 重试一次。重试 prompt 必须包含：

```text
Regenerate the poster using the exact same facts, same profile, same ratio, same posterBrief, and same visualHierarchy. Do not add any new facts, names, scores, dates, logos, sponsors, sources, or labels.

Correction requirements:
- Keep one primary visual focus only.
- Follow the declared visual order: primary data > matchup/entity > event context > details > footer.
- Reduce title size by 25%-40% if it competes with the primary data.
- Compress secondary facts into chips or compact rows.
- Remove decorative microcopy, fake UI labels, fake numbers, production metadata, and repeated text.
- Increase margins and spacing around teams, score, title, date, and source.
- Make the background less detailed if it hurts readability.
- Keep only verified displayText from posterBrief.
- Prioritize the declared hierarchy.primary and visualHierarchy.primaryData.
- For sports_card, prioritize matchup, status, time, score, goals, or BO5 games over atmosphere. The center score or VS must remain dominant.
- For sports_bracket, prioritize bracket grid, path lines, match cards, final slot, and advancement direction over background effects.
- Output one clean production poster, not a collage, screenshot, mockup, UI wireframe, or production-debug image.
```

重试不得更换 profile，不得改写事实，不得把缺失事实补成看似合理的信息。

## Pending Conditions

出现任一情况时，必须返回 `pending`：

- 无法调用图片生成能力。
- 无法输出真实 WebP。
- 无法读取或验证生成后的文件。
- `posterBrief` 缺失、visual hierarchy 缺失、profile 错误或事实不足。
- 候选图出现事实冲突、乱码、重复文字、假 logo、假比分、假来源。
- 体育图遗漏必须展示的比分、进球、BO5 分局或晋级路径。
- 图像没有唯一主视觉，或 details / footer / 背景抢走 primary data。
- 第一次生成失败且重试后仍未通过质量门槛。

## Failure Reason Codes

`coverReason` 使用简短原因，建议从以下值中选择：

```text
image_tool_unavailable
invalid_webp
invalid_ratio
poster_brief_missing
poster_brief_invalid
visual_hierarchy_missing
visual_hierarchy_failed
visual_compression_failed
wrong_profile
unreadable_text
garbled_text
repeated_text
invented_fact
missing_required_fact
fake_logo_or_sponsor
production_metadata_visible
wrong_match_status
sports_missing_goals
sports_missing_games
bracket_missing_paths
visual_hierarchy_failed
quality_gate_failed
```

## Text Budget Reference

| profile | title | subtitle | bullets / modules | footer | microcopy |
| --- | --- | --- | --- | --- | --- |
| `default` | 1-2 lines, short headline | 0-1 compact line | 2-4 short items | source/topic only | no fake microcopy |
| `sports_card` | top band 8%-12% height | stage/status only | goals/games/key events only | source/time/format | no decorative labels |
| `sports_bracket` | title area 6%-10% height | stage/date only | match cards and paths | source/legend only | no dense small text |

## Deterministic Overlay Boundary

允许在真实 AI 生成视觉底图上进行确定性的文字、比分、路径或信息排版，并导出真实 WebP；但必须满足：

- 底图不是纯脚本、纯 CSS、纯 SVG、纯 Canvas 或 HTML 截图占位图。
- 最终文件是真实 WebP。
- 叠加文字和图形必须来自 `posterBrief`。
- 视觉层级和信息压缩必须来自 `visual-hierarchy.md`。
- 仍然必须通过本质量门槛。

纯脚本生成的占位图、HTML 截图、Canvas 图、SVG 图或 PNG fallback 不能作为主封面。

## Report Fields

每张海报汇报：

```text
posterProfile: default | sports_card | sports_bracket
posterBrief: generated | missing | invalid
visualHierarchy: passed | failed | skipped
qualityGate: passed | failed | skipped
retryCount: 0 | 1
cover: /images/<category>/<file>.webp
coverStatus: generated_webp | pending
coverReason: one short reason or failure reason code
```

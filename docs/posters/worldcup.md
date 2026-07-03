# World Cup Poster Prompt

## Category

`worldcup`

## 主题特色

世界杯主题应突出国际赛事、球场空间、淘汰赛压力、观众情绪、赛程推进和对阵氛围。画面要像体育新闻封面，而不是品牌广告或官方赛事海报。

## 尺寸规则

世界杯不再统一使用 `16:9`。生成前必须先按 `docs/posters/type-matrix.md` 推导比例：

| kind | ratio | size | 用途 |
|---|---:|---:|---|
| `match_schedule` | `4:5` | `1440x1800` | 赛事前瞻 |
| `match_result` | `4:5` | `1440x1800` | 完场赛果 / 晋级 / 淘汰 |
| `match_flow` | `4:3` | `1600x1200` | 比赛进程 / 时间线 |
| `player_spotlight` | `4:5` | `1440x1800` | 球员焦点 |
| `knockout_update` | `4:3` | `1600x1200` | bracket / 晋级席位 |
| `worldcup_feed` | `4:3` | `1600x1200` | 同一比赛日结构化汇总 |
| `data` | `4:3` | `1600x1200` | 排名、对阵、晋级路径 |
| `visual` | `4:5` | `1440x1800` | 人工精选赛事海报 |
| `news` / `breaking` / `insight` / `hot_topic` | `16:9` | `1600x900` | 普通新闻封面 |

禁止使用 `1:1`。

## 视觉方向

- 深蓝夜场球场背景。
- 左右球场灯光、看台、草皮、蓝色能量粒子。
- 顶部不要巨型中文标题，避免抢占视觉。
- 不在海报图片中生成 Feeds Hub logo、Feeds Hub wordmark、Feeds Hub 品牌角标、水印或主题标签。
- 赛事海报可在顶部中心使用 `2026 WORLD CUP` 作为赛事识别，但不能使用官方 FIFA logo 或官方赛事标。
- 主视觉集中在中部：对阵、足球、旗帜色彩、赛场空间或关键事件方向。
- 队名、比分、日期、地点只有在 feed 明确提供时才能作为视觉文字使用。
- 底部信息面板不能过黑、过空，应有蓝色发光边框、球场地面纹理或轻量 HUD 结构。
- 不使用官方 FIFA logo、官方赛事标、球队队徽、真实球员照片或侵权球衣细节。

## Kind 适配

### `match_schedule`

```text
Create a premium vertical football match preview poster, aspect ratio 4:5, 1440x1800 WebP.
Use a dark blue night stadium background with electric blue floodlights, cyan neon accents, subtle pitch texture, crowd energy, and polished sports-broadcast editorial design.
Use national flags or color cues only when supplied by the feed. Do not use official team crests or official FIFA marks.
Make the middle the visual focus: two sides, a glowing football, matchup tension, and matchday anticipation.
Keep date and location secondary unless supplied and required by the feed.
```

### `match_result`

```text
Create a premium vertical football result poster, aspect ratio 4:5, 1440x1800 WebP.
Use post-match stadium energy, full-time pressure, advancement or elimination mood, and one clear central result focal point.
If the score and teams are supplied by the feed, they may appear as designed text, but do not invent any score, scorer, minute, date, or opponent.
Avoid betting, odds, win-probability, forecast, or sensational victory language.
```

### `match_flow`

```text
Create a structured 4:3 football match-flow cover, 1600x1200 WebP.
Show a clean timeline, turning points, pressure shifts, and match rhythm through panels, field lines, and subtle HUD elements.
Only include minute, score, player, VAR, card, penalty, or extra-time text when supplied by the feed.
```

### `knockout_update`

```text
Create a structured 4:3 World Cup knockout update cover, 1600x1200 WebP.
Use bracket paths, advancement nodes, stage hierarchy, and clean tournament progression visuals.
Only show teams, round names, or pairings supplied by the feed.
Do not make an unrelated multi-match collage.
```

### `worldcup_feed`

```text
Create a structured 4:3 World Cup feed summary cover, 1600x1200 WebP.
Group same-day or same-stage events into clean modules.
Use no more than three result modules plus one next-match module.
Do not mix unrelated teams, stages, or dates.
```

### `player_spotlight`

```text
Create a premium vertical football player spotlight poster, aspect ratio 4:5, 1440x1800 WebP.
Use a generic illustrated player silhouette, stadium lighting, role cues, and performance pressure.
Do not copy real player photos, faces, official jerseys, team badges, or broadcast graphics.
```

### `hot_topic` / `news` / `breaking` / `insight`

```text
Create a 16:9 editorial football news cover, 1600x900 WebP.
Use stadium, training, press area, locker-room corridor, media mixed-zone, or matchday context.
Represent the topic through scene and mood, not a fake scoreboard or invented official visual.
```

## 负面约束

```text
No 1:1 feed cover.
No generic template reused across multiple World Cup feeds.
No FIFA logo, no official tournament emblem, no team badges, no copied broadcast graphics.
No overlarge Chinese headline at the top.
No oversized team names.
No empty black bottom area.
No top-left Feeds Hub logo, Feeds Hub wordmark, or Feeds Hub brand badge.
No top-right theme label, category tag, source tag, status pill, badge, logo, or wordmark.
No full-width bottom brand bar.
No fake match facts.
No unrelated multi-match collage.
No odds-style panels, win-probability panels, or betting visual language.
```

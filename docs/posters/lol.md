# LOL Poster Prompt

## Category

`lol`

## 主题特色

LOL 赛事主题应突出电竞舞台、灯光、对阵、赛程、战队状态和竞技张力。画面要像电竞新闻封面，不直接复刻 Riot 官方视觉、英雄角色、队标或选手肖像。

## 尺寸规则

LOL 赛事按 `docs/posters/type-matrix.md` 推导比例：

| kind | ratio | size | 用途 |
|---|---:|---:|---|
| `match_schedule` | `4:5` | `1440x1800` | 电竞赛程 / 对阵预告 |
| `match_result` | `4:5` | `1440x1800` | 赛果 / 晋级 / 淘汰 |
| `match_flow` | `4:3` | `1600x1200` | 比赛进程 / ban-pick / 时间线 |
| `player_spotlight` | `4:5` | `1440x1800` | 选手焦点，禁止肖像复刻 |
| `knockout_update` | `4:3` | `1600x1200` | bracket / 晋级形势 |
| `data` | `4:3` | `1600x1200` | 排名、赛程表、数据简报 |
| `visual` | `4:5` | `1440x1800` | 人工精选电竞海报 |
| `news` / `breaking` / `insight` / `hot_topic` | `16:9` | `1600x900` | 普通电竞新闻封面 |

禁止使用 `1:1`。

## 话题线索

适合表达：

- LPL、MSI、Worlds、First Stand 等赛事赛程
- 单场比赛结果或晋级形势
- 对阵、分组、淘汰赛路径
- 阵容变化、规则更新、版本影响
- 战队状态和赛事热度

不适合把多个战队新闻或多个版本议题混为一张图。

## 热度表达

- `low`：赛前信息、赛程更新，冷静、清晰、偏蓝紫电竞屏幕。
- `medium`：重点对阵、晋级形势，舞台灯光、观众席、对战分屏。
- `high`：决赛、爆冷、冠军、淘汰，强对比灯光、舞台中心、紧张剪影。

热度只表达观赛关注度，不生成官方战队视觉或角色元素。

## 风格提示词

```text
Show a futuristic esports arena, LED stage lights, abstract versus composition, tournament bracket mood, and focused competitive tension.
Use neon blue, violet, cyan, and dark stage tones with clean editorial composition.
Do not depict official game champions, official team logos, player likenesses, copied broadcast overlays, or fake sponsor panels.
```

## Kind 适配

### `match_result`

```text
Create a premium vertical esports result poster, aspect ratio 4:5, 1440x1800 WebP.
Use abstract victory energy, stage lights, player desks, audience glow, and post-match atmosphere.
Keep scoreboards generic unless exact score is supplied by the feed.
```

### `match_schedule`

```text
Create a premium vertical esports match preview poster, aspect ratio 4:5, 1440x1800 WebP.
Use bracket or matchday structure, stage readiness, player stations, and upcoming-match tension.
Team names and times must be abstract or blurred unless supplied by the feed.
```

### `match_flow`

```text
Create a structured 4:3 esports match-flow cover, 1600x1200 WebP.
Use timeline panels, abstract ban-pick blocks, momentum lanes, and stage-light rhythm.
Do not invent teams, champions, game counts, or player names.
```

### `player_spotlight`

```text
Create a premium vertical esports player spotlight poster, aspect ratio 4:5, 1440x1800 WebP.
Use a generic competitor silhouette, keyboard/mouse or player-station cues, stage backlight, and role pressure.
No real player face likeness, no official jersey, no champion art.
```

### `knockout_update` / `data`

```text
Create a structured 4:3 esports bracket or data cover, 1600x1200 WebP.
Use clean bracket nodes, group-stage paths, standings modules, or schedule blocks.
Keep all exact names and numbers generic unless supplied by the feed.
```

### `hot_topic`

```text
Create a 16:9 esports news cover, 1600x900 WebP.
Use roster pressure, patch impact, team momentum, tournament spotlight, or stage context.
Represent teams as abstract sides, colors, or silhouettes only.
```

## 负面约束

```text
No 1:1 feed cover.
No Riot logo, no LoL logo, no official champion art, no official team badges, no copied broadcast UI.
No reusable generic template applied to multiple unrelated feeds.
No readable team names unless supplied as page text outside the image.
No fake score, fake bracket, fake time, or fake sponsor.
No player face likeness unless explicitly requested and source-safe.
No odds-style panels, win-probability panels, or forecast-board visual language.
No top-left Feeds Hub logo, Feeds Hub wordmark, or Feeds Hub brand badge.
No top-right theme label, category tag, source tag, or status pill.
```

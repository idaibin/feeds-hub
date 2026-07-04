# Match Flow Poster

## ID

`match_flow`

## Ratio

`4:3`

## Use

比赛进行中状态、官方实时进程、关键阶段、时间线、转折节点。

## Dynamic Inputs

Required when available:

- `tournament`
- `teamA`
- `teamB`
- `status`
- `stage`

Optional:

- `minute`
- `gameNumber`
- `matchPhase`
- `currentScore`
- `keyEvent`
- `timelineItems`
- `period`
- `mapState`
- `liveSourceLabel`

Do not render:

- `sourceUrl`
- internal IDs
- speculative live commentary

## Poster DSL Defaults

```yaml
ratio: 4:3
layout: timeline
focus: schedule
maxLines: 3
```

## Prompt

```text
Use a structured timeline composition showing active event rhythm, turning points, pressure, and progress through premium timeline panels.
Show live-state energy with symbolic progress modules, pressure zones, and event-flow structure.
Use the topic environment to define the world, such as stadium, esports arena, market desk, policy room, or technical operations center.
Keep charts, timelines, panels, and status modules symbolic unless exact facts are supplied.
```

## Text Rules

```text
Only include verified status, minute, period, phase, game number, current score, key event, or timeline item supplied by the feed.
If exact live facts are missing, use non-readable symbolic panels.
```

## Negative Constraints

```text
No invented live events, timers, scores, kill counts, gold leads, objective data, goal events, chart values, or progress percentages.
No fake broadcast UI, fake live badges, fake source marks, fake official logos, or unsupported readable text.
No dense live dashboard unless the feed supplies structured facts.
```

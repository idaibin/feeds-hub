# Match Schedule Poster

## ID

`match_schedule`

## Ratio

`16:9`

## Use

体育或电竞赛程、赛前预告、开球节点、开赛提醒、发布前节点。

## Dynamic Inputs

Required when available:

- `tournament`
- `teamA`
- `teamB`
- `stage`
- `scheduledAt`

Optional:

- `venue`
- `city`
- `season`
- `round`
- `matchId`
- `patchContext`
- `broadcastContext`
- `previewAngle`

Do not render:

- `sourceUrl`
- `eventKey`
- `coverStatus`
- internal IDs

## Poster DSL Defaults

```yaml
ratio: 16:9
layout: fixture
focus: schedule
maxLines: 2
```

## Prompt

```text
Use a pre-event poster composition with anticipation, fixture structure, stage readiness, and matchday energy.
Show two opposing sides, a clear central fixture focal point, and structured schedule context.
Use the surrounding topic environment to define the visual world, such as stadium, arena, launch room, market desk, or developer workspace.
Keep the composition clean, premium, and readable for a mobile-first feed card.
```

## Text Rules

```text
Only include verified tournament, entity names, team names, stage, scheduled time, venue, city, round, or patch context supplied by the feed.
If a field is missing, represent it symbolically or omit it.
Do not create placeholder labels such as TBD unless the feed explicitly supplies TBD.
```

## Negative Constraints

```text
No invented scores, results, rankings, odds, kickoff times, venues, participants, brackets, or future claims.
No fake official logos, team badges, source badges, watermarks, UI chrome, or unsupported readable text.
No crowded schedule table unless the feed supplies a structured schedule.
```

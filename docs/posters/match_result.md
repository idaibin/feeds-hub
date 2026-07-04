# Match Result Poster

## ID

`match_result`

## Ratio

`16:9`

## Use

体育或电竞赛果、胜负、比分、晋级、淘汰、赛后战报。

## Dynamic Inputs

Required when available:

- `tournament`
- `teamA`
- `teamB`
- `score`
- `winner`
- `stage`

Optional:

- `completedAt`
- `advancement`
- `elimination`
- `nextMatchup`
- `round`
- `keyEvent`
- `seriesScore`

Do not render:

- `sourceUrl`
- `eventKey`
- internal IDs
- unverified commentary

## Poster DSL Defaults

```yaml
ratio: 16:9
layout: scoreboard
focus: score
maxLines: 2
```

## Prompt

```text
Use a result-focused poster composition with post-event energy, a decisive central focal point, and clear outcome hierarchy.
Show conclusion, pressure, advancement, elimination, or celebration only when supported by feed facts.
Use a clean result panel when exact score or series score is supplied.
Keep the image dramatic but controlled, editorial, and readable for a mobile-first feed card.
```

## Text Rules

```text
Only include verified team names, score, series score, winner, stage, completed time, advancement, elimination, next matchup, or key event supplied by the feed.
Do not include extra statistics unless they are explicitly present in the feed.
```

## Negative Constraints

```text
No invented scorelines, winners, goal scorers, kills, assists, objectives, extra games, rankings, standings, or timelines.
No fake scoreboards, official logos, copied player faces, source badges, watermarks, or unsupported readable text.
No sensational panic visuals or betting-language framing.
```

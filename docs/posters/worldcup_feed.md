# World Cup Feed Poster

## ID

`worldcup_feed`

## Ratio

`4:3`

## Use

同一比赛日、同一阶段、同一轮次的世界杯结构化汇总。

## Dynamic Inputs

Required when available:

- `tournament`
- `stage`
- `date`
- `items`

Optional:

- `matches`
- `results`
- `upcomingMatches`
- `qualifiedTeams`
- `eliminatedTeams`
- `hostCities`
- `round`
- `summaryAngle`

Do not render:

- unrelated matches
- source URLs
- internal IDs
- mixed-stage items unless supplied as one bounded stage summary

## Poster DSL Defaults

```yaml
ratio: 4:3
layout: dashboard
focus: data
maxLines: 4
```

## Prompt

```text
Use a same-day or same-stage structured World Cup feed composition with clean modules.
Show a premium football editorial dashboard with grouped match cards, stage hierarchy, symbolic bracket paths, or same-day summary panels.
Keep all modules part of one bounded tournament context.
Use football atmosphere only as the supporting environment; the structured summary should remain the main visual subject.
```

## Text Rules

```text
Only include verified tournament, date, stage, round, match names, scores, kickoff times, host cities, qualified teams, or elimination facts supplied by the feed.
Do not combine unrelated events, unrelated teams, or different stages unless the feed explicitly defines that summary scope.
```

## Negative Constraints

```text
No invented match list, fake standings, fake bracket paths, fake scores, fake dates, fake host cities, or unsupported summary claims.
No fake FIFA marks, team crests, source badges, watermarks, or unrelated multi-event collage.
```

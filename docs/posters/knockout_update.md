# Knockout Update Poster

## ID

`knockout_update`

## Ratio

`4:3`

## Use

淘汰赛、bracket、晋级路径、下一轮对阵、淘汰与晋级结构。

## Dynamic Inputs

Required when available:

- `tournament`
- `stage`
- `round`

Optional:

- `qualifiedTeams`
- `eliminatedTeams`
- `nextMatchup`
- `bracketPath`
- `advancementDetails`
- `winner`
- `score`
- `matchIds`

Do not render:

- internal bracket IDs unless user-facing
- `sourceUrl`
- unresolved predictions

## Poster DSL Defaults

```yaml
ratio: 4:3
layout: bracket
focus: bracket
maxLines: 4
```

## Prompt

```text
Use a bracket or advancement composition with structured nodes, connecting paths, and clear stage hierarchy.
Make the bracket, progression path, or next-round relationship the main visual structure.
Use topic-specific atmosphere in the background while keeping the advancement structure clean and readable.
Data marks and bracket labels must remain symbolic unless exact facts are supplied.
```

## Text Rules

```text
Only include verified tournament, stage, round, team names, score, winner, qualified teams, eliminated teams, next matchup, or advancement details supplied by the feed.
If bracket participants are unknown, keep nodes generic or non-readable.
```

## Negative Constraints

```text
No invented bracket paths, fake team names, fake round labels, fake results, fake tables, unsupported TBD labels, or prediction-style claims.
No official tournament logos, team badges, source badges, watermarks, or unsupported readable text.
```

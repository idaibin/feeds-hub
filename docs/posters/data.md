# Data Poster

## ID

`data`

## Ratio

`4:3`

## Use

指数、榜单、图谱、地图、流程、架构、漏斗、时间线、bracket、结构化数据图。

## Dynamic Inputs

Required when available:

- `dataTitle`
- `dataSubject`
- `chartType`

Optional:

- `labels`
- `values`
- `timeRange`
- `rankingItems`
- `mapRegions`
- `timelineItems`
- `nodes`
- `edges`
- `metrics`
- `units`
- `sourceLabel`

Do not render:

- source URLs
- unverifiable values
- internal IDs
- raw JSON

## Poster DSL Defaults

```yaml
ratio: 4:3
layout: dashboard
focus: data
maxLines: 4
```

## Prompt

```text
Use a structured data visual composition with dashboards, brackets, maps, timelines, rankings, dependency graphs, funnels, architecture panels, or workflow modules.
Make the data structure the main visual subject, with clean hierarchy and symbolic marks.
Use the topic environment only as supporting context.
Charts, brackets, panels, and timelines must be symbolic unless exact facts are supplied by the feed.
```

## Text Rules

```text
Only include verified labels, values, rankings, map regions, timeline items, nodes, edges, metrics, units, dates, team names, tickers, versions, or short data labels supplied by the feed.
If exact values are missing, use non-readable symbolic chart marks.
```

## Negative Constraints

```text
No fake numbers, fake dates, fake tickers, fake team names, fake chart values, fake maps, invented rankings, unsupported labels, raw JSON, or dense unreadable dashboards.
No source badges, watermarks, official seals, or copied UI.
```

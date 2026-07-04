# AI Poster

## ID

`ai`

## Ratio

`16:9`

## Use

AI 主题的结构化聚合、模型更新、产品发布、开发者工具、研究、基础设施或治理事件。

## Dynamic Inputs

Required when available:

- `eventTitle`
- `entityName`
- `keyFact`

Optional:

- `companyName`
- `modelName`
- `productName`
- `toolName`
- `paperTitle`
- `repositoryName`
- `version`
- `releaseDate`
- `benchmarkLabel`
- `policyName`
- `infrastructureContext`

Do not render:

- benchmark values unless exact
- source URLs
- unsupported capability claims
- fake UI copy

## Poster DSL Defaults

```yaml
ratio: 16:9
layout: dashboard
focus: product
maxLines: 2
```

## Prompt

```text
Use a structured AI technology scene with model infrastructure, developer workflow, research dashboard, code terminal, chip substrate, data center, agent system map, or governance review context.
Focus on one verified AI release, model, tool, paper, infrastructure signal, policy event, or company strategy item.
Use clean high-tech visual language with blue, graphite, white, slate, and subtle luminous accents.
Keep interfaces and dashboards symbolic unless exact feed facts are supplied.
```

## Text Rules

```text
Only include verified company names, model names, product names, tool names, paper titles, repository names, versions, dates, policy names, or benchmark labels supplied by the feed.
Do not render benchmark numbers, UI text, or capability claims unless supplied exactly.
```

## Negative Constraints

```text
No generic robots, AGI hype, fake product UI, fake company logos, invented benchmark values, fake API screenshots, fake architecture numbers, unsupported capability claims, or unreadable dense dashboards.
No source badges, watermarks, or copied product interfaces.
```

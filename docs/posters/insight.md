# Insight Poster

## ID

`insight`

## Ratio

`16:9`

## Use

来源支持的背景整理、结构化解释、原因路径、影响拆解、机制说明。

## Dynamic Inputs

Required when available:

- `insightTitle`
- `mainSubject`
- `explanationAngle`

Optional:

- `cause`
- `effect`
- `timelineLabel`
- `stakeholders`
- `systemParts`
- `riskLabel`
- `opportunityLabel`
- `keyEvidence`
- `eventDate`

Do not render:

- unsourced conclusions
- long article text
- source URLs
- internal notes

## Poster DSL Defaults

```yaml
ratio: 16:9
layout: workflow
focus: data
maxLines: 3
```

## Prompt

```text
Use a structured explanation scene with layered panels, cause-and-effect paths, research desk context, system maps, annotated environments, or workflow diagrams.
The image should explain one bounded subject using clear visual hierarchy rather than decorative collage.
Use symbolic arrows, grouped panels, and structured context to show relationships.
Keep conclusions visually restrained and grounded in source-supported facts.
```

## Text Rules

```text
Only include verified subject names, short explanation labels, dates, stakeholders, system parts, evidence labels, or cause-effect labels supplied by the feed.
Do not render unsourced conclusions or long explanatory paragraphs.
```

## Negative Constraints

```text
No invented causal claims, fake statistics, fake charts, fake maps, fake document text, unsupported predictions, dense unreadable annotations, or advice-poster slogans.
No source badges, watermarks, official seals, or copied UI.
```

# Policy Update Poster

## ID

`policy_update`

## Ratio

`16:9`

## Use

政策、监管、标准、治理、规则、法院、央行、交易所、平台规则或安全流程更新。

## Dynamic Inputs

Required when available:

- `institutionName`
- `policyName`
- `decisionLabel`
- `eventDate`

Optional:

- `country`
- `region`
- `sector`
- `affectedEntity`
- `ruleName`
- `standardName`
- `effectiveDate`
- `scope`
- `keyFact`

Do not render:

- full policy text
- legal numbers unless verified
- source URLs
- signatures

## Poster DSL Defaults

```yaml
ratio: 16:9
layout: split
focus: policy
maxLines: 2
```

## Prompt

```text
Use a formal policy or governance editorial composition with institutions, public documents, review tables, hearing rooms, standards boards, compliance workflows, or regulator context.
Keep the tone factual, restrained, and non-partisan.
Use the topic environment to define whether the policy is public-sector, AI, market, platform, safety, sports, or open-source governance.
Do not make the image look like an official document reproduction.
```

## Text Rules

```text
Only include verified institution names, policy names, decision labels, dates, effective dates, regions, sectors, or short factual labels supplied by the feed.
Keep readable text minimal; do not render long paragraphs or fake policy excerpts.
```

## Negative Constraints

```text
No fake official seals, policy numbers, signatures, legal citations, official letterhead, full document text, partisan framing, fake stamps, or unsupported readable text.
No source badges, watermarks, or fake government branding.
```

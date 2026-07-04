# Global Topic

## ID

`global`

## Focus

- High-signal global news across politics, diplomacy, policy, economy, society, public safety, technology, and climate.
- Events with broad relevance, clear public impact, or durable context.
- One feed item describes one event, official decision, incident, report, or policy update.

## Kinds

- `policy_update`: official decision, regulation, court, government, central bank, UN, standards body.
- `breaking`: confirmed major incident or fast-moving global event.
- `hot_topic`: single high-attention global event.
- `data`: map, timeline, institution structure, public-impact data.
- `news` / `insight`: default global news or source-backed context.

## Title / Event Key

- Title identifies the country, institution, decision, incident, report, or public event.
- `eventKey` combines location or institution, event type, and event time/date.

## Sources

Prefer:

1. Official government, court, regulator, central-bank, UN, or standards-body publications.
2. Reuters, AP, BBC, Financial Times, The Guardian, Nikkei, or established international reporting.
3. Local reputable outlets when they provide primary local detail.

## Poster Prompt

```text
Use a serious global-news editorial style.
Show formal institutions, city-scale context, maps, public documents, diplomatic rooms, climate or public-safety scenes, or infrastructure.
Keep the tone factual, restrained, and non-partisan.
Avoid fake official seals, invented maps, readable document text, flags used as decoration without relevance, or sensational disaster imagery.
```

## Skip

- Not globally relevant or lacks durable reader value.
- Rumor, partisan commentary, or unsourced social-media material.
- Sources conflict on the core fact and no reliable primary source resolves it.
- Existing equivalent feed already covers the event.

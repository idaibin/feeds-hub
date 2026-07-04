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

Priority:

- Primary: Reuters global reporting.
- Secondary: official government, court, regulator, UN agency, ministry, emergency-management, public-health, meteorological, election, treaty, or sanctions publication.
- Reference: X or Reddit for public attention and discussion context only.

If event time, location, casualty/damage number, policy scope, or institutional status cannot be confirmed by Primary or Secondary sources, skip the item.

## Poster Prompt

```text
Use a serious global-news editorial cover for a mobile-first news card, with formal institutions, city-scale context, map abstraction, public documents, diplomatic rooms, climate scenes, infrastructure, or public-safety environments depending on the feed.
For policy_update, show formal review, governance, court, central-bank, UN, regulator, or standards-body context. For breaking, show clear urgency with restrained composition and abstract secondary details. For hot_topic, focus on one bounded global event. For data or insight, show symbolic maps, timelines, institution structures, or public-impact panels without invented values.
Keep the tone factual, restrained, and non-partisan. Use verified country names, institution names, decision names, dates, locations, and report labels only when supplied by the feed.
Avoid fake official seals, invented maps, unreadable document text, decorative flags without relevance, sensational disaster imagery, partisan framing, fake statistics, and multi-event collages.
```

## Skip

- Not globally relevant or lacks durable reader value.
- Rumor, partisan commentary, or unsourced social-media material.
- Sources conflict on the core fact and no reliable primary source resolves it.
- Existing equivalent feed already covers the event.

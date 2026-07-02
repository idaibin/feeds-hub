# Global Topic

## Topic ID

`global`

## Focus

- High-signal global news across politics, diplomacy, policy, economy, society, public safety, technology, and climate.
- Events should have broad relevance, clear public impact, or durable context for readers.
- One feed item must describe one event, official decision, incident, report, or policy update.

## Output Format

- `category`: `global`
- Preferred `kind`: `policy_update` or `hot_topic`
- Title should identify the country, institution, or event.
- Summary should state what happened, when it happened, who is affected, and what remains uncertain.
- Avoid editorializing beyond sourced facts.
- Cover should be a WebP global-news poster following `docs/ui-spec.md`.

## Sources

Sources are optional, but every factual claim must be traceable. Prefer:

1. Official government, court, regulator, central-bank, UN, or standards-body publications.
2. Reuters, AP, BBC, Financial Times, The Guardian, Nikkei, or other established international reporting.
3. Local reputable outlets when they provide primary local detail.

## Skip Conditions

- The item is not globally relevant or lacks durable reader value.
- The only evidence is rumor, partisan commentary, or unsourced social-media material.
- Sources conflict on the core fact and no reliable primary source resolves it.
- The item duplicates an existing feed event without adding a confirmed new fact.

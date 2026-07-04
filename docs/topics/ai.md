# AI Topic

## ID

`ai`

## Focus

- AI model releases, product launches, research papers, benchmark updates, developer tools, infrastructure, policy, safety, and company strategy.
- Open-source model and framework updates with a clear release, repository change, paper, or official announcement.
- One feed item describes one release, paper, product update, funding or policy event, or engineering signal.

## Kinds

- `hot_topic`: model release, product launch, developer tool, funding, company strategy.
- `policy_update`: AI policy, safety, standards, governance, public-sector adoption.
- `data`: benchmark, architecture, model evaluation, ecosystem comparison.
- `ai`: structured AI technology update.
- `news` / `breaking` / `insight`: fallback for verified AI news that does not fit above.

## Title / Event Key

- Title names the model, product, company, paper, repository, policy event, or tool update.
- `eventKey` combines entity, event type, and date or release identifier.

## Sources

Prefer:

1. Official company blogs, product docs, model cards, GitHub repositories, standards bodies, research papers, arXiv.
2. Reputable technology and business reporting when primary sources are unavailable or add context.
3. Secondary summaries only when they link to verifiable primary material.

## Poster Prompt

```text
Use a modern AI technology editorial style.
Show model infrastructure, developer workflow, research dashboard, code terminal, chip substrate, data center, governance review, or product launch context.
Use clean high-tech visual language with blue, graphite, white, and subtle luminous accents.
Avoid generic robots, AGI hype, fake product UI, fake company logos, and readable benchmark numbers unless supplied by the feed.
```

## Skip

- Unsupported social-media discussion or vague rumor.
- Release, paper, repository, or policy item cannot be verified.
- Low-value rewrite of an existing item without a new fact.
- Capability, safety, or performance claims overstate the source.

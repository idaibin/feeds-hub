# AI Topic

## Topic ID

`ai`

## Focus

- AI model releases, product launches, research papers, benchmark updates, developer tools, infrastructure, policy, safety, and company strategy.
- Open-source model and framework updates when there is a clear release, repository change, paper, or official announcement.
- One feed item must describe one release, paper, product update, funding or policy event, or engineering signal.

## Output Format

- `category`: `ai`
- Preferred `kind`: `hot_topic` or `policy_update`
- Title should name the model, product, company, paper, repository, or policy event.
- Summary should distinguish confirmed release facts, research claims, reported plans, and speculation.
- `eventKey` should combine entity, event type, and date or release identifier.
- Cover should be a WebP AI/technology poster following `docs/rules/ui-spec.md`.

## Card Types

- `hot_topic`: model release, product launch, developer tool, funding or company strategy.
- `policy_update`: AI policy, safety, standards, governance, public-sector adoption.
- `data`: benchmark, architecture, model evaluation, ecosystem comparison.
- `ai`: structured AI technology update.
- `news` / `breaking` / `insight`: use only when the event does not fit the types above.

## Title Guidance

Title should name the model, product, company, paper, repository, policy event, or tool update.

## Sources

If this topic lists preferred sources, use them first. If not enough information is available there, search other public and verifiable sources. Every factual claim must be traceable. Prefer:

1. Official company blogs, product docs, model cards, GitHub repositories, standards bodies, research papers, or arXiv.
2. Reputable technology and business reporting when primary sources are unavailable or add useful context.
3. Secondary summaries only when they link to verifiable primary material.

## Topic Poster Prompt

```text
Use a modern AI technology editorial style.
Show model infrastructure, developer workflow, research dashboard, code terminal, chip substrate, data center, governance review, or product launch context.
Use clean high-tech visual language with blue, graphite, white, and subtle luminous accents.
Avoid generic robots, AGI hype, fake product UI, fake company logos, and readable benchmark numbers unless supplied by the feed.
```

## Skip Conditions

- The only evidence is unsupported social-media discussion or vague rumor.
- The release, paper, repository, or policy item cannot be verified.
- The story is a low-value rewrite of an existing item without a new fact.
- Claims about capability, safety, or performance are overstated beyond the source.

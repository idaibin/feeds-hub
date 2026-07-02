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
- Cover should be a WebP AI/technology poster following `docs/ui-spec.md`.

## Sources

Sources are optional, but every factual claim must be traceable. Prefer:

1. Official company blogs, product docs, model cards, GitHub repositories, standards bodies, research papers, or arXiv.
2. Reputable technology and business reporting when primary sources are unavailable or add useful context.
3. Secondary summaries only when they link to verifiable primary material.

## Skip Conditions

- The only evidence is unsupported social-media discussion or vague rumor.
- The release, paper, repository, or policy item cannot be verified.
- The story is a low-value rewrite of an existing item without a new fact.
- Claims about capability, safety, or performance are overstated beyond the source.

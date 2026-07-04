# Product Topic

## Topic ID

`product`

## Focus

- Startup, product design, growth, UX, monetization, launch, platform, and business-model updates.
- Product-led lessons should be tied to a concrete launch, experiment, policy, pricing change, teardown, or public operating signal.
- One feed item must describe one product event, company move, design pattern, growth signal, or founder/operator lesson.

## Output Format

- `category`: `product`
- Preferred `kind`: `hot_topic`, `market_brief`, or `policy_update`
- Title should identify the product, company, user problem, or business event.
- Summary should describe the observed product change and the practical implication.
- Keep analysis grounded in the source; avoid generic advice detached from the event.
- Cover should be a WebP product/design poster following `docs/rules/ui-spec.md`.

## Card Types

- `hot_topic`: launch, pricing change, product move, platform shift, founder/operator signal.
- `market_brief`: business model, monetization, growth, platform economics, market-facing update.
- `policy_update`: platform policy, app-store rule, privacy, pricing or regulatory change affecting products.
- `data`: funnel, journey, experiment, feature comparison, workflow.
- `visual`: image-led product or design feature.
- `news` / `insight`: default product news or source-backed product lesson.

## Title Guidance

Title should identify the product, company, user problem, launch, pricing change, design pattern, or business event.

## Sources

If this topic lists preferred sources, use them first. If not enough information is available there, search other public and verifiable sources. Every factual claim must be traceable. Prefer:

1. Official product announcements, changelogs, pricing pages, app store notes, founder posts, or company blogs.
2. Reputable business, product, design, or technology reporting.
3. Public user-facing product pages or release artifacts when they directly show the change.

## Topic Poster Prompt

```text
Use a polished product and design editorial style.
Show product surfaces, user journeys, interface abstractions, launch rooms, growth dashboards, pricing tables, or workflow diagrams.
Keep the visual grounded in a concrete product event or operator lesson.
Avoid fake app screens, copied UI, generic SaaS templates, unreadable dense text, or advice-poster aesthetics.
```

## Skip Conditions

- The item is generic product advice without a concrete event or source-backed example.
- The evidence is only anecdotal social commentary with no verifiable product change.
- The item mixes unrelated product lessons into one feed entry.
- The same launch, pricing change, or design update already exists as an equivalent feed item.

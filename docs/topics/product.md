# Product Topic

## ID

`product`

## Focus

- Startup, product design, growth, UX, monetization, launch, platform, and business-model updates.
- Lessons must tie to a concrete launch, experiment, policy, pricing change, teardown, or public operating signal.
- One feed item describes one product event, company move, design pattern, growth signal, or founder/operator lesson.

## Kinds

- `hot_topic`: launch, pricing change, product move, platform shift, founder/operator signal.
- `market_brief`: business model, monetization, growth, platform economics, market-facing update.
- `policy_update`: platform policy, app-store rule, privacy, pricing or regulation affecting products.
- `data`: funnel, journey, experiment, feature comparison, workflow.
- `visual`: image-led product or design feature.
- `news` / `insight`: default product news or source-backed product lesson.

## Title / Event Key

- Title identifies the product, company, user problem, launch, pricing change, design pattern, or business event.
- `eventKey` combines product/company, event type, and date or release identifier.

## Sources

Priority:

- Primary: official blogs, changelogs, release notes, pricing pages, product docs, or help-center pages.
- Secondary: Reuters for company, policy, pricing, launch, or market-context reporting; GitHub when the product event is a release or repository change.
- Reference: X or Reddit for product attention and discussion context only.

If launch status, pricing, availability, feature scope, or platform policy cannot be confirmed by Primary or Secondary sources, skip the item.

## Poster Prompt

```text
Use a polished product and design editorial cover for a mobile-first news card, with product surfaces, journey abstractions, launch context, growth dashboards, structured comparison panels, workflow diagrams, or platform ecosystem scenes.
For hot_topic, focus on one launch, pricing change, product move, platform shift, or founder/operator signal. For market_brief, show business-model, monetization, growth, or platform-economics context. For policy_update, show platform rules, app-store policy, privacy, pricing, or regulation impact context. For data or visual, show a clear funnel, journey, comparison, workflow, or product detail.
Keep the visual grounded in a concrete product event or operator lesson. Use verified product names, company names, feature names, pricing facts, dates, and platform terms only when supplied by the feed.
Avoid fake product screens, copied interface layouts, generic SaaS templates, advice-poster aesthetics, invented metrics, fake pricing tables, unreadable dense text, and unrelated product lessons mixed into one cover.
```

## Skip

- Generic product advice without a concrete event or source-backed example.
- Anecdotal social commentary with no verifiable product change.
- Unrelated product lessons mixed into one feed.
- Equivalent launch, pricing change, or design update already exists.

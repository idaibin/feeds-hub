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

Priority:

- Primary: official blogs, docs, model cards, system cards, API docs, release notes, and changelogs from OpenAI, Anthropic / Claude, Google DeepMind / Gemini, Meta AI, Microsoft AI, xAI, Zhipu AI / GLM, Alibaba Cloud / Qwen, Moonshot AI / Kimi, Baidu ERNIE, Tencent Hunyuan, DeepSeek, and other head AI companies.
- Secondary: GitHub releases, Hugging Face model pages, research papers, arXiv, standards bodies, and official benchmark or safety reports.
- CN Reference: 机器之心 or 量子位 for Chinese expression and local attention reference.

If model name, release status, API availability, benchmark, pricing, or safety claim conflicts across Primary and Secondary, skip the item.

## Poster Prompt

```text
Use a modern AI technology editorial cover for a mobile-first news card, with model infrastructure, developer workflow, research dashboard, code terminal, chip substrate, data center, governance review, or product launch context depending on the feed.
For hot_topic or ai, show one focused technology subject such as a model release, agent workflow, API console abstraction, or infrastructure scene. For policy_update, show formal review rooms, document tables, compliance workflows, or standards boards. For data, show symbolic evaluation grids, architecture maps, or benchmark dashboards without invented numbers.
Use clean high-tech visual language with blue, graphite, white, slate, and subtle luminous accents. Keep readable text minimal and include exact model names, tool names, policy names, dates, or benchmark labels only when supplied by the feed.
Avoid generic robots, AGI hype, fake product UI, fake company logos, invented benchmark values, fake API screenshots, unreadable dense dashboards, and unsourced capability claims.
```

## Skip

- Unsupported social-media discussion or vague rumor.
- Release, paper, repository, or policy item cannot be verified.
- Low-value rewrite of an existing item without a new fact.
- Capability, safety, or performance claims overstate the source.

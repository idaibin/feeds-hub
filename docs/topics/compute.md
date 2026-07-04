# Compute Topic

## ID

`compute`

## Focus

- AI infrastructure, chips, HBM, data centers, cloud capex, networking, cooling, power supply, and compute supply-chain constraints.
- Company, sector, capacity, policy, energy, or infrastructure events that connect AI demand, semiconductor supply, and market context.
- One feed item describes one infrastructure event, company update, supply-chain signal, capex signal, policy decision, or data-center/power development.

## Kinds

- `market_brief`: company, sector, capex, supply-chain, cloud, chip, power, or infrastructure market signal.
- `hot_topic`: one high-attention compute infrastructure event or company move.
- `data`: capacity, power, capex, supply-chain, memory, network, cooling, or data-center structure.
- `insight`: source-backed context around a bounded compute infrastructure event.
- `policy_update`: export control, grid, energy, permitting, regulator, or industrial policy update.
- `news`: default verified compute infrastructure news.

## Title / Event Key

- Title identifies the company, chip, infrastructure asset, cloud provider, data-center project, power constraint, policy, or supply-chain signal.
- `eventKey` combines entity or sector, event type, and date, quarter, filing identifier, release identifier, or project identifier when available.

## Sources

Priority:

- Primary: Reuters technology or markets reporting.
- Secondary: company investor relations, earnings releases, filings, official blogs, or official announcements from major chip, cloud, power, and infrastructure suppliers.
- Reference: X or Reddit for compute-infrastructure attention and discussion context only.

If capex, capacity, chip availability, project status, revenue guidance, power requirement, policy scope, or shipment timing cannot be confirmed by Primary or Secondary sources, skip the item.

## Poster Prompt

```text
Use a premium AI infrastructure and compute-industry editorial cover style.

Show one clear technology-infrastructure subject: AI chips, GPU clusters, data centers, HBM memory, cloud infrastructure, networking, cooling systems, energy supply, semiconductor manufacturing, or capital-expenditure context.

Use a clean industrial high-tech visual language with deep slate, graphite, blue, cyan, white, and subtle luminous accents.
Prefer realistic data-center aisles, chip substrates, server racks, cooling pipes, power-grid context, supply-chain maps, semiconductor wafers, or institutional research dashboards.

For market_brief, show calm sector-analysis context with chips, infrastructure, cloud capex, or energy demand.
For hot_topic, focus on one company, chip, supply-chain event, infrastructure buildout, or compute bottleneck.
For data, show symbolic capacity maps, supply-chain diagrams, capex dashboards, power-demand panels, or architecture graphs.
For insight, show cause-and-effect paths between AI demand, chips, data centers, power, cooling, and market impact.
For policy_update, show energy, export-control, industrial-policy, or infrastructure-governance context.

Use verified company names, chip names, product names, metrics, dates, regions, facility names, supply-chain facts, or market terms only when supplied by the feed.

Avoid fake company logos, fake chip labels, fake benchmark values, fake stock charts, invented power numbers, invented capacity figures, fake factory markings, fake official documents, AGI hype, and unsupported readable text.
```

## Skip

- Pure stock-price movement without a verified infrastructure, filing, capex, supply-chain, or policy event.
- Rumor-only supply-chain claims without a reliable source.
- AI hype that does not name a concrete compute, chip, cloud, data-center, power, or supplier fact.
- Equivalent company, sector, policy, or infrastructure event already exists.

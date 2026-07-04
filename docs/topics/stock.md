# Stock Topic

## ID

`stock`

## Focus

- Market-moving equity, index, IPO, macro, earnings, regulatory, and sector news.
- A-share, Hong Kong, US, Nasdaq, growth markets, AI infrastructure, energy, chips, currency, and rates when they affect market context.
- One feed item describes one market event, company event, data release, or policy update.

## Kinds

- `market_brief`: index, sector, company, earnings, IPO, macro, rates, currency or market move.
- `policy_update`: regulator, central bank, exchange, filing, monetary policy or official announcement.
- `hot_topic`: single market-moving company or sector event.
- `data`: index chart, sector rotation, macro dashboard, earnings table, flow map.
- `breaking` / `news` / `insight`: confirmed major update, default financial news, or source-backed context.

## Title / Event Key

- Title identifies the market, company, sector, index, policy, data release, earnings event, or macro update.
- `eventKey` combines market/company/entity, event type, and timestamp/date.

## Sources

Priority:

- Primary: Reuters markets reporting.
- Secondary: exchange announcements, filings, company investor relations, or official regulator notices.
- Reference: X or Reddit for market attention and discussion context only.

If company, market data, trading date, index move, earnings fact, or policy fact cannot be confirmed by Primary or Secondary sources, skip the item.

## Poster Prompt

```text
Use a neutral financial editorial cover for a mobile-first news card, with an institutional research desk, market dashboard environment, sector rotation wall, macro screen, exchange context, filing review, or earnings analysis room.
For market_brief, show structured index or sector modules, analyst screens, and calm market context without directional trading signals. For policy_update, show regulator, central-bank, exchange, filing, or policy-document review context. For hot_topic, focus on one company, sector, IPO, earnings, or macro event. For data, show symbolic dashboards, flow maps, or earnings tables only when the feed supplies the factual labels.
Use verified market names, company names, tickers, dates, numbers, index names, and macro terms only when supplied by the feed.
Avoid buy/sell/hold cues, profit promises, panic-crash visuals, fake candlestick values, fake tickers, fake price charts, invented percentages, and personalized investment advice.
```

## Skip

- No verified source, filing, market data point, or official announcement.
- Content would read as personalized investment advice.
- Price movement lacks event, source, or timestamp.
- Equivalent company, policy, or market event already exists.

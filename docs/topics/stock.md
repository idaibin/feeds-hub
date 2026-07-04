# Stock Topic

## Topic ID

`stock`

## Focus

- Market-moving equity, index, IPO, macro, earnings, regulatory, and sector news.
- A-share, Hong Kong, US, Nasdaq, growth markets, AI infrastructure, energy, chips, currency, and rates when they affect market context.
- One feed item must describe one market event, company event, data release, or policy update.

## Output Format

- `category`: `stock`
- Preferred `kind`: `market_brief`, `policy_update`, or `hot_topic`
- Title should identify the market, company, sector, or event.
- Summary should state the known data point or announcement and the relevant market context.
- Include risk language when facts are preliminary or market impact is uncertain.
- Do not provide personalized investment advice.
- Cover should be a WebP market poster or chart-style visual following `docs/rules/ui-spec.md`.

## Card Types

- `market_brief`: index, sector, company, earnings, IPO, macro, rates, currency or market move.
- `policy_update`: regulator, central bank, exchange, filing, monetary policy or official announcement.
- `hot_topic`: single market-moving company or sector event.
- `data`: index chart, sector rotation, macro dashboard, earnings table, flow map.
- `breaking` / `news` / `insight`: confirmed major update, default financial news, or source-backed context.

## Title Guidance

Title should identify the market, company, sector, index, policy, data release, earnings event, or macro update.

## Sources

If this topic lists preferred sources, use them first. If not enough information is available there, search other public and verifiable sources. Every factual claim must be traceable. Prefer:

1. Exchange announcements, company filings, official regulator notices, earnings releases, and central-bank publications.
2. Reuters, Bloomberg, Wall Street Journal, Financial Times, Nikkei, Caixin, or other established financial reporting.
3. Market data pages only when the data point and timestamp are clear.

## Topic Poster Prompt

```text
Use a neutral financial editorial style.
Show institutional research desks, market dashboards, sector rotation, macro screens, filings, exchange context, or company earnings environment.
Use verified market names, numbers, dates, and tickers only when supplied by the feed.
Avoid buy/sell signals, profit promises, panic-crash visuals, fake candlestick values, and personalized investment advice.
```

## Skip Conditions

- The item cannot be tied to a verified source, filing, market data point, or official announcement.
- The content would read as personalized investment advice.
- Price movement is mentioned without a clear event, source, or timestamp.
- The same company, policy, or market event already exists as an equivalent feed item.

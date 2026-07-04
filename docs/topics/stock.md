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

Prefer:

1. Exchange announcements, company filings, official regulator notices, earnings releases, and central-bank publications.
2. Reuters, Bloomberg, Wall Street Journal, Financial Times, Nikkei, Caixin, or established financial reporting.
3. Market data pages only when data point and timestamp are clear.

## Poster Prompt

```text
Use a neutral financial editorial style.
Show institutional research desks, market dashboards, sector rotation, macro screens, filings, exchange context, or company earnings environment.
Use verified market names, numbers, dates, and tickers only when supplied by the feed.
Avoid buy/sell signals, profit promises, panic-crash visuals, fake candlestick values, and personalized investment advice.
```

## Skip

- No verified source, filing, market data point, or official announcement.
- Content would read as personalized investment advice.
- Price movement lacks event, source, or timestamp.
- Equivalent company, policy, or market event already exists.

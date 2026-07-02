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
- Cover should be a WebP market poster or chart-style visual following `docs/ui-spec.md`.

## Sources

Sources are optional, but every factual claim must be traceable. Prefer:

1. Exchange announcements, company filings, official regulator notices, earnings releases, and central-bank publications.
2. Reuters, Bloomberg, Wall Street Journal, Financial Times, Nikkei, Caixin, or other established financial reporting.
3. Market data pages only when the data point and timestamp are clear.

## Skip Conditions

- The item cannot be tied to a verified source, filing, market data point, or official announcement.
- The content would read as personalized investment advice.
- Price movement is mentioned without a clear event, source, or timestamp.
- The same company, policy, or market event already exists as an equivalent feed item.

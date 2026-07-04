# Market Brief Poster

## ID

`market_brief`

## Ratio

`16:9`

## Use

市场、指数、板块、财报、IPO、利率、汇率、宏观或公司市场简报。

## Dynamic Inputs

Required when available:

- `marketName`
- `eventTitle`
- `keyFact`

Optional:

- `indexName`
- `sectorName`
- `companyName`
- `ticker`
- `metricName`
- `metricValue`
- `reportingPeriod`
- `eventDate`
- `macroContext`
- `policyContext`

Do not render:

- personalized advice
- source URLs
- internal IDs
- unsupported price targets

## Poster DSL Defaults

```yaml
ratio: 16:9
layout: dashboard
focus: market
maxLines: 2
```

## Prompt

```text
Use a neutral market dashboard, institutional research desk, sector rotation wall, macro screen, filing review, exchange context, or earnings analysis composition.
Show calm market context with structured panels and one clear market-moving subject.
Use data visualization elements symbolically unless exact values are supplied by the feed.
Keep the tone analytical, restrained, and non-advisory.
```

## Text Rules

```text
Only include verified market names, index names, sector names, company names, tickers, dates, reporting periods, metric labels, or values supplied by the feed.
If the feed does not provide exact numbers, use non-readable symbolic charts.
```

## Negative Constraints

```text
No buy, sell, hold, target price, profit promise, panic-crash framing, fake candlestick values, fake tickers, fake percentages, fake charts, or personalized investment advice.
No broker logos, exchange logos, source badges, watermarks, or unsupported readable text.
```

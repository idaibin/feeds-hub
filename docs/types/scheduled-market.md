# Scheduled Market Type Rules

定时市场规则，供 `stock` 等市场 topic 的固定窗口信息引用。目标是稳定覆盖开盘、盘中、收盘、财报日和宏观数据发布窗口。

## Scope

- 适用于 market open, intraday checkpoint, market close, earnings calendar, macro-data release, central-bank schedule, and exchange/regulator scheduled events.
- 1 feed = 1 market window, 1 official data release, 1 earnings event, or 1 policy/filing event.
- 定时市场信息优先文本事实和数据口径；海报失败不阻塞发布。

## Time Windows

- Opening window: record market, date, opening direction, major index or sector movement, and timestamp.
- Intraday window: record market, time, current state, leading sectors/assets, and whether the data is still live.
- Close window: record closing result, index/sector moves, major driver, and confirmed close timestamp.
- Scheduled data: record release time, value, prior/expected value only when source provides it, and market reaction if verified.

## Source Rules

- Primary: Reuters markets reporting.
- Secondary: exchanges, filings, investor relations, regulator notices, central-bank releases, official statistics agencies, and company earnings releases.
- Do not use social posts, unsourced screenshots, or community commentary to confirm prices, index moves, earnings facts, or macro data.
- If the source lacks timestamp, market, or data scope, skip or write a low-certainty caveat only when the core fact is still reliable.

## Event Key And Deduplication

- `eventKey` combines market/entity, scheduled window, date, and release/filing/earnings identifier when available.
- Opening, intraday, and close are distinct states for the same market day.
- A later close result is not a duplicate of an opening or intraday feed.
- Same Reuters live page URL can support multiple market states; do not dedupe by `sourceUrl` alone.

## Body Format

- First paragraph: market/date/window, verified movement or official data, and timestamp.
- Second paragraph: sector/asset drivers, company or policy context, confirmed market reaction, or remaining uncertainty.
- Optional third paragraph: data revisions, timing caveat, or next scheduled checkpoint.
- No personalized investment advice, target price, return promise, unsupported causal claim, or stale no-timestamp price.

---
id: stock
type: market
flows:
  - scheduled-market
sources:
  primary:
    - Reuters
  secondary:
    - exchanges
    - filings
    - investor relations
    - regulators
    - central banks
    - official statistics agencies
    - company earnings releases
  supplemental: []
contentDir: src/content/stock/
allowedKinds:
  - market_brief
---

# Stock Topic

Uses `docs/types/scheduled-market.md`.

## Scope

Daily close reports for A-share, Hong Kong, and US markets.

Do not write stock feeds for pre-market, intraday, futures, single-company moves, AI/chip sector commentary, macro previews, analyst notes, or earnings alone. Those facts may appear only as verified market context inside a close report.

## Overrides

- Every exchange trading day must check three fixed close windows: A-share, Hong Kong, US.
- Run close-gap checks even if another stock feed already exists for the same date.
- A trading day is covered only by the exact close `eventKey` for that market and date.
- Valid market ids are `a-share`, `hk`, and `us`.
- Close feeds need market, trade date, close window, key index level/move, turnover/volume if available, sector move, confirmed driver, and next market watch item.
- Title must start with the market, for example `A 股收盘...`, `港股收盘...`, or `美股收盘...`.
- Summary adds the most important market context not already in the title.
- If a market is closed for holiday, publish no close feed and report `skipped: market-holiday` with the exchange calendar source.
- AI/chips, earnings, central banks, regulators, macro data, exchange notices, large filings, FX/rates are context only; do not create standalone stock feeds for them.
- Do not confirm prices, moves, gains, or market direction from social posts, screenshots, or community commentary.

---
id: stock
type: market
flows:
  - realtime
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
  - policy_update
  - hot_topic
  - data
  - breaking
  - news
  - insight
---

# Stock Topic

Uses `docs/types/realtime.md` and `docs/types/scheduled-market.md`.

## Scope

US, Hong Kong, A-share closes; AI/chip/macro/earnings/policy/FX/rates/company market facts.

## Overrides

- Every exchange trading day must check three fixed close windows: A-share, Hong Kong, US.
- Close feeds need market, trade date, close window, key index level/move, sector move, and confirmed driver.
- If a market is closed for holiday, publish no close feed and report `skipped: market-holiday` with the exchange calendar source.
- High priority: AI/chips, earnings, central banks, regulators, macro data, exchange notices, large filings.
- Do not confirm prices, moves, gains, or market direction from social posts, screenshots, or community commentary.

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
  supplemental: []
contentDir: src/content/stock/
coverPrefix: /images/stock/
allowedKinds:
  - market_brief
  - policy_update
  - hot_topic
  - data
  - breaking
  - news
  - insight
---

# Stock Topic Config

Uses both `docs/types/realtime.md` and `docs/types/scheduled-market.md`; opening, intraday, and close are distinct states.

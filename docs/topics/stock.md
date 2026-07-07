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

## Topic Overrides

- Default scheduled coverage prioritizes US, Hong Kong, and A-share market close summaries.
- A close feed must include the market, date, close window, verified index or sector movement, and the strongest confirmed driver available from the source.
- Other high-priority items include AI/chip market moves, major earnings, central-bank decisions, regulator actions, macro data, exchange notices, and large company filings.
- Do not confirm prices, index moves, sector gains, or market direction from social posts, screenshots, or community commentary.

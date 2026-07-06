---
id: compute
type: realtime
flows:
  - realtime
sources:
  primary:
    - Reuters
  secondary:
    - company investor relations
    - filings
    - official announcements
  supplemental: []
contentDir: src/content/compute/
coverPrefix: /images/compute/
allowedKinds:
  - market_brief
  - hot_topic
  - data
  - insight
  - policy_update
  - news
---

# Compute Topic Config

Uses `docs/types/realtime.md`; focus on AI infrastructure, chips, HBM, data centers, cloud capex, power, and supply-chain facts.

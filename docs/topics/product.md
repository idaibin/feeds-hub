---
id: product
type: realtime
flows:
  - realtime
sources:
  primary:
    - official blogs
    - changelogs
    - release notes
    - pricing pages
    - product docs
    - help-center pages
  secondary:
    - Reuters
    - GitHub
  supplemental: []
contentDir: src/content/product/
allowedKinds:
  - hot_topic
  - market_brief
  - policy_update
  - data
  - visual
  - news
  - insight
---

# Product Topic

Uses `docs/types/realtime.md`; every item must bind to a concrete public product, pricing, policy, launch, or design event.

---
id: ai
type: realtime
flows:
  - realtime
sources:
  primary:
    - Reuters
  secondary:
    - GitHub releases
    - official model pages
    - official product pages
    - research papers
    - arXiv
    - OpenAI
    - Anthropic
    - 阿里/通义千问
    - 智谱 GLM
  supplemental:
    - Reddit
    - official X
contentDir: src/content/ai/
coverPrefix: /images/ai/
allowedKinds:
  - hot_topic
  - policy_update
  - data
  - ai
  - news
  - breaking
  - insight
---

# AI Topic Config

Uses `docs/types/realtime.md`; hard facts must be confirmed by configured primary or secondary sources.

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
    - GitHub repositories
    - official model pages
    - official product pages
    - official documentation
    - official cookbook pages
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

## Topic Overrides

- Covers AI news, model/product updates, developer workflows, practical skills, prompt or agent techniques, and tool usage guidance when the source is verifiable.
- Skill or technique items must be tied to a concrete artifact: official docs, cookbook, release note, GitHub repository, paper, product page, or maintainer explanation.
- Do not publish generic tips, unsourced prompt recipes, benchmark claims without test context, or social-media-only workflows.
- When a GitHub repository is the main event, use `github` unless the item is primarily about an AI product or model capability.

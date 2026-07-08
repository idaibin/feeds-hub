---
id: ai
type: realtime
flows:
  - realtime
sources:
  primary:
    - Reuters
  secondary:
    - OpenAI
    - Anthropic
    - Google Gemini
    - 智谱 GLM
    - 阿里 Qwen
    - 月之暗面 Kimi
    - DeepSeek
    - Nvidia
    - official model pages
    - official product pages
    - official documentation
    - official cookbook pages
    - GitHub releases
    - GitHub repositories
    - research papers
    - arXiv
  supplemental:
    - Reddit
    - official X
contentDir: src/content/ai/
allowedKinds:
  - hot_topic
  - policy_update
  - data
  - ai
  - news
  - breaking
  - insight
---

# AI Topic

Uses `docs/types/realtime.md`.

## Scope

AI news, models, products, policy, safety, research, developer tools, infrastructure, and source-backed skills/tips.

## Priority

每轮先按顺序查官方来源和权威报道：

1. OpenAI
2. Anthropic
3. Google Gemini
4. 智谱 GLM
5. 阿里 Qwen
6. 月之暗面 Kimi
7. DeepSeek
8. Nvidia 和 AI 芯片链

同等重要时优先模型能力、产品可用性、API/开发者文档、价格/限制、安全政策、重大研究、工程工作流。Nvidia/芯片类优先写与 AI 训练/推理、GPU、CUDA、HBM、集群、出口限制、供给和资本开支直接相关的信息；纯股价表现放入 `stock`。

## Overrides

- Skills/tips need official docs, cookbook, release note, repo, paper, product page, or maintainer explanation.
- Do not publish generic prompt recipes, benchmark claims without test context, or social-media-only workflows.
- If the main event is a repository, use `github` unless the story is primarily about an AI product/model capability.

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
    - Google DeepMind
    - xAI Grok
    - Meta AI
    - Microsoft AI
    - Mistral AI
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

### 厂商重点名单

国际模型厂商按以下顺序持续覆盖：OpenAI、Anthropic、Google DeepMind / Gemini、
xAI / Grok、Meta AI、Microsoft AI、NVIDIA、Mistral AI。国内模型厂商重点覆盖
Qwen、DeepSeek、Z.ai / GLM；Kimi 保留为补充来源。

厂商事实优先使用官方 News、Blog、Research、Docs、Changelog、GitHub org / release。
官方 X 账号只用于抢先发现；涉及 benchmark、价格、API、弃用、安全、融资或监管时，
必须回到官方页面或独立权威来源确认。handle 可能变化，不把 X handle 当稳定事件主键。

X 发现采用三层白名单：

1. L1 组织账号：OpenAI、Google DeepMind、Anthropic、Meta AI、Microsoft AI、
   NVIDIA AI、Mistral AI、xAI，以及 Qwen、DeepSeek、Z.ai 的可核验官方账号。
2. L2 项目账号：上述组织的模型、开发者平台、GitHub 项目和基础设施账号。
3. L3 高信号个人：公司高管、研究负责人和开源维护者。

只有 L1 官方账号可以标记为一手来源候选；L2/L3 默认只提供 discovery 信号。
不做无限关键词扫描，不因 X 热度提高事实置信度。

同等重要时优先模型能力、产品可用性、API/开发者文档、价格/限制、安全政策、重大研究、工程工作流。Nvidia/芯片类优先写与 AI 训练/推理、GPU、CUDA、HBM、集群、出口限制、供给和资本开支直接相关的信息；纯股价表现放入 `stock`。

## Overrides

- Skills/tips need official docs, cookbook, release note, repo, paper, product page, or maintainer explanation.
- Do not publish generic prompt recipes, benchmark claims without test context, or social-media-only workflows.
- If the main event is a repository, use `github` unless the story is primarily about an AI product/model capability.

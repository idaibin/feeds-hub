---
id: github
type: realtime
flows:
  - realtime
sources:
  primary:
    - GitHub Search
    - GitHub API
    - GitHub Trending
    - GitHub releases
    - GitHub tags
    - GitHub advisories
  secondary:
    - repository README
    - repository changelog
    - official project docs
    - official project blog
    - maintainer release notes
  supplemental:
    - Reddit
    - Hacker News
    - official X
contentDir: src/content/github/
allowedKinds:
  - hot_topic
  - news
  - insight
  - data
  - breaking
  - policy_update
  - ai
---

# GitHub Topic

Uses `docs/types/realtime.md`.

## Scope

Daily technical report for yesterday's trending repository or sharp star-growth repository. AI-related open source is preferred.

重点覆盖以下 AI 开源方向：

- `AI / LLM / multimodal`：模型、推理、训练、评测、RAG 和数据工具；
- `skills`：Agent Skills、MCP server、connector、tool registry 和工作流资产；
- `Agent`：coding agent、browser agent、research agent、多 Agent 协作和运行时；
- `UI`：AI chat、generative UI、canvas、workflow builder、可视化和前端组件；
- `image`：图像生成/编辑、视觉理解、OCR、视频与多模态工具。

优先观察 OpenAI、Anthropic、Google DeepMind、xAI、Meta、Microsoft、NVIDIA、
Mistral、Qwen、DeepSeek、Z.ai 的官方组织与 release；大型综合组织必须用 repo
allowlist 或主题筛选，不能把整个组织的所有仓库都算作 AI 趋势。

## Overrides

- Prefer AI, agents, model tooling, dev workflow, infrastructure, security, and frameworks.
- GitHub Trending 只负责发现；正式版本、能力和 breaking change 回到仓库 release、tag、
  changelog、README 或官方文档确认。
- GitHub 没有官方 Trending API。趋势证据必须记录采集时间、排名或可复核的 star
  增量；不能把当前总 star 数写成昨日增量。
- Write at most 1 GitHub feed per Beijing calendar day.
- Default target is yesterday. If yesterday's data is incomplete, report `skipped: source-lag` rather than using today's ranking.
- Star growth needs GitHub Search/API/Trending, visible repo count with timestamp, or other verifiable public source.
- Include owner/name, repo URL, language/stack, ranking or star/growth evidence, observed state, and developer relevance.
- The body must explain the technical content: what the repo does, why developers care, and what changed or gained attention.
- Use `source: GitHub` unless the hard fact comes from an official non-GitHub project page.

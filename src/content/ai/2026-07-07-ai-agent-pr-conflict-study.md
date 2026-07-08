---
title: "AI Agent PR 并发冲突研究发布"
subtitle: "研究样本覆盖 2,807 个仓库和 33,596 个代理 PR"
category: "ai"
kind: "data"
topic: "AI 编程代理协作"
date: "2026-07-07T23:59:48+08:00"
eventAt: "2026-07-06T05:58:12Z"
eventKey: "ai:data:ai-agent-pr-concurrency-merge-conflict-study:2607.04697"
cover: "/images/ai/2026-07-07-ai-agent-pr-conflict-study.webp"
coverStatus: "pending"
tags:
  - "AI Agent"
  - "GitHub"
  - "Pull Request"
  - "协作冲突"
summary: "跨代理 PR 文本冲突率为 41.7%，约为同代理并发 PR 的两倍。"
source: "arXiv"
sourceUrl: "https://arxiv.org/abs/2607.04697"
reviewed: true
priority: 84
---

7 月 6 日发布的一篇研究分析了 AIDev-pop 数据集中的 33,596 个代理提交 PR，样本来自 2,807 个 GitHub 仓库。研究关注 AI 编程代理在同一仓库中并发提交 PR 时的重叠频率，以及这些 PR 在合并时产生文本冲突的比例。

在严格时间重叠口径下，40.2% 的仓库存在并发活跃的代理 PR 配对，这些并发配对覆盖了 79.4% 的代理 PR。若把并发窗口扩大到 7 天，涉及仓库比例升至 53.4%，涉及 PR 比例升至 95.0%。

研究随后对 747 组并发配对进行三方合并回放，其中 716 组可评估。同一代理产生的并发 PR 文本冲突率为 19.8%，不同代理之间的并发 PR 文本冲突率为 41.7%；跨代理配对在严格并发样本中占比仅 0.5%，分布在 122 个仓库中。

冲突文件主要集中在源码文件，占全部冲突文件的 84.4%。按冲突类型看，内容冲突占 57.6%，modify/delete 占 26.8%，add/add 占 15.1%；研究只衡量文本层冲突，因此该结果被定义为对多代理协作摩擦的保守下界。

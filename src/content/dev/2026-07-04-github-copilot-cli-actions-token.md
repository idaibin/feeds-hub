---
title: "Copilot CLI 支持 Actions 使用 GITHUB_TOKEN"
subtitle: "GitHub Changelog 显示，自动化工作流可减少长期 PAT 管理"
category: "dev"
kind: "ai"
topic: "AI 编程工具自动化"
date: "2026-07-04T12:58:35Z"
eventAt: "2026-07-02T00:00:00Z"
eventKey: "dev:github-copilot-cli:actions-github-token:2026-07-02"
cover: "/images/dev/2026-07-04-github-copilot-cli-actions-token.webp"
coverStatus: "generated_webp"
tags:
  - "GitHub Actions"
  - "Copilot CLI"
  - "GITHUB_TOKEN"
  - "AI 编程工具"
summary: "GitHub Changelog 显示，Copilot CLI 可在 Actions 中使用 GITHUB_TOKEN 认证。"
source: "GitHub Changelog"
sourceUrl: "https://github.blog/changelog/2026-07-02-copilot-cli-no-longer-needs-a-personal-access-token-in-github-actions/"
reviewed: true
priority: 86
---

GitHub Changelog 7 月 2 日显示，Copilot CLI 现在可在 GitHub Actions 中使用内置 GITHUB_TOKEN 认证，不再需要为自动化任务创建和保存个人访问令牌。

组织仓库使用该能力时，CLI 消耗的 AI credits 会直接计入组织；工作流需要 `copilot-requests: write` 权限，并需启用对应 Copilot 组织计费策略。

---
title: "GitHub：cloudflare/agents 聚合 Agent 运行时能力"
subtitle: "TypeScript SDK 当前约 5.2k stars，覆盖 Durable Objects、MCP 与工作流"
category: "github"
kind: "ai"
topic: "cloudflare/agents"
date: "2026-07-09T18:00:49+08:00"
eventAt: "2026-07-09T10:00:49Z"
eventKey: "github:cloudflare-agents:runtime-watch:2026-07-09"
cover: "/images/github/2026-07-09-cloudflare-agents-runtime.webp"
coverStatus: "pending"
tags:
  - "GitHub"
  - "Cloudflare"
  - "Agents"
  - "TypeScript"
summary: "GitHub Search 在 AI agents / TypeScript / pushed:2026-07-08 查询中返回 cloudflare/agents；仓库 README 将其定位为 Cloudflare 上的 AI Agent 构建与部署工具。"
source: "GitHub"
sourceUrl: "https://github.com/cloudflare/agents"
reviewed: true
priority: 86
---

GitHub 仓库 `cloudflare/agents` 当前公开显示约 5.2k stars、617 forks，并把项目描述为用于在 Cloudflare 上构建和部署 AI Agents 的 TypeScript SDK。本轮将它作为 GitHub 技术内容记录，依据是 GitHub Search 在 AI agents / TypeScript / `pushed:2026-07-08` 条件下返回该仓库，且仓库页面可核验核心能力与当前公开状态。

该项目把 Agent 抽象建立在 Cloudflare Durable Objects 上，README 说明每个 Agent 拥有独立状态、存储与生命周期，并支持实时通信、调度、AI 模型调用、MCP、Workflows、Email、Voice、浏览器 Agent、Code Mode、沙箱执行、x402 支付、Observability 和 SQLite 查询等能力。

对开发者的价值在于，它不是单一聊天示例，而是把持久状态、可调用方法、React hooks、MCP 客户端/服务端、工作流审批和多示例目录放在同一个仓库中。后续继续观察其 packages、examples、docs 与 Cloudflare 开发者文档是否出现稳定 release note、迁移说明或 API 变更。
---
title: "Rust 1.96.1 发布维护更新"
subtitle: "Rust 官方博客显示，该版本修复 Cargo HTTP、MIR 优化和 libssh2 问题"
category: "rust"
kind: "hot_topic"
topic: "Rust 1.96.1"
date: "2026-07-04T09:45:00+08:00"
eventAt: "2026-06-30T00:00:00+08:00"
eventKey: "rust:hot_topic:rust-1-96-1-maintenance-release:2026-06-30"
cover: "/images/rust/2026-06-30-rust-1961-maintenance-release.webp"
coverStatus: "pending"
tags:
  - "Rust"
  - "Cargo"
  - "Release"
  - "libssh2"
summary: "Rust Release Team 发布 Rust 1.96.1，修复 Cargo HTTP、MIR 优化和 libssh2 问题。"
source: "Rust Blog"
sourceUrl: "https://blog.rust-lang.org/2026/06/30/Rust-1.96.1/"
reviewed: true
priority: 76
---

Rust Release Team 6 月 30 日发布 Rust 1.96.1。官方博客称，这是一个 point release，修复内容包括 Cargo HTTP client 缺少 retries / timeouts，以及 MIR 优化中的 miscompilation 问题。

同一公告还称，该版本修复了 Cargo 内置 libssh2 受到影响的三个 CVE。已有旧版本 Rust 的用户可通过 `rustup update stable` 更新到该版本。

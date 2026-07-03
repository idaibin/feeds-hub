# Rust Poster Prompt

## Category

`rust`

## 主题特色

Rust 主题应突出开源、终端、代码、编译器、工具链、基础设施、性能、安全和开发者生态。画面要工程化、清晰、可信，避免空泛“程序员背景图”。

## 尺寸规则

按 `docs/posters/type-matrix.md` 推导比例：

| kind | ratio | size | 用途 |
|---|---:|---:|---|
| `news` / `breaking` / `insight` / `hot_topic` / `policy_update` | `16:9` | `1600x900` | 默认工程新闻封面 |
| `data` | `4:3` | `1600x1200` | 依赖图、构建链路、迁移结构 |
| `visual` | `16:9` | `1600x900` | 工程专题视觉，少用 |

禁止使用 `1:1`。

## 话题线索

适合表达：

- Rust 版本发布、编译器、Cargo、Clippy、rustfmt
- RFC、语言特性、标准库、edition
- crates、开源项目、GitHub release、安全公告
- 基础设施、CLI、服务端、WebAssembly、嵌入式
- 企业采用、迁移案例、性能和安全改进

不适合把多个无关 crate 或泛泛“Rust 很快”混在一起。

## 热度表达

- `low`：常规版本或工具更新，终端、代码、release note、干净桌面。
- `medium`：生态重要项目、RFC、安全公告，代码仓库、依赖图、构建流水线。
- `high`：重大版本、广泛影响漏洞、基础设施事件，强终端焦点、警示但不夸张。

热度只表达开发者关注度，不夸大性能或安全结论。

## 风格提示词

```text
Create an editorial open-source Rust ecosystem cover.
Show a developer workstation, terminal, code editor, dependency graph, compiler pipeline, package registry, server infrastructure, or CLI tool environment.
Use clean engineering aesthetics, dark terminal surfaces, subtle orange/rust accents, and precise technical composition.
For releases, emphasize versioned release notes, build pipeline, and toolchain upgrade mood without readable exact version text.
For security or infrastructure items, emphasize audit, patch, dependency graph, or server reliability context.
For ecosystem stories, emphasize open-source collaboration, repository activity, and developer workflow.
```

## Kind 适配

### `hot_topic`

```text
Use a 16:9 developer ecosystem visual with repository momentum, terminal focus, package graph, or infrastructure context.
Keep all code text generic or unreadable.
```

### `policy_update`

```text
Use a 16:9 RFC, governance, security advisory, or project-maintainer decision context.
Represent process and maintainership, not bureaucracy.
```

### `data`

```text
Use a 4:3 structured engineering data cover, 1600x1200 WebP.
Show dependency graph, build pipeline, migration map, benchmark workflow, package registry structure, or infrastructure topology.
Do not render fake CVE IDs, fake version numbers, or readable copied source code.
```

## 负面约束

```text
No 1:1 feed cover.
No reusable generic developer template applied to multiple unrelated feeds.
No fake GitHub UI, no readable source code copied from real projects, no fake CVE IDs, no fake version numbers.
Prefer abstract rust-colored engineering motifs; avoid using marks as top-left branding.
No unrealistic threat-actor imagery, no green-matrix cliché, no exaggerated security panic.
No performance claims visualized as guaranteed benchmarks.
No top-left Feeds Hub logo, Feeds Hub wordmark, or Feeds Hub brand badge.
No top-right theme label, category tag, source tag, or status pill.
```

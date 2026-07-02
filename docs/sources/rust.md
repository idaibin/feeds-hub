# Rust Sources

## Category

`rust`

## 信息目标

Rust 主题优先获取开源、工具链、编译器、crate、基础设施和开发者生态的可验证更新。

关注：

- Rust 官方版本、语言特性、edition、标准库
- Cargo、Clippy、rustfmt、rust-analyzer、crates.io、docs.rs
- RFC、tracking issue、compiler team 或 project group 更新
- crate release、开源项目更新、安全公告
- WebAssembly、CLI、服务端、嵌入式和基础设施实践

## 优先来源

1. Rust 官方博客、release notes、Rust Internals、Rust RFC 仓库。
2. GitHub release、tag、commit、issue、pull request、security advisory。
3. crates.io、docs.rs、项目官方文档和 changelog。
4. RustSec Advisory Database、CVE、维护者公告。
5. Maintainer blog 或团队工程博客。

## 次级来源

1. This Week in Rust、Inside Rust Blog、官方或社区周报。
2. Engineering blog、开源项目公告、会议演讲材料。
3. Hacker News、Reddit、Lobsters 等开发者社区讨论，必须能追溯到代码或文档。

## 可参考热度来源

只用于判断关注度：

- GitHub stars、forks、issue、PR 活跃度
- crates.io 下载趋势
- 社区讨论量
- 多个工程团队引用或迁移讨论
- 安全公告影响范围和依赖传播范围

## 禁止来源

- 没有 release note 的版本传闻。
- 无代码或文档支撑的性能结论。
- 只基于单次 benchmark 截图的夸大说法。
- 无法确认维护者身份的公告。
- 单纯依赖更新且没有用户影响的变更。

## 搜索关键词模板

```text
Rust release notes
Rust RFC <topic>
<crate> GitHub release
<crate> crates.io changelog
RustSec <crate>
<project> Rust migration engineering blog
```

中文搜索可用：

```text
Rust 发布 release notes
Rust RFC <主题>
<crate> GitHub release
<项目> Rust 迁移 工程博客
Rust 安全公告 <crate>
```

## 时间窗口

- Rust 官方 release：发布后 72 小时内优先。
- crate、工具、项目 release：发布后 72 小时内优先。
- 安全公告：确认后 24 小时内优先。
- RFC 和生态事件：出现明确新阶段、新决定或广泛讨论后优先。

## 热度判断

Rust 内容判断是否写入看：

- 是否有明确 release、RFC、issue、advisory 或工程证据。
- 是否影响开发者工作流、依赖安全、性能、部署或生态方向。
- 是否具有学习和沉淀价值。
- 是否是用户长期关注的 Rust / 开源工程方向。

## 跳过规则

- 只有小版本依赖更新且无用户影响。
- 只有观点，没有代码、文档或公告。
- 夸大性能、安全或采用范围。
- 同一 release、RFC 或 advisory 已写入，没有新增事实。

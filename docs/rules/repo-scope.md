# Repo Scope

本仓库负责 Feeds Hub 站点、内容 Markdown、实时事件身份、规则文档和静态资源引用。

## 允许

- `src/content/**` 内容更新。
- `docs/topics/**` topic 配置。
- `docs/types/**` 信息类型规则。
- `docs/rules/**` 内容/UI/仓库规则。
- `src/**` 站点 UI、内容读取和展示逻辑。
- 经明确批准后，按 `docs/architecture/knowledge-candidate-handoff.md` 输出显式
  knowledge candidate；当前合同尚未实现。

## 分离

- 内容更新不要和 UI/规则改动混在一个提交。
- 不把外部 AI 源素材搬进仓库。
- 不把实时事件自动晋级为 Handbook 知识或 Blog 内容。

## 禁止

- 不跨仓库移动所有权。
- 不复制 AI Handbook 的知识图谱、证据、freshness、promotion 或公开资格状态。
- 不让 Blog 在运行时读取 Feed 数据。

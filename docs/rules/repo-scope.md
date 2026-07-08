# Repo Scope

本仓库只负责 Feeds Hub 站点、内容 Markdown、规则文档和静态资源引用。

## 允许

- `src/content/**` 内容更新。
- `docs/topics/**` topic 配置。
- `docs/types/**` 信息类型规则。
- `docs/rules/**` 内容/UI/仓库规则。
- `src/**` 站点 UI、内容读取和展示逻辑。

## 分离

- 内容更新不要和 UI/规则改动混在一个提交。
- 不把外部 AI 源素材搬进仓库。

## 禁止

- 不跨仓库移动所有权。

# 进度记录

更新时间：2026-07-01T00:00:00.000Z

## 已完成

- 初始化 Astro 中文信息流网站。
- 添加世界杯、LOL、股市简报、AI 科技四个默认主题。
- 添加首页、分类页、详情页。
- 新增 ChatGPT 自动更新规范：`docs/chatgpt-automation.md`。
- 优化页面样式、Card 样式和移动端布局。
- 新增主题筛选组件：`src/components/TopicFilter.astro`。
- 首页 `/` 默认展示全部信息，按发布时间倒序排列。
- 主题页 `/category/<category>/` 仅展示当前主题内容。

## 当前设计

- 仓库只负责展示内容。
- 内容由 ChatGPT 定时写入 GitHub。
- `reviewed: true` 的内容才展示。

## 待处理

- 当前代码仍在 `feat/init-feeds-hub` 分支。
- 正式上线前需要确认 Vercel 部署分支。

## 本地验证命令

```bash
pnpm install
pnpm run check
pnpm run build
```

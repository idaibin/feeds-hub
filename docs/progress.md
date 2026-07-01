# 进度记录

更新时间：2026-07-01T22:42:00+08:00

## 已完成

- 初始化 Astro 中文信息流网站。
- 添加世界杯、LOL、股市简报、AI 科技四个默认主题。
- 添加首页、分类页、详情页。
- 新增 ChatGPT 自动更新规范：`docs/chatgpt-automation.md`。
- 优化页面样式、Card 样式和移动端布局。
- 首页 `/` 默认展示全部信息，按发布时间倒序排列。
- 主题页 `/category/<category>/` 仅展示当前主题内容。
- 移除页面中的重复主题筛选组件和数量徽标。
- 移除首页 Hero、统计卡和说明文案，页面直接进入内容列表。
- 将内容区改为瀑布流布局：桌面三列、平板两列、手机一列。
- Card 改为消息卡片：顶部海报 banner，下面直接展示标题、时间、摘要和标签。
- 已将 4 条初始化占位内容替换为真实信息流内容。
- 已为 4 条信息分别更新高度相关 SVG 海报。
- 已更新 ChatGPT 自动任务规则：每条信息必须按当时信息、网络热度和主观编辑判断生成海报。
- 新增信息拆分规则：`docs/feed-splitting.md`。
- 已将多重点内容拆分为 10 条独立 feed，每条包含独立标题、`kind`、摘要、来源和海报。
- 已验证 `kind` 字段、拆分内容、SVG 海报和分类页渲染。
- 已将后续规则调整为 WebP 主封面优先，SVG 仅作为兜底或纯信息图。
- 已将新内容路径规则调整为 `src/content/<category>/...`。
- 已将新图片路径规则调整为 `public/images/<category>/...`，页面引用使用 `/images/<category>/...`。
- 已完成历史 Markdown 迁移：旧 `feeds` 中间目录已移除，历史内容统一迁入 `src/content/<category>/...`。
- 已完成历史海报迁移：旧 SVG 海报已转换为 WebP，并统一迁入 `public/images/<category>/...`。
- 已将页面 fallback 海报路径调整为 `/images/<category>/init.webp`。
- 顶部导航改为读取 `CATEGORIES`，避免新增分类后导航遗漏。

## 当前内容

- 世界杯比赛结果：墨西哥 2-0 厄瓜多尔，晋级世界杯 16 强。
- 世界杯球员热点：Gilberto Mora 获得阿兹特克主场关注。
- 世界杯球员热点：Julián Quiñones 从归化前锋到晋级符号。
- LOL 赛事安排：2026 MSI 入围赛收官，1 个正赛名额待定。
- LOL 队伍关注：Gen.G 卫冕背景，BLG 带着 FST 热度。
- 股市风险线：债券收益率、日元和就业数据影响风险偏好。
- 股市权益线：AI 半导体、韩国芯片出口和科技财报接棒。
- 股市产业线：韩国出口创近半世纪最强增速，AI 芯片需求继续外溢。
- AI 政策变化：Anthropic Fable / Mythos 解禁。
- AI 后续关注：解禁后的安全承诺和政府沟通。

## 当前设计

- 仓库只负责展示内容。
- 内容由 ChatGPT 定时写入 GitHub。
- 顶部导航保留轻量主题选择。
- 首页直接展示每条消息。
- `reviewed: true` 的内容才展示。
- 新内容直接按分类写入，不再增加 `feeds` 中间目录。

## 待处理

- 正式上线前确认 Vercel 部署分支与 main 更新策略。

## 本地验证命令

```bash
pnpm install --store-dir /private/tmp/pnpm-store
pnpm run check
pnpm run build
```

## 验证状态

最近一次完整本地验证记录：

- `pnpm install --store-dir /private/tmp/pnpm-store`：通过，依赖已是最新。
- `pnpm run check`：通过，Astro 内容集合与类型检查 0 errors / 0 warnings / 0 hints。
- `pnpm run build`：通过，生成 29 个静态页面。
- cover 文件存在性检查：通过，`src/content/<category>/*.md` 中所有 `cover` 均能在 `public/images/<category>/*.webp` 找到。
- 旧路径检查：通过，代码、文档、内容和 public 目录内无旧中间目录或 SVG 路径引用。

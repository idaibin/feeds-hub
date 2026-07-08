# UI Spec

Feeds Hub 是移动优先的信息流。卡片只展示文本信息；`cover` 字段只兼容 schema。

## 导航

- Header 固定顶部。
- 右侧主题下拉。
- 主导航顺序：全部、AI、GitHub、股市、英雄联盟、世界杯。
- `global` 保留路由，不进主导航。

## 卡片

- 列表页和详情页使用同一个 `FeedCard` 组件。
- 列表只显示 title 和有信息量的 summary；summary 为空或雷同时不显示。
- 详情在同一 card shell 内展示完整正文。
- 主题 tag 使用共享 topic CSS 变量：
  - `--topic-accent`
  - `--topic-bg`
  - `--topic-border`

## 详情

- 详情页保留 title、subtitle、summary、正文、来源。
- subtitle/summary 可作为内容框展示，但不重复“主题/重点”等机械标签。
- 来源放右下角；没有确定中文官方/权威入口时，只显示原始来源。
- 正文自然流动，footer 使用页面自然流，不制造额外滚动容器。

## 布局

- `main` 负责页面内边距。
- Feed card 负责内部 padding 和内容节奏。
- 不嵌套卡片。
- 移动端外层和 card padding 保持紧凑。
- Footer 单行优先，空间不足时保持自然收缩。

## 主题视觉

- AI: 蓝青。
- GitHub: 深灰/绿色。
- 股市: 青/琥珀。
- LOL: 金/靛。
- 世界杯: 蓝。
- 避免大面积紫色和单一色相。

## 检查

- 首页、分类页、详情页 tag 色彩一致。
- summary 为空时列表不留空白。
- `/category/github/` 和分页 JSON 正常。
- 移动端文本不重叠、不溢出。

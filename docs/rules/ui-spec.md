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

- 详情页保留 title、subtitle、summary 和正文，不展示来源链接。
- subtitle/summary 可作为内容框展示，但不重复“主题/重点”等机械标签。
- Content 层继续保留 `source` 和 `sourceUrl`，但页面不渲染。
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

## 分页加载恢复

### 基线与边界

- 交付 profile：Feature Spec；这是对现有列表页 UI 的分页恢复增量，不是重新设计。
- Shared visual authority：仓库根 [`DESIGN.md`](../../DESIGN.md)。本 Feature Spec
  只定义分页恢复的页面局部状态和验收，不复制共享 colors、typography、spacing、
  rounded 或 component semantics。
- Selected source：仓库内的 `src/components/FeedList.astro` 与
  `src/components/BaseLayout.astro`。现有 UI 是 selected baseline；只使用列表页现有
  `FeedCard`、`main` 内边距、自然页面流和主题视觉。
- 选择与批准：本任务明确接受现有 UI 为基线；权利/使用边界仅限仓库内实现参考，
  不复制或发布外部视觉资产。
- 使用边界：仅覆盖 `/` 与分类列表的分页加载、失败和重试反馈；不改变 FeedCard
  内容、分页 JSON 字段/URL、导航、详情页或数据规则。
- 运行证据不写入本规范；浏览器检查、截图和验证结果由交付记录持有，不能反向成为
  UI 合同的权威来源。
- 共享系统变更：首次建立根 `DESIGN.md`，把已接受的站点视觉语义登记为唯一共享
  authority；不改变 `--topic-*` 分类配色，不新增图片、依赖或平行 token 系统。

### 状态合同

分页请求沿用现有 `FeedList` 列表和下一页游标。请求进行中、失败或重试时，已经
加载的卡片、顺序和可打开链接都必须保留；失败不得把列表清空或伪装成成功结束。

| 状态 | 列表内容 | 列表末尾反馈 | 允许的下一步 |
| --- | --- | --- | --- |
| `loading` | 保留全部已加载卡片；同一请求不可重复追加 | 不显示错误或“没有更多了” | 等待当前请求完成 |
| `failure` | 保留失败前的全部卡片，不回滚已成功内容 | 在最后一张卡片之后显示精确文案 `加载失败，请重试。`，并显示原生按钮 `重试` | 键盘或指针触发重试 |
| `retry-success` | 仅追加本次成功响应的新卡片，不重复旧卡片 | 立即清除错误反馈；若响应仍有下一页，恢复分页触发；若响应表示结束，转为 `end` | 继续滚动或结束 |
| `retry-failure` | 保留重试前的全部卡片 | 继续显示同一错误文案和 `重试`；不得显示“没有更多了” | 再次重试 |
| `end` | 保留全部已成功加载卡片 | 仅在成功响应确认没有更多内容时显示 `没有更多了` | 无分页恢复动作 |

错误反馈和 `没有更多了` 是互斥状态：`failure`/`retry-failure` 时结束文案必须
隐藏；`end` 时错误文案和 `重试` 按钮必须隐藏。失败后重试使用同一下一页请求位置，
成功前不得递增分页位置或产生重复卡片。

### 局部布局与无障碍合同

- 恢复反馈属于 feed 列表的自然末尾，不创建额外滚动容器；`main` 继续拥有页面
  外边距，列表/局部反馈继续拥有自己的内部节奏。
- 在 390px 宽移动端，错误文案和 `重试` 控件必须留在内容边界内，可自然换行或
  收缩，不产生水平滚动、裁切、重叠或遮挡；桌面端同样保持列表末尾对齐。
- `重试` 必须是可聚焦的原生按钮，Tab 可到达，Enter/Space 可触发；按钮在
  `:focus-visible` 下必须有清晰可见且不只依赖颜色的焦点指示。重试失败后
  焦点不能被移到隐藏的结束文案或不可见节点。
- 错误文案和按钮应以语义化反馈暴露给辅助技术；不得只用颜色或图标表达失败。

### Viewport × state 验收矩阵

矩阵是实现与浏览器验证的验收目标。
桌面使用现有 `@media (max-width: 640px)` 之外的宽度（`>= 641px`，建议记录实际
测试尺寸）；移动端固定宽度 `390px`，高度按测试环境记录。

| viewport | `failure` | `retry-success` | `retry-failure` | `end` |
| --- | --- | --- | --- | --- |
| Desktop `>= 641px` | 已加载卡片保留；末尾出现 `加载失败，请重试。` + `重试`；不出现 `没有更多了` | 错误反馈消失；成功内容只追加一次；有更多时恢复触发、无更多时进入 `end` | 卡片不变；错误文案和 `重试` 仍可见可操作；不出现结束文案 | 仅显示 `没有更多了`；错误文案和按钮隐藏 |
| Mobile `390px` | 同桌面语义；文案/按钮在 390px 内容宽度内不溢出、不重叠 | 同桌面语义；恢复后仍无水平滚动或布局跳变导致的遮挡 | 同桌面语义；Tab/Enter/Space 可重复重试，焦点指示可见 | 同桌面语义；结束文案不制造水平滚动 |

### 变更追踪与交付判定

| acceptance_id | 目标合同 | owner | 验证 |
| --- | --- | --- | --- |
| `PAGINATION-UI-01` | loading、failure、retry 期间保留已加载内容和顺序 | `FeedList` 局部状态 | 两个 viewport 的 loading/failure/retry-success/retry-failure/end 状态，检查卡片数量/顺序 |
| `PAGINATION-UI-02` | failure/retry-failure 只显示错误文案与 `重试`，与 `没有更多了` 互斥 | `FeedList` 列表末尾反馈 | 状态切换与可见性断言 |
| `PAGINATION-UI-03` | retry-success 清除错误并按响应继续/结束；retry-failure 保持可重试 | `FeedList` 局部状态 | 同一页重试，不重复追加 |
| `PAGINATION-UI-04` | 390px 不溢出；按钮键盘可达且有可见 focus | 列表末尾局部布局/交互 | 390px + 桌面键盘与滚动检查 |

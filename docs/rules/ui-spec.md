# UI Spec

Feeds Hub 页面和组件展示规则。内容格式看 `content-format.md`，海报图片规则看 `docs/posters/README.md`，具体 prompt profile 看 `docs/posters/<profile>.md`，任务流程看 `docs/automation/feeds-hub-update.md`。

## Principles

- 移动端优先。
- 信息密度、可读性和触达效率优先于装饰。
- 1 feed = 1 event。
- 列表和详情都以文字信息为主，不展示 feed 海报。
- frontmatter `cover` 只保留 schema 兼容和图片分支资产引用，不作为 main 页面展示契约。
- 同一断点内 card 宽度统一，内容高度由文本自然撑开。

## Color Tokens

```css
--primary: #0569ED;
--primary-hover: #0688D1;
--primary-active: #034A9A;

--accent: #069FB4;
--accent-soft: #5CCDDC;
--accent-deep: #0A7E90;

--bg: #F8FAFC;
--surface: #FFFFFF;
--surface-2: #F1F5F9;
--surface-3: #E2E8F0;
--border: #E5E7EB;

--text-primary: #0F172A;
--text-secondary: #334155;
--text-muted: #64748B;
--text-disabled: #94A3B8;

--success: #10B981;
--warning: #F59E0B;
--error: #EF4444;
--trending: #069FB4;
```

Rules:

- UI 主色只允许 Blue、Cyan、Slate。
- `primary` 用于核心信息、链接、按钮和可点击状态。
- `accent` 用于实时、趋势和轻量高亮。
- `warning`、`error` 只用于真实风险和错误。
- 禁止紫色、粉色、红紫色作为 UI 主视觉色。

## Flow

```text
task entry -> topic config -> type rule -> kind -> Markdown -> page renders text-first feed
```

职责：

- `docs/automation/feeds-hub-update.md`：任务计划、topic 遍历、分支、写入、验证、合并和清理。
- `docs/topics/<category>.md`：主题 YAML 配置、信息类型、来源、`kind`、存储目录和路径。
- `docs/types/<flow>.md`：信息生成、去重、来源核实和正文规则。
- `docs/posters/README.md`：仅在图片分支启用，定义 poster profile、比例、尺寸、格式、pending cover 和图片禁止项。
- `docs/posters/<profile>.md`：仅在图片分支启用，定义 `default`、`sports_card`、`sports_bracket` 的具体 prompt。

## Header

- 左侧品牌。
- 右侧主题下拉。
- 下拉项来自 `src/lib/feeds.ts` 的 `CATEGORIES`。
- 当前主题显示为当前选中项。
- 移动端不使用横向滚动主题导航。

## Cards

统一网格：

```css
--feed-card-min-width: 480px;
--feed-card-gap: 24px;

.masonry-feed {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, var(--feed-card-min-width)), 1fr));
  gap: var(--feed-card-gap);
}
```

规则：

- 所有主题共享同一个 Card Shell。
- 同一行 card 等宽，PC 等宽网格，窄屏单列。
- 首页、分类页、详情入口视觉语言一致。
- 不按横图、竖图、主题或内容类型分配不同宽度。
- 卡片文本优先，只展示标题、摘要、时间和分类；来源不在卡片显示。
- 列表页忽略 `cover` 和 `coverStatus`，不显示缩略图、fallback 大图或 poster-only 变体。
- PC 和移动端都使用纯文本卡片；CSS 只负责文本排版、响应式和交互状态。
- 分类 tag 使用文字与彩色点，不依赖图片覆盖层。

## Detail Page

详情页沿用文本优先语言：

1. 分类 tag。
2. 标题。
3. subtitle、summary、正文。
4. 主体居中，最大宽度 `960px`。

## Kind Map

`kind` 是信息表达方式，不是主题名称。

```ts
type FeedCardType =
  | 'match_result'
  | 'match_schedule'
  | 'match_flow'
  | 'player_spotlight'
  | 'knockout_update'
  | 'worldcup_feed'
  | 'news'
  | 'breaking'
  | 'insight'
  | 'ai'
  | 'data'
  | 'visual'
  | 'hot_topic'
  | 'market_brief'
  | 'policy_update';
```

```ts
const topicCardMap = {
  worldcup: ['match_result', 'match_schedule', 'match_flow', 'player_spotlight', 'knockout_update', 'worldcup_feed', 'data', 'visual', 'news', 'insight'],
  lol: ['match_result', 'match_schedule', 'match_flow', 'player_spotlight', 'knockout_update', 'data', 'visual', 'news', 'insight'],
  stock: ['market_brief', 'data', 'policy_update', 'breaking', 'insight', 'news'],
  ai: ['news', 'insight', 'ai', 'breaking', 'policy_update', 'data', 'visual'],
  compute: ['market_brief', 'hot_topic', 'data', 'insight', 'news', 'policy_update'],
  global: ['news', 'breaking', 'policy_update', 'insight', 'data', 'visual'],
  rust: ['news', 'insight', 'breaking', 'policy_update', 'data', 'visual'],
  dev: ['hot_topic', 'news', 'insight', 'data', 'policy_update', 'ai'],
  security: ['breaking', 'policy_update', 'data', 'insight', 'news', 'hot_topic'],
  product: ['news', 'insight', 'data', 'visual', 'breaking', 'policy_update', 'market_brief'],
};
```

Map requirements:

- 覆盖 `src/lib/feeds.ts` 的全部 `CATEGORIES`。
- 覆盖 `src/content.config.ts` 的全部 `feedCategorySchema`。
- 新增主题时补齐 `docs/topics/`、`src/content.config.ts`、`src/lib/feeds.ts` 和本映射；不新增海报类型时无需修改 `docs/posters/`。
- 只决定内容表达优先级，不决定 card 宽度或主题专属布局。

## Images

- main 页面不读取、不展示 feed `cover`。
- `cover` 和 `coverStatus` 只用于 schema 兼容、历史内容和图片分支资产管理。
- 列表页和详情页都不显示 fallback 大图、缩略图或海报区域。
- 图片分支的 profile、格式、尺寸、pending cover 和通用禁止项以 `docs/posters/README.md` 为准；具体提示词以 `docs/posters/<profile>.md` 为准。
- 图片分支、提交、二进制写入仓库和同步到 main 的确认流程以 `docs/automation/feeds-hub-update.md` 为准。

## Forbidden

- 多事件混合，除非 `worldcup_feed` 明确要求同一比赛日或同一阶段结构化汇总。
- PPT 风。
- 重复装饰。
- 卡片宽度按主题变化。
- 列表或详情展示 feed 海报、缩略图、fallback 大图或 poster-only 变体。
- 未经用户确认把图片分支产物同步为 main 页面展示能力。

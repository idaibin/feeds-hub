# UI Spec

Feeds Hub 页面和组件展示规则。内容格式看 `content-format.md`，海报生成和图片写入看 `poster-spec.md`。

## Principles

- 移动端优先。
- 信息密度、可读性和触达效率优先于装饰。
- 1 feed = 1 event。
- 卡片不重复海报内容，详情页完整展开。
- 页面读取 frontmatter `cover`；图片缺失时使用组件 fallback，不阻塞内容发布。
- 同一断点内 card 宽度统一，内容高度可随海报比例自适应。

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
task entry -> topic -> card type -> poster prompt -> cover path -> page reads cover or fallback
```

职责：

- `docs/topics/<category>.md`：主题、来源、标题倾向、跳过条件、主题海报气质。
- `docs/card-types/README.md`：`kind` 选择和通用海报类型提示词。
- `docs/rules/poster-spec.md`：比例、尺寸、格式、写入、fallback、prompt 组合和禁止项。

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
- 图片比例由 `category + kind` 推导；允许值见 `poster-spec.md`。
- 默认新闻 `16:9`，体育/电竞海报 `4:5`，数据/时间线/结构图 `4:3`。
- 禁止 `1:1` 主封面。
- CSS 只负责容器比例、裁切、响应式和交互状态。
- 左上角 tag 使用半透明黑底、彩色点和分类文字。

## Detail Page

详情页沿用 Card Shell 语言：

1. 顶部海报。
2. 海报左上角 tag。
3. 海报下方标题。
4. subtitle、summary、正文。
5. 主体居中，最大宽度 `960px`。

## Card Type Map

Card Type 是信息表达方式，不是主题名称。

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
  global: ['news', 'breaking', 'policy_update', 'insight', 'data', 'visual'],
  rust: ['news', 'insight', 'breaking', 'policy_update', 'data', 'visual'],
  product: ['news', 'insight', 'data', 'visual', 'breaking', 'policy_update', 'market_brief'],
};
```

Map requirements:

- 覆盖 `src/lib/feeds.ts` 的全部 `CATEGORIES`。
- 覆盖 `src/content.config.ts` 的全部 `feedCategorySchema`。
- 新增主题时补齐 `docs/topics/`、`docs/card-types/` 和本映射。
- 只决定表达优先级和图片比例，不决定 card 宽度或主题专属布局。

## Images

- 页面读取 frontmatter `cover`。
- 图片缺失时使用组件 fallback。
- 品牌、分类、来源或状态标识只能由组件或 CSS 覆盖层承载，不能烘焙进图片。
- 海报生成、格式、比例、尺寸、二进制写入、pending cover 和禁止项统一以 `poster-spec.md` 为准。

## Forbidden

- 多事件混合，除非 `worldcup_feed` 明确要求同一比赛日或同一阶段结构化汇总。
- PPT 风。
- 重复装饰。
- 卡片宽度按主题变化。
- 海报与卡片正文重复表达同一段信息。
- 违反 `poster-spec.md` 的主封面、生成或 fallback 规则。

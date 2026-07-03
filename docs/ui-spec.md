# Feeds Hub UI Spec

## Principles

- 默认移动端优先。
- 体验优先，信息密度、可读性和触达效率优先于装饰。
- 每条 feed 只表达一个核心事件。
- 卡片不重复海报内容，详情页完整展开。
- 页面必须展示 frontmatter `cover` 指向的真实图片资源。
- 信息流卡片必须宽度统一、样式统一；允许内容高度按信息类型和海报比例自适应。

## Theme Color Tokens

Feeds Hub 最终主题色固定为蓝青信息流体系，不再引入多主色。

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

### Color Rules

- UI 主色只允许 Blue、Cyan、Slate 三个体系。
- `primary` 用于核心信息、链接、按钮和可点击状态。
- `accent` 用于实时、趋势、feed 流动感和轻量高亮。
- `warning`、`error` 只用于真实风险和错误状态，不作为主题装饰色。
- 禁止紫色、粉色、红紫色作为 UI 主视觉色。

## Template Flow

```text
category -> kind -> poster ratio -> topic rule -> poster prompt -> poster DSL -> image generation -> WebP cover -> page reads cover
```

`Poster DSL` 只定义结构约束，例如 `ratio`、`size`、`layout`、`focus` 和 `maxLines`。主题级海报语义、话题线索、热度表达、风格提示词和负面约束维护在 `docs/posters/`。

自动任务生成主封面前必须读取：

```text
docs/posters/README.md
docs/posters/type-matrix.md
docs/posters/<category>.md
```

图片只表达主题和氛围。比分、时间、日期、来源、公司名、队伍名、价格等精确事实必须由 frontmatter 和页面文本承担，不能依赖图片内文字。

Template examples:

```text
worldcup_schedule
worldcup_result
worldcup_match_flow
worldcup_knockout_update
worldcup_player_spotlight
esports_event
ai_news
stock_brief
global_news
```

## Header And Navigation

- Header 左侧保留品牌。
- Header 右侧使用主题下拉。
- 下拉项必须来自 `src/lib/feeds.ts` 的 `CATEGORIES`。
- 当前主题必须显示为当前选中项。
- 移动端不使用横向滚动主题导航。

## Cards

### Width

所有信息流卡片在同一断点内使用同一列宽：

```css
--feed-card-min-width: 480px;
--feed-card-gap: 24px;

.masonry-feed {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, var(--feed-card-min-width)), 1fr));
  gap: var(--feed-card-gap);
}
```

### Layout

- 所有主题共享同一个 Card Shell。
- 同一行 card 等宽，card 之间必须保留固定 gap。
- PC 端使用等宽网格；窄屏和移动端使用单列。
- 首页、分类页、详情入口的卡片视觉语言必须一致。
- 不按横图、竖图、主题或内容类型分配不同宽度。
- 图片比例由 `category + kind` 推导，只允许 `16:9`、`4:5` 和 `4:3` 三种。
- 默认新闻类内容使用 `16:9`。
- 体育 / 电竞赛事海报类内容可使用 `4:5`。
- 数据、bracket、时间线、结构化图表类内容可使用 `4:3`。
- 禁止使用 `1:1` 作为 feed 主封面比例。
- CSS 只负责容器比例、裁切、响应式布局和交互状态。
- 详情页使用同一 Card Shell 语言，顶部为海报，主体居中，最大宽度 `960px`。

### Card Type

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

主题和 Card Type 的关系：

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

完整性规则：

- `topicCardMap` 必须覆盖 `src/lib/feeds.ts` 的全部 `CATEGORIES`。
- `topicCardMap` 必须覆盖 `src/content.config.ts` 的全部 `feedCategorySchema`。
- 新增主题时，必须同时补齐 `docs/topics/`、`docs/posters/`、`docs/sources/` 和本表映射。
- Card Type 映射只决定内容表达优先级和图片比例，不决定 card 宽度、列表列数或主题专属布局。

默认规则：

- 未识别内容默认走 `news`。
- 突发、重大变动走 `breaking`。
- 体育 / 电竞赛程走 `match_schedule`。
- 体育 / 电竞赛果走 `match_result`。
- 体育 / 电竞比赛进程走 `match_flow`。
- 体育 / 电竞单人焦点走 `player_spotlight`。
- 淘汰赛、晋级路径、bracket 走 `knockout_update`。
- 同一比赛日或同一阶段世界杯结构化汇总走 `worldcup_feed`。
- 比分、指数、排名、走势图、漏斗、结构图走 `data`。
- 海报、图片主导内容走 `visual`。
- 分析、观点、原因、影响走 `insight`。
- AI 自动聚合、结构化总结走 `ai`。

## Images

- 图片默认使用 WebP。
- 图片比例只允许 `16:9`、`4:5` 和 `4:3`。
- 默认新闻主封面使用 `16:9`，推荐尺寸为 `1600x900`，最低不低于 `1280x720`。
- 体育 / 电竞赛事海报使用 `4:5`，推荐尺寸为 `1440x1800`，最低不低于 `1120x1400`。
- 数据、bracket、时间线、结构化图表使用 `4:3`，推荐尺寸为 `1600x1200`，最低不低于 `1280x960`。
- 禁止使用 `1:1` 作为 feed 主封面。
- 海报必须是真实图片资源。
- 禁止 1x1、透明、空白、纯色占位或与事件无关的通用海报。
- 页面必须读取 `cover`，不能用 CSS/HTML 生成海报替代图片文件。
- 海报图片内不生成 Feeds Hub logo、Feeds Hub wordmark、Feeds Hub 品牌角标、水印、分类、来源或状态标签。
- 需要品牌、分类、来源或状态标识时，只能由 card 组件或 CSS 覆盖层承载，不能烘焙进图片。
- 精确事实如比分、时间、日期、来源和队名必须以 Markdown frontmatter 和页面文本为准，不能只依赖图片内文字。

## Poster DSL

- `ratio`: `16:9` | `4:5` | `4:3`。
- `size`: follows `docs/posters/type-matrix.md`.
- `layout`: hero / scoreboard / split / poster / bracket / timeline / dashboard / map / workflow。
- `focus`: title / score / schedule / player / bracket / market / policy / product / code / data。
- `maxLines`: 不超过 2 行，除非是 `4:3` 结构化信息图且事实由 feed 明确提供。

## Forbidden

- 多事件混合，除非 `worldcup_feed` 明确要求同一比赛日或同一阶段结构化汇总。
- PPT 风。
- 重复装饰。
- 卡片宽度按主题变化。
- 使用 `1:1` 作为 feed 主封面。
- 海报与卡片正文重复表达同一段信息。
- 海报图片中带站点品牌、分类角标、来源角标、水印或状态标签。

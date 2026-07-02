# Feeds Hub UI Spec

## Principles

- 默认移动端优先。
- 体验优先，信息密度、可读性和触达效率优先于装饰。
- 每条 feed 只表达一个核心事件。
- 卡片不重复海报内容，详情页完整展开。
- 页面必须展示 frontmatter `cover` 指向的真实图片资源。

## Template Flow

```text
category -> topic rule -> poster DSL -> ChatGPT image generation -> WebP cover -> page reads cover
```

Template examples:

```text
worldcup_schedule
worldcup_result
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

- 移动端保持单列瀑布流。
- 所有卡片统一使用 16:9 横图海报展示，不再按主题或卡片类型使用不同海报比例。
- 桌面端保持稳定卡片网格；移动端保持默认瀑布流。
- CSS 只负责容器比例、裁切、响应式布局和交互状态。

## Images

- 图片默认使用 WebP。
- 海报统一使用 16:9 横图，推荐尺寸为 `1600x900`，最低不低于 `1280x720`。
- 海报必须是真实图片资源。
- 禁止 1x1、透明、空白、纯色占位或与事件无关的通用海报。
- 页面必须读取 `cover`，不能用 CSS/HTML 生成海报替代图片文件。
- 精确事实如比分、时间、日期、来源和队名必须以 Markdown frontmatter 和页面文本为准，不能只依赖图片内文字。

## Poster DSL

- `ratio`: 16:9。
- `layout`: hero / scoreboard / split。
- `focus`: title / score / schedule。
- `maxLines`: 不超过 2 行。

## Forbidden

- 多事件混合。
- PPT 风。
- 重复装饰。
- 海报与卡片正文重复表达同一段信息。

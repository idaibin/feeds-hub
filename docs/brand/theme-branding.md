# Feeds Hub Theme Branding

## 目标

本文件记录 Feeds Hub 当前定稿的主题色、卡片体系、世界杯赛事海报规范和本轮设计产物总结。

## 品牌定位

Feeds Hub 是中文信息流入口。视觉系统应保持：

- 信息优先。
- 蓝青色信息流主视觉。
- 高密度但不拥挤。
- 卡片宽度固定、样式统一。
- 图片和海报服务于内容，不替代事实文本。

一句话定义：

```text
Feeds Hub = Blue（信息结构） + Cyan（信息流动） + Slate（阅读容器）
```

## Logo 与 Favicon

本轮确定 Feeds Hub 使用蓝青渐变圆角图标：

- 图标主体：蓝到青的圆角方形。
- 内部符号：白色抽象 `F`。
- 右侧三条流线：表达信息流、feed、stream。
- favicon 使用纯图标，不带文字。
- 网站 header 可使用图标 + `Feeds Hub` + `中文信息流`。

## UI 主题色

最终主题色以 `docs/ui-spec.md` 为准。

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
```

## Card 分类体系

Feeds Hub 不按“世界杯卡片 / LPL 卡片 / 股市卡片 / AI 卡片”设计，而按内容表达类型设计。

```ts
type FeedCardType =
  | 'news'
  | 'breaking'
  | 'insight'
  | 'ai'
  | 'data'
  | 'visual';
```

### 主题适配

```ts
const topicCardMap = {
  worldcup: ['breaking', 'data', 'visual', 'news', 'insight'],
  lol: ['breaking', 'data', 'visual', 'news', 'insight'],
  stock: ['data', 'breaking', 'insight', 'news', 'ai'],
  ai: ['news', 'insight', 'ai', 'breaking', 'visual'],
  global: ['news', 'breaking', 'insight', 'data', 'visual'],
  rust: ['news', 'insight', 'breaking', 'data', 'visual'],
  product: ['news', 'insight', 'data', 'visual', 'breaking'],
};
```

完整性规则：

- 映射必须覆盖 `worldcup`、`lol`、`stock`、`ai`、`global`、`rust`、`product`。
- 主题列表以 `src/lib/feeds.ts` 的 `CATEGORIES` 和 `src/content.config.ts` 的 `feedCategorySchema` 为准。
- 新增主题时，必须同步更新 `docs/ui-spec.md`、`docs/topics/`、`docs/posters/` 和 `docs/sources/`。
- Card Type 只表达信息形态，不允许派生主题专属卡片宽度、海报比例或列表布局。

### Card Type 语义

| Card Type | 适合内容 |
|---|---|
| `news` | 标准资讯、常规新闻、普通信息流 |
| `breaking` | 突发、赛果、重大进展、强提醒 |
| `insight` | 解读、影响、原因、关键要点 |
| `ai` | AI 生成摘要、多来源整理、结构化总结 |
| `data` | 比分、赛程、指数、排名、指标、走势图 |
| `visual` | 海报、图片、赛事视觉图、专题视觉内容 |

## Card 宽度规则

卡片在同一断点内等宽，样式统一。

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

- 所有主题使用同一个 Card Shell。
- 同一行卡片同宽。
- Card 之间必须保留固定 gap。
- PC 端使用等宽网格。
- 桌面端不再按图片方向或主题改变宽度。
- 窄屏和移动端单列，宽度随容器收缩。
- 默认封面仍为 16:9 横图。
- 详情页使用 Card Shell 语言，顶部为 16:9 海报，中间内容最大宽度为 `960px`。

## 世界杯赛事类海报定稿

世界杯赛事类海报作为 4:5 社媒海报或视觉卡片素材，不等同于默认 feed card 16:9 主封面。

### 已确定风格

- 深蓝夜场球场。
- 电光蓝聚光灯。
- 青蓝霓虹 HUD 边框。
- 白色金属质感体育字体。
- 中部对阵信息为视觉中心。
- 顶部不再使用巨大中文标题。
- 海报图片内不生成 Feeds Hub logo、wordmark、品牌角标、水印或主题标签。
- 如需品牌、分类、来源或状态标识，后续只由 card 组件或 CSS 覆盖层承载。
- `2026 WORLD CUP` 放在顶部中心，作为统一赛事识别。
- 上半区如有空白，用 `1/8 FINAL`、`MATCH PREVIEW`、星标、细线、盾牌/奖杯徽章补足。
- 队名适中，避免压迫画面。
- 日期必须明显，地点次级。
- 底部不能空黑，必须有发光球场地面、HUD 线框或信息面板。

### 已生成产物类型

本轮设计沟通中已确认以下赛事视觉方向：

| 类型 | 用途 | 示例内容 |
|---|---|---|
| 赛事前瞻 | 赛前对阵、时间、地点、晋级之路 | 美国 VS 比利时，7月6日，西雅图 |
| 赛事进度 | 进球时间线、实时比分、逆转节点 | 比利时 3-2 塞内加尔，125' 点球 |
| 赛事结果 | 完场比分、晋级结论 | 英格兰 2-1 刚果民主共和国 |
| 世界杯信息流 | 多场结果 + 下一场预告 | 英格兰、比利时、美国晋级汇总 |
| 淘汰赛进展 | 晋级席位、16强/8强更新 | 英格兰、比利时、美国晋级 |
| 球星焦点 | 单场关键球员表现 | 蒂莱曼斯 2球、绝平+绝杀 |

### 最终 Prompt 入口

世界杯赛事海报的完整提示词维护在：

```text
docs/posters/worldcup.md
```

后续生成世界杯赛事类图片必须优先读取该文件。

## 代码落地

本轮同步了：

- `src/components/FeedCard.astro`：移除按图片方向变化宽度的逻辑，锁定同一 Card Shell。
- `src/layouts/BaseLayout.astro`：信息流使用等宽网格，card 保持固定间距，主题色切换到蓝青体系。
- `docs/ui-spec.md`：记录最终配色、Card Type、卡片宽度和图片规范。
- `docs/posters/worldcup.md`：记录世界杯赛事类海报最终提示词。

## 禁止项

- 不再按主题改变卡片宽度。
- 不再按图片横竖改变卡片宽度。
- 不再使用多主色 UI。
- 不再使用顶部巨型中文标题压制赛事信息。
- 不在底部放大面积空黑区域。
- 不在赛事海报中使用官方 FIFA logo、官方赛事标或球队队徽。
- 不在海报图片中生成 Feeds Hub、logo、wordmark、品牌角标、水印或主题标签。

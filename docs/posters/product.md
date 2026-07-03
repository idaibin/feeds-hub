# Product Poster Prompt

## Category

`product`

## 主题特色

产品设计主题应突出产品变化、用户旅程、界面草图、工作流、设计决策和运营信号。画面应像产品分析封面，不像模板化 SaaS 广告。

## 尺寸规则

按 `docs/posters/type-matrix.md` 推导比例：

| kind | ratio | size | 用途 |
|---|---:|---:|---|
| `news` / `breaking` / `insight` / `hot_topic` / `market_brief` / `policy_update` | `16:9` | `1600x900` | 默认产品新闻 / 分析封面 |
| `data` | `4:3` | `1600x1200` | 漏斗、旅程、实验结构 |
| `visual` | `4:5` | `1440x1800` | 产品专题海报，少用 |

禁止使用 `1:1`。

## 话题线索

适合表达：

- 产品发布、功能更新、商业模式变化
- 用户体验、信息架构、onboarding、转化漏斗
- 实验看板、平台规则、创作者工具、开发者生态
- 公司产品策略、公开页面变更、应用版本更新
- 设计系统、原型、工作流、用户反馈

不适合输出脱离事件的泛泛产品建议。

## 热度表达

- `low`：小功能、设计观察，线框图、便签、轻量用户流程。
- `medium`：产品发布、实验更新，界面草图、漏斗、用户路径、团队工作台。
- `high`：重大产品策略、平台规则变化，强中心界面、路线图、决策看板、用户涌入感。

热度只表达产品关注度，不暗示必然成功。

## 风格提示词

```text
Create an editorial product design news cover.
Show product interface sketches, user journey maps, workflow board, prototype screens, decision table abstraction, or team product desk.
Use clean modern design language, soft depth, neutral background, and subtle accent colors.
For product launches, emphasize interface surface, workflow, and user value.
For user-journey topics, emphasize funnel, cohort, user path, and experiment board without exact metrics.
For business-model topics, emphasize product packaging and customer segmentation abstractly.
```

## Kind 适配

### `hot_topic`

```text
Use a 16:9 product-analysis visual with interface, user journey, experiment, or workflow focal point.
Keep it practical and operator-oriented.
```

### `market_brief`

```text
Use a 16:9 product-market context: packaging, adoption curve, customer segment, or competitive positioning.
Do not render exact business numbers.
```

### `policy_update`

```text
Use a 16:9 platform policy, app-store rule, product terms, or product governance context with documents and product UI abstraction.
```

### `data`

```text
Use a 4:3 structured product data cover, 1600x1200 WebP.
Show funnel, cohort, user path, experiment board, journey map, workflow graph, or interface architecture.
Do not render fake metrics, fake app screenshots, or copied real product UI.
```

### `visual`

```text
Use a 4:5 premium product editorial visual, 1440x1800 WebP.
Use only for image-led product features or topic cards, not as default product news fallback.
```

## 负面约束

```text
No 1:1 feed cover.
No reusable generic product template applied to multiple unrelated feeds.
No fake company logos, no fake app screenshots, no copied UI from real products, no readable business numbers.
No guaranteed success arrows, no generic SaaS hero cliché.
No overused sticky-note wall without a clear product-event focal point.
No unrelated motivational poster style.
No top-left Feeds Hub logo, Feeds Hub wordmark, or Feeds Hub brand badge.
No top-right theme label, category tag, source tag, or status pill.
```

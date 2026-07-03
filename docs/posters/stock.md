# Stock Poster Prompt

## Category

`stock`

## 主题特色

股市主题应突出市场简报、指数走势、行业板块、宏观变量、风险提示和机构研究感。画面必须中性、分析型，避免“稳赚”“买入”“卖出”等投资建议感。

## 尺寸规则

按 `docs/posters/type-matrix.md` 推导比例：

| kind | ratio | size | 用途 |
|---|---:|---:|---|
| `market_brief` | `16:9` | `1600x900` | 市场简报 |
| `policy_update` | `16:9` | `1600x900` | 央行、监管、公告、政策 |
| `hot_topic` / `news` / `breaking` / `insight` | `16:9` | `1600x900` | 普通金融新闻 |
| `data` | `4:3` | `1600x1200` | 指数、板块、宏观数据图 |
| `visual` | `16:9` | `1600x900` | 金融专题视觉，少用 |

禁止使用 `1:1`。股市主题默认不使用 `4:5`，避免移动端信息流过重。

## 话题线索

适合表达：

- A 股、美股、港股、创业板、纳斯达克等指数变化
- 财报、IPO、监管、央行、利率、汇率、就业数据
- AI、芯片、能源、金融、消费等行业板块
- 公司公告、政策变化、市场风险
- 风险偏好、资金流、宏观压力

不适合把多个市场无关事件混成一张“金融大杂烩”。

## 热度表达

- `low`：常规收盘简报，克制仪表盘、研究报告、淡色趋势线。
- `medium`：重要数据或行业异动，交易屏幕、板块轮动、宏观压力。
- `high`：大幅波动、监管冲击、重大财报，强对比屏幕、紧张交易室、风险提示氛围。

热度只表达市场关注度，不暗示操作方向。

## 风格提示词

```text
Create a neutral financial news cover.
Show market dashboards, abstract index lines, sector rotation tiles, trading floor atmosphere, institutional research desk, or macro data screens.
Use clean analytical composition, restrained contrast, and credible business-news aesthetics.
The image should suggest market movement and risk context without recommending buy, sell, hold, or profit.
For market briefs, show broad market context and dashboard rhythm.
For policy or earnings items, show documents, charts, and institutional decision context.
```

## Kind 适配

### `market_brief`

```text
Use a 16:9 market-brief composition with abstract index curves, sector tiles, macro dashboard, and risk-on/risk-off mood.
Charts may be symbolic but must not display exact prices or fake numbers.
```

### `data`

```text
Use a 4:3 structured financial data cover, 1600x1200 WebP.
Show dashboard modules, sector rotation, macro calendar rhythm, or index comparison blocks.
Only render exact numbers or tickers when supplied by the feed; otherwise keep charts symbolic.
```

### `policy_update`

```text
Use regulator, central bank, filing, or policy document atmosphere with neutral financial context.
No seals, official emblems, or readable policy IDs.
```

### `hot_topic`

```text
Use one clear market catalyst: earnings, IPO, sector shock, chip cycle, currency move, or macro data release.
Keep the composition editorial and non-promotional.
```

## 负面约束

```text
No 1:1 feed cover.
No reusable generic financial template applied to multiple unrelated feeds.
No buy/sell/hold signals, no guaranteed profit, no rocket-to-moon imagery, no panic-crash sensationalism.
No readable stock prices, ticker symbols, fake index values, fake dates, fake company names, or fake filings.
No brokerage branding, exchange logo, regulator seal, or financial influencer style.
No personalized investment advice visual language.
No top-left Feeds Hub logo, Feeds Hub wordmark, or Feeds Hub brand badge.
No top-right theme label, category tag, source tag, or status pill.
```

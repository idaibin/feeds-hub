# Scheduled Market Type Rules

用于 `stock` 的开盘、盘中、闭市、财报、宏观数据、央行和监管时间点。

## Scope

- 美股、港股、A 股闭市优先。
- 相关 AI、芯片、宏观、政策、财报、汇率/利率可写入。
- open、intraday、close 是不同状态，后续 close 不算 open/intraday 重复。

## Fixed Close Windows

每个交易日按固定窗口检查；非交易日包含周末、交易所假期和临时休市，报告 `skipped: market-holiday`。

| Market | Close check time | Required indexes |
| --- | --- | --- |
| A 股 | 15:30-16:30 Asia/Shanghai | 上证指数、深证成指、创业板指、科创 50；可补沪深 300、北证 50 |
| 港股 | 16:15-17:30 Asia/Hong_Kong | 恒生指数、恒生科技指数、国企指数；可补红筹指数 |
| 美股 | 16:15-18:00 America/New_York | Dow、S&P 500、Nasdaq Composite、Russell 2000；可补 Philadelphia Semiconductor Index |

说明：

- A 股主板/深市收盘集合竞价到 15:00；上交所部分盘后固定价格交易到 15:30，闭市信息统一 15:30 后检查。
- 港股收市竞价交易时段通常随机收于 16:08-16:10，闭市信息统一 16:15 后检查。
- 美股使用 Eastern Time。夏令时为 EDT UTC-4，对应北京时间次日 04:15-06:00；冬令时为 EST UTC-5，对应北京时间次日 05:15-07:00。流程中必须使用 `America/New_York` 时区，不手写固定 UTC 偏移。
- 跨时区写入时，`eventAt` 使用该市场闭市后的官方/权威确认时间；正文必须写清本地交易日和北京时间/当地时间差异。

## Source

- 优先 Reuters、交易所、监管/央行、公司公告、官方统计。
- A 股指数和成交额优先上交所、深交所、北交所、中证指数、新华社/证券时报等权威来源；港股优先 HKEX、恒生指数公司、Reuters；美股优先 Reuters、NYSE/Nasdaq/Cboe、指数公司。
- 社交媒体、截图、社区评论不能确认价格、涨跌、财报数字或市场方向。

## Required Facts

- 市场/指数/公司。
- 时间窗口和确认时间。
- 每个 required index 的收盘点位和涨跌幅；来源没有点位时至少写涨跌幅并说明缺失。
- 成交额/成交量、领涨领跌板块、行业或主题线索，来源可核验时必须写。
- 主要驱动。
- 影响范围或下一节点。

## Event Key

闭市使用 `stock:<market>:close:<yyyy-mm-dd>`；其它事件使用 market/entity + window + date + release/filing/earnings id。

## Body

- 第一段：闭市结果，必须包含核心指数涨跌幅。
- 第二段：驱动、板块、公司或宏观影响。
- 第三段：修订、时间 caveat 或下一排期。

## Close Feed Shape

标题写市场和结果，不写完整指数列表；summary 写标题没覆盖的关键驱动。

正文第一段模板：

```text
<交易日> <市场>收盘，<指数1>收于<点位>，涨/跌<幅度>；<指数2>...；<指数3>...。本条记录的是<当地时间>闭市后的确认数据。
```

不得用盘中稿替代闭市稿；同一市场同一交易日只能有一个 close feed，除非交易所发布更正。

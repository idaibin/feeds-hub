# AGENTS.md

Feeds Hub 已升级为模板引擎系统。所有任务必须遵循 ui-spec 与 template-engine。

## 分层
Content层：category/kind/title/subtitle/summary/eventAt/eventKey
Template层：worldcup_schedule/worldcup_result/esports_event/ai_news/stock_brief/global_news
Poster DSL层：ratio(3:4优先), layout(hero/scoreboard/split), focus(title/score/schedule), maxLines<=2

## 核心规则
1 feed = 1 event
海报只表达主题+关键事实
卡片不重复海报
详情页完整展开
移动端优先

## 赛事规则
schedule: VS + 时间 + 阶段
result: 比分最大 + 状态 + 双方
hot_topic: 单一人物或事件

## 禁止
多事件混合
PPT风
重复装饰
海报与卡片重复内容
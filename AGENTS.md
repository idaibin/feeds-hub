# AGENTS.md

Feeds Hub 已升级为模板引擎系统。所有任务必须遵循 `docs/rules/ui-spec.md` 与 template-engine。主题规则维护在 `docs/topics/`，普通内容更新不得和规则/UI调整混在一起提交。

## 分层
Content层：category/kind/title/subtitle/summary/eventAt/eventKey
Template层：worldcup_schedule/worldcup_result/esports_event/ai_news/stock_brief/global_news
Poster DSL层：统一以 `docs/rules/poster-spec.md` 为准。

## 核心规则
1 feed = 1 event
海报生成、格式优先级、图片写入方式和封面待补规则统一以 `docs/rules/poster-spec.md` 为准
卡片不重复海报
详情页完整展开
移动端优先
Header 主题切换使用右侧下拉

## 赛事规则
schedule: 赛程、阶段和赛前氛围由页面文本承载，海报表达预告场景
result: 比分、状态和双方由页面文本承载，海报表达结果氛围
hot_topic: 单一人物或事件方向，海报表达关注焦点

## 禁止
多事件混合
违反 `docs/rules/poster-spec.md` 的海报生成和 fallback 规则

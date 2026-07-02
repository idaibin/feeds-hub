# AGENTS.md

Feeds Hub 已升级为模板引擎系统。所有任务必须遵循 ui-spec 与 template-engine。主题规则维护在 `docs/topics/`，普通内容更新不得和规则/UI调整混在一起提交。

## 分层
Content层：category/kind/title/subtitle/summary/eventAt/eventKey
Template层：worldcup_schedule/worldcup_result/esports_event/ai_news/stock_brief/global_news
Poster DSL层：ratio(16:9), size(推荐1600x900，最低1280x720), layout(hero/scoreboard/split), focus(title/score/schedule), maxLines<=2, 由 ChatGPT 图片生成后保存为 WebP

## 核心规则
1 feed = 1 event
海报只表达主题+关键事实
海报必须是 `cover` 指向的图片资源
卡片不重复海报
详情页完整展开
移动端优先
Header 主题切换使用右侧下拉

## 赛事规则
schedule: VS + 时间 + 阶段
result: 比分最大 + 状态 + 双方
hot_topic: 单一人物或事件

## 禁止
多事件混合
PPT风
重复装饰
海报与卡片重复内容
CSS/HTML 生成海报替代图片
1x1、透明、空白或通用占位海报

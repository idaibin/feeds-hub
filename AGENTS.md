# AGENTS.md

Feeds Hub 已升级为模板引擎系统。所有任务必须遵循 `docs/rules/ui-spec.md` 与 template-engine。主题规则维护在 `docs/topics/`，普通内容更新不得和规则/UI调整混在一起提交。

## 权威与当前运行态

- 跨仓库 AI Engineering 工作流以 `idaibin/ai-handbook/workflows/ai-engineering-system/` 为唯一权威；本仓库只定义 Feeds Hub 的实现、内容和运行细节。
- Production 当前从 Neon Postgres 读取；`src/content/**` 是可审查内容源与回滚来源。只提交 Markdown 不会自动让线上数据库出现新 Feed。
- 例行内容更新必须完成：来源核验 → Markdown → 本地验证 → 合并 `main` → Production 数据库 plan/apply → 恢复运行开关 → 公网页面回读。
- 当前事实与最近一次执行证据看 `README.md` 和 `docs/progress/feed-runtime.md`；初始化设计文档中的 Task 0–6、旧计数和旧 commit 只作历史背景。

## 分层
Content层：category/kind/title/subtitle/summary/eventAt/eventKey
Template层：worldcup_schedule/worldcup_result/esports_event/ai_news/stock_brief/global_news

## 核心规则
1 feed = 1 event
卡片只展示文本信息
详情页完整展开
移动端优先
Header 主题切换使用右侧下拉

## 赛事规则
schedule: 赛程、阶段和赛前氛围由页面文本承载
result: 比分、状态和双方由页面文本承载
hot_topic: 单一人物或事件方向

## 禁止
多事件混合

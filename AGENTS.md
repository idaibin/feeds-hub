# AGENTS.md

Feeds Hub 是以 Neon Postgres 为 Production 内容源的动态信息站。所有任务必须遵循 `docs/rules/ui-spec.md`、`docs/topics/` 和当前数据库写入契约。

## 权威与运行态

- 跨仓库 AI Engineering 工作流以 `idaibin/ai-handbook/workflows/ai-engineering-system/` 为权威；本仓库定义 Feeds Hub 的实现、主题、内容与运行细节。
- Production 从 Neon Postgres 读取。例行 Feed 更新直接写数据库，不新增 Markdown、不创建 GitHub 分支、不提交 `main`、不触发 Vercel。
- GitHub 只管理代码、schema、迁移、规则、runbook 和历史导入资产。
- `src/content/**` 是历史导入与恢复资产，不是例行更新入口。
- 例行流程：来源核验 → 按时间判断应检查 topic → 数据库与语义去重 → 正常中文正文 → 受控写入 → 数据库复核 → 公网页面回读。
- Chat 定时任务入口：`docs/automation/chatgpt-scheduled-task.md`。

## 分层

Content：category/kind/title/subtitle/summary/eventAt/eventKey  
Template：worldcup_schedule/worldcup_result/esports_event/ai_news/stock_brief/global_news

## 核心规则

- 1 feed = 1 event。
- 卡片只展示文本信息，详情页完整展开。
- 移动端优先。
- Header 主题切换使用右侧下拉。

## 禁止

- 多事件混合。
- 例行内容更新写入 GitHub。
- 将数据库成功误报为公网页面成功。

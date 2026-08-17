# Feeds Hub Update

例行任务按 owner 拆分，本仓库保存可版本化规则：

- Grok：`docs/automation/grok-realtime-discovery.md`，负责 `ai` 的高时效发现、去重和
  无人审稿发布；内部连续 draft → publish，正常成功不遗留草稿。
- Gemini Spark：`docs/automation/gemini-spark-deep-research.md`，负责周频单主题 Research
  Dossier；只读 Feeds Hub，不更新 Feed。
- ChatGPT Chat：`docs/automation/chatgpt-scheduled-task.md`，继续负责非重叠的例行 Feed
  更新和最终 Production 写入合同。

## 权威边界

- GitHub：代码、schema、迁移、topic/type/rule、runbook、历史导入与恢复资产。
- Neon Production：线上 Feed 内容的唯一权威存储。
- Vercel：应用部署与 Neon 运行时读取节点，不参与每条 Feed 的发布。
- ChatGPT Work：不参与此流程。
- `src/content/**`：历史导入/恢复资产，不是例行内容入口。

## 例行流程

```text
非重叠 Feed publisher
→ 按实际时间选择 topic
→ 官方来源核验
→ Production 数据与语义去重
→ 生成正常中文正文
→ 只读写入计划
→ 每个 Feed 生命周期操作各自事务原子写入及审计
→ 数据库 post-verify
→ 首页 / 分类页 / 详情页回读
```

单轮最多新增 1 条；没有高置信度新事件时跳过。不得为了维持频率凑数。

`ai` 只有 Grok 一个常规 publisher，`github` 只有 ChatGPT 一个常规 publisher；不得在同一
窗口由多个 provider 重复发布。Research Dossier 不进入 `feeds` 表，也不抵扣普通 Feed 覆盖。

## 写入门禁

- 计划必须为 `1 insert / 0 update / 0 conflict / 0 invalid`。
- 不允许 UPDATE、DELETE、TRUNCATE、DDL 或覆盖既有 Feed。
- 必须遵循当前 `feeds` schema、枚举、内容哈希、版本、审计和幂等契约。
- 优先使用 Feeds Hub API/MCP；仅有 Neon 连接时，复用当前 repository 的 draft → published 事务语义。
- 写后目标 eventKey 必须恰好 1 条，总数只增加 1，业务字段与正文一致，并存在完整 revision/audit/idempotency 记录。

MCP 的 draft 与 publish 是两个独立调用，每个调用内部事务原子；跨调用依靠稳定幂等键和
orphan-draft 恢复，不得宣称整体单事务。只有明确授权的直接 Neon 路径才能在一个数据库
事务中完成完整 draft → published 生命周期。

## 发布与验证

数据库写入不需要 GitHub commit，也不需要 Vercel deployment。网站运行时应直接读取 Neon。

完整成功要求：

- Production 数据验证通过。
- 首页显示新增标题。
- 对应分类页显示新增标题。
- 详情页显示完整正文和关键段落。

数据库成功但公开页面无法从当前执行环境确认时，数据库标记 `verified`，公开回读标记 `not verified`，不得混写。

## 规则来源

- Topic：`docs/topics/*.md`
- 类型：`docs/types/*.md`
- 内容格式：`docs/rules/content-format.md`
- UI：`docs/rules/ui-spec.md`
- 数据契约：`src/db/schema.ts`、`src/domain/feed-content-hash.ts`、`src/lib/feed-validation.ts`、`src/db/neon-feed-repository.ts`

只有代码、schema、规则或 runbook 发生变化时才更新 GitHub，并由既有 Vercel 关联处理部署。

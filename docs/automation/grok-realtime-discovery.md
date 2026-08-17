# Grok AI Realtime Publisher

本文件是 Grok AI 实时信息任务的版本化配置。当前采用无人审稿的兼容发布模式：Grok
负责 `ai` 的发现、来源核验、语义去重、正文生成和 Production 发布；`github` 仍由
ChatGPT 日更任务负责，两个 owner 不重叠。

## 调度与边界

- 任务名：`Feeds Hub · Grok AI Realtime Publisher`
- 状态：配置保存并完成首次回读前为 `Ready`；不得提前标记 `Active`
- Provider 调度：Hourly / Every day / All day
- 业务时区：`Asia/Shanghai`
- 正常窗口：本轮开始时间前 75 分钟，包含 15 分钟 overlap
- 首次运行或上轮明确失败：最多回看 6 小时，禁止每轮重扫 24 小时
- 单轮最多发布 1 条；没有合格事件时 `SKIP`
- 只处理 `ai`；不得顺带处理 GitHub、hot、stock、赛事或 Research Dossier

当前 MCP 没有“直接 published insert”。为保留版本、revision、audit 和幂等合同，任务
必须在同一轮连续执行 `save_feed_draft → publish_feed`。这只是内部生命周期，不引入
人工审核；成功后目标 Feed 必须为 `published/version=2`，不得正常遗留 draft。

如果 `save_feed_draft` 成功而 `publish_feed` 失败，立即停止并报告 `orphan-draft`。
后续轮次先按 eventKey 和稳定幂等键恢复该 draft，核验内容仍有效后发布；在恢复完成前
不得创建同一事件的第二条 Feed。

## 来源规则

- 优先 OpenAI、Anthropic、Google DeepMind/Gemini、xAI、Meta AI、Microsoft AI、
  NVIDIA、Mistral，以及 Qwen、DeepSeek、Z.ai/GLM、Kimi 的官方来源。
- X、Hacker News、Reddit 和社区只用于 discovery；社区热度不提高事实置信度。
- L1 官方组织账号可以提供声明事实；员工、项目账号和高信号个人默认只作发现。
- 价格、API、弃用、额度、可用性、安全、benchmark、融资和监管必须回到官方页面、
  model/system card、Docs、Changelog、release、论文、监管文件或权威报道。
- 员工信号没有官方或独立证据时，只写运行报告，不发布 Feed。

## 事件身份与去重

候选必须先形成：

```yaml
subject: string
action: string
object: string
versionOrState: string
eventAt: iso-8601
canonicalEventKey: string
canonicalSourceUrl: https-url
evidence:
  - url: https-url
    publisher: string
    observedAt: iso-8601
    role: confirms | corroborates | discovery
materialDelta: string
semanticFingerprint: string
certainty: confirmed | reported | pending-confirmation
```

`canonicalEventKey` 使用主体、动作、对象、正式版本/状态和事件日期，不使用标题文案或
X handle。同一 `subject/action/object/versionOrState/eventAt` 即使 URL 不同，也属于同一
事件。只有 proposal → decision、RC → stable、advisory → patched、incident → resolved
等实质状态递进才允许新增。

写入前必须：

1. `list_feeds` 读取近期 published `ai` 和尚未完成的 draft。
2. `find_feed_duplicates` 同时提交 eventKey、slug、sourceUrl、title、category。
3. 对任一候选重复项调用 `get_feed`，比较事件语义和 material delta。
4. 精确重复、语义重复或判断不确定均跳过。
5. sourceUrl 或标题 advisory 命中时，除非能证明是允许的状态递进，否则默认跳过。
6. 新事件计划必须为 `1 insert / 0 update / 0 conflict / 0 invalid`；恢复 orphan draft
   必须为 `0 insert / 1 publish-existing / 0 conflict / 0 invalid`。

## 内容与发布门禁

- title 只写已核验事实，确定性不得高于来源。
- subtitle、summary、首段不得近似复述。
- 正文 3–5 个自然段：事实、时间线/能力、影响、限制和下一步。
- 禁止残句、未闭合括号、任务报告、去重声明、搜索过程、prompt/JSON/YAML 字段和无来源扩写。
- `coverStatus=pending`；category 固定 `ai`，slug 必须以 `ai/` 开头。
- draft 和 publish 使用基于 canonicalEventKey 的稳定、不同幂等键；重试不能换 key。
- 不调用 `update_published_feed` 或 `archive_feed`，不修改旧 Feed，不执行直接 SQL。

写后必须验证：

- 新事件目标 eventKey 恰好 1 条；恢复 orphan draft 不增加 Feed 行数。
- `status=published`、`version=2`、`origin=mcp`。
- 正文和全部业务字段一致；保存和发布返回两个不同的 auditEventId。
- revision/idempotency 总数只有在当前任务具备受控审计读取能力时才核验，否则明确标记
  `Not verified`，不得凭 MCP mutation 返回值猜测。
- 首页、AI 分类页、详情页分别回读；数据库和公网结果分开报告。

## Provider Prompt

```text
你是 Feeds Hub 的 Grok AI Realtime Publisher。时区固定 Asia/Shanghai。
你负责 AI 实时信息的发现、核验、严格去重和无人审稿发布；不处理 GitHub 或深度研究。

每轮：
1. 从 idaibin/feeds-hub 最新 main 读取并记录 commit SHA。
2. 必须读取 AGENTS.md、docs/automation/grok-realtime-discovery.md、
   docs/topics/README.md、docs/topics/ai.md、docs/types/realtime.md、
   docs/rules/content-format.md、src/domain/feed-content-hash.ts、
   src/lib/feed-validation.ts、src/db/schema.ts、src/db/neon-feed-repository.ts。
   任一必要文件不可读则停止。
3. 正常只检查过去 75 分钟；只有首次运行或上轮明确失败时回看最多 6 小时。
   禁止每轮扫描过去 24 小时。
4. 每轮最多选择一个有实质信息增量的 AI 事件；没有则 SKIP，不凑数。

来源：
- X、Hacker News、Reddit、社区只用于发现。
- 硬事实必须回到官方 News/Docs/Changelog/release/model card/论文/监管文件，
  或有独立权威来源交叉确认。
- 员工信号没有官方或独立确认时只进入运行报告，不发布。

候选先形成 subject、action、object、versionOrState、eventAt、canonicalEventKey、
canonicalSourceUrl、evidence、materialDelta、semanticFingerprint、certainty。

严格去重：
1. list_feeds 读取近期 published ai 和未完成 draft。
2. find_feed_duplicates 提交 eventKey、slug、sourceUrl、title、category。
3. 对每个候选重复项 get_feed 并比较事件语义。
4. 同一 subject/action/object/versionOrState/eventAt 即使 URL 不同也算重复。
5. sourceUrl 或标题 advisory 命中时，不能证明是状态递进就跳过。
6. 新事件计划必须是 1 insert / 0 update / 0 conflict / 0 invalid；恢复 orphan draft
   必须是 0 insert / 1 publish-existing / 0 conflict / 0 invalid，否则停止。

内容：
- 中文 title 的确定性不得高于来源；reported/pending 不能写成正式确认。
- 正文 3–5 个自然段，不得出现残句、任务报告、去重声明或搜索过程。
- title/subtitle/summary/首段不得近似复述；coverStatus=pending。

发布：
- 先 save_feed_draft，再立即使用返回的 feedId/version 调用 publish_feed。
- 使用基于 canonicalEventKey 的稳定 draft/publish 幂等键，重试不得换 key。
- 正常成功后不得留下 draft；禁止 update_published_feed、archive_feed 和直接 SQL。
- 若 publish 失败，报告 orphan-draft，停止创建新 Feed；下一轮先恢复该 draft。

写后验证 eventKey 唯一、status=published、version=2、origin=mcp、字段一致，并确认
draft/publish 返回两个不同 auditEventId。revision/idempotency 总数无受控读取能力时标记
Not verified，不得猜测；继续回读首页、AI 分类页和详情页。

最终报告：commit、window、sourcesChecked、decision、title、eventKey、sourceUrl、
duplicateEvidence、databaseVerification、publicReadback、orphanDraft、notVerified。
```

## 运行验收

- 保存配置后回读任务名、Hourly、Every day、All day 和完整 Prompt。
- 首次真实运行必须有终态；`ACTIVE` 不等于运行成功。
- 正常轮次窗口超过 90 分钟的次数为 0。
- 单轮发布数 0 或 1；同一事件重复发布数为 0。
- 社交/员工信号单独确认硬事实数为 0。
- 正常成功遗留 draft 数为 0；orphan draft 必须在下一轮优先恢复或明确阻塞。

## 后续最小权限升级

无人审稿兼容模式仍存在 `feeds:write` 同时覆盖草稿和已发布编辑的风险。后续应新增
`feeds:draft`，让 Grok 只创建 draft，并由独立 Publisher 自动发布；切换前必须完成
非 Production 权限、幂等和审计 canary。该升级不得中断当前 AI 发布 owner。

# Gemini Spark Deep Research Task

本文件是 Gemini Spark 单主题深度研究任务的版本化配置。任务只生成 Research Dossier
工作副本，不更新 Feed，不自动进入 AI Handbook，也不发布 Blog。

## 当前执行模式

- 任务名：`Feeds Hub · Gemini Weekly Deep Research`
- 状态：配置保存、时区和首次运行回读前为 `Ready for provider-only pilot`
- 时区：`Asia/Shanghai`
- 调度：每周一 `09:30`
- 候选窗口：上一北京时间自然周（周一 00:00 至周日 23:59:59）
- 每轮：0 或 1 份 Dossier；没有满足门禁的对象时输出 `SKIP`
- Feeds Hub 权限：只读，只允许 `list_feeds`、`get_feed` 和必要的
  `find_feed_duplicates`

等价 cron（provider UI 的实际时区、next run 和持久化状态必须单独回读）：

```cron
TZ=Asia/Shanghai
30 9 * * 1
```

重大突发事件不自动触发第二条无人值守任务。需要深研时，由用户明确创建一次性任务，
事件发生至少 12 小时后、优先在下一个北京时间 `09:30` 执行。

## 触发门禁

候选必须同时满足：

1. 对象是单一模型/明确版本，或具有稳定事件身份的一个重大 AI 事件。
2. 至少有一个官方、监管、法定披露或原始论文来源。
3. 能力、可用性、API、价格、限制、安全、政策、重大研究或工程工作流发生实质变化。
4. 对开发者、组织决策或 AI Engineering 方法有明确影响。
5. 相比已有 Feed 和既有 Dossier 有真实信息增量。

传闻、仅社交热度、普通小功能、无测试上下文的 benchmark、泛模型排行和多个无关事件
拼盘必须跳过。

多个候选按以下分数选择：影响 0–3、证据完整度 0–3、新颖性 0–2、决策相关性
0–2。总分至少 7，证据完整度至少 2；并列时依次比较官方证据完整度、影响、新鲜度。

## 来源等级

- A：官方文档、model/system card、changelog、API/价格页、官方仓库/release、原始论文、
  监管决定或法定披露。
- B：Reuters 等权威报道、独立复现、方法公开的第三方评测。
- C：高质量技术分析、maintainer issue/discussion，只作解释和冲突线索。
- D：X、Reddit、Hacker News、Trending，只作发现和社区反应。

价格、API、弃用、安全、监管和 benchmark 主张必须回到 A；需要解释争议或行业影响时
增加 B。Feed summary、搜索摘要和 D 级来源不能单独支持硬事实。

## 选题和去重

1. 只读获取上一自然周 published `ai` Feed；对候选使用 `get_feed`。
2. Feeds Hub 只负责发现，所有硬主张重新打开原始来源核验。
3. Dossier key 使用：

```text
subjectCanonicalId | eventClass | officialVersionOrDecisionId
```

4. 同一 key 没有实质新状态时跳过；preview → public release、proposal → final rule、
   incident → remediation 可以形成有前后关系的新版本。
5. 当前没有已验证的 Dossier registry/consumer，跨周持久去重必须标记
   `Not verified`，不能用 `find_feed_duplicates` 冒充 Research 去重。

## Dossier 结构

1. 身份：标题、dossierKey、对象类型、研究窗口、执行时间、规则版本。
2. 执行摘要：发生了什么、为何重要、当前结论和置信边界。
3. 官方事实时间线与状态变化。
4. 核心变化：能力、访问、API、价格、限制、安全、前代差异或事件影响。
5. Claim–Evidence 表：原子主张、来源等级、URL/locator、observedAt、支持/冲突。
6. 对开发者和 AI Engineering 工作流的影响。
7. 限制、反证和来源冲突。
8. `Confirmed / Inference / Not verified`。
9. 开放问题与下一次验证条件。
10. 来源清单和实际覆盖范围。

输出状态必须分开记录：

```yaml
workflowStatus: pending | processing | closed | cancelled
terminalResult: completed | partial | failed | skipped
verificationStatus: unverified | source-supported | independently-verified
feedsCrosscheck: verified | not-verified
syncStatus: not-required | saved-working-copy | write-failed
handoffStatus: none | proposed | accepted | rejected
```

## 输出边界

Gemini task result 是当前最小可落地输出。若 provider 已有经过用户授权的 Google Drive
写入能力，可额外保存工作副本到：

```text
01_AI_Workspace/feeds-hub/research/
```

文件名：`YYYY-MM-DD_<subject-key>_research.md`。

Drive 副本不是 Feeds Hub runtime、不是 AI Handbook 权威知识，也不是 Blog 可发布内容。
保存失败只标记 `syncStatus=write-failed`，不得重新研究或把失败误报为内容失败。

## Provider Prompt

```text
你是 Gemini Spark Research Dossier Worker。时区固定 Asia/Shanghai。
本任务每周只研究一个单一模型/明确版本，或一个重大 AI 事件。

边界：
- Feeds Hub 只用于候选发现；只允许 list_feeds、get_feed、find_feed_duplicates。
- 禁止 save_feed_draft、publish_feed、update_published_feed、archive_feed。
- 不写数据库、GitHub、Vercel，不自动写 AI Handbook，不发布 Blog。
- Google Drive 只保存工作副本，不代表知识晋级或 Production 发布。

每轮：
1. 记录 executedAt、Asia/Shanghai 研究窗口和规则版本。
2. 读取 idaibin/feeds-hub 最新 main 的 AGENTS.md、README.md、
   docs/automation/gemini-spark-deep-research.md、docs/topics/ai.md、
   docs/architecture/knowledge-candidate-handoff.md，并记录 commit SHA。
3. 只读收集上一北京时间自然周的 published/ai Feed 候选；逐个 get_feed。
4. 同时检查优先厂商官方 News、Research、Docs、Changelog、GitHub release、
   model/system card、原始论文和监管来源。所有硬主张重新核对原始来源。
5. 按触发门禁、评分和 dossierKey 去重，最多选择一个对象；没有合格对象输出 SKIP。
6. 每个硬主张记录 URL、locator、observedAt、来源等级和支持/冲突关系。
7. 输出身份、摘要、时间线、核心变化、Claim–Evidence 表、开发者影响、
   限制与冲突、Confirmed/Inference/Not verified、开放问题和来源清单。
8. 缺少关键来源、Feeds 只读交叉检查或足够证据时输出 partial，不得 completed。

失败处理：
- 配额不可用：记录 failed/quota-unavailable 和 Usage 页面刷新时间，等待下一计划轮次；
  不重复提交、不循环重连。
- OAuth/DCR 失败：一次诊断后停止；禁止以连续重连恢复。
- MCP 不可用：可以保留官方来源研究草稿，但 feedsCrosscheck=not-verified，
  terminalResult 最多为 partial。
- 429 只遵循明确 Retry-After；来源冲突必须保留双方证据，不强行裁决。

若 Google Drive 可写，将工作副本保存到
01_AI_Workspace/feeds-hub/research/YYYY-MM-DD_<subject-key>_research.md；
保存失败标记 syncStatus=write-failed，不重新研究。
```

## 验收

- 100% run 记录时区、窗口、commit SHA、规则版本和终态。
- 每轮 0 或 1 个对象；多个对象拼盘数量为 0。
- 100% 硬主张包含来源等级、URL/locator 和 observedAt。
- D 级来源单独支持硬事实数量为 0。
- Feeds Hub 写工具调用、数据库 mutation、Handbook/Blog 自动发布均为 0。
- 首次启用前完成真实 `list_feeds → get_feed` canary，并回读持久化时区、
  `next_run_at`、配额状态和首次实际 run 终态。
- 连续两轮真实运行后，才能评估是否设计 Dossier registry 或 Handbook consumer。

当前仅 `Ready for provider-only pilot`。无人值守 canonical workflow 仍被 Dossier registry、
consumer/validator、持久去重、鉴权、审计和 Review owner 缺失阻塞。

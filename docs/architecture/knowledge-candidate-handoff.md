# Knowledge Candidate Handoff

- **Status:** approved target specification; not implemented
- **Decision date:** 2026-08-11
- **Canonical consumer contract:** `idaibin/ai-handbook/workflows/ai-engineering-system/knowledge-publication.md`

Feeds Hub、AI Handbook 和 Blog 保持独立仓库。Feeds Hub 负责实时信息事件；它可以把
值得进一步研究的事件显式导出为 knowledge candidate，但不负责知识裁决、图谱治理或
公开发布。

## 1. 所有权边界

Feeds Hub 拥有：

- feed identity、event identity 和事件时间；
- 来源、内容哈希、去重与核验状态；
- 事件生命周期、查询与写入契约；
- knowledge candidate 的生成事实和交付记录。

AI Handbook 拥有：

- source、claim、concept、practice、workflow、tool、skill、project、experiment；
- evidence、freshness、conflict、promotion 和 public eligibility；
- 候选接受、研究、综合、验证、晋级或拒绝。

Blog 不消费 Feed 事件，也不接收 candidate。只有经 Handbook 晋级并导出的固定版本
公开 artifact 可以进入 Blog。

## 2. Candidate 合同

候选是显式 artifact 或 request，最小字段如下：

```yaml
schemaVersion: knowledge-candidate/v1
feedId: string
slug: string
feedVersion: integer
eventKey: string
source: string
sourceUrl: https-url
eventAt: iso-8601
observedAt: iso-8601
contentHash: sha256
candidateReason: string
verificationStatus: unverified | source-checked | corroborated
summary: string
tags: [string]
```

幂等键固定为 (`feedId`, `eventKey`, `contentHash`)。`feedVersion` 只表示来源快照和并发
元数据，不参与幂等身份。相同幂等键重复交付必须返回既有结果，不能创建第二个候选。

`summary`、`tags` 和 `candidateReason` 只是发现与路由提示，不是已经验证的 claim，也
不能自动提升 `verificationStatus`。

## 3. 交付与失败语义

1. 更新流程先按现有规则完成 feed 的来源核验、去重和持久化。
2. 只有显式选择的事件才生成 candidate；普通 feed 不自动导出。
3. 交付必须记录幂等键、目标 Handbook revision/endpoint、时间和结果。
4. Handbook 可接受、拒绝或要求补证；这些结果不反向改写原始 feed 事实。
5. 交付失败可按同一幂等键重试，但不能绕过 Handbook 直接写 Blog 或公开发布。

v1 不复制 Handbook 的图谱、promotion 状态机、freshness 规则或 public eligibility，
也不新增跨仓库运行时读取、数据库、队列或 CLI。

## 4. 实施门槛

本合同只冻结职责与数据边界。实现必须等到以下条件同时满足：

- Handbook consumer 与 schema validator 已存在；
- 候选 producer 有明确真实调用者；
- 交付方式、鉴权、重试和审计位置已由单独任务批准；
- contract fixture 和幂等回归测试通过。

在此之前，不修改当前 `topics -> sources -> Production dedupe -> draft -> publish -> readback`
主流程，也不把候选字段加入 feed frontmatter。

# Feeds Hub MCP：Gemini Spark 与 Grok 接入

本文负责 Gemini Spark、Grok 等标准 Streamable HTTP MCP 客户端的接入与验收。
服务端领域与安全契约仍以 [`feed-runtime-contracts.md`](../architecture/feed-runtime-contracts.md)
和 [`feed-mcp-oauth.md`](feed-mcp-oauth.md) 为准。

## 当前服务端能力

MCP URL：`https://feeds.idaibin.dev/api/mcp`

读取工具：

- `list_feeds`
- `get_feed`
- `find_feed_duplicates`

写入工具：

- `save_feed_draft`
- `publish_feed`
- `update_published_feed`
- `archive_feed`

写入必须经过 draft、重复检查、publish/update/archive 的明确生命周期；每个变更都要求
幂等键、reason、OAuth scope，并由数据库事务记录 revision 与 audit。不要增加绕过
`FeedService` 的通用 upsert、SQL 或物理删除工具。

## OAuth 兼容条件

客户端先读取 `/.well-known/oauth-protected-resource`，再跟随 Auth0 的 OIDC metadata
完成 authorization code + PKCE。当前 Auth0 tenant metadata 必须公开：

- `authorization_endpoint`
- `token_endpoint`
- `registration_endpoint`，或为客户端预建 static OAuth client
- `code_challenge_methods_supported` 包含 `S256`

resource / audience 固定为 `https://feeds.idaibin.dev/api/mcp`。客户端最终能看到哪些
工具，还会受到账号套餐、workspace action control、OAuth grants 和服务端 kill switch
共同限制；只看到三个读取工具不等于服务端没有写工具。

## Grok

1. 打开 `https://grok.com/connectors`。
2. 选择 **New Connector → Custom**。
3. Name 填 `Feeds Hub`，Server URL 填
   `https://feeds.idaibin.dev/api/mcp`。
4. 完成 OAuth 登录和 consent。
5. 在新对话中先调用 `list_feeds`，再用返回的 id 调用 `get_feed`。

Grok 的 custom connector 由 Grok 服务端访问，因此 MCP URL 必须公网 HTTPS 可达；
不要把 localhost 或私网 URL 配置到正式连接器。

## Gemini Spark

Gemini custom app 当前只在具备 Spark 资格的个人 Google Account 中可用，并受地区、
语言、Keep Activity 等产品条件约束。配置入口位于 Gemini web 的
**Settings & help → Connected Apps → Custom apps for Spark**。

1. 输入 `https://feeds.idaibin.dev/api/mcp`。
2. 若 Dynamic Client Registration 可用，按页面继续 OAuth。
3. 若客户端提示 DCR 不可用，展开 Advanced features，填写为 Gemini 预建的 static
   OAuth client credentials；不要把 client secret 写入本仓库、日志或截图。
4. 连接后只在 Spark task 中调用 `list_feeds` 和 `get_feed` 做只读 canary。

## 查询验收

按顺序执行：

1. `list_feeds({"status":"published","category":"ai","limit":3})`
2. `get_feed({"id":"<list_feeds 返回的 id>"})`
3. `find_feed_duplicates` 使用一个候选的 `eventKey`、`sourceUrl` 或 title

验收要求：初始化和每个工具调用完成；结果是结构化 JSON；cursor 只在同一读取源
继续使用；未知字段被拒绝；未授权或 scope 不足时明确失败。

## 写入验收

完整写入 canary 必须使用明确隔离的非 Production 数据库：

1. `find_feed_duplicates`
2. `save_feed_draft` 创建 draft
3. 重放同一 idempotency key，确认不重复创建
4. `publish_feed` 使用 draft 当前 `version`
5. `update_published_feed` 使用 published 当前 `version`
6. `archive_feed` 软归档
7. 回读 feed、revision、audit、idempotency，确认版本与动作一一对应

除非另有逐项授权，不要为验证在 Production 创建测试 Feed。Production 真内容写入仍
遵守 [`chatgpt-scheduled-task.md`](../automation/chatgpt-scheduled-task.md) 的单事件、来源
核验、去重、草稿、发布与公开页面回读门禁。

## 关注范围

Grok 负责 X、GitHub、Hacker News 等高时效 discovery；Gemini Spark 负责官方来源、
论文、法规和跨源验证。最终分类与来源优先级分别读取：

- [`ai.md`](../topics/ai.md)：国内外主流模型厂商与 X 三层白名单
- [`github.md`](../topics/github.md)：AI、skills、Agent、UI、image 趋势
- [`hot.md`](../topics/hot.md)：平台热度和社区反应边界

X 或社区信号不能单独确认硬事实。GitHub Trending 只负责发现，版本与能力回到
release、tag、changelog、README 或官方文档确认。

## 官方客户端资料

- Grok Connectors：<https://docs.x.ai/grok/connectors>
- Grok Custom MCP Server Tunneling：<https://docs.x.ai/grok/connectors/custom-mcp-tunneling>
- Gemini Spark custom apps：<https://support.google.com/gemini/answer/17209137>

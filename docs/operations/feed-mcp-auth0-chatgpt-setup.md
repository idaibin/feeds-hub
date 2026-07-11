# Feeds Hub MCP：设计、开发、OAuth、部署与验证复盘

本文记录 Feeds Hub 从 Markdown 信息流演进到 Neon + Remote MCP 的完整过程。它同时承担三种用途：

- 解释当前架构为什么这样设计；
- 提供 Auth0、Vercel、Neon 与 ChatGPT 的操作手册；
- 记录已经验证的能力、失败路径和仍未完成的自动化。

协议和环境变量的精确定义以 [`feed-mcp-oauth.md`](feed-mcp-oauth.md) 与 [`feed-runtime-contracts.md`](../architecture/feed-runtime-contracts.md) 为准；Production 变更仍遵循 [`feed-runtime-production-cutover.md`](feed-runtime-production-cutover.md)。

## 一、最终结论

截至 2026-07-11，Feeds Hub 已经具备完整的数据库和 MCP 读写后端：

| 层 | 当前状态 |
|---|---|
| Web | Astro 部署在 Vercel，域名为 `https://feeds.idaibin.dev` |
| 数据库 | Neon Postgres，Production 使用低权限运行时角色 `feeds_app_runtime` |
| 读取 | Web 与 MCP 从 Neon 读取；Markdown 仍保留为归档与回滚来源 |
| 写入 | FeedService 支持草稿、发布、已发布更新和软归档 |
| MCP | `https://feeds.idaibin.dev/api/mcp` |
| OAuth | Auth0，issuer 为 `https://idaibin.jp.auth0.com/` |
| OAuth resource / audience | `https://feeds.idaibin.dev/api/mcp` |
| OAuth scopes | `feeds:read`、`feeds:write`、`feeds:publish`、`feeds:archive` |
| 服务端工具 | 3 个读取工具 + 4 个写入工具 |
| ChatGPT Pro | 只能使用 3 个读取工具；完整写入 MCP 需要 Business、Enterprise 或 Edu |
| 自动抓取与生成 | 尚未实现 Vercel Cron Agent；当前 MCP 只负责 Feed 数据操作 |

因此要区分两个事实：

1. **Feeds Hub MCP Server 已经实现写能力。**
2. **ChatGPT Pro 会过滤自定义 MCP 的写入/修改工具。**

反复刷新 CIMD、扩大 Auth0 scopes 或重新安装 ChatGPT App，都不能突破客户端套餐限制。

## 二、目标与边界

最初的信息流更新链路是：

```text
搜索公开信息
  -> 核实与去重
  -> 生成 Markdown
  -> 提交 GitHub
  -> Vercel 重新部署
```

这条链路可靠、可审计，但实时更新会产生大量内容提交，写入也必须依赖 GitHub。MCP 改造的目标是把“内容领域操作”从 Git 仓库中解耦：

```text
客户端 / Agent
  -> Remote MCP 或受保护 HTTP API
  -> FeedService
  -> FeedRepository
  -> Neon Postgres
  -> Astro 动态读取
```

MCP 不负责自动发现新闻，也不会自动获得搜索能力。它只暴露经过审查的 Feed 操作。未来的定时搜索、事实核验和生成属于独立的 Vercel Cron Agent。

## 三、架构设计

### 3.1 分层

```text
ChatGPT / Codex / Cron Agent / 其他 MCP Client
                    |
             OAuth Bearer JWT
                    |
      Astro / Vercel Remote MCP Route
                    |
               FeedService
                    |
             FeedRepository
                    |
              Neon Postgres
```

- **Transport**：HTTP API 与 MCP 只做协议适配，不复制领域规则。
- **FeedService**：负责校验、去重、幂等、状态转换、乐观锁和审计意图。
- **FeedRepository**：负责事务、版本、修订记录、审计记录和数据库持久化。
- **Read Source**：Content 与 Database 可以切换，便于迁移和回滚。
- **OAuth Resource Server**：Feeds Hub 验证 token，但不负责登录或签发 token。

### 3.2 Feed 生命周期

```text
draft -> published -> archived
          |
          +-> update published fields -> published(new version)
```

- 草稿保存和更新使用幂等键。
- 发布、更新和归档都要求 `expectedVersion`，避免静默覆盖。
- 归档是软删除；没有物理删除工具。
- 每次变更追加 revision、audit event 和 idempotency record。

### 3.3 MCP 工具

| Tool | Scope | 类型 | 用途 |
|---|---|---|---|
| `list_feeds` | `feeds:read` | 读取 | 有界筛选与游标分页 |
| `get_feed` | `feeds:read` | 读取 | 按 id 或 slug 读取详情 |
| `find_feed_duplicates` | `feeds:read` | 读取 | 查找精确与建议重复项 |
| `save_feed_draft` | `feeds:write` | 写入 | 创建或乐观更新草稿 |
| `publish_feed` | `feeds:publish` | 写入 | 发布已审查草稿 |
| `update_published_feed` | `feeds:write` | 写入 | 更新允许修改的已发布字段 |
| `archive_feed` | `feeds:archive` | 写入 | 软归档已发布内容 |

当前没有以下工具：

- `trigger_discover`
- `trigger_generate`
- `trigger_pipeline`
- `manage_sources`

这些能力需要未来的定时任务与搜索 Agent，不应伪装成 Feed CRUD。

## 四、开发过程

### 4.1 领域模型与双读取源

第一步不是直接接数据库，而是把页面从 Astro `CollectionEntry` 中解耦，形成稳定的 Feed 领域模型。随后实现：

- `ContentFeedSource`：读取现有 Markdown；
- `DatabaseFeedSource`：读取 Neon；
- `FEED_READ_SOURCE=content|database`：运行时切换。

这样数据库切换失败时，仍可回到 Markdown 展示。

### 4.2 数据库与迁移

Neon 中保存：

- Feed 主记录；
- 修订历史；
- 审计事件；
- 幂等执行记录；
- migration journal。

迁移 runner 固定迁移文件和 SHA-256，不接受任意 SQL、文件路径、shell 或 down migration 输入。Production 操作必须验证数据库身份、备份证据和操作范围。

### 4.3 写入服务

写入 API 和 MCP 共用 `FeedService`，避免出现两套规则。服务层统一处理：

- schema 与字段长度校验；
- URL 协议限制；
- 重复检测；
- 幂等键冲突；
- 乐观锁版本冲突；
- 发布状态转换；
- append-only 审计。

### 4.4 Remote MCP

MCP 使用 Streamable HTTP，入口为：

```text
POST https://feeds.idaibin.dev/api/mcp
```

写工具是否注册受 `FEED_WRITES_ENABLED` 控制；整个 MCP 路由还受 `FEED_MCP_ENABLED` 控制。两个开关是不同边界：

- `FEED_MCP_ENABLED=false`：MCP 整体不可用；
- `FEED_MCP_ENABLED=true`、`FEED_WRITES_ENABLED=false`：只暴露读取工具；
- 两者都为 `true`：服务端注册全部七个工具。

## 五、OAuth 设计

### 5.1 四种对象

| 对象 | 职责 |
|---|---|
| Auth0 Tenant 管理员 | 管理租户、API、用户、角色和连接 |
| Auth0 Custom API | 表示 Feeds Hub MCP resource/audience |
| ChatGPT CIMD 客户端 | 代表 ChatGPT 发起 OAuth 授权 |
| Auth0 应用用户 | 真正登录并获得角色权限的人 |

使用 Google 或 GitHub 登录 Auth0 Dashboard，只代表 Tenant 管理员身份，不会自动成为 Feeds Hub 应用用户。

### 5.2 OAuth 请求链

```text
ChatGPT
  -> 读取 Feeds Hub protected-resource metadata
  -> 跳转 Auth0 authorization endpoint
  -> 用户登录并授权 scopes
  -> Auth0 签发 JWT access token
  -> ChatGPT 携带 Bearer token 调用 /api/mcp
  -> Feeds Hub 校验签名、issuer、audience、expiry 和 scopes
```

Feeds Hub 是 OAuth 受保护资源，不是授权服务器。Auth0 负责：

- 登录与同意授权；
- authorization code + PKCE S256；
- access/refresh token；
- JWKS；
- 用户、角色、client grant。

### 5.3 Auth0 API

进入 **Applications → APIs → Create Custom API**：

| 字段 | 值 |
|---|---|
| Name | `Feeds Hub MCP` |
| Identifier | `https://feeds.idaibin.dev/api/mcp` |
| JWT Profile | `Auth0` |
| Signing Algorithm | `RS256` |
| User-delegated access | `Per-app authorization` |
| Client access | `Per-app authorization` 或关闭不需要的 M2M 访问 |

添加四个 permission：

```text
feeds:read
feeds:write
feeds:publish
feeds:archive
```

开启：

- RBAC；
- Add Permissions in the Access Token；
- Allow Offline Access；
- CIMD Registration；
- Resource Parameter Compatibility Profile。

### 5.4 CIMD 客户端

ChatGPT 创建 App 时会生成一个 HTTPS Client ID Metadata Document URL。Auth0 需要：

1. **Applications → Applications → Create Application**；
2. 选择 **Import from URL**；
3. 粘贴 ChatGPT 提供的 CIMD URL；
4. Preview 后保存；
5. 在 Feeds Hub API 的 **Application Access** 中授权 scopes。

CIMD Preview 中以下 warning 不影响接入：

- `response_types` 只用于内部验证；
- `client_uri`、`token_endpoint_auth_methods_supported` 未映射。

### 5.5 登录连接与用户角色

CIMD 导入的客户端是第三方应用，因此登录连接必须提升为 Domain Level。可以使用：

- Auth0 Database Connection：手动创建应用用户；
- Google Social Connection：首次登录后自动创建用户。

启用 RBAC 后，建立角色并分配给登录用户。有效权限是：

```text
客户端被允许请求的 scopes
∩ 用户角色包含的 permissions
∩ Feeds Hub MCP 要求的 scopes
```

只扩大其中一层不会产生最终权限。

## 六、Vercel 与 Neon 部署

### 6.1 为什么使用自动 bootstrap

远程协作时，不能依赖操作者本机持有 Neon owner URL。当前分支增加了一次性 Vercel Production build bootstrap：

1. 确认目标 commit；
2. 确认 Neon backup branch 和保留时间；
3. 使用临时 owner pooled/direct URL；
4. 执行固定 foundation/forward migration；
5. 创建低权限 `feeds_app_runtime`；
6. 应用固定 write grants；
7. 验证 schema、grant 和运行时身份；
8. 输出不含密钥的状态文件；
9. 切换到 `FEED_RUNTIME_DATABASE_URL`；
10. 删除 owner URL 和所有 bootstrap 环境变量；
11. 断开 Vercel Marketplace 的管理员凭据注入，但保留 Neon 数据库。

bootstrap 只能在 Vercel Production build 中运行，并要求：

```text
FEED_READ_SOURCE=content
FEED_WRITES_ENABLED=false
FEED_MCP_ENABLED=false
```

完成后关闭 bootstrap，Production 只保留低权限运行时 URL。

### 6.2 Production 环境

当前运行时配置名称如下，值必须保存在 Vercel encrypted environment variables 中：

```text
FEED_RUNTIME_DATABASE_URL
FEED_READ_SOURCE=database
FEED_WRITES_ENABLED=true
FEED_MCP_ENABLED=true
FEED_MCP_AUTH_MODE=oauth
FEED_MCP_OAUTH_ISSUER=https://idaibin.jp.auth0.com/
FEED_MCP_OAUTH_RESOURCE=https://feeds.idaibin.dev/api/mcp
FEED_MCP_OAUTH_AUDIENCE=https://feeds.idaibin.dev/api/mcp
FEED_MCP_OAUTH_JWKS_URL=https://idaibin.jp.auth0.com/.well-known/jwks.json
FEED_MCP_OAUTH_ALGORITHMS=RS256
FEED_MCP_OAUTH_REQUIRED_SCOPES=feeds:read feeds:write feeds:publish feeds:archive
FEED_MCP_ALLOWED_ORIGINS=https://chatgpt.com
```

Production 不应继续保留：

- Neon owner/direct URL；
- Marketplace 自动注入的管理员连接变量；
- `FEED_DB_BOOTSTRAP_*`；
- access token、refresh token 或 Auth0 Client Secret。

## 七、验证

### 7.1 本地验证矩阵

| 层 | 验证内容 |
|---|---|
| Domain | 状态转换、版本、字段与 URL 校验 |
| Repository | 事务、修订、审计、幂等和游标 |
| MCP | initialize、tools/list、严格 input schema、七工具生命周期 |
| OAuth | issuer、audience、signature、expiry、algorithms、scope、origin |
| Migration | 固定 migration、hash、journal、Production guard |
| Build | Astro check 与 Vercel server bundle |

仓库命令：

```bash
pnpm run test
pnpm run test:mcp
pnpm run test:integration
pnpm run db:check
pnpm run check
pnpm run build
```

Integration 只能连接明确隔离的测试数据库，不能把 Production 当测试数据库。

### 7.2 Production canary

检查 protected-resource metadata：

```bash
curl https://feeds.idaibin.dev/.well-known/oauth-protected-resource
```

当前应包含：

```json
{
  "resource": "https://feeds.idaibin.dev/api/mcp",
  "authorization_servers": ["https://idaibin.jp.auth0.com/"],
  "scopes_supported": [
    "feeds:read",
    "feeds:write",
    "feeds:publish",
    "feeds:archive"
  ]
}
```

使用正确 MCP 请求头但不带 token，应返回 `401`，并包含：

```text
WWW-Authenticate: Bearer resource_metadata="https://feeds.idaibin.dev/.well-known/oauth-protected-resource", scope="feeds:read feeds:write feeds:publish feeds:archive"
```

还应验证：

- 首页与分类页正常；
- 一次性 bootstrap 状态文件已回到 404；
- Vercel 不再存在 owner/direct 和 bootstrap 环境变量；
- 有效 token 可以读取；
- 非法 issuer、audience、签名、过期 token 或 scope 被拒绝；
- 写 canary 记录 Feed ID、version 和 audit ID，但不记录凭据。

## 八、真实问题与处理

### `invalid_request: no connections enabled for the client`

ChatGPT CIMD 是第三方客户端，但 Auth0 没有可供第三方客户端使用的 Domain Level Connection。将 Database 或 Social Connection 提升到 Domain Level 后重新授权。

### 用户列表为空

Auth0 Dashboard 管理员不是应用用户。Database Connection 需要创建用户；Google Social Connection 会在首次登录后自动创建用户。

### `insufficient_scope`

同时检查 client grant、用户角色、API permission 和实际 token 的 `scope`。RBAC 的 `permissions` claim 不能替代 OAuth `scope`。

### 请求 MCP 得到 `403 Cross-site POST form submissions are forbidden`

这是请求格式不符合 MCP Streamable HTTP，不代表 OAuth 故障。POST canary 必须使用 JSON body，并带：

```text
Content-Type: application/json
Accept: application/json, text/event-stream
```

### Auth0 metadata 看不到自定义 scopes

不要用 Auth0 authorization-server metadata 判断 Feeds Hub API permission。自定义 resource scopes 以 Auth0 API 配置、access token 和 Feeds Hub protected-resource metadata 为准。

### ChatGPT 只显示三个工具

先检查服务端 `FEED_WRITES_ENABLED` 和 protected-resource metadata。如果服务端已公布四个 scopes、代码已注册七个工具，而 ChatGPT Pro 仍只显示读取工具，这是 ChatGPT 套餐限制，不是 CIMD 或 Auth0 故障。

OpenAI 当前说明：Pro 可以在 Developer Mode 连接 read/fetch MCP；完整 write/modify MCP 仅面向 Business、Enterprise 和 Edu。

## 九、安全边界

- MCP 输入不接受 SQL、shell、文件路径或物理删除指令。
- Production OAuth token 验证 issuer、audience、signature、algorithm、expiration 和 scope。
- 数据库运行时角色不拥有 schema，不具备 DDL、DELETE、TRUNCATE、REFERENCES 或 TRIGGER 权限。
- 写入同时受 OAuth scope、MCP tool guard、FeedService 和数据库 grant 约束。
- 所有 mutation 使用幂等键、乐观锁和 append-only audit。
- 日志、截图、文档和 MCP 输出不得包含数据库 URL、token、authorization code、refresh token 或 Client Secret。
- 写工具不能伪装成 read-only tool 来绕过 ChatGPT 安全限制。

## 十、接下来怎么自动更新新闻

MCP 数据层已完成，但新闻发现与生成仍有三条路径：

1. **Codex 调用服务端写入链路**：适合人工或 Codex 自动任务。
2. **继续更新 GitHub Markdown**：可靠的归档与回滚路径。
3. **实现 Vercel Cron Agent**：最终自动化方向。

Vercel Cron Agent 建议采用：

```text
Cron
  -> 遍历 topic YAML
  -> 官方 API / RSS /赛事官网获取候选
  -> AI Gateway Web Search 补充发现
  -> 结构化提取和多来源核实
  -> duplicate check
  -> save draft
  -> validation
  -> publish
  -> execution log
```

Vercel 只负责定时触发和运行代码，不会自动搜索新闻。搜索需要来源 adapter、搜索 API 或支持 Web Search 的模型；AI 总结也需要显式接入模型和费用控制。

## 十一、Blog 同步建议

本文件是仓库内运维和实现真相源。同步到 Blog 时建议改写为“给 Remote MCP 接入 Auth0 OAuth 的完整复盘”，重点保留：

- ChatGPT、Auth0、Vercel、Neon 四方职责；
- protected resource、authorization server、CIMD、Domain Level Connection、client grant、RBAC 的区别；
- 为什么先只读、再数据库、最后写入；
- Vercel 自动 bootstrap 如何解决远程操作者没有本机凭据的问题；
- ChatGPT Pro 最终只显示读取工具这一产品边界；
- `no connections enabled for the client`、CIMD warning、scope metadata 混淆等真实问题。

公开文章应将个人 Tenant Domain、项目 ID、deployment ID、backup branch、用户信息和所有凭据替换成占位值。

## 参考资料

- [OpenAI：Developer mode and MCP apps in ChatGPT](https://help.openai.com/en/articles/12584461-developer-mode-and-full-mcp-connectors-in-chatgpt-beta)
- [Auth0：Register Applications with CIMD](https://auth0.com/docs/get-started/auth0-overview/create-applications/register-applications-with-cimd)
- [Auth0：Third-Party Applications](https://auth0.com/docs/get-started/applications/third-party-applications)
- [Auth0：Promote Connections to Domain Level](https://auth0.com/docs/authenticate/identity-providers/promote-connections-to-domain-level)
- [Vercel：Cron Jobs](https://vercel.com/docs/cron-jobs)
- [Vercel：AI Gateway](https://vercel.com/docs/ai-gateway)

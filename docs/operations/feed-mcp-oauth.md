# Feeds Hub MCP OAuth

完整的设计、开发、Auth0/CIMD/RBAC 操作、Vercel/Neon 部署、验证证据与 ChatGPT 套餐限制，见 [`feed-mcp-auth0-chatgpt-setup.md`](feed-mcp-auth0-chatgpt-setup.md)。本文件只保留协议和配置契约。

## Current Production state

截至 2026-07-11，Production 使用 Neon database reads，服务端写入与 MCP 已开启，protected-resource metadata 公布 `feeds:read`、`feeds:write`、`feeds:publish`、`feeds:archive`。服务端可注册七个工具；ChatGPT Pro 根据产品边界只展示 read/fetch 工具，完整 write/modify MCP 需要 Business、Enterprise 或 Edu。

## Boundary

`feeds-hub` is an OAuth 2.1 protected resource, not an authorization server. An external OAuth/OIDC provider owns login, consent, authorization codes, PKCE, client registration and token issuance. The Astro/Vercel application validates signed JWT access tokens and enforces per-tool scopes.

Production does not use the legacy `FEED_MCP_TOKEN`. Never put access tokens, client secrets or database URLs in the repository, ChatGPT app description, logs or MCP tool output.

## Provider contract

The provider must expose OAuth 2.0 Authorization Server Metadata or OpenID Connect Discovery and support:

- authorization code flow with PKCE S256;
- JWT access tokens signed by a published JWKS key;
- exact issuer validation;
- the resource/audience `https://feeds.idaibin.dev/api/mcp`;
- scopes `feeds:read`, `feeds:write`, `feeds:publish`, `feeds:archive`;
- one ChatGPT-compatible registration path: client-ID metadata documents, dynamic client registration, or a pre-created static OAuth client.

Create the API/resource in the provider first. For an initial read-only canary, grant only `feeds:read`. When `FEED_WRITES_ENABLED=false`, protected-resource metadata and `tools/list` expose only the read scope and three read tools.

## Local service

Put provider values in the untracked `.env.local`:

```text
FEED_MCP_ENABLED=true
FEED_MCP_AUTH_MODE=oauth
FEED_MCP_OAUTH_ISSUER=https://<provider-issuer>
FEED_MCP_OAUTH_RESOURCE=http://127.0.0.1:4321/api/mcp
FEED_MCP_OAUTH_AUDIENCE=http://127.0.0.1:4321/api/mcp
FEED_MCP_OAUTH_JWKS_URL=https://<provider-jwks>
FEED_MCP_OAUTH_ALGORITHMS=RS256
FEED_MCP_OAUTH_REQUIRED_SCOPES=feeds:read
FEED_READ_SOURCE=content
FEED_WRITES_ENABLED=false
```

The provider must issue the local audience for local testing. Start Astro:

```bash
pnpm run dev -- --host 127.0.0.1 --port 4321
```

ChatGPT cannot connect directly to localhost. Use a reviewed HTTPS tunnel for local testing, or deploy the same reviewed commit to Vercel.

## Vercel Production

The first read-only canary used this fail-closed configuration:

```text
FEED_MCP_ENABLED=true
FEED_MCP_AUTH_MODE=oauth
FEED_MCP_OAUTH_ISSUER=https://<provider-issuer>
FEED_MCP_OAUTH_RESOURCE=https://feeds.idaibin.dev/api/mcp
FEED_MCP_OAUTH_AUDIENCE=https://feeds.idaibin.dev/api/mcp
FEED_MCP_OAUTH_JWKS_URL=https://<provider-jwks>
FEED_MCP_OAUTH_ALGORITHMS=RS256
FEED_MCP_OAUTH_REQUIRED_SCOPES=feeds:read
FEED_MCP_ALLOWED_ORIGINS=https://chatgpt.com
FEED_WRITES_ENABLED=false
```

After the separately reviewed database and write cutover, current Production uses:

```text
FEED_MCP_ENABLED=true
FEED_MCP_AUTH_MODE=oauth
FEED_MCP_OAUTH_ISSUER=https://idaibin.jp.auth0.com/
FEED_MCP_OAUTH_RESOURCE=https://feeds.idaibin.dev/api/mcp
FEED_MCP_OAUTH_AUDIENCE=https://feeds.idaibin.dev/api/mcp
FEED_MCP_OAUTH_JWKS_URL=https://idaibin.jp.auth0.com/.well-known/jwks.json
FEED_MCP_OAUTH_ALGORITHMS=RS256
FEED_MCP_OAUTH_REQUIRED_SCOPES=feeds:read feeds:write feeds:publish feeds:archive
FEED_MCP_ALLOWED_ORIGINS=https://chatgpt.com
FEED_READ_SOURCE=database
FEED_WRITES_ENABLED=true
```

Keep `FEED_READ_SOURCE` at the currently reviewed source. Do not enable MCP until all OAuth values exist and the provider issues a token with the exact audience. Deploy under the Production cutover runbook.

Verify without recording credentials:

1. `GET https://feeds.idaibin.dev/.well-known/oauth-protected-resource` returns the canonical resource, issuer and scopes.
2. An unauthenticated `POST /api/mcp` returns `401` and a `WWW-Authenticate` header containing `resource_metadata`.
3. A valid `feeds:read` token initializes MCP and can call the three read tools.
4. A token with the wrong issuer, audience, signature or expiry returns `401`.
5. During the read-only canary, mutation tools are not advertised while `FEED_WRITES_ENABLED=false`.
6. After write cutover, a reviewed client with all four scopes can list and invoke all seven tools; the service write kill switch and database grants remain independent enforcement layers.

## ChatGPT Developer Mode

1. In ChatGPT web, enable Developer Mode under **Settings → Apps → Advanced settings**.
2. Open **Settings → Apps → Create** and create a custom app.
3. Set the MCP URL to `https://feeds.idaibin.dev/api/mcp`.
4. Select OAuth authentication. With Auth0 CIMD, import the client metadata URL shown by ChatGPT through **Auth0 → Applications → Applications → Create Application → Import from URL**, then grant that client `feeds:read` access to this API.
5. Complete login and consent, open a new chat, select the app from **More**, and call `list_feeds` first.
6. After MCP tool or scope changes, use **Refresh** in the app configuration and reconnect OAuth.

ChatGPT App 初次接入仍建议从 `feeds:read` 开始。当前 Production 已完成独立的数据库写入切换，但客户端最终可见能力仍受客户端套餐和 workspace action controls 约束；扩大 Auth0 scope 不会绕过这些限制。

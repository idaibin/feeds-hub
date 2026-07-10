# Feeds Hub MCP OAuth

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

Set server-only Production variables:

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

Keep `FEED_READ_SOURCE` at the currently reviewed source. Do not enable MCP until all OAuth values exist and the provider issues a token with the exact audience. Deploy only from `main` under the Production cutover runbook.

Verify without recording credentials:

1. `GET https://feeds.idaibin.dev/.well-known/oauth-protected-resource` returns the canonical resource, issuer and scopes.
2. An unauthenticated `POST /api/mcp` returns `401` and a `WWW-Authenticate` header containing `resource_metadata`.
3. A valid `feeds:read` token initializes MCP and can call the three read tools.
4. A token with the wrong issuer, audience, signature or expiry returns `401`.
5. Mutation tools are not advertised while `FEED_WRITES_ENABLED=false`; the service write kill switch remains a second enforcement layer.

## ChatGPT Developer Mode

1. In ChatGPT web, enable Developer Mode under **Settings → Apps → Advanced settings**.
2. Open **Settings → Apps → Create** and create a custom app.
3. Set the MCP URL to `https://feeds.idaibin.dev/api/mcp`.
4. Select OAuth authentication. With Auth0 CIMD, import the client metadata URL shown by ChatGPT through **Auth0 → Applications → Applications → Create Application → Import from URL**, then grant that client `feeds:read` access to this API.
5. Complete login and consent, open a new chat, select the app from **More**, and call `list_feeds` first.
6. After MCP tool or scope changes, use **Refresh** in the app configuration and reconnect OAuth.

The initial ChatGPT app is read-only. Enabling database writes, setting `FEED_MCP_OAUTH_REQUIRED_SCOPES` to the reviewed write-scope set, granting those OAuth scopes and setting `FEED_WRITES_ENABLED=true` is a separate reviewed Production change.

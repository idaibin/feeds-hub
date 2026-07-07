# Realtime Type Rules

实时信息规则，供 `flows: [realtime]` 或 `type: realtime` 的 topic 引用。目标是从公开、可核验来源获取最新重要事实，压缩为一条清晰 feed。

## Scope

- 适用于 AI、github、compute、rust、dev、security、product，以及 stock 的普通实时市场事件；global 仅在任务明确要求时启用。
- 1 feed = 1 release, policy event, company update, advisory, incident, product change, market-moving fact, or other bounded event.
- 优先文本事实；海报是可选增强，不阻塞 Markdown 写入。

## Source Rules

- Hard facts must come from topic-configured primary or secondary sources.
- Reddit、X、社区和论坛只能作为反应、背景、情绪、接受度或讨论热度来源，不能确认硬事实。
- Official X posts may be used only as official statements when the account is verified or clearly official and the URL is recorded.
- If the configured sources cannot confirm the event, skip the item; do not expand to unrelated sources just to fill quota.

## Discovery And Freshness

- Each topic must be checked every run and reported as added, skipped, or pending-source.
- Prefer the newest verifiable event in the task window over old evergreen context.
- Do not rewrite an existing item unless there is a new source-backed state change, version, policy decision, filing, disclosure, or availability update.
- Default cap is 1 to 3 high-quality items per topic unless another type rule overrides it.
- Default focus topics are `worldcup`, `lol`, `ai`, `github`, and `stock`; non-focus realtime topics should be reported as skipped unless explicitly requested.

## GitHub Repository Signals

- GitHub repository items must identify owner/name, repository URL, observed state, event type, and developer relevance.
- Priority signals include sharp star growth, trending rank, AI-related project adoption, important releases, security advisories, and major maintainer updates.
- AI-related repositories take priority over general-purpose repositories when both are available.
- GitHub Search/API/Trending, repository pages, releases, tags, advisories, README, changelog, and official project docs are valid hard sources.
- Third-party trending lists, Reddit, Hacker News, and X may guide discovery or reaction context, but cannot be the only hard source for stars, releases, advisories, or repository facts.

## AI Skills And Techniques

- AI technique items must point to a verifiable artifact such as official docs, cookbook, model page, product page, GitHub repository, release note, paper, or maintainer explanation.
- The body must state the concrete workflow or capability, where it applies, and what remains unsupported or unverified.
- Do not publish generic prompt advice, unverifiable tips, or social-media-only tactics.

## Event Key And Deduplication

- `eventKey` combines topic id, kind, entity, event type, and date/version/advisory/release identifier when available.
- `sourceUrl` is supporting evidence, not the hard dedupe key.
- Skip only when the same entity, event type, source-backed state, and date/version/advisory/release identifier already exist.
- A proposal becoming official, preview becoming generally available, advisory becoming patched, or release candidate becoming stable is a new state.

## Body Format

- First paragraph: verified fact, actor, action, time, and version/status.
- Second paragraph: current availability, affected scope, market/user/developer impact, migration requirement, policy scope, or unresolved detail.
- Optional third paragraph: conflicting fact status or what remains unconfirmed; do not name the source unless the source itself is the subject.
- Title, summary, subtitle, and first paragraph must not be near-duplicates; if no non-duplicative summary exists, leave summary for display filtering instead of rewriting the title.
- No predictions, hype, investment advice, unsupported benchmark claims, or social reaction as fact.

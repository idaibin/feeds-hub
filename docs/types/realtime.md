# Realtime Type Rules

实时信息规则，供 `flows: [realtime]` 或 `type: realtime` 的 topic 引用。目标是从公开、可核验来源获取最新重要事实，压缩为一条清晰 feed。

## Scope

- 适用于 AI、compute、global、rust、dev、security、product，以及 stock 的普通实时市场事件。
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

## Event Key And Deduplication

- `eventKey` combines topic id, kind, entity, event type, and date/version/advisory/release identifier when available.
- `sourceUrl` is supporting evidence, not the hard dedupe key.
- Skip only when the same entity, event type, source-backed state, and date/version/advisory/release identifier already exist.
- A proposal becoming official, preview becoming generally available, advisory becoming patched, or release candidate becoming stable is a new state.

## Body Format

- First paragraph: verified fact, actor, action, time, and version/status.
- Second paragraph: current availability, affected scope, market/user/developer impact, migration requirement, policy scope, or unresolved detail.
- Optional third paragraph: conflicting fact status or what remains unconfirmed; do not name the source unless the source itself is the subject.
- No predictions, hype, investment advice, unsupported benchmark claims, or social reaction as fact.

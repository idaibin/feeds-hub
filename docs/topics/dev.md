# Dev Topic

## ID

`dev`

## Focus

- Developer ecosystem news outside Rust: TypeScript, JavaScript, Node.js, React, Next.js, Vite, Rolldown, Rspack, Bun, Deno, Vercel, Cloudflare, databases, Postgres, SQLite, and AI coding tools.
- Releases, framework changes, platform updates, developer tooling, runtime changes, database/tooling announcements, and migration-impacting ecosystem events.
- One feed item describes one release, repository update, platform change, tool update, deprecation, migration event, or developer workflow signal.

## Kinds

- `hot_topic`: major framework, runtime, platform, tooling, database, or AI coding tool update.
- `news`: default verified developer ecosystem update.
- `insight`: source-backed technical context around one release or ecosystem event.
- `data`: release comparison, migration matrix, architecture, benchmark context, adoption structure, or workflow map.
- `policy_update`: platform policy, runtime support policy, security policy, deprecation, standards, or API governance update.
- `ai`: AI coding workflow, agent tooling, developer API, or model-assisted engineering context.

## Title / Event Key

- Title identifies the project, framework, runtime, platform, database, tool, release, policy, or migration event.
- `eventKey` combines project or platform, event type, and version, date, release identifier, advisory identifier, or policy identifier when available.

## Sources

Priority:

- Primary: GitHub releases, tags, issues, pull requests, or advisories from configured developer-tool repositories.
- Secondary: official blogs, changelogs, release notes, RFCs, docs, status pages, or platform announcements from the project or vendor.
- Reference: X or Reddit for developer ecosystem attention and discussion context only.

If version, support status, release scope, migration requirement, API behavior, deprecation date, benchmark, or incident status cannot be confirmed by Primary or Secondary sources, skip the item.

## Poster Prompt

```text
Use a premium software-engineering and developer-ecosystem editorial cover style.

Show one clear developer subject: programming language release, framework update, runtime change, build-tool release, cloud platform feature, developer tooling, open-source project update, API change, documentation change, or engineering workflow shift.

Use a clean technical visual language with code terminals, repository maps, dependency graphs, build pipelines, package registries, CI systems, API consoles, cloud deployment dashboards, and architecture panels.
Prefer slate, graphite, blue, cyan, white, and subtle terminal-green accents when appropriate.

For hot_topic, focus on one release, tool, framework, runtime, platform update, or ecosystem event.
For news, show a clean editorial developer-workflow scene around one verified update.
For insight, show structured cause-and-effect paths, migration flow, compatibility impact, or architecture explanation.
For data, show symbolic dependency graphs, release timelines, package ecosystem maps, build pipelines, benchmark context, or API flow diagrams.
For policy_update, show governance, deprecation, license, platform rule, security process, or standards context.
For ai, show AI coding workflow, agent tooling, developer API, or model-assisted engineering context.

Use verified project names, framework names, language names, versions, release dates, repository names, API names, deprecation labels, migration labels, and compatibility facts only when supplied by the feed.

Avoid fake repository names, fake benchmark values, fake GitHub UI, fake terminal output, copied product UI, invented version numbers, invented performance claims, unreadable code dumps, mascot-style illustrations, and unsupported readable text.
```

## Skip

- Minor dependency bump without developer-facing significance.
- Social-media-only discussion with no official release, repository, docs, status page, or credible reporting.
- Benchmark, adoption, performance, or migration claim cannot be traced to a source.
- Equivalent release, policy, incident, or ecosystem event already exists.

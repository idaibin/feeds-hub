# Rust Topic

## ID

`rust`

## Focus

- Rust language, tooling, crates, compiler, ecosystem, open-source infrastructure, developer tools, and migration stories.
- Releases, RFCs, security advisories, ecosystem reports, benchmark-significant projects, and production adoption with concrete evidence.
- One feed item describes one release, project update, advisory, proposal, or engineering event.

## Kinds

- `hot_topic`: release, RFC, crate, toolchain, ecosystem or adoption event.
- `policy_update`: security advisory, governance, language policy, standards or project process.
- `data`: dependency graph, migration structure, build pipeline, benchmark context, architecture.
- `news` / `breaking` / `insight`: default Rust ecosystem news or source-backed technical context.

## Title / Event Key

- Title identifies the crate, project, tool, advisory, RFC, release, repository, or ecosystem event.
- `eventKey` includes repository/project, event type, and version/date when available.

## Sources

Priority:

- Primary: Rust Blog, Rust release notes, and Rust project team announcements.
- Secondary: GitHub releases, crates.io, docs.rs, maintainer changelogs, or RustSec advisories.
- Reference: X or Reddit for Rust ecosystem attention and discussion context only.

If version, advisory, RFC status, release scope, or migration requirement cannot be confirmed by Primary or Secondary sources, skip the item.

## Poster Prompt

```text
Use an open-source engineering editorial cover for a mobile-first news card, with code terminals, dependency graphs, compiler pipelines, package registry context, CI/build systems, repository maps, or security advisory review scenes.
For hot_topic, focus on one release, RFC, crate, toolchain, ecosystem update, or adoption event. For policy_update, show advisory boards, security review tables, language governance, or standards/process context. For data, show symbolic build pipelines, dependency graphs, architecture panels, or benchmark context without invented numbers.
Keep the visual technical, precise, practical, and grounded in developer workflow. Use verified project names, crate names, versions, advisory identifiers, RFC numbers, release dates, and repository names only when supplied by the feed.
Avoid fake Rust logos, mascot-style illustrations, fake repository names, invented benchmark values, generic hacker imagery, unreadable code dumps, and overstated safety or performance claims.
```

## Skip

- Minor dependency bump without user-facing or ecosystem significance.
- Claim cannot be traced to code, release notes, maintainer docs, or advisory.
- Adoption, performance, or safety is overstated beyond evidence.
- Equivalent release, RFC, or advisory already exists.

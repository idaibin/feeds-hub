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

Prefer:

1. Rust official blog, release notes, RFC repository, crates.io, docs.rs, GitHub releases, and security advisories.
2. Maintainer blogs or project documentation.
3. Established engineering publications when they link to primary technical evidence.

## Poster Prompt

```text
Use an open-source engineering editorial style.
Show code terminals, dependency graphs, compiler pipelines, package registries, CI/build systems, repository maps, or security advisory context.
Keep the image technical, precise, and practical.
Avoid fake Rust logos, fake repository names, invented benchmark values, mascot-style illustrations, or generic hacker imagery.
```

## Skip

- Minor dependency bump without user-facing or ecosystem significance.
- Claim cannot be traced to code, release notes, maintainer docs, or advisory.
- Adoption, performance, or safety is overstated beyond evidence.
- Equivalent release, RFC, or advisory already exists.

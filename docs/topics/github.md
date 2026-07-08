---
id: github
type: realtime
flows:
  - realtime
sources:
  primary:
    - GitHub Search
    - GitHub API
    - GitHub Trending
    - GitHub releases
    - GitHub tags
    - GitHub advisories
  secondary:
    - repository README
    - repository changelog
    - official project docs
    - official project blog
    - maintainer release notes
  supplemental:
    - Reddit
    - Hacker News
    - official X
contentDir: src/content/github/
allowedKinds:
  - hot_topic
  - news
  - insight
  - data
  - breaking
  - policy_update
  - ai
---

# GitHub Topic

Uses `docs/types/realtime.md`.

## Scope

Daily technical report for yesterday's trending repository or sharp star-growth repository. AI-related open source is preferred.

## Overrides

- Prefer AI, agents, model tooling, dev workflow, infrastructure, security, and frameworks.
- Write at most 1 GitHub feed per Beijing calendar day.
- Default target is yesterday. If yesterday's data is incomplete, report `skipped: source-lag` rather than using today's ranking.
- Star growth needs GitHub Search/API/Trending, visible repo count with timestamp, or other verifiable public source.
- Include owner/name, repo URL, language/stack, ranking or star/growth evidence, observed state, and developer relevance.
- The body must explain the technical content: what the repo does, why developers care, and what changed or gained attention.
- Use `source: GitHub` unless the hard fact comes from an official non-GitHub project page.

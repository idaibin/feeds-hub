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

Trending repos, sharp star growth, releases, advisories, and AI-related open source.

## Overrides

- Prefer AI, agents, model tooling, dev workflow, infrastructure, security, and frameworks.
- Star growth needs GitHub Search/API/Trending, visible repo count with timestamp, or other verifiable public source.
- Include owner/name, repo URL, event type, observed state, and developer relevance.
- Use `source: GitHub` unless the hard fact comes from an official non-GitHub project page.

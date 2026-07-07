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
coverPrefix: /images/github/
allowedKinds:
  - hot_topic
  - news
  - insight
  - data
  - breaking
  - policy_update
  - ai
---

# GitHub Topic Config

Uses `docs/types/realtime.md`; focuses on trending repositories, sharp star growth, important releases, security advisories, and AI-related open-source projects first.

## Topic Overrides

- Prefer AI, agent, model tooling, developer workflow, infrastructure, security, and framework repositories when multiple candidates qualify.
- Star growth must be supported by GitHub Search/API, GitHub Trending, a repository-visible count with timestamp, or another verifiable public source. Third-party lists may guide discovery but cannot be the only hard source.
- A repository item must identify the owner/name, repository URL, event type, observed star/release/advisory state, and why it matters to developers.
- `source` should be `GitHub` unless the hard fact comes from an official project page outside GitHub.

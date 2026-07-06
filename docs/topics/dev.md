---
id: dev
type: realtime
flows:
  - realtime
sources:
  primary:
    - GitHub releases
    - GitHub tags
    - GitHub issues
    - GitHub pull requests
    - GitHub advisories
  secondary:
    - official blogs
    - changelogs
    - release notes
    - RFCs
    - docs
    - status pages
    - platform announcements
  supplemental: []
contentDir: src/content/dev/
coverPrefix: /images/dev/
allowedKinds:
  - hot_topic
  - news
  - insight
  - data
  - policy_update
  - ai
---

# Dev Topic Config

Uses `docs/types/realtime.md`; covers developer ecosystem news outside Rust.

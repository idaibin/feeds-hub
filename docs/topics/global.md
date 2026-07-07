---
id: global
type: realtime
flows:
  - realtime
sources:
  primary:
    - Reuters
  secondary:
    - official government sources
    - court publications
    - regulator publications
    - UN agency publications
    - ministry publications
    - emergency-management publications
    - public-health publications
    - meteorological publications
    - election publications
    - treaty publications
    - sanctions publications
  supplemental: []
contentDir: src/content/global/
coverPrefix: /images/global/
allowedKinds:
  - policy_update
  - breaking
  - hot_topic
  - data
  - news
  - insight
---

# Global Topic Config

Uses `docs/types/realtime.md`; covers high-signal global events with official or Reuters confirmation.

## Topic Overrides

- This topic is retained for historical content and route compatibility.
- Default automation must skip this topic and report `skipped: disabled-by-focus`.
- Re-enable only when the task explicitly expands focus beyond worldcup, lol, ai, github, and stock.

---
id: security
type: realtime
flows:
  - realtime
sources:
  primary:
    - GitHub Security Advisory
  secondary:
    - CISA KEV
    - NVD
    - official vendor advisories
  supplemental: []
contentDir: src/content/security/
allowedKinds:
  - breaking
  - policy_update
  - data
  - insight
  - news
  - hot_topic
---

# Security Topic

Uses `docs/types/realtime.md`; only defensive advisory, impact, mitigation, and ecosystem-risk information is allowed.

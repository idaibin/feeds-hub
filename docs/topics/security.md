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
coverPrefix: /images/security/
allowedKinds:
  - breaking
  - policy_update
  - data
  - insight
  - news
  - hot_topic
---

# Security Topic Config

Uses `docs/types/realtime.md`; only defensive advisory, impact, mitigation, and ecosystem-risk information is allowed.

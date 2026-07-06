---
id: worldcup
type: sports
flows:
  - sports
sources:
  primary:
    - FIFA
  secondary:
    - Reuters
  supplemental:
    - 虎扑网
contentDir: src/content/worldcup/
coverPrefix: /images/worldcup/
allowedKinds:
  - match_schedule
  - match_flow
  - match_result
  - player_spotlight
  - knockout_update
  - worldcup_feed
  - data
  - hot_topic
  - news
---

# World Cup Topic Config

Uses `docs/types/sports.md`; FIFA is the source of truth for schedule, score, venue, bracket, advancement, and official match facts.

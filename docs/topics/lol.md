---
id: lol
type: sports
flows:
  - sports
sources:
  primary:
    - LoL Esports
  secondary:
    - Riot Games
    - official tournament pages
    - embedded official match data
    - official Riot/LoL Esports statements
  supplemental:
    - 虎扑网
contentDir: src/content/lol/
coverPrefix: /images/lol/
allowedKinds:
  - match_schedule
  - match_flow
  - match_result
  - player_spotlight
  - knockout_update
  - data
  - hot_topic
  - news
---

# LOL Topic Config

Uses `docs/types/sports.md`; LoL Esports is the source of truth for schedule, score, state, bracket, winner, roster, and next-round relationships.

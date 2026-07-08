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

# World Cup Topic

Uses `docs/types/sports.md`; FIFA is source of truth.

## Scope

FIFA World Cup 2026 match states, bracket movement, official operations, verified availability, and bounded tournament reporting.

## Overrides

- Window: 2026-06-11 to 2026-07-19.
- Schedule: https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/articles/match-schedule-fixtures-results-teams-stadiums
- Results: https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/scores-fixtures
- Standings/bracket: https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/standings
- Review previous 36 hours, current day, next 48 hours in venue timezone before non-match stories.
- Results require score, winner, loser, advancement/elimination, next opponent if available.

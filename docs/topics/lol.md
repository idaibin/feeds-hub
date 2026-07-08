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

# LOL Topic

Uses `docs/types/sports.md`; LoL Esports is source of truth.

## Scope

League of Legends esports match states, MSI/Worlds/First Stand bracket movement, verified roster/rule changes, and Riot tournament operations.

## Overrides

- Active event: MSI 2026, Daejeon, 2026-06-28 to 2026-07-12.
- Schedule: https://lolesports.com/en-GB/leagues/first_stand%2Cmsi%2Cworlds
- Update: https://lolesports.com/en-GB/news/msi-and-worlds-updates
- During MSI inspect embedded data: `id`, `state`, `matchTeams`, `gameWins`, `outcome`, `destinations`, `startTime`, stage, format.
- `match_schedule` must copy the official `startTime` into subtitle, summary and first paragraph, converted to Beijing time for Chinese display copy; do not publish a date-only schedule when official time is available.
- Review previous 36 hours, current day, next 48 hours in Beijing time.
- For every MSI match in that review window, compare official `state`, `startTime`, `matchTeams`, `gameWins`, `outcome`, and `destinations` against existing feeds before writing any lower-priority LoL story.
- If official `startTime` has passed, a schedule-only feed is insufficient; write `match_flow` or `match_result` when official data supports it.
- Existing schedule feeds, shared LoL Esports schedule URLs, shared stage pages, or same-day LoL feeds cannot mark a started or completed match as covered.
- Results require series score, winner, loser, bracket destination, elimination/lower-bracket drop, next opponent if available.

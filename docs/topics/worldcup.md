# World Cup Topic

## ID

`worldcup`

## Focus

- FIFA World Cup matches, schedules, results, qualification context, knockout paths, host-city notes, and single-match storylines.
- Match status updates for completed, live/in-progress, and upcoming matches within the task window.
- One feed item describes one match, one player story, or one clearly bounded tournament event.

## Kinds

- `match_schedule`: upcoming match, kickoff, stage, fixture.
- `match_flow`: in-progress state, official live timeline, key phase, or verified match development.
- `match_result`: completed match, confirmed score, advancement, elimination.
- `player_spotlight`: single player story or official player-related update.
- `knockout_update`: bracket, advancement path, next round, elimination stage.
- `worldcup_feed`: same-day or same-stage structured World Cup summary.
- `data`: standings, bracket, ranking, path, timeline.
- `hot_topic` / `news`: single bounded tournament storyline.

## Match Coverage

For match-driven updates, write the current verified state and avoid duplicate `eventKey`:

- Preview: upcoming fixture, kickoff, stage, venue or conditions.
- Flow: in-progress status, official timeline, key phase or confirmed match development.
- Result: completed score, advancement, elimination or next-round status.

Do not force all three states for one match in one run.

## Title / Event Key

- Title names teams, match stage, result, kickoff, player story, or tournament event.
- `eventKey` uses stable match ID when available; otherwise teams plus kickoff or event time.

## Sources

Prefer:

1. FIFA official match center, schedule, or match report.
2. Reliable sports data sources.
3. Reuters, AP, ESPN, The Guardian, BBC Sport, or established sports reporting.

## Poster Prompt

```text
Use a premium football editorial poster style.
Show cinematic stadium lights, pitch texture, matchday atmosphere, national color cues, structured bracket or scoreboard energy, and clear tournament hierarchy.
Use verified team names, scores, kickoff times, stages, and advancement facts only when supplied by the feed.
Avoid fake FIFA marks, team crests, player face copies, betting language, odds boards, or forecast visuals.
```

## Skip

- No new match, schedule, result, or single-event update exists in the task window.
- Rumor, unsourced lineup speculation, or fan discussion.
- Sources conflict and final score, kickoff time, or match status cannot be verified.
- Equivalent match state already exists.

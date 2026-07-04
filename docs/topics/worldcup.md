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

Priority:

- Primary: FIFA official match center, schedule, or match report.
- Secondary: ESPN or BBC Sport for background, confirmed context, and match reporting.
- CN Reference: 懂球帝 or 央视体育 for Chinese expression and local attention reference.

If score, kickoff time, venue, bracket, or match status conflicts across Primary and Secondary, skip the item.

## Poster Prompt

```text
Use a premium football editorial cover for a mobile-first news card, with a realistic stadium atmosphere, cinematic floodlights, pitch texture, tunnel or touchline context, and abstract national color cues.
For match_schedule, show a clean fixture-board composition with two abstract team sides, stadium readiness, and anticipation without invented scores. For match_flow, show timeline panels, pressure zones, and verified match rhythm. For match_result, show a decisive post-match focal point with score or advancement only when supplied by the feed. For knockout_update, worldcup_feed, or data, use symbolic bracket, table, timeline, or stage hierarchy modules.
Keep readable text minimal and use only verified team names, scores, kickoff times, stages, venues, goal events, and advancement facts supplied by the feed.
Avoid fake FIFA marks, official tournament logos, team crests, copied player faces, invented flags, betting language, odds boards, forecast visuals, fake scoreboards, unsupported readable text, and reusable generic sports templates.
```

## Skip

- No new match, schedule, result, or single-event update exists in the task window.
- Rumor, unsourced lineup speculation, or fan discussion.
- Sources conflict and final score, kickoff time, or match status cannot be verified.
- Equivalent match state already exists.

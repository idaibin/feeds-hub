# World Cup Topic

## Topic ID

`worldcup`

## Focus

- FIFA World Cup matches, schedules, results, qualification context, knockout paths, host-city notes, and single-match storylines.
- Match status updates for completed matches, live or in-progress matches, and upcoming matches within the task window.
- One feed item must describe one match, one player story, or one clearly bounded tournament event.

## Output Format

- `category`: `worldcup`
- Preferred `kind`: `match_result`, `match_schedule`, or `hot_topic`
- Title should name the teams or the single event and the result, kickoff, or main development.
- Summary should state the confirmed fact, match stage, time, and immediate tournament impact.
- `eventKey` should use a stable match ID when available; otherwise use teams plus kickoff or event time.
- Cover should be a WebP match poster following `docs/rules/ui-spec.md`.

## Card Types

- `match_schedule`: upcoming match, kickoff, stage, fixture.
- `match_result`: completed match, confirmed score, advancement, elimination.
- `match_flow`: match timeline, turning point, live or completed match progression.
- `player_spotlight`: single player story or official player-related update.
- `knockout_update`: bracket, advancement path, next round, elimination stage.
- `worldcup_feed`: same-day or same-stage structured World Cup summary.
- `data`: standings, bracket, ranking, path, timeline.
- `hot_topic` / `news`: single bounded tournament storyline.

## Title Guidance

Title should name the teams, match stage, result, kickoff, player story, or tournament event.

## Sources

If this topic lists preferred sources, use them first. If not enough information is available there, search other public and verifiable sources. Every factual claim must be traceable. Prefer:

1. FIFA official match center, schedule, or match report.
2. Reliable sports data sources.
3. Reuters, AP, ESPN, The Guardian, BBC Sport, or other established sports reporting.

## Topic Poster Prompt

```text
Use a premium football editorial poster style.
Show cinematic stadium lights, pitch texture, matchday atmosphere, national color cues, structured bracket or scoreboard energy, and clear tournament hierarchy.
Use verified team names, scores, kickoff times, stages, and advancement facts only when supplied by the feed.
Avoid fake FIFA marks, team crests, player face copies, betting language, odds boards, or forecast visuals.
```

## Skip Conditions

- No new match, schedule, result, or single-event update exists in the task window.
- The only available information is rumor, unsourced lineup speculation, or fan discussion.
- Sources conflict and the final score, kickoff time, or match status cannot be verified.
- The same match state already exists as an equivalent feed item.

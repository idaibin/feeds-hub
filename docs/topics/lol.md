# LOL Topic

## ID

`lol`

## Focus

- League of Legends esports schedules, results, in-progress states, roster-impacting updates, tournament brackets, and official rules.
- LPL, MSI, Worlds, First Stand, regional leagues, and Riot tournament formats.
- One feed item describes one match, tournament event, roster fact, or official rules update.

## Kinds

- `match_schedule`: upcoming match, tournament stage, official schedule.
- `match_flow`: in-progress status, official timeline, ban-pick, verified key phase.
- `match_result`: completed match, advancement, elimination, confirmed result.
- `player_spotlight`: single player or role focus without copying real face or team assets.
- `knockout_update`: bracket, advancement path, elimination stage.
- `data`: standings, schedule table, tournament structure.
- `hot_topic` / `news`: roster, rules, league update, or single competitive storyline.

## Match Coverage

For match-driven updates, write the current verified state and avoid duplicate `eventKey`:

- Preview: upcoming fixture, tournament stage, patch context or official schedule.
- Flow: in-progress status, official timeline, ban-pick, map state or verified turning point.
- Result: completed score, advancement, elimination or next-match status.

Do not force all three states for one match in one run.

## Title / Event Key

- Title identifies league, tournament stage, teams, result, schedule, roster fact, or official update.
- `eventKey` combines tournament, teams/entity, event type, and event time.

## Sources

Prefer:

1. Riot Games official esports pages, LoL Esports schedule, or team announcements.
2. Leaguepedia or recognized esports data references for schedule and bracket verification.
3. Established esports reporting when it links to primary evidence.

## Poster Prompt

```text
Use a premium esports editorial poster style.
Show arena stage lighting, player stations, abstract team sides, bracket energy, tactical map mood, and neon blue/cyan competitive atmosphere.
Use verified team names, scores, stages, or times only when supplied by the feed.
Avoid copying champion art, Riot assets, team logos, broadcast graphics, real player faces, or fake scoreboards.
```

## Skip

- No official schedule, result, roster, bracket, or rules update can be verified.
- Scrim rumors, unsourced leaks, or social speculation.
- Same match or roster fact already exists.
- Multiple unrelated matches or teams are bundled into one item.

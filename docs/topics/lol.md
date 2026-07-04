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

Priority:

- Primary: LoL Esports, Riot Games official esports pages, or official league/tournament announcements.
- Secondary: Leaguepedia for schedule, bracket, roster, and result verification.
- CN Reference: 虎扑电竞 for Chinese expression and esports attention reference.

If schedule, bracket, roster, score, or match status conflicts across Primary and Secondary, skip the item.

## Poster Prompt

```text
Use a premium esports editorial cover for a mobile-first news card, with an arena stage, player stations, draft desk mood, tactical map abstraction, bracket energy, and deep slate with neon blue or cyan lighting.
For match_schedule, show a structured pre-match fixture composition with two abstract competitive sides and stage readiness. For match_flow, show ban-pick rhythm, map pressure, and verified turning-point panels without copying broadcast UI. For match_result, show decisive arena energy, advancement pressure, or elimination tone. For knockout_update or data, show symbolic bracket paths, standings modules, or schedule panels.
Use verified tournament names, team names, scores, stages, patch context, and times only when supplied by the feed.
Avoid champion art, Riot assets, team logos, broadcast graphics, real player faces, fake scoreboards, fake UI text, invented match data, and unrelated multi-match collages.
```

## Skip

- No official schedule, result, roster, bracket, or rules update can be verified.
- Scrim rumors, unsourced leaks, or social speculation.
- Same match or roster fact already exists.
- Multiple unrelated matches or teams are bundled into one item.

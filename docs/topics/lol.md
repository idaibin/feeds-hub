# LOL Topic

## Topic ID

`lol`

## Focus

- League of Legends esports schedules, results, roster-impacting updates, tournament brackets, and high-signal competitive storylines.
- LPL, MSI, Worlds, First Stand, regional leagues, and official Riot tournament formats.
- One feed item must describe one match, one tournament event, one roster fact, or one official rules update.

## Output Format

- `category`: `lol`
- Preferred `kind`: `match_result`, `match_schedule`, or `hot_topic`
- Title should identify the league, teams, tournament stage, or single official update.
- Summary should separate confirmed match facts from analysis or expectation.
- `eventKey` should combine tournament, teams or entity, event type, and event time.
- Cover should be a WebP esports poster following `docs/rules/ui-spec.md`.

## Card Types

- `match_schedule`: upcoming match, tournament stage, official schedule.
- `match_result`: completed match, advancement, elimination, confirmed result.
- `match_flow`: match timeline, ban-pick, turning-point structure.
- `player_spotlight`: single player or role focus, without copying real face or team assets.
- `knockout_update`: bracket, advancement path, elimination stage.
- `data`: standings, schedule table, tournament structure.
- `hot_topic` / `news`: roster, rules, league update, or single competitive storyline.

## Title Guidance

Title should identify the league, tournament stage, teams, result, schedule, roster fact, or official update.

## Sources

If this topic lists preferred sources, use them first. If not enough information is available there, search other public and verifiable sources. Every factual claim must be traceable. Prefer:

1. Riot Games official esports pages, LoL Esports schedule, or team announcements.
2. Leaguepedia or recognized esports data references for schedule and bracket verification.
3. Established esports reporting when it links to primary evidence.

## Topic Poster Prompt

```text
Use a premium esports editorial poster style.
Show arena stage lighting, player stations, abstract team sides, bracket energy, tactical map mood, and neon blue/cyan competitive atmosphere.
Use verified team names, scores, stages, or times only when supplied by the feed.
Avoid copying champion art, Riot assets, team logos, broadcast graphics, real player faces, or fake scoreboards.
```

## Skip Conditions

- No official schedule, result, roster, bracket, or rules update can be verified.
- The item depends only on scrim rumors, unsourced leaks, or social-media speculation.
- The same match or roster fact already exists in recent feed items.
- The story bundles multiple unrelated matches or teams into one item.

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
- Cover should be a WebP esports poster following `docs/ui-spec.md`.

## Sources

Sources are optional, but every factual claim must be traceable. Prefer:

1. Riot Games official esports pages, LoL Esports schedule, or team announcements.
2. Leaguepedia or recognized esports data references for schedule and bracket verification.
3. Established esports reporting when it links to primary evidence.

## Skip Conditions

- No official schedule, result, roster, bracket, or rules update can be verified.
- The item depends only on scrim rumors, unsourced leaks, or social-media speculation.
- The same match or roster fact already exists in recent feed items.
- The story bundles multiple unrelated matches or teams into one item.

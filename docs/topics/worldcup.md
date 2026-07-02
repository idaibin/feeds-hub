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
- Cover should be a WebP match poster following `docs/ui-spec.md`.

## Sources

Sources are optional, but every factual claim must be traceable. Prefer:

1. FIFA official match center, schedule, or match report.
2. Reliable sports data sources.
3. Reuters, AP, ESPN, The Guardian, BBC Sport, or other established sports reporting.

## Skip Conditions

- No new match, schedule, result, or single-event update exists in the task window.
- The only available information is rumor, unsourced lineup speculation, or fan discussion.
- Sources conflict and the final score, kickoff time, or match status cannot be verified.
- The same match state already exists as an equivalent feed item.

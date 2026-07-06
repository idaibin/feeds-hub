# Sports Type Rules

赛事类信息规则，供 `type: sports` 或 `flows: [sports]` 的 topic 引用。Topic 文件只声明来源、目录、kind 和少量特例，不重复完整状态机。

## Scope

- 适用于 `worldcup`、`lol` 和未来新增的赛事类 topic。
- 1 feed = 1 match state, 1 player story, 1 bracket/path update, or 1 clearly bounded tournament event.
- 官方赛事日先覆盖硬事实：赛程、进行中状态、赛果、晋级、淘汰、下一轮关系；完成后才写话题、热度或背景内容。

## Shared Kinds

- `match_schedule`: upcoming fixture, kickoff, stage, teams, official schedule, format when available.
- `match_flow`: live or in-progress state, official timeline, current score/state, verified key phase, pause/remake/postponement when available.
- `match_result`: completed match, confirmed score, winner, loser, advancement, elimination, next-match relationship, series/game detail when available.
- `player_spotlight`: one player or role update tied to a verified event.
- `knockout_update`: bracket, path, advancement, elimination stage, upper/lower bracket, final path, or next round.
- `data`: standings, schedule table, bracket, ranking, path, game record, or timeline.
- `hot_topic` / `news`: one bounded tournament storyline, rule update, roster-impacting item, or official competition update.

## Match State Progression

For each official match in the task window, check whether the latest official state is scheduled, live, final, postponed, cancelled, remake, walkover, or otherwise official.

- `match_schedule` may be followed later by `match_flow`.
- `match_schedule` or `match_flow` may be followed later by `match_result`.
- A completed official match should produce `match_result` even if a previous `match_schedule` feed already exists.
- A bracket-changing result may also produce a separate `knockout_update` when the path, next opponent, elimination, or final route is the main event.
- Do not force all states in one run; do not skip a newer verified state because an older state already exists.

## Required Facts

For `match_schedule`, include when verified:

- tournament, stage, teams, kickoff time, venue/region if available, and format when relevant.
- next-round context only when the official page provides it.

For `match_flow`, include when verified:

- live/in-progress status, current total score or game state, current game/period/map when relevant, pause/remake/postponement state, and key turning point.
- do not infer a final winner from a live score.

For `match_result`, include when verified:

- final score.
- winner and loser.
- advancement, elimination, lower-bracket drop, next opponent, next match, or final path when official data provides it.
- game-by-game or period-by-period detail when available from official data.
- MVP, player of the match, awards, lineup, roster, or player availability only when official or otherwise verified by an allowed source.

If fine-grained game/period detail is not available from verified sources, write only the verified total score and state that detailed breakdown is not confirmed.

## Event Key And Deduplication

- Use official match ID when available.
- If official match ID is unavailable, use normalized tournament, teams, kickoff/event time, and state.
- Do not treat the same `sourceUrl` as a duplicate by itself. Official stage, standings, match center, or schedule pages often contain multiple matches.
- Same teams and same kickoff can still have separate state keys for `match_schedule`, `match_flow`, and `match_result`.
- A result feed is duplicate only when tournament, official match ID or teams plus event time, state, and final score all match an existing feed.
- A bracket/path update is duplicate only when the same advancement, elimination, next opponent, or path relationship already exists.

Do not skip a verified match update only because:

- the same `sourceUrl` already exists.
- a previous state exists for the same teams.
- the same stage or schedule page contains multiple matches.
- the same tournament day already produced another feed.
- the ordinary per-topic item limit has already been reached.

## Source Rules

- Hard facts must come from official schedule, official match center, official results, official standings/stage pages, official embedded match data, official statements, or an allowed authoritative reporting source for that topic.
- Community and Chinese sports/esports sites may supplement player evaluation, local context, fan reaction, discussion heat, social mood, or poster atmosphere.
- Community discussion, comments, hot takes, and social reactions cannot override score, schedule, winner, match status, advancement, lineup, roster, or next-round relationships.
- If official pages are dynamic, inspect embedded official data before skipping. Do not rely only on the page title, meta description, old feed text, or visible shell content.
- If official and authoritative sources conflict on score, kickoff, match status, winner, roster, or bracket relationship, skip until it can be resolved.

## Body Format

- First paragraph: verified status, fixture, time, score, state, official fact, or key match event.
- Second paragraph: stage, next match, next round, group/bracket relation, advancement, elimination, current confirmation scope, or pending detail.
- Optional third paragraph: fact conflict, unavailable fine detail, postponed/cancelled/remake context, or verified scheduling caveat.
- No prediction, hype, unsourced lineup, emotional win/loss judgement, or template/prompt residue.

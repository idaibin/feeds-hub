# Sports Bracket Poster Profile

适用：整体晋级图、淘汰赛路径图、上下半区对阵图、多场比赛进度汇总、决赛路径展示。

```yaml
profile: sports_bracket
ratio: 16:9
layout: bracket
focus: bracket
maxLines: 2
```

Prompt：

```text
Create a 16:9 landscape sports bracket poster. This is a tournament route graphic, not a single-match preview, single-match result card, or generic news cover.

Goal:
- Present the bracket / tournament route as a professional broadcast graphic.
- Make the stage, matchups, scores, winners, advancement paths, next round, final, or champion slot easy to read.
- Highlight completed matches with scores and advancing teams. Show unstarted or undecided matches with the provided placeholder text, such as `待定`, `TBD`, or `?`.
- Single elimination, double elimination, upper/lower halves, and multi-stage routes must be shown as a structured bracket, not as a plain list.
- The event name, stage, key matchups, and advancement direction must remain legible when the image is scaled down.

Must show:
- event.name
- event.stage
- event.status or subtitle, if provided
- matchups, status, scores, and winners from matches
- advancement direction from paths / bracket
- next round, semifinal, final, grand final, or champion slot
- format, eventAt, or stageDates, if provided
- sourceName, if provided

Structure:
- Use a restrained title area for event.name and stage details; do not let it overpower the bracket.
- Use horizontal sections, match cards, connectors, and arrows to show advancement.
- For double elimination, separate winner bracket and loser bracket paths and merge them into the grand final.
- For upper/lower halves, separate the regions clearly and use distinct path colors.
- Each match card should show round label, teams, score or VS, status, and advancement marker.
- A small footer may show format, dates, legend, and source.

Visual direction:
- Decide the visual style from the event type, stage, venue context, team/nation colors, and socialMood; readability comes first.
- Use a sports stadium, arena, esports stage, broadcast package, event color system, team colors, nation color blocks, or stage atmosphere when relevant.
- The background must support the information. Do not let it obscure titles, scores, matchups, or path lines.
- Use a clear bracket grid, status labels, path lines, section headers, and readable compact score cards.
- The final or champion slot may use a gold accent. Upper/winner and lower/loser paths should use distinct colors.
- For World Cup style events, use stadium lighting, nation color blocks, and advancement routes. For LOL/MSI style events, use esports stage cues, team colors, red/blue paths, and BO5 markers.
- If real logos, flags, or crests are not provided, use plain text labels, neutral badges, abstract color blocks, or short names only. Do not draw flags, crests, emblems, sponsor marks, or logo-like graphics unless provided as input assets.

Fact boundary:
- Scores, schedules, winners, advancement, lineups, and next-round relationships must come from official schedules, official match centers, official results, or authoritative wire sources.
- Hupu, X, Reddit, and other community sources may only inform player evaluation, user sentiment, discussion heat, market attention, and visual mood.
- All readable text must come from input fields or direct summaries of input fields. Use `待定`, `TBD`, or `?` for missing information.

Do not:
- Do not focus on only one match.
- Do not use a 4:5 single-match card layout.
- Do not turn the bracket into a plain list.
- Do not show prompt metadata such as `16:9`, `profile`, `ratio`, `layout`, `focus`, `maxLines`, `keywords`, generation notes, template labels, or placeholder module text.
- Do not omit advancement lines, the final, or the champion target.
- Do not show unstarted matches as finished, or replace placeholder teams with guessed names.
- Do not invent teams, scores, winners, advancement paths, dates, times, logos, sponsors, or sources.
- Do not treat social sentiment or community evaluation as match facts.
```

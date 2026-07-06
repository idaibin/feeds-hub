# Sports Card Poster Profile

适用：单场赛程、单场前瞻、单场进度、单场结果、足球赛果、LOL BO5 赛果。

```yaml
profile: sports_card
ratio: 4:5
layout: scoreboard
focus: result
maxLines: 2
```

Prompt：

```text
Create a 4:5 vertical sports match poster for reusable event distribution. This is a single-match sports card, not a full bracket, generic news cover, or oversized title poster.

Supported modes:
- scheduled: tomorrow's match / pre-match notice
- live: match in progress
- final: match result

Goal:
- Build a professional broadcast-style sports card with clear hierarchy and social-media readability.
- Show the matchup, status, time or score, stage, and key event details at a glance.
- Let event type, teams, match state, venue context, and socialMood decide the visual style and color palette.
- Use atmosphere to support the data. Do not let text overpower the image.
- The poster must work for football, World Cup style events, LOL/MSI esports BO5, basketball, tennis, and similar single-match events.

Layout:
- Top area: compact event name, status label, and stage. Keep the title small and controlled.
- Middle area: two-team matchup structure with team names, short names, neutral badges/color blocks, and VS or score as the visual core.
- Bottom area: time, date, venue/region, format, goals, game results, MVP, key events, or next-round note when provided.
- Keep generous margins. Do not let team names, score, time, or status overlap.

Must show:
- event.name
- event.stage
- event.status
- teams
- eventAt, time, or live/final status when provided
- VS for scheduled matches, current score for live matches, final score for final matches
- sourceName, if provided

Mode-specific content:
- scheduled: show match time/date, stage, venue or region, format such as BO5, and 2-3 short preview points if provided.
- live: show current score, live minute or current game, live status, football goal timeline, or BO5 game state if provided.
- final: show final score, winner, advancement/result note, football goals, BO5 game-by-game results, MVP, player of the match, or next-round info if provided.

Typography:
- Use modern sports broadcast typography. Chinese text should be short, accurate, and readable.
- The event name and status title should occupy only a small top band, roughly 8%-12% of poster height.
- VS or score is the visual core, but keep it controlled, roughly 14%-20% of poster height.
- Team names, time, stage, game results, goals, and key events should use medium or small text.
- Do not create huge labels such as `明日赛程`, `进行中`, or `比赛结束` that dominate the poster.

Visual direction:
- Football / World Cup: stadium lighting, pitch texture, stands, trophy atmosphere, nation color blocks, and focused match tension.
- Esports / LOL MSI: esports stage lighting, arena screens, restrained energy glow, broadcast HUD, trophy atmosphere, and team colors.
- Basketball / tennis / other sports: use relevant venue lighting, court texture, scoreboard cues, and match atmosphere.
- Scheduled mode should feel calm and anticipatory. Live mode should feel tense and real-time. Final mode should reflect the result: celebration, upset, close win, or regret based on socialMood.
- Use cinematic lighting, broadcast graphics, readable panels, and balanced typography. Avoid low-quality template aesthetics.
- Real national flags, association crests, club/team logos, player portraits, player names, and star-player focus are allowed only when they are directly provided as input assets or verified from official match centers, official team/league pages, official broadcast assets, or authoritative wire/photo sources.
- If a logo, crest, flag, portrait, player identity, lineup, goal scorer, card, penalty, MVP, or sponsor mark cannot be verified from those sources, use plain text labels, neutral badges, abstract color blocks, or short names only. Do not invent logo-like graphics, portraits, sponsors, scorer names, or player details.

Fact boundary:
- Scores, schedules, winners, advancement, lineups, goals, cards, penalties, BO5 game results, MVP, player portraits, team logos, national flags, crests, and live status must come from official schedules, official match centers, official results, official visual assets, or authoritative wire/photo sources.
- Hupu, X, Reddit, and other community sources may only inform player evaluation, user sentiment, discussion heat, market attention, and visual mood.
- All readable text must come from input fields or direct summaries of input fields. Missing information must stay blank or use provided placeholders.

Do not:
- Do not use 16:9, horizontal layout, collage grids, or full bracket routes.
- Do not make the title larger than the matchup or score.
- Do not fill the poster with text or meaningless microcopy.
- Do not show prompt metadata such as `4:5`, `profile`, `ratio`, `layout`, `focus`, `maxLines`, `keywords`, generation notes, template labels, or placeholder module text.
- Do not generate fake Chinese, garbled text, repeated text, or mixed Chinese/English clutter.
- Do not invent or alter scores, teams, times, goals, cards, penalties, BO5 games, MVP, winners, player identities, portraits, logos, flags, crests, sponsors, or sources.
- Do not omit football goal records or BO5 game-by-game results when they are provided.
- Do not turn a scheduled match into a result poster, or a live match into a final result poster.
- Do not let glow, background, names, score, time, or panels obscure one another.
- Do not treat social sentiment or community evaluation as match facts.
```

# Default Poster Profile

适用：常规新闻、AI 新闻、股市信息、开发圈新闻、政策信息、综合资讯、普通快报、数据摘要。

```yaml
profile: default
ratio: 16:9
layout: hero
focus: headline
maxLines: 2
```

Prompt:

```text
Create a 16:9 landscape feed poster for a general news or information update.

This is the default poster profile for non-sports content. It should look like a polished editorial feed cover, not a match card, scoreboard, bracket, or event schedule.

Supported topics:
- AI and model releases
- product and company updates
- policy and regulation
- developer ecosystem news
- stock and market briefs
- global news and data summaries

Goal:
- Make the headline the visual center, limited to 1-2 lines.
- Keep the subtitle, summary, and key points easy to scan at feed-card size.
- Prioritize verified information over decoration.
- Build a reusable premium news template rather than a one-off art poster.

Must show:
- `title`
- `subtitle` or one compact `summary`
- 2-4 short `bullets`
- `sourceName` when provided
- topic/category label when useful

Layout:
- Use a clear 16:9 horizontal composition with generous margins.
- Place a small source or topic label near the top.
- Use the headline as the dominant text block, but avoid full-poster typography.
- Place the subtitle or summary directly below the headline.
- Use 2-4 compact information modules along the lower band or side rail.
- Each module may use a simple icon, short label, and one-line detail.

Visual direction:
- Choose the visual style from the topic, event type, source context, and `socialMood`.
- AI/model news may use clean interface layers, code texture, chips, networks, lab light, or product UI abstraction.
- Markets may use restrained charts, trading screens, macro data panels, city finance imagery, or calendar cues.
- Policy/global news may use press-room, document, institution, map, city, or newsroom cues.
- Product/developer news may use software UI panels, release notes, terminal/code motifs, or device silhouettes.
- Use cinematic but readable lighting, modern editorial typography, and controlled contrast.
- Color should support the mood: calm, optimistic, tense, controversial, cautious, or market-moving. Do not force every poster into a dark blue tech style.
- Use Chinese typography cleanly when Chinese text is provided; avoid fake small text and unreadable microcopy.

Fact boundary:
- Hard facts must come from the structured input and verified sources.
- Reddit, X, Hupu, and other community sources may only inform reaction, acceptance, optimism/pessimism, user sentiment, background context, and market mood.
- Do not turn community reaction into model capability, policy fact, price, release date, official position, or financial fact.
- Do not quote community text unless the exact display quote is explicitly provided.

Do not:
- Do not use sports visuals such as scoreboards, VS layouts, brackets, fixtures, trophies, stadiums, esports stages, team crests, or flags.
- Do not invent facts, numbers, organizations, people, source names, charts, or metrics.
- Do not use huge title text that overwhelms all other information.
- Do not fill the poster with dense text, fake UI labels, or decorative microcopy.
- Do not show prompt metadata such as `profile`, `ratio`, `layout`, `focus`, `maxLines`, `keywords`, generation notes, template labels, or placeholder module text.
- Do not make the background compete with the headline and key points.
- Do not use 4:5, vertical layout, collage grids, or social screenshot styling.
```

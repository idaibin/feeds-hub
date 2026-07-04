# Player Spotlight Poster

## ID

`player_spotlight`

## Ratio

`4:5`

## Use

单一球员、选手、人物、创始人、研究者、维护者或操盘者焦点。

## Dynamic Inputs

Required when available:

- `personName`
- `storyAngle`
- `topicContext`

Optional:

- `team`
- `role`
- `position`
- `organization`
- `tournament`
- `stage`
- `relatedEvent`
- `verifiedStat`
- `quoteLabel`

Do not render:

- unverified quote text
- `sourceUrl`
- internal IDs
- private personal details

## Poster DSL Defaults

```yaml
ratio: 4:5
layout: poster
focus: player
maxLines: 2
```

## Prompt

```text
Use a single-person spotlight composition with one dominant subject, strong editorial hierarchy, and contextual background from the topic.
The subject should be a generic illustrated or cinematic figure, not a copied real face or official portrait.
Use lighting, posture, environment, and supporting symbolic panels to communicate the verified story angle.
Keep the poster focused, premium, and image-led, with a clear top zone and dominant middle focal point.
```

## Text Rules

```text
Only include verified person name, team, role, position, organization, tournament, stage, story angle, related event, or verified stat supplied by the feed.
Keep readable text short. Do not render quotes unless the exact quote is supplied and allowed by the feed.
```

## Negative Constraints

```text
No copied real faces, official portraits, team badges, champion art, mascot-style imitation, fake quotes, invented stats, or personal details not present in the feed.
No source badges, watermarks, official logos, or unsupported readable text.
```

# Breaking Poster

## ID

`breaking`

## Ratio

`16:9`

## Use

已确认的突发重大变化、快速更新的重大事件、即时公共影响事件。

## Dynamic Inputs

Required when available:

- `eventTitle`
- `status`
- `locationOrEntity`
- `eventTime`

Optional:

- `institutionName`
- `affectedArea`
- `confirmedFact`
- `updateLabel`
- `severityLabel`
- `nextStep`
- `publicImpact`

Do not render:

- casualty counts unless verified and necessary
- graphic injury details
- source URLs
- speculation

## Poster DSL Defaults

```yaml
ratio: 16:9
layout: hero
focus: title
maxLines: 2
```

## Prompt

```text
Use a direct, high-clarity news scene with visible urgency but no sensational visual panic.
Show one confirmed event with a clear focal point, restrained alert energy, and abstract secondary details for uncertainty.
Use the topic environment to define whether the event is global news, market movement, product incident, sports update, technology outage, or policy change.
Prioritize clarity, restraint, and factual tone.
```

## Text Rules

```text
Only include verified event title, status, location or entity, event time, institution, affected area, update label, or confirmed fact supplied by the feed.
Do not render details that are uncertain, sensitive, graphic, or not needed for the cover.
```

## Negative Constraints

```text
No sensational disaster imagery, gore, panic scenes, fake emergency badges, fake source marks, invented casualties, fake numbers, speculation, or unsupported readable text.
No clickbait typography, watermarks, or official seals.
```

# Hot Topic Poster

## ID

`hot_topic`

## Ratio

`16:9`

## Use

单一热点事件、发布、争议、产品动作、公司动态、开源事件或高关注焦点。

## Dynamic Inputs

Required when available:

- `entityName`
- `eventTitle`
- `keyFact`

Optional:

- `companyName`
- `productName`
- `projectName`
- `modelName`
- `version`
- `eventDate`
- `sector`
- `topicAngle`
- `impactScope`

Do not render:

- rumor labels
- source URLs
- internal IDs
- unsupported claims

## Poster DSL Defaults

```yaml
ratio: 16:9
layout: hero
focus: title
maxLines: 2
```

## Prompt

```text
Use a focused editorial scene with one clear subject, current attention, and restrained urgency.
The image should communicate one bounded verified event rather than a broad collage.
Use the topic environment to define the visual world, such as product launch, research desk, developer workflow, market room, sports venue, or global-news setting.
Keep the focal point strong and avoid overloading the image with multiple unrelated signals.
```

## Text Rules

```text
Only include verified entity names, company names, product names, project names, model names, versions, dates, sector labels, or short factual labels supplied by the feed.
If the event is not fully confirmed, do not render decisive claims in the image.
```

## Negative Constraints

```text
No collage-like multi-topic composition, fake logos, fake UI, fake charts, fake numbers, invented claims, hype slogans, rumor framing, or unsupported readable text.
No source badges, watermarks, or clickbait visual panic.
```

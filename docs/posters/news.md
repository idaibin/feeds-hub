# News Poster

## ID

`news`

## Ratio

`16:9`

## Use

默认新闻、普通资讯、单一已验证事件、无法归入更具体类型的内容。

## Dynamic Inputs

Required when available:

- `eventTitle`
- `mainSubject`
- `keyFact`

Optional:

- `entityName`
- `location`
- `eventDate`
- `organization`
- `sector`
- `summaryAngle`
- `contextLabel`

Do not render:

- source URLs
- internal IDs
- long summary text
- unsupported analysis

## Poster DSL Defaults

```yaml
ratio: 16:9
layout: hero
focus: title
maxLines: 2
```

## Prompt

```text
Use a clean editorial news cover with one main subject, relevant environment, and restrained visual context.
Show one verified event clearly, with a readable central subject and supporting atmosphere from the topic.
Keep the composition mobile-first, premium, and not overly decorative.
Use this as the fallback when a more specific poster type does not fit.
```

## Text Rules

```text
Only include verified event title, main subject, entity name, organization, location, date, sector, or short context label supplied by the feed.
Keep readable text minimal and no more than two short lines unless the feed supplies structured labels.
```

## Negative Constraints

```text
No multi-event collage, fake logos, fake source badges, fake dates, fake charts, fake UI, invented claims, unsupported readable text, or sensational framing.
No watermarks or decorative category labels inside the image.
```

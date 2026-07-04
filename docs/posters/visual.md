# Visual Poster

## ID

`visual`

## Ratio

`4:5`

## Use

图片主导专题、强视觉封面、视觉化产品细节、人物或场景驱动的专题，不作为默认 fallback。

## Dynamic Inputs

Required when available:

- `visualTitle`
- `mainSubject`
- `visualAngle`

Optional:

- `entityName`
- `location`
- `eventDate`
- `productName`
- `personName`
- `sceneContext`
- `mood`
- `supportingFact`
- `captionLabel`

Do not render:

- long body text
- source URLs
- unsupported claims
- private personal details

## Poster DSL Defaults

```yaml
ratio: 4:5
layout: poster
focus: title
maxLines: 2
```

## Prompt

```text
Use a high-quality editorial visual poster with stronger visual hierarchy than normal news.
Make the image-led subject dominant, with a clear top zone, strong middle focal point, and structured lower information area.
Use cinematic lighting, realistic depth, premium texture, and restrained supporting details.
Only use this when the feed is intended to be image-led or visually distinctive.
```

## Text Rules

```text
Only include verified visual title, main subject, entity name, location, date, product name, person name, scene context, mood label, supporting fact, or short caption supplied by the feed.
Keep text minimal and do not turn the image into a text poster.
```

## Negative Constraints

```text
No generic stock poster layout, copied portraits, fake logos, fake UI, fake source badges, invented claims, private details, dense text blocks, or unrelated decorative collage.
No watermarks, category labels, or unsupported readable text.
```

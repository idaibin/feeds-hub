# Global Poster Prompt

## Category

`global`

## 主题特色

全球重点主题应突出严肃新闻、地点、机构、公共影响和事件现场感。画面要克制、可信、新闻化，避免娱乐化、灾难消费或情绪煽动。

## 尺寸规则

按 `docs/posters/type-matrix.md` 推导比例：

| kind | ratio | size | 用途 |
|---|---:|---:|---|
| `news` / `breaking` / `insight` / `hot_topic` / `policy_update` | `16:9` | `1600x900` | 默认全球新闻封面 |
| `data` | `4:3` | `1600x1200` | 地图、流程、机构结构图 |
| `visual` | `16:9` | `1600x900` | 严肃新闻专题视觉，少用 |

禁止使用 `1:1`。

## 话题线索

适合表达：

- 政策、外交、法院、监管、央行、国际组织
- 公共安全、社会事件、气候、经济、供应链
- 跨国影响的科技、能源、贸易、公共卫生事件
- 官方决定、报告发布、重大会议、现场状态

不适合把严肃议题做成综艺感、阴谋感或夸张灾难片风格。

## 热度表达

- `low`：政策跟踪、报告发布，机构建筑、文件、地图线索。
- `medium`：重要决定、国际会议，新闻现场、媒体区、代表席、城市环境。
- `high`：重大突发、广泛影响，强新闻现场感、警戒线、应急灯光、公众关注，但保持克制。

热度只表达公共关注程度，不放大伤害或制造未确认冲突。

## 风格提示词

```text
Create a serious global news editorial cover.
Show a credible location-based or institution-based scene: government building, international conference hall, city street context, newsroom map, press area, document desk, or public infrastructure.
Use restrained documentary lighting, neutral colors, and clear composition.
The image should express public importance, uncertainty, and institutional context without sensationalism.
For policy updates, emphasize formal decision-making and documents.
For hot topics, emphasize location, public impact, and current attention.
```

## Kind 适配

### `policy_update`

```text
Use a 16:9 formal institution, public document, meeting room, court, regulator, or conference atmosphere.
Do not render official seals, readable policy numbers, fake signatures, or fake quotes.
```

### `hot_topic`

```text
Use a 16:9 grounded scene tied to the event type: city, infrastructure, conference, public service, newsroom, or map context.
Avoid spectacle and unrelated symbols.
```

### `data`

```text
Use a 4:3 structured global news data cover, 1600x1200 WebP.
Show map context, institutional process, supply-chain path, public infrastructure diagram, or timeline.
Do not invent numbers, borders, flags, or official documents.
```

## 负面约束

```text
No 1:1 feed cover.
No reusable generic global-news template applied to multiple unrelated feeds.
No graphic harm, no disaster exploitation, no conflict-glorifying imagery.
No fake flags as propaganda, no official seals, no readable government documents, no fake quotes.
No entertainment poster style, no conspiracy-board visuals, no exaggerated apocalypse tone.
No stereotypes of countries, regions, religions, or ethnic groups.
No top-left Feeds Hub logo, Feeds Hub wordmark, or Feeds Hub brand badge.
No top-right theme label, category tag, source tag, or status pill.
```

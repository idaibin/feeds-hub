# AI Poster Prompt

## Category

`ai`

## 主题特色

AI 主题应突出模型发布、研究进展、产品更新、开发者工具、算力基础设施、政策与安全讨论。画面应偏科技新闻视觉，避免玄幻化、过度机器人化或夸大能力。

## 尺寸规则

按 `docs/posters/type-matrix.md` 推导比例：

| kind | ratio | size | 用途 |
|---|---:|---:|---|
| `news` / `breaking` / `insight` / `ai` / `hot_topic` / `policy_update` | `16:9` | `1600x900` | 默认 AI 新闻封面 |
| `data` | `4:3` | `1600x1200` | benchmark、架构、生态数据，禁止可读假数值 |
| `visual` | `4:5` | `1440x1800` | 专题视觉图，少用 |

禁止使用 `1:1`。

## 话题线索

适合表达：

- 模型发布、模型卡、评测、能力边界
- 研究论文、开源模型、框架、工具链
- AI 产品发布、开发者平台、API、Agent、IDE
- 算力、芯片、数据中心、基础设施
- 政策、安全、标准、治理、企业战略

不适合用一个抽象机器人覆盖所有 AI 新闻。

## 热度表达

- `low`：工具更新、论文进展，清晰终端、研究图、代码界面。
- `medium`：产品发布、模型更新，发光界面、数据流、开发者场景。
- `high`：重大模型、监管、安全事件，强中心光源、基础设施尺度、公共关注感。

热度只表达关注度，不夸大能力或制造“通用智能已实现”的暗示。

## 风格提示词

```text
Create an editorial AI technology news cover.
Show a modern developer or research environment, abstract neural network structure, model interface, code terminal, data center, chip substrate, or product launch scene.
Use precise, clean, high-tech visual language with blue, graphite, white, and subtle luminous accents.
For model releases, emphasize model architecture, evaluation, interface, or infrastructure.
For research, emphasize paper, diagram, lab notebook, benchmark chart, or code repository mood.
For policy and safety, emphasize formal review, governance documents, institutional context, and responsible AI tone.
```

## Kind 适配

### `hot_topic`

```text
Use a 16:9 launch momentum, developer adoption, research attention, or ecosystem impact composition.
Represent companies and models through abstract product surfaces, not fake logos or fake UI text.
```

### `policy_update`

```text
Use a 16:9 standards, governance, audit, safety review, or institutional meeting atmosphere.
Keep the tone credible and restrained.
```

### `data`

```text
Use a 4:3 structured AI data cover, 1600x1200 WebP.
Show benchmark panels, architecture blocks, model evaluation workflow, infrastructure map, or ecosystem comparison.
Keep numbers and labels symbolic unless exact facts are supplied by the feed.
```

### `visual`

```text
Use a 4:5 premium AI editorial visual, 1440x1800 WebP.
Use only for image-led AI features or topic cards, not as default news fallback.
```

## 负面约束

```text
No 1:1 feed cover.
No reusable generic AI template applied to multiple unrelated feeds.
No fake OpenAI, Google, Anthropic, Meta, xAI, Nvidia, or GitHub logos.
No readable benchmark numbers, fake model names, fake company names, fake API screenshots, or fake paper titles.
No Feeds Hub logo, Feeds Hub wordmark, watermark, category tag, topic tag, source tag, or status pill inside the image; the feed card already shows metadata below the image.
No top-left Feeds Hub logo or Feeds Hub brand badge. No top-right AI theme label, category tag, topic tag, source tag, or status pill.
No sci-fi robot domination, brain-in-a-jar cliché, magic aura, or AGI hype imagery.
No copied product UI or copyrighted interface.
```

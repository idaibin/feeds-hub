# Content Format

Feed 内容只追求可核验、去重表达和正文完整。

## Frontmatter

必须符合 `src/content.config.ts`。核心字段：

- `title`: 核心事实，不塞来源名。
- `subtitle`: 补范围、状态或时间；雷同则删。
- `summary`: 只写标题未覆盖的重要信息；无补充可留短。
- `category`: topic id。
- `kind`: topic `allowedKinds` 内的类型。
- `eventAt`: 事件发生或官方确认时间。
- `eventKey`: 可稳定去重的事件键。
- `source`: 发布方短名，如 `Reuters`、`FIFA`、`LoL Esports`、`GitHub`。
- `sourceUrl`: 具体可核验 URL。
- `coverStatus`: 固定 `pending`。

## 正文

- 默认 3-5 段自然段。
- 第一段：已核验事实。
- 第二段：状态、影响、下一步、赛程节点或市场驱动。
- 第三段：背景、时间线、关键数据、限制或未确认范围。
- 只在来源提供更多事实时写第四、第五段。

禁止：

- 标题党、预测、投资建议、赛事预测。
- 无来源扩写、社交热度当事实。
- `## 关键信息`、`## 视觉重点`、prompt 字段、YAML/JSON 字段名。

## 非重复

生成后检查 title、subtitle、summary、正文首段：

- 标题写主体 + 动作/状态/结果。
- summary 写标题没有的信息。
- subtitle 只补状态/范围/时间。
- 第一段必须加入时间、状态、范围、数据、比分、影响或下一节点之一。
- 首段不得只是标题换词扩写。

展示层可隐藏和标题雷同、太短或无信息量的 summary。

## 去重

检查 `eventKey`、`sourceUrl`、同一事件事实。只有状态实质变化才新增，例如 schedule -> result、proposal -> decision、RC -> stable。

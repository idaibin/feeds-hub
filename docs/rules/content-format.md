# Content Format

本文件定义 feed Markdown 的 frontmatter、标题、摘要和正文。海报字段与图片文件关系看 `docs/posters/README.md`，具体 prompt profile 看 `docs/posters/<profile>.md`；任务写入、分支和合并流程看 `docs/automation/feeds-hub-update.md`。

## Principles

- 1 feed = 1 event。
- 只写已核验来源支持的事实。
- 明确主体、动作、时间和状态；来源只写入 frontmatter，并由详情页底部统一展示。
- 用 `eventKey` 去重；同一事件的新状态必须能和旧状态区分。
- 不完整事实用低确定性表达。
- 正文优先 3 到 5 段；正文是面向读者的自然段，不写模板痕迹。来源提供更多可核验事实时，应补足背景、时间线、上下文、下一步和限制条件，而不是用短摘要替代正文。
- 标题、summary、subtitle 和正文首段必须承担不同信息，不得高度相似或换词复述。

禁止：

- 观点化、预测化、标题党。
- “重磅”“史诗级”“影响深远”“这意味着”等判断。
- 投资建议、赛事预测、产品成功判断。
- 把社交热度当事实。
- 多个事件拼成一条。
- 标题、subtitle、summary 或正文出现 `Reuters 报道称`、`官方公告显示`、`来源称`、媒体名、平台名等来源前缀。
- summary 复述 title 的完整句子。
- summary、subtitle 或正文首段与 title 高度相似、只是改写标题、只增加来源前缀或只替换少量词。
- `returns`、prompt 字段名、YAML/JSON 字段名、`## 关键信息`、`## 视觉重点` 或生成说明出现在正文里。

## Frontmatter

必须符合 `src/content.config.ts`。

- `date`：写入时间。
- `eventAt`：来源标注的事件时间或新闻发布时间；新增内容优先 UTC ISO datetime（`Z` 后缀），页面按 `Asia/Shanghai` 渲染。
- `eventKey`：稳定去重键。
- `source`：只写实际发布方短名，例如 `Reuters`、`FIFA`、`LoL Esports`、`GosuGamers`、`Games of Legends`、`Al Jazeera`；不要把赛事名、专题名、页面类型或多个来源拼进显示名。
- `sourceUrl`：公开、可核验的具体来源 URL。
- `coverStatus`：`generated_webp` 或 `pending`。
- `cover`：站点路径，规则见 `docs/posters/README.md`。

## Title

只写核心事实。

```text
主体 + 动作 / 状态 / 结果
```

示例：

```text
OpenAI 发布新模型接口更新
Rust 项目发布 1.x 版本
某指数收盘上涨，芯片板块走强
某队晋级下一轮
```

## Subtitle

补充范围、时间或状态，不写判断，不写来源。

```text
该更新已面向开发者开放
相关决定仍待正式文件确认
比赛结束后，官方赛程显示下一轮对阵已确定
```

## Summary

一句话说明事实和当前状态，优先不超过 80 个中文字符。股市内容可以加入市场情绪。

如果没有标题之外的重要信息，summary 应留给展示层过滤，不要为了展示而改写标题。

```text
该项目发布新版本，更新范围包括 CLI、配置和文档。
相关政策仍在讨论阶段，正式文件尚未公布。
A 股收盘分化，芯片板块偏热，地产和消费板块偏冷。
```

## Body

默认 3 到 5 段，直接写自然段：

```text
第一段：事实。
第二段：当前状态、赛程节点、市场状态、影响范围或可确认范围。
第三段：来源中可核验的背景、时间线、关键数据、下一步或限制条件。
```

必要时第 4 到 5 段写来源差异、尚未确认信息、已排期节点或关键背景；不得为了凑长度编造事实。

标题、subtitle、summary 和正文不得互相复制整句。summary 只补充标题未写出的状态、范围、影响或下一节点；正文第一段不得把标题原句扩写成重复开头。

生成后必须做重复检查：

- `summary` 与 `title` 高度相似时，删除或改写 summary，只保留真正补充信息。
- `subtitle` 与 `title` 或 `summary` 高度相似时，删除或改写 subtitle。
- 正文第一段与 `title` 高度相似时，正文第一段必须改成更完整的事实句，加入时间、状态、范围、数据或下一节点；无法补充时删除重复表达。
- 列表页只展示标题和非重复 summary；summary 为空、过短或与标题雷同时，列表页只展示标题。

长度建议：

- 每段 1 到 2 句。
- 单条正文建议控制在 220 到 520 个中文字符；短讯可少于 220 字，但不能遗漏来源已给出的关键事实。
- 长背景、深度分析和观点内容放到 blog，不放到 feed。

## Type Rules

分类正文规则不写在本文。执行者必须先读取 topic frontmatter 的 `flows`，再按对应信息类型读取：

- `docs/types/realtime.md`
- `docs/types/scheduled-market.md`
- `docs/types/sports.md`

本文只定义 feed Markdown 的通用结构、字段、长度和禁止项。

## Uncertainty

可写：

```text
目前官方文件尚未公布。
该信息来自媒体报道，仍需等待官方确认。
公开页面尚未显示完整范围。
不同来源对时间表表述不一致。
```

禁写：

```text
基本可以确定。
大概率会发生。
很可能带来巨大变化。
```

## Frontmatter Linkage

- `title` 写核心事实。
- `subtitle` 写状态或范围，不写来源。
- `summary` 写一句补充事实，不重复标题，不写来源。
- `priority` 只用于排序。
- `tags` 只保留实体、主题和类型，不写情绪标签。

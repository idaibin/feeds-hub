# Feeds Hub 更新任务说明

## 任务目的

`feeds-hub-update` 用于生成 Feeds Hub 的短周期信息流内容。

它只负责串联流程：

```text
topic => card type => feed markdown + cover image
```

本文件不定义内容格式、主题规则、来源策略、海报细节或 UI 规则；这些规则分别由对应文档维护。

## 输入

执行者每次运行必须先读取：

- `docs/topics/README.md`：获取本轮需要遍历的全部主题。

然后按主题读取：

- `docs/topics/<category>.md`：确定主题范围、可用类型、可选信息来源、标题倾向、可选主题海报提示词和跳过条件。
- `docs/card-types/README.md`：根据信息内容选择 `kind`、图片比例、尺寸和通用海报类型提示词。
- `docs/rules/content-format.md`：生成标题、副标题、摘要和正文。
- `docs/rules/ui-spec.md`：确认 card、图片比例和 `cover` 渲染约束。

## 输出

每条有效信息输出两类文件：

```text
src/content/<category>/<yyyy-mm-dd>-<slug>.md
public/images/<category>/<yyyy-mm-dd>-<slug>.<webp|png|svg>
```

Markdown frontmatter 的字段以 `src/content.config.ts` 为准，`cover` 必须指向实际写入的图片文件：

```text
/images/<category>/<yyyy-mm-dd>-<slug>.<webp|png|svg>
```

如果目标主题的内容目录或图片目录不存在，执行者可以按上述路径自行创建。

## 封面格式优先级

封面格式按以下顺序选择：

1. `webp`：优先使用高质量、高尺寸 WebP 主封面。
2. `png`：当 WebP 无法生成、无法导出或质量不达标时使用。
3. `svg`：当 WebP 和 PNG 都不可用时使用；必须是当前 feed 专属的事件化视觉，不得是通用模板、空白占位或无关装饰图。

无论采用哪种格式，图片比例、尺寸、视觉质量和事件相关性仍必须符合 `docs/card-types/README.md` 与 `docs/rules/ui-spec.md`。

## 提交信息

自动内容更新提交信息默认使用运行整点区分，方便检查哪个时间点没有数据。格式为：

```text
content: update feeds <YYYYMMDD-HH>
```

示例：

```text
content: update feeds 20260704-10
content: update feeds 20260704-11
```

如果同一整点内需要多次内容更新，可以追加批次号：

```text
content: update feeds <YYYYMMDD-HH>-<no>
```

示例：

```text
content: update feeds 20260704-10-2
```

同一轮遍历多个主题生成的内容合并为一个内容更新提交。`HH` 使用 24 小时制，按执行时本地时间取整点。

## 流程

1. 读取 `docs/topics/README.md`，得到本轮全部主题列表。
2. 按主题列表逐个遍历 `docs/topics/<category>.md`。
3. 对每个主题独立获取并核验公开信息；topic 指定信息来源时优先采用，未指定时自行搜索可核验来源。
4. 对每个主题独立判断是否值得写入；不满足 topic 条件则跳过该主题。
5. 对每条有效信息根据信息内容选择 card type。
6. 按正文格式文档生成 Markdown 内容。
7. 组合 card type 提示词、topic 额外海报提示词和事件事实，按封面格式优先级生成主封面。
8. 写入 Markdown 和图片文件，并让 `cover` 指向实际图片路径。

## 边界

- 一条 feed 只表达一个事件。
- 没有可核验来源时跳过。
- 没有合规独立主封面图片时跳过。
- 不得仅因 WebP 不可用而跳过；PNG 或 SVG 合规时可以继续写入。
- 不在本文件重复 topic、card type、正文格式、frontmatter schema 或 UI 细节。

# Topics

主题文档只写主题差异：写什么、用哪些来源、允许哪些 `kind`、标题/eventKey 怎么定、何时跳过、是否有额外海报气质。

通用规则：

- 默认控制在 8-10 个活跃主题，避免来源、去重和生成频率失控。
- `kind` 选择、单类海报提示词、海报生成和写入看 `docs/posters/`。
- 正文格式看 `docs/rules/content-format.md`。
- 自动更新必须遍历下方全部主题；每个主题独立判断，没有合格信息就跳过。
- 来源优先级固定为 `Primary > Secondary > CN Reference`；Primary 和 Secondary 冲突时跳过。
- CN Reference 只用于中文表达、热度参考或线索发现；除非它本身是官方中文账号或权威媒体，否则不作为唯一事实源。
- 海报只接收最终结构化 facts，不读取原始新闻正文或来源全文。

## Files

- `worldcup.md`
- `lol.md`
- `stock.md`
- `ai.md`
- `compute.md`
- `global.md`
- `rust.md`
- `dev.md`
- `security.md`
- `product.md`

## Topic File Shape

```text
ID
Focus
Kinds
Title / Event Key
Sources
Poster Prompt
Skip
```

未指定来源时，执行者自行搜索公开、可核验来源；指定来源时优先采用。

# Topics

主题文档只写主题差异：写什么、用哪些来源、允许哪些 `kind`、标题/eventKey 怎么定、何时跳过、是否有额外海报气质。

通用规则：

- `kind` 选择看 `docs/card-types/README.md`。
- 正文格式看 `docs/rules/content-format.md`。
- 海报生成和写入看 `docs/rules/poster-spec.md`。
- 自动更新必须遍历下方全部主题；每个主题独立判断，没有合格信息就跳过。

## Files

- `worldcup.md`
- `lol.md`
- `stock.md`
- `ai.md`
- `global.md`
- `rust.md`
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

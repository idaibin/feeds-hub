# Topics

主题文档只写主题差异：写什么、用哪些来源、允许哪些 `kind`、标题/eventKey 怎么定、何时跳过、是否有额外海报气质。

通用规则：

- 默认控制在 8-10 个活跃主题，避免来源、去重和生成频率失控。
- `kind` 选择、单类海报提示词、海报生成和写入看 `docs/posters/`。
- 正文格式看 `docs/rules/content-format.md`。
- 自动更新必须遍历下方全部主题；每个主题独立判断，没有合格信息就跳过。
- 默认信息源固定为 Reuters、GitHub、FIFA、LoL Esports、X、Reddit；各 topic 可保留 1-3 个主题来源。
- X / Reddit 只用于发现、热度和讨论上下文；除非讨论本身就是事件，否则不作为最终事实源。
- 最终 `sourceUrl` 优先写 Reuters、GitHub、FIFA 或 LoL Esports 中的裁决链接。
- 默认信息源和 topic 来源都无法确认时跳过，不自动扩展来源，不临时补来源。
- 海报只接收最终结构化 facts，不读取原始新闻正文或来源全文。

## Default Sources

| Source | Role |
| --- | --- |
| Reuters | markets, technology, compute, global, company and policy reporting |
| GitHub | releases, repository changes, open-source development, security advisories |
| FIFA | World Cup schedules, scores, advancement and match reports |
| LoL Esports | LoL esports schedules, scores, standings and tournament updates |
| X | discovery and discussion context only |
| Reddit | discovery and discussion context only |

## Topic Routing

| Topic | Default source |
| --- | --- |
| `worldcup` | FIFA |
| `lol` | LoL Esports |
| `stock` | Reuters |
| `ai` | Reuters, GitHub for open-source releases |
| `compute` | Reuters |
| `global` | Reuters |
| `rust` | GitHub |
| `dev` | GitHub |
| `security` | GitHub |
| `product` | Reuters, GitHub when the product event is a GitHub release or repository change |

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
